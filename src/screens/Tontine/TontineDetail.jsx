import React from "react";
import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

const TopLogo = require("../../images/TopLogo.png");

const TontineDetail = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { tontineId, tontine } = route.params;
  const { t } = useTranslation();

  return (
    <View className="flex-1 bg-[#0E1111] pt-12">
      <Toast position="top" />

      {/* Top bar */}
      <View className="flex-row mb-4 items-center justify-between px-4">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="left" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Center logo */}
      <View className="absolute top-[-48px] left-0 right-0 items-center">
        <Image source={TopLogo} className="h-[130px] w-[160px]" resizeMode="contain" />
      </View>

      {/* Dotted divider */}
      <View className="border border-dashed border-gray-300 mb-6 mx-6" />

      {/* Title */}
      <Text className="text-white text-xl font-semibold text-center mb-6">
        {tontine?.nom ?? t("tontineDetail.defaultName")}
      </Text>

      {/* Action buttons */}
      <View className="px-6 space-y-4">
        <View className="flex-row justify-between">
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("Members", {
                tontineId,
                tontine,
              })
            }
            className="bg-[#7ddd7d] rounded-lg w-[47%] h-32 justify-center items-center"
          >
            <Ionicons name="people" size={40} color="#000" />
            <Text className="text-black font-semibold mt-2">{t("tontineDetail.members")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              navigation.navigate("Cotisations", {
                tontineId,
                tontine,
              })
            }
            className="bg-[#7ddd7d] rounded-lg w-[47%] h-32 justify-center items-center"
          >
            <Ionicons name="cash-outline" size={40} color="#000" />
            <Text className="text-black font-semibold mt-2">{t("tontineDetail.contributions")}</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-between">
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("TontineSetting", {
                tontineId,
                tontine,
              })
            }
            className="bg-[#7ddd7d] rounded-lg mt-5 w-[47%] h-32 justify-center items-center"
          >
            <View className="items-center">
                <Ionicons name="information-circle-outline" size={40} color="#000" />
              <Text className="text-black font-semibold mt-2 text-center">
                {t("tontineDetail.settings")}
              </Text>
            </View>
          </TouchableOpacity>


          <TouchableOpacity
            onPress={() =>
              navigation.navigate("MemberContribution", {
                tontineId,
                tontine,
              })
            }
            className="bg-[#7ddd7d] rounded-lg mt-5 w-[47%] h-32 justify-center items-center"
          >
            <Ionicons name="hand-left-outline" size={40} color="#000" />
            <Text className="text-black font-semibold mt-2">{t("tontineDetail.contribute")}</Text>
          </TouchableOpacity>
        </View>

        {/* Informational message */}
        <Text className="text-red-400 mt-10 text-center text-sm">
          ⚠️ {t("tontineDetail.rotationWarning", "Vous devez définir l’ordre de rotation avant que les membres puissent cotiser.")}
        </Text>
      </View>

      {/* Floating Home button */}
      <TouchableOpacity
        onPress={() => navigation.navigate("MainTabs")}
        style={styles.floatingHomeButton}
      >
        <Ionicons name="home" size={44} color="#7ddd7d" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingHomeButton: {
    position: "absolute",
    bottom: 24,
    right: 24,
    backgroundColor: "#1A1A1A",
    padding: 10,
    borderRadius: 50,
    elevation: 10,
  },
});

export default TontineDetail;
