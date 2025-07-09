import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useState } from "react";
import { AntDesign, Ionicons, FontAwesome5 } from "@expo/vector-icons";
import ButtomLogo1 from "../../images/ButtomLogo1.png";
import CardImg from "../../images/VirtualCard.png";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from "react-i18next";
import {
  useGetVirtualCardsQuery,
  useGetVirtualCardDetailsQuery,
} from "../../services/Card/cardApi";

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
  } = useGetVirtualCardDetailsQuery(selectedCardId, {
    skip: !selectedCardId,
  });

  const cardData = cardDetails?.data;
 //console.log(cardData)
  useEffect(() => {
    if (cards?.data?.length > 0) {
      setSelectedCardId(cards.data[0].cardId); // set correct cardId
    }
  }, [cards]);

  const TransactionCard = () => (
    <View className="p-2 my-2 flex-row items-center gap-4">
      <AntDesign name="checkcircle" size={30} color="#7ddd7d" />
      <View className="flex-1">
        <View className="flex-row justify-between border-b border-gray-400 py-2">
          <Text className="font-bold text-gray-600">André Djoumdjeu</Text>
          <Text className="text-gray-800 font-extrabold">20,000 FCFA</Text>
        </View>
        <View className="flex-row justify-between px-2">
          <Text className="text-sm font-light">Eﬀectué</Text>
          <Text className="text-sm font-light">21/12/2024 à 10:18</Text>
        </View>
      </View>
    </View>
  );

  if (isCardsLoading || (selectedCardId && isDetailsLoading)) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#7ddd7d" />
        <Text>{t("loading")}</Text>
      </View>
    );
  }

  if (cardsError || detailsError) {
    return (
      <View className="flex-1 justify-center items-center bg-white px-4">
        <Text className="text-red-500 text-center">
          {t("error.loadingCardData")}
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-[#7ddd7d] flex-1 pt-0 relative">
      {/* Header */}
      <View className="border-b border-dashed border-white flex-row justify-between py-4 mt-5 items-center mx-5 pt-5">
        <Image source={ButtomLogo1} className="h-11 w-40" />
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={28} color="white" />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <Text className="text-center text-white text-2xl my-1 font-bold">
        {t("manageVirtualCard.title")}
      </Text>

      {/* Main Content */}
      <View className="flex-1 gap-3 py-3 bg-white px-4 rounded-t-3xl">
        <View className="w-4 h-4 bg-[#7ddd7d] rounded-full ml-auto" />

        {/* Balance */}
        <View className="flex-row items-center justify-between">
          <Text className="text-black font-extralight">
            {t("manageVirtualCard.balance")}
          </Text>
          <Text className="text-[#7ddd7d] font-bold text-lg">
            {cardData?.balance ?? "0"} XAF
          </Text>
        </View>

        {/* Virtual Card */}
        <View className="relative">
          <Image
            source={CardImg}
            className="w-full"
            style={{ height: width / 1.66 }}
            resizeMode="contain"
          />
          <View className="absolute top-0 bottom-0 left-0 right-[50%] px-4 py-6">
            <View className="flex-1 justify-center">
              <Text className="text-white font-light text-sm">
                **** **** **** {cardData?.last4Digits ?? "0000"}
              </Text>
              <Text className="text-white font-light text-sm mt-2">
                {t("manageVirtualCard.cvv")} ***
              </Text>
            </View>
            <View className="mt-4">
              <Text className="text-white font-extralight text-xl">
                {t("manageVirtualCard.cardHolder")}
              </Text>
              <Text className="text-white font-bold text-sm">
                {cardData?.cardName}
              </Text>
              <Text className="font-extralight text-sm text-yellow-400 mt-3">
                {t("manageVirtualCard.expires")} {cardData?.expirationDate}
              </Text>
            </View>
          </View>
        </View>

        {/* Recharge & Withdraw Buttons with cardId */}
        <View className="flex-row justify-between gap-4 w-[90%] mx-auto mt-2">
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("CardAction", {
                cardId: cardData?.id,
                action: "recharge",
              })
            }
            className="bg-[#7ddd7d] flex-1 flex-row items-center justify-center py-3 rounded-lg shadow-sm shadow-black"
          >
            <Ionicons name="cash-outline" size={20} color="white" />
            <Text className="text-white text-lg font-bold ml-2">
              {t("manageVirtualCard.rechargeButton")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              navigation.navigate("CardAction", {
                cardId: cardData?.id,
                action: "withdraw",
              })
            }
            className="bg-red-400 flex-1 flex-row items-center justify-center py-3 rounded-lg shadow-sm shadow-black"
          >
            <FontAwesome5 name="money-bill-wave" size={18} color="white" />
            <Text className="text-white text-lg font-bold ml-2">
              {t("manageVirtualCard.withdrawButton")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Transaction History */}
        <View className="border-t border-dashed mt-4 flex-1">
          <Text className="font-bold text-gray-600 py-2 px-2">
            {t("manageVirtualCard.transactionHistory")}
          </Text>

          <FlatList
            data={[1, 2, 3, 4, 5, 6]}
            renderItem={({ item }) => <TransactionCard />}
            keyExtractor={(item, index) => index.toString()}
            showsVerticalScrollIndicator={false}
          />

          <Text className="text-center my-3 text-[#7ddd7d] text-lg">
            {t("manageVirtualCard.showAllTransfers")}
          </Text>
        </View>
      </View>

      <StatusBar style="light" />
    </View>
  );
};

export default ManageVirtualCard;
