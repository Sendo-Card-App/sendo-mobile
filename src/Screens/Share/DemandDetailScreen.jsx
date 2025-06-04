import React, { useState,useEffect } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import TopLogo from "../../images/TopLogo.png";
import { useRoute, useNavigation } from "@react-navigation/native";
import {
  useCancelSharedExpenseMutation,
  usePaySharedExpenseMutation,
} from "../../services/Shared/sharedExpenseApi";
import { useGetBalanceQuery } from '../../services/WalletApi/walletApi';
import { useGetUserProfileQuery } from "../../services/Auth/authAPI";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";
import Loader from "../../components/Loader";

const DemandDetailScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const route = useRoute();
  const { item } = route.params;
  const [modalVisible, setModalVisible] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
   const { data: userProfile, isLoading: isProfileLoading } = useGetUserProfileQuery();
    const userId = userProfile?.data.id;

   const { 
      data: balanceData, 
      error: balanceError,
      isLoading: isBalanceLoading
    } = useGetBalanceQuery(userId, { skip: !userId });
    const balance = balanceData?.data.balance || 0;

  const [cancelSharedExpense, { isLoading: isCancelLoading }] = useCancelSharedExpenseMutation();
  const [paySharedExpense, { isLoading: isPaying }] = usePaySharedExpenseMutation();

  const showToast = (message, type = "success") => {
    Toast.show({
      type,
      text1: message,
      position: "top",
      visibilityTime: 3000,
      autoHide: true,
    });
  };

const handlePay = async () => {
  if (balance < item.totalAmount) {
    showToast("Insufficient balance");
    return;
  }

  try {
    const response = await paySharedExpense({ expenseId: item.id }).unwrap();
    navigation.navigate("SuccessSharing", {
      transactionDetails: "Payment completed successfully",
    });
  } catch (error) {
    console.log("Pay error:", error);
    showToast("An error occurred while processing the payment", "error");
  }
};






  const handleDecline = async () => {
    if (!cancelReason.trim()) {
      showToast("Veuillez entrer une raison pour le refus.", "error");
      return;
    }

    try {
      await cancelSharedExpense({
        id: item.id,
        cancelReason,
      }).unwrap();

      showToast("Demande refusée avec succès.", "success");
      setModalVisible(false);
      navigation.goBack();
    } catch (error) {
      console.log(error);
      showToast("Erreur lors de l'annulation de la demande.", "error");
    }
  };

  const initiatorParticipant = item.participants.find(
    (p) => p.userId === item.initiator.id
  );

  const initiatorName =
    initiatorParticipant?.user?.firstname ?? item.initiator?.firstname ?? "N/A";

  const amount = initiatorParticipant?.part ?? item.initiatorPart ?? "N/A";
  const currency = item.currency ?? "";
  const description = item.description ?? "N/A";
  const formattedDate = new Date(item.createdAt).toLocaleDateString("fr-FR");

  const isActionAvailable = ["PAYED"].includes(item.initiatorPart.status);

  return (
    <View style={{ flex: 1, backgroundColor: "#0e1316" }}>
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
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 60 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "bold",
            color: "#7ddd7d",
            marginBottom: 16,
            textAlign: "center",
          }}
        >
          {t("demandDetail.title")}
        </Text>

        <View style={{ backgroundColor: "#fff", borderRadius: 16, padding: 20 }}>
          <DetailRow label={t("demandDetail.initiator")} value={initiatorName} />
          <Divider />
          <DetailRow label={t("demandDetail.totalAmount")} value={`${item.totalAmount} ${currency}`} />
           <Divider />
          <DetailRow label={t("demandDetail.reason")} value={description} />
          <Divider />
          <DetailRow label={t("demandDetail.date")} value={formattedDate} />
          <Divider />
          <DetailRow label={t("demandDetail.requiredAmount")} value={`${amount} ${currency}`} />

          {/* Conditional Action Buttons */}
         
              {/* Pay Button */}
              <TouchableOpacity
                style={{
                  backgroundColor: "#7ddd7d",
                  borderRadius: 25,
                  paddingVertical: 12,
                  alignItems: "center",
                  marginTop: 20,
                  marginBottom: 10,
                  flexDirection: "row",
                  justifyContent: "center",
                  opacity: isPaying ? 0.7 : 1,
                }}
                onPress={handlePay}
                disabled={isPaying}
              >
                {isPaying ? (
                  <Loader color="#000" size="small" />
                ) : (
                  <>
                    <Text style={{ fontWeight: "bold", color: "#000", marginRight: 6 }}>
                      {t("demandDetail.pay")}
                    </Text>
                    <Ionicons name="card" size={20} color="#000" />
                  </>
                )}
              </TouchableOpacity>

              {/* Decline Button */}
              <TouchableOpacity
                style={{
                  backgroundColor: "#ff4d4d",
                  borderRadius: 25,
                  paddingVertical: 12,
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center",
                }}
                onPress={() => setModalVisible(true)}
              >
                <Text style={{ fontWeight: "bold", color: "#fff", marginRight: 6 }}>
                  {t("demandDetail.decline")}
                </Text>
                <Ionicons name="trash" size={20} color="#fff" />
              </TouchableOpacity>
            
        </View>
      </ScrollView>

      {/* Cancel Reason Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ flex: 1 }}
        >
          <View style={{ flex: 1, backgroundColor: "#000000aa", justifyContent: "center", alignItems: "center" }}>
            <View
              style={{
                width: "85%",
                backgroundColor: "#fff",
                borderRadius: 20,
                padding: 20,
                elevation: 5,
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 10 }}>
                {t("demandDetail.declineReasonTitle")}
              </Text>
              <TextInput
                placeholder={t("demandDetail.declinePlaceholder")}
                value={cancelReason}
                onChangeText={setCancelReason}
                multiline
                style={{
                  borderWidth: 1,
                  borderColor: "#ccc",
                  borderRadius: 10,
                  padding: 10,
                  height: 100,
                  textAlignVertical: "top",
                }}
              />
              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 20 }}>
                <TouchableOpacity
                  style={{ padding: 10, backgroundColor: "#ccc", borderRadius: 10 }}
                  onPress={() => setModalVisible(false)}
                >
                  <Text>{t("demandDetail.cancel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    padding: 10,
                    backgroundColor: "#ff4d4d",
                    borderRadius: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 100,
                  }}
                  onPress={handleDecline}
                  disabled={isCancelLoading}
                >
                  {isCancelLoading ? (
                    <Loader color="green" size="small" />
                  ) : (
                    <Text style={{ color: "#fff" }}>{t("demandDetail.confirm")}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const DetailRow = ({ label, value, color = "#000" }) => (
  <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 12 }}>
    <Text style={{ fontSize: 14, fontWeight: "bold", color: "#000" }}>{label}</Text>
    <Text style={{ fontSize: 14, color }}>{value}</Text>
  </View>
);

const Divider = () => (
  <View style={{ borderBottomWidth: 1, borderColor: "#ccc", marginBottom: 12 }} />
);

export default DemandDetailScreen;
