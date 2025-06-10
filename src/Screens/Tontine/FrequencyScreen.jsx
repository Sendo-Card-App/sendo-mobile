import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";
import Loader from "../../components/Loader";

const TopLogo = require("../../Images/TopLogo.png");

export default function FrequencyScreen({ navigation, route }) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  // Frequencies with translated labels but fixed values
  const frequencies = [
    { label: t("frequency.quotidien"), value: "DAILY" },
    { label: t("frequency.hebdomadaire"), value: "WEEKLY" },
    { label: t("frequency.mensuel"), value: "MONTHLY" },
  ];

  const handleNext = () => {
    if (!selected) {
      Toast.show({
        type: "error",
        text1: "Sélection requise",
        text2: "Veuillez sélectionner une fréquence de cotisation.",
      });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.navigate("Method", {
        ...route.params,
        frequency: selected, // DAILY, WEEKLY, MONTHLY
      });
    }, 500);
  };

  return (
    <View className="flex-1 bg-[#0F111A] px-4 pt-16 relative">
      <Toast position="top" />

      <View className="flex-row mb-4 items-center justify-between px-4">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      <View className="absolute top-[-48] left-0 right-0 items-center">
        <Image source={TopLogo} className="h-[130] w-[160]" resizeMode="contain" />
      </View>

      <View className="border border-dashed border-gray-300 mb-6" />

      <Text className="text-green-400 text-lg font-semibold mb-6">
        {t("frequencyScreen.title")}
      </Text>

      <View className="flex-row justify-between mb-10">
        {frequencies.map((item) => {
          const isSelected = selected === item.value;
          return (
            <TouchableOpacity
              key={item.value}
              onPress={() => setSelected(item.value)}
              className={`px-4 py-2 rounded-full border ${
                isSelected ? "bg-green-400 border-green-400" : "border-green-400"
              }`}
            >
              <Text className={`${isSelected ? "text-black" : "text-green-400"} font-semibold`}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        onPress={handleNext}
        className="bg-green-400 py-3 rounded-full items-center"
      >
        {loading ? (
          <Loader size="small" color="white" />
        ) : (
          <Text className="text-black font-semibold">
            {t("common5.nextButton")}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
