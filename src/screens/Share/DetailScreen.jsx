import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import TopLogo from "../../images/TopLogo.png"; // Vérifie le chemin du logo

const destinataires = [
  { name: "Yannick Smith", amount: "2000 xaf", status: "Payé" },
  { name: "Sarah Jeanne", amount: "10,000 xaf", status: "En attente" },
  { name: "Lydia Mys", amount: "3000 xaf", status: "En attente" },
];

const getStatusStyle = (status) => {
  switch (status) {
    case "Payé":
      return { bg: "#d4f5d4", color: "#0a8f0a" };
    case "En attente":
      return { bg: "#fdeacc", color: "#e69500" };
    default:
      return { bg: "#e0e0e0", color: "#555" };
  }
};

const DetailScreen = () => {
  const navigation = useNavigation();

  return (
    <View className="flex-1 bg-[#151c1f] relative">
      <StatusBar style="light" />

      {/* Header */}
      <View
        style={{
          backgroundColor: "#151c1f",
          height: 100,
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
          paddingTop: 50,
          paddingHorizontal: 20,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Logo centré en haut */}
      <View className="absolute -top-12 left-0 right-0 items-center justify-center">
        <Image source={TopLogo} className="h-36 w-40" resizeMode="contain" />
      </View>

      {/* Contenu dans ScrollView blanc */}
      <ScrollView
        className="mt-20 bg-white rounded-2xl p-4 mx-4"
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        {/* Montant total */}
        <Text className="text-gray-800 font-semibold text-base">Montant total</Text>
        <Text className="text-blue-600 font-bold text-lg mb-3">15,000 Xaf</Text>

        {/* Motif */}
        <Text className="text-gray-800 font-semibold text-base">Motif</Text>
        <Text className="text-black text-sm mb-3">Sortie Restaurant</Text>

        {/* Délai */}
        <Text className="text-gray-800 font-semibold text-base">Délai</Text>
        <Text className="text-black text-sm mb-3">30/05/2025</Text>

        <View className="my-2 border-b border-dashed border-gray-300" />

        {/* Destinataires */}
        <Text className="text-gray-800 font-semibold text-base mb-2">Destinataires</Text>
        {destinataires.map((item, index) => {
          const { bg, color } = getStatusStyle(item.status);
          return (
            <View
              key={index}
              className="flex-row items-center justify-between py-1"
            >
              <Text className="text-black text-sm">{item.name}</Text>
              <View className="flex-row items-center space-x-2">
                <Text className="text-black text-sm">{item.amount}</Text>
                <View
                  style={{
                    backgroundColor: bg,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ color, fontSize: 12 }}>{item.status}</Text>
                </View>
              </View>
            </View>
          );
        })}

        {/* Boutons */}
        <View className="mt-6 space-y-3">
          <TouchableOpacity
            className="bg-[#7ddd7d] py-3 rounded-full items-center flex-row justify-center space-x-2"
            onPress={() => alert("Modifier")}
          >
            <Text className="text-black font-bold text-base">Modifier</Text>
            <MaterialIcons name="edit" size={18} color="#000" />
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-red-500 py-3 rounded-full items-center flex-row justify-center space-x-2"
            onPress={() => alert("Supprimer")}
          >
            <Text className="text-white font-bold text-base">Supprimer</Text>
            <Ionicons name="trash-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default DetailScreen;
