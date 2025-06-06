import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";

const TopLogo = require("../../images/TopLogo.png");
const avatarImage = require("../../images/Avatar.png"); 

const MemberDetail = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState("Cotisations");

  const contributions = [
    { date: "03/06/2025", status: "En attente" },
    { date: "03/06/2025", status: "Payé" },
    { date: "03/06/2025", status: "Payé" },
    { date: "03/06/2025", status: "Payé" },
    { date: "03/06/2025", status: "Payé" },
    { date: "03/06/2025", status: "Manqué" },
    { date: "03/06/2025", status: "Manqué" },
    { date: "03/06/2025", status: "Payé" },
    { date: "03/06/2025", status: "Payé" }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "Payé":
        return "text-green-500";
      case "Manqué":
        return "text-red-500";
      case "En attente":
        return "text-orange-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <>
      <Toast position="top" />

      <ScrollView className="flex-1 bg-[#0C121D] pt-20">
        {/* Header */}
        <View className="flex-row mb-4 items-center justify-between px-4">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <Ionicons name="menu-outline" size={26} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Logo */}
        <View className="absolute top-[-48] left-0 right-0 items-center">
          <Image
            source={TopLogo}
            className="h-[130] w-[160]"
            resizeMode="contain"
          />
        </View>

        <View className="border border-dashed border-gray-300 mb-6 mx-4" />

        {/* Profile Card */}
        <View className="bg-white rounded-xl mx-4 p-4 mb-6 shadow">
          <View className="flex-row items-center">
            <Image
              source={avatarImage}
              className="w-16 h-16 rounded-full mr-4"
              resizeMode="cover"
            />
            <View className="flex-1">
              <Text className="text-sm font-semibold">Nom: <Text className="font-normal">Mireille Doe</Text></Text>
              <Text className="text-sm font-semibold">Adresse: <Text className="font-normal">Bonamoussadi</Text></Text>
              <Text className="text-sm font-semibold">Contact: <Text className="font-normal">612-345-678</Text></Text>
              <Text className="text-sm font-semibold">Membre depuis: <Text className="font-normal">02/10/2024</Text></Text>
              <View className="flex-row items-center justify-between mt-1">
                <Text className="text-sm font-semibold">Role: <Text className="font-normal">Membre</Text></Text>
                <Feather name="edit-2" size={14} color="#000" />
              </View>
            </View>
          </View>

          <View className="bg-green-100 rounded-full px-3 py-1 mt-3 w-[90] items-center">
            <Text className="text-green-700 text-xs font-bold">Active ✓</Text>
          </View>
        </View>

        {/* Tabs */}
        <View className="flex-row justify-around mb-4 px-4">
          {["Cotisations", "Pénalités", "Historique"].map((tab) => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)}>
              <Text
                className={`${
                  activeTab === tab
                    ? "text-green-500 border-b-2 border-green-500"
                    : "text-gray-400"
                } pb-1 font-medium`}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Filter */}
        <View className="flex-row justify-end items-center px-4 mb-2">
          <TouchableOpacity onPress={() => Toast.show({ text1: "Filtre à venir !" })}>
            <View className="flex-row items-center">
              <Text className="text-sm text-gray-400 mr-1">Filtre</Text>
              <Feather name="filter" size={16} color="#ccc" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Contributions */}
        <View className="px-4 mb-10">
          {contributions.map((item, index) => (
            <View
              key={index}
              className="flex-row justify-between items-center py-2 border-b border-gray-800"
            >
              <Text className="text-white">{item.date}</Text>
              <Text className={`font-semibold ${getStatusColor(item.status)}`}>
                {item.status}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </>
  );
};

export default MemberDetail;
