import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";

import TopLogo from "../../Images/TopLogo.png";

const AmountDistribution = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();

  const initialParticipants = () => {
    let pts = route.params.participants.map(p => ({ ...p, amount: p.amount || 0 }));

    if (!pts.some(p => p.id === "self")) {
      pts.push({
        id: "self",
        matriculeWallet: route.params.userWalletId,
        name: route.params.userFullName || "Moi",
        amount: 0,
      });
    }

    return pts;
  };

  const [participants, setParticipants] = useState(initialParticipants());
  const totalAmount = route.params.totalAmount;
  const remainingAmount = totalAmount - participants.reduce((sum, p) => sum + p.amount, 0);

  const handleAmountChange = (id, value) => {
    const numericValue = Number(value) || 0;
    setParticipants(prev =>
      prev.map(p => (p.id === id ? { ...p, amount: numericValue } : p))
    );
  };

  const handleNext = () => {
  if (remainingAmount !== 0) {
    Toast.show({
      type: "error",
      text1: "Erreur de distribution",
      text2: `Le montant total doit être exactement ${totalAmount}. Reste: ${remainingAmount}`,
    });
    return;
  }

  Toast.show({
    type: "success",
    text1: "Distribution validée",
    text2: "Tous les montants ont été répartis correctement.",
  });

  navigation.navigate("ConfirmTransfer", {
    ...route.params,
    participants,
  });
};


  return (
    <View className="bg-[#181e25] flex-1 pt-0 relative">
      <StatusBar style="light" />
      <Toast position="top" />

      {/* Header and Logo */}
      <View className="absolute -top-12 left-0 right-0 items-center justify-center">
        <Image source={TopLogo} className="h-36 w-40" resizeMode="contain" />
      </View>

      <View className="border-b border-dashed border-white flex-row justify-between py-4 mt-10 items-center mx-5 pt-5">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="arrowleft" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>
       <View className="border border-dashed border-gray-300 " />
      {/* Stepper */}
      <View className="flex-row items-center justify-center px-4 my-4 space-x-2">
        <Text className="w-6 h-6 text-white text-center rounded-full bg-[#2B2F38] leading-6">1</Text>
        <View className="flex-1 h-[1px] bg-gray-400" />
        <Text className="w-6 h-6 text-white text-center rounded-full bg-[#2B2F38] leading-6">2</Text>
        <View className="flex-1 h-[1px] bg-gray-400" />
        <Text className="w-6 h-6 text-white text-center rounded-full bg-[#7ddd7d] leading-6">3</Text>
      </View>

      {/* Content */}
      <View className="flex-1 gap-3 bg-white px-6 pt-6 pb-4 rounded-t-3xl">
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text className="text-lg font-bold text-center mb-5">
            {t("amountDistribution.title")}
          </Text>

          {/* Total Amount */}
          <View className="bg-white rounded-lg p-4 mb-4 shadow">
            <View className="flex-row justify-between border-b border-gray-300 pb-2 mb-2">
              <Text className="text-base font-bold">{t("amountDistribution.totalAmount")}</Text>
              <Text className="text-base font-bold">
                {totalAmount.toLocaleString()} XAF
              </Text>
            </View>
          </View>

          {/* Remaining Amount */}
          <View className="bg-[#7ddd7d] rounded-lg p-4 mb-6">
            <View className="flex-row justify-between">
              <Text className="text-base text-white">{t("amountDistribution.remaining")}</Text>
              <Text className={`text-base ${remainingAmount < 0 ? "text-red-500" : "text-white"}`}>
                {remainingAmount.toLocaleString()} XAF
              </Text>
            </View>
          </View>

          {/* Participants List */}
          {participants.map((participant) => (
            <View
              key={participant.id}
              className="flex-row justify-between items-center mb-4 pb-2 border-b border-gray-100"
            >
              <Text className="text-base">{participant.name}</Text>
              <View className="flex-row items-center border border-gray-200 rounded px-2 py-1">
                <TextInput
                  className="w-24 text-right pr-2"
                  keyboardType="numeric"
                  value={participant.amount.toString()}
                  onChangeText={(text) => handleAmountChange(participant.id, text)}
                />
                <Text className="ml-2">XAF</Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Next Button */}
        <TouchableOpacity
          className="bg-[#7ddd7d] py-4 mt-10 mb-10 rounded-lg items-center"
          onPress={handleNext}
        >
          <Text className="text-white font-bold">{t("amountDistribution.nextButton")}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AmountDistribution;
