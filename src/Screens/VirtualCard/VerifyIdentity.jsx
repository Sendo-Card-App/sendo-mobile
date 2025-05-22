import { View, Text, Image, TouchableOpacity } from "react-native";
import React from "react";
import TopLogo from "../../Images/TopLogo.png";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import VerifyImage from "../../Images/VerifyImage.png";
import { useTranslation } from 'react-i18next';

const VerifyIdentity = ({ navigation }) => {
  const { t } = useTranslation();

  return (
    <View className="bg-[#181e25] flex-1 pt-0 relative">
      {/* Logo */}
      <View className="absolute -top-12 left-0 right-0 items-center justify-center">
        <Image source={TopLogo} className="h-36 w-40" resizeMode="contain" />
      </View>

      {/* Navigation */}
      <View className="border-b border-dashed border-white flex-row justify-between py-4 mt-10 items-center mx-5 pt-5">
        <TouchableOpacity
          onPress={() => navigation.openDrawer()}
          className="ml-auto"
        >
          <Ionicons name="menu-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <View className="border border-dashed border-gray-300 my-1" />
      <Text className="text-center text-white text-2xl my-3">
        {t('verifyIdentity.title')}
      </Text>

      {/* Main Content */}
      <View className="flex-1 gap-6 py-3 bg-white px-8 rounded-t-3xl">
        <View className="my-5">
          <Text className="text-center text-gray-800 text-sm font-bold">
            {t('verifyIdentity.heading')}
          </Text>
        </View>

        <Image
          source={VerifyImage}
          className="w-full h-[300px]"
          resizeMode="center"
        />

        <Text className="text-center text-gray-400 text-xs mt-10">
          {t('verifyIdentity.description')}
          <Text className="font-extrabold underline">
            {t('verifyIdentity.blogLink')}
          </Text>
        </Text>

        <TouchableOpacity
          className="mt-auto bg-[#7ddd7d] py-3 rounded-full mb-8"
          onPress={() => navigation.navigate("KycResume")}
        >
          <Text className="text-xl text-center font-bold">
            {t('verifyIdentity.nextButton')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View className="py-4 flex-row justify-center items-center gap-2">
        <Ionicons name="shield-checkmark" size={18} color="orange" />
        <Text className="text-sm text-white">
          {t('verifyIdentity.securityNotice')}
        </Text>
      </View>

      <StatusBar style="light" />
    </View>
  );
};

export default VerifyIdentity;

