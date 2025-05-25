import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import TopLogo from "../../images/TopLogo.png";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { useGetUserProfileQuery } from "../../services/Auth/authAPI";
import {
  useRechargeWalletMutation,
  useCheckTransactionStatusQuery,
} from "../../services/WalletApi/walletApi";
import { useSendNotificationMutation } from "../../services/Notification/notificationApi";
import { 
  sendPushNotification,
  sendPushTokenToBackend,
  registerForPushNotificationsAsync
} from '../../services/notificationService';
import { TypesNotification } from "../../utils/constants";
import Toast from "react-native-toast-message";
import Loader from "../../components/Loader";

const WalletRecharge = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [userWalletId, setUserWalletId] = useState("");
  const [checkParams, setCheckParams] = useState(null);

  const { data: userProfile } = useGetUserProfileQuery();
  const [rechargeWallet, { isLoading: isRecharging }] = useRechargeWalletMutation();
  const [sendNotification] = useSendNotificationMutation();

  const {
    data: statusData,
    isFetching: isCheckingStatus,
  } = useCheckTransactionStatusQuery(checkParams, {
    skip: !checkParams,
    pollingInterval: 5000,
  });

  useEffect(() => {
    const walletId = userProfile?.data?.wallet?.matricule || userProfile?.data?.walletId;
    if (walletId) setUserWalletId(walletId);
  }, [userProfile]);

  useEffect(() => {
    const status = statusData?.status;
    if (status && (status === "COMPLETED" || status === "FAILED")) {
      navigation.navigate("WalletConfirm", {
        status,
        transactionId: checkParams?.transactionId,
      });
      setCheckParams(null); // stop polling
    }
  }, [statusData]);

  const handleRecharge = async () => {
  const trimmedPhone = phone.trim();
  const normalizedPhone = trimmedPhone.startsWith("+237")
    ? trimmedPhone
    : trimmedPhone.startsWith("237")
    ? `+${trimmedPhone}`
    : `+237${trimmedPhone}`;

  if (!trimmedPhone || isNaN(amount) || parseFloat(amount) < 500) {
    Toast.show({
      type: "error",
      text1: "Erreur",
      text2: "Veuillez entrer un montant valide supérieur à 500 XAF.",
    });
    return;
  }

  if (!userWalletId) {
    Toast.show({
      type: "error",
      text1: "Erreur",
      text2: "Impossible de charger votre compte wallet.",
    });
    return;
  }

  try {
    const response = await rechargeWallet({
      phone: normalizedPhone,
      email: userProfile?.data?.email,
      name: `${userProfile?.data?.firstName} ${userProfile?.data?.lastName}`,
      address: userProfile?.data?.address || "Adresse générique",
      amount: parseFloat(amount),
      matriculeWallet: userWalletId,
    }).unwrap();

    const trid = response?.data?.mobileMoney?.trid;
    const type = response?.data?.transaction?.type;
    const transactionId = response?.data?.transaction?.transactionId;

    if (trid && transactionId) {
      Toast.show({
        type: "success",
        text1: "Succès",
        text2: "Transaction initiée, vérification du statut...",
      });

      // 🔔 Prepare notification content
      const notificationContent = {
        title: "Recharge Initiée",
        body: `Vous avez initié une recharge de ${amount} FCFA.`,
        type: "SUCCESS_DEPOSIT_WALLET",
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
              phone: normalizedPhone,
              amount: parseFloat(amount),
              transactionId,
              timestamp: new Date().toISOString(),
            }
          );
        }
      } catch (notificationError) {
        console.warn("Remote notification failed:", notificationError);
        // 📱 Fallback local push
        await sendPushNotification(
          notificationContent.title,
          notificationContent.body,
          {
            data: {
              type: notificationContent.type,
              phone: normalizedPhone,
              amount: parseFloat(amount),
            },
          }
        );
      }

      setCheckParams({
        trid,
        type: type || "DEPOSIT",
        transactionId,
      });

      navigation.navigate("WalletConfirm");
    } else {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Une erreur s'est produite. Veuillez réessayer.",
      });
    }
  } catch (error) {
    Toast.show({
      type: "error",
      text1: "Erreur",
      text2: error?.data?.message || "Échec de la recharge.",
    });

    // Optional: Send notification for failure
    try {
      await sendPushNotification(
        "Échec de la recharge",
        error?.data?.message || "Impossible de recharger le wallet.",
        {
          data: {
            phone: normalizedPhone,
            amount: parseFloat(amount),
            type: "WALLET_RECHARGE_FAILED",
          },
        }
      );
    } catch (pushError) {
      console.warn("Notification d'erreur non envoyée:", pushError);
    }
  }
};

    

  return (
    <View className="bg-[#181e25] flex-1 pt-0 relative">
      {(isRecharging || isCheckingStatus) && <Loader />}
      <View className="absolute -top-12 left-0 right-0 items-center justify-center">
        <Image source={TopLogo} className="h-36 w-40" resizeMode="contain" />
      </View>
      <View className="border-b border-dashed border-white flex-row justify-between py-4 mt-10 items-center mx-5 pt-5">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.openDrawer()} className="ml-auto">
          <Ionicons name="menu-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>
      <Text className="text-center text-white text-2xl my-3">
        {t("walletRecharge.title")}
      </Text>
      <View className="flex-1 py-6 bg-white px-6 rounded-t-3xl">
        <View className="flex-row items-center justify-center gap-2 mt-2 mb-6">
          <Ionicons name="lock-closed" size={16} color="#aaa" />
          <Text className="text-gray-400 text-xs">
            {t("walletRecharge.secureNote")}
          </Text>
        </View>
        <View className="mx-5 mt-6">
          <Text className="text-gray-700 mb-2 font-semibold">
           {t("walletRecharge.accountNumber")} <Text className="text-red-500">*</Text>
          </Text>
          <View className="flex-row items-center border border-gray-300 rounded-xl px-3 py-2 mb-4">
            <Ionicons name="call-outline" size={20} color="gray" />
            <Text className="text-black ml-2">+237</Text>
            <TextInput
              placeholder="Ex: 6XXXXXXXX"
              className="flex-1 text-black ml-2"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <Text className="text-gray-700 mb-2 font-semibold">
            {t("walletRecharge.amount")} <Text className="text-red-500">*</Text>
          </Text>
          <View className="flex-row items-center border border-gray-300 rounded-xl px-3 py-2">
            <Ionicons name="cash-outline" size={20} color="gray" />
            <TextInput
              placeholder="Montant"
              className="flex-1 text-black ml-2"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
          </View>
        </View>

        <Text className="text-gray-400 text-center text-xs mb-10 mt-5 px-2">
          {t("walletRecharge.confirmationNote")}
        </Text>

        <TouchableOpacity
          onPress={handleRecharge}
          activeOpacity={0.8}
          className="bg-[#7ddd7d] py-4 px-10 rounded-full self-center shadow-lg w-11/12 mt-4 flex-row justify-center items-center"
          style={{
            elevation: 5,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
          }}
          disabled={isRecharging}
        >
          {isRecharging ? (
            <Loader size="small" />
          ) : (
            <Text className="text-center font-bold text-lg text-black tracking-wider">
             {t("walletRecharge.confirmButton")}
            </Text>
          )}
        </TouchableOpacity>
      </View>
      <View className="py-4 flex-row justify-center items-center gap-2 bg-[#181e25] mt-auto">
        <Ionicons name="shield-checkmark" size={18} color="orange" />
        <Text className="text-sm text-white">
          {t("walletRecharge.securityWarning")}
        </Text>
      </View>
      <StatusBar style="light" />
      <Toast />
    </View>
  );
};

export default WalletRecharge;
