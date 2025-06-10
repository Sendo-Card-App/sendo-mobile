import React, { useState } from "react";
import { View, Text, Image, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";
import Loader from "../../components/Loader";

const TopLogo = require("../../Images/TopLogo.png");

export default function CreateTontine({ navigation }) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    if (!name.trim() || !description.trim() || !amount.trim()) {
      Toast.show({
        type: "error",
        text1: "Champs requis",
        text2: "Veuillez remplir tous les champs.",
      });
      return;
    }

    if (isNaN(Number(amount)) || Number(amount) <= 0) {
      Toast.show({
        type: "error",
        text1: "Montant invalide",
        text2: "Le montant doit être un nombre positif.",
      });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      Toast.show({
        type: "success",
        text1: "Succès",
        text2: "Tontine créée avec succès.",
      });
      navigation.navigate("FrequencyScreen", {
        name,
        description,
        amount: Number(amount),
      });
    }, 1000);
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
        {t("createTontine.stepTitle")}
      </Text>

      <View className="mb-4">
        <Text className="text-white font-semibold mb-1">
          {t("createTontine.nameLabel")}
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t("createTontine.namePlaceholder")}
          placeholderTextColor="#888"
          className="bg-transparent border border-white rounded-full px-4 py-3 text-white"
        />
      </View>

      <View className="mb-4">
        <Text className="text-white font-semibold mb-1">
          {t("createTontine.descriptionLabel")}
        </Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder={t("createTontine.descriptionPlaceholder")}
          placeholderTextColor="#888"
          className="bg-transparent border border-white rounded-full px-4 py-3 text-white"
        />
      </View>

      <View className="mb-6">
        <Text className="text-white font-semibold mb-1">
          {t("createTontine.amountLabel")}
        </Text>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          placeholder={t("createTontine.amountPlaceholder")}
          placeholderTextColor="#888"
          keyboardType="numeric"
          className="bg-transparent border border-white rounded-full px-4 py-3 text-white"
        />
      </View>

      <TouchableOpacity
        onPress={handleNext}
        className="bg-green-400 py-3 rounded-full items-center"
      >
        {loading ? (
          <Loader size="small" color="white" />
        ) : (
          <Text className="text-black font-semibold">
            {t("createTontine.nextButton")}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}