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
} from "react-native";
import { Ionicons, FontAwesome5, Entypo } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import CardImg from "../../Images/VirtualCard.png";
import ButtomLogo1 from "../../Images/ButtomLogo1.png";
import { useTranslation } from "react-i18next";
import {
  useGetVirtualCardsQuery,
  useGetVirtualCardDetailsQuery,
  useFreezeCardMutation,
  useUnfreezeCardMutation,
  useGetCardTransactionsQuery,
} from "../../services/Card/cardApi";
import { SafeAreaView } from "react-native-safe-area-context";

const ManageVirtualCard = ({ navigation }) => {
  const { t } = useTranslation();
  const { width } = Dimensions.get("screen");

  const {
    data: cards,
    isLoading: isCardsLoading,
    error: cardsError,
  } = useGetVirtualCardsQuery();

  const [selectedCardId, setSelectedCardId] = useState(null);

 const {
  data: cardDetails,
  isLoading: isDetailsLoading,
  error: detailsError,
  refetch: refetchCardDetails, // <-- add this
} = useGetVirtualCardDetailsQuery(selectedCardId, {
  skip: !selectedCardId,
});


  const [freezeCard] = useFreezeCardMutation();
  const [unfreezeCard] = useUnfreezeCardMutation();
  const [showBalance, setShowBalance] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState("success");
  const [modalMessage, setModalMessage] = useState("");
  
  const cardData = cardDetails?.data;
  const isCardFrozen = cardData?.isFrozen ?? cardData?.status === "FROZEN";

  const {
    data: cardTransactions,
    isLoading: isTransactionsLoading,
    error: transactionsError,
    refetch: refetchTransactions,
  } = useGetCardTransactionsQuery(cardDetails?.data?.id, {
    skip: !cardDetails?.data?.id,
  });

  useEffect(() => {
    if (cards?.data?.length > 0) {
      setSelectedCardId(cards.data[0].cardId);
    }
  }, [cards]);

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

    // 🔁 Refresh card details
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





  const ActionItem = ({ icon, label, onPress }) => (
    <TouchableOpacity onPress={onPress} className="items-center flex-1">
      <View className="bg-gray-200 p-3 rounded-full">
        <Ionicons name={icon} size={24} color="#333" />
      </View>
      <Text className="text-xs mt-2 text-center">{label}</Text>
    </TouchableOpacity>
  );

  const TransactionItem = ({ item }) => {
    const isCashIn = item.type === "CASHOUT"; 
    const icon = isCashIn ? (
      <Ionicons name="arrow-down-circle-outline" size={20} color="#7ddd7d" />
    ) : (
      <Entypo name="credit-card" size={20} color="#f39c12" />
    );

    const transactionDate = new Date(item.createdAt);
    const formattedDate = transactionDate.toLocaleDateString("fr-FR", {
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
              {item.status === "SUCCESSFUL" ? "Réussi" : "Échoué"}
            </Text>
          </View>
        </View>
        <Text
          className={`font-bold ${isCashIn ? "text-green-600" : "text-red-500"}`}
        >
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
      <SafeAreaView className="bg-green-500"> 
        <View className="flex-row items-center justify-between px-4  bg-green-500 border-b border-gray-200">
          <TouchableOpacity
            onPress={() => navigation.navigate("MainTabs")}
            className="p-1"
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-800 text-center flex-1">
            {cardData?.cardName || "Ma Carte"}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.openDrawer()}
            className="p-1"
          >
            <Ionicons name="menu-outline" size={28} color="#333" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <View className="px-4 pt-1">
        {/* Virtual Card Design */}
        <View
          className="relative rounded-2xl overflow-hidden mt-2"
          style={{ height: width / 1.66 }}
        >
          <Image
            source={CardImg}
            className="w-full h-full absolute"
            resizeMode="contain"
          />

          {isCardFrozen && (
            <View className="absolute inset-0 bg-blue-200 bg-opacity-40 z-10 justify-center items-center">
              <FontAwesome5 name="snowflake" size={50} color="#a0e1f5" />
            </View>
          )}

          <View className="flex-1 justify-between px-5 py-4">
            <View className="mt-2">
              <Text className="text-white text-sm mb-1">Solde actuel</Text>
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
              <TouchableOpacity className="bg-[#7ddd7d] px-3 py-1 mt-1 rounded-md self-start">
                <View className="bg-white px-2 py-1 rounded">
                  <Text className="text-black text-sm">
                    Voir les numéros de ma carte
                  </Text>
                </View>
              </TouchableOpacity>

            </View>

            <View className="mt-3">
              <Text className="text-white font-bold text-l">
                {cardData?.cardName}
              </Text>
              <Text className="text-white mt-3">
                {t("manageVirtualCard.expires")} {cardData?.expirationDate}
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View className="flex-row justify-between mt-6">
          <ActionItem icon="eye-outline" label="Afficher les informations" />
          <ActionItem 
            icon="snow-outline" 
            label={isCardFrozen ? "Débloquer" : "Bloquer"} 
            onPress={handleFreezeUnfreeze} 
          />
          {/* <ActionItem icon="grid-outline" label="Abonnement" /> */}
          <ActionItem icon="settings" label="Paramètres" />
        </View>

        {/* Balance + Buttons */}
        <View className="mt-6 bg-gray-100 rounded-xl p-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-xl font-bold">
                {showBalance ? `${cardData?.balance?.toLocaleString('fr-FR') ?? 0} XAF` : "**** XAF"}
              </Text>
              <Text className="text-sm text-gray-500">Solde disponible</Text>
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
              <Text className="text-black font-semibold ml-2">Retrait</Text>
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
              <Text className="text-white font-semibold ml-2">Recharger</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Transactions */}
        <View className="mt-6 mb-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="font-bold text-gray-700">Historique des transactions</Text>
            <TouchableOpacity onPress={handleRefresh}>
              <Ionicons name="refresh" size={20} color="#7ddd7d" />
            </TouchableOpacity>
          </View>
          
          {isTransactionsLoading ? (
            <ActivityIndicator size="small" color="#7ddd7d" />
          ) : (
            <FlatList
              data={cardTransactions?.data || []}
              renderItem={({ item }) => <TransactionItem item={item} />}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={
                <Text className="text-center py-4 text-gray-500">
                  Aucune transaction récente
                </Text>
              }
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </View>

      {/* Modal */}
      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-transparent bg-opacity-40">
          <View className="bg-gray-200 p-6 rounded-xl w-4/5">
            <View className="items-center mb-4">
              {modalType === "success" ? (
                <Ionicons name="checkmark-circle" size={48} color="#7ddd7d" />
              ) : (
                <Ionicons name="close-circle" size={48} color="#ff6b6b" />
              )}
            </View>
            <Text className="text-center mb-4">{modalMessage}</Text>
            <Pressable
              className="bg-[#7ddd7d] py-3 rounded-md"
              onPress={() => setModalVisible(false)}
            >
              <Text className="text-white text-center font-bold">OK</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <StatusBar style="light" /> 
    </View>
  );
};

export default ManageVirtualCard;