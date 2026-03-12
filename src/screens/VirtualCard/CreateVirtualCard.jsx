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
import { useGetBalanceQuery } from "../../services/WalletApi/walletApi";
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
  
  // Get user ID from profile
  const userId = userProfile?.data?.user?.id;
  
  const {
    data: balanceData,
    isLoading: isBalanceLoading,
    refetch: refetchBalance,
  } = useGetBalanceQuery(userId, { 
    skip: !userId,
    pollingInterval: 1000,
  });
  
  const TERMINATED_STATUSES = ["TERMINATED", "FAILED_TERMINATION", "IN_TERMINATION"];

  // Redirect if virtual card already exists AND is not TERMINATED
  useEffect(() => {
    const virtualCard = userProfile?.data?.user?.virtualCard;
    if (virtualCard && !TERMINATED_STATUSES.includes(virtualCard.status)) {
      navigation.replace("ManageVirtualCard");
    }
  }, [userProfile]);

  const getConfigValue = (key) => {
    const item = configData?.data?.find((c) => c.name === key);
    return item?.value ?? null;
  };

  const cardFees = getConfigValue("SENDO_CREATING_CARD_FEES");
  const isFirstCardFree = getConfigValue("IS_FREE_FIRST_CREATING_CARD") === "1";
  
  // Parse cardFees to number for comparison
  const cardFeesNumber = parseInt(cardFees) || 0;
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

    // Check balance before creating card
    const currentBalance = balanceData?.data?.balance || 0;
    
    // If card is not free, check if user has sufficient balance
    if (!isFirstCardFree) {
      if (currentBalance < cardFeesNumber) {
        showModal(
          "error",
          t("virtual_card.insufficient_balance") || 
          `Solde insuffisant. Vous avez besoin de ${cardFees} XAF pour créer une carte. Votre solde actuel est de ${currentBalance} XAF.`
        );
        return;
      }
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

  if (isProfileLoading || isBalanceLoading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#7ddd7d" />
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* FIXED: StatusBar with proper configuration */}
      <StatusBar 
        backgroundColor="#7ddd7d" 
        barStyle="light-content"
        translucent={false}
      />

      {/* Header - Now using View instead of SafeAreaView for better StatusBar integration */}
      <View style={{
        backgroundColor: '#7ddd7d',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight || 25 : 50,
        paddingBottom: 15,
        paddingHorizontal: 15,
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <TouchableOpacity 
            onPress={() => navigation.reset({
              index: 0,
              routes: [{ name: "MainTabs" }],
            })}
            style={{ width: 40 }}
          >
            <AntDesign name="left" size={24} color="white" />
          </TouchableOpacity>

          <Text style={{ 
            color: '#fff', 
            fontSize: 20, 
            fontWeight: 'bold', 
            flex: 1, 
            textAlign: 'center' 
          }}>
            {t('screens.createCard')}
          </Text>

          <View style={{ width: 40 }} />
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }} 
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Image
            source={Card}
            style={{ 
              width: '100%', 
              height: 400, 
              transform: [{ rotate: '90deg' }], 
              marginTop: 20 
            }}
            resizeMode="contain"
          />

          <View style={{ 
            borderTopWidth: 1, 
            borderTopStyle: 'dashed', 
            borderTopColor: '#9CA3AF', 
            flex: 1, 
            marginTop: 16, 
            marginHorizontal: 24, 
            padding: 8, 
            paddingTop: 16 
          }}>
          

            {/* Show warning if balance insufficient */}
            {!isFirstCardFree && balanceData?.data?.balance < cardFeesNumber && (
              <View style={{
                backgroundColor: '#FEF2F2',
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
                borderWidth: 1,
                borderColor: '#FCA5A5',
              }}>
                <Text style={{ color: '#B91C1C', fontSize: 14, textAlign: 'center' }}>
                  {t("virtual_card.insufficient_balance_warning") || 
                   `⚠️ Solde insuffisant. `}
                </Text>
              </View>
            )}

            {/* Input name */}
            <TextInput
              placeholder={t("virtual_card.enter_name") || "Enter your full name"}
              placeholderTextColor="#9CA3AF"
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
                backgroundColor: '#F9FAFB',
              }}
              autoCapitalize="words"
              autoCorrect={false}
              editable={!isLoading}
            />

            {/* Create card button */}
            <TouchableOpacity
              onPress={handleCreateCard}
              disabled={isLoading || (!isFirstCardFree && balanceData?.data?.balance < cardFeesNumber)}
              style={{ 
                backgroundColor: (!isFirstCardFree && balanceData?.data?.balance < cardFeesNumber) 
                  ? '#9CA3AF' 
                  : '#7ddd7d', 
                paddingVertical: 14, 
                borderRadius: 999, 
                marginTop: 24,
                opacity: isLoading ? 0.7 : 1,
                shadowColor: '#7ddd7d',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 5,
              }}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={{ 
                  fontSize: 18, 
                  fontWeight: 'bold', 
                  textAlign: 'center', 
                  color: (!isFirstCardFree && balanceData?.data?.balance < cardFeesNumber) 
                    ? '#fff' 
                    : '#000' 
                }}>
                  {(!isFirstCardFree && balanceData?.data?.balance < cardFeesNumber)
                    ? (t("virtual_card.insufficient_balance_short") || "Solde insuffisant")
                    : (t("virtual_card.create_now") || "Créer maintenant")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Modal */}
        <Modal
          transparent
          animationType="fade"
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={{ 
            flex: 1, 
            justifyContent: 'center', 
            alignItems: 'center', 
            backgroundColor: 'rgba(0,0,0,0.5)', 
            paddingHorizontal: 24 
          }}>
            <View style={{ 
              backgroundColor: 'white', 
              borderRadius: 24, 
              padding: 24, 
              width: '100%',
              maxWidth: 400,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 4,
              elevation: 5,
            }}>
              <View style={{ alignItems: 'center', marginBottom: 16 }}>
                {modalType === 'success' ? (
                  <View style={{ 
                    width: 60, 
                    height: 60, 
                    borderRadius: 30, 
                    backgroundColor: '#16A34A', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    marginBottom: 12
                  }}>
                    <Ionicons name="checkmark" size={40} color="white" />
                  </View>
                ) : (
                  <View style={{ 
                    width: 60, 
                    height: 60, 
                    borderRadius: 30, 
                    backgroundColor: '#DC2626', 
                    justifyContent: 'center', 
                    alignItems: 'center',
                    marginBottom: 12
                  }}>
                    <Ionicons name="close" size={40} color="white" />
                  </View>
                )}
                <Text style={{ 
                  textAlign: 'center', 
                  fontSize: 20, 
                  fontWeight: 'bold', 
                  color: modalType === 'success' ? '#16A34A' : '#DC2626' 
                }}>
                  {modalType === 'success' 
                    ? (t("virtual_card.success_title") || "Success") 
                    : (t("virtual_card.error_title") || "Error")}
                </Text>
              </View>
              
              <Text style={{ 
                textAlign: 'center', 
                color: '#374151', 
                marginBottom: 24,
                lineHeight: 22
              }}>
                {modalMessage}
              </Text>
              
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={{ 
                  backgroundColor: '#7ddd7d', 
                  borderRadius: 12, 
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                  alignSelf: 'center',
                  minWidth: 120
                }}
              >
                <Text style={{ 
                  textAlign: 'center', 
                  color: 'white', 
                  fontWeight: '600',
                  fontSize: 16
                }}>
                  {t("common.ok") || "OK"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </View>
  );
};

export default CreateVirtualCard;