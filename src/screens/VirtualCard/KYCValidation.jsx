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
  Animated,
  Dimensions,
  Easing,
} from "react-native";
import Loader from "../../components/Loader";
import { Ionicons, Feather, AntDesign, MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useUpdateKycDocumentMutation } from "../../services/Kyc/kycApi"; 

const { width, height } = Dimensions.get('window');

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
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [visibleImages, setVisibleImages] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [cameraType, setCameraType] = useState(CameraType.back);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState(null);
  const [cameraAvailable, setCameraAvailable] = useState(false);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const modalSlideAnim = useRef(new Animated.Value(height)).current;
  
  // Use the RTK Query mutation hook
  const [updateKycDocument] = useUpdateKycDocumentMutation();

  useEffect(() => {
    (async () => {
      try {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        setHasCameraPermission(status === 'granted');
        setCameraAvailable(true);
      } catch (error) {
        console.error("Camera not available:", error);
        setCameraAvailable(false);
      }
    })();
  }, []);

  useEffect(() => {
    // Animate content on mount
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const animateModalIn = () => {
    modalSlideAnim.setValue(height);
    Animated.timing(modalSlideAnim, {
      toValue: 0,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const animateModalOut = () => {
    Animated.timing(modalSlideAnim, {
      toValue: height,
      duration: 300,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

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
        statusColor = "text-black-500";
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
        setActionModalVisible(false);
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
        setActionModalVisible(false);
      }
    } catch (error) {
      console.error("Error picking document:", error);
      Alert.alert("Error", "Failed to pick document");
    }
  };

  const uploadDocument = async (uri, publicId) => {
    setUploading(true);
    
    try {
      const formData = new FormData();
      const fileUri = Platform.OS === "ios" ? uri.replace("file://", "") : uri;
      
      let fileName = `document_${Date.now()}`;
      let fileType = "image/jpeg";
      
      if (uri.toLowerCase().endsWith('.pdf')) {
        fileType = 'application/pdf';
        fileName += '.pdf';
      } else {
        fileName += '.jpg';
      }
      
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
      animateModalIn();
    } else {
      setActionModalVisible(true);
      animateModalIn();
    }
  };

  const renderActionModal = () => {
    let title = "Select Option";
    let description = "Choose how to provide your document";
    let options = [];

    if (selectedDocument?.id === "ADDRESS_PROOF") {
      title = "Address Proof";
      description = "Choose how to provide your address proof";
      options = [
        {
          text: "Take Photo",
          icon: "camera",
          onPress: () => {
            if (!cameraAvailable || hasCameraPermission === false) {
              Alert.alert("Camera not available", "Camera is not available on this device or permission was denied");
              return;
            }
            setActionModalVisible(false);
            setCameraModalVisible(true);
            animateModalIn();
          },
        },
        {
          text: "Upload Image",
          icon: "image",
          onPress: pickImage,
        },
        {
          text: "Upload PDF",
          icon: "file-text",
          onPress: pickDocument,
        },
      ];
    } else if (selectedDocument?.id === "ID_PROOF") {
      title = "ID Document";
      description = "You need to provide both front and back of your ID";
      options = [
        {
          text: "Take Photos",
          icon: "camera",
          onPress: () => {
            if (!cameraAvailable || hasCameraPermission === false) {
              Alert.alert("Camera not available", "Camera is not available on this device or permission was denied");
              return;
            }
            setActionModalVisible(false);
            setCameraModalVisible(true);
            animateModalIn();
          },
        },
        {
          text: "Upload Images",
          icon: "upload",
          onPress: pickImage,
        },
      ];
    } else {
      options = [
        {
          text: "Take Photo",
          icon: "camera",
          onPress: () => {
            if (!cameraAvailable || hasCameraPermission === false) {
              Alert.alert("Camera not available", "Camera is not available on this device or permission was denied");
              return;
            }
            setActionModalVisible(false);
            setCameraModalVisible(true);
            animateModalIn();
          },
        },
        {
          text: "Upload Image",
          icon: "image",
          onPress: pickImage,
        },
      ];
    }

    return (
      <Modal
        visible={actionModalVisible}
        transparent
        animationType="none"
        onRequestClose={() => {
          animateModalOut();
          setTimeout(() => setActionModalVisible(false), 300);
        }}
      >
        <View className="flex-1 justify-end bg-black/50">
          <Animated.View 
            style={{ 
              transform: [{ translateY: modalSlideAnim }] 
            }}
            className="bg-white rounded-t-3xl p-6"
          >
            <View className="items-center mb-6">
              <View className="w-12 h-1 bg-gray-300 rounded-full mb-4" />
              <Text className="text-xl font-bold text-gray-900 text-center">
                {title}
              </Text>
              <Text className="text-gray-600 text-center mt-2 text-base">
                {description}
              </Text>
            </View>

            <View className="space-y-3">
              {options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={option.onPress}
                  className="flex-row items-center p-4 bg-gray-50 rounded-2xl border border-gray-200"
                >
                  <View className="w-10 h-10 bg-green-100 rounded-full items-center justify-center mr-3">
                    <Feather name={option.icon} size={20} color="#059669" />
                  </View>
                  <Text className="text-gray-900 font-semibold text-lg flex-1">
                    {option.text}
                  </Text>
                  <Feather name="chevron-right" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => {
                animateModalOut();
                setTimeout(() => setActionModalVisible(false), 300);
              }}
              className="mt-4 p-4 bg-gray-100 rounded-2xl"
            >
              <Text className="text-gray-600 font-semibold text-center text-lg">
                Cancel
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    );
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
      <Animated.View 
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}
        className="pt-12 pb-4 px-6 bg-[#7ddd7d]"
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity 
            onPress={() => navigation.navigate("MainTabs")}
            className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
          >
            <AntDesign name="left" size={20} color="white" />
          </TouchableOpacity>
          
          <Text className="text-xl font-bold text-white text-center flex-1 mx-4">
            {t("kyc.my_kyc")}
          </Text>
          
          <TouchableOpacity 
            onPress={() => navigation.openDrawer()}
            className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
          >
            <Ionicons name="menu-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <View className="h-3 bg-white" />

      {/* KYC Items */}
      <ScrollView 
        className="flex-1 bg-white"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16 }}
      >
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim }
            ]
          }}
        >
          {kycItems.map((item, index) => (
            <Animated.View
              key={item.id}
              style={{
                opacity: fadeAnim,
                transform: [
                  { 
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 50],
                      outputRange: [0, index * 20]
                    }) 
                  }
                ]
              }}
            >
              <View className="bg-white rounded-3xl p-6 mb-4 shadow-lg border border-gray-100">
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-2">
                      <View className="w-10 h-10 bg-green-100 rounded-xl items-center justify-center mr-3">
                        <Feather name="file-text" size={20} color="#059669" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-lg font-bold text-gray-900">
                          {item.title}
                        </Text>
                        {item.status && (
                          <View className={`mt-1 px-3 py-1 rounded-full self-start ${item.statusColor.replace('text', 'bg')} bg-opacity-10`}>
                            <Text className={`text-xs font-semibold ${item.statusColor}`}>
                              {item.status}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {item.rejected && item.rejectionReason && (
                      <View className="mt-3 p-3 bg-red-50 rounded-xl border border-red-200">
                        <Text className="text-red-800 text-sm font-medium">
                          📝 {item.rejectionReason}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Action Buttons */}
                  <View className="flex-row gap-2">
                    {item.urls.length > 0 && (
                      <TouchableOpacity
                        onPress={() => {
                          setVisibleImages(item.urls);
                          setCurrentIndex(0);
                        }}
                        className="w-10 h-10 bg-green-500 rounded-full items-center justify-center shadow-sm"
                      >
                        <Feather name="eye" size={16} color="white" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {item.rejected && (
                  <View className="mt-4 pt-4 border-t border-gray-200">
                    <TouchableOpacity
                      onPress={() => handleResubmit(item)}
                      disabled={uploading}
                      className={`py-4 rounded-2xl shadow-lg ${
                        uploading ? 'bg-gray-400' : 'bg-red-500'
                      }`}
                    >
                      <Text className="text-center text-white font-bold text-lg">
                        {uploading ? (
                          <View className="flex-row items-center justify-center">
                            <Loader size="small" color="white" />
                            <Text className="text-white ml-2">Uploading...</Text>
                          </View>
                        ) : (
                          t("kyc.resubmit") || "Soumettre à nouveau"
                        )}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </Animated.View>
          ))}
        </Animated.View>
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
        <View className="flex-1 bg-black/90 justify-center items-center px-4">
          {visibleImages && visibleImages[currentIndex] && (
            <>
              {loading && (
                <View className="absolute top-0 left-0 right-0 bottom-0 justify-center items-center z-10 bg-black/60">
                  <Loader size="large" color="#fff" />
                </View>
              )}

              <Animated.Image
                source={{ uri: visibleImages[currentIndex] }}
                style={{
                  width: "100%",
                  height: "70%",
                  resizeMode: "contain",
                  borderRadius: 16,
                  opacity: loading ? 0 : 1,
                }}
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
              />
            </>
          )}

          {/* Controls */}
          <View className="flex-row justify-between items-center mt-6 w-full px-8">
            <TouchableOpacity
              onPress={() =>
                setCurrentIndex((prev) =>
                  prev > 0 ? prev - 1 : visibleImages.length - 1
                )
              }
              className="w-12 h-12 bg-white/20 rounded-full items-center justify-center"
            >
              <Feather name="chevron-left" size={24} color="white" />
            </TouchableOpacity>

            <View className="flex-row items-center">
              <Text className="text-white font-medium mx-4">
                {currentIndex + 1} / {visibleImages?.length}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setVisibleImages(null);
                  setCurrentIndex(0);
                }}
                className="w-12 h-12 bg-red-500 rounded-full items-center justify-center"
              >
                <Feather name="x" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              onPress={() =>
                setCurrentIndex((prev) =>
                  prev < visibleImages.length - 1 ? prev + 1 : 0
                )
              }
              className="w-12 h-12 bg-white/20 rounded-full items-center justify-center"
            >
              <Feather name="chevron-right" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Camera Selection Modal */}
      <Modal
        visible={cameraModalVisible}
        transparent
        animationType="none"
        onRequestClose={() => {
          animateModalOut();
          setTimeout(() => setCameraModalVisible(false), 300);
        }}
      >
        <View className="flex-1 justify-end bg-black/50">
          <Animated.View 
            style={{ 
              transform: [{ translateY: modalSlideAnim }] 
            }}
            className="bg-white rounded-t-3xl p-6"
          >
            <View className="items-center mb-6">
              <View className="w-12 h-1 bg-gray-300 rounded-full mb-4" />
              <Text className="text-xl font-bold text-gray-900">
                Select Camera
              </Text>
            </View>

            <View className="flex-row justify-between mb-6">
              <TouchableOpacity
                onPress={() => setCameraType(CameraType.back)}
                className={`flex-1 mx-2 p-4 rounded-2xl border-2 ${
                  cameraType === CameraType.back 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 bg-gray-50'
                } items-center`}
              >
                <MaterialIcons 
                  name="camera-rear" 
                  size={32} 
                  color={cameraType === CameraType.back ? "#059669" : "#6B7280"} 
                />
                <Text className={`mt-2 font-semibold ${
                  cameraType === CameraType.back ? 'text-green-700' : 'text-gray-600'
                }`}>
                  Back Camera
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => setCameraType(CameraType.front)}
                className={`flex-1 mx-2 p-4 rounded-2xl border-2 ${
                  cameraType === CameraType.front 
                    ? 'border-green-500 bg-green-50' 
                    : 'border-gray-200 bg-gray-50'
                } items-center`}
              >
                <MaterialIcons 
                  name="camera-front" 
                  size={32} 
                  color={cameraType === CameraType.front ? "#059669" : "#6B7280"} 
                />
                <Text className={`mt-2 font-semibold ${
                  cameraType === CameraType.front ? 'text-green-700' : 'text-gray-600'
                }`}>
                  Front Camera
                </Text>
              </TouchableOpacity>
            </View>
            
            <View className="flex-row space-x-3">
              <TouchableOpacity
                onPress={takePicture}
                className="flex-1 py-4 bg-green-500 rounded-2xl shadow-lg"
              >
                <Text className="text-white font-bold text-center text-lg">
                  Take Photo
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => {
                  animateModalOut();
                  setTimeout(() => setCameraModalVisible(false), 300);
                }}
                className="flex-1 py-4 bg-gray-200 rounded-2xl"
              >
                <Text className="text-gray-700 font-bold text-center text-lg">
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Action Modal */}
      {renderActionModal()}

      {/* Uploading Overlay */}
      {uploading && (
        <View className="absolute top-0 left-0 right-0 bottom-0 justify-center items-center bg-black/70">
          <View className="bg-white rounded-3xl p-8 items-center mx-8">
            <Loader size="large" color="#059669" />
            <Text className="text-gray-900 font-semibold text-lg mt-4">
              Uploading document...
            </Text>
            <Text className="text-gray-600 text-center mt-2">
              Please wait while we process your document
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default KYCValidation;