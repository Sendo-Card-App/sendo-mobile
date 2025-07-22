import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  useGetVirtualCardsQuery,
  useGetVirtualCardDetailsQuery,
  useFreezeCardMutation,
  useUnfreezeCardMutation,
  useGetCardTransactionsQuery,
} from "../../services/Card/cardApi";

export default function TransactionHistory({ navigation }) {
  // Fetch all cards
  const { data: cards, isLoading: isCardsLoading } = useGetVirtualCardsQuery();
  console.log("Cards Data:", JSON.stringify(cards, null, 2));
  // Manage selected card state
  const [selectedCardId, setSelectedCardId] = useState(null);

  // Fetch selected card details
  const {
    data: cardDetails,
    isLoading: isDetailsLoading,
    refetch: refetchCardDetails,
  } = useGetVirtualCardDetailsQuery(selectedCardId, {
    skip: !selectedCardId,
  });

  // Extract card data
  const cardData = cardDetails?.data;
 console.log("Card Data:", JSON.stringify(cardData, null, 2));
  // Fetch transactions for the selected card
  const {
    data: cardTransactions,
    isLoading: isTransactionsLoading,
    refetch: refetchTransactions,
  } = useGetCardTransactionsQuery(cardData?.id, {
    skip: !cardData?.id,
  });
 console.log("Full response:", JSON.stringify(cardTransactions, null, 2));
  // Freeze/unfreeze mutations
  const [freezeCard] = useFreezeCardMutation();
  const [unfreezeCard] = useUnfreezeCardMutation();

  const isCardFrozen = cardData?.status === "FROZEN";
  const rejectionAttempts = cardData?.paymentRejectNumber ?? 0;
  const limit = 3;

  // Automatically select the first card when cards data arrives
  useEffect(() => {
    if (cards?.data && cards.data.length > 0 && !selectedCardId) {
      setSelectedCardId(cards.data[0].id);
    }
  }, [cards]);

  // Render a single transaction
  const renderTransactionItem = ({ item }) => (
    <View
      style={{
        padding: 16,
        borderBottomColor: "#e5e7eb",
        borderBottomWidth: 1,
        flexDirection: "row",
        justifyContent: "space-between",
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: "600", color: "#111827" }}>
          {item.description}
        </Text>
        <Text style={{ color: "#4b5563", fontSize: 12 }}>
          {new Date(item.createdAt).toLocaleDateString()} - {item.status}
        </Text>
      </View>
      <View style={{ justifyContent: "center" }}>
        <Text
          style={{
            fontWeight: "700",
            color: item.status === "FAILED" ? "#dc2626" : "#22c55e",
          }}
        >
          {item.amount} {item.currency}
        </Text>
      </View>
    </View>
  );

  if (isCardsLoading) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#22c55e" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      {/* Header */}
      <SafeAreaView
        style={{
          backgroundColor: "#22c55e",
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderBottomColor: "#e5e7eb",
            borderBottomWidth: 1,
          }}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 4 }}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "bold",
              color: "#333",
              flex: 1,
              textAlign: "center",
            }}
            numberOfLines={1}
          >
            {cardData?.cardName || "Ma Carte"}
          </Text>
          <TouchableOpacity onPress={() => navigation.openDrawer()} style={{ padding: 4 }}>
            <Ionicons name="menu-outline" size={28} color="#333" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Card selector */}
      <View style={{ padding: 12 }}>
        <Text style={{ marginBottom: 8, fontWeight: "600", fontSize: 16 }}>
          Sélectionnez une carte:
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
          {cards?.data?.map((card) => (
            <TouchableOpacity
              key={card.id}
              onPress={() => setSelectedCardId(card.id)}
              style={{
                padding: 10,
                marginRight: 10,
                marginBottom: 10,
                backgroundColor: card.id === selectedCardId ? "#22c55e" : "#e5e7eb",
                borderRadius: 8,
                minWidth: 120,
              }}
            >
              <Text
                style={{
                  color: card.id === selectedCardId ? "white" : "#111827",
                  fontWeight: "600",
                }}
                numberOfLines={1}
              >
                {card.cardName}
              </Text>
              <Text style={{ color: card.id === selectedCardId ? "white" : "#6b7280" }}>
                **** **** **** {card.last4Digits}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Card info */}
      {isDetailsLoading ? (
        <ActivityIndicator style={{ marginTop: 20 }} size="large" color="#22c55e" />
      ) : (
        cardData && (
          <View
            style={{
              padding: 16,
              borderBottomColor: "#d1d5db",
              borderBottomWidth: 1,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: "700", marginBottom: 4 }}>
              {cardData.cardName}
            </Text>
            <Text>Status: {cardData.status}</Text>
            <Text>Last 4 digits: **** **** **** {cardData.last4Digits}</Text>
            <Text>Expiration: {cardData.expirationDate}</Text>
            <Text>
              Transactions rejetées: {rejectionAttempts} / {limit}
            </Text>
          </View>
        )
      )}

      {/* Freeze/unfreeze button */}
      {cardData && (
        <View style={{ padding: 16, flexDirection: "row", justifyContent: "center" }}>
          <TouchableOpacity
            onPress={async () => {
              try {
                if (isCardFrozen) {
                  await unfreezeCard(cardData.id).unwrap();
                } else {
                  await freezeCard(cardData.id).unwrap();
                }
                refetchCardDetails();
              } catch (err) {
                console.error("Error freezing/unfreezing card:", err);
              }
            }}
            style={{
              backgroundColor: isCardFrozen ? "#22c55e" : "#ef4444",
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 24,
            }}
          >
            <Text style={{ color: "white", fontWeight: "600" }}>
              {isCardFrozen ? "Débloquer la carte" : "Geler la carte"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Transactions list */}
      <View style={{ flex: 1 }}>
        {isTransactionsLoading ? (
          <ActivityIndicator size="large" color="#22c55e" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={cardTransactions?.data?.items || []}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderTransactionItem}
            ListEmptyComponent={
              <Text style={{ textAlign: "center", marginTop: 20, color: "#6b7280" }}>
                Aucun historique de transactions.
              </Text>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}
