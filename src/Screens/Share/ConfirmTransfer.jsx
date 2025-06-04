import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import TopLogo from "../../images/TopLogo.png";
import Loader from "../../components/Loader";
import { StatusBar } from "expo-status-bar";
import { 
  sendPushNotification,
  sendPushTokenToBackend,
  registerForPushNotificationsAsync,
  getStoredPushToken
} from '../../services/notificationService';
import { TypesNotification } from "../../utils/constants";
import { useCreateSharedExpenseMutation } from "../../services/Shared/sharedExpenseApi";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";

const ConfirmationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const { 
  totalAmount, 
  description, 
  limitDate, 
  includeSelf, 
  methodCalculatingShare, 
  participants, 
  userFullName 
} = route.params;
  console.log(participants)
//  console.log(userFullName)

  const [createSharedExpense, { isLoading }] = useCreateSharedExpenseMutation();
  const [reason, setReason] = useState(route.params.description || "");

const handleConfirm = async () => {
  try {
    
    const payload = {
      totalAmount: route.params.totalAmount,
      description: reason,
      limitDate: route.params.limitDate,
      includeMyself: route.params.includeSelf,
      methodCalculatingShare: route.params.methodCalculatingShare,
      participants: route.params.participants.map((p) => ({
        matriculeWallet: p.matriculeWallet,
        ...(route.params.methodCalculatingShare === "manual" && {
          amount: p.amount,
        }),
      })),
    };
  

    const response = await createSharedExpense(payload).unwrap();

    const notificationContent = {
      title: "Dépense Partagée Créée",
      body: `Une nouvelle dépense de ${route.params.totalAmount} FCFA a été créée.`,
      type: "SHARED_EXPENSE_CREATED",
    };

    try {
      let pushToken = await getStoredPushToken();
      if (!pushToken) {
        pushToken = await registerForPushNotificationsAsync();
      }

      if (pushToken) {
        await sendPushTokenToBackend(
          pushToken,
          notificationContent.title,
          notificationContent.body,
          notificationContent.type,
          {
            amount: route.params.totalAmount,
            description: reason,
            limitDate: route.params.limitDate,
            timestamp: new Date().toISOString(),
          }
        );
      }
    } catch (notificationError) {
      await sendPushNotification(
        notificationContent.title,
        notificationContent.body,
        {
          data: {
            type: notificationContent.type,
            amount: route.params.totalAmount,
            description: reason,
          },
        }
      );
    }

    navigation.navigate("SuccessSharing", {
      transactionDetails: "La dépense partagée a été créée avec succès.",
    });

  } catch (error) {
    const isECONNRESET =
      error?.data?.errors?.some((e) =>
        typeof e === "string" && e.includes("ECONNRESET")
      );

    if (isECONNRESET) {
      navigation.navigate("SuccessSharing", {
        transactionDetails: "La dépense partagée a été créée avec succès.",
      });
      return;
    }

    console.log(" Error during shared expense creation:", error);
    Toast.show({
      type: "error",
      text1: "Erreur",
      text2:
        error?.data?.message ||
        "Échec de la création de la dépense partagée",
    });
  }
};



  return (
    <View className="bg-[#181e25] flex-1 pt-0 relative">
      <StatusBar style="light" />

      <View className="absolute -top-12 left-0 right-0 items-center justify-center z-10">
        <Image source={TopLogo} className="h-36 w-40" resizeMode="contain" />
      </View>

      <View className="border-b border-dashed border-white flex-row justify-between py-4 mt-20 items-center mx-5 pt-5">
       <TouchableOpacity
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          onPress={() => {
            console.log("Pressed back button");
            navigation.goBack();
          }}
        >
  <AntDesign name="arrowleft" size={24} color="white" />
</TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>
       <View className="border border-dashed border-gray-300 " />
      <Text className="text-xl font-bold text-center text-green-600 mb-3">
        {t("confirmation.title")}
      </Text>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-1 gap-3 bg-white px-6 pt-6 pb-4 rounded-t-3xl">
          <View className="mb-5">
            <Text className="text-base text-gray-600">
              {t("confirmation.totalAmount")}
            </Text>
            <View className="flex-row justify-between items-center mt-1">
              <Text className="text-lg font-bold text-orange-500">
                {route.params.totalAmount.toLocaleString()} XAF
              </Text>
              <Ionicons name="create-outline" size={20} color="#555" />
            </View>
          </View>

          <View className="mb-5">
            <Text className="text-base text-gray-600">
              {t("confirmation.reason")}
            </Text>
            <View className="flex-row items-center justify-between mt-1">
              <TextInput
                className="flex-1 border-b border-gray-300 text-base py-1"
                value={reason}
                onChangeText={setReason}
                placeholder={t("confirmation.reasonPlaceholder")}
              />
              <Ionicons
                name="create-outline"
                size={20}
                color="#555"
                style={{ marginLeft: 10 }}
              />
            </View>
          </View>

          <View className="mb-5">
            <Text className="text-base text-gray-600">
              {t("confirmation.deadline")}
            </Text>
            <View className="flex-row justify-between items-center mt-1">
              <Text className="text-base text-black">
                {new Date(route.params.limitDate).toLocaleDateString()}
              </Text>
              <Ionicons name="create-outline" size={20} color="#555" />
            </View>
          </View>

          <View className="mb-5">
            <Text className="text-base text-gray-600 mb-2">
              {t("confirmation.participants")}
            </Text>
            {participants.map((participant) => (
              <View
                key={participant.matriculeWallet}
                className="flex-row justify-between items-center bg-gray-100 p-3 rounded-xl mb-2"
              >
                <Text className="flex-1 text-base font-medium text-black">
                  {participant.id === 'self' ? userFullName : participant.name}
                </Text>
                {methodCalculatingShare === "manual" && participant.amount != null ? (
                  <Text className="text-base text-black">
                    {participant.amount.toLocaleString()} XAF
                  </Text>
                ) : null}
              </View>
            ))}

          </View>

          <TouchableOpacity
            onPress={handleConfirm}
            disabled={isLoading}
            className="bg-[#A7F39B] py-4 rounded-xl items-center mt-2"
          >
            {isLoading ? (
              <Loader color="green" />
            ) : (
              <Text className="text-black text-lg font-bold">
                {t("confirmation.confirmButton")}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default ConfirmationScreen;
