import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { useGetMemberPenaltiesQuery } from "../../services/Tontine/tontineApi";

const TopLogo = require("../../Images/TopLogo.png");
const avatarImage = require("../../Images/Avatar.png");

const MemberDetail = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { member, tontineId, tontine } = route.params || {};
  const [activeTab, setActiveTab] = useState("Cotisations");
  const membreId = member?.id;

  const {
    data: penaltiesResponse = {},
    isLoading: loadingPenalties,
    error,
  } = useGetMemberPenaltiesQuery({ tontineId, membreId });

  const penalties = penaltiesResponse.data || [];

  const contributions = [
    { date: "03/06/2025", status: "En attente" },
    { date: "03/06/2025", status: "Payé" },
    { date: "03/06/2025", status: "Payé" },
    { date: "03/06/2025", status: "Payé" },
    { date: "03/06/2025", status: "Manqué" },
    { date: "03/06/2025", status: "Payé" },
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

  if (!member || !member.user) {
    return (
      <View className="flex-1 bg-[#0C121D] items-center justify-center">
        <Text className="text-white">Aucun membre sélectionné</Text>
      </View>
    );
  }

  const { firstname, lastname, email, phone } = member.user;
  const role = member.role;
  const etat = member.etat;
  const createdAt = member.createdAt;

  return (
    <SafeAreaView className="flex-1 bg-[#0C121D]">
      <Toast position="top" />

      {/* HEADER */}
      <View className="bg-[#0C121D] pb-1">
        <View className="flex-row mb-4 items-center justify-between px-4 pt-1">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <Ionicons name="menu-outline" size={26} color="#fff" />
          </TouchableOpacity>
        </View>

        <View className="absolute top-[-48] left-0 right-0 items-center">
          <Image source={TopLogo} className="h-[120px] w-[160px]" resizeMode="contain" />
        </View>

        <View className="border border-dashed border-gray-300 mt-1 mx-4" />
        <View className="bg-white rounded-t-3xl mt-8" style={{ height: 30 }} />
      </View>
      

      {/* MAIN CONTENT */}
      <ScrollView className="flex-1 bg-white -mt-6">
        {/* Profile */}
        <View className="bg-white border border-black rounded-xl mx-4 p-4 mt-4 mb-6 shadow">
          <View className="flex-row items-center">
            <Image source={avatarImage} className="w-16 h-16 rounded-full mr-4" resizeMode="cover" />
            <View className="flex-1">
              <Text className="text-sm font-semibold">
                Nom: <Text className="font-normal">{firstname} {lastname}</Text>
              </Text>
              <Text className="text-sm font-semibold">
                Contact: <Text className="font-normal">{phone}</Text>
              </Text>
              <Text className="text-sm font-semibold">
                Email: <Text className="font-normal">{email}</Text>
              </Text>
              <Text className="text-sm font-semibold">
                Membre depuis:{" "}
                <Text className="font-normal">
                  {createdAt ? new Date(createdAt).toLocaleDateString() : "N/A"}
                </Text>
              </Text>
              <View className="flex-row items-center justify-between mt-1">
                <Text className="text-sm font-semibold">
                  Rôle: <Text className="font-normal">{role}</Text>
                </Text>
                <Feather name="edit-2" size={14} color="#000" />
              </View>
            </View>
          </View>

          <View className="bg-green-100 rounded-full px-3 py-1 mt-3 w-[90px] items-center">
            <Text className="text-green-700 text-xs font-bold">{etat}</Text>
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

        {/* Content */}
        <View className="px-4 mb-10">
          {activeTab === "Cotisations" && (
            contributions.map((item, index) => (
              <View
                key={index}
                className="flex-row justify-between items-center py-2 mb-5 border-b border-gray-200"
              >
                <Text className="text-black">{item.date}</Text>
                <Text className={`font-semibold ${getStatusColor(item.status)}`}>
                  {item.status}
                </Text>
              </View>
            ))
          )}

          {activeTab === "Pénalités" && (
            <>
              {tontine?.type === "FIXE" && (
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("AddPenalty", { member, tontineId, tontine })
                  }
                  className="bg-red-400 rounded-full py-4 px-4 mb-4 flex-row items-center justify-center space-x-2"
                >
                  <Text className="text-white font-semibold text-sm">
                    Nouvelle pénalité
                  </Text>
                </TouchableOpacity>
              )}

              {loadingPenalties ? (
                <Text className="text-gray-500 text-sm text-center">
                  Chargement des pénalités...
                </Text>
              ) : error ? (
                <Text className="text-red-500 text-sm text-center">
                  Erreur lors du chargement.
                </Text>
              ) : penalties.length === 0 ? (
                <Text className="text-gray-400 text-center text-sm">
                  Aucune pénalité trouvée.
                </Text>
              ) : (
                <View className="space-y-4">
                  {penalties.map((penalty, index) => (
                    <View
                      key={penalty.id || index}
                      className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                    >
                      <Text className="text-red-500 font-semibold text-sm">
                        {penalty.type}
                      </Text>
                      <Text className="text-black text-xs mt-1">
                        <Text className="font-bold">Date: </Text>
                        {penalty.createdAt
                          ? new Date(penalty.createdAt).toLocaleDateString()
                          : "N/A"}
                      </Text>
                      <View className="flex-row justify-between items-center mt-2">
                        <View className="bg-gray-100 px-3 py-1 rounded-full flex-row items-center space-x-1">
                          <Text className="text-black text-xs font-semibold">
                            {penalty.montant?.toLocaleString()} xaf
                          </Text>
                          <Feather name="edit-2" size={14} color="#000" />
                        </View>
                        <Text className="text-xs font-medium text-gray-600">
                          {penalty.statut === "UNPAID" ? "Non payé" : "Payé"}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}

          {activeTab === "Historique" && (
            <Text className="text-center text-gray-500 text-sm">
              Historique à venir.
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MemberDetail;
