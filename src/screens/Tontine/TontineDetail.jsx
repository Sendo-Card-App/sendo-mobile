import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useNavigation } from "@react-navigation/native";

const TopLogo = require("../../images/TopLogo.png");

const TontineDetail = () => {
  const navigation = useNavigation();

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

      {/* Center logo */}
      <View className="absolute top-[-48px] left-0 right-0 items-center">
        <Image source={TopLogo} className="h-[130px] w-[160px]" resizeMode="contain" />
      </View>

      {/* Dotted divider */}
      <View className="border border-dashed border-gray-300 mb-6 mx-6" />

      {/* Title */}
      <Text className="text-white text-xl font-semibold text-center mb-6">Jeunes du quartier</Text>

      {/* Action buttons */}
      <View className="px-6 space-y-4">
        <View className="flex-row justify-between">
          <TouchableOpacity
            onPress={() => navigation.navigate("Members")}
            className="bg-[#6EE7B7] rounded-lg w-[47%] h-32 justify-center items-center"
          >
            <Ionicons name="people" size={40} color="#000" />
            <Text className="text-black font-semibold mt-2">Membres</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("Cotisations")}
            className="bg-[#6EE7B7] rounded-lg w-[47%] h-32 justify-center items-center"
          >
            <Ionicons name="cash-outline" size={40} color="#000" />
            <Text className="text-black font-semibold mt-2">Cotisations</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate("Setting1")}
          className="bg-[#6EE7B7] rounded-lg mt-5 h-32 justify-center items-center"
        >
          <Ionicons name="settings-outline" size={40} color="#000" />
          <Text className="text-black font-semibold mt-2">Paramètres</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default TontineDetail;
