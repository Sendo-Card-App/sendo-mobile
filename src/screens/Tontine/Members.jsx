import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useNavigation, useRoute } from "@react-navigation/native";

const TopLogo = require("../../images/TopLogo.png");

const getStatusStyle = (status) => ({
  container:
    status === "payé"
      ? "bg-green-100 px-2 py-1 rounded-full"
      : "bg-orange-100 px-2 py-1 rounded-full",
  text:
    status === "payé"
      ? "text-green-700 text-xs font-medium"
      : "text-orange-700 text-xs font-medium",
});

const Members = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { tontineId, tontine } = route.params;
  const [filter, setFilter] = useState("date");

  const handleFilterToggle = () => {
    setFilter((prev) => (prev === "date" ? "alphabetical" : "date"));
  };

  const handleViewMember = (member) => {
  navigation.navigate("MemberDetail", { member, tontineId,tontine });
};


  const sortedMembers = [...(tontine?.membres || [])].sort((a, b) => {
    if (filter === "alphabetical") {
      const nameA = `${a.user.firstname} ${a.user.lastname}`.toLowerCase();
      const nameB = `${b.user.firstname} ${b.user.lastname}`.toLowerCase();
      return nameA.localeCompare(nameB);
    } else {
      return (
        new Date(a.dateInscription).getTime() -
        new Date(b.dateInscription).getTime()
      );
    }
  });

  return (
    <View className="flex-1 bg-[#0E1111] pt-12">
      <Toast position="top" />

      <View className="flex-row mb-4 items-center justify-between px-4">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      <View className="absolute top-[-48px] left-0 right-0 items-center">
        <Image
          source={TopLogo}
          className="h-[130px] w-[160px]"
          resizeMode="contain"
        />
      </View>

      <View className="border border-dashed border-gray-300 mb-4 mx-6" />

      <View className="bg-white rounded-2xl mx-4 p-4 flex-1">
        <View className="items-center px-4">
          <TouchableOpacity
            onPress={() => navigation.navigate("Participant", { tontineId })}
            className="bg-green-400 rounded-full py-4 px-10 mb-4 flex-row items-center justify-center space-x-2"
          >
            <Ionicons name="person-add-outline" size={16} color="black" />
            <Text className="text-black font-medium text-sm">
              Ajouter un membre
            </Text>
          </TouchableOpacity>
        </View>
        
        <View className="flex-row justify-end items-center mb-4">
          <TouchableOpacity onPress={handleFilterToggle}>
            <View className="flex-row items-center space-x-1">
              <Text className="text-sm font-medium text-gray-700">
                {filter === "date" ? "Tri: Date" : "Tri: A → Z"}
              </Text>
              <Ionicons name="filter" size={18} color="gray" />
            </View>
          </TouchableOpacity>
        </View>
          <Text className="text-black text-xl font-bold text-center mb-6">
            Liste des Membre
          </Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          {sortedMembers.map((member, index) => {
            const fullName = `${member.user.firstname} ${member.user.lastname}`;
            const status = "payé"; // Replace later with actual logic
            const statusStyle = getStatusStyle(status);

            return (
              <View
                key={index}
                className="bg-gray-100 rounded-lg px-4 py-4 mb-3 flex-row items-center justify-between"
              >
                <View>
                  <Text className="text-black font-bold">{fullName}</Text>
                </View>
                <TouchableOpacity onPress={() => handleViewMember(member)}>
                  <Ionicons name="eye-outline" size={22} color="black" />
                </TouchableOpacity>

              </View>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

export default Members;
