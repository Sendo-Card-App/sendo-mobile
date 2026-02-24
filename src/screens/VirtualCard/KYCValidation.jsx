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
  Dimensions,
  StatusBar,
} from "react-native";
import Loader from "../../components/Loader";
import { Ionicons, Feather, AntDesign, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { useUpdateKycDocumentMutation } from "../../services/Kyc/kycApi"; 
import { useAppState } from '../../context/AppStateContext';
import { useGetUserProfileQuery } from "../../services/Auth/authAPI";

const { width } = Dimensions.get("window");

// Define camera types
const CameraType = {
  back: 'back',
  front: 'front'
};

const documentTypeMap = {
  ID_PROOF: "kyc.id_proof",
  ADDRESS_PROOF: "kyc.address_proof",
  SELFIE: "kyc.selfie",
};

const documentIcons = {
  ID_PROOF: "file-text",
  ADDRESS_PROOF: "home",
  SELFIE: "camera",
};

const statusConfig = {
  APPROVED: { color: "#10B981", bgColor: "#D1FAE5", icon: "check-circle", text: "kyc.approved" },
  REJECTED: { color: "#EF4444", bgColor: "#FEE2E2", icon: "x-circle", text: "kyc.rejected" },
  PENDING: { color: "#F59E0B", bgColor: "#FEF3C7", icon: "clock", text: "kyc.pending" },
};

// Document Card Component
const DocumentCard = ({ 
  item, 
  onView, 
  onResubmit, 
  uploading,
  isCanadianUser 
}) => {
  const { t } = useTranslation();
  const iconName = documentIcons[item.id] || "file-text";
  const status = item.status || "PENDING";
  const config = statusConfig[status] || statusConfig.PENDING;

  return (
    <View className="bg-white rounded-2xl p-5 mb-4 shadow-lg border border-gray-100">
      {/* Header */}
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-row items-center flex-1">
          <View className={`w-12 h-12 rounded-xl ${config.bgColor} items-center justify-center mr-3`}>
            <AntDesign name={iconName} size={24} color={config.color} />
          </View>
          <View className="flex-1">
            <Text className="font-bold text-lg text-gray-900" numberOfLines={1}>
              {item.title}
            </Text>
            <View className="flex-row items-center mt-1">
              <Feather name={config.icon} size={14} color={config.color} />
              <Text className={`ml-1 text-sm font-medium`} style={{ color: config.color }}>
                {t(config.text)}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row">
          {item.urls.length > 0 && (
            <TouchableOpacity
              onPress={() => onView(item.urls, 0)}
              className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center ml-2"
            >
              <Feather name="eye" size={18} color="#4B5563" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Document Details */}
      {(item.documentNumber || item.taxIdNumber || item.expirationDate) && (
        <View className="bg-gray-50 rounded-xl p-4 mb-4">
          {item.documentNumber && (
            <View className="flex-row justify-between py-2 border-b border-gray-100">
              <Text className="text-gray-600 font-medium">
                {isCanadianUser ? t('document1.idCard') : t('document1.cni')}
              </Text>
              <Text className="text-gray-900 font-semibold">{item.documentNumber}</Text>
            </View>
          )}
          
          {item.taxIdNumber && (
            <View className="flex-row justify-between py-2 border-b border-gray-100">
              <Text className="text-gray-600 font-medium">NIU </Text>
              <Text className="text-gray-900 font-semibold">{item.taxIdNumber}</Text>
            </View>
          )}
        </View>
      )}

      {/* Rejection Reason */}
      {item.rejected && item.rejectionReason && (
        <View className="bg-red-50 border-l-4 border-red-500 p-3 rounded-r-lg mb-4">
          <View className="flex-row items-start">
            <Feather name="alert-circle" size={18} color="#EF4444" />
            <Text className="ml-2 text-red-700 font-medium flex-1">
              {item.rejectionReason}
            </Text>
          </View>
        </View>
      )}
      {/* Resubmit Button */}
      {item.rejected && (
        <TouchableOpacity
          onPress={() => onResubmit(item)}
          disabled={uploading}
          className={`bg-red-500 py-4 rounded-xl flex-row items-center justify-center shadow-lg ${uploading ? 'opacity-70' : ''}`}
        >
          {uploading ? (
            <Loader size="small" color="white" />
          ) : (
            <>
              <Feather name="refresh-cw" size={20} color="white" />
              <Text className="text-white font-bold text-base ml-2">
                {t("kyc.resubmit") || "Resubmit Document"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
};

// Image Viewer Component
const ImageViewer = ({ visibleImages, currentIndex, onClose, onIndexChange }) => {
  if (!visibleImages || !Array.isArray(visibleImages) || visibleImages.length === 0) {
    return null;
  }

  return (
    <Modal
      visible={!!visibleImages}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 bg-black/95">
        {/* Header */}
        <View className="flex-row justify-between items-center pt-12 px-5 pb-4">
          <TouchableOpacity onPress={onClose} className="p-2">
            <Feather name="x" size={28} color="white" />
          </TouchableOpacity>
          <Text className="text-white font-bold text-lg">
            {currentIndex + 1} / {visibleImages.length}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Image */}
        <View className="flex-1 justify-center items-center px-4">
          <Image
            source={{ uri: visibleImages[currentIndex] }}
            style={{
              width: width - 32,
              height: (width - 32) * 0.75,
              resizeMode: "contain",
              borderRadius: 12,
            }}
            onError={() => Alert.alert("Error", "Failed to load image")}
          />
        </View>

        {/* Navigation Controls */}
        {visibleImages.length > 1 && (
          <View className="flex-row justify-between items-center px-10 py-6">
            <TouchableOpacity
              onPress={() => onIndexChange(currentIndex > 0 ? currentIndex - 1 : visibleImages.length - 1)}
              className="w-14 h-14 bg-white/20 rounded-full items-center justify-center"
            >
              <Feather name="chevron-left" size={28} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => onIndexChange(currentIndex < visibleImages.length - 1 ? currentIndex + 1 : 0)}
              className="w-14 h-14 bg-white/20 rounded-full items-center justify-center"
            >
              <Feather name="chevron-right" size={28} color="white" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
};

// Camera Modal Component
const CameraModal = ({ 
  visible, 
  onClose, 
  onTakePicture, 
  cameraType, 
  onCameraTypeChange 
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/90 justify-end">
        <View className="bg-white rounded-t-3xl p-6">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-bold text-gray-900">Take Photo</Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <Feather name="x" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <Text className="text-gray-600 mb-6 text-center">
            Select camera to use for capturing document
          </Text>

          {/* Camera Type Selection */}
          <View className="flex-row justify-between mb-8">
            <TouchableOpacity
              onPress={() => onCameraTypeChange(CameraType.back)}
              className={`flex-1 mx-2 p-4 rounded-2xl items-center justify-center ${cameraType === CameraType.back ? 'bg-blue-500' : 'bg-gray-100'}`}
            >
              <MaterialIcons 
                name="camera-rear" 
                size={32} 
                color={cameraType === CameraType.back ? 'white' : '#4B5563'} 
              />
              <Text className={`mt-2 font-semibold ${cameraType === CameraType.back ? 'text-white' : 'text-gray-700'}`}>
                Back Camera
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => onCameraTypeChange(CameraType.front)}
              className={`flex-1 mx-2 p-4 rounded-2xl items-center justify-center ${cameraType === CameraType.front ? 'bg-blue-500' : 'bg-gray-100'}`}
            >
              <MaterialIcons 
                name="camera-front" 
                size={32} 
                color={cameraType === CameraType.front ? 'white' : '#4B7280'} 
              />
              <Text className={`mt-2 font-semibold ${cameraType === CameraType.front ? 'text-white' : 'text-gray-700'}`}>
                Front Camera
              </Text>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity
            onPress={onTakePicture}
            className="bg-gradient-to-r from-green-500 to-emerald-600 py-4 rounded-xl mb-3"
          >
            <Text className="text-white font-bold text-center text-lg">
              Capture Document
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={onClose}
            className="py-4 rounded-xl border-2 border-gray-300"
          >
            <Text className="text-gray-700 font-semibold text-center text-lg">
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const KYCValidation = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { documents } = route.params || { documents: [] };
  const { t } = useTranslation();
  
  const [visibleImages, setVisibleImages] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [cameraType, setCameraType] = useState(CameraType.back);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  const [updateKycDocument] = useUpdateKycDocumentMutation();
  const { setIsPickingDocument } = useAppState();
  
  const { data: userProfile } = useGetUserProfileQuery(undefined, { 
    pollingInterval: 1000
  });

  const isCanadianUser = userProfile?.data?.user?.country === "Canada";

  // Handle Android back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (visibleImages) {
        closeImageViewer();
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

  // Document grouping logic (same as before)
  const groupedDocs = useCallback(() => {
    try {
      if (!documents || !Array.isArray(documents)) return {};
      
      const grouped = documents.reduce((acc, doc) => {
        if (doc && doc.type) {
          if (!acc[doc.type]) acc[doc.type] = [];
          acc[doc.type].push(doc);
        }
        return acc;
      }, {});
      
      Object.keys(grouped).forEach(type => {
        grouped[type].sort((a, b) => {
          if (a.status === "REJECTED" && b.status !== "REJECTED") return -1;
          if (a.status !== "REJECTED" && b.status === "REJECTED") return 1;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
      });
      
      return grouped;
    } catch (error) {
      console.error("Error grouping documents:", error);
      return {};
    }
  }, [documents]);

  const getFilteredDocumentTypes = () => {
    const allTypes = Object.keys(documentTypeMap);
    if (isCanadianUser) {
      return allTypes.filter(type => type !== "ADDRESS_PROOF");
    }
    return allTypes;
  };

  const getDocumentsByType = (type) => groupedDocs()[type] || [];
  const hasRejectedDocument = (type) => getDocumentsByType(type).some(doc => doc.status === "REJECTED");
  const getRejectedDocument = (type) => getDocumentsByType(type).find(doc => doc.status === "REJECTED");
  const getPrimaryDocument = (type) => {
    const docs = getDocumentsByType(type);
    if (docs.length === 0) return null;
    const rejectedDoc = docs.find(doc => doc.status === "REJECTED");
    return rejectedDoc || docs[0];
  };

  const kycItems = getFilteredDocumentTypes().map((type) => {
    const allDocs = getDocumentsByType(type);
    const primaryDoc = getPrimaryDocument(type);
    const isRejected = hasRejectedDocument(type);
    const rejectedDoc = getRejectedDocument(type);

    let status = "PENDING";
    let rejectionReason = "";
    let displayDoc = primaryDoc;
    
    if (isRejected && rejectedDoc) {
      displayDoc = rejectedDoc;
      status = "REJECTED";
      rejectionReason = rejectedDoc.rejectionReason || "";
    } else if (primaryDoc) {
      status = primaryDoc.status || "PENDING";
      rejectionReason = primaryDoc.rejectionReason || "";
    }

    const allUrls = allDocs.filter(doc => doc?.url).map((doc) => doc.url);

    return {
      id: type,
      title: t(documentTypeMap[type] || type),
      status,
      urls: allUrls,
      hasDoc: !!primaryDoc,
      rejected: isRejected,
      rejectionReason,
      publicId: (isRejected && rejectedDoc?.publicId) || primaryDoc?.publicId,
      documentNumber: displayDoc?.idDocumentNumber,
      expirationDate: displayDoc?.expirationDate,
      taxIdNumber: displayDoc?.taxIdNumber,
      allDocuments: allDocs,
    };
  });

  const openImageViewer = (images, index = 0) => {
    setVisibleImages(images);
    setCurrentIndex(index);
  };

  const closeImageViewer = () => {
    setVisibleImages(null);
    setCurrentIndex(0);
  };

  const handleIndexChange = (newIndex) => setCurrentIndex(newIndex);

  const safeImagePickerOperation = async (operation, errorMessage) => {
    try {
      setIsPickingDocument(true);
      const result = await operation();
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!result.canceled && result.assets?.[0]?.uri) {
        await uploadDocument(result.assets[0].uri, selectedDocument?.publicId);
        if (cameraModalVisible) setCameraModalVisible(false);
      }
    } catch (error) {
      console.error("Image picker error:", error);
      Alert.alert("Error", errorMessage);
    } finally {
      setTimeout(() => setIsPickingDocument(false), 200);
    }
  };

  const takePicture = () => {
    safeImagePickerOperation(
      () => ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
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
        quality: 0.8,
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
      setTimeout(() => setIsPickingDocument(false), 200);
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
      let fileUri = uri;
      
      if (Platform.OS === "ios" && uri.startsWith('file://')) {
        fileUri = uri.replace("file://", "");
      }
      
      const isPDF = uri.toLowerCase().endsWith('.pdf');
      const fileType = isPDF ? 'application/pdf' : 'image/jpeg';
      const fileName = `document_${Date.now()}.${isPDF ? 'pdf' : 'jpg'}`;
      
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
      setCameraModalVisible(true);
    } else if (item.id === "ADDRESS_PROOF") {
      Alert.alert(
        "Upload Address Proof",
        "Choose how to provide your address proof",
        [
          {
            text: "Take Photo",
            onPress: () => setCameraModalVisible(true),
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
        ],
        { cancelable: true }
      );
    } else {
      Alert.alert(
        "Upload Document",
        "Choose how to provide your document",
        [
          {
            text: "Take Photo",
            onPress: () => setCameraModalVisible(true),
          },
          {
            text: "Upload Image",
            onPress: pickImage,
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ],
        { cancelable: true }
      );
    }
  };

  // Calculate KYC completion percentage
  const approvedCount = kycItems.filter(item => item.status === "APPROVED").length;
  const completionPercentage = kycItems.length > 0 
    ? Math.round((approvedCount / kycItems.length) * 100) 
    : 0;

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#7ddd7d" />
      
      {/* Header */}
      <View className="bg-[#7ddd7d] pt-12 pb-6 px-5">
        <View className="flex-row justify-between items-center mb-6">
          <TouchableOpacity 
            onPress={() => navigation.navigate("MainTabs")}
            className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
          >
            <AntDesign name="left" size={20} color="white" />
          </TouchableOpacity>
          
          <Text className="text-2xl font-bold text-white">
            {t("kyc.my_kyc") || "KYC Verification"}
          </Text>
          
          <TouchableOpacity 
            onPress={() => navigation.openDrawer()}
            className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
          >
            <Ionicons name="menu-outline" size={22} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Documents List */}
      <ScrollView 
        className="flex-1 px-5 pt-6" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <Text className="text-xl font-bold text-gray-900 mb-4"> Documents</Text>
        
        {kycItems.map((item) => (
          <DocumentCard
            key={item.id}
            item={item}
            onView={openImageViewer}
            onResubmit={handleResubmit}
            uploading={uploading}
            isCanadianUser={isCanadianUser} 
          />
        ))}
      </ScrollView>

      {/* Image Viewer */}
      <ImageViewer 
        visibleImages={visibleImages}
        currentIndex={currentIndex}
        onClose={closeImageViewer}
        onIndexChange={handleIndexChange}
      />

      {/* Camera Modal */}
      <CameraModal
        visible={cameraModalVisible}
        onClose={() => setCameraModalVisible(false)}
        onTakePicture={takePicture}
        cameraType={cameraType}
        onCameraTypeChange={setCameraType}
      />

      {/* Uploading Overlay */}
      {uploading && (
        <View className="absolute inset-0 bg-black/50 justify-center items-center">
          <View className="bg-white rounded-2xl p-8 items-center w-4/5">
            <Loader size="large" color="#7ddd7d" />
            <Text className="text-gray-900 font-bold text-xl mt-6">Uploading Document</Text>
            <Text className="text-gray-600 text-center mt-2">
              Please wait while we upload your document...
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default KYCValidation;