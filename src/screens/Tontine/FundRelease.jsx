import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Toast } from "react-native-toast-message/lib/src/Toast";
import { Checkbox, Provider as PaperProvider } from "react-native-paper";

const TopLogo = require("../../images/TopLogo.png");

export default function FundRelease() {
  const navigation = useNavigation();
  const route = useRoute();
  const { response } = route.params; // API response passed via route params
  const [deductPenalty, setDeductPenalty] = useState(true);

  // Example fixed amounts (you can replace with dynamic data if needed)
  const totalAmount = 700000;
  const penaltyAmount = 70000;
  const finalAmount = deductPenalty ? totalAmount - penaltyAmount : totalAmount;

  // Format ISO date nicely
  const formatDate = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <PaperProvider>
      <ScrollView className="flex-1 bg-[#0A0F1F] px-4 pt-14">
        <Toast position="top" />

        {/* Top bar */}
        <View className="flex-row mb-4 items-center justify-between px-4">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <Ionicons name="menu-outline" size={26} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Top logo */}
        <View className="absolute top-[-48] left-0 right-0 items-center">
          <Image
            source={TopLogo}
            className="h-[130px] w-[160px]"
            resizeMode="contain"
          />
        </View>

        {/* Border */}
        <View className="border border-dashed border-gray-300 mb-6" />

        {/* Title */}
        <Text className="text-green-500 text-xl font-bold mb-4">
          Versement de fonds
        </Text>

        {/* Info Card */}
        <View className="bg-[#161C2F] rounded-lg p-4 space-y-3">
          <View className="flex-row justify-between">
            <Text className="text-white font-bold">ID du bénéficiaire:</Text>
            <Text className="text-white">{response.data.userId}</Text>
          </View>

          <View className="flex-row justify-between">
            <Text className="text-white font-bold">Membre depuis:</Text>
            <Text className="text-white">{response.data.dateInscription}</Text>
          </View>

          {/* <View className="flex-row justify-between">
            <Text className="text-white font-bold">Pénalités:</Text>
            <Text className="text-white">
              {penaltyAmount.toLocaleString()} xaf
            </Text>
          </View> */}

          <View className="flex-row justify-between items-center">
            <Text className="text-white">Déduire les pénalités de son gain</Text>
            <Checkbox
              status={deductPenalty ? "checked" : "unchecked"}
              onPress={() => setDeductPenalty(!deductPenalty)}
              color="#22c55e"
              uncheckedColor="white"
            />
          </View>

          <View className="flex-row justify-between">
            <Text className="text-white font-bold">Totale:</Text>
            <Text className="text-white">
             {response.data.montantDistribue.toLocaleString()} xaf
            </Text>
          </View>
        </View>

        {/* Distribution info from response */}
        {/* {response && response.status === 200 && response.data && (
          <View className="bg-[#223344] rounded-lg p-4 mt-8 space-y-3">
            <Text className="text-green-400 font-bold text-lg mb-2">Détails de la distribution</Text>
            <View className="flex-row justify-between">
              <Text className="text-white font-semibold">Numéro distribution:</Text>
              <Text className="text-white">{response.data.numeroDistribution}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-white font-semibold">Date distribution:</Text>
              <Text className="text-white">{formatDate(response.data.dateDistribution)}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-white font-semibold">Montant distribué:</Text>
              <Text className="text-white">{response.data.montantDistribue.toLocaleString()} xaf</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-white font-semibold">État:</Text>
              <Text className="text-white">{response.data.etat}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-white font-semibold">Tontine ID:</Text>
              <Text className="text-white">{response.data.tontineId}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-white font-semibold">Bénéficiaire ID:</Text>
              <Text className="text-white">{response.data.beneficiaireId}</Text>
            </View>
          </View>
        )} */}

        {/* Button */}
        <TouchableOpacity
          onPress={() =>
              navigation.navigate("TontineList")
            }
          className="bg-green-500 py-4 rounded-full items-center mt-10"
        >
          <Text className="text-black font-bold text-base">Suivant</Text>
        </TouchableOpacity>
      </ScrollView>
    </PaperProvider>
  );
}
