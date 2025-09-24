import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  Platform,
} from "react-native";
import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { FontAwesome6 } from "@expo/vector-icons";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useGetUserProfileQuery } from "../../services/Auth/authAPI";

const { width, height } = Dimensions.get("window");
const isSmallScreen = width < 375;

const Payment = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { data: userProfile, isLoading: isProfileLoading } = useGetUserProfileQuery();

  useEffect(() => {
    if (!isProfileLoading && userProfile?.virtualCard?.status) {
      const status = userProfile.virtualCard.status;
      if (status === "ACTIVE" || status === "PRE_ACTIVE") {
        navigation.navigate("ManageVirtualCard");
      }
    }
  }, [userProfile, isProfileLoading]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t("payment2.virtual_card_title")}</Text>
      <Text style={styles.subtitle}>{t("payment2.virtual_card_description")}</Text>

      <View style={styles.cardSection}>
        <TouchableOpacity
          style={[styles.cardButton, { backgroundColor: "#7ddd7d" }]}
          onPress={() => navigation.navigate("OnboardingCard")}
        >
          <MaterialCommunityIcons name="credit-card-plus-outline" size={24} color="#fff" />
          <Text style={styles.buttonText}>{t("payment2.create_virtual")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.cardButton, { backgroundColor: "#5c6165" }]}
          onPress={() => navigation.navigate("ManageVirtualCard")}
        >
          <MaterialCommunityIcons name="credit-card-edit-outline" size={24} color="#fff" />
          <Text style={styles.buttonText}>{t("payment2.manage_virtual")}</Text>
        </TouchableOpacity>
      </View>

      {/* <View style={styles.bankSection}>
        <View style={styles.bankHeader}>
          <MaterialCommunityIcons name="bank-outline" size={24} color="#4B5563" />
          <Text style={styles.bankTitle}>{t("payment2.connect_bank")}</Text>
          <FontAwesome6 name="arrow-right-long" size={18} color="#4B5563" />
        </View>
        <Text style={styles.bankDescription}>
          {t("payment2.connect_description")}
        </Text>
      </View> */}

      <TouchableOpacity
        style={[styles.ctaButton, { backgroundColor: "#7ddd7d" }]}
        onPress={() => navigation.navigate("VerifyIdentity")}
      >
        <Text style={styles.buttonText}>{t("payment2.get_visa")}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate("MainTabs")}
        style={styles.floatingHomeButton}
      >
        <Ionicons
          name="home"
          size={isSmallScreen ? 36 : 44}
          color="#7ddd7d"
        />
      </TouchableOpacity>

      <StatusBar backgroundColor="#7ddd7d" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#F9FAFB",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 6,
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 16,
  },
  cardSection: {
    flexDirection: "column",
    gap: 12,
    marginBottom: 24,
  },
  cardButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    elevation: 2,
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  bankSection: {
    paddingVertical: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderStyle: "dashed",
    borderColor: "#D1D5DB",
    marginBottom: 24,
  },
  bankHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  bankTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4B5563",
  },
  bankDescription: {
    fontSize: 14,
    color: "#6B7280",
  },
  ctaButton: {
    padding: 14,
    borderRadius: 12,
    elevation: 2,
    alignItems: "center",
  },
  floatingHomeButton: {
    position: "absolute",
    top: Platform.select({
      ios: height * 0.82,
      android: height * 0.8,
    }),
    right: 20,
    zIndex: 999,
    backgroundColor: "rgba(235, 248, 255, 0.9)",
    padding: 10,
    borderRadius: 20,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
});

export default Payment;
