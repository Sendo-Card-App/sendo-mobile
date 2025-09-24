import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, ScrollView } from "react-native";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";
import Loader from "../../components/Loader";

const TopLogo = require("../../images/TopLogo.png");

export default function Method({ navigation, route }) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const options = [
    // {
    //   id: "AUTOMATIC ",
    //   title: t("method1.automatic"),
    //   description: t("method1.automaticDescription"),
    //   icon: "sync-outline"
    // },
    {
      id: "MANUAL",
      title: t("method1.manual"),
      description: t("method1.manualDescription"),
      icon: "cash-outline"
    }
  ];

  const handleSelect = (id) => {
    setSelected(id);
  };

  const handleNext = () => {
    if (!selected) {
      Toast.show({
        type: "error",
        text1: "Sélection requise",
        text2: "Veuillez sélectionner un mode de versement.",
      });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.navigate("OrderSelection", {  
        ...route.params,
        paymentMethod: selected,
      });
    }, 500);
  };

  return (
    <ScrollView className="flex-1 bg-[#0C121D] px-4 pt-20">
      <Toast position="top" />

      <View className="flex-row mb-4 items-center justify-between px-4">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="left" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      <View className="absolute top-[-55] left-0 right-0 items-center">
        <Image source={TopLogo} className="h-[120] w-[160]" resizeMode="contain" />
      </View>

      <View className="border border-dashed border-gray-300 mb-6" />

      <Text className="text-lg text-green-400 font-semibold mb-6">
        {t("method1.title")}
      </Text>

      <View className="flex-row justify-between mb-6">
        {options.map((option) => (
          <TouchableOpacity
            key={option.id}
            onPress={() => handleSelect(option.id)}
            className={`w-[48%] rounded-lg px-3 py-4 ${
              selected === option.id ? "bg-green-300" : "bg-green-100"
            }`}
          >
            <View className="items-center mb-2">
              <Ionicons name={option.icon} size={28} color="#0C121D" />
            </View>
            <Text className="font-bold text-black text-center mb-1">
              {option.title}
            </Text>
            <Text className="text-xs text-black text-center">
              {option.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        onPress={handleNext}
        className="bg-green-400 py-3 rounded-full items-center mb-10"
      >
        {loading ? (
          <Loader size="small" color="white" />
        ) : (
          <Text className="text-black font-semibold">
            {t("common5.nextButton")}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}