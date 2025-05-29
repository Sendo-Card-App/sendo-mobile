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
import TopLogo from "../../images/TopLogo.png"; // Adjust the path if needed

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

  const {
    id,
    totalAmount,
    currency,
    description,
    limitDate,
    participants = [],
    createdAt,
    initiator,
  } = transaction;

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
              await deleteSharedExpense(id).unwrap();
              console.log("Transaction deleted:", id);
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
       <View className="border border-dashed border-gray-300 my-1" />

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
        <Text className="text-gray-800 font-bold text-base">Montant total</Text>
        <Text className="text-green-500 font-bold text-lg mb-3">
          {totalAmount?.toLocaleString()} {currency}
        </Text>

        {/* Description */}
        <Text className="text-gray-800 font-bold text-base">Motif</Text>
        <Text className="text-black text-sm mb-3">
          {description || "Aucun motif"}
        </Text>

        {/* Initiator */}
        <Text className="text-gray-800 font-bold text-base">Initiateur</Text>
        <Text className="text-black text-sm mb-3">
          {initiator?.firstname} {initiator?.lastname}
        </Text>

        {/* Deadline */}
        <Text className="text-gray-800 font-bold text-base">Délai</Text>
        <Text className="text-black text-sm mb-3">
          {limitDate
            ? new Date(limitDate).toLocaleDateString()
            : new Date(createdAt).toLocaleDateString()}
        </Text>

        <View className="my-2 border-b border-dashed border-gray-300" />

        {/* Participants */}
        <Text className="text-gray-800 font-bold text-base mb-2">Destinataires</Text>
        {participants.length === 0 ? (
          <Text className="text-gray-500 text-sm">Aucun destinataire</Text>
        ) : (
          participants.map((p, index) => {
            const statusLabel = p.paymentStatus || "PENDING";
            const { bg, color } = getStatusStyle(statusLabel);
            const fullName = `${p.user?.firstname || ""} ${p.user?.lastname || ""}`.trim();
            return (
              <View
                key={index}
                className="flex-row items-center justify-between py-1"
              >
                <Text className="text-black text-sm  w-1/3">{fullName}</Text>
               
                  <Text className="text-black text-sm text-center w-1/3">{p.part?.toLocaleString()} {p.currency}</Text>
                  <View className="w-1/3 items-end">
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
          {/* Modifier Button */}
          <TouchableOpacity
            onPress={() => navigation.navigate("EditTransaction", { transaction })}
            className="bg-green-500 rounded-full py-3 items-center flex-row justify-center space-x-2"
          >
            <Ionicons name="create-outline" size={20} color="white" />
            <Text className="text-white font-semibold text-base">Modifier</Text>
          </TouchableOpacity>

          {/* Supprimer Button */}
          <TouchableOpacity
            onPress={handleDelete}
            disabled={isDeleting}
            className={`bg-red-600 rounded-full py-3 mt-5 items-center flex-row justify-center space-x-2 ${
              isDeleting ? "opacity-50" : ""
            }`}
          >
            <Ionicons name="trash-outline" size={20} color="white" />
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
import React from "react";
import {
  View,
  Dimensions,
  Text,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
const { width } = Dimensions.get("window");

const mockData = [
  {
    id: 1,
    title: "Sortie Restau",
    name: "Yvan Smith Doe",
    date: "12/05/2025",
    amount: "10,000xaf",
  },
  {
    id: 2,
    title: "Sortie Restau",
    name: "Yvan Smith Doe",
    date: "12/05/2025",
    amount: "10,000xaf",
  },
];

export default function Historique({ navigation }) {
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
          Historique
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
          <Text style={{ marginRight: 5, color: "#444" }}>Filtre</Text>
          <Ionicons name="filter" size={18} color="#444" />
        </TouchableOpacity>
      </View>

      {/* Cards */}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20 }}>
        {mockData.map((item) => (
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
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 5 }}>
              <Text style={{ fontWeight: "bold", fontSize: 16 }}>{item.title}</Text>
              <View
                style={{
                  backgroundColor: "#7ddd7d",
                  borderRadius: 6,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                }}
              >
                <Text style={{ color: "#1D84FF", fontWeight: "bold", fontSize: 12 }}>{item.amount}</Text>
              </View>
            </View>
            <Text style={{ color: "#555", marginBottom: 5 }}>{item.name}</Text>
            <Text style={{ color: "#999", fontSize: 12 }}>{item.date}</Text>

            <TouchableOpacity
              style={{
                backgroundColor: "#7ddd7d",
                paddingVertical: 10,
                borderRadius: 30,
                alignItems: "center",
                marginTop: 10,
              }}
            >
              <Text style={{ color: "#000", fontWeight: "bold" }}>Payer</Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
console.log(JSON.stringify(sharedExpensesData, null, 2));
