import React from "react";
import { View, Text, TouchableOpacity, Image, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import TopLogo from "../../Images/TopLogo.png";

const RequestPay = ({ navigation }) => {
  return (
    <>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View
        style={{
          height: 100,
          paddingHorizontal: 20,
          paddingTop: 48,
          backgroundColor: "#151c1f",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
        }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Logo */}
      <View
        style={{
          position: "absolute",
          top: -48,
          left: 0,
          right: 0,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Image source={TopLogo} style={{ height: 140, width: 160 }} resizeMode="contain" />
      </View>

      <View className="border border-dashed border-gray-300" />

      {/* Content */}
      <ScrollView style={{ padding: 20, marginTop: 40 }}>
        <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 20 }}>
          Détails de la demande
        </Text>

        {/* Invoice Number */}
        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 20 }}>
          Facture No. #lv237
        </Text>

        {/* Service Details Section */}
        <View style={{ marginBottom: 25 }}>
          <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>
            Description du service
          </Text>
          <Text style={{ fontSize: 16, marginBottom: 8 }}>- Dépannage éléctrique</Text>
          
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>Statut</Text>
            <Text style={{ fontSize: 16 }}>- (1) attente</Text>
          </View>

          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>Montant total</Text>
            <Text style={{ fontSize: 16 }}>200,000 xaf</Text>
          </View>

          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>Payé</Text>
            <Text style={{ fontSize: 16 }}>100,000 xaf</Text>
          </View>

          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>Reste</Text>
            <Text style={{ fontSize: 16 }}>100,000 xaf</Text>
          </View>

          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>Date</Text>
            <Text style={{ fontSize: 16 }}>27/05/2025</Text>
          </View>

          <View style={{ marginBottom: 15 }}>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>Délai</Text>
            <Text style={{ fontSize: 16 }}>01/06/2025</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: "#eee", marginVertical: 10 }} />

        {/* Initiator Section */}
        <View style={{ marginBottom: 25 }}>
          <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 15 }}>
            Initiateur
          </Text>
          
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>Nom</Text>
            <Text style={{ fontSize: 16 }}>- Yannick</Text>
            <Text style={{ fontSize: 16 }}>- Jonh Doe</Text>
          </View>

          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>Adresse email</Text>
            <Text style={{ fontSize: 16 }}>- Yannic@gmail.com</Text>
          </View>

          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>Numéro de téléphone</Text>
            <Text style={{ fontSize: 16 }}>612-345-678</Text>
          </View>

          <View style={{ marginBottom: 15 }}>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>Adresse physique</Text>
            <Text style={{ fontSize: 16 }}>- Bonabéri</Text>
          </View>
        </View>

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: "#eee", marginVertical: 10 }} />

        {/* Pay Button */}
        <TouchableOpacity
          style={{
            backgroundColor: "#151c1f",
            padding: 16,
            borderRadius: 8,
            alignItems: "center",
            marginTop: 20,
            flexDirection: "row",
            justifyContent: "center"
          }}
          onPress={() => navigation.navigate("PaymentScreen")}
        >
          <Text style={{ color: "white", fontSize: 16, fontWeight: "bold", marginRight: 8 }}>
            Payer
          </Text>
          <Text style={{ color: "white", fontSize: 16 }}>💬</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
};

export default RequestPay;