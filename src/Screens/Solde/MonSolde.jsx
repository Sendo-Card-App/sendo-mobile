import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import { useNavigation } from "@react-navigation/native";

const MonSolde = () => {
  const navigation = useNavigation();
  return (
    <View className="flex-1 p-5">
      <Text>Solde</Text>
      <Text>0,00 XAF</Text>

      <View className="border-b border-dashed pb-4 mt-4">
        <TouchableOpacity
          className="bg-[#7ddd7d] py-3 rounded-lg shadow-sm shadow-black"
          //   onPress={() => navigation.navigate("BankCard")}
        >
          <Text className="text-center text-lg font-bold">Recharger</Text>
        </TouchableOpacity>
      </View>

      {/*  */}
      <View className="border-b border-dashed pb-4 mt-4">
        <TouchableOpacity
          className="bg-[#7ddd7d] py-3 rounded-lg shadow-sm shadow-black"
          onPress={() => navigation.navigate("PayBill")}
        >
          <Text className="text-center text-lg font-bold">
            Payer les factures
          </Text>
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
