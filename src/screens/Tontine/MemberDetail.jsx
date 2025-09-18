import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";

import {
  useGetMemberPenaltiesQuery,
  useGetValidatedCotisationsQuery,
} from "../../services/Tontine/tontineApi";

const TopLogo = require("../../images/TopLogo.png");
const avatarImage = require("../../images/Avatar.png");

const MemberDetail = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const { member, tontineId, tontine } = route.params || {};
  const membreId = member?.id;

  const tabOptions = {
    Cotisations: "memberDetail.tab_contributions",
    Pénalités: "memberDetail.tab_penalties",
    Historique: "memberDetail.tab_history",
  };
  const [activeTab, setActiveTab] = useState("Cotisations");

 const {
  data: penaltiesResponse = {},
  isLoading: loadingPenalties,
  error,
} = useGetMemberPenaltiesQuery({ tontineId, membreId,
    pollingInterval: 1000, // Refetch every 30 seconds
 });

const penalties = penaltiesResponse.data || [];
console.log("Penalties response:", penaltiesResponse);


  const {
    data: allCotisations,
    error: cotisationError,
  } = useGetValidatedCotisationsQuery({ tontineId,membreId,
      pollingInterval: 1000, // Refetch every 30 seconds
   });


  const memberCotisations = allCotisations?.data || [];


  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  if (!member || !member.user) {
    return (
      <View className="flex-1 bg-[#0C121D] items-center justify-center">
        <Text className="text-white">
          {t("memberDetail.no_member_selected")}
        </Text>
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
        <View className="flex-row mt-1 items-center justify-between px-4 pt-1">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <Ionicons name="menu-outline" size={26} color="#fff" />
          </TouchableOpacity>
        </View>

        <View className="absolute top-[-48] left-0 right-0 items-center">
          <Image
            source={TopLogo}
            className="h-[100px] w-[160px]"
            resizeMode="contain"
          />
        </View>

        <View className="border border-dashed border-gray-300 mb-1 mx-4" />
        <View className="bg-white rounded-t-3xl mt-8" style={{ height: 30 }} />
      </View>

      {/* MAIN CONTENT */}
      <ScrollView className="flex-1 bg-white -mt-6">
        {/* Profile */}
        <View className="bg-white border border-black rounded-xl mx-4 p-4 mt-4 mb-6 shadow">
          <View className="flex-row items-center">
            <Image
              source={avatarImage}
              className="w-16 h-16 rounded-full mr-4"
              resizeMode="cover"
            />
            <View className="flex-1">
              <Text className="text-sm font-semibold">
                {t("memberDetail.name")}:{" "}
                <Text className="font-normal">
                  {firstname} {lastname}
                </Text>
              </Text>
              <Text className="text-sm font-semibold">
                {t("memberDetail.contact")}:{" "}
                <Text className="font-normal">{phone}</Text>
              </Text>
              <Text className="text-sm font-semibold">
                {t("memberDetail.email")}:{" "}
                <Text className="font-normal">{email}</Text>
              </Text>
              <Text className="text-sm font-semibold">
                {t("memberDetail.member_since")}:{" "}
                <Text className="font-normal">
                  {createdAt ? formatDate(createdAt) : "N/A"}
                </Text>
              </Text>
              <View className="flex-row items-center justify-between mt-1">
                <Text className="text-sm font-semibold">
                  {t("memberDetail.role")}: <Text className="font-normal">{role}</Text>
                </Text>
                {/* <Feather name="edit-2" size={14} color="#000" /> */}
              </View>
            </View>
          </View>

          <View className="bg-green-100 rounded-full px-3 py-1 mt-3 w-[90px] items-center">
            <Text className="text-green-700 text-xs font-bold">{etat}</Text>
          </View>
        </View>

        {/* Tabs */}
        <View className="flex-row justify-around mb-4 px-4">
          {Object.entries(tabOptions).map(([tabKey, transKey]) => (
            <TouchableOpacity key={tabKey} onPress={() => setActiveTab(tabKey)}>
              <Text
                className={`${
                  activeTab === tabKey
                    ? "text-green-500 border-b-2 border-green-500"
                    : "text-gray-400"
                } pb-1 font-medium`}
              >
                {t(transKey)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Filter */}
        <View className="flex-row justify-end items-center px-4 mb-2">
          <TouchableOpacity
            onPress={() => Toast.show({ text1: "Filtre à venir !" })}
          >
            <View className="flex-row items-center">
              <Text className="text-sm text-gray-400 mr-1">
                {t("memberDetail.filter")}
              </Text>
              <Feather name="filter" size={16} color="#ccc" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View className="px-4 mb-10">
          {activeTab === "Cotisations" && (
            <>
              {memberCotisations.length === 0 ? (
                <Text className="text-gray-400 text-center text-sm">
                  {t("memberDetail.no_cotisations")}
                </Text>
              ) : (
                memberCotisations.map((cotisation, index) => (
                  <View
                    key={cotisation.id || index}
                    className="flex-row justify-between items-center py-2 mb-5 border-b border-gray-200"
                  >
                    <View className="flex-1">
                      <Text className="text-gray-700">
                        {cotisation.membre?.user?.firstname}{" "}
                        {cotisation.membre?.user?.lastname}
                      </Text>
                      <Text className="text-xs text-gray-500">
                        {cotisation.createdAt
                          ? formatDate(cotisation.createdAt)
                          : "Date inconnue"}
                      </Text>
                    </View>
                    <View className="flex-row items-center px-7">
                      <Text
                        className={`font-semibold ${
                          cotisation.statutPaiement === "VALIDATED"
                            ? "text-green-600"
                            : "text-orange-500"
                        }`}
                      >
                        {cotisation.montant.toLocaleString()} xaf
                      </Text>
                      <Text className="text-xs text-gray-500 ml-4">
                        {cotisation.statutPaiement === "VALIDATED"
                          ? t("memberDetail.paid")
                          : t("memberDetail.pending")}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </>
          )}

          {activeTab === "Pénalités" && (
            <>
              {tontine?.type === "FIXE" && (
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate("AddPenalty", {
                      member,
                      tontineId,
                      tontine,
                    })
                  }
                  className="bg-red-400 rounded-full py-4 px-4 mb-4 flex-row items-center justify-center space-x-2"
                >
                  <Text className="text-white font-semibold text-sm">
                    {t("memberDetail.new_penalty")}
                  </Text>
                </TouchableOpacity>
              )}

              {loadingPenalties ? (
                <Text className="text-gray-500 text-sm text-center">
                  Loading...
                </Text>
              ) : error ? (
                <Text className="text-red-500 text-sm text-center">
                  Error loading data.
                </Text>
              ) : penalties.length === 0 ? (
                <Text className="text-gray-400 text-center text-sm">
                  {t("memberDetail.no_penalties")}
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
                        <Text className="font-bold">{t("date")}: </Text>
                        {penalty.createdAt
                          ? formatDate(penalty.createdAt)
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
                          {penalty.statut === "UNPAID"
                            ? t("memberDetail.unpaid")
                            : t("memberDetail.paid")}
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
              {t("memberDetail.history_coming_soon")}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default MemberDetail;
