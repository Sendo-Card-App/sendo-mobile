import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  BackHandler,
   Dimensions, Platform,StatusBar
} from "react-native";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import Loader from "../../components/Loader";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useGetBalanceQuery } from "../../services/WalletApi/walletApi";
import { useGetUserProfileQuery } from "../../services/Auth/authAPI";
import { useGetTransactionHistoryQuery } from "../../services/WalletApi/walletApi";
import { useGetNotificationsQuery } from '../../services/Notification/notificationApi';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
const TopLogo = require("../../images/TopLogo.png");
import ButtomLogo from "../../images/ButtomLogo.png";
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationBell from '../../components/NotificationBell';


const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 375;
const isIOS = Platform.OS === 'ios';
const scale = (size) => (width / 375) * size;

const HomeScreen = () => {
  const navigation = useNavigation();
    const { t } = useTranslation();
    const [showBalance, setShowBalance] = useState(false);
    const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
    // Fetch user profile and enable refetch
    const {
      data: userProfile,
      isLoading: isProfileLoading,
      refetch: refetchProfile,
    } = useGetUserProfileQuery();
  
    const userId = userProfile?.data?.id;
    
    const { data: history, isLoadingHistory, isError, refetch } = useGetTransactionHistoryQuery(
        { 
          userId,
        
        },
        { skip: !userId }
      );
        //console.log('Transaction History Data:', JSON.stringify(history, null, 2));

    // Fetch balance and enable refetch
    const {
      data: balanceData,
      isLoading: isBalanceLoading,
      error: balanceError,
      isError: isBalanceError,
      refetch: refetchBalance,
    } = useGetBalanceQuery(userId, { skip: !userId });
  
    const isLoading = isProfileLoading || isBalanceLoading;
    const { data: notificationsResponse, isLoadingNotification } = useGetNotificationsQuery({ userId });

  // Extract notifications array safely
  const notifications = notificationsResponse?.data?.items || [];

  // Count unread notifications where `readed` is false
  const unreadCount = notifications.filter(notification => !notification.readed).length;


    // Refetch profile and balance when screen is focused
   useFocusEffect(
      useCallback(() => {
        refetchProfile();
        if (userId) {
          refetchBalance();
          refetch(); 
        }
      }, [userId])
    );

    
    useEffect(() => {
      const checkTerms = async () => {
        const value = await AsyncStorage.getItem("hasAcceptedTerms");
        setHasAcceptedTerms(value === "true");
      };
      checkTerms();
    }, []);
     
    //    useEffect(() => {
    //   const backAction = () => {
    //     BackHandler.exitApp();
    //     return true;
    //   };

    //   const backHandler = BackHandler.addEventListener(
    //     "hardwareBackPress",
    //     backAction
    //   );

    //   return () => backHandler.remove(); 
    // }, []);

    useEffect(() => {
      if (balanceError) {
        let errorMessage = 'An unknown error occurred';
       
        if (balanceError.status === 403) errorMessage = 'Missing KYC documents';
        else if (balanceError.status === 404) errorMessage = 'Wallet not found';
        else if (balanceError.data?.message) errorMessage = balanceError.data.message;
  
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: errorMessage,
          position: 'top',
          visibilityTime: 10000,
          autoHide: true,
        });
      }
    }, [balanceError]);
    
    const getStatusColor = (status) => {
  switch (status?.toUpperCase()) {
    case 'COMPLETED': return 'text-green-600';
    case 'FAILED': return 'text-red-600';
    case 'PENDING': return 'text-yellow-600';
    case 'BLOCKED': return 'text-orange-600';
    default: return 'text-gray-600';
  }
};

const getTypeLabel = (type, t) => {
  switch (type?.toUpperCase()) {
    case 'DEPOSIT': return t('history1.deposit');
    case 'WITHDRAWAL': return t('history1.withdraw');
    case 'TRANSFER': return t('history1.transfer');
    case 'SHARED_PAYMENT': return t('history1.share');
    case 'WALLET_TO_WALLET': return t('history1.wallet');
    case 'TONTINE_PAYMENT': return t('history1.tontine');
    case 'PAYMENT': return t('history1.payment');
    default: return type;
  }
};

