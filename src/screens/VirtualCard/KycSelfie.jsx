import { View, Text, Image, TouchableOpacity, Dimensions } from "react-native";
import React from "react";
import TopLogo from "../../images/TopLogo.png";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import IDShoot from "../../images/IDShoot.png";
import KycTab from "../../components/KycTab";
import { useDispatch } from 'react-redux';
import { setSelfie } from '../../features/Kyc/kycReducer';
import { useTranslation } from 'react-i18next';

const KycSelfie = ({ navigation }) => {
  const { t } = useTranslation();
  const { width } = Dimensions.get("screen");
  const dispatch = useDispatch();
  
  const handleNext = () => {
    navigation.navigate("Camera", { 
      purpose: 'selfie',
      onCapture: (image) => {
        dispatch(setSelfie(image));
        navigation.navigate("KycResume");
      }
    });
  };

  return (
    <View className="bg-[#181e25] flex-1 pt-0 relative">
      {/* Header */}
      <View className="absolute -top-12 left-0 right-0 items-center justify-center">
        <Image source={TopLogo} className="h-36 w-40" resizeMode="contain" />
      </View>

      <View className="border-b border-dashed border-white flex-row justify-between py-4 mt-10 items-center mx-5 pt-5">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="left" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.openDrawer()} className="ml-auto">
          <Ionicons name="menu-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View className="border border-dashed border-gray-300 my-1" />
      <Text className="text-center text-white text-2xl my-3">
        {t('kycSelfie.title')}
      </Text>

      <View className="flex-1 pb-3 overflow-hidden bg-white rounded-t-3xl items-center">
        <KycTab isActive="2" />
        
        <Text className="font-bold text-gray-800 mt-3">
          {t('kycSelfie.selfie')}
        </Text>
        <Text className="text-center text-gray-400 text-sm">
          {t('kycSelfie.instruction')}
        </Text>
        
        <Image
          source={require("../../images/IDShoot.png")}
          className="w-[80%] mx-auto mt-2"
          style={{ height: width / 1.77 }}
          resizeMode="contain"
        />

        <Text className="font-bold text-gray-800 my-3 text-center mx-6">
          {t('kycSelfie.howToTitle')}
        </Text>
        
        <View className="w-[89%] mx-auto px-6">
          {t('kycSelfie.tips', { returnObjects: true }).map((tip, index) => (
            <Text key={index} className="text-gray-400 my-1">
              {tip}
            </Text>
          ))}
        </View>

        <TouchableOpacity
          className="mb-2 mt-auto bg-[#7ddd7d] py-3 rounded-full w-[85%] mx-auto"
          onPress={handleNext}
        >
          <Text className="text-xl text-center font-bold">
            {t('kycSelfie.takeSelfieButton')}
          </Text>
        </TouchableOpacity>
      </View>

      <View className="py-4 flex-row justify-center items-center gap-2">
        <Ionicons name="shield-checkmark" size={18} color="orange" />
        <Text className="text-sm text-white">
          {t('kycSelfie.securityNotice')}
        </Text>
      </View>

      <StatusBar style="light" />
    </View>
  );
};

export default KycSelfie;