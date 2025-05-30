import React from "react";
import { View, Text, TouchableOpacity, Image, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import TopLogo from "../../images/TopLogo.png";

const DetailsList = ({ navigation }) => {
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
          Facture No. #iv237
        </Text>

        {/* Service Description Section */}
        <View style={{ marginBottom: 30 }}>
          <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>
            Description du service
          </Text>
          <Text style={{ fontSize: 16, marginBottom: 10 }}>- Dépannage électrique</Text>
          
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 20 }}>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>Statut: </Text>
            <Ionicons name="star" size={16} color="#FFD700" />
            <Ionicons name="star" size={16} color="#FFD700" />
            <Ionicons name="star" size={16} color="#FFD700" />
            <Ionicons name="star" size={16} color="#FFD700" />
            <Ionicons name="star" size={16} color="#FFD700" />
            <Text style={{ fontSize: 16, marginLeft: 5 }}>(5 étoiles)</Text>
          </View>

          {/* Payment Table */}
          <View style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 8, marginBottom: 20 }}>
            {/* Table Row */}
            <View style={{ flexDirection: "row", borderBottomWidth: 1, borderColor: "#ddd", padding: 12 }}>
              <Text style={{ flex: 1, fontWeight: "bold" }}>Montant total</Text>
              <Text style={{ flex: 1 }}>200,000 xaf</Text>
            </View>
            {/* Table Row */}
            <View style={{ flexDirection: "row", borderBottomWidth: 1, borderColor: "#ddd", padding: 12 }}>
              <Text style={{ flex: 1, fontWeight: "bold" }}>Payé</Text>
              <Text style={{ flex: 1 }}>100,000 xaf</Text>
            </View>
            {/* Table Row */}
            <View style={{ flexDirection: "row", borderBottomWidth: 1, borderColor: "#ddd", padding: 12 }}>
              <Text style={{ flex: 1, fontWeight: "bold" }}>Reste</Text>
              <Text style={{ flex: 1 }}>100,000 xaf</Text>
            </View>
            {/* Table Row */}
            <View style={{ flexDirection: "row", borderBottomWidth: 1, borderColor: "#ddd", padding: 12 }}>
              <Text style={{ flex: 1, fontWeight: "bold" }}>Date</Text>
              <Text style={{ flex: 1 }}>27/05/2025</Text>
            </View>
            {/* Table Row */}
            <View style={{ flexDirection: "row", padding: 12 }}>
              <Text style={{ flex: 1, fontWeight: "bold" }}>Délai</Text>
              <Text style={{ flex: 1 }}>01/06/2025</Text>
            </View>
          </View>
        </View>

        {/* Recipients Section */}
        <View style={{ marginBottom: 30 }}>
          <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>
            Destinataire(s)
          </Text>
          
          <View style={{ marginBottom: 15 }}>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>Nom:</Text>
            <Text style={{ fontSize: 16, marginLeft: 10 }}>- Yannick</Text>
            <Text style={{ fontSize: 16, marginLeft: 10 }}>- Jonh Doe</Text>
          </View>

          {/* Recipient Info Table */}
          <View style={{ borderWidth: 1, borderColor: "#ddd", borderRadius: 8 }}>
            {/* Table Row */}
            <View style={{ flexDirection: "row", borderBottomWidth: 1, borderColor: "#ddd", padding: 12 }}>
              <Text style={{ flex: 1, fontWeight: "bold" }}>Adresse email</Text>
              <Text style={{ flex: 1 }}>Yannic@gmail.com</Text>
            </View>
            {/* Table Row */}
            <View style={{ flexDirection: "row", borderBottomWidth: 1, borderColor: "#ddd", padding: 12 }}>
              <Text style={{ flex: 1, fontWeight: "bold" }}>Numéro de téléphone</Text>
              <Text style={{ flex: 1 }}>612-345-678</Text>
            </View>
            {/* Table Row */}
            <View style={{ flexDirection: "row", padding: 12 }}>
              <Text style={{ flex: 1, fontWeight: "bold" }}>Adresse physique</Text>
              <Text style={{ flex: 1 }}>Bonabéri</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
};

export default DetailsList;