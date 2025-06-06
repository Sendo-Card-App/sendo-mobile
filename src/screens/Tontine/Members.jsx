import React from "react";
import { View, Text, TouchableOpacity, Image, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useNavigation } from "@react-navigation/native";

const TopLogo = require("../../images/TopLogo.png");

const members = [
  { name: "John Doe", status: "payé" },
  { name: "John Doe", status: "En attente" },
  { name: "John Doe", status: "payé" },
  { name: "John Doe", status: "payé" },
  { name: "John Doe", status: "En attente" },
  { name: "John Doe", status: "payé" },
  { name: "John Doe", status: "payé" },
];

const getStatusStyle = (status: string) => {
  return {
    container:
      status === "payé"
        ? "bg-green-100 px-2 py-1 rounded-full"
        : "bg-orange-100 px-2 py-1 rounded-full",
    text:
      status === "payé" ? "text-green-700 text-xs font-medium" : "text-orange-700 text-xs font-medium",
  };
};

const Members = () => {
  const navigation = useNavigation();

  return (
    <View className="flex-1 bg-[#0E1111] pt-12">
      <Toast position="top" />

      {/* Top nav */}
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

      {/* Divider */}
      <View className="border border-dashed border-gray-300 mb-4 mx-6" />

      {/* Container */}
      <View className="bg-white rounded-2xl mx-4 p-4">
        {/* Header Row */}
       <View className="items-center px-4 ">
          <TouchableOpacity
           onPress={() => navigation.navigate("Participant")}
          className="bg-green-400 rounded-full py-4 px-4 mb-4 flex-row items-center justify-center space-x-2">
            <Ionicons name="person-add-outline" size={16} color="black" />
            <Text className="text-black font-medium text-sm">Ajouter un membre</Text>
          </TouchableOpacity>
        </View>


        <View className="flex-row justify-end items-center mb-4">
          <TouchableOpacity>
            <View className="flex-row items-center space-x-1">
              <Text className="text-sm font-medium text-gray-700">Filtre</Text>
              <Ionicons name="filter" size={18} color="gray" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Members list */}
        <ScrollView showsVerticalScrollIndicator={false}>
          {members.map((member, index) => {
            const statusStyle = getStatusStyle(member.status);
            return (
              <View
                key={index}
                className="bg-gray-100 rounded-lg px-4 py-3 mb-3 flex-row items-center justify-between"
              >
                <View>
                  <Text className="text-black font-bold">{member.name}</Text>
                  <View className={`mt-1 ${statusStyle.container}`}>
                    <Text className={statusStyle.text}>{member.status}</Text>
                  </View>
                </View>
                <Ionicons name="eye-outline" size={22} color="black" />
              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

export default Members;
