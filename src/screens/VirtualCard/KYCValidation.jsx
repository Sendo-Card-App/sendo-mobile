import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Alert,
  Platform,
  BackHandler,
} from "react-native";
import Loader from "../../components/Loader";
import { Ionicons, Feather, AntDesign } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useUpdateKycDocumentMutation } from "../../services/Kyc/kycApi"; 
import { useAppState } from '../../context/AppStateContext';

// Define camera types locally as fallback
const CameraType = {
  back: 'back',
  front: 'front'
};

const documentTypeMap = {
  ID_PROOF: "kyc.id_proof",
  ADDRESS_PROOF: "kyc.address_proof",
  NIU_PROOF: "kyc.niu_proof",
  SELFIE: "kyc.selfie",
};

const KYCValidation = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { documents } = route.params || { documents: [] };
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [visibleImages, setVisibleImages] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [cameraType, setCameraType] = useState(CameraType.back);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [cameraAvailable, setCameraAvailable] = useState(false);
  
  const [updateKycDocument] = useUpdateKycDocumentMutation();
  const { setIsPickingDocument } = useAppState();

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (visibleImages) {
        setVisibleImages(null);
        setCurrentIndex(0);
        return true;
      }
      if (cameraModalVisible) {
        setCameraModalVisible(false);
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [visibleImages, cameraModalVisible]);

  // Check permissions and camera availability
  useEffect(() => {
    let isMounted = true;

    const checkPermissions = async () => {
      try {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (isMounted) {
          setHasCameraPermission(status === 'granted');
          
          // Check camera availability by trying to get camera types
          // This is a workaround since isCameraAvailableAsync might not be available
          const cameraTypes = await ImagePicker.getCameraPermissionsAsync();
          setCameraAvailable(!!cameraTypes);
        }
      } catch (error) {
        console.error("Camera check error:", error);
        if (isMounted) {
          // Assume camera is available if we can't check
          // This is safer than assuming it's not available
          setCameraAvailable(true);
        }
      }
    };

    checkPermissions();

    return () => {
      isMounted = false;
    };
  }, []);

  // Safe document grouping with error handling
  const groupedDocs = useCallback(() => {
    try {
      if (!documents || !Array.isArray(documents)) return {};
      return documents.reduce((acc, doc) => {
        if (doc && doc.type) {
          if (!acc[doc.type]) acc[doc.type] = [];
          acc[doc.type].push(doc);
        }
        return acc;
      }, {});
    } catch (error) {
      console.error("Error grouping documents:", error);
      return {};
    }
  }, [documents]);

  const hasRejectedDoc = documents?.some((doc) => doc?.status === "REJECTED") || false;

  const kycItems = Object.keys(documentTypeMap).map((type) => {
    const docList = groupedDocs()[type] || [];
    const firstDoc = docList[0];

    let status = null;
    let statusColor = "";
    let rejectionReason = "";
    
    if (firstDoc) {
      if (firstDoc.status === "APPROVED") {
        status = t("kyc.approved");
        statusColor = "text-green-500";
      } else if (firstDoc.status === "REJECTED") {
        status = t("kyc.rejected");
        statusColor = "text-red-500";
        rejectionReason = firstDoc.rejectionReason || "";
      } else {
        status = t("kyc.pending");
        statusColor = "text-yellow-500";
      }
    }

    return {
      id: type,
      title: t(documentTypeMap[type] || type),
      status,
      statusColor,
      urls: docList.filter(doc => doc?.url).map((doc) => doc.url),
      hasDoc: !!firstDoc,
      rejected: firstDoc?.status === "REJECTED",
      rejectionReason,
      publicId: firstDoc?.publicId,
    };
  });

  const safeImagePickerOperation = async (operation, errorMessage) => {
    try {
      setIsPickingDocument(true);
      const result = await operation();
      
      // Small delay to ensure state is set
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!result.canceled && result.assets?.[0]?.uri) {
        await uploadDocument(result.assets[0].uri, selectedDocument?.publicId);
        if (cameraModalVisible) setCameraModalVisible(false);
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", errorMessage);
    } finally {
      // Ensure we always reset the picking state
      setTimeout(() => {
        setIsPickingDocument(false);
      }, 200);
    }
  };

  const takePicture = () => {
    safeImagePickerOperation(
      () => ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        exif: false,
      }),
      "Failed to take picture"
    );
  };

  const pickImage = () => {
    safeImagePickerOperation(
      () => ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
        exif: false,
      }),
      "Failed to pick image"
    );
  };

  const pickDocument = async () => {
    try {
      setIsPickingDocument(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: false,
      });

      if (result.type === "success" && result.uri) {
        await uploadDocument(result.uri, selectedDocument?.publicId);
      }
    } catch (error) {
      console.error("Document picker error:", error);
      Alert.alert("Error", "Failed to pick document");
    } finally {
      setTimeout(() => {
        setIsPickingDocument(false);
      }, 200);
    }
  };

  const uploadDocument = async (uri, publicId) => {
    if (!publicId) {
      Alert.alert("Error", "Invalid document reference");
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      
      // Safe URI handling
      let fileUri = uri;
      if (Platform.OS === "ios" && uri.startsWith('file://')) {
        fileUri = uri.replace("file://", "");
      }
      
      // Determine file type and name
      const isPDF = uri.toLowerCase().endsWith('.pdf');
      const fileType = isPDF ? 'application/pdf' : 'image/jpeg';
      const fileName = `document_${Date.now()}.${isPDF ? 'pdf' : 'jpg'}`;
      
      // Append the file to FormData
      formData.append("document", {
        uri: fileUri,
        name: fileName,
        type: fileType,
      });

      const encodedPublicId = encodeURIComponent(publicId);

      const response = await updateKycDocument({
        publicId: encodedPublicId,
        formData
      }).unwrap();

      if (response) {
        Alert.alert("Success", "Document uploaded successfully");
        navigation.goBack();
      }
    } catch (error) {
      console.error("Upload error:", error);
      const errorMessage = error?.data?.message || "Failed to upload document";
      Alert.alert("Error", errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const handleResubmit = (item) => {
    if (!item?.publicId) {
      Alert.alert("Error", "Invalid document configuration");
      return;
    }

    setSelectedDocument(item);
    
    if (item.id === "SELFIE") {
      if (hasCameraPermission === false) {
        Alert.alert(
          "Camera Permission Required", 
          "Camera permission is required for selfie verification. Please enable camera permissions in your device settings."
        );
        return;
      }
      // For selfie, we'll try to use the camera and handle errors gracefully
      setCameraModalVisible(true);
    } else if (item.id === "ADDRESS_PROOF") {
      Alert.alert(
        "Select Document Type",
        "Choose how to provide your address proof",
        [
          {
            text: "Take Photo",
            onPress: () => {
              if (hasCameraPermission === false) {
                Alert.alert("Camera Permission Required", "Camera permission is required");
                return;
              }
              setCameraModalVisible(true);
            },
          },
          {
            text: "Upload Image",
            onPress: pickImage,
          },
          {
            text: "Upload PDF",
            onPress: pickDocument,
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ]
      );
    } else {
      Alert.alert(
        "Select Option",
        "Choose how to provide your document",
        [
          {
            text: "Take Photo",
            onPress: () => {
              if (hasCameraPermission === false) {
                Alert.alert("Camera Permission Required", "Camera permission is required");
                return;
              }
              setCameraModalVisible(true);
            },
          },
          {
            text: "Upload Image",
            onPress: pickImage,
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ]
      );
    }
  };

  // Safe image viewer component
  const ImageViewer = () => {
    if (!visibleImages || !Array.isArray(visibleImages) || visibleImages.length === 0) {
      return null;
    }

    const currentImage = visibleImages[currentIndex];
    if (!currentImage) return null;

    return (
      <Modal
        visible={!!visibleImages}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setVisibleImages(null);
          setCurrentIndex(0);
        }}
      >
        <View className="flex-1 bg-black/90 justify-center items-center px-5">
          <Image
            source={{ uri: currentImage }}
            style={{
              width: "100%",
              height: "70%",
              resizeMode: "contain",
              borderRadius: 10,
            }}
            onError={() => {
              Alert.alert("Error", "Failed to load image");
            }}
          />

          {/* Controls */}
          <View className="flex-row justify-between items-center mt-4 w-full px-10">
            <TouchableOpacity
              onPress={() => setCurrentIndex((prev) => prev > 0 ? prev - 1 : visibleImages.length - 1)}
              className="p-2 bg-white rounded-full"
              disabled={visibleImages.length <= 1}
            >
              <Feather name="chevron-left" size={24} color={visibleImages.length <= 1 ? "#ccc" : "#000"} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setVisibleImages(null);
                setCurrentIndex(0);
              }}
              className="p-2 bg-red-600 rounded-full"
            >
              <Feather name="x" size={24} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setCurrentIndex((prev) => prev < visibleImages.length - 1 ? prev + 1 : 0)}
              className="p-2 bg-white rounded-full"
              disabled={visibleImages.length <= 1}
            >
              <Feather name="chevron-right" size={24} color={visibleImages.length <= 1 ? "#ccc" : "#000"} />
            </TouchableOpacity>
          </View>

          {/* Image counter */}
          {visibleImages.length > 1 && (
            <Text className="text-white mt-4">
              {currentIndex + 1} / {visibleImages.length}
            </Text>
          )}
        </View>
      </Modal>
    );
  };

  if (hasCameraPermission === null) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Loader size="large" />
        <Text className="mt-4 text-gray-600">Checking permissions...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#7ddd7d]">
      {/* Header */}
      <View className="flex-row items-center justify-between pt-12 pb-4 px-5 bg-[#7ddd7d]">
        <TouchableOpacity onPress={() => navigation.navigate("MainTabs")}>
          <AntDesign name="left" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-black">
          {t("kyc.my_kyc")}
        </Text>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View className="h-2 bg-white" />

      {/* KYC Items */}
      <ScrollView className="flex-1 bg-white px-4" showsVerticalScrollIndicator={false}>
        {kycItems.map((item) => (
          <View
            key={item.id}
            className="bg-gray-100 rounded-xl p-4 mb-4 shadow-sm"
          >
            <View className="flex-row justify-between items-center">
              <View className="flex-1">
                <View className="flex-row items-center mb-1">
                  <Feather name="file-text" size={16} color="black" />
                  <Text className="ml-2 font-semibold text-sm text-black flex-1" numberOfLines={2}>
                    {item.title}
                  </Text>
                </View>

                {item.status && (
                  <Text className={`${item.statusColor} text-sm font-medium`}>
                    {item.status}
                  </Text>
                )}

                {item.rejected && item.rejectionReason && (
                  <Text className="text-red-500 text-xs mt-1">
                    Reason: {item.rejectionReason}
                  </Text>
                )}
              </View>

              {/* Eye icon */}
              <View className="flex-row gap-2">
                {item.urls.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      setVisibleImages(item.urls);
                      setCurrentIndex(0);
                    }}
                    className="p-2 bg-green-500 rounded-full"
                  >
                    <Feather name="eye" size={16} color="white" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {item.rejected && (
              <View className="bg-white p-4 border-t border-gray-200 mt-2">
                <TouchableOpacity
                  onPress={() => handleResubmit(item)}
                  className="bg-red-600 py-3 rounded-full"
                  disabled={uploading}
                >
                  <Text className="text-center text-white font-bold">
                    {uploading ? "Uploading..." : t("kyc.resubmit") || "Soumettre à nouveau"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}
      </ScrollView>

      {/* Image Viewer */}
      <ImageViewer />

      {/* Camera Selection Modal */}
      <Modal
        visible={cameraModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCameraModalVisible(false)}
      >
        <View className="flex-1 bg-black/80 justify-center items-center">
          <View className="bg-white p-6 rounded-xl w-5/6">
            <Text className="text-lg font-bold text-center mb-4">
              Select Camera
            </Text>
            
            <View className="flex-row justify-between mb-6">
              <TouchableOpacity
                onPress={() => setCameraType(CameraType.back)}
                className={`p-4 rounded-lg ${cameraType === CameraType.back ? 'bg-blue-500' : 'bg-gray-200'}`}
              >
                <Text className={`font-medium ${cameraType === CameraType.back ? 'text-white' : 'text-black'}`}>
                  Back Camera
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => setCameraType(CameraType.front)}
                className={`p-4 rounded-lg ${cameraType === CameraType.front ? 'bg-blue-500' : 'bg-gray-200'}`}
              >
                <Text className={`font-medium ${cameraType === CameraType.front ? 'text-white' : 'text-black'}`}>
                  Front Camera
                </Text>
              </TouchableOpacity>
            </View>
            
            <View className="flex-row justify-between">
              <TouchableOpacity
                onPress={takePicture}
                className="bg-green-500 px-6 py-3 rounded-lg flex-1 mr-2"
              >
                <Text className="text-white font-bold text-center">Take Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => setCameraModalVisible(false)}
                className="bg-red-500 px-6 py-3 rounded-lg flex-1 ml-2"
              >
                <Text className="text-white font-bold text-center">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Global Loading Overlay */}
      {uploading && (
        <View className="absolute inset-0 justify-center items-center bg-black/50">
          <View className="bg-white p-6 rounded-xl items-center">
            <Loader size="large" />
            <Text className="text-black mt-4 font-medium">Uploading document...</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default KYCValidation;