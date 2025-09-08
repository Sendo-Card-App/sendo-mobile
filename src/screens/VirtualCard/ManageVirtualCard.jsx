import React, { useEffect, useState } from "react";
import { useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Modal,
  Pressable,
  Alert,
} from "react-native";
import { Feather } from '@expo/vector-icons';
import { Ionicons, FontAwesome5, Entypo } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useNavigation } from "@react-navigation/native";
import CardImg from "../../images/virtual.png";
import { useTranslation } from "react-i18next";
import {
  useGetVirtualCardsQuery,
  useGetVirtualCardDetailsQuery,
  useFreezeCardMutation,
  useUnfreezeCardMutation,
  useGetCardTransactionsQuery,
  useGetCardBalanceQuery,
  useGetVirtualCardDetailsHideQuery,
  useGetCardDebtsQuery,
  useGetUnlockStatusQuery,
} from "../../services/Card/cardApi";
import { useGetUserProfileQuery } from "../../services/Auth/authAPI"; 
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from 'react-native-webview';
import * as ScreenCapture from 'expo-screen-capture';

const ManageVirtualCard = () => {
  const { t } = useTranslation();
  const { width } = Dimensions.get("screen");
  const navigation = useNavigation();
  const [checking, setChecking] = useState(false);
  const {
    data: cards,
    isLoading: isCardsLoading,
  } = useGetVirtualCardsQuery();

    const { data: userProfile, isLoading: isProfileLoading, refetch } = useGetUserProfileQuery();
    //console.log('User Profile:', JSON.stringify(userProfile, null, 2));

  const [selectedCardId, setSelectedCardId] = useState(null);
  const [iframeModalVisible, setIframeModalVisible] = useState(false);
  const [iframeUrl, setIframeUrl] = useState('');
  const [isPreventingScreenshot, setIsPreventingScreenshot] = useState(false);
  const [isLoadingIframe, setIsLoadingIframe] = useState(false);
  const [isLoadingFreeze, setIsLoadingFreeze] = useState(false);
  const [webViewLoading, setWebViewLoading] = useState(true);

  const {
    data: cardDetails,
    isLoading: isDetailsLoading,
    refetch: refetchCardDetails,
  } = useGetVirtualCardDetailsQuery(selectedCardId, {
    skip: !selectedCardId,
      pollingInterval: 1000, // Refetch every 30 seconds
  });

  const { data: unlockStatus, isLoading: isUnlockStatusLoading } = useGetUnlockStatusQuery(selectedCardId, {
    skip: !selectedCardId,
      pollingInterval: 1000, // Refetch every 30 seconds
  });
    //console.log("Unlock Status:", JSON.stringify(unlockStatus, null, 2));
  const {
    data: cardDetailsHide,
    isLoading: isDetailsHideLoading,
    refetch: refetchCardDetailsHide,
  } = useGetVirtualCardDetailsHideQuery(selectedCardId, {
    skip: !selectedCardId,
      pollingInterval: 1000, // Refetch every 30 seconds
  });

    //console.log("cardDetailsHide:", JSON.stringify(cardDetailsHide, null, 2));

  const [freezeCard] = useFreezeCardMutation();
  const [unfreezeCard] = useUnfreezeCardMutation();
  const [showBalance, setShowBalance] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState("success");
  const [modalMessage, setModalMessage] = useState("");
  const [showDebts, setShowDebts] = useState(false);
  const [preActiveModalVisible, setPreActiveModalVisible] = useState(false);
  const [isProcessingFreeze, setIsProcessingFreeze] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessingSetting, setIsProcessingSetting] = useState(false);


  const cardData = cardDetails?.data;
  //console.log(cardData)
  const cardStatus = cardData?.status;
  const isCardFrozen = cardStatus === "FROZEN";
  const rejectionAttempts = cardData?.paymentRejectNumber ?? 0;
  const limit = 3; // or wherever you get the limit from

  const {
    data: cardTransactions,
    isLoading: isTransactionsLoading,
    refetch: refetchTransactions,
  } = useGetCardTransactionsQuery(cardData?.id, {
    skip: !cardData?.id,
      pollingInterval: 1000,
  });
 //console.log("Full response:", JSON.stringify(cardTransactions, null, 2));
  const {
  data: balanceData,
  isLoading: isBalanceLoading,
  refetch: refetchBalance,
} = useGetCardBalanceQuery({ idCard: cardData?.id }, {
  skip: !cardData?.id,
    pollingInterval: 1000,
});

