import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
  StyleSheet,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import TopLogo from "../../images/TopLogo.png";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { useGetUserProfileQuery } from "../../services/Auth/authAPI";
import { useGetConfigQuery } from "../../services/Config/configApi";
import {
  useRechargeWalletMutation,
  useCheckTransactionStatusQuery,
  useGetBalanceQuery,
} from "../../services/WalletApi/walletApi";
import { useSendNotificationMutation } from "../../services/Notification/notificationApi";
import Toast from "react-native-toast-message";
import Loader from "../../components/Loader";

const WalletRecharge = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [userWalletId, setUserWalletId] = useState("");
  const [checkParams, setCheckParams] = useState(null);
  const [showUnavailableModal, setShowUnavailableModal] = useState(false);

  const { data: userProfile } = useGetUserProfileQuery();
  const userId = userProfile?.data?.user?.id;

  const { data: balanceData } = useGetBalanceQuery(userId, {
    skip: !userId,
    pollingInterval: 10000,
  });
  const balance = balanceData?.data?.balance ?? 0;

  const [rechargeWallet, { isLoading: isRecharging }] =
    useRechargeWalletMutation();
  const [sendNotification] = useSendNotificationMutation();

  const {
    data: statusData,
    isFetching: isCheckingStatus,
  } = useCheckTransactionStatusQuery(checkParams, {
    skip: !checkParams,
    pollingInterval: 5000,
  });

  const {
    data: configData,
    isLoading: isConfigLoading,
    error: configError,
    refetch: refetchConfig,
  } = useGetConfigQuery();

  const getConfigValue = (name) => {
    const configItem = configData?.data?.find((item) => item.name === name);
    return configItem ? configItem.value : null;
  };

  const SENDO_DEPOSIT_PERCENTAGE = getConfigValue("SENDO_DEPOSIT_PERCENTAGE");
  const SENDO_DEPOSIT_FEES = getConfigValue("SENDO_DEPOSIT_FEES");
  const DEPOSIT_MOBILE_AVAILABILITY = getConfigValue("DEPOSIT_MOBILE_AVAILABILITY");

  useEffect(() => {
    const walletId =
      userProfile?.data?.user?.wallet?.matricule || userProfile?.data?.user?.walletId;
    if (walletId) setUserWalletId(walletId);
  }, [userProfile]);

  useEffect(() => {
    const status = statusData?.status;
    if (status && (status === "COMPLETED" || status === "FAILED")) {
      navigation.navigate("WalletConfirm", {
        status,
        transactionId: checkParams?.transactionId,
      });
      setCheckParams(null);
    }
  }, [statusData]);

  const calculateNetDeposit = () => {
    if (!amount || isNaN(amount)) return 0;
    const amt = parseFloat(amount);
    const percentageFee = SENDO_DEPOSIT_PERCENTAGE
      ? (amt * parseFloat(SENDO_DEPOSIT_PERCENTAGE)) / 100
      : 0;
    const flatFee = SENDO_DEPOSIT_FEES ? parseFloat(SENDO_DEPOSIT_FEES) : 0;
    const totalFees = percentageFee + flatFee;
    return amt - totalFees > 0 ? amt - totalFees : 0;
  };

  const netDeposit = calculateNetDeposit();

  const checkServiceAvailability = () => {
    // If config is not loaded yet, assume service is available
    if (isConfigLoading || !configData) {
      return true;
    }
    
    // Check if DEPOSIT_MOBILE_AVAILABILITY is set to "1" (available)
    return DEPOSIT_MOBILE_AVAILABILITY === "1";
  };

  const handleRecharge = async () => {
    // First check if mobile deposit service is available
    if (!checkServiceAvailability()) {
      setShowUnavailableModal(true);
      return;
    }

    const trimmedPhone = phone.trim();
    const normalizedPhone = trimmedPhone.startsWith("+237")
      ? trimmedPhone
      : trimmedPhone.startsWith("+237")
      ? `+${trimmedPhone}`
      : `+237${trimmedPhone}`;

    if (
      normalizedPhone.length !== 12 &&
      !normalizedPhone.startsWith("+237")
    ) {
      Toast.show({
        type: "error",
        text1: "Numéro invalide",
        text2:
          "Le numéro doit contenir exactement 12 caractères au format +237XXXXXXXXX.",
      });
      return;
    }

    // Validate amount range
      const numericAmount = parseFloat(
        amount?.toString().replace(/\s|,/g, "")
      );

      if (
        !trimmedPhone ||
        isNaN(numericAmount) ||
        numericAmount < 500 ||
        numericAmount > 490000
      ) {
        Toast.show({
          type: "error",
          text1: "Erreur",
          text2:
            "Le montant doit être compris entre 500 et 490 000 XAF.",
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
        email: userProfile?.data?.user?.email,
        name: `${userProfile?.data?.user?.firstName} ${userProfile?.data?.user?.lastName}`,
        address: userProfile?.data?.user?.address || "Adresse générique",
        amount: parseFloat(amount),
        matriculeWallet: userWalletId,
      }).unwrap();

      const trid =
        response?.data?.mobileMoney?.id ||
        response?.data?.transaction?.transactionReference;
      const type = response?.data?.transaction?.type;
      const transactionId = response?.data?.transaction?.transactionId;

      if (trid && transactionId) {
        Toast.show({
          type: "success",
          text1: "Succès",
          text2: "Transaction initiée, vérification du statut...",
        });

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
      console.log(" Réponse du backend :", JSON.stringify(error, null, 2));
      const status = error?.data?.status;
      const respCode =
        error?.data?.data?.details?.respCode ||
        error?.data?.data?.detaila?.response;
      const usrMsg = error?.data?.data?.details?.usrMsg;
      const customerMsgs = error?.data?.data?.detaila?.customerMsg;

      let localizedMsg;
      if (Array.isArray(customerMsgs)) {
        const frMsg = customerMsgs.find((msg) => msg.language === "fr");
        localizedMsg = frMsg?.content;
      }

      if (status === 500 && respCode === 4204) {
        Toast.show({
          type: "error",
          text1: "Numéro invalide",
          text2: usrMsg || "Le numéro de téléphone est invalide.",
        });
      } else if (status === 500 && respCode === 40002) {
        Toast.show({
          type: "error",
          text1: "Erreur technique",
          text2:
            localizedMsg ||
            "Une erreur technique est survenue. Veuillez contacter le support.",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Erreur",
          text2: error?.data?.message || "Échec de la recharge.",
        });
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#181e25" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {(isRecharging || isCheckingStatus) && <Loader />}
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="absolute -top-12 left-0 right-0 items-center justify-center">
          <Image
            source={TopLogo}
            className="h-36 w-40"
            resizeMode="contain"
          />
        </View>
        <View className="border-b border-dashed border-white flex-row justify-between py-4 mt-10 items-center mx-5 pt-5">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <AntDesign name="left" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.openDrawer()}
            className="ml-auto"
          >
            <Ionicons name="menu-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
        <View className="border border-dashed border-white mt-1 mb-1 " />
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
            {t("walletRecharge.accountNumber")}{" "}
            <Text className="text-red-500">*</Text>
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
              maxLength={9}
            />
          </View>

          <Text className="text-gray-700 mb-2 font-semibold">
            {t("walletRecharge.amount")}{" "}
            <Text className="text-red-500">*</Text>
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

        {/* Net deposit preview */}
        {amount && !isNaN(amount) && (
          <View className="mt-6 mb-2 bg-gray-100 rounded-xl p-4">
            <Text className="text-l text-gray-500 text-center mt-1">
              ({t("walletRecharge.feesNote")} :{" "}
              {SENDO_DEPOSIT_PERCENTAGE || 0}% + {SENDO_DEPOSIT_FEES || 0} XAF)
            </Text>
          </View>
        )}

        <Text className="text-gray-400 text-center text-xs mb-10 mt-5 px-2">
          {t("walletRecharge.confirmationNote")}
        </Text>

        <TouchableOpacity
          onPress={() =>
            navigation.navigate("Auth", {
              screen: "PinCode",
              params: {
                onSuccess: async () => {
                  await handleRecharge();
                },
              },
            })
          }
          activeOpacity={0.8}
          className="bg-[#7ddd7d] py-4 px-10 rounded-full self-center shadow-lg w-11/12 mt-4 flex-row justify-center items-center"
          style={{
            elevation: 5,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
          }}
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
      </ScrollView>

      {/* Service Unavailable Modal */}
      <Modal
        visible={showUnavailableModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowUnavailableModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="warning-outline" size={48} color="#ff6b6b" />
            </View>
            
            <Text style={styles.modalTitle}>
              Service Temporarily Unavailable
            </Text>
            
            <Text style={styles.modalMessage}>
              The mobile deposit service is currently unavailable. Please try again later or contact support for assistance.
            </Text>
            
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowUnavailableModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <StatusBar style="light" />
      <Toast />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButtonContainer: {
    width: '100%',
  },
  modalButton: {
    backgroundColor: '#ff6b6b',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WalletRecharge;