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