const {
  data: debtsData,
  isLoading: isDebtsLoading,
  refetch: refetchDebts,
} = useGetCardDebtsQuery(cardData?.id, {
  skip: !cardData?.id,
    pollingInterval: 1000,
});
 //console.log("Debts Data:", JSON.stringify(debtsData, null, 2));

 //console.log(balanceData)
  useEffect(() => {
  if (cards?.data?.length > 0 && selectedCardId !== cards.data[0].cardId) {
    setSelectedCardId(cards.data[0].cardId);
  }
}, [cards, selectedCardId]);




  useFocusEffect(
    useCallback(() => {
      setChecking(true); // show loader before checking

      if (!isProfileLoading) {
        const virtualCard = userProfile?.data?.virtualCard;
        const isCardMissingOrEmpty =
          !virtualCard || (typeof virtualCard === "object" && Object.keys(virtualCard).length === 0);
        const status = virtualCard?.status;

        if (isCardMissingOrEmpty || (status !== "ACTIVE" && status !== "PRE_ACTIVE" && status !== "FROZEN")) {
          navigation.navigate("OnboardingCard");
        }
      }

      setChecking(false); // hide loader after check
    }, [userProfile, isProfileLoading, navigation])
  );

  if (checking || isProfileLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#7ddd7d" />
      </View>
    );
  }


  useEffect(() => {
    if (cardStatus === "TERMINATED") {
      setModalType("terminated");
      setModalMessage("Votre carte a été supprimée. Voulez-vous en créer une nouvelle ?");
      setModalVisible(true);
    } else if (cardStatus === "IN_TERMINATION") {
      Alert.alert(
        "Suppression en cours",
        "Votre carte est en cours de suppression. Certaines fonctionnalités peuvent être limitées."
      );
    } else if (cardStatus === "SUSPENDED") {
      Alert.alert(
        "Carte suspendue",
        "Votre carte a été suspendue en raison d'une activité suspecte."
      );
    }
  }, [cardStatus]);

  const debouncedHandleFreezeUnfreeze = async () => {
    if (isProcessingFreeze) return;
    
    setIsProcessingFreeze(true);
    await handleFreezeUnfreeze();
    setTimeout(() => setIsProcessingFreeze(false), 1000); // Prevent rapid clicks
  };

  const debouncedHandleShowCardDetails = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    await handleShowCardDetails();
    setTimeout(() => setIsProcessing(false), 1000);
  };

  
  // Prevent screenshots when modal is visible
  useEffect(() => {
    const preventScreenshot = async () => {
      try {
        await ScreenCapture.preventScreenCaptureAsync();
        setIsPreventingScreenshot(true);
      } catch (error) {
        console.error('Could not prevent screenshots:', error);
      }
    };

    const allowScreenshot = async () => {
      try {
        await ScreenCapture.allowScreenCaptureAsync();
        setIsPreventingScreenshot(false);
      } catch (error) {
        console.error('Could not re-enable screenshots:', error);
      }
    };

    if (iframeModalVisible) {
      preventScreenshot();
    } else {
      allowScreenshot();
    }

    return () => {
      allowScreenshot();
    };
  }, [iframeModalVisible]);

  const showModal = (type, message) => {
    setModalType(type);
    setModalMessage(message);
    setModalVisible(true);
  };

