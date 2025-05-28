import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const transactions = [
  {
    title: "Sortie Restau",
    amount: "500000xaf",
    date: "16/05/2025",
    participants: "SD VS JD SD YS +3",
    status: "En attente",
  },
  {
    title: "Cotisation Anniversaire",
    amount: "500000xaf",
    date: "16/05/2025",
    participants: "SD VS JD SD YS +3",
    status: "Complete",
  },
  {
    title: "Sortie Restau",
    amount: "500000xaf",
    date: "16/05/2025",
    participants: "SD VS JD SD YS +3",
    status: "Décliné",
  },
];

const getStatusStyle = (status) => {
  switch (status) {
    case "Complete":
      return "bg-green-100 text-green-600";
    case "En attente":
      return "bg-orange-100 text-orange-600";
    case "Décliné":
      return "bg-red-100 text-red-600";
    default:
      return "bg-gray-200 text-gray-600";
  }
};

const HistoryScreen = () => {
  const navigation = useNavigation();

  const handleTransactionPress = (transaction) => {
    navigation.navigate("DetailScreen", { transaction }); // 👈 Envoie les données
  };

  return (
    <View className="flex-1 bg-[#e8f5e9]">
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingTop: 50,
          paddingBottom: 15,
          paddingHorizontal: 20,
          backgroundColor: "#7ddd7d",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>

        <Text style={{ fontSize: 18, fontWeight: "bold", color: "#000" }}>
          Historique
        </Text>

        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* Filtrer */}
      <View className="flex-row items-center justify-end px-4 py-2">
        <TouchableOpacity className="flex-row items-center space-x-1">
          <Text className="text-gray-700 font-medium">Filtrer</Text>
          <Ionicons name="filter" size={18} color="gray" />
        </TouchableOpacity>
      </View>

      {/* Liste des transactions */}
      <ScrollView className="px-4">
        {transactions.map((tx, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleTransactionPress(tx)}
            className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-200"
          >
            <View className="flex-row justify-between items-center">
              <Text className="font-bold text-base text-black">{tx.title}</Text>
              <Text className="font-semibold text-sm text-black">
                {tx.amount}
              </Text>
            </View>
            <Text className="text-gray-600 text-sm mt-1">{tx.date}</Text>
            <Text className="text-gray-500 text-xs">{tx.participants}</Text>
            <View className="mt-2">
              <Text
                className={`self-end px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                  tx.status
                )}`}
              >
                {tx.status}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default HistoryScreen;
