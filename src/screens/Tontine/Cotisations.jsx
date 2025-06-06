import React from "react";
import { View, Text, TouchableOpacity, ScrollView, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useNavigation } from "@react-navigation/native";

const TopLogo = require("../../images/TopLogo.png");

const Cotisations = () => {
  const navigation = useNavigation();

  const history = [
    { name: "John Doe", amount: "45,000 xaf", date: "13/06/2025", status: "paid" },
    { name: "John Doe", amount: null, date: "", status: "pending" },
    { name: "John Doe", amount: "45,000 xaf", date: "13/06/2025", status: "paid" },
    { name: "John Doe", amount: "45,000 xaf", date: "13/06/2025", status: "paid" },
    { name: "John Doe", amount: null, date: "", status: "pending" },
    { name: "John Doe", amount: "45,000 xaf", date: "13/06/2025", status: "paid" },
    { name: "John Doe", amount: "45,000 xaf", date: "13/06/2025", status: "paid" },
  ];

  return (
    <View className="flex-1 bg-[#0E1111] pt-12">
      <Toast position="top" />

      {/* Top bar */}
      <View className="flex-row mb-4 items-center justify-between px-4">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Logo */}
      <View className="absolute top-[-48px] left-0 right-0 items-center">
        <Image source={TopLogo} className="h-[130px] w-[160px]" resizeMode="contain" />
      </View>

      {/* Cotisations Card */}
      <View className="bg-[#1C1C1E] mx-4 p-4 rounded-xl mb-4">
        <Text className="text-[#A7F3D0] text-lg font-semibold mb-3">Cotisations</Text>
        <View className="space-y-2">
          <View className="flex-row justify-between">
            <Text className="text-white">Montant total:</Text>
            <Text className="text-white font-semibold">1,200,000 xaf</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-white">Cette semaine:</Text>
            <Text className="text-white font-semibold">300,000 xaf</Text>
          </View>
          <View className="flex-row justify-between">
            <Text className="text-white">En attente:</Text>
            <Text className="text-white font-semibold">150,000 xaf</Text>
          </View>
        </View>

        <TouchableOpacity className="bg-[#34D399] mt-4 py-3 rounded-full items-center flex-row justify-center space-x-2">
          <Text className="text-black font-semibold">verser au prochain beneficiaire</Text>
          <Ionicons name="lock-closed-outline" size={18} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Historique Section */}
      <View className="mx-4 flex-1">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-[#A7F3D0] font-semibold text-base">Historique</Text>
          <TouchableOpacity className="flex-row items-center space-x-1">
            <Text className="text-white">Filtre</Text>
            <Ionicons name="filter-outline" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-between mb-2">
          <Text className="text-white">Total: 14</Text>
          <Text className="text-white">Payé: 10</Text>
          <Text className="text-white">En attente: 4</Text>
        </View>

        <ScrollView className="space-y-2">
          {history.map((item, idx) => (
            <View key={idx} className="flex-row justify-between items-center bg-[#1C1C1E] px-4 py-3 rounded-xl">
              <Text className="text-white">{item.name}</Text>
              {item.status === "paid" ? (
                <View className="bg-[#DBEAFE] px-2 py-1 rounded-full">
                  <Text className="text-[#1D4ED8] text-xs">{item.amount}</Text>
                </View>
              ) : (
                <View className="bg-[#FEF3C7] px-2 py-1 rounded-full">
                  <Text className="text-[#B45309] text-xs">En attente</Text>
                </View>
              )}
              <Text className="text-white text-sm">{item.date}</Text>
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

export default Cotisations;