const getMethodIcon = (transaction) => {
  switch (transaction.method?.toUpperCase()) {
    case 'MOBILE_MONEY':
      if (transaction.provider === 'CMORANGEOM') {
        return require('../../images/om.png');
      } else if (transaction.provider === 'MTNMOMO') {
        return require('../../images/mtn.png');
      } else {
        return require('../../images/transaction.png');
      }
    case 'BANK_TRANSFER':
      return require('../../images/RoyalBank.png');
    default:
      return require('../../images/transaction.png');
  }
};


  return (
    <View className="flex-1 bg-[#0D0D0D] pt-10 px-4">
      {/* Top header */}
      <View className="flex-row justify-between items-center mb-1">
        <Image
          source={ButtomLogo}
          resizeMode="contain"
          className="h-[40px] w-[120px]"
        />

        {/* Icons Row */}
        <View className="flex-row items-center gap-4">
         <NotificationBell
             unreadCount={unreadCount}
            onPress={() => navigation.navigate('NotificationComponent')}
          />

          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <Ionicons name="menu-outline" size={28} color="white" />
          </TouchableOpacity>
        </View>

        {/* Top Logo in absolute position */}
        <View className="absolute top-[-48] left-9 right-0 items-center">
          <Image
            source={TopLogo}
            className="h-[90px] w-[120px]"
            resizeMode="contain"
          />
        </View>
      </View>

       <View className="border border-dashed border-white mt-1 mb-5 " />
      {/* Balance Card with TopLogo background */}
      <View className="relative bg-[#7ddd7d] rounded-xl p-2 mb-1 overflow-hidden">
          <Image
            source={TopLogo}
            resizeMode="contain"
            className="absolute top-0 left-0 right-0 bottom-0 h-full w-full opacity-10"
          />
          <View className="z-10">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-black text-xl">{t("home.greeting")}</Text>
              <TouchableOpacity 
                onPress={() => {
                  if (showBalance) {
                    setShowBalance(false);
                  } else {
                    navigation.navigate('Auth', { 
                      screen: 'PinCode',
                      params: {
                        onSuccess: () => {
                          setShowBalance(true);
                          return Promise.resolve();
                        },
                        showBalance: true
                      }
                    });
                  }
                }}
              >
                <Ionicons
                  name={showBalance ? "eye-outline" : "eye-off-outline"}
                  size={isSmallScreen ? scale(24) : scale(28)}
                  color="black"
                />
              </TouchableOpacity>
            </View>

            <Text className="text-black text-2xl font-bold"> {userProfile?.data?.firstname} {userProfile?.data?.lastname}</Text>

            <View className="flex-row justify-between items-center my-2">
              <Text className="text-black text-xl">{t("home.balance")}</Text>
             <Text className="text-black text-4xl font-bold">
                {isBalanceLoading ? (
                  <Loader size="small" color="black" />
                ) : showBalance ? (
                  `${(balanceData?.data.balance || 0).toLocaleString('en-US')} ${balanceData?.data.currency || 'XAF'}`
                ) : (
                  '****'
                )}
              </Text>

            </View>

            <View className="flex-row mt-4 justify-between space-x-4">
              <TouchableOpacity
                onPress={() => navigation.navigate('SelectMethod')}
                className="bg-white px-3 py-2 rounded-full flex-row items-center space-x-2 flex-1">
                <Ionicons name="send-outline" size={16} color="black" />
                <Text className="text-black font-semibold text-sm">{t("home.transfer")}</Text>
              </TouchableOpacity>

              {/* Recharger mon compte button */}
              <TouchableOpacity
                onPress={() => navigation.navigate('MethodType')}
                className="bg-white px-2 py-2 rounded-full flex-row items-center space-x-2 flex-1">
                <Ionicons name="refresh-outline" size={16} color="black" />
                <Text className="text-black font-semibold text-sm">{t("home.recharge")}</Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>


      {/* Action buttons */}
      <View className="mb-4">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-green-400 font-semibold text-base">
            {t("home.services")} 
          </Text>
          <TouchableOpacity onPress={() => navigation.navigate("ServiceScreen")}>
            <Text className="text-white text-sm">{t("home.seeAll")}</Text>
          </TouchableOpacity>
        </View>

        {/* Action buttons row */}
        <View className="flex-row justify-between">
          {[
            { label: t("home.virtualCard"), icon: "card-outline", route: "Payment" },
            { label: t("home.friendsShare"), icon: "people-outline", route: "WelcomeShare" },
            { label: t("home.fundRequest"), icon: "cash-outline", route: "WelcomeDemand" },
            { label: t("home.etontine"), icon: "layers-outline" },
            { label: t("home.payBills"), icon: "calculator-outline", route: "PaymentSimulator" },
          ].map((item, index) => (
            <TouchableOpacity
              key={index}
              className="items-center w-[18%]"
              onPress={() => {
                if (item.label === t("home.etontine")) {
                  hasAcceptedTerms
                    ? navigation.navigate("TontineList")
                    : navigation.navigate("TermsAndConditions");
                } else {
                  navigation.navigate(item.route);
                }
              }}
            >
              <View className="bg-[#0B0F1D] border border-white p-2 rounded-full mb-1">
                <Ionicons name={item.icon} size={22} color="green" />
              </View>
              <Text className="text-[10px] text-white text-center">{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>



      {/* Section PUB with TopLogo background */}
       <View className="bg-[#7ddd7d] py-16 px-8 rounded-xl items-center justify-center mb-3 overflow-hidden">
        <View className="absolute top-0 left-0 right-0 bottom-0 items-center justify-center opacity-10">
          <Image source={TopLogo} className="h-[130px] w-[160px]" resizeMode="contain" />
        </View>
        <Text className="text-black font-bold text-lg">{t("home.pubSection")}</Text>
      </View>

      {/* Transactions récentes */}
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-green-400 font-semibold text-base">
          {t("home.recentTransactions")}
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate("TransferTab")}>
          <Text className="text-white text-sm font-medium">
            {t("home.seeAll")}
          </Text>
        </TouchableOpacity>
      </View>

          {isLoadingHistory ? (
            <Loader />
          ) : history?.data?.transactions?.items?.length === 0 ? (
            <Text className="text-white text-center mt-4">{t("home.noTransactions")}</Text>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false}>
              {history?.data?.transactions?.items?.map((item, index) => {
                const statusColor = getStatusColor(item.status);
                const typeLabel = getTypeLabel(item.type, t);
                const iconSource = getMethodIcon(item);

                return (
                  <TouchableOpacity
                    key={index}
                    className="flex-row items-center mb-4 border-b border-gray-700 pb-2"
                    onPress={() => navigation.navigate('Receipt', {
                      transaction: item,
                      user: userProfile?.data,
                    })}
                  >
                    <Image source={iconSource} className="w-10 h-10 mr-3 rounded-full" resizeMode="contain" />
                    <View className="flex-1">
                      <Text className="text-white font-semibold">{item.description || typeLabel}</Text>
                      <Text className="text-gray-300 text-sm">{item.amount?.toLocaleString()} {item.currency || "XAF"}</Text>
                    </View>
                    <Text className={`text-xs font-semibold ${statusColor}`}>{item.status}</Text>
                  </TouchableOpacity>

                );
              })}
            </ScrollView>

          )}


    </View>
  );
};

export default HomeScreen;
