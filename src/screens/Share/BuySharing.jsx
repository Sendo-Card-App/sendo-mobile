import React, { useState } from "react";
import {
  View,
  Dimensions,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Modal,
  Pressable,
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
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all"); // "all", "pending", "paid", "cancelled"

  const { data: sharedExpensesList, isLoading: expensesLoading } = useGetSharedListQuery(
    userId ?? skipToken,
    {
      pollingInterval: 1000,
    }
  );

  const sharedExpenses = sharedExpensesList?.data || [];
   //console.log("List sharedExpenses:", JSON.stringify(sharedExpenses, null, 2));
  // Filter expenses based on selected filter
  const filteredExpenses = sharedExpenses.filter((item) => {
    const status = item.sharedExpense.status;
    const paymentStatus = item.paymentStatus;
    
    switch (activeFilter) {
      case "pending":
        return status === "PENDING" && paymentStatus === "PENDING";
      case "paid":
        return paymentStatus === "PAYED";
      case "cancelled":
        return status === "CANCELLED";
      default:
        return true; // Show all
    }
  });

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

  // Format amount with thousands separators
  const formatAmount = (amount, currency) => {
    const formattedAmount = Number(amount).toLocaleString("fr-FR");
    return `${formattedAmount} ${currency}`;
  };

  // Truncate long text with ellipsis
  const truncateText = (text, maxLength = 30) => {
    if (text && text.length > maxLength) {
      return text.substring(0, maxLength) + "...";
    }
    return text;
  };

  // Get filter button text based on active filter
  const getFilterButtonText = () => {
    switch (activeFilter) {
      case "pending":
        return t("his.filter_pending");
      case "paid":
        return t("his.filter_paid");
      case "cancelled":
        return t("his.filter_cancelled");
      default:
        return t("his.filter");
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
        <TouchableOpacity 
          style={[
            styles.filterButton,
            activeFilter !== "all" && styles.filterButtonActive
          ]} 
          onPress={() => setFilterModalVisible(true)}
        >
          <Text style={[
            styles.filterText,
            activeFilter !== "all" && styles.filterTextActive
          ]}>
            {getFilterButtonText()}
          </Text>
          <Ionicons 
            name="filter" 
            size={18} 
            color={activeFilter !== "all" ? "#7ddd7d" : "#444"} 
          />
        </TouchableOpacity>
      </View>

      {/* Filter Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={filterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t("his.filter_title")}</Text>
            
            <Pressable
              style={[
                styles.filterOption,
                activeFilter === "all" && styles.filterOptionActive
              ]}
              onPress={() => {
                setActiveFilter("all");
                setFilterModalVisible(false);
              }}
            >
              <Text style={[
                styles.filterOptionText,
                activeFilter === "all" && styles.filterOptionTextActive
              ]}>
                {t("his.filter_all")}
              </Text>
            </Pressable>
            
            <Pressable
              style={[
                styles.filterOption,
                activeFilter === "pending" && styles.filterOptionActive
              ]}
              onPress={() => {
                setActiveFilter("pending");
                setFilterModalVisible(false);
              }}
            >
              <Text style={[
                styles.filterOptionText,
                activeFilter === "pending" && styles.filterOptionTextActive
              ]}>
                {t("his.filter_pending")}
              </Text>
            </Pressable>
            
            <Pressable
              style={[
                styles.filterOption,
                activeFilter === "paid" && styles.filterOptionActive
              ]}
              onPress={() => {
                setActiveFilter("paid");
                setFilterModalVisible(false);
              }}
            >
              <Text style={[
                styles.filterOptionText,
                activeFilter === "paid" && styles.filterOptionTextActive
              ]}>
                {t("his.filter_paid")}
              </Text>
            </Pressable>
            
            <Pressable
              style={[
                styles.filterOption,
                activeFilter === "cancelled" && styles.filterOptionActive
              ]}
              onPress={() => {
                setActiveFilter("cancelled");
                setFilterModalVisible(false);
              }}
            >
              <Text style={[
                styles.filterOptionText,
                activeFilter === "cancelled" && styles.filterOptionTextActive
              ]}>
                {t("his.filter_cancelled")}
              </Text>
            </Pressable>
            
            <Pressable
              style={styles.modalCloseButton}
              onPress={() => setFilterModalVisible(false)}
            >
              <Text style={styles.modalCloseButtonText}>{t("his.close")}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

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
          {filteredExpenses.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={60} color="#CCCCCC" />
              <Text style={styles.noExpensesText}>
                {activeFilter === "all" 
                  ? t("his.no_expenses") 
                  : t("his.no_filtered_expenses", { filter: getFilterButtonText().toLowerCase() })
                }
              </Text>
            </View>
          ) : (
            filteredExpenses.map((item) => {
              const expense = item.sharedExpense;
              const status = expense.status;
              const paymentStatus = item.paymentStatus;
              const isPayable = status === "PENDING" && paymentStatus === "PENDING";

              return (
                <View key={item.id} style={styles.card}>
                  {/* Description and Amount */}
                  <View style={styles.rowSpaceBetween}>
                    <Text style={styles.descriptionText}>
                      {truncateText(expense.description)}
                    </Text>
                    <View style={styles.amountContainer}>
                      <Text style={styles.amountText}>
                        {formatAmount(expense.totalAmount, expense.currency)}
                      </Text>
                    </View>
                  </View>

                  {/* Your Part */}
                  <View style={styles.partContainer}>
                    <Text style={styles.partText}>
                      {t("his.your_part")}: {formatAmount(item.part, expense.currency)}
                    </Text>
                  </View>

                  {/* Date and Status */}
                  <View style={styles.rowSpaceBetweenCenter}>
                    <Text style={styles.dateText}>
                      {new Date(expense.createdAt).toLocaleDateString()}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
                      <Text style={styles.statusText}>
                        {paymentStatus === "PAYED" ? t("his.status.paid") : t(`his.status.${status.toLowerCase()}`)}
                      </Text>
                    </View>
                  </View>

                  {/* Cancel Reason - Only the reason in red */}
                  {status === "CANCELLED" && expense.cancelReason?.trim() !== "" && (
                    <View style={{ marginTop: 8 }}>
                      {/* <Text style={styles.cancelReasonLabel}>
                        {t("his.cancel_reason")}:
                      </Text> */}
                      <Text style={styles.cancelReasonText}>
                        {truncateText(expense.cancelReason, 40)}
                      </Text>
                    </View>
                  )}

                  {/* Pay Button - Only show for payable expenses */}
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
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#000" },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    marginTop: 15,
    marginBottom: 10,
  },
  filterButton: { 
    flexDirection: "row", 
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  filterButtonActive: {
    backgroundColor: "#e8f5e8",
    borderColor: "#7ddd7d",
    borderWidth: 1,
  },
  filterText: { marginRight: 5, color: "#444", fontSize: 14 },
  filterTextActive: { color: "#7ddd7d", fontWeight: "600" },
  scrollViewContent: { 
    paddingHorizontal: 20, 
    paddingBottom: 20,
    paddingTop: 10,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  noExpensesText: { 
    textAlign: "center", 
    marginTop: 15, 
    color: "#777",
    fontSize: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  rowSpaceBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
    alignItems: "flex-start",
  },
  rowSpaceBetweenCenter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 5,
  },
  descriptionText: { 
    fontWeight: "600", 
    fontSize: 15, 
    flex: 1,
    marginRight: 10,
    color: "#333",
  },
  amountContainer: {
    backgroundColor: "#7ddd7d",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  amountText: { 
    fontWeight: "bold", 
    fontSize: 14,
    color: "#000",
  },
  partContainer: {
    marginBottom: 8,
  },
  partText: {
    fontSize: 13,
    color: "#666",
  },
  dateText: { color: "#999", fontSize: 12 },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: { color: "#fff", fontSize: 11, fontWeight: "500" },
  cancelReasonLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  cancelReasonText: { 
    fontSize: 13, 
    color: "#F44336",
    fontWeight: "500",
  },
  payButton: {
    backgroundColor: "#7ddd7d",
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: "center",
    marginTop: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  payButtonText: { 
    color: "#000", 
    fontWeight: "bold",
    fontSize: 14,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    width: "80%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  filterOption: {
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
  },
  filterOptionActive: {
    backgroundColor: "#e8f5e8",
  },
  filterOptionText: {
    fontSize: 16,
    color: "#333",
  },
  filterOptionTextActive: {
    color: "#7ddd7d",
    fontWeight: "600",
  },
  modalCloseButton: {
    backgroundColor: "#7ddd7d",
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    alignItems: "center",
  },
  modalCloseButtonText: {
    color: "#000",
    fontWeight: "bold",
  },
});