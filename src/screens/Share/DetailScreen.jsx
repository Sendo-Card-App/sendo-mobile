import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useDeleteSharedExpenseMutation } from "../../services/Shared/sharedExpenseApi";
import TopLogo from "../../images/TopLogo.png"; // Adjust path if needed

const getStatusStyle = (status) => {
  switch (status?.toUpperCase()) {
    case "PAYÉ":
    case "COMPLETE":
      return { bg: "#d4f5d4", color: "#0a8f0a" };
    case "EN ATTENTE":
    case "PENDING":
      return { bg: "#fdeacc", color: "#e69500" };
    case "DECLINED":
      return { bg: "#ffd6d6", color: "#d32f2f" };
    default:
      return { bg: "#e0e0e0", color: "#555" };
  }
};

const DetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const transaction = route.params?.transaction;

  const [deleteSharedExpense, { isLoading: isDeleting }] = useDeleteSharedExpenseMutation();

  if (!transaction) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text>Transaction data not found.</Text>
      </View>
    );
  }

  const { totalAmount, description, deadline, participants = [] } = transaction;

  const handleDelete = () => {
    Alert.alert(
      "Confirmer la suppression",
      "Voulez-vous vraiment supprimer cette transaction ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteSharedExpense(transaction.id).unwrap();
              console.log("Transaction deleted:", transaction.id);
              navigation.goBack();
            } catch (error) {
              console.error("Deletion failed:", error);
              Alert.alert("Erreur", "La suppression a échoué. Veuillez réessayer.");
            }
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-[#151c1f] relative">
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View
        style={{
          backgroundColor: "#151c1f",
          height: 100,
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
          paddingTop: 50,
          paddingHorizontal: 20,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Centered Logo */}
      <View className="absolute -top-12 left-0 right-0 items-center justify-center">
        <Image source={TopLogo} className="h-36 w-40" resizeMode="contain" />
      </View>

      {/* Scrollable Content */}
      <ScrollView
        className="mt-20 bg-white rounded-2xl p-4 mx-4"
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        {/* Total Amount */}
        <Text className="text-gray-800 font-semibold text-base">Montant total</Text>
        <Text className="text-blue-600 font-bold text-lg mb-3">
          {totalAmount?.toLocaleString()} XAF
        </Text>

        {/* Description */}
        <Text className="text-gray-800 font-semibold text-base">Motif</Text>
        <Text className="text-black text-sm mb-3">
          {description || "Aucun motif"}
        </Text>

        {/* Deadline */}
        <Text className="text-gray-800 font-semibold text-base">Délai</Text>
        <Text className="text-black text-sm mb-3">
          {deadline
            ? new Date(deadline).toLocaleDateString()
            : new Date(transaction.createdAt).toLocaleDateString()}
        </Text>

        <View className="my-2 border-b border-dashed border-gray-300" />

        {/* Participants */}
        <Text className="text-gray-800 font-semibold text-base mb-2">Destinataires</Text>
        {participants.length === 0 ? (
          <Text className="text-gray-500 text-sm">Aucun destinataire</Text>
        ) : (
          participants.map((p, index) => {
            const statusLabel = p.status || "PENDING";
            const { bg, color } = getStatusStyle(statusLabel);
            return (
              <View
                key={index}
                className="flex-row items-center justify-between py-1"
              >
                <Text className="text-black text-sm">{p.name || p.initials}</Text>
                <View className="flex-row items-center space-x-2">
                  <Text className="text-black text-sm">{p.amount} XAF</Text>
                  <View
                    style={{
                      backgroundColor: bg,
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 12,
                    }}
                  >
                    <Text style={{ color, fontSize: 12 }}>{statusLabel}</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}

        {/* Buttons */}
        <View className="mt-6 space-y-3">
          <TouchableOpacity
            onPress={() => navigation.navigate("EditTransaction", { transaction })}
            className="bg-blue-600 rounded-full py-3 items-center"
          >
            <Text className="text-white font-semibold text-base">Modifier</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDelete}
            disabled={isDeleting}
            className={`bg-red-600 rounded-full py-3 mt-5 items-center ${isDeleting ? "opacity-50" : ""}`}
          >
            <Text className="text-white font-semibold text-base">
              {isDeleting ? "Suppression..." : "Supprimer"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default DetailScreen;
