import {
  View,
  Text,
  Image,
  TouchableOpacity,
} from "react-native";
import React from "react";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import TopLogo from "../../images/TopLogo.png";
import { useTranslation } from 'react-i18next';

const WalletOk = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { status = "UNKNOWN", transactionId, type } = route.params;

  return (
    <View className="bg-[#181e25] flex-1 pt-0 relative">
      <View className="absolute -top-12 left-0 right-0 items-center justify-center">
        <Image source={TopLogo} className="h-36 w-40" resizeMode="contain" />
      </View>

      <View className="border-b border-dashed border-white flex-row justify-between py-4 mt-10 items-center mx-5 pt-5">
        <TouchableOpacity onPress={() => navigation.openDrawer()} className="ml-auto">
          <Ionicons name="menu-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View className="flex-1 bg-white rounded-t-3xl px-6 justify-center items-center">
        <View className="items-center mb-5">
          <View className="bg-[#7ddd7d] w-20 h-20 rounded-full justify-center items-center">
            <Text className="text-white text-5xl font-bold">i</Text>
          </View>
        </View>

        <View className="items-center mb-8 px-4">
          <Text className="text-center text-gray-500 text-sm leading-6 mb-2">
            {status === "SUCCESS"
              ? "votre retrait a été effectué avec succès."
              : status === "PENDING"
              ? "Votre demande est en cours de traitement. Veuillez patienter."
              : "Échec de la transaction. Veuillez réessayer plus tard."}
          </Text>
          {transactionId && (
            <Text className="text-xs text-gray-500 mt-1">
              ID: {transactionId}
            </Text>
          )}
          {type && (
            <Text className="text-xs text-gray-500 mt-1">
              Type: {type}
            </Text>
          )}
        </View>

        <View className="flex-row gap-4 mt-12">
          <TouchableOpacity
            className="bg-[#7ddd7d] px-6 py-2 rounded-full"
            onPress={() => navigation.navigate("MainTabs")}
          >
            <Text className="text-black font-bold">{t("walletWithdrawal.cancel")}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="py-3 flex-row justify-center items-center bg-[#181e25]">
        <Ionicons name="shield-checkmark" size={18} color="orange" />
        <Text className="text-sm text-white ml-2">
         {t("walletWithdrawal.securityWarning")}
        </Text>
      </View>

      <StatusBar style="light" />
    </View>
  );
};

export default WalletOk;
