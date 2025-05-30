import React from "react";
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import TopLogo from "../../images/TopLogo.png";

const AddRecipient = ({ navigation }) => {
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
        <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 30 }}>
          Ajouter le destinataire
        </Text>

        {/* Full Name */}
        <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>Nom complet</Text>
        <TextInput
          style={{ 
            backgroundColor: "#f5f5f5", 
            padding: 16, 
            borderRadius: 8, 
            marginBottom: 20,
            fontSize: 16,
            color: "#999"
          }}
          placeholder="Entrez le nom..."
        />

        {/* Email */}
        <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>Adresse Email</Text>
        <TextInput
          style={{ 
            backgroundColor: "#f5f5f5", 
            padding: 16, 
            borderRadius: 8, 
            marginBottom: 20,
            fontSize: 16
          }}
          placeholder="mail@mail.com"
          keyboardType="email-address"
        />

        {/* Phone Number */}
        <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>Numero de téléphone</Text>
        <TextInput
          style={{ 
            backgroundColor: "#f5f5f5", 
            padding: 16, 
            borderRadius: 8, 
            marginBottom: 20,
            fontSize: 16
          }}
          placeholder="000-000-000"
          keyboardType="phone-pad"
        />

        {/* Physical Address */}
        <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>Adresse physique</Text>
        <TextInput
          style={{ 
            backgroundColor: "#f5f5f5", 
            padding: 16, 
            borderRadius: 8, 
            marginBottom: 30,
            fontSize: 16,
            color: "#999",
            height: 100,
            textAlignVertical: "top"
          }}
          placeholder="Saisisez le texte...."
          multiline
        />

        {/* Divider */}
        <View style={{ height: 1, backgroundColor: "#eee", marginVertical: 16 }} />

        {/* Next Button */}
        <TouchableOpacity
          style={{
            backgroundColor: "#151c1f",
            padding: 16,
            borderRadius: 8,
            alignItems: "center",
            marginTop: 20
          }}
          onPress={() => navigation.navigate("NextScreen")}
        >
          <Text style={{ color: "white", fontSize: 16, fontWeight: "bold" }}>Suivant</Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
};

export default AddRecipient;