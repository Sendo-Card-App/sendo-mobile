import React from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import ButtomLogo from "../../images/ButtomLogo.png";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width } = Dimensions.get("window");

const TermsAndConditions = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { onAccept } = route.params || {};

  // Terms content + added fees notice
  const termsContent = [
  ...(t("terms.content")?.split("\n") || []),
  t("terms.feesNotice"),
];


  const handleAccept = async () => {
    try {
      await AsyncStorage.setItem("hasAcceptedTerms", "true");
      if (typeof onAccept === "function") {
        onAccept(); // Call the callback if passed
      }
      navigation.navigate("TontineList");
    } catch (error) {
      console.error("Error saving acceptance:", error);
    }
  };

  return (
    <View className="flex-1 bg-white">
      {/* Fixed Header */}
      <View className="bg-[#7ddd7d] pt-12 pb-4 px-4 flex-row justify-between items-center z-10">
        <Image
          source={ButtomLogo}
          resizeMode="contain"
          className="h-[50px] w-[150px]"
        />
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={26} color="black" />
        </TouchableOpacity>
      </View>

      {/* Divider */}
      <View className="border border-dashed border-black mx-4 my-2" />

      {/* Scrollable Content */}
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} className="px-6">
        {/* Title & Intro */}
        <Text className="text-black font-bold text-[22px] mt-4 mb-2">
          {t("terms.title")}
        </Text>
        <Text className="text-[18px] font-semibold text-black mb-4">
          {t("terms.intro")}
        </Text>

        {/* Terms List */}
        {termsContent.map((line, index) => (
          <Text
            key={index}
            className="text-[16px] leading-6 text-gray-700 mb-2"
          >
            {line.trim()}
          </Text>
        ))}

        {/* Accept Button */}
        <View className="mt-10 mb-10">
          <TouchableOpacity
            onPress={handleAccept}
            className="bg-[#7ddd7d] py-5 rounded-full items-center shadow-md"
          >
            <Text className="text-black font-bold text-[16px]">
              {t("terms.accept")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default TermsAndConditions;
