import React, { useEffect, useState } from "react";
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
import { Ionicons, FontAwesome5, Entypo } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useNavigation } from "@react-navigation/native";
import CardImg from "../../images/VirtualCard.png";
import { useTranslation } from "react-i18next";
import {
  useGetVirtualCardsQuery,
  useGetVirtualCardDetailsQuery,
  useFreezeCardMutation,
  useUnfreezeCardMutation,
  useGetCardTransactionsQuery,
  useGetCardBalanceQuery,
  useGetVirtualCardDetailsHideQuery,
} from "../../services/Card/cardApi";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from 'react-native-webview';

const ManageVirtualCard = () => {
  const { t } = useTranslation();
  const { width } = Dimensions.get("screen");
  const navigation = useNavigation();
  const {
    data: cards,
    isLoading: isCardsLoading,
  } = useGetVirtualCardsQuery();

  const [selectedCardId, setSelectedCardId] = useState(null);
  const [iframeModalVisible, setIframeModalVisible] = useState(false);
  const [iframeUrl, setIframeUrl] = useState("");
  const [isLoadingIframe, setIsLoadingIframe] = useState(false);

  const {
    data: cardDetails,
    isLoading: isDetailsLoading,
    refetch: refetchCardDetails,
  } = useGetVirtualCardDetailsQuery(selectedCardId, {
    skip: !selectedCardId,
  });

  const {
    data: cardDetailsHide,
    isLoading: isDetailsHideLoading,
    refetch: refetchCardDetailsHide,
  } = useGetVirtualCardDetailsHideQuery(selectedCardId, {
    skip: !selectedCardId,
  });

  const [freezeCard] = useFreezeCardMutation();
  const [unfreezeCard] = useUnfreezeCardMutation();
  const [showBalance, setShowBalance] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState("success");
  const [modalMessage, setModalMessage] = useState("");

  const cardData = cardDetails?.data;
  const cardStatus = cardData?.status;
  const isCardFrozen = cardStatus === "FROZEN";

  const {
    data: cardTransactions,
    isLoading: isTransactionsLoading,
    refetch: refetchTransactions,
  } = useGetCardTransactionsQuery(cardData?.id, {
    skip: !cardData?.id,
  });
 //console.log("Full response:", JSON.stringify(cardTransactions, null, 2));
  const {
    data: balanceData,
    isLoading: isBalanceLoading,
    refetch: refetchBalance,
  } = useGetCardBalanceQuery(cardData?.cardId, {
    skip: !cardData?.cardId,
  });

  useEffect(() => {
    if (cards?.data?.length > 0) {
      setSelectedCardId(cards.data[0].cardId);
    }
  }, [cards]);

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

  const showModal = (type, message) => {
    setModalType(type);
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleFreezeUnfreeze = async () => {
    try {
      const cardId = cardData?.cardId;
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
    }
  };

  const handleShowCardDetails = async () => {
    try {
      setIsLoadingIframe(true);
      const response = await refetchCardDetailsHide();
      
      if (response.data?.data?.link) {
        setIframeUrl(response.data.data.link);
        setIframeModalVisible(true);
      } else {
        showModal("error", "Impossible de charger les détails de la carte");
      }
    } catch (err) {
      showModal("error", "Une erreur s'est produite");
    } finally {
      setIsLoadingIframe(false);
    }
  };

  const ActionItem = ({ icon, label, onPress, disabled = false }) => (
    <TouchableOpacity onPress={onPress} className="items-center flex-1" disabled={disabled}>
      <View className="bg-gray-200 p-3 rounded-full">
        {disabled ? (
          <ActivityIndicator size="small" color="#333" />
        ) : (
          <Ionicons name={icon} size={24} color="#333" />
        )}
      </View>
      <Text className="text-xs mt-2 text-center">{label}</Text>
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
           <Text className="text-xs text-gray-500">
            {item.status === "SUCCESSFUL" ? "Réussi" : item.status === "PENDING" ? "En attente" : "Échoué"}
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
      <SafeAreaView className="bg-green-500 rounded-b-2xl">
        <View className="flex-row items-center justify-between px-4 bg-green-500 border-b border-gray-200 rounded-b-2xl">
          <TouchableOpacity onPress={() => navigation.navigate("MainTabs")} className="p-1">
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
            <View className="absolute inset-0 bg-blue-200 bg-opacity-40 z-10 justify-center items-center">
              <FontAwesome5 name="snowflake" size={50} color="#a0e1f5" />
            </View>
          )}

          <View className="flex-1 justify-between px-5 py-4">
            <View className="mt-2">
              <Text className="text-white text-sm mb-1">{t('manageVirtualCard.currentBalance')}</Text>
              <TouchableOpacity
                onPress={() => setShowBalance(!showBalance)}
                className="bg-white px-3 py-1 rounded-full self-start"
              >
                <Text className="text-[#0f1a38] font-semibold">
                  {showBalance ? "Masquer le solde" : "Afficher le solde"}
                </Text>
              </TouchableOpacity>
            </View>

            <View className="mt-3">
              <Text className="text-white text-lg tracking-widest font-semibold">
                **** {cardData?.last4Digits || "****"}
              </Text>
              <TouchableOpacity 
                className="bg-[#7ddd7d] px-3 py-1 mt-1 rounded-md self-start"
                onPress={handleShowCardDetails}
                disabled={isLoadingIframe}
              >
                <View className="bg-white px-2 py-1 rounded">
                  {isLoadingIframe ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <Text className="text-black text-sm">{t('manageVirtualCard.viewNumbers')}</Text>
                  )}
                </View>
              </TouchableOpacity>
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
          <View className="flex-row justify-between mt-6">
            <ActionItem 
              icon="eye-outline" 
              label={t('manageVirtualCard.viewInfo')}
              onPress={handleShowCardDetails}
              disabled={isLoadingIframe}
            />
            <ActionItem 
              icon="snow-outline" 
              label={isCardFrozen ? t('manageVirtualCard.unfreeze') : t('manageVirtualCard.freeze')} 
              onPress={handleFreezeUnfreeze} 
            />
            <ActionItem
              icon="settings"
              label={t('manageVirtualCard.settings')}
              onPress={() =>
                navigation.navigate("CardSettings", {
                  cardName: cardData?.cardName,
                  cardId: cardData?.cardId,
                })
              }
            />
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
          <View className="mt-6 bg-gray-100 rounded-xl p-4">
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
                className="bg-green-600 flex-row items-center justify-center rounded-md px-3 py-2"
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
        <View className="mt-6 mb-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="font-bold text-gray-700">{t('manageVirtualCard.history')}</Text>
            <TouchableOpacity onPress={handleRefresh}>
              <Ionicons name="refresh" size={20} color="#7ddd7d" />
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
              <WebView 
                source={{ uri: iframeUrl }}
                startInLoadingState={true}
                renderLoading={() => (
                  <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color="#7ddd7d" />
                  </View>
                )}
                style={{ flex: 1 }}
              />
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