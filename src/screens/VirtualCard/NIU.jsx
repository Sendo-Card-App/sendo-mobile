import { View, Text, Image, TouchableOpacity, Dimensions, Platform, Alert } from "react-native";
import React, { useState } from "react";
import { AntDesign, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import TopLogo from "../../images/TopLogo.png";
import { useDispatch } from 'react-redux';
import KycTab from "../../components/KycTab";
import { setNiuDocument } from '../../features/Kyc/kycReducer';
import { useTranslation } from 'react-i18next';

const NIU = ({ navigation }) => {
  const { t } = useTranslation();
  const { width } = Dimensions.get("screen");
  const dispatch = useDispatch();
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleTakePhoto = async () => {
    try {
      setIsProcessing(true);
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('niu.cameraPermissionDenied'));
        setIsProcessing(false);
        return;
      }
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        const image = result.assets[0];
        const document = {
          uri: image.uri,
          type: image.type || 'image/jpeg',
          name: `niu_photo_${Date.now()}.jpg`
        };
        setSelectedDocument(document);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert(t('niu.imageSelectionError'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUploadDocument = async () => {
    try {
      setIsProcessing(true);
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png'],
        copyToCacheDirectory: true,
      });

      if (result.type === 'success') {
        let fileType = result.mimeType;
        if (!fileType) {
          const extension = result.name.split('.').pop().toLowerCase();
          if (extension === 'pdf') fileType = 'application/pdf';
          else if (extension === 'jpg' || extension === 'jpeg') fileType = 'image/jpeg';
          else if (extension === 'png') fileType = 'image/png';
        }

        const document = {
          uri: result.uri,
          type: fileType || 'application/pdf',
          name: result.name || `niu_document_${Date.now()}.${fileType?.split('/')[1] || 'pdf'}`
        };
        setSelectedDocument(document);
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      Alert.alert(t('niu.documentUploadError'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleContinue = async () => {
    if (!selectedDocument) {
      Alert.alert(t('niu.noDocumentSelected'));
      return;
    }
    
    try {
      setIsProcessing(true);
      dispatch(setNiuDocument(selectedDocument));
      navigation.navigate("KycResume");
    } catch (error) {
      console.error('Error in continue handler:', error);
      Alert.alert(t('niu.generalError'));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View className="bg-[#181e25] flex-1 pt-0 relative">
      {/* Header */}
      <View className="border-b border-dashed border-white flex-row justify-between py-4 mt-10 items-center mx-5 pt-5">
        <View className="absolute -top-12 left-0 right-0 items-center justify-center">
          <Image source={TopLogo} className="h-36 w-40" resizeMode="contain" />
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="arrowleft" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.openDrawer()} className="ml-auto">
          <Ionicons name="menu-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <View className="border border-dashed border-gray-300 my-1" />
      <Text className="text-center text-white text-2xl my-3">
        {t('niu.title')}
      </Text>

      {/* Main Content */}
      <View className="flex-1 pb-3 bg-white rounded-t-3xl items-center">
        <KycTab isActive="4" />
        <Text className="font-bold text-gray-800 mt-3">{t('niu.taxNumber')}</Text>
        <Text className="text-center text-gray-400 text-sm">
          {t('niu.uploadInstruction')}
        </Text>

        {/* Show preview if document is selected */}
        {selectedDocument ? (
          <View className="w-full items-center mt-4">
            {selectedDocument.type.includes('image') ? (
              <Image
                source={{ uri: selectedDocument.uri }}
                className="w-[80%] mx-auto"
                style={{ height: width / 1.77 }}
                resizeMode="contain"
              />
            ) : (
              <View className="bg-gray-100 p-4 rounded-lg w-[80%] items-center">
                <MaterialIcons name="picture-as-pdf" size={60} color="red" />
                <Text className="mt-2 text-gray-700 text-center" numberOfLines={1}>
                  {selectedDocument.name}
                </Text>
              </View>
            )}
            <TouchableOpacity
              className="mt-2"
              onPress={() => {
                setSelectedDocument(null);
              }}
            >
              <Text className="text-red-500">{t('niu.removeDocument')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Image
            source={require("../../images/DGI.png")}
            className="w-[80%] mx-auto mt-2"
            style={{ height: width / 1.77 }}
            resizeMode="contain"
          />
        )}

        <View className="w-[89%] mx-auto px-8">
          <Text className="text-gray-400 my-1">
            {t('niu.description')}
          </Text>
          <Text className="text-gray-400 text-xs mt-2 italic">
            {t('niu.supportedFormats')}
          </Text>
        </View>

        {/* Two Option Buttons */}
        <View className="w-[85%] mx-auto mt-4 mb-2 space-y-4">
          <TouchableOpacity
            className={`flex-row items-center justify-center py-3 rounded-full border-2 ${selectedDocument?.type?.includes('image') ? 'border-[#7ddd7d] bg-[#7ddd7d]/20' : 'border-gray-300'}`}
            onPress={handleTakePhoto}
            disabled={isProcessing}
          >
            <MaterialIcons 
              name="photo-camera" 
              size={24} 
              color={selectedDocument?.type?.includes('image') ? '#7ddd7d' : 'gray'} 
            />
            <Text className={`ml-2 text-lg font-bold ${selectedDocument?.type?.includes('image') ? 'text-[#7ddd7d]' : 'text-gray-500'}`}>
              {t('niu.takePhotoButton')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-row items-center justify-center mt-5 py-3 rounded-full border-2 ${selectedDocument?.type?.includes('application/pdf') ? 'border-[#7ddd7d] bg-[#7ddd7d]/20' : 'border-gray-300'}`}
            onPress={handleUploadDocument}
            disabled={isProcessing}
          >
            <MaterialIcons 
              name="picture-as-pdf" 
              size={24} 
              color={selectedDocument?.type?.includes('application/pdf') ? '#7ddd7d' : 'gray'} 
            />
            <Text className={`ml-2 text-lg font-bold ${selectedDocument?.type?.includes('application/pdf') ? 'text-[#7ddd7d]' : 'text-gray-500'}`}>
              {t('niu.uploadDocumentButton')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Submit Button - Shows when any document is selected */}
        {selectedDocument && (
          <TouchableOpacity
            className="mb-2 mt-auto py-3 rounded-full w-[85%] mx-auto bg-[#7ddd7d]"
            onPress={handleContinue}
            disabled={isProcessing}
          >
            <Text className="text-xl text-center font-bold text-white">
              {isProcessing ? t('niu.processing') : t('niu.continueButton')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Footer */}
      <View className="py-4 flex-row justify-center items-center gap-2">
        <Ionicons name="shield-checkmark" size={18} color="orange" />
        <Text className="text-sm text-white">
          {t('niu.securityNotice')}
        </Text>
      </View>

      <StatusBar style="light" />
    </View>
  );
};

export default NIU;