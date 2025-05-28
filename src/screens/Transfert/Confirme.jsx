import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import AntDesign from "@expo/vector-icons/AntDesign";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useInitTransferMutation } from "../../services/WalletApi/walletApi";
import Toast from "react-native-toast-message";
import Loader from "../../components/Loader";
import { PinVerificationModal } from "../../components/PinVerificationModal";
import { incrementAttempt, resetAttempts, lockPasscode } from '../../features/Auth/passcodeSlice';
import { useTranslation } from "react-i18next";
import { 
  sendPushNotification,
  sendPushTokenToBackend,
  registerForPushNotificationsAsync
} from '../../services/notificationService';
import { TypesNotification } from "../../utils/constants";

import TopLogo from "../../images/TopLogo.png";
import om from "../../images/om.png";
import mtn from "../../images/mtn.png";

const ConfirmeTheTransfer = () => {
  const navigation = useNavigation();
  const [showPinModal, setShowPinModal] = useState(false);
  const [initTransfer, { isLoading }] = useInitTransferMutation();
  const { t } = useTranslation();

  const route = useRoute();
  const {
    formData,
    amount,
    convertedAmount,
    totalAmount,
    transferFee,
    provider,
    fromCurrency,
    toCurrency,
    cadRealTimeValue,
  } = route.params;

  const providerImage =
    provider === "Orange Money"
      ? om
      : provider === "MTN Mobile Money"
      ? mtn
      : null;

const handleConfirmPress = () => {
  navigation.navigate('Auth', {
    screen: 'PinCode',
    params: {
      onSuccess: async (pin) => {
        const notificationData = {
          title: "Transfert Initié",
          body: `Vous avez envoyé ${totalAmount} ${toCurrency} via ${provider}.`,
          type: "SUCCESS_TRANSFER_FUNDS",
        };

        try {
          const response = await initTransfer({
            firstname: formData.firstname,
            lastname: formData.lastname,
            email: formData.email,
            phone: formData.phone,
            country: formData.country,
            address: formData.address,
            description: formData.description,
            amount: totalAmount,
            provider,
            pin,
          }).unwrap();

          if (response.status === 200 && response.data) {
            Toast.show({
              type: "success",
              text1: "Transfert initié",
              text2: "Veuillez suivre l'évolution du statut dans l'historique.",
            });

            try {
              let pushToken = await getStoredPushToken();
              if (!pushToken) {
                pushToken = await registerForPushNotificationsAsync();
              }

              if (pushToken) {
                await sendPushTokenToBackend(
                  pushToken,
                  notificationData.title,
                  notificationData.body,
                  notificationData.type,
                  {
                    ...formData,
                    amount: totalAmount,
                    provider,
                    timestamp: new Date().toISOString(),
                  }
                );
              }
            } catch (notificationError) {
              console.warn("Remote notification failed:", notificationError);
              await sendPushNotification(notificationData.title, notificationData.body, {
                data: {
                  ...formData,
                  type: notificationData.type,
                  amount: totalAmount,
                  provider,
                },
              });
            }

            navigation.navigate("Success", { result: response.data });
          } else {
            throw new Error(response.message || "Une erreur est survenue.");
          }
        } catch (error) {

          const status = error?.status || error?.data?.status;
          const detaila = error?.data?.data?.detaila;
          const responseCode = detaila?.response;
          const devMsg = detaila?.devMsg;
          const customerMsgs = detaila?.customerMsg;
          const frCustomerMsg = customerMsgs?.find((msg) => msg.language === "fr")?.content;

          if (status === 500 && responseCode === 40002) {
            Toast.show({
              type: "error",
              text1: "Erreur technique",
              text2: frCustomerMsg || devMsg || "Une erreur technique est survenue.",
            });
          } else {
            Toast.show({
              type: "error",
              text1: "Erreur",
              text2: error.message || "Une erreur est survenue.",
            });
          }

          try {
            await sendPushNotification(
              "Échec du transfert",
              frCustomerMsg || error.message || "Impossible d'envoyer les fonds.",
              {
                data: {
                  ...formData,
                  type: "PAYMENT_FAILED",
                  amount: totalAmount,
                  provider,
                },
              }
            );
          } catch (pushError) {
          }
        }
      }
    }
  });
};



  return (
    <View className="bg-[#181e25] flex-1 pt-0 relative">
      <StatusBar style="light" />

      <View className="absolute -top-12 left-0 right-0 items-center justify-center">
        <Image source={TopLogo} className="h-36 w-40" resizeMode="contain" />
      </View>

      <View className="border-b border-dashed border-white flex-row justify-between py-4 mt-10 items-center mx-5 pt-5">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="arrowleft" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <Text className="text-center text-white text-2xl my-3">
        {t("confirmeTheTransfer.title")}
      </Text>

      <View className="flex-1 gap-3 bg-white px-6 pt-6 pb-4 rounded-t-3xl">
        <View className="mt-5 mb-3 space-y-3">
          <View className="bg-yellow-100 px-4 py-3 rounded-lg border border-yellow-300 mx-2">
            <Text className="text-yellow-900 font-semibold text-sm text-center">
              {t("confirmeTheTransfer.interacInstructions")}
            </Text>
            <Text className="text-yellow-900 text-base text-center font-bold mt-2">
              {t("confirmeTheTransfer.interacPhone")}
            </Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {[
            {
              label: t("confirmeTheTransfer.fullname"),
              value: `${formData.firstname} ${formData.lastname}`,
            },
            { label: t("confirmeTheTransfer.phone"), value: formData.phone },
            { label: t("confirmeTheTransfer.country"), value: formData.country },
            { label: t("confirmeTheTransfer.address"), value: formData.address },
            {
              label: t("confirmeTheTransfer.amountSent"),
              value: `${fromCurrency === "CAD" ? "$" : ""}${amount} ${fromCurrency}`,
            },
            {
              label: t("confirmeTheTransfer.transferFee"),
              value: `${transferFee} ${toCurrency}`,
            },
            {
              label: t("confirmeTheTransfer.exchangeRate"),
              value: `$1 ${fromCurrency} = ${cadRealTimeValue} ${toCurrency}`,
            },
            {
              label: t("confirmeTheTransfer.convertedAmount"),
              value: `${convertedAmount} ${toCurrency}`,
            },
            {
              label: t("confirmeTheTransfer.totalDebited"),
              value: `${totalAmount} ${toCurrency}`,
            },
          ].map((item, index) => (
            <View
              key={index}
              className="flex-row justify-between border-b border-dashed border-gray-400 py-2"
            >
              <Text className="text-gray-400 text-sm">{item.label}</Text>
              <Text className="text-[#181e25] font-semibold text-sm text-right">
                {item.value}
              </Text>
            </View>
          ))}

          <View className="border-b border-dashed border-gray-400 py-3 flex-row items-center justify-between">
            <Text className="text-gray-400 text-sm">
              {t("confirmeTheTransfer.paymentMethod")}
            </Text>
            <View className="flex-row items-center gap-2">
              <Text className="text-[#181e25] font-semibold text-sm">
                {provider}
              </Text>
              {providerImage && (
                <Image
                  source={providerImage}
                  className="w-[30px] h-[30px]"
                  resizeMode="contain"
                />
              )}
            </View>
          </View>

          <View className="flex-row gap-2 justify-center items-center mt-5 mb-5">
            <MaterialIcons name="timer" size={15} color="#acacac" />
            <Text className="text-center text-gray-400 text-sm font-bold">
              {t("confirmeTheTransfer.processingNote")}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleConfirmPress}
            disabled={isLoading}
            style={{
              backgroundColor: "#7ddd7d",
              padding: 16,
              borderRadius: 20,
              marginHorizontal: 20,
            }}
          >
            {isLoading ? (
              <Loader color="white" />
            ) : (
              <Text
                style={{
                  color: "white",
                  fontSize: 18,
                  textAlign: "center",
                  fontWeight: "500",
                }}
              >
                {t("confirmeTheTransfer.confirmButton")}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>

      <View className="py-4 flex-row justify-center items-center gap-2">
        <Ionicons name="shield-checkmark" size={18} color="orange" />
        <Text className="text-sm text-white">
          {t("confirmeTheTransfer.secureData")}
        </Text>
      </View>
    </View>
  );
};

export default ConfirmeTheTransfer;
