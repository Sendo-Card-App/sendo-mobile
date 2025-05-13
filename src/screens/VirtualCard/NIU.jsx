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
  const [selectedOption, setSelectedOption] = useState(null);
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
        dispatch(setNiuDocument({
          uri: image.uri,
          type: image.type || 'image/jpeg',
          name: `niu_photo_${Date.now()}.jpg`
        }));
        navigation.navigate("KycResume");
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

        dispatch(setNiuDocument({
          uri: result.uri,
          type: fileType || 'application/pdf',
          name: result.name || `niu_document_${Date.now()}.${fileType?.split('/')[1] || 'pdf'}`
        }));
        navigation.navigate("KycResume");
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      Alert.alert(t('niu.documentUploadError'));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleContinue = async () => {
    if (!selectedOption) return;
    
    try {
      if (selectedOption === 'camera') {
        await handleTakePhoto();
      } else if (selectedOption === 'upload') {
        await handleUploadDocument();
      }
    } catch (error) {
      console.error('Error in continue handler:', error);
      Alert.alert(t('niu.generalError'));
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

        <Image
          source={require("../../images/DGI.png")}
          className="w-[80%] mx-auto mt-2"
          style={{ height: width / 1.77 }}
          resizeMode="contain"
        />

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
            className={`flex-row items-center justify-center py-3 rounded-full border-2 ${selectedOption === 'camera' ? 'border-[#7ddd7d] bg-[#7ddd7d]/20' : 'border-gray-300'}`}
            onPress={() => setSelectedOption('camera')}
            disabled={isProcessing}
          >
            <MaterialIcons name="photo-camera" size={24} color={selectedOption === 'camera' ? '#7ddd7d' : 'gray'} />
            <Text className={`ml-2 text-lg font-bold ${selectedOption === 'camera' ? 'text-[#7ddd7d]' : 'text-gray-500'}`}>
              {t('niu.takePhotoButton')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-row items-center justify-center mt-5 py-3 rounded-full border-2 ${selectedOption === 'upload' ? 'border-[#7ddd7d] bg-[#7ddd7d]/20' : 'border-gray-300'}`}
            onPress={() => setSelectedOption('upload')}
            disabled={isProcessing}
          >
            <MaterialIcons name="picture-as-pdf" size={24} color={selectedOption === 'upload' ? '#7ddd7d' : 'gray'} />
            <Text className={`ml-2 text-lg font-bold ${selectedOption === 'upload' ? 'text-[#7ddd7d]' : 'text-gray-500'}`}>
              {t('niu.uploadDocumentButton')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          className={`mb-2 mt-auto py-3 rounded-full w-[85%] mx-auto ${selectedOption ? 'bg-[#7ddd7d]' : 'bg-gray-300'}`}
          onPress={handleContinue}
          disabled={!selectedOption || isProcessing}
        >
          <Text className={`text-xl text-center font-bold ${selectedOption ? 'text-white' : 'text-gray-500'}`}>
            {isProcessing ? t('niu.processing') : t('niu.continueButton')}
          </Text>
        </TouchableOpacity>
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