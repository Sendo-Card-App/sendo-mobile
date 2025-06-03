import React from "react";
import {
  View,
  Dimensions,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGetUserProfileQuery } from "../../services/Auth/authAPI";
import { useGetSharedExpensesQuery } from "../../services/Shared/sharedExpenseApi";
import { skipToken } from "@reduxjs/toolkit/query";
import { useTranslation } from "react-i18next";

const { width } = Dimensions.get("window");

export default function Historique({ navigation }) {
  const { t } = useTranslation();
  const { data: userProfile, isLoading: profileLoading } = useGetUserProfileQuery();
  const userId = userProfile?.data?.id;

  const {
    data: sharedExpensesData,
    isLoading: expensesLoading,
  } = useGetSharedExpensesQuery(userId ? { userId } : skipToken);
 // console.log(JSON.stringify(sharedExpensesData, null, 2));
  const sharedExpenses = sharedExpensesData?.data || [];

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return "#FFA500";
      case "PAID":
        return "#4CAF50";
      case "CANCELLED":
        return "#F44336";
      default:
        return "#9E9E9E";
    }
  };

  const getUserPart = (item) => {
    const participant = item.participants?.find(p => p.userId === userId);
    return participant?.part;
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F0F3F5" }}>
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
          {t("his.title")}
        </Text>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* Filter */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          paddingHorizontal: 20,
          marginTop: 10,
          marginBottom: 5,
        }}
      >
        <TouchableOpacity style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ marginRight: 5, color: "#444" }}>{t("his.filter")}</Text>
          <Ionicons name="filter" size={18} color="#444" />
        </TouchableOpacity>
      </View>

      {/* Loading */}
      {(profileLoading || expensesLoading) ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#7ddd7d" />
          <Text style={{ marginTop: 10 }}>{t("his.loading")}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20 }}>
          {sharedExpenses.length === 0 ? (
            <Text style={{ textAlign: "center", marginTop: 20, color: "#777" }}>
              {t("his.no_data")}
            </Text>
          ) : (
            sharedExpenses.map((item) => {
              const userPart = getUserPart(item);
              const initiatorName = item.initiator
                ? `${item.initiator.firstname} `
                : t("his.unknown");

              return (
                <View
                  key={item.id}
                  style={{
                    backgroundColor: "#fff",
                    borderRadius: 10,
                    padding: 15,
                    marginBottom: 15,
                    shadowColor: "#000",
                    shadowOpacity: 0.1,
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 4,
                    elevation: 2,
                  }}
                >
                  {/* Description and Amount */}
                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 5 }}>
                    <Text style={{ fontWeight: "bold", fontSize: 16, flex: 1 }}>
                      {item.description}
                    </Text>
                    <View
                      style={{
                        backgroundColor: "#7ddd7d",
                        borderRadius: 6,
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        marginLeft: 8,
                      }}
                    >
                      <Text style={{ fontWeight: "bold" }}>
                        {item.totalAmount} {item.currency}
                      </Text>
                    </View>
                  </View>

                  

                  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 5 }}>
                    <Text style={{ fontWeight: "bold", flex: 1 }}>
                      {item.participants?.length > 0
                        ? item.participants
                            .map((p) => `${p.user?.firstname || ""} `)
                            .join(", ")
                        : initiatorName}
                    </Text>
                  </View>


                  {/* Date */}
                  <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
                    <Text style={{ color: "#999", fontSize: 12 }}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </Text>
                  </View>

                  {/* Pay Button */}
                    <TouchableOpacity
                      onPress={() => navigation.navigate("DemandDetailScreen", { item })}
                      style={{
                        backgroundColor: "#7ddd7d",
                        paddingVertical: 10,
                        borderRadius: 30,
                        alignItems: "center",
                        marginTop: 10,
                      }}
                    >
                      <Text style={{ color: "#000", fontWeight: "bold" }}>
                        {t("his.payer")}
                      </Text>
                    </TouchableOpacity>
                  
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}
