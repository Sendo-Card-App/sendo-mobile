import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import TopLogo from "../../images/TopLogo.png";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";
import { useCreateFundRequestMutation } from "../../services/Fund/fundApi";
import Loader from "../../components/Loader";

const ConfirmInformation = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { amount, description, deadline, recipients } = route.params || {};
  const [createFundRequest, { isLoading }] = useCreateFundRequestMutation();

  const handleSubmit = async () => {
  try {
    const payload = {
      amount: parseFloat(amount),
      description,
      deadline,
      recipients: recipients.map(r => ({
        matriculeWallet: r.matriculeWallet,
      })),
    };

    await createFundRequest(payload).unwrap();


    navigation.navigate("SuccessSharing", {
      transactionDetails: "Votre demande de fond a été créée avec succès.",
    });
  } catch (error) {
    Toast.show({
      type: "error",
      text1: t("confirmDemand.error_title"),
      text2: error?.data?.message || t("confirmDemand.error_message"),
    });
  }
};

  return (
    <View style={{ flex: 1, backgroundColor: "#151c1f" }}>
      <StatusBar style="light" />

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
        }}
      >
        <Image
          source={TopLogo}
          style={{ height: 140, width: 160 }}
          resizeMode="contain"
        />
      </View>
       <View className="border border-dashed border-gray-300" />
      {/* Content */}
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          marginTop: 80,
          backgroundColor: "#fff",
          borderRadius: 20,
          marginHorizontal: 20,
        }}
      >
        <Text
          style={{
            fontSize: 22,
            fontWeight: "bold",
            marginBottom: 20,
            color: "#151c1f",
          }}
        >
          {t("confirmDemand.confirm_information")}
        </Text>

        {/* Amount */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontWeight: "bold", marginBottom: 4 }}>
            {t("confirmDemand.total_amount")}
          </Text>
          <Text>{amount ? `${amount} XAF` : "N/A"}</Text>
        </View>

        {/* Description */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontWeight: "bold", marginBottom: 4 }}>
            {t("confirmDemand.service_description")}
          </Text>
          <Text>{description || "N/A"}</Text>
        </View>

        {/* Deadline */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontWeight: "bold", marginBottom: 4 }}>
            {t("confirmDemand.deadline")}
          </Text>
          <Text>{deadline || "N/A"}</Text>
        </View>

        {/* Recipients */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontWeight: "bold", marginBottom: 4 }}>
            {t("confirmDemand.recipients")}
          </Text>
          {recipients && recipients.length > 0 ? (
            recipients.map((recipient, index) => (
              <Text key={index}>
                - {recipient.name} ({recipient.matriculeWallet || "N/A"})
              </Text>
            ))
          ) : (
            <Text>{t("confirmDemand.no_recipients")}</Text>
          )}
        </View>

        {/* Confirm Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          style={{
            backgroundColor: "#7ddd7d",
            paddingVertical: 14,
            borderRadius: 30,
            alignItems: "center",
            marginTop: 20,
          }}
        >
          {isLoading ? (
                        <Loader color="green" />
                      ) : (
          <Text style={{ color: "#000", fontWeight: "bold" }}>
            {t("confirmDemand.confirm")}
          </Text>
                      )}
        </TouchableOpacity>
      </ScrollView>

      {/* Toast */}
      <Toast />
    </View>
  );
};

export default ConfirmInformation;
