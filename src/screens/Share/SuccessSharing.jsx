import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

import TopLogo from "../../images/TopLogo.png";
import ButtomLogo from "../../images/ButtomLogo.png";
import good from "../../images/icones/good.png";

const SuccessSharing = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();

  const { transactionDetails } = route.params || {};

  return (
    <SafeAreaView className="flex-1 bg-[#0F121C]">
      <StatusBar barStyle="light-content" />

      <View className="absolute -top-12 left-0 right-0 items-center justify-center">
        <Image source={TopLogo} className="h-36 w-40" resizeMode="contain" />
      </View>

      <View className="border-b border-dashed border-white flex-row justify-between py-4 mt-3 items-center mx-5 pt-5">
        <Image
          source={ButtomLogo}
          resizeMode="contain"
          className="h-[50px] w-[150px]"
        />
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>
      <View className="border border-dashed border-gray-300 my-1" />

      <View className="flex-1 bg-white mx-5 mt-5 mb-5 px-8 rounded-2xl justify-center items-center shadow-md">
        <Image source={good} resizeMode="contain" className="w-24 h-24 mb-8" />

        <Text className="text-[22px] font-bold text-center text-[#0D1C6A] mb-4">
          {t("successSharing.title")}
        </Text>

        {/* Custom message passed via transactionDetails */}
        {transactionDetails && (
          <Text className="text-base text-center text-[#555] leading-6 mb-6">
            {transactionDetails}
          </Text>
        )}

        <Text className="text-sm text-center text-[#888] mb-10">
          {t("successSharing.notify")}
        </Text>

        <View className="w-full px-4 pb-10">
          <TouchableOpacity
             onPress={() => navigation.navigate("MainTabs")}
            className="bg-[#4CAF50] py-4 rounded-xl items-center justify-center shadow"
          >
            <Text className="text-white text-base font-semibold">
              {t("successSharing.backButton")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default SuccessSharing;