const handleFreezeUnfreeze = async () => {
  const cardId = cardData?.cardId;
  if (!cardId) return;

  setIsLoadingFreeze(true); 

  try {
    if (isCardFrozen) {
      const response = await unfreezeCard(cardId).unwrap();
      showModal("success", `Carte débloquée avec succès.\n${response?.message || ""}`);
    } else {
      const response = await freezeCard(cardId).unwrap();
      showModal("success", `Carte bloquée avec succès.\n${response?.message || ""}`);
    }

    refetchCardDetails();
  } catch (err) {
    let errorMessage = "Erreur lors de l'opération.";
    if (err?.data?.message) {
      errorMessage = err.data.message;
    } else if (err?.error) {
      errorMessage = err.error;
    }
    showModal("error", errorMessage);
  } finally {
    setIsLoadingFreeze(false); // Stop loading
  }
};


  const handleShowCardDetails = async () => {
    // Check if card is ACTIVE
    if (cardStatus === "ACTIVE") {
      try {
        setIsLoadingIframe(true);
        const response = await refetchCardDetailsHide();
        
        if (response.data?.data?.link) {
          setIframeUrl(response.data.data.link);
          setIframeModalVisible(true);
          setWebViewLoading(true); // Reset loading state when opening modal
        } else {
          showModal("error", "Impossible de charger les détails de la carte");
        }
      } catch (err) {
        showModal("error", "Une erreur s'est produite");
      } finally {
        setIsLoadingIframe(false);
      }
    } 
    // Check if card is PRE_ACTIVE
    else if (cardStatus === "PRE_ACTIVE") {
      setPreActiveModalVisible(true);
    }
    // For other statuses, show appropriate message
    else {
      showModal("error", "Les détails de la carte ne sont disponibles que lorsque la carte est active");
    }
  };

  const ActionItem = ({ icon, label, onPress, disabled = false }) => (
  <TouchableOpacity 
    onPress={disabled ? null : onPress} 
    className="items-center flex-1" 
    disabled={disabled}
  >
    <View className={`p-3 rounded-full ${disabled ? 'bg-gray-100' : 'bg-gray-200'}`}>
      {disabled ? (
        <ActivityIndicator size="small" color="#333" />
      ) : (
        <Ionicons name={icon} size={24} color="#333" />
      )}
    </View>
    <Text className={`text-xs mt-2 text-center ${disabled ? 'text-gray-400' : 'text-black'}`}>
      {label}
    </Text>
  </TouchableOpacity>
);

  const TransactionItem = ({ item }) => {
    const isCashIn = item.type === "DEPOSIT";
    const icon = isCashIn ? (
      <Ionicons name="arrow-down-circle-outline" size={20} color="#7ddd7d" />
    ) : (
      <Entypo name="credit-card" size={20} color="#f39c12" />
    );

    const formattedDate = new Date(item.createdAt).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      <TouchableOpacity
        className="flex-row justify-between items-center py-3 border-b border-gray-200"
        onPress={() => navigation.navigate("TransactionDetails", { transaction: item })}
      >
        <View className="flex-row items-center gap-2">
          <View className="bg-gray-100 p-2 rounded-full">{icon}</View>
          <View>
            <Text className="font-semibold">
              {isCashIn ? "Rechargement carte" : "Paiement avec carte"}
            </Text>
            <Text className="text-xs text-gray-500">{formattedDate}</Text>
         <Text
            className={`text-xs ${
              item.status === "COMPLETED"
                ? "text-green-600"
                : item.status === "PENDING"
                ? "text-gray-500"
                : "text-red-600"
            }`}
          >
            {item.status === "COMPLETED"
              ? "Succès"
              : item.status === "PENDING"
              ? "En cours de traitement"
              : "Échec"}
          </Text>


          </View>
        </View>
       <Text className={`font-bold ${item.status === "PENDING" ? "text-gray-400" : isCashIn ? "text-green-600" : "text-red-500"}`}>
          {isCashIn ? "+" : "-"}
          {item.amount.toLocaleString("fr-FR")} FCFA
        </Text>

      </TouchableOpacity>
    );
  };

  const handleRefresh = () => {
    refetchTransactions();
  };

  if (isCardsLoading || isDetailsLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#7ddd7d" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView className="bg-[#7ddd7d]  rounded-b-2xl">
         <StatusBar backgroundColor="#7ddd7d" barStyle="light-content" />
        <View className="flex-row items-center justify-between px-4 bg-[#7ddd7d]  border-b border-gray-200 rounded-b-2xl">
          <TouchableOpacity
            onPress={() =>
              navigation.reset({
                index: 0,
                routes: [{ name: "MainTabs" }],
              })
            }
            className="p-1"
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-800 text-center flex-1">
            {cardData?.cardName || "Ma Carte"}
          </Text>
          <TouchableOpacity onPress={() => navigation.openDrawer()} className="p-1">
            <Ionicons name="menu-outline" size={28} color="#333" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <View className="px-4 pt-1">
        {/* Card Display */}
        <View className="relative rounded-2xl overflow-hidden mt-2" style={{ height: width / 1.66 }}>
          <Image source={CardImg} className="w-full h-full absolute" resizeMode="contain" />
          {isCardFrozen && (
            <View className="absolute inset-0 bg-[#d7f0f7] bg-opacity-60 z-10 justify-center items-center">
              <FontAwesome5 name="snowflake" size={50} color="#a0e1f5" />
            </View>
          )}

          <View className="flex-1 justify-between px-5 py-4">
           <View className="mt-2">
            <Text className="text-white text-sm mb-1">{t('manageVirtualCard.currentBalance')}</Text>
             <TouchableOpacity
              onPress={() => {
                if (showBalance) {
                  setShowBalance(false);
                } else {
                  navigation.navigate("Auth", {
                    screen: "PinCode",
                    params: {
                      onSuccess: () => {
                        setShowBalance(true);  // ✅ Reveal balance after successful pin
                        return Promise.resolve();
                      },
                      showBalance: true,
                    },
                  });
                }
              }}
              className="px-3 py-1 rounded-full self-start flex-row items-center space-x-2"
            >
              <Feather
                name={showBalance ? "eye-off" : "eye"}
                size={20}
                color="#fff"
              />
            </TouchableOpacity>

            </View>

            <View className="mt-3">
              <Text className="text-white text-lg tracking-widest font-semibold">
                **** {cardData?.last4Digits}
              </Text>
            </View>

            <View className="mt-3">
              <Text className="text-white font-bold text-xl">{cardData?.cardName}</Text>
              <Text className="text-white mt-3">
                {t("manageVirtualCard.expires")} {cardData?.expirationDate}
              </Text>
            </View>
          </View>
        </View>
        

        {/* Actions */}
        {cardStatus !== "TERMINATED" ? (
          <View className="mb-1 mt-2">
          {rejectionAttempts > 0 && (
            <View className="mb-4">
              {/* Progress Bar */}
              <View className="flex-row space-x-1 mb-2">
                {[...Array(limit)].map((_, index) => (
                  <View
                    key={index}
                    className={`h-1.5 flex-1 rounded-full ${
                      index < rejectionAttempts ? "bg-red-500" : "bg-gray-300"
                    }`}
                  />
                ))}
              </View>

              {/* Failure Counter */}
              <Text className="text-sm text-gray-800 font-medium">
                <Text className="font-semibold text-red-600">
                  Compteur d'échecs : {rejectionAttempts}/{limit}
                </Text>{" "}
                tentative(s) de paiement échouées sur votre carte.
              </Text>

              <View
                className={`mt-2 p-3 rounded-md border-l-4 ${
                  rejectionAttempts >= limit ? "bg-red-100 border-red-500" : "bg-yellow-50 border-yellow-400"
                }`}
              >
                {isUnlockStatusLoading ? (
                  <ActivityIndicator size="small" color="#7ddd7d" />
                ) : (
                  <Text
                    className={`text-sm ${
                      rejectionAttempts >= limit ? "text-red-800" : "text-yellow-800"
                    }`}
                  >
                    Cette carte sera bloquée après{" "}
                    <Text className="font-semibold text-red-600">
                      {limit} paiements échoués
                    </Text>. Déposer de l'argent et payer le commerçant pour l'éviter.{" "}
                    <Text
                      className="text-blue-700 underline"
                       onPress={() =>
                          navigation.navigate("CardAction", {
                            cardId: cardData?.id,
                            action: "recharge",
                          })
                        }
                    >
                      Recharger maintenant!
                    </Text>
                  </Text>
                )}
              </View>
            </View>
          )}
            {/* 🔸 Action Buttons */}
            <View className="flex-row justify-between">
              <ActionItem 
                icon="eye-outline" 
                label={t('manageVirtualCard.viewInfo')}
                onPress={debouncedHandleShowCardDetails}
                disabled={isProcessing || isLoadingIframe || isDetailsHideLoading}
              />
              <ActionItem 
                icon="snow-outline" 
                label={
                  isCardFrozen
                    ? t('manageVirtualCard.unfreeze')
                    : t('manageVirtualCard.freeze')
                }
                onPress={debouncedHandleFreezeUnfreeze}
                disabled={isProcessingFreeze || isLoadingFreeze}
              />
              <ActionItem
                icon="settings"
                label={t('manageVirtualCard.settings')}
                onPress={() => {
                  if (!isProcessingSetting) {
                    navigation.navigate("CardSettings", {
                      cardName: cardData?.cardName,
                      cardId: cardData?.cardId,
                      balanceData: balanceData?.data?.balance
                    });
                  }
                }}
                disabled={isProcessingSetting}
              />
            </View>
          </View>
        ) : (
          <View className="mt-6 bg-red-100 rounded-xl p-4">
            <Text className="text-red-600 font-semibold text-center">
              {t('manageVirtualCard.terminatedMessage')}
            </Text>
          </View>
        )}


        {/* Balance + Actions */}
       {cardStatus !== "TERMINATED" ? (
          <>
            {/* Balance and Action Buttons */}
            <View className="mt-4 bg-gray-100 rounded-xl p-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-xl font-bold">
                    {showBalance
                      ? isBalanceLoading
                        ? "Chargement..."
                        : `${(balanceData?.data?.balance ?? 0).toLocaleString("fr-FR")} XAF`
                      : "**** XAF"}
                  </Text>
                  <Text className="text-sm text-gray-500">{t('manageVirtualCard.availableBalance')}</Text>
                </View>

                <TouchableOpacity
                  className="bg-white flex-row items-center justify-center rounded-md px-3 py-2 border border-green-300 mr-2"
                  onPress={() =>
                    navigation.navigate("CardAction", {
                      cardId: cardData?.id,
                      action: "withdraw",
                    })
                  }
                >
                  <Text className="text-black font-semibold ml-2">{t('manageVirtualCard.withdraw')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="bg-[#7ddd7d] flex-row items-center justify-center rounded-md px-3 py-2"
                  onPress={() =>
                    navigation.navigate("CardAction", {
                      cardId: cardData?.id,
                      action: "recharge",
                    })
                  }
                >
                  <Text className="text-white font-semibold ml-2">{t('manageVirtualCard.topUp')}</Text>
                </TouchableOpacity>
              </View>
            </View>
           {/*  Debts Dropdown - Only show if there are debts or loading */}
            {((debtsData?.data?.length > 0) || isDebtsLoading) && (
              <View className="mt-2 px-4">
                <TouchableOpacity
                  onPress={() => setShowDebts(!showDebts)}
                  className="flex-row items-center justify-between py-3"
                >
                  <Text className="font-semibold text-gray-700">
                    {t("manageVirtualCard.showDebts") || "Voir les dettes"}
                  </Text>
                  <Ionicons
                    name={showDebts ? "chevron-up" : "chevron-down"}
                    size={20}
                    color="#333"
                  />
                </TouchableOpacity>

                {showDebts && (
                  <View className="bg-gray-100 rounded-xl p-4">
                    {isDebtsLoading ? (
                      <ActivityIndicator size="small" color="#7ddd7d" />
                    ) : debtsData?.data?.length > 0 ? (
                      debtsData.data.map((debt) => (
                        <View
                          key={debt.id}
                          className="flex-row justify-between border-b border-gray-200 py-2"
                        >
                          <Text className="text-sm text-gray-600">
                            {debt.intitule}
                          </Text>
                          <Text className="text-sm font-semibold text-red-500">
                            {debt.amount?.toLocaleString("fr-FR")} XAF
                          </Text>
                        </View>
                      ))
                    ) : (
                      <Text className="text-sm text-gray-500 mt-2">
                        {t("manageVirtualCard.noDebts") || "Aucune dette en cours"}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            )}
          </>
        ) : (
          <View className="mt-6 bg-red-100 rounded-xl p-4">
            <TouchableOpacity
              className="bg-green-600 py-3 px-4 rounded-md self-center"
              onPress={() => navigation.navigate("CreateVirtualCard")}
            >
              <Text className="text-white font-bold text-center">{t('manageVirtualCard.createNew')}</Text>
            </TouchableOpacity>
          </View>
        )}


        {/* Transactions */}
        <View className="mt-2 mb-2">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="font-bold text-gray-700">{t('manageVirtualCard.history')}</Text>
            <TouchableOpacity  onPress={() =>
                  navigation.navigate("History")
                }>
              <Text className="font-bold text-gray-700">voir tout</Text>
            </TouchableOpacity>
          </View>

          {isTransactionsLoading ? (
            <ActivityIndicator size="small" color="#7ddd7d" />
          ) : (
            <FlatList
              data={cardTransactions?.data?.transactions?.items || []}
              renderItem={({ item }) => <TransactionItem item={item} />}
              keyExtractor={(item) => item.transactionId || item.id.toString()}
              ListEmptyComponent={
                <Text className="text-center py-4 text-gray-500">
                  {t('manageVirtualCard.empty')}
                </Text>
              }
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>

      {/* Modal for TERMINATED or error/success */}
      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-transparent bg-opacity-40">
          <View className="bg-white p-6 rounded-xl w-4/5">
            <View className="items-center mb-4">
              {modalType === "terminated" ? (
                <Ionicons name="alert-circle" size={48} color="#f39c12" />
              ) : modalType === "success" ? (
                <Ionicons name="checkmark-circle" size={48} color="#7ddd7d" />
              ) : (
                <Ionicons name="close-circle" size={48} color="#ff6b6b" />
              )}
            </View>
            <Text className="text-center mb-4">{modalMessage}</Text>
            <Pressable
              className="bg-[#7ddd7d] py-3 rounded-md mb-2"
              onPress={() => {
                setModalVisible(false);
                if (modalType === "terminated") {
                  navigation.navigate("CreateVirtualCard");
                }
              }}
            >
              <Text className="text-white text-center font-bold">
                {modalType === "terminated" ? "Créer une nouvelle carte" : "OK"}
              </Text>
            </Pressable>
            {modalType === "terminated" && (
              <Pressable
                className="py-2"
                onPress={() => setModalVisible(false)}
              >
                <Text className="text-center text-gray-500">  {t('manageVirtualCard.cancel')}</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal for PRE_ACTIVE card */}
      <Modal
        transparent
        visible={preActiveModalVisible}
        animationType="fade"
        onRequestClose={() => setPreActiveModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-transparent bg-opacity-40">
          <View className="bg-white p-6 rounded-xl w-4/5">
            <View className="items-center mb-4">
              <Ionicons name="information-circle" size={48} color="#f39c12" />
            </View>
            <Text className="text-center mb-4">
              Votre carte est en attente d'activation. Veuillez effectuer une première recharge pour activer votre carte et voir ses détails.
            </Text>
            <Pressable
              className="bg-[#7ddd7d] py-3 rounded-md mb-2"
              onPress={() => {
                setPreActiveModalVisible(false);
                navigation.navigate("CardAction", {
                  cardId: cardData?.id,
                  action: "recharge",
                });
              }}
            >
              <Text className="text-white text-center font-bold">
                Recharger maintenant
              </Text>
            </Pressable>
            <Pressable
              className="py-2"
              onPress={() => setPreActiveModalVisible(false)}
            >
              <Text className="text-center text-gray-500">Annuler</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Iframe Modal for Card Details */}
      <Modal
        transparent={false}
        visible={iframeModalVisible}
        animationType="slide"
        onRequestClose={() => setIframeModalVisible(false)}
      >
        <View className="flex-1 bg-white">
          {/* Header with close button */}
          <View className="flex-row justify-between items-center mt-10 p-4 border-b border-gray-200">
            <Text className="text-lg font-bold">Détails de la carte</Text>
            <TouchableOpacity onPress={() => setIframeModalVisible(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          {/* WebView/Iframe container */}
          <View className="flex-1">
            {iframeUrl ? (
              <>
                {webViewLoading && (
                  <View className="flex-1 justify-center items-center absolute top-0 left-0 right-0 bottom-0 z-10 bg-white">
                    <ActivityIndicator size="large" color="#7ddd7d" />
                    <Text className="mt-2">Chargement des détails...</Text>
                  </View>
                )}
                <WebView 
                  source={{ uri: iframeUrl }}
                  onLoadStart={() => setWebViewLoading(true)}
                  onLoadEnd={() => setWebViewLoading(false)}
                  onError={() => {
                    setWebViewLoading(false);
                    showModal("error", "Erreur de chargement des détails de la carte");
                  }}
                  style={{ flex: 1 }}
                />
              </>
            ) : (
              <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#7ddd7d" />
                <Text className="mt-2">Chargement des détails...</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ManageVirtualCard;