import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useNavigation } from "@react-navigation/native";

const TopLogo = require("../../Images/TopLogo.png");
const avatarImage = require("../../Images/Avatar.png");

const MemberPenalty = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState("Pénalités");

  const penalties = [
    {
      title: "Cotisation Manqué",
      deadline: "19/06/2025",
      amount: "120,000 xaf",
    },
    {
      title: "Amande",
      deadline: "19/06/2025",
      amount: "15,000 xaf",
    },
  ];

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
              <Text className="text-sm font-semibold">
                Nom: <Text className="font-normal">Mireille Doe</Text>
              </Text>
              <Text className="text-sm font-semibold">
                Adresse: <Text className="font-normal">Bonamoussadi</Text>
              </Text>
              <Text className="text-sm font-semibold">
                Contact: <Text className="font-normal">612-345-678</Text>
              </Text>
              <Text className="text-sm font-semibold">
                Membre depuis: <Text className="font-normal">02/10/2024</Text>
              </Text>
              <View className="flex-row items-center justify-between mt-1">
                <Text className="text-sm font-semibold">
                  Role: <Text className="font-normal">Membre</Text>
                </Text>
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

        {/* Filtre et bouton */}
        <View className="flex-row justify-between items-center px-4 mb-4">
          <TouchableOpacity
            className="bg-red-400 py-3 px-6 rounded-full"
            onPress={() => Toast.show({ text1: "Ajout de pénalité..." })}
          >
            <Text className="text-white font-semibold text-sm">
              Nouvelle pénalité
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => Toast.show({ text1: "Filtre à venir !" })}>
            <View className="flex-row items-center ml-4">
              <Text className="text-sm text-gray-300 mr-1">Filtre</Text>
              <Feather name="filter" size={16} color="#ccc" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Liste des pénalités */}
        <View className="px-4 mb-10">
          {penalties.map((item, index) => (
            <View
              key={index}
              className="bg-white p-3 rounded-xl mb-3 flex-row justify-between items-center"
            >
              <View>
                <Text className="text-red-600 font-semibold text-sm">
                  {item.title}
                </Text>
                <Text className="text-gray-700 text-xs">
                  Delaie: {item.deadline}
                </Text>
              </View>
              <View className="bg-gray-100 rounded-full px-3 py-1">
                <Text className="text-gray-800 text-xs font-bold">
                  {item.amount}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </>
  );
};

export default MemberPenalty;
