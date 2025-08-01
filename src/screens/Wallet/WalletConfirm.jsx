import { View, Text, Image, TouchableOpacity } from "react-native";
import React from "react";
import { Ionicons,AntDesign } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import TopLogo from "../../images/TopLogo.png";
//import InfoIcon from "../../images/InfoIcon.png"; // Your green info icon
import { useTranslation } from 'react-i18next';

const walletConfirm = ({ navigation }) => {
  const { t } = useTranslation();

  return (
    <View className="bg-[#181e25] flex-1 pt-0 relative">
      {/* Logo */}
      <View className="absolute -top-12 left-0 right-0 items-center justify-center">
        <Image source={TopLogo} className="h-36 w-40" resizeMode="contain" />
      </View>

      {/* Navigation */}
      <View className="border-b border-dashed border-white flex-row justify-between py-4 mt-10 items-center mx-5 pt-5">
        <TouchableOpacity onPress={() => navigation.openDrawer()} className="ml-auto">
          <Ionicons name="menu-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View className="flex-1 bg-white rounded-t-3xl px-6 justify-center items-center">
       <View className="items-center  mb-5">
        <View className="bg-[#7ddd7d] w-20 h-20 rounded-full justify-center items-center">
            <Text className="text-white text-5xl font-bold">i</Text>
        </View>
        </View>


        {/* Message */}
        <Text className="text-center text-gray-500 text-sm leading-6 px-4 mb-10">
           {t("walletRecharge.message")}
        </Text>

        {/* Buttons */}
        <View className="flex-row gap-4 mt-12">
          <TouchableOpacity
            className="border border-[#7ddd7d] px-6 py-2 rounded-full"
            onPress={() => navigation.goBack()}
          >
            <Text className="text-[#181e25] font-bold">{t("walletRecharge.cancel")}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-[#7ddd7d] px-6 py-2 rounded-full"
           onPress={() => navigation.navigate("MainTabs")}
          >
            <Text className="text-black font-bold">{t("walletRecharge.valid")}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer */}
      <View className="py-3 flex-row justify-center items-center bg-[#181e25]">
        <Ionicons name="shield-checkmark" size={18} color="orange" />
        <Text className="text-sm text-white ml-2">
          {t("walletRecharge.securityWarning")}
        </Text>
      </View>

      <StatusBar style="light" />
    </View>
  );
};

export default walletConfirm;
