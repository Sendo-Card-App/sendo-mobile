import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  StyleSheet,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import TopLogo from "../../images/TopLogo.png";
import { useTranslation } from "react-i18next";
import { useNavigation, useRoute } from "@react-navigation/native"; // Add useRoute
import { useGetUserProfileQuery } from "../../services/Auth/authAPI";
import {
  useWithdrawalWalletMutation,
  useCheckTransactionStatusQuery,
  useGetBalanceQuery,
} from "../../services/WalletApi/walletApi";
import { useGetConfigQuery } from "../../services/Config/configApi";
import Toast from "react-native-toast-message";
import Loader from "../../components/Loader";

const WalletWithdrawal = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute(); // Add route to get params

  // Get the service type from navigation params (OM or MTN)
  const { service } = route.params || {};

  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [userWalletId, setUserWalletId] = useState("");
  const [checkParams, setCheckParams] = useState(null);
  const [showUnavailableModal, setShowUnavailableModal] = useState(false);
  const [unavailableService, setUnavailableService] = useState("");

  const { data: userProfile } = useGetUserProfileQuery();
  const userId = userProfile?.data?.user?.id;

  const { data: balanceData } = useGetBalanceQuery(userId, { skip: !userId });
  const balance = balanceData?.data?.balance ?? 0;

  const [withdrawalWallet, { isLoading: isWithdrawing }] =
    useWithdrawalWalletMutation();

  const {
    data: statusData,
    isFetching: isCheckingStatus,
  } = useCheckTransactionStatusQuery(checkParams, {
    skip: !checkParams,
    pollingInterval: 5000,
  });

  // --- Config ---
  const {
    data: configData,
    isLoading: isConfigLoading,
    error: configError,
  } = useGetConfigQuery();

  const getConfigValue = (name) => {
    const configItem = configData?.data?.find((item) => item.name === name);
    return configItem ? configItem.value : null;
  };

  const SENDO_WITHDRAWAL_PERCENTAGE = getConfigValue(
    "SENDO_WITHDRAWAL_PERCENTAGE"
  );
  const SENDO_WITHDRAWAL_FEES = getConfigValue("SENDO_WITHDRAWAL_FEES");
  
  // Service-specific withdrawal availability flags
  const WITHDRAWAL_OM_SERVICE_AVAILABILITY = getConfigValue("WITHDRAWAL_OM_SERVICE_AVAILABILITY");
  const WITHDRAWAL_MOMO_SERVICE_AVAILABILITY = getConfigValue("WITHDRAWAL_MOMO_SERVICE_AVAILABILITY");

  useEffect(() => {
    const profile = userProfile?.data?.user;
    if (profile) {
      setUserWalletId(profile?.wallet?.matricule || profile?.walletId);
    }
  }, [userProfile]);

  useEffect(() => {
    const status = statusData?.status;
    if (status && (status === "COMPLETED" || status === "FAILED")) {
      navigation.navigate("WalletConfirm", {
        status,
        transactionId: checkParams?.transactionId,
        type: checkParams?.type,
      });
      setCheckParams(null);
    }
  }, [statusData]);

  // --- Get service name for display ---
  const getServiceName = () => {
    if (service === 'OM') return "Orange Money";
    if (service === 'MTN') return "MTN Mobile Money";
    return "Mobile Money";
  };

  // --- Service availability check ---
  const checkServiceAvailability = () => {
    // If config is not loaded yet, assume service is available
    if (isConfigLoading || !configData) {
      return true;
    }
    
    // Check service-specific availability based on the service param
    if (service === 'OM') {
      return WITHDRAWAL_OM_SERVICE_AVAILABILITY === "1";
    } else if (service === 'MTN') {
      return WITHDRAWAL_MOMO_SERVICE_AVAILABILITY === "1";
    }
    
    // If no service specified (shouldn't happen), return false
    return false;
  };

  // --- Net withdrawal calculation ---
  const calculateNetWithdrawal = () => {
    if (!amount || isNaN(amount)) return 0;
    const amt = parseFloat(amount);

    const percentageFee = SENDO_WITHDRAWAL_PERCENTAGE
      ? (amt * parseFloat(SENDO_WITHDRAWAL_PERCENTAGE)) / 100
      : 0;

    const flatFee = SENDO_WITHDRAWAL_FEES ? parseFloat(SENDO_WITHDRAWAL_FEES) : 0;

    const totalFees = percentageFee + flatFee;
    return amt - totalFees > 0 ? amt - totalFees : 0;
  };

  const netWithdrawal = calculateNetWithdrawal();

  // --- Handle withdrawal ---
  const handleWithdrawal = async () => {
    // First check if the specific mobile withdrawal service is available
    if (!checkServiceAvailability()) {
      setUnavailableService(getServiceName());
      setShowUnavailableModal(true);
      return;
    }

    const trimmedPhone = phone.trim();
    const normalizedPhone = trimmedPhone.startsWith("+237")
      ? trimmedPhone
      : `+237${trimmedPhone}`;

    if (!trimmedPhone || isNaN(amount) || parseFloat(amount) < 500) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Veuillez entrer un montant valide supérieur à 500 XAF.",
      });
      return;
    }

    if (parseFloat(amount) > balance) {
      Toast.show({
        type: "error",
        text1: "Montant trop élevé",
        text2: "Le montant dépasse votre solde disponible.",
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
      const response = await withdrawalWallet({
        phone: normalizedPhone,
        email: userProfile?.data?.user?.email,
        name: `${userProfile?.data?.user?.firstName} ${userProfile?.data?.user?.lastName}`,
        address: userProfile?.data?.user?.address || "Adresse générique",
        amount: parseFloat(amount),
        matriculeWallet: userWalletId,
        service: service, // Pass the service type (OM or MTN) to the API
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
          text2: "Votre retrait a été initié avec succès.",
        });

        setCheckParams({
          trid,
          type: type || "WITHDRAWAL",
          transactionId,
        });
        
        navigation.navigate("WalletOk", {
          status: "PENDING",
          transactionId,
          type,
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Erreur",
          text2: "Une erreur s'est produite. Veuillez réessayer.",
        });
      }
    } catch (error) {
      console.log("Response:", JSON.stringify(error, null, 2));
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: error?.data?.message || "Une erreur est survenue.",
      });
    }
  };

  return (
    <View className="bg-[#181e25] flex-1 relative">
      {(isWithdrawing || isCheckingStatus) && <Loader />}

      {/* Top Logo */}
      <View className="absolute -top-12 left-0 right-0 items-center justify-center">
        <Image source={TopLogo} className="h-36 w-40" resizeMode="contain" />
      </View>

      {/* Header */}
      <View className="border-b border-dashed border-white flex-row justify-between py-4 mt-10 items-center mx-5 pt-5">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="left" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.openDrawer()} className="ml-auto">
          <Ionicons name="menu-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View className="border border-dashed border-white mt-1 mb-1" />

      <Text className="text-center text-white text-2xl my-3">
        {service === 'OM' ? t("walletWithdrawal.titleOm") : t("walletWithdrawal.titleMtn")}
      </Text>

      {/* Form with ScrollView */}
      <View className="flex-1 bg-white rounded-t-3xl overflow-hidden">
        <ScrollView
          contentContainerStyle={{ paddingBottom: 40, paddingTop: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-row items-center justify-center gap-2 mt-6 mb-6">
            <Ionicons name="lock-closed" size={16} color="#aaa" />
            <Text className="text-gray-400 text-xs">{t("walletWithdrawal.secureNote")}</Text>
          </View>

          <View className="mx-5">
            {/* Phone */}
            <Text className="text-gray-700 mb-2 font-semibold">
              {t("walletWithdrawal.accountNumber")} <Text className="text-red-500">*</Text>
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

            {/* Amount */}
            <Text className="text-gray-700 mb-2 font-semibold">
              {t("walletWithdrawal.amount")} <Text className="text-red-500">*</Text>
            </Text>
            <View className="flex-row items-center border border-gray-300 rounded-xl px-3 py-2 mb-4">
              <Ionicons name="cash-outline" size={20} color="gray" />
              <TextInput
                placeholder="Montant"
                className="flex-1 text-black ml-2"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            {/* Net Withdrawal Preview */}
            {amount && !isNaN(amount) && (
              <View className="mt-6 mb-2 bg-gray-100 rounded-xl p-4">
                <Text className="text-l text-gray-500 text-center mt-1">
                  ({t("walletWithdrawal.feesNote")}: {SENDO_WITHDRAWAL_PERCENTAGE || 0}% + {SENDO_WITHDRAWAL_FEES || 0} XAF)
                </Text>
              </View>
            )}
          </View>

          {/* Confirm Button */}
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("Auth", {
                screen: "PinCode",
                params: {
                  onSuccess: async () => {
                    await handleWithdrawal();
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
            {isWithdrawing ? (
              <Loader size="small" />
            ) : (
              <Text className="text-center font-bold text-lg text-black tracking-wider">
                {t("walletWithdrawal.confirmButton")}
              </Text>
            )}
          </TouchableOpacity>

        </ScrollView>
      </View>

      {/* Footer */}
      <View className="py-4 flex-row justify-center items-center gap-2 bg-[#181e25]">
        <Ionicons name="shield-checkmark" size={18} color="orange" />
        <Text className="text-sm text-white">{t("walletWithdrawal.securityWarning")}</Text>
      </View>

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
              {unavailableService} Temporarily Unavailable
            </Text>
            
            <Text style={styles.modalMessage}>
              The {unavailableService} withdrawal service is currently unavailable. 
              Please try again later or contact support for assistance.
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
    </View>
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

export default WalletWithdrawal;