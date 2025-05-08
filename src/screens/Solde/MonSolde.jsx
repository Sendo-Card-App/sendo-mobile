import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import React, { useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useGetBalanceQuery } from "../../services/WalletApi/walletApi";
import { useGetUserProfileQuery } from "../../services/Auth/authAPI";

const MonSolde = () => {
  const navigation = useNavigation();
  
  // First get the user profile to get the userId
  const { data: userProfile, isLoading: isProfileLoading, error: profileError } = useGetUserProfileQuery();
  const userId = userProfile?.data.id;
  
  // Then get the balance using the userId
  const { 
     data: balanceData, 
     isLoading: isBalanceLoading,
     error: balanceError,
     isError: isBalanceError
   } = useGetBalanceQuery(userId, {
     skip: !userId // Skip the query if userId is not available
   });

  const isLoading = isProfileLoading || isBalanceLoading;
  
  // Handle API errors
  useEffect(() => {
    if (balanceError) {
      if (balanceError.status === 404) {
        Alert.alert('Erreur', 'Utilisateur non trouvé');
      } else if (balanceError.status === 500) {
        Alert.alert('Erreur', 'Erreur serveur. Veuillez réessayer plus tard.');
      } else {
        Alert.alert('Erreur', 'Une erreur est survenue lors de la récupération du solde');
      }
    }
  }, [balanceError]);

  return (
    <View className="flex-1 p-5">
      <Text className="mt-4 mb-5">Solde</Text>

      {isLoading ? (
        <ActivityIndicator color="#0D1C6A" />
      ) : isBalanceError ? (
        <Text className="text-red-500">Erreur de chargement du solde</Text>
      ) : (
        <Text className="text-xl font-bold">
          {balanceData?.data.balance || "0.00"} {balanceData?.data.currency || "XAF"}
        </Text>
      )}

      {/* Rest of your component remains the same */}
      <View className="flex-row justify-between px-4 mt-10">
        <TouchableOpacity
          className="bg-[#7ddd7d] w-20 h-20 rounded-full items-center justify-center shadow-sm shadow-black mx-2"
          onPress={() => navigation.navigate("PaymentMethod")}
        >
          <Ionicons name="add-circle-outline" size={28} color="white" />
          <Text className="text-center text-white text-xs font-bold mt-1">Recharger</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-[#5dade2] w-20 h-20 rounded-full items-center justify-center shadow-sm shadow-black mx-2"
          onPress={() => navigation.navigate("Withdrawal")}
        >
          <Ionicons name="remove-circle-outline" size={28} color="white" />
          <Text className="text-center text-white text-xs font-bold mt-1">Retrait</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-[#f39c12] w-20 h-20 rounded-full items-center justify-center shadow-sm shadow-black mx-2"
          onPress={() => navigation.navigate("SelectMethod")}
        >
          <Ionicons name="swap-horizontal-outline" size={28} color="white" />
          <Text className="text-center text-white text-xs font-bold mt-1">Transfert</Text>
        </TouchableOpacity>
      </View>

      <Text className="font-extrabold text-gray-800 border-b border-t border-gray-400 pt-6 pb-1 border-dashed text-lg">
        Solde parrainage
      </Text>

      <Text className="font-extrabold text-gray-800 mt-2 text-lg">
        0,00 CAD
      </Text>

      <Text className="text-sm text-gray-400">
        Vous recevrez 5.00 CAD et votre ami recevra 5,00 CAD lors de son premier
        transfert. Des exigences d’envoi minimales peuvent s’appliquer.
        <Text className="underline"> Sous réserve de conditions.</Text>
      </Text>

      <Text className="text-[#7ddd7d] font-bold text-sm my-4">
        PARTAGEZ VOTRE CODE DE PARRAINAGE
      </Text>
    </View>
  );
};

export default MonSolde;