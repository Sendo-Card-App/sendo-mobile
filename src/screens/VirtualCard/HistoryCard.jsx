import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons, FontAwesome5, Entypo } from "@expo/vector-icons";
import {
  useGetVirtualCardsQuery,
  useGetVirtualCardDetailsQuery,
  useGetCardTransactionsQuery,
} from "../../services/Card/cardApi";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next"; // 🔹 import i18n

const filters = ["all", "completed", "pending", "failed"]; // 🔹 match keys in JSON

const CardHistory = () => {
  const { t } = useTranslation(); // 🔹 hook
  const [filter, setFilter] = useState("all");
  const [selectedCardId, setSelectedCardId] = useState(null);
  const navigation = useNavigation();

  // Fetch all cards
  const { data: cards, isLoading: isCardsLoading } = useGetVirtualCardsQuery();

  // Auto-select the first card if not already selected
  useEffect(() => {
    if (cards?.data?.length > 0 && !selectedCardId) {
      setSelectedCardId(cards.data[0].cardId);
    }
  }, [cards, selectedCardId]);

  // Fetch card details
  const {
    data: cardDetails,
    isLoading: isDetailsLoading,
  } = useGetVirtualCardDetailsQuery(selectedCardId, {
    skip: !selectedCardId,
    pollingInterval: 1000,
  });

  const cardData = cardDetails?.data;

  // Fetch transactions
  const {
    data: cardTransactions,
    isLoading: isTransactionsLoading,
  } = useGetCardTransactionsQuery(cardData?.id, {
    skip: !cardData?.id,
    pollingInterval: 1000,
  });

  const transactions = cardTransactions?.data?.transactions?.items || [];

  const filteredTransactions =
    filter === "all"
      ? transactions
      : transactions.filter((t) => t.status.toLowerCase() === filter);

  const getStatusIcon = (status) => {
    switch (status) {
      case "COMPLETED":
        return <Ionicons name="checkmark-circle" size={20} color="green" />;
      case "PENDING":
        return <Entypo name="hour-glass" size={20} color="orange" />;
      case "FAILED":
        return <FontAwesome5 name="times-circle" size={20} color="red" />;
      default:
        return <Ionicons name="help-circle" size={20} color="gray" />;
    }
  };

  const renderTransaction = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() =>
        navigation.navigate("TransactionDetails", { transaction: item })
      }
    >
      <View style={styles.row}>
        <Text style={styles.date}>
          {new Date(item.createdAt).toLocaleDateString()}{" "}
          {new Date(item.createdAt).toLocaleTimeString()}
        </Text>
        {getStatusIcon(item.status)}
      </View>
      <Text style={styles.description}>{item.description}</Text>
      <Text
        style={[
          styles.amount,
          { color: item.type === "WITHDRAWAL" ? "red" : "green" },
        ]}
      >
        {item.type === "WITHDRAWAL" ? "-" : "+"}
        {item.amount} {item.currency}
      </Text>
    </TouchableOpacity>
  );

  if (isCardsLoading || isDetailsLoading || isTransactionsLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#7ddd7d" />
        <Text>{t("loadingHistory")}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t("cardHistory")}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Filter Buttons */}
      <View style={styles.filterRow}>
        {filters.map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterButton,
              filter === f && styles.activeFilter,
            ]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[
                styles.filterText,
                filter === f && styles.activeFilterText,
              ]}
            >
              {t(`filters.${f}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Transaction List */}
      <FlatList
        data={filteredTransactions}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderTransaction}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{t("noTransactions")}</Text>
        }
        contentContainerStyle={
          filteredTransactions.length === 0 && {
            flex: 1,
            justifyContent: "center",
          }
        }
      />
    </View>
  );
};

export default CardHistory;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#7ddd7d",
    paddingVertical: 12,
    paddingTop: 50,
    paddingHorizontal: 16,
    justifyContent: "space-between",
  },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#fff" },
  filterRow: { flexDirection: "row", margin: 12, flexWrap: "wrap" },
  filterButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ccc",
    marginRight: 8,
    marginBottom: 8,
  },
  activeFilter: { backgroundColor: "#7ddd7d", borderColor: "#007bff" },
  filterText: { fontSize: 14, color: "#333" },
  activeFilterText: { color: "#fff", fontWeight: "bold" },
  card: {
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    marginHorizontal: 12,
    elevation: 2,
  },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  date: { fontSize: 14, color: "#666" },
  description: { fontSize: 16, marginTop: 4, marginBottom: 4 },
  amount: { fontSize: 18, fontWeight: "bold" },
  emptyText: { textAlign: "center", fontSize: 16, color: "#888", marginTop: 20 },
});
