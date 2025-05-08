import { View, Text, Image, TouchableOpacity, Dimensions } from "react-native";
import React from "react";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import TopLogo from "../../images/TopLogo.png";
import { useDispatch } from 'react-redux';
import KycTab from "../../components/KycTab";
import { setNiuDocument } from '../../features/Kyc/kycReducer';
import { useTranslation } from 'react-i18next';

const NIU = ({ navigation }) => {
  const { t } = useTranslation();
  const { width } = Dimensions.get("screen");
  const dispatch = useDispatch();
  
  const handleNext = () => {
    navigation.navigate("Camera", { 
      purpose: 'niu',
      onCapture: (image) => {
        dispatch(setNiuDocument({
          uri: image.uri,
          type: 'image/jpeg',
          name: `niu_${Date.now()}.jpg`
        }));
        navigation.navigate("KycResume");
      }
    });
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
        </View>

        <TouchableOpacity
          className="mb-2 mt-auto bg-[#7ddd7d] py-3 rounded-full w-[85%] mx-auto"
          onPress={handleNext}
        >
          <Text className="text-xl text-center font-bold">
            {t('niu.takePhotoButton')}
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