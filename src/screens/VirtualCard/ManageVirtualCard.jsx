import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from "react-native";
import React from "react";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import ButtomLogo from "../../images/ButtomLogo.png";
import Card from "../../images/VirtualCard.png";
import { StatusBar } from "expo-status-bar";
import { useTranslation } from 'react-i18next';

const ManageVirtualCard = ({ navigation }) => {
  const { t } = useTranslation();
  const { width } = Dimensions.get("screen");

  const TransactionCard = () => {
    return (
      <View className="p-2 my-2 flex-row items-center gap-4">
        <AntDesign
          name="checkcircle"
          size={30}
          color="#7ddd7d"
          className="mt-3"
        />
        <View className="flex-1">
          <View className="flex-row justify-between border-b border-gray-400 py-2">
            <Text className="font-bold text-gray-600">André Djoumdjeu</Text>
            <Text className="text-gray-800 font-extrabold">0,00 FCFA</Text>
          </View>
          <View className="flex-row justify-between px-2">
            <Text className="text-sm font-light">Eﬀectué</Text>
            <Text className="text-sm font-light">21/12/2024 à 10:18</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View className="bg-[#7ddd7d] flex-1 pt-0 relative">
      {/* Header */}
      <View className="border-b border-dashed border-white flex-row justify-between py-4 mt-10 items-center mx-5 pt-5">
        <Image source={ButtomLogo} className="h-11 w-40" />
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <Text className="text-center text-white text-2xl my-3">
        {t('manageVirtualCard.title')}
      </Text>

      {/* Main Content */}
      <View className="flex-1 gap-3 py-3 bg-white px-4 rounded-t-3xl">
        <View className="w-4 h-4 bg-[#7ddd7d] rounded-full ml-auto" />
        
        <View className="flex-row items-center">
          <Text className="text-black font-extralight mr-2">
            {t('manageVirtualCard.balance')}
          </Text>
          <Text className="text-[#7ddd7d] bg-white text-center">786 000 XAF</Text>
        </View>

        {/* Card */}
        <View className="relative">
          <Image
            source={Card}
            className="w-full"
            style={{ height: width / 1.66 }}
            resizeMode="contain"
          />
          <View className="absolute top-0 bottom-0 left-0 right-[50%] px-4 py-6">
            <View className="flex-1 justify-center">
              <View className="mt-2">
                <Text className="text-white font-extralight text-sm">
                  {t('manageVirtualCard.cardNumber')}
                </Text>
                <Text className="text-white font-extralight text-xs">
                  {t('manageVirtualCard.cvv')}
                </Text>
              </View>
            </View>
            <View>
              <Text className="text-white font-extralight text-xs">
                {t('manageVirtualCard.cardHolder')}
              </Text>
              <Text className="text-white font-bold text-sm">
                ANDRE DJOUMDJEU
              </Text>
              <Text className="font-extralight text-xs text-yellow-400 mt-3">
                {t('manageVirtualCard.expires')}
              </Text>
            </View>
          </View>
        </View>

        {/* Recharge Button */}
        <TouchableOpacity
          className="bg-[#7ddd7d] py-3 rounded-lg shadow-sm shadow-black w-[80%] mx-auto"
        >
          <Text className="text-center text-lg font-bold">
            {t('manageVirtualCard.rechargeButton')}
          </Text>
        </TouchableOpacity>

        {/* Transaction History */}
        <View className="border-t border-dashed flex-1">
          <Text className="font-bold text-gray-600 py-3 px-2">
            {t('manageVirtualCard.transactionHistory')}
          </Text>

          <FlatList
            data={[1, 2, 3, 4, 5, 6, 7, 8, 9]}
            renderItem={({ item }) => <TransactionCard />}
            ListHeaderComponent={() => (
              <Text className="text-right text-[#7ddd7d]">
                {t('manageVirtualCard.hide')}
              </Text>
            )}
          />
          <Text className="text-center my-3 text-[#7ddd7d] text-lg">
            {t('manageVirtualCard.showAllTransfers')}
          </Text>
        </View>
      </View>

      <StatusBar style="light" />
    </View>
  );
};

export default ManageVirtualCard;