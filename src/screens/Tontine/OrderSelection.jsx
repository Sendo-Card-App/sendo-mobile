import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";
import Loader from "../../components/Loader";
import { useCreateTontineMutation } from "../../services/Tontine/tontineApi";
import { 
  sendPushNotification,
  sendPushTokenToBackend,
  registerForPushNotificationsAsync,
  getStoredPushToken
} from '../../services/notificationService';


const TopLogo = require("../../images/TopLogo.png");

export default function OrderSelection({ navigation, route }) {
   //console.log("Route params:", route);
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
    // Notification logic starts here
    const notificationContent = {
      title: "Tontine Créée",
      body: `La tontine "${data.nom}" (${data.montant} FCFA) a été créée avec succès`,
      type: "TONTINE_CREATED",
    };

    try {
      // Try to get existing push token
      let pushToken = await getStoredPushToken();
      
      // If no token, request notification permission
      if (!pushToken) {
        pushToken = await registerForPushNotificationsAsync();
      }

      // If we have a token, send to backend
      if (pushToken) {
        await sendPushTokenToBackend(
          pushToken,
          notificationContent.title,
          notificationContent.body,
          notificationContent.type,
          {
            tontineId: response?.data?.id,
            nom: data.nom,
            montant: data.montant,
            type: data.type,
            timestamp: new Date().toISOString(),
          }
        );
      }
    } catch (notificationError) {
      console.log("Notification error:", notificationError);
      // Fallback to local notification if backend fails
      await sendPushNotification(
        notificationContent.title,
        notificationContent.body,
        {
          data: {
            type: notificationContent.type,
            tontineId: response?.data?.id,
            nom: data.nom,
            montant: data.montant,
          }
        }
      );
    }

    navigation.navigate("Participant", { tontineId: response?.data?.id });
    
  } catch (error) {
    console.log(' Réponse du backend :', JSON.stringify(error, null, 2));
    
    // Error notification
    try {
      await sendPushNotification(
        "Échec de création",
        "La création de la tontine a échoué",
        {
          data: {
            type: "TONTINE_CREATION_FAILED",
            error: error.message || "Erreur inconnue",
          }
        }
      );
    } catch (pushError) {
      console.warn("Failed to send error notification:", pushError);
    }

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
        <Image source={TopLogo} className="h-[120] w-[160]" resizeMode="contain" />
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
          <Text className="text-sm text-gray-600 mt-1">{option.description}</Text>
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