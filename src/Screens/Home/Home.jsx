import React, { useRef,useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Linking,
  FlatList,
  ScrollView,
  BackHandler,
   Dimensions, Platform,StatusBar
} from "react-native";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import Loader from "../../components/Loader";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useGetBalanceQuery } from "../../services/WalletApi/walletApi";
import { useGetUserProfileQuery,  useGetTokenMutation, useCreateTokenMutation  } from "../../services/Auth/authAPI";
import { useGetTransactionHistoryQuery } from "../../services/WalletApi/walletApi";
import { getStoredPushToken } from '../../services/notificationService';
import { useGetNotificationsQuery } from '../../services/Notification/notificationApi';
import { useGetPubsQuery } from '../../services/Pub/pubApi';
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
const ITEM_WIDTH = width - 80;

const HomeScreen = () => {
  const navigation = useNavigation();
    const { t } = useTranslation();
    const [showBalance, setShowBalance] = useState(false);
    const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
    const flatListRef = useRef(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [createToken] = useCreateTokenMutation();

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
     const { data: pubs, isLoading: isLoadingPubs, error: pubsError } = useGetPubsQuery();
      //console.log('Liste des PUB:', JSON.stringify(pubs, null, 2));

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
      const { data: serverTokenData } = useGetTokenMutation(userId, {
         skip: !userId
       });
  // Extract notifications array safely
  const notifications = notificationsResponse?.data?.items || [];

  // Count unread notifications where `readed` is false
  const unreadCount = notifications.filter(notification => !notification.readed).length;

   useEffect(() => {
  const checkAndUpdateToken = async () => {
    if (!userId) {
      console.log(' No userId provided, skipping token update.');
      return;
    }

    try {
      const localToken = await getStoredPushToken();
      const serverToken = serverTokenData?.data?.token;

      //console.log(' Local token from device:', localToken);
     // console.log(' Token from server:', serverToken);

      if (!localToken) {
        console.log(' No local push token available, cannot proceed.');
        return;
      }

      if (localToken === serverToken) {
       
        return;
      }

      const payload = { userId, token: localToken };
     

      const response = await createToken(payload).unwrap();
      console.log(' Token successfully updated on backend:', response);

    } catch (error) {
      console.log(' Error updating push token:', JSON.stringify(error, null, 2));
    }
  };

  checkAndUpdateToken();
}, [userId, serverTokenData]);


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
      if (!pubs?.items) return;
      const activeItems = pubs.items.filter(pub => pub.isActive);
      if (activeItems.length <= 1) return;

      const interval = setInterval(() => {
        let next = currentIndex + 1;
        if (next >= activeItems.length) next = 0;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        setCurrentIndex(next);
      }, 10000);

      return () => clearInterval(interval);
    }, [currentIndex, pubs])
   
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
    <View className="flex-1 bg-[#F2F2F2] pt-10 px-4">
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
            <Ionicons name="menu-outline" size={28} color="black" />
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

       <View className="border border-dashed border-black mt-1 mb-5 " />
      {/* Balance Card with TopLogo background */}
      <View className="relative bg-[#70ae70] rounded-xl p-2 mb-1 overflow-hidden">
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

            <View className="flex-row mt-4 gap-4">
              <TouchableOpacity
                onPress={() => navigation.navigate('SelectMethod')}
                className="bg-white px-3 py-2 rounded-full flex-row items-center flex-1 justify-center"
              >
                <Ionicons name="send-outline" size={20} color="black" />
                <Text className="text-black font-bold text-xs ml-2">{t("home.transfer")}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('MethodType')}
                className="bg-white px-3 py-2 rounded-full flex-row items-center flex-1 justify-center"
              >
                <Ionicons name="refresh-outline" size={20} color="black" />
                <Text className="text-black font-bold text-xs ml-2">{t("home.recharge")}</Text>
              </TouchableOpacity>
            </View>


          </View>
        </View>


      {/* Action buttons */}
      <View className="mb-4">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-black font-bold text-base">
            {t("home.services")} 
          </Text>
         <TouchableOpacity onPress={() => navigation.navigate("ServiceScreen")}>
            <Text style={{ color: '#000', fontSize: 14, textDecorationLine: 'underline' }}>
              {t("home.seeAll")}
            </Text>
          </TouchableOpacity>

        </View>

        {/* Action buttons row */}
        <View className="flex-row justify-between">
          {[
            { label: t("home.virtualCard"), icon: "card-outline", route: "Payment" },
            { label: t("home.friendsShare"), icon: "people-outline", route: "WelcomeShare" },
            { label: t("home.fundRequest"), icon: "cash-outline", route: "WelcomeDemand" },
            { label: t("home.etontine"), icon: "layers-outline" },
           
          ].map((item, index) => (
            <TouchableOpacity
              key={index}
              className="items-center w-[25%]"
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
              <View className="bg-[#F2F2F2] border border-white p-2 rounded-full mb-1">
                <Ionicons name={item.icon} size={35} color="green" />
              </View>
              <Text className="text-[10px] text-black font-bold text-center">{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>



      {/* Section PUB with TopLogo background */}
       <View className="mb-3">
          <Text className="text-black font-bold text-base mb-2">
            {t("home.pubSection")}
          </Text>

          {isLoadingPubs ? (
            <Loader />
          ) : pubs?.items?.filter(pub => pub.isActive).length > 0 ? (
            <FlatList
              ref={flatListRef}
              data={pubs.items.filter(pub => pub.isActive)}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{ paddingHorizontal: 20 }}
              decelerationRate="fast"
              snapToAlignment="start"
              getItemLayout={(_, index) => ({
                length: ITEM_WIDTH + 20, 
                offset: index * (ITEM_WIDTH + 20),
                index,
              })}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => item.link && Linking.openURL(item.link)}
                  style={{
                    width: ITEM_WIDTH,
                    height: 130,
                    borderRadius: 12,
                    overflow: "hidden",
                    marginRight: 20,
                    backgroundColor: "#eee",
                  }}
                >
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              )}
            />
          ) : (
            <Text className="text-gray-500 text-center">
              {t("home.noPubs")}
            </Text>
          )}
        </View>

      {/* Transactions récentes */}
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-black font-bold text-base">
          {t("home.recentTransactions")}
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate("TransferTab")}>
           <Text
              style={{
                color: '#000',
                fontSize: 14,
                fontWeight: '500',
                textDecorationLine: 'underline',
              }}
            >
            {t("home.seeAll")}
          </Text>
        </TouchableOpacity>
      </View>

          {isLoadingHistory ? (
            <Loader />
          ) : history?.data?.transactions?.items?.length === 0 ? (
            <Text className="text-black text-center mt-4">{t("home.noTransactions")}</Text>
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
                      <Text className="text-black font-semibold">{item.description || typeLabel}</Text>
                      <Text className="text-black text-sm">{item.amount?.toLocaleString()} {item.currency}</Text>
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
