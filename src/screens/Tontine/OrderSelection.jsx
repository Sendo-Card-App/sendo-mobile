import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";
import Loader from "../../components/Loader";
import { useCreateTontineMutation } from "../../services/Tontine/tontineApi";

const TopLogo = require("../../images/TopLogo.png");

export default function OrderSelection({ navigation, route }) {
  const { t } = useTranslation();
  const [selectedOption, setSelectedOption] = useState(null);
  const [loading, setLoading] = useState(false);
  const [createTontine] = useCreateTontineMutation();

  const options = [
    {
      id: 1,
      title: t("orderSelection.fixedOrder"),
      description: t("orderSelection.fixedDescription"),
    },
    {
      id: 2,
      title: t("orderSelection.randomOrder"),
      description: t("orderSelection.randomDescription"),
    },
  ];

  const handleNext = async () => {
    if (!selectedOption) {
      Toast.show({
        type: "error",
        text1: "Sélection requise",
        text2: "Veuillez sélectionner un mode de sélection.",
      });
      return;
    }

    const orderType = selectedOption === 1 ? "FIXE" : "ALEATOIRE";

    const data = {
      nom: route?.params?.name,
      type: orderType,
      frequence: route?.params?.frequency,
      montant: route?.params?.amount,
      modeVersement: route?.params?.paymentMethod,
      description: route?.params?.description,
    };

    try {
      setLoading(true);
      const response = await createTontine(data).unwrap();
      console.log("Tontine created successfully:", response);

      // Navigate directly to next screen
      navigation.navigate("Participant", { tontineId: response?.data?.id });
    } catch (error) {
      console.log("Réponse du backend :", JSON.stringify(error, null, 2));

      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: error.data?.message || "Échec de la création de la tontine",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-[#0C121D] px-4 pt-20">
      <Toast position="top" />

      <View className="flex-row mb-4 items-center justify-between px-4">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      <View className="absolute top-[-55] left-0 right-0 items-center">
        <Image
          source={TopLogo}
          className="h-[120] w-[160]"
          resizeMode="contain"
        />
      </View>

      <View className="border border-dashed border-gray-300 mb-6" />

      <Text className="text-lg text-green-400 font-semibold mb-6">
        {t("orderSelection.title")}
      </Text>

      {options.map((option) => (
        <TouchableOpacity
          key={option.id}
          onPress={() => setSelectedOption(option.id)}
          className={`rounded-lg p-4 mb-4 ${
            selectedOption === option.id ? "bg-green-500" : "bg-white"
          }`}
        >
          <Text className="font-semibold text-black">{option.title}</Text>
          <Text className="text-sm text-gray-600 mt-1">
            {option.description}
          </Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        onPress={handleNext}
        className="bg-green-400 py-5 rounded-full items-center mt-6 mb-10"
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
