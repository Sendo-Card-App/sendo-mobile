import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StatusBar,
} from "react-native";
import ButtomLogo from "../../images/ButtomLogo.png";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

const TopLogo = require("../../images/TopLogo.png");

const TontineSetting = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();

  const { tontineId, tontine } = route.params;

  const options = [
    { title: t("tontineSetting.base_info"), screen: "TontineBaseInfo" },
    { title: t("tontineSetting.frequency"), screen: "TontineFrequency" },
    { title: t("tontineSetting.order"), screen: "TontineOrder" },
    { title: t("tontineSetting.funds"), screen: "TontineFunds" },
    { title: t("tontineSetting.penalties"), screen: "TontinePenalties" },
  ];

  const handleOptionPress = (screenName) => {
    navigation.navigate(screenName, { tontine });
  };

  return (
    <View className="flex-1 bg-[#0E1111] px-5 pt-14">
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View className="flex-row justify-between items-center px-4">
        <Image
          source={ButtomLogo}
          resizeMode="contain"
          className="h-[40px] w-[120px]"
        />
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={28} color="white" />
        </TouchableOpacity>
      </View>

      {/* Top Centered Logo */}
      <View className="absolute left-0 right-0 -top-6 items-center">
        <Image
          source={TopLogo}
          style={{ height: 100, width: 155 }}
          resizeMode="contain"
        />
      </View>

      {/* Divider */}
      <View className="border border-dashed border-gray-500 my-6" />

      {/* Options List */}
      <View className="space-y-3">
        {options.map((item, index) => (
          <TouchableOpacity
            key={index}
            className="bg-[#1A1E1E] rounded-xl px-4 py-4 mt-5 border border-gray-800"
            onPress={() => handleOptionPress(item.screen)}
          >
            <View className="flex-row justify-between items-center">
              <Text className="text-green-400 font-medium text-base">
                {item.title}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#22C55E" />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Delete Button */}
      <View className="mt-10">
        <TouchableOpacity className="border border-red-500 py-3 rounded-full">
          <Text className="text-center text-red-500 font-semibold text-base">
            {t("tontineSetting.delete")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default TontineSetting;
