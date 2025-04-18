import { View, Text, TouchableOpacity, TextInput } from "react-native";
import React from "react";
import { StatusBar } from "expo-status-bar";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { FontAwesome6 } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const Payment = () => {
  const navigation = useNavigation();
  return (
    <View className="flex-1 p-6">
      <Text className="text-center text-sm text-gray-400">
        Aucun moyen de paiement n’est actuellement lié à votre compte. Ajoutez
        un nouveau moyen de paiement pour vos transferts.
      </Text>
      <TouchableOpacity
        className="bg-[#7ddd7d] py-3 rounded-lg mt-5 shadow-sm shadow-black"
        onPress={() => navigation.navigate("BankCard")}
      >
        <Text className="text-center text-lg font-bold">AJOUTER UNE CARTE</Text>
      </TouchableOpacity>

      {/*  */}

      <View className="border-y mt-6 border-dashed py-4">
        <View className="flex-row gap-2 items-end">
          <MaterialCommunityIcons
            name="bank-outline"
            size={24}
            color="#4B5563"
          />
          <Text className="font-bold text-gray-600 text-lg">
            Connecter un compte bancaire
          </Text>
          <FontAwesome6
            name="arrow-right-long"
            size={24}
            color="#4B5563"
            className="ml-auto"
          />
        </View>
        <Text className="text-sm text-gray-500">
          Connectez votre compte bancaire pour commencer un transfert
        </Text>
      </View>

      {/*  */}
      <View className="py-4 mb-4 gap-4 border-b border-dashed">
        <TouchableOpacity
          className="bg-[#7ddd7d] py-3 rounded-lg shadow-sm shadow-black"
          onPress={() => navigation.navigate("CreateVirtualCard")}
        >
          <Text className="text-center text-lg font-bold">
            CRÉER UNE CARTE VIRTUELLE
          </Text>
        </TouchableOpacity>
        {/*  */}
        <TouchableOpacity
          className="bg-[#5c6165] py-3 rounded-lg shadow-sm shadow-black"
          onPress={() => navigation.navigate("ManageVirtualCard")}
        >
          <Text className="text-center text-lg font-bold">
            GÉRER MA CARTE VIRTUELLE
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        className="bg-[#7ddd7d] py-3 rounded-lg shadow-sm shadow-black"
        onPress={() => navigation.navigate("VerifyIdentity")}
      >
        <Text className="text-center text-lg font-bold">
          OBTENIR UNE CARTE VISA
        </Text>
      </TouchableOpacity>

      <Text className="font-extrabold text-gray-800 border-b border-gray-400 pt-6 pb-1 border-dashed text-lg">
        Solde bonus
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

      <View className="mb-5 py-3 mt-auto flex-row gap-4 items-center">
        <TouchableOpacity
          className="bg-[#7ddd7d] rounded-full items-center justify-center px-4 py-2"
          onPress={() => navigation.navigate("Success")}
        >
          <Text className="text-md text-center font-bold">GEN</Text>
        </TouchableOpacity>

        <TextInput className="border rounded-2xl border-gray-400 py-3.5 pl-2 flex-1" />
      </View>
      <StatusBar backgroundColor="#7ddd7d" />
    </View>
  );
};

export default Payment;
