import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import React, { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import TopLogo from "../../Images/TopLogo.png";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { useGetUserProfileQuery } from "../../services/Auth/authAPI";
import {
  useWithdrawalWalletMutation,
  useCheckTransactionStatusQuery,
  useGetBalanceQuery,
} from "../../services/WalletApi/walletApi";
import Toast from "react-native-toast-message";
import Loader from "../../components/Loader";

const WalletWithdrawal = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const [phone, setPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [userWalletId, setUserWalletId] = useState("");
  const [checkParams, setCheckParams] = useState(null);
  const [isButtonDisabled, setIsButtonDisabled] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState(null);

  const { data: userProfile } = useGetUserProfileQuery();
    const userId = userProfile?.data?.id;
  
    const { data: balanceData } = useGetBalanceQuery(userId, { skip: !userId });
    const balance = balanceData?.data?.balance ?? 0;
    
  const [withdrawaleWallet, { isLoading: isRecharging }] =
    useWithdrawalWalletMutation();

  const {
    data: statusData,
    isFetching: isCheckingStatus,
  } = useCheckTransactionStatusQuery(checkParams, {
    skip: !checkParams,
    pollingInterval: 5000,
  });

  useEffect(() => {
    const profile = userProfile?.data;
    if (profile) {
      setUserWalletId(profile?.wallet?.matricule || profile?.walletId);
      setName(`${profile?.firstName || ""} ${profile?.lastName || ""}`);
      setEmail(profile?.email || "");
      setAddress(profile?.address || "");
    }
  }, [userProfile]);

  useEffect(() => {
    const status = statusData?.status;
    if (status && (status === "COMPLETED" || status === "FAILED")) {
      setTransactionStatus(status);
      navigation.navigate("WalletConfirm", {
        status,
        transactionId: checkParams?.transactionId,
        type: checkParams?.type,
      });
      setCheckParams(null); // stop polling
    }
  }, [statusData]);

  const handleRecharge = async () => {
    const trimmedPhone = phone.trim();
    const normalizedPhone = trimmedPhone.startsWith("+237")
      ? trimmedPhone
      : trimmedPhone.startsWith("+237")
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
      const response = await withdrawaleWallet({
        phone: normalizedPhone,
        email: userProfile?.data?.email,
        name: `${userProfile?.data?.firstName} ${userProfile?.data?.lastName}`,
        address: userProfile?.data?.address || "Adresse générique",
        amount: parseFloat(amount),
        matriculeWallet: userWalletId,
      }).unwrap();
       console.log(response)
     const trid = response?.data?.mobileMoney?.id || response?.data?.transaction?.transactionReference;
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
      console.log('Response:', JSON.stringify(error, null, 2));
        const status = error?.status;
    
        // Error model 1
        const respCode = error?.data?.data?.details?.respCode;
        const usrMsg1 = error?.data?.data?.details?.usrMsg;
    
        // Error model 2
        const devMsg = error?.data?.data?.detaila?.devMsg;
        const customerMsgs = error?.data?.data?.detaila?.customerMsg;
        const userMsg2 = customerMsgs?.find((msg) => msg.language === 'fr')?.content;
    
        if (status === 500 && respCode === 4204) {
          showErrorToast('Numéro invalide', usrMsg1 || 'Le numéro de téléphone est invalide.');
        } else if (status === 500 && userMsg2) {
          showErrorToast('Erreur technique', userMsg2);
        }  else if (status === 400) {
          showErrorToast('ACTION_FAILED', 'Veuillez remplir tous les champs.');
        } else if (status === 404) {
          showErrorToast('ACTION_FAILED', 'Portefeuille introuvable');
        } else {
          showErrorToast('ACTION_FAILED', error?.data?.message || 'Une erreur est survenue.');
        }
    
        try {
          await sendPushNotification(
            'Échec du transfert',
            userMsg2 || usrMsg1 || error?.data?.message ,
            {
              data: {
                type: 'TRANSFER_FAILED',
                amount: transferAmount,
                recipient: recipientName || walletId,
              },
            }
          );
        } catch (pushError) {
          console.warn("Notification d'erreur non envoyée:", pushError);
        }
    
        setShowPinModal(false);
        setPendingTransferData(null);
      }
  };

  return (
    <View className="bg-[#181e25] flex-1 relative">
      {(isRecharging || isCheckingStatus) && <Loader />}
      <View className="absolute -top-12 left-0 right-0 items-center justify-center">
        <Image source={TopLogo} className="h-36 w-40" resizeMode="contain" />
      </View>
      <View className="border-b border-dashed border-white flex-row justify-between py-4 mt-10 items-center mx-5 pt-5">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
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
       {t("walletWithdrawal.title")}
      </Text>

      <View className="flex-1 bg-white rounded-t-3xl overflow-hidden">
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <View className="flex-row items-center justify-center gap-2 mt-6 mb-6">
            <Ionicons name="lock-closed" size={16} color="#aaa" />
            <Text className="text-gray-400 text-xs">
              
               {t("walletWithdrawal.secureNote")}
              
            </Text>
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
                maxLength={9} // restrict to 9 digits after the country code
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

            {/* Name */}
            {/* <Text className="text-gray-700 mb-2 font-semibold">
             {t("walletWithdrawal.fullName")} *
            </Text>
            <View className="flex-row items-center border border-gray-300 rounded-xl px-3 py-2 mb-4">
              <Ionicons name="person-outline" size={20} color="gray" />
              <TextInput
                placeholder="Nom complet"
                className="flex-1 text-black ml-2"
                value={name}
                onChangeText={setName}
              />
            </View> */}

            {/* Email
            <Text className="text-gray-700 mb-2 font-semibold">{t("walletWithdrawal.email")} *</Text>
            <View className="flex-row items-center border border-gray-300 rounded-xl px-3 py-2 mb-4">
              <Ionicons name="mail-outline" size={20} color="gray" />
              <TextInput
                placeholder="Email"
                className="flex-1 text-black ml-2"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
              />
            </View> */}

            {/* Address */}
            {/* <Text className="text-gray-700 mb-2 font-semibold">{t("walletWithdrawal.address")} *</Text>
            <View className="flex-row items-center border border-gray-300 rounded-xl px-3 py-2 mb-4">
              <Ionicons name="home-outline" size={20} color="gray" />
              <TextInput
                placeholder="Adresse"
                className="flex-1 text-black ml-2"
                value={address}
                onChangeText={setAddress}
              />
            </View> */}
          </View>

          <Text className="text-gray-400 text-center text-xs mb-10 mt-5 px-2">
          {t("walletWithdrawal.confirmationNote")}
            
          
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
            disabled={isButtonDisabled || isRecharging}
          >
            {isRecharging ? (
              <Loader size="small" />
            ) : (
              <Text className="text-center font-bold text-lg text-black tracking-wider">
               {t("walletWithdrawal.confirmButton")}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>

      <View className="py-4 flex-row justify-center items-center gap-2 bg-[#181e25]">
        <Ionicons name="shield-checkmark" size={18} color="orange" />
        <Text className="text-sm text-white">
         {t("walletWithdrawal.securityWarning")}
        </Text>
      </View>

      <StatusBar style="light" />
      <Toast />
    </View>
  );
};

export default WalletWithdrawal;
