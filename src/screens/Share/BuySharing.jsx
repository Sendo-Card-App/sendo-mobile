import React from "react";
import {
  View,
  Dimensions,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useGetUserProfileQuery } from "../../services/Auth/authAPI";
import { useGetSharedListQuery } from "../../services/Shared/sharedExpenseApi";
import { skipToken } from "@reduxjs/toolkit/query";
import { useTranslation } from "react-i18next";
import TransactionSkeleton from "../../components/TransactionSkeleton";

const { width } = Dimensions.get("window");

export default function Historique({ navigation }) {
  const { t } = useTranslation();
  const { data: userProfile, isLoading: profileLoading } = useGetUserProfileQuery();
  const userId = userProfile?.data?.id;

  const { data: sharedExpensesList, isLoading: expensesLoading } = useGetSharedListQuery(
    userId ?? skipToken
  );
  console.log(sharedExpensesList);

  const sharedExpenses = sharedExpensesList?.data || [];
 //console.log("Full response:", JSON.stringify(sharedExpenses, null, 2));
  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING":
        return "#FFA500";
      case "PAID":
      case "COMPLETED":
        return "#4CAF50";
      case "CANCELLED":
        return "#F44336";
      default:
        return "#9E9E9E";
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("his.title")}</Text>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* Filter */}
      <View style={styles.filterContainer}>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterText}>{t("his.filter")}</Text>
          <Ionicons name="filter" size={18} color="#444" />
        </TouchableOpacity>
      </View>

      {/* Loading */}
      {(profileLoading || expensesLoading) ? (
        <FlatList
          data={[1, 2, 3, 4, 5]}
          keyExtractor={(item) => item.toString()}
          renderItem={() => <TransactionSkeleton />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          {sharedExpenses.length === 0 ? (
            <Text style={styles.noExpensesText}>
              {t("his.no_expenses")}
            </Text>
          ) : (
            sharedExpenses.map((item) => {
              const expense = item.sharedExpense;
              const status = expense.status;
              const isPayable = !(status === "CANCELLED" || status === "PAID" || status === "COMPLETED");

              const initiatorName = expense.initiator
                ? `${expense.initiator.firstname}`
                : t("his.unknown");

              return (
                <View key={item.id} style={styles.card}>
                  {/* Description and Amount */}
                  <View style={styles.rowSpaceBetween}>
                    <Text style={styles.descriptionText}>{expense.description}</Text>
                    <View style={styles.amountContainer}>
                      <Text style={styles.amountText}>
                        {expense.totalAmount} {expense.currency}
                      </Text>
                    </View>
                  </View>

                  {/* Participants */}
                  {/* <View style={styles.rowSpaceBetween}>
                    <Text style={styles.participantsText}>
                      {expense.participants?.map((p) => p.user?.firstname || "").join(", ") || initiatorName}
                    </Text>
                  </View> */}

                  {/* Date and Status */}
                  <View style={styles.rowSpaceBetweenCenter}>
                    <Text style={styles.dateText}>
                      {new Date(expense.createdAt).toLocaleDateString()}
                    </Text>
                    {!isPayable && (
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
                        <Text style={styles.statusText}>
                          {t(`his.status.${status.toLowerCase()}`)}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Cancel Reason */}
                  {status === "CANCELLED" && expense.cancelReason?.trim() !== "" && (
                    <View style={{ marginTop: 8 }}>
                      <Text style={styles.cancelReasonText}>
                        {t("his.cancel_reason")}: {expense.cancelReason}
                      </Text>
                    </View>
                  )}

                  {/* Pay Button */}
                  {isPayable && (
                    <TouchableOpacity
                      onPress={() => navigation.navigate("DemandDetailScreen", { item })}
                      style={styles.payButton}
                    >
                      <Text style={styles.payButtonText}>
                        {t("his.payer")}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F3F5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 15,
    paddingHorizontal: 20,
    backgroundColor: "#7ddd7d",
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#000" },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 5,
  },
  filterButton: { flexDirection: "row", alignItems: "center" },
  filterText: { marginRight: 5, color: "#444" },
  scrollViewContent: { paddingHorizontal: 20, paddingBottom: 20 },
  noExpensesText: { textAlign: "center", marginTop: 20, color: "#777" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  rowSpaceBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  rowSpaceBetweenCenter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  descriptionText: { fontWeight: "bold", fontSize: 16, flex: 1 },
  amountContainer: {
    backgroundColor: "#7ddd7d",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  amountText: { fontWeight: "bold" },
  participantsText: { fontWeight: "bold", flex: 1 },
  dateText: { color: "#999", fontSize: 12 },
  statusBadge: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: { color: "#fff", fontSize: 12 },
  cancelReasonText: { fontSize: 13, color: "#F44336" },
  payButton: {
    backgroundColor: "#7ddd7d",
    paddingVertical: 10,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 10,
  },
  payButtonText: { color: "#000", fontWeight: "bold" },
});
