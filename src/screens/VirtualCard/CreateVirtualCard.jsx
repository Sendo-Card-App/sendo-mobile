import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
} from "react-native";
import Card from "../../Images/VirtualCard.png";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useGetConfigQuery } from "../../services/Config/configApi";
import { useGetUserProfileQuery } from "../../services/Auth/authAPI";
import { useCreateVirtualCardMutation } from "../../services/Card/cardApi";

const CreateVirtualCard = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const [name, setName] = useState("");

  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("success"); // 'success' | 'error'

  const [createVirtualCard, { isLoading }] = useCreateVirtualCardMutation();
  const { data: userProfile, isLoading: isProfileLoading } = useGetUserProfileQuery();

  const {
    data: configData,
    isLoading: isConfigLoading,
  } = useGetConfigQuery();

  // Redirect if virtual card already exists
  useEffect(() => {
    if (userProfile?.data?.virtualCard) {
      navigation.replace("ManageVirtualCard");
    }
  }, [userProfile]);

  const getConfigValue = (key) => {
    const item = configData?.data?.find((c) => c.name === key);
    return item?.value ?? null;
  };

  const cardFees = getConfigValue("SENDO_CREATING_CARD_FEES");
  const isFirstCardFree = getConfigValue("IS_FREE_FIRST_CREATING_CARD") === "1";
  const displayedFees = isFirstCardFree ? "0 XAF" : `${cardFees} XAF`;
  const total = displayedFees;

  const showModal = (type, message) => {
    setModalType(type);
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleCreateCard = async () => {
    if (!name.trim()) {
      showModal("error", t("virtual_card.missing_name") || "Please enter your name");
      return;
    }

    try {
      const response = await createVirtualCard({ name: name.trim() }).unwrap();

      console.log("✅ Virtual card response:", response);

      showModal(
        "success",
        t("virtual_card.request_success") +
          `\n\n${response?.cardId ? `Card ID: ${response.cardId}` : "✔️ Carte créée avec succès."}`
      );

      // Delay navigation after showing success message
      setTimeout(() => {
        setModalVisible(false);
        navigation.navigate("ManageVirtualCard");
      }, 2500);
    } catch (e) {
      console.error("❌ Virtual card creation failed:", e);
      showModal(
        "error",
        t("virtual_card.request_failed") +
          `\n\n${e?.data?.message || "Erreur inconnue"}`
      );
    }
  };

  if (isProfileLoading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#000" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 pt-4 pb-5">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <Image
            source={Card}
            className="w-full h-[400px] rotate-90 mt-14"
            resizeMode="contain"
          />

          <View className="border-t border-dashed border-gray-400 flex-1 mt-4 mx-6 px-2 pt-4">
            {/* Input nom */}
            <TextInput
              placeholder={t("virtual_card.enter_name") || "Enter your full name"}
              value={name}
              onChangeText={setName}
              className="border border-gray-300 rounded-md px-3 py-4 mb-4 text-black"
              autoCapitalize="words"
              autoCorrect={false}
              editable={!isLoading}
            />

            {/* Frais de création */}
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-400">{t("virtual_card.card_price")}</Text>
              <Text className="font-bold text-gray-700">
                {isConfigLoading ? "..." : displayedFees}
              </Text>
            </View>

            {/* Total */}
            <View className="flex-row justify-between items-center mt-2">
              <Text className="font-bold text-gray-700">{t("virtual_card.total")}</Text>
              <Text className="font-bold text-gray-700">
                {isConfigLoading ? "..." : total}
              </Text>
            </View>

            {/* Bouton créer carte */}
            <TouchableOpacity
              className="my-auto bg-[#7ddd7d] py-3 rounded-full mt-6"
              onPress={handleCreateCard}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text className="text-xl text-center font-bold">
                  {t("virtual_card.create_now")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Modal */}
        <Modal
          transparent
          animationType="slide"
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View className="flex-1 justify-center items-center bg-black/50 px-6">
            <View className="bg-white rounded-2xl p-6 w-full">
              <Text
                className={`text-center text-lg font-bold mb-4 ${
                  modalType === "success" ? "text-green-600" : "text-red-600"
                }`}
              >
                {modalType === "success"
                  ? t("virtual_card.success_title") || "Success"
                  : t("virtual_card.error_title") || "Error"}
              </Text>
              <Text className="text-center text-gray-700 mb-4">{modalMessage}</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                className="bg-blue-500 rounded-full py-2 mt-2"
              >
                <Text className="text-white text-center font-semibold">
                  {t("common.ok") || "OK"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreateVirtualCard;
