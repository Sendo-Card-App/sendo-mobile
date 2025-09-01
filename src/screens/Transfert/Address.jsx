import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  Platform,
  StyleSheet,
} from "react-native";
import { AntDesign, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRoute, useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { StatusBar } from "expo-status-bar";

import button from "../../images/ButtomLogo.png";
import HomeImage from "../../images/HomeImage2.png";

const COLORS = {
  background: "#F2F2F2",
  primary: "#7ddd7d",
  danger: "red",
  text: "black",
  white: "white",
  border: "#7ddd7d",
};

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
    fullname:
      (user?.firstname && user?.lastname
        ? `${user.firstname} ${user.lastname}`
        : contact.name) || "",
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
    const requiredFields = ["fullname", "phone", "email", "address"];
    const emptyFields = requiredFields.filter(
      (field) => !formData[field]?.trim()
    );

    if (emptyFields.length > 0) {
      Toast.show({
        type: "error",
        text1: "Required Fields",
        text2: "Please fill in all required fields.",
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
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="arrowleft" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Image source={button} style={styles.logo} resizeMode="contain" />
        <Image source={HomeImage} style={styles.icon} resizeMode="contain" />
        <MaterialIcons
          name="menu"
          size={24}
          color={COLORS.text}
          style={{ marginLeft: "auto" }}
          onPress={() => navigation.openDrawer()}
        />
      </View>

      <View style={styles.divider} />

      <Text style={styles.title}>{t("addressScreen.title")}</Text>

      <KeyboardAwareScrollView
        contentContainerStyle={styles.formContainer}
        enableOnAndroid
        extraScrollHeight={Platform.OS === "ios" ? 100 : 120}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inputWrapper}>
          <Text style={styles.label}>
            {t("addressScreen.fields.fullname")}
            <Text style={styles.required}> *</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={formData.fullname}
            onChangeText={(text) => handleInputChange("fullname", text)}
            placeholder={t("addressScreen.placeholders.fullname")}
          />
        </View>

        {["phone",  "address", "description"].map((field) => (
          <View key={field} style={styles.inputWrapper}>
            <Text style={styles.label}>
              {t(`addressScreen.fields.${field}`)}
              {field !== "description" && <Text style={styles.required}> *</Text>}
            </Text>
            <TextInput
              style={styles.input}
              value={formData[field]}
              editable={field !== "phone"}
              onChangeText={(text) => handleInputChange(field, text)}
              placeholder={t(`addressScreen.placeholders.${field}`)}
            />
          </View>
        ))}

        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>
            {t("addressScreen.nextButton")}
          </Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>

      <View style={styles.footerNote}>
        <Ionicons name="shield-checkmark" size={18} color="orange" />
        <Text style={styles.footerText}>
          {t("addressScreen.footerNote")}
        </Text>
      </View>

      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    marginTop:20,
  },
  logo: {
    width: 100,
    height: 80,
    marginLeft: 50,
  },
  icon: {
    width: 70,
    height: 70,
    marginTop: -15,
    marginLeft: 10,
  },
  divider: {
    borderColor: "gray",
    borderWidth: 1,
    borderStyle: "dashed",
    marginBottom: 10,
  },
  title: {
    textAlign: "center",
    color: COLORS.text,
    fontSize: 24,
    fontWeight: "bold",
  },
  formContainer: {
    padding: 20,
  },
  inputWrapper: {
    marginBottom: 15,
  },
  label: {
    color: COLORS.text,
    marginBottom: 5,
  },
  required: {
    color: COLORS.danger,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 15,
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "bold",
  },
  footerNote: {
    padding: 15,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  footerText: {
    color: COLORS.text,
    marginLeft: 5,
    fontSize: 12,
  },
});

export default Address;
