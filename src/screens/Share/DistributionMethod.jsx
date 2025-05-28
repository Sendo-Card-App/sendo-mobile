import React from "react";
import { View, Text, TouchableOpacity, Image, ScrollView } from "react-native";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { StatusBar } from "expo-status-bar";

import TopLogo from "../../images/TopLogo.png";
import shareImage from "../../images/icones/shareImage.png";
import manualImage from "../../images/icones/manual.png";

const DistributionMethod = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();

  const handleMethodSelect = (method) => {
    if (method === "auto") {
      navigation.navigate("ConfirmTransfer", {
        ...route.params,
        methodCalculatingShare: "auto",
        participants: route.params.participants.map((p) => ({
          matriculeWallet: p.matriculeWallet,
        })),
      });
    } else {
      navigation.navigate("AmountDistribution", {
        ...route.params,
        methodCalculatingShare: "manual",
      });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#181e25" }}>
      <StatusBar style="light" />

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

      {/* Stepper */}
      <View className="flex-row items-center justify-center px-4 my-4 space-x-2">
        <Text className="w-6 h-6 text-white text-center rounded-full bg-[#2B2F38] leading-6">1</Text>
        <View className="flex-1 h-[1px] bg-gray-400" />
        <Text className="w-6 h-6 text-white text-center rounded-full bg-[#2B2F38] leading-6">2</Text>
        <View className="flex-1 h-[1px] bg-gray-400" />
        <Text className="w-6 h-6 text-white text-center rounded-full bg-[#7ddd7d] leading-6">3</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
        <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 50, textAlign: "center", color: "#7ddd7d" }}>
          {t("distributionMethod.title")}
        </Text>

        {/* Automatic Option */}
        <TouchableOpacity
          style={{
            backgroundColor: "#7ddd7d",
            padding: 20,
            borderRadius: 10,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: "#e0e0e0",
            flexDirection: "row",
            alignItems: "center",
          }}
          onPress={() => handleMethodSelect("auto")}
        >
          <Image source={shareImage} style={{ width: 50, height: 50, resizeMode: "contain", marginRight: 15 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
              {t("distributionMethod.automatic.title")}
            </Text>
            <Text style={{ color: "#666" }}>{t("distributionMethod.automatic.description")}</Text>
          </View>
        </TouchableOpacity>

        {/* Manual Option */}
        <TouchableOpacity
          style={{
            backgroundColor: "#7ddd7d",
            padding: 20,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: "#e0e0e0",
            flexDirection: "row",
            alignItems: "center",
          }}
          onPress={() => handleMethodSelect("manual")}
        >
          <Image source={manualImage} style={{ width: 50, height: 50, resizeMode: "contain", marginRight: 15 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
              {t("distributionMethod.manual.title")}
            </Text>
            <Text style={{ color: "#666" }}>{t("distributionMethod.manual.description")}</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default DistributionMethod;
