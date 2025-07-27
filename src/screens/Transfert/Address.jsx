import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  Platform,
} from "react-native";
import { AntDesign, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { StatusBar } from "expo-status-bar";

import button from "../../images/ButtomLogo.png";
import HomeImage from "../../images/HomeImage2.png";

const Address = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { t } = useTranslation();

  const {
    contact,
    amount,
    convertedAmount,
    totalAmount,
    transferFee,
    fromCurrency,
    toCurrency,
    countryName,
    cadRealTimeValue,
    provider,
  } = route.params;

    const user = contact.ownerUser;
    const [formData, setFormData] = useState({
      firstname: user?.firstname || contact.name?.split(" ")[0] || "",
      lastname: user?.lastname || contact.name?.split(" ").slice(1).join(" ") || "",
      phone: contact.phone || user?.phone || "",
      country: countryName,
      address: user?.address || "",
      email: user?.email || "",
      description: "",
    });

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    const requiredFields = [
      "firstname",
      "lastname",
      "phone",
      "country",
      "email",
      "address",
    ];
    const emptyFields = requiredFields.filter(
      (field) => !formData[field]?.trim()
    );

    if (emptyFields.length > 0) {
      Toast.show({
        type: "error",
        text1: "Champs requis",
        text2: "Veuillez remplir tous les champs obligatoires.",
      });
      return;
    }

    navigation.navigate("Confirme", {
      formData,
      amount,
      convertedAmount,
      totalAmount,
      transferFee,
      provider,
      fromCurrency,
      toCurrency,
      cadRealTimeValue,
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <StatusBar style="light" />
      <View style={{ flexDirection: "row", alignItems: "center", padding: 10 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="arrowleft" size={24} color="white" />
        </TouchableOpacity>
        <Image
          source={button}
          style={{ width: 100, height: 80, marginLeft: 50 }}
          resizeMode="contain"
        />
        <Image
          source={HomeImage}
          style={{ width: 70, height: 70, marginTop: -15, marginLeft: 10 }}
          resizeMode="contain"
        />
        <MaterialIcons
          name="menu"
          size={24}
          color="white"
          style={{ marginLeft: "auto" }}
          onPress={() => navigation.openDrawer()}
        />
      </View>

      <View
        style={{
          borderColor: "gray",
          borderWidth: 1,
          borderStyle: "dashed",
          marginBottom: 10,
        }}
      />
      <Text
        style={{
          textAlign: "center",
          color: "white",
          fontSize: 24,
          fontWeight: "bold",
        }}
      >
        {t("addressScreen.title")}
      </Text>

      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: 20 }}
        enableOnAndroid
        extraScrollHeight={Platform.OS === "ios" ? 100 : 120}
        keyboardShouldPersistTaps="handled"
      >
        {[
          "firstname",
          "lastname",
          "phone",
          "country",
          "email",
          "address",
          "description",
        ].map((field) => (
          <View key={field} style={{ marginBottom: 15 }}>
            <Text style={{ color: "white", marginBottom: 5 }}>
              {t(`addressScreen.fields.${field}`)}
              {field !== "description" && (
                <Text style={{ color: "red" }}> *</Text>
              )}
            </Text>
            <TextInput
              style={{
                backgroundColor: "white",
                borderRadius: 10,
                padding: 12,
              }}
              value={formData[field]}
              editable={field !== "phone"}
              onChangeText={(text) => handleInputChange(field, text)}
              placeholder={t(`addressScreen.placeholders.${field}`)}
            />
          </View>
        ))}

        <TouchableOpacity
          style={{
            backgroundColor: "green",
            padding: 15,
            borderRadius: 15,
            alignItems: "center",
            marginTop: 10,
          }}
          onPress={handleNext}
        >
          <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>
            {t("addressScreen.nextButton")}
          </Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>

      <View
        style={{
          padding: 15,
          alignItems: "center",
          flexDirection: "row",
          justifyContent: "center",
        }}
      >
        <Ionicons name="shield-checkmark" size={18} color="orange" />
        <Text style={{ color: "white", marginLeft: 5, fontSize: 12 }}>
          {t("addressScreen.footerNote")}
        </Text>
      </View>

      <Toast />
    </View>
  );
};

export default Address;
