import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StatusBar,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import TopLogo from "../../images/TopLogo.png";
import { useRoute, useNavigation } from "@react-navigation/native";
import {
  useCancelSharedExpenseMutation,
  usePaySharedExpenseMutation,
} from "../../services/Shared/sharedExpenseApi";
import { useGetBalanceQuery } from "../../services/WalletApi/walletApi";
import {
  useGetUserProfileQuery,
  useGetUserByIdQuery,
} from "../../services/Auth/authAPI";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";
import Loader from "../../components/Loader";

const DemandDetailScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const route = useRoute();
  const { item } = route.params;
  //console.log(item)
  const sharedExpense = item.sharedExpense ?? item;
  // console.log(sharedExpense)

  const { data: userProfile } = useGetUserProfileQuery();
  const userId = userProfile?.data?.id;
  //console.log(userId)

  const { data: balanceData, isLoading: isBalanceLoading } = useGetBalanceQuery(userId, { skip: !userId,
      pollingInterval: 10000, // Refetch every 30 seconds
   });
  const balance = balanceData?.data?.balance || 0;

  const [cancelSharedExpense, { isLoading: isCancelLoading }] = useCancelSharedExpenseMutation();
  const [paySharedExpense, { isLoading: isPaying }] = usePaySharedExpenseMutation();

  const initiatorId = sharedExpense.userId;
  const { data: initiatorData, isLoading: isInitiatorLoading } = useGetUserByIdQuery(initiatorId, { skip: !initiatorId,
      pollingInterval: 10000, // Refetch every 30 seconds
   });
  const initiatorName = `${initiatorData?.data?.firstname ?? "N/A"} ${initiatorData?.data?.lastname ?? ""}`;

  const amount = item.part ?? sharedExpense.initiatorPart ?? "N/A";
  const currency = sharedExpense.currency ?? "";
  const description = sharedExpense.description ?? "N/A";
  const formattedDate = sharedExpense.createdAt ? new Date(sharedExpense.createdAt).toLocaleDateString("fr-FR") : "-";

  const showToast = (message, type = "success") => {
    Toast.show({ type, text1: message, position: "top", visibilityTime: 3000, autoHide: true });
  };

 const handlePay = async () => {
  if (balance < sharedExpense.totalAmount) {
    showToast("Insufficient balance", "error");
    return;
  }

  try {
    await paySharedExpense({ expenseId: sharedExpense.id }).unwrap();
    navigation.navigate("SuccessSharing", {
      transactionDetails: "Paiement effectué avec succès",
    });
  } catch (error) {
    console.log("Response:", JSON.stringify(error, null, 2));
    const msg =
      error?.data?.data?.errors?.[0] ||
      error?.data?.message ||
      "An error occurred while processing the payment";
    showToast(msg, "error");
  }
};

  const handleDecline = async () => {
    try {
      await cancelSharedExpense({ participantId: item.id }).unwrap();
      showToast("Request declined successfully.", "success");
      navigation.goBack();
    } catch (error) {
      const msg =
        error?.data?.data?.errors?.[0] ||
        error?.data?.message ||
        "An error occurred.";
      showToast(msg, "error");
    }
  };



  return (
    <View style={{ flex: 1, backgroundColor: "#0e1316" }}>
      <StatusBar barStyle="light-content" />

      <View style={{ height: 100, paddingHorizontal: 20, paddingTop: 48, backgroundColor: "#151c1f", flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomLeftRadius: 16, borderBottomRightRadius: 16 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
           <AntDesign name="left" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={{ position: "absolute", top: -48, left: 0, right: 0, alignItems: "center", justifyContent: "center" }}>
        <Image source={TopLogo} style={{ height: 140, width: 160 }} resizeMode="contain" />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 60 }}>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: "#7ddd7d", marginBottom: 16, textAlign: "center" }}>
          {t("demandDetail.title")}
        </Text>

        <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20 }}>
          <DetailRow label={t("demandDetail.initiator")} value={initiatorName} />
          <Divider />
          <DetailRow label={t("demandDetail.totalAmount")} value={`${sharedExpense.totalAmount} ${currency}`} />
          <Divider />
          <DetailRow label={t("demandDetail.reason")} value={description} />
          <Divider />
          <DetailRow label={t("demandDetail.date")} value={formattedDate} />
          <Divider />
          <DetailRow label={t("demandDetail.requiredAmount")} value={`${amount} ${currency}`} />

          {item.paymentStatus !== "PAYED" && (
            <TouchableOpacity
              style={{ backgroundColor: "#7ddd7d", borderRadius: 25, paddingVertical: 12, alignItems: "center", marginTop: 20, marginBottom: 10, flexDirection: "row", justifyContent: "center", opacity: isPaying ? 0.7 : 1 }}
              onPress={handlePay}
              disabled={isPaying}
            >
              {isPaying ? <Loader color="#000" size="small" /> : (
                <>
                  <Text style={{ fontWeight: "bold", color: "#000", marginRight: 6 }}>{t("demandDetail.pay")}</Text>
                  <Ionicons name="card" size={20} color="#000" />
                </>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={{
              backgroundColor: "#ff4d4d",
              borderRadius: 25,
              paddingVertical: 12,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center"
            }}
            onPress={handleDecline}
          >
            <Text style={{ fontWeight: "bold", color: "#fff", marginRight: 6 }}>
              {t("demandDetail.decline")}
            </Text>
            <Ionicons name="trash" size={20} color="#fff" />
          </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
  );
};

const DetailRow = ({ label, value, color = "#000" }) => (
  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
    <Text style={{ fontSize: 14, fontWeight: "bold", color: "#000" }}>{label}</Text>
    <Text style={{ fontSize: 14, color }}>{value}</Text>
  </View>
);

const Divider = () => <View style={{ borderBottomWidth: 1, borderColor: "#ccc", marginBottom: 12 }} />;

export default DemandDetailScreen;
