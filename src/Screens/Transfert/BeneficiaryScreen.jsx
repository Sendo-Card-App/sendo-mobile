import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import Ionicons from "@expo/vector-icons/Ionicons";
import { MaterialIcons } from "@expo/vector-icons";
import HomeImage from "../../images/HomeImage2.png";
import button from "../../images/ButtomLogo.png";
import Cameroon from "../../images/Cameroon.png";
import Canada from "../../images/Canada.png";
import { StatusBar } from "expo-status-bar";
import { useNavigation } from "@react-navigation/native";

const BeneficiaryScreen = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0D0D0D" }}>
      <StatusBar backgroundColor="#0D0D0D" />
      <View style={{ padding: 20, flex: 1 }}>
        {/* Header */}
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 20,
        }}>
          <TouchableOpacity>
            <AntDesign name="arrowleft" size={24} color="white" onPress={() => navigation.goBack()} />
          </TouchableOpacity>

          <Image
            source={button}
            resizeMode="contain"
            style={{ width: 100, height: 80, marginLeft: 50 }}
          />
          <Image
            source={HomeImage}
            resizeMode="contain"
            style={{ width: 70, height: 70, marginTop: -15, marginLeft: 10 }}
          />
          <MaterialIcons
            name="menu"
            size={24}
            color="white"
            style={{ marginLeft: "auto" }}
            onPress={() => navigation.openDrawer()}
          />
        </View>

        <Text style={{
          color: "white",
          fontSize: 30,
          marginBottom: 10,
          fontWeight: "bold",
        }}>
          Bienvenue!
        </Text>
        <Text style={{ color: "white", fontSize: 16, marginBottom: 20 }}>
          Choisissez un pays pour effectuer un transfert.
        </Text>

        {/* Search Input */}
        <TextInput
          style={{
            height: 50,
            borderColor: "gray",
            borderWidth: 1,
            borderRadius: 8,
            paddingHorizontal: 10,
            color: "black",
            backgroundColor: "white",
          }}
          placeholder="Recherche par pays"
          placeholderTextColor="#aaa"
        />

        {/* Country List */}
        <ScrollView style={{ marginTop: 20 }}>
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 15,
            }}
            onPress={() => navigation.navigate("Curency", {
              countryName: "Cameroun",
              conversionRate: "1,00 CAD = 439,10 CFA",
              flagImage: Cameroon // Sending the image source
            })}
          >
            <Image
              source={Cameroon}
              resizeMode="contain"
              style={{ width: 50, height: 50 }}
            />
            <Text style={{ color: "white", marginLeft: 10 }}>Cameroun</Text>
            <Text style={{ color: "white", marginLeft: "auto" }}>
              1,00 CAD = 439,10 CFA
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 15,
            }}
            onPress={() => navigation.navigate("Curency", {
              countryName: "Canada",
              conversionRate: "439,10 CFA = 1,00 CAD",
              flagImage: Canada // Sending the image source
            })}
          >
            <Image
              source={Canada}
              resizeMode="contain"
              style={{ width: 50, height: 50 }}
            />
            <Text style={{ color: "white", marginLeft: 10 }}>Canada</Text>
            <Text style={{ color: "white", marginLeft: "auto" }}>
              439,10 CFA = 1,00 CAD
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Footer */}
      <View style={{ paddingVertical: 12, backgroundColor: '#0D0D0D' }}>
        <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
          <Ionicons name="shield-checkmark" size={18} color="orange" />
          <Text style={{ color: "white", fontSize: 12, marginLeft: 5 }}>
            Ne partagez pas vos informations personnelles…
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default BeneficiaryScreen;
