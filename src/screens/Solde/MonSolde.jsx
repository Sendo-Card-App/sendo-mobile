import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useGetBalanceQuery } from "../../services/WalletApi/walletApi";
import { useGetUserProfileQuery } from "../../services/Auth/authAPI";
import { useTranslation } from 'react-i18next';

const MonSolde = () => {
  const navigation = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();
  
  // First get the user profile to get the userId
  const { data: userProfile, isLoading: isProfileLoading, error: profileError } = useGetUserProfileQuery();
  const userId = userProfile?.data.id;
  
  // Then get the balance using the userId
  const { 
    data: balanceData, 
    isLoading: isBalanceLoading,
    error: balanceError,
    isError: isBalanceError,
    refetch: refetchBalance
  } = useGetBalanceQuery(userId, {
    skip: !userId // Skip the query if userId is not available
  });

  const isLoading = isProfileLoading || isBalanceLoading;

  // Handle API errors
  useEffect(() => {
    if (balanceError) {
      if (balanceError.status === 404) {
        Alert.alert('Erreur', 'Portefeuille non trouvé');
      } else if (balanceError.status === 500) {
        Alert.alert('Erreur', 'Erreur serveur. Veuillez réessayer plus tard.');
      } else {
        Alert.alert('Erreur', 'Une erreur est survenue lors de la récupération du solde');
      }
    }
  }, [balanceError]);



  return (
    <View className="flex-1 p-5">
      <Text className="mt-4 mb-5">{t('wallet_balance.title')}</Text>

      {isLoading ? (
        <ActivityIndicator color="#0D1C6A" />
      ) : isBalanceError ? (
        <View className="flex-row items-center">
          <Text className="text-red-500 mr-2">Erreur de chargement du solde</Text>
          <TouchableOpacity onPress={refetchBalance}>
            <Ionicons name="refresh" size={20} color="#0D1C6A" />
          </TouchableOpacity>
        </View>
      ) : (
        <Text className="text-xl font-bold">
          {balanceData?.data.balance || "0.00"} {balanceData?.data.currency || "XAF"}
        </Text>
      )}

      <View className="flex-row justify-between px-4 mt-10">
        <TouchableOpacity
          className="bg-[#7ddd7d] w-20 h-20 rounded-full items-center justify-center shadow-sm shadow-black mx-2"
          onPress={() =>navigation.navigate("MethodType")}
        >
          <Ionicons name="add-circle-outline" size={28} color="white" />
          <Text className="text-center text-white text-xs font-bold mt-1">{t('wallet_balance.recharge')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-[#5dade2] w-20 h-20 rounded-full items-center justify-center shadow-sm shadow-black mx-2"
          onPress={() => navigation.navigate("Withdrawal")}
        >
          <Ionicons name="remove-circle-outline" size={28} color="white" />
          <Text className="text-center text-white text-xs font-bold mt-1">{t('wallet_balance.withdraw')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-[#f39c12] w-20 h-20 rounded-full items-center justify-center shadow-sm shadow-black mx-2"
          onPress={() => navigation.navigate("SelectMethod")}
        >
          <Ionicons name="swap-horizontal-outline" size={28} color="white" />
          <Text className="text-center text-white text-xs font-bold mt-1">{t('wallet_balance.transfer')}</Text>
        </TouchableOpacity>
      </View>

      <Text className="font-extrabold text-gray-800 border-b border-t border-gray-400 pt-6 pb-1 border-dashed text-lg">
        {t('wallet_balance.referral_balance')}
      </Text>

      <Text className="font-extrabold text-gray-800 mt-2 text-lg">
        0,00 CAD
      </Text>

      <Text className="text-sm text-gray-400">
        {t('wallet_balance.referral_terms')}
        <Text className="underline"> {t('wallet_balance.terms_conditions')}</Text>
      </Text>

      <Text className="text-[#7ddd7d] font-bold text-sm my-4">
        {t('wallet_balance.share_referral')}
      </Text>
    </View>
  );
};

export default MonSolde;