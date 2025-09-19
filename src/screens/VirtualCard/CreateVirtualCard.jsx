import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import Card from "../../images/virtual.png";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useGetConfigQuery } from "../../services/Config/configApi";
import { useGetUserProfileQuery } from "../../services/Auth/authAPI";
import { useCreateVirtualCardMutation } from "../../services/Card/cardApi";
import { Ionicons, AntDesign } from '@expo/vector-icons';

const CreateVirtualCard = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("success"); // 'success' | 'error'

  const [createVirtualCard, { isLoading }] = useCreateVirtualCardMutation();
  const { data: userProfile, isLoading: isProfileLoading } = useGetUserProfileQuery();
  const { data: configData, isLoading: isConfigLoading } = useGetConfigQuery();

  // Redirect if virtual card already exists AND is not TERMINATED
  useEffect(() => {
    const virtualCard = userProfile?.data?.virtualCard;
    if (virtualCard && virtualCard.status !== "TERMINATED") {
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
      showModal(
        "success",
        t("virtual_card.request_success") +
          `\n\n${response?.cardId ? `Card ID: ${response.cardId}` : "✔️ Carte créée avec succès."}`
      );
      setTimeout(() => {
        setModalVisible(false);
        navigation.navigate("ManageVirtualCard");
      }, 2500);
    } catch (e) {
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
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar backgroundColor="#7ddd7d" barStyle="light-content" />

      {/* Header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#7ddd7d',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 40,
        paddingBottom: 15,
        paddingHorizontal: 15,
      }}>
        <TouchableOpacity onPress={() =>
              navigation.reset({
                index: 0,
                routes: [{ name: "MainTabs" }],
              })
            }style={{ width: 40 }}>
          <AntDesign name="left" size={24} color="white" />
        </TouchableOpacity>

        <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', flex: 1, textAlign: 'center' }}>
          {t('screens.createCard')}
        </Text>

        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
          <Image
            source={Card}
            style={{ width: '100%', height: 400, transform: [{ rotate: '90deg' }], marginTop: 56 }}
            resizeMode="contain"
          />

          <View style={{ borderTopWidth: 1, borderTopStyle: 'dashed', borderTopColor: '#9CA3AF', flex: 1, marginTop: 16, marginHorizontal: 24, padding: 8, paddingTop: 16 }}>
            {/* Input nom */}
            <TextInput
              placeholder={t("virtual_card.enter_name") || "Enter your full name"}
              value={name}
              onChangeText={setName}
              style={{
                borderWidth: 1,
                borderColor: '#D1D5DB',
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 16,
                marginBottom: 16,
                color: '#000',
              }}
              autoCapitalize="words"
              autoCorrect={false}
              editable={!isLoading}
            />

            {/* Frais de création
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: '#9CA3AF' }}>{t("virtual_card.card_price")}</Text>
              <Text style={{ fontWeight: 'bold', color: '#374151' }}>
                {isConfigLoading ? "..." : displayedFees}
              </Text>
            </View> */}

            {/* Total */}
           {/*             
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <Text style={{ fontWeight: 'bold', color: '#374151' }}>{t("virtual_card.total")}</Text>
              <Text style={{ fontWeight: 'bold', color: '#374151' }}>
                {isConfigLoading ? "..." : total}
              </Text>
            </View> */}

            {/* Bouton créer carte */}
            <TouchableOpacity
              onPress={handleCreateCard}
              disabled={isLoading}
              style={{ backgroundColor: '#7ddd7d', paddingVertical: 12, borderRadius: 999, marginTop: 24 }}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center', color: '#000' }}>
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
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 24 }}>
            <View style={{ backgroundColor: 'white', borderRadius: 24, padding: 24, width: '100%' }}>
              <Text style={{ textAlign: 'center', fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: modalType === 'success' ? '#16A34A' : '#DC2626' }}>
                {modalType === 'success' ? t("virtual_card.success_title") || "Success" : t("virtual_card.error_title") || "Error"}
              </Text>
              <Text style={{ textAlign: 'center', color: '#374151', marginBottom: 16 }}>{modalMessage}</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={{ backgroundColor: '#3B82F6', borderRadius: 999, paddingVertical: 8 }}
              >
                <Text style={{ textAlign: 'center', color: 'white', fontWeight: '600' }}>{t("common.ok") || "OK"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreateVirtualCard;
