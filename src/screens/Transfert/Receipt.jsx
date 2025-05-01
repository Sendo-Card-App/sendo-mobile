import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Linking,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

const ReceiptScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // Suppose your API returned this URL in route.params.receiptUrl
  const receiptUrl = route.params?.receiptUrl || "https://example.com/receipt.pdf";

  const handleDownloadReceipt = () => {
    if (!receiptUrl) {
      console.warn("No receipt URL provided");
      return;
    }
    Linking.openURL(receiptUrl).catch((err) => {
      console.error("Failed to open URL:", err);
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>


        {/* Title */}
        <View className="items-center my-4 px-4">
          <Text className="text-lg font-semibold text-gray-700">
            Transferts récents
          </Text>
          <View className="flex-row justify-end items-center w-full mt-1">
            <Text className="text-green-500 font-semibold">Cacher</Text>
          </View>
        </View>

        {/* Card */}
        <View className="bg-white mx-4 p-4 rounded-xl shadow-md border border-gray-100">
          <View className="items-center mb-4">
            <View className="bg-[#7ddd7d] w-20 h-20 rounded-full justify-center items-center">
              <Text className="text-white text-5xl font-bold">i</Text>
            </View>
          </View>

          {/* Status Steps */}
          <View className="mb-4">
            <View className="flex-row items-start mb-2">
              <AntDesign name="checkcircle" size={20} color="#7ddd7d" />
              <View className="ml-2">
                <Text className="text-gray-800 font-semibold">Transmis</Text>
                <Text className="text-xs text-gray-600">
                  Lundi, 27 Janvier 2025 / 23:20
                </Text>
              </View>
            </View>
            <View className="flex-row items-start mb-2">
              <AntDesign name="checkcircle" size={20} color="#7ddd7d" />
              <View className="ml-2">
                <Text className="text-gray-800 font-semibold">Effectué</Text>
              </View>
            </View>
            <View className="flex-row items-start mb-2">
              <AntDesign name="checkcircle" size={20} color="#7ddd7d" />
              <View className="ml-2">
                <Text className="text-gray-800 font-semibold">
                  Le transfert a réussi
                </Text>
                <Text className="text-xs text-gray-600">
                  Lundi, 27 Janvier 2025 / 23:23
                </Text>
              </View>
            </View>
          </View>

          {/* Confirmation message */}
          <Text className="text-gray-800 font-semibold text-sm mb-2">
            André Djoumdjeu a reçu votre transfert.
          </Text>

          {/* Bénéficiaire Info */}
          <Text className="text-gray-600 text-sm">
            Bénéficiaire :{" "}
            <Text className="font-semibold">ANDRÉ DJOUMDJEU</Text>
          </Text>
          <Text className="text-gray-600 text-sm">Paiement : Orange Money</Text>
          <Text className="text-gray-600 text-sm mb-2">
            Numéro : +237 696 00 00 00
          </Text>

          {/* Détails Reçu */}
          <Text className="text-green-600 font-semibold my-1">Reçu</Text>
          <Text className="text-gray-600 text-sm">Visa...0000</Text>
          <Text className="text-gray-600 text-sm">Frais de transfert</Text>
          <Text className="text-gray-600 text-sm">Montant du transfert</Text>
          <Text className="text-gray-600 text-sm mb-2">
            Total pour le bénéficiaire
          </Text>

          {/* Autres détails */}
          <Text className="text-green-600 font-semibold mt-2">
            Détails du transfert
          </Text>
          <Text className="text-gray-600 text-sm">
            Envoyé : 27 Janvier 2025 / 23:20
          </Text>
          <Text className="text-gray-600 text-sm">
            Reçu : 27 Janvier 2025 / 23:23 UTC
          </Text>
          <Text className="text-gray-600 text-sm">
            ID du transfert : 000000000000000000000000000000
          </Text>

          {/* Télécharger le reçu */}
          <TouchableOpacity
            onPress={handleDownloadReceipt}
            className="bg-[#7ddd7d] py-3 mt-4 rounded-lg items-center"
          >
            <Text className="text-white font-bold">TÉLÉCHARGER LE REÇU</Text>
          </TouchableOpacity>
        </View>

        {/* Afficher tous les transferts */}
        <TouchableOpacity
          onPress={() => navigation.navigate("History")}
          className="items-center mt-6"
        >
          <Text className="text-green-500 font-semibold">
            AFFICHER TOUS LES TRANSFERTS
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ReceiptScreen;
