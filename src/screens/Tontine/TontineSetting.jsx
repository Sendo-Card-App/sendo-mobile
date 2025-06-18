import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StatusBar,
  Modal,
  Pressable,
  ScrollView,
} from "react-native";
import ButtomLogo from "../../Images/ButtomLogo.png";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

const TopLogo = require("../../Images/TopLogo.png");

const TontineSetting = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const { tontineId, tontine } = route.params;
   //console.log(tontine)
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState("");

  const options = [
    { title: t("tontineSetting.base_info"), screen: "TontineBaseInfo" },
    { title: t("tontineSetting.frequency"), screen: "TontineFrequency" },
    { title: t("tontineSetting.order"), screen: "TontineOrder" },
    { title: t("tontineSetting.funds"), screen: "TontineFunds" },
    { title: t("tontineSetting.penalties"), screen: "TontinePenalties" },
  ];

const getInfoForModal = (screen) => {
  switch (screen) {
    case "TontineBaseInfo":
      return `Nom de la tontine: ${tontine.nom}\nType: ${tontine.type}\nDescription: ${tontine.description}`;
    case "TontineFrequency":
      return `Fréquence: ${tontine.frequence}\nMode de versement: ${tontine.modeVersement}`;
    case "TontineOrder": {
      // On récupère les tours de distribution
      const tours = tontine.toursDeDistribution || [];
      if (tours.length === 0) {
        return "Aucun tour de distribution défini.";
      }
      // Pour chaque tour, on associe le membre (nom) et son numéro de distribution
      const lines = tours.map((tour) => {
        const member = tontine.membres?.find(m => m.id === tour.beneficiaireId);
        const name = member?.user
          ? `${member.user.firstname} ${member.user.lastname}`
          : `ID ${tour.beneficiaireId}`;
        return `${name}: Tour n°${tour.numeroDistribution}`;
      });
      return lines.join("\n");
    }
    case "TontineFunds":
      return `Solde actuel: ${tontine.compteSequestre?.soldeActuel} XAF\nMontant bloqué: ${tontine.compteSequestre?.montantBloque} XAF\nÉtat du compte: ${tontine.compteSequestre?.etatCompte}`;
    case "TontinePenalties":
      return `Nombre de pénalités: ${tontine.membres?.reduce((acc, m) => acc + (m.penalites?.length || 0), 0)}`;
    default:
      return "";
  }
};



  const handleOptionPress = (screenName) => {
    const info = getInfoForModal(screenName);
    setSelectedInfo(info);
    setModalVisible(true);
  };

  return (
    <View className="flex-1 bg-[#0E1111] px-5 pt-14">
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View className="flex-row justify-between items-center px-4">
        <Image
          source={ButtomLogo}
          resizeMode="contain"
          className="h-[40px] w-[120px]"
        />
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={28} color="white" />
        </TouchableOpacity>
      </View>

      {/* Top Logo */}
      <View className="absolute left-0 right-0 -top-6 items-center">
        <Image
          source={TopLogo}
          style={{ height: 100, width: 155 }}
          resizeMode="contain"
        />
      </View>

      {/* Divider */}
      <View className="border border-dashed border-gray-500 my-6" />

      {/* Options List */}
      <View className="space-y-3">
        {options.map((item, index) => (
          <TouchableOpacity
            key={index}
            className="bg-[#1A1E1E] rounded-xl px-4 py-4 mt-5 border border-gray-800"
            onPress={() => handleOptionPress(item.screen)}
          >
            <View className="flex-row justify-between items-center">
              <Text className="text-green-400 font-medium text-base">
                {item.title}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#22C55E" />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Delete Button */}
      {/* <View className="mt-10">
        <TouchableOpacity className="border border-red-500 py-3 rounded-full">
          <Text className="text-center text-red-500 font-semibold text-base">
            {t("tontineSetting.delete")}
          </Text>
        </TouchableOpacity>
      </View> */}

      {/* Modal Info Popup */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/60 px-5">
          <View className="bg-white rounded-2xl p-6 w-full max-w-md">
            <ScrollView>
              <Text className="text-lg font-bold text-center mb-4">
                {t("tontineSetting.information")}
              </Text>
              <Text className="text-gray-800 whitespace-pre-line">
                {selectedInfo}
              </Text>
            </ScrollView>
            <Pressable
              onPress={() => setModalVisible(false)}
              className="mt-4 py-2 bg-green-500 rounded-full"
            >
              <Text className="text-white text-center font-semibold">
                OK
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default TontineSetting;
