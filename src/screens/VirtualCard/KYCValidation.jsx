import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
  Alert,
  Platform,
} from "react-native";
import Loader from "../../components/Loader";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useUpdateKycDocumentMutation } from "../../services/Kyc/kycApi"; 

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
  const { documents } = route.params;
  //console.log(documents)
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
  
  // Use the RTK Query mutation hook
  const [updateKycDocument] = useUpdateKycDocumentMutation();

  useEffect(() => {
    (async () => {
      try {
        // Check if we can use the camera
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        setHasCameraPermission(status === 'granted');
        setCameraAvailable(true);
      } catch (error) {
        console.error("Camera not available:", error);
        setCameraAvailable(false);
      }
    })();
  }, []);

  const groupedDocs = documents.reduce((acc, doc) => {
    if (!acc[doc.type]) acc[doc.type] = [];
    acc[doc.type].push(doc);
    return acc;
  }, {});

  const hasRejectedDoc = documents.some((doc) => doc.status === "REJECTED");

  const kycItems = Object.keys(documentTypeMap).map((type) => {
    const docList = groupedDocs[type] || [];
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
        rejectionReason = firstDoc.rejectionReason;
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
      urls: docList.map((doc) => doc.url),
      hasDoc: !!firstDoc,
      rejected: firstDoc?.status === "REJECTED",
      rejectionReason,
      publicId: firstDoc?.publicId,
    };
  });

  const takePicture = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        await uploadDocument(result.assets[0].uri, selectedDocument.publicId);
        setCameraModalVisible(false);
      }
    } catch (error) {
      console.error("Error taking picture:", error);
      Alert.alert("Error", "Failed to take picture");
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled) {
        await uploadDocument(result.assets[0].uri, selectedDocument.publicId);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
      });

      if (result.type === "success") {
        await uploadDocument(result.uri, selectedDocument.publicId);
      }
    } catch (error) {
      console.error("Error picking document:", error);
      Alert.alert("Error", "Failed to pick document");
    }
  };

      const uploadDocument = async (uri, publicId) => {
      setUploading(true);
      
      try {
        // Create FormData object
        const formData = new FormData();
        
        // For iOS, we need to modify the URI
        const fileUri = Platform.OS === "ios" ? uri.replace("file://", "") : uri;
        
        // Determine file type and name
        let fileName = `document_${Date.now()}`;
        let fileType = "image/jpeg";
        
        // Check if it's a PDF
        if (uri.toLowerCase().endsWith('.pdf')) {
          fileType = 'application/pdf';
          fileName += '.pdf';
        } else {
          fileName += '.jpg';
        }
        
        // Append the file to FormData
        formData.append("document", {
          uri: fileUri,
          name: fileName,
          type: fileType,
        });

        // Encode the publicId for URL (replace slashes with %2F)
        const encodedPublicId = encodeURIComponent(publicId);

        // Use the RTK Query mutation to update the document
        const response = await updateKycDocument({
          publicId: encodedPublicId,
          formData
        }).unwrap();
        console.log(response)

        if (response) {
          Alert.alert("Success", "Document uploaded successfully");
          navigation.goBack();
        }
      } catch (error) {
        console.error("Error uploading document:", error);
        Alert.alert("Error", "Failed to upload document");
      } finally {
        setUploading(false);
      }
    };

  const handleResubmit = (item) => {
    setSelectedDocument(item);
    
    if (item.id === "SELFIE") {
      if (!cameraAvailable || hasCameraPermission === false) {
        Alert.alert("Camera not available", "Camera is not available on this device or permission was denied");
        return;
      }
      setCameraModalVisible(true);
    } else if (item.id === "ADDRESS_PROOF") {
      // For address proof, allow PDF or image upload
      Alert.alert(
        "Select Document Type",
        "Choose how to provide your address proof",
        [
          {
            text: "Take Photo",
            onPress: () => {
              if (!cameraAvailable || hasCameraPermission === false) {
                Alert.alert("Camera not available", "Camera is not available on this device or permission was denied");
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
    } else if (item.id === "ID_PROOF") {
      // For ID proof, need front and back
      Alert.alert(
        "ID Document",
        "You need to provide both front and back of your ID",
        [
          {
            text: "Take Photos",
            onPress: () => {
              if (!cameraAvailable || hasCameraPermission === false) {
                Alert.alert("Camera not available", "Camera is not available on this device or permission was denied");
                return;
              }
              setCameraModalVisible(true);
            },
          },
          {
            text: "Upload Images",
            onPress: pickImage,
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ]
      );
    } else {
      // For other documents, allow image upload
      Alert.alert(
        "Select Option",
        "Choose how to provide your document",
        [
          {
            text: "Take Photo",
            onPress: () => {
              if (!cameraAvailable || hasCameraPermission === false) {
                Alert.alert("Camera not available", "Camera is not available on this device or permission was denied");
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

  if (hasCameraPermission === null) {
    return (
      <View className="flex-1 justify-center items-center">
        <Loader size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#7ddd7d]">
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingTop: 50,
          paddingBottom: 15,
          paddingHorizontal: 20,
          backgroundColor: "#7ddd7d",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity onPress={() => navigation.navigate("MainTabs")}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: "#000" }}>
          {t("kyc.my_kyc")}
        </Text>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <View className="h-3 mt-3 bg-white" />

      {/* KYC Items */}
      <ScrollView className="px-4 bg-white">
        {kycItems.map((item) => (
          <View
            key={item.id}
            className="bg-gray-100 rounded-xl p-4 mb-4 shadow-sm"
          >
            <View className="flex-row justify-between items-center">
              <View className="flex-1">
                <View className="flex-row items-center mb-1">
                  <Feather name="file-text" size={16} color="black" />
                  <Text className="ml-2 font-semibold text-sm text-black">
                    {item.title}
                  </Text>
                </View>

                {item.status && (
                  <Text
                    className={`${item.statusColor} text-sm font-medium text-center`}
                  >
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

      {/* Image Viewer Modal */}
      <Modal
        visible={!!visibleImages}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setVisibleImages(null);
          setCurrentIndex(0);
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.85)",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 20,
          }}
        >
          {visibleImages && visibleImages[currentIndex] && (
            <>
              {loading && (
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 10,
                    backgroundColor: "rgba(0,0,0,0.6)",
                  }}
                >
                  <Loader size="large" color="#fff" />
                </View>
              )}

              <Image
                source={{ uri: visibleImages[currentIndex] }}
                style={{
                  width: "100%",
                  height: "70%",
                  resizeMode: "contain",
                  borderRadius: 10,
                  opacity: loading ? 0 : 1,
                }}
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
              />
            </>
          )}

          {/* Controls */}
          <View className="flex-row justify-between items-center mt-4 w-full px-10">
            <TouchableOpacity
              onPress={() =>
                setCurrentIndex((prev) =>
                  prev > 0 ? prev - 1 : visibleImages.length - 1
                )
              }
              className="p-2 bg-white rounded-full"
            >
              <Feather name="chevron-left" size={24} color="#000" />
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
              onPress={() =>
                setCurrentIndex((prev) =>
                  prev < visibleImages.length - 1 ? prev + 1 : 0
                )
              }
              className="p-2 bg-white rounded-full"
            >
              <Feather name="chevron-right" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Camera Selection Modal */}
      <Modal
        visible={cameraModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCameraModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "center", alignItems: "center" }}>
          <View style={{ backgroundColor: "white", padding: 20, borderRadius: 10, width: "80%" }}>
            <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 20, textAlign: "center" }}>
              Select Camera
            </Text>
            
            <View style={{ flexDirection: "row", justifyContent: "space-around", marginBottom: 20 }}>
              <TouchableOpacity
                onPress={() => setCameraType(CameraType.back)}
                style={{
                  padding: 15,
                  backgroundColor: cameraType === CameraType.back ? "#007AFF" : "#E0E0E0",
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: cameraType === CameraType.back ? "white" : "black" }}>Back Camera</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => setCameraType(CameraType.front)}
                style={{
                  padding: 15,
                  backgroundColor: cameraType === CameraType.front ? "#007AFF" : "#E0E0E0",
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: cameraType === CameraType.front ? "white" : "black" }}>Front Camera</Text>
              </TouchableOpacity>
            </View>
            
            <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
              <TouchableOpacity
                onPress={takePicture}
                style={{
                  padding: 15,
                  backgroundColor: "#4CAF50",
                  borderRadius: 10,
                  marginRight: 10,
                }}
              >
                <Text style={{ color: "white" }}>Take Photo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => setCameraModalVisible(false)}
                style={{
                  padding: 15,
                  backgroundColor: "#F44336",
                  borderRadius: 10,
                }}
              >
                <Text style={{ color: "white" }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {uploading && (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <Loader size="large" color="#fff" />
          <Text className="text-white mt-4">Uploading document...</Text>
        </View>
      )}
    </View>
  );
};

export default KYCValidation;