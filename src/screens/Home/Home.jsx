import React, { useRef, useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Linking,
  FlatList,
  StatusBar,
  ScrollView,
  BackHandler,
  Dimensions, 
  Platform,
  Animated,
  Easing
} from "react-native";
import { Modal, Pressable } from 'react-native';
import { Ionicons, AntDesign } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Loader from "../../components/Loader";
import { useNavigation, useFocusEffect, useNavigationState } from "@react-navigation/native";
import { useGetBalanceQuery } from "../../services/WalletApi/walletApi";
import { useGetUserProfileQuery, useGetTokenMutation, useCreateTokenMutation } from "../../services/Auth/authAPI";
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
const ITEM_WIDTH = width - 50;

const HomeScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [showBalance, setShowBalance] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(null);
  const flatListRef = useRef(null);
  const confettiRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [createToken] = useCreateTokenMutation();
  const [showKycModal, setShowKycModal] = useState(false);
  const [kycCheckInterval, setKycCheckInterval] = useState(null);
  const [showReferralSuccessModal, setShowReferralSuccessModal] = useState(false);
  const [hasShownReferralSuccess, setHasShownReferralSuccess] = useState(false);

  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const scaleAnim = useState(new Animated.Value(0.9))[0];
  const balancePulseAnim = useState(new Animated.Value(1))[0];


  // Fetch user profile and enable refetch
  const {
    data: userProfile,
    isLoading: isProfileLoading,
    refetch: refetchProfile,
  } = useGetUserProfileQuery();
  //console.log("userProfile Data:", JSON.stringify(userProfile, null, 2));
   const userId = userProfile?.data?.user?.id;
  const referralCode = userProfile?.data?.referralCode;
  const isReferralCodeUsed = referralCode?.isUsed;

  const { data: history, isLoadingHistory, isError, refetch } = useGetTransactionHistoryQuery(
    { 
      userId,
    },
    { 
      skip: !userId,
      pollingInterval: 1000,
    }
  );
   //console.log("history Data:", JSON.stringify(history, null, 2));

  const { data: pubs, isLoading: isLoadingPubs, error: pubsError } = useGetPubsQuery();

  // Fetch balance and enable refetch
  const {
    data: balanceData,
    isLoading: isBalanceLoading,
    error: balanceError,
    isError: isBalanceError,
    refetch: refetchBalance,
  } = useGetBalanceQuery(userId, { 
    skip: !userId,
    pollingInterval: 1000,
  });

  const isLoading = isProfileLoading || isBalanceLoading;
  const { data: notificationsResponse, isLoadingNotification } = useGetNotificationsQuery({ userId });
  const { data: serverTokenData } = useGetTokenMutation(userId, {
    skip: !userId,
    pollingInterval: 1000,
  });

  // Extract notifications array safely
  const notifications = notificationsResponse?.data?.items || [];

  // Count unread notifications where `readed` is false
  const unreadCount = notifications.filter(notification => !notification.readed).length;

   // Check for referral code success
  useEffect(() => {
    const checkReferralSuccess = async () => {
      if (isReferralCodeUsed && !hasShownReferralSuccess) {
        // Check if we've already shown this modal
        const hasSeenModal = await AsyncStorage.getItem('hasSeenReferralSuccessModal');
        
        if (!hasSeenModal || hasSeenModal !== 'true') {
          // Show modal after a short delay for better UX
          setTimeout(() => {
            setShowReferralSuccessModal(true);
            // Trigger confetti
            if (confettiRef.current) {
              confettiRef.current.start();
            }
            // Mark as shown in AsyncStorage
            AsyncStorage.setItem('hasSeenReferralSuccessModal', 'true');
            setHasShownReferralSuccess(true);
          }, 1500);
        }
      }
    };

    if (userProfile && referralCode) {
      checkReferralSuccess();
    }
  }, [userProfile, referralCode, hasShownReferralSuccess]);


   // Start animations when component mounts
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      })
    ]).start();

    // Balance pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(balancePulseAnim, {
          toValue: 1.03,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(balancePulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    const checkAndUpdateToken = async () => {
      if (!userId) {
        console.log('No userId provided, skipping token update.');
        return;
      }

      while (true) {
        try {
          const localToken = await getStoredPushToken();
          const serverToken = serverTokenData?.data?.token;

          if (!localToken) {
            console.log('No local push token available, cannot proceed.');
            return;
          }

          if (localToken === serverToken) {
            console.log('Push token already up to date.');
            return;
          }

          const payload = { userId, token: localToken };
          const response = await createToken(payload).unwrap();

          console.log('Token successfully updated on backend:', response);
          break; 
        } catch (error) {
          console.log('Error updating push token, retrying in 3s...', JSON.stringify(error, null, 2));
          await new Promise(resolve => setTimeout(resolve, 30000));
        }
      }
    };

    checkAndUpdateToken();
  }, [userId, serverTokenData]);

  // Check KYC status and show modal if needed
  useEffect(() => {
    const checkKYCStatus = () => {
      // Check if user has empty KYC documents or isVerifiedKYC is false
      const hasEmptyKyc = userProfile?.data?.user?.kycDocuments?.length === 0;
      const isKycVerified = userProfile?.data?.user?.isVerifiedKYC;
      
      if (hasEmptyKyc || !isKycVerified) {
        setShowKycModal(true);
      }
    };

    // Check immediately when profile loads
    if (userProfile) {
      checkKYCStatus();
    }

    // Set up interval to check every 2 minutes
    const interval = setInterval(() => {
      if (userProfile) {
        checkKYCStatus();
      }
    }, 120000); // 2 minutes

    // Store interval reference for cleanup
    setKycCheckInterval(interval);

    // Cleanup interval on component unmount
    return () => {
      if (kycCheckInterval) {
        clearInterval(kycCheckInterval);
      }
    };
  }, [userProfile]);

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
      try {
        const value = await AsyncStorage.getItem('hasAcceptedTerms');

        if (value === null) {
          // First time launch: set to false
          await AsyncStorage.setItem('hasAcceptedTerms', 'false');
          setHasAcceptedTerms(false);
        } else {
          setHasAcceptedTerms(value === 'true');
        }
      } catch (error) {
        console.error('Error checking terms acceptance:', error);
      }
    };

    checkTerms();
  }, []);
     
  useEffect(() => {
    const backAction = () => {
      // Get current route index from Tab.Navigator
      const state = navigation.getState();
      const currentTabIndex = state?.routes?.[0]?.state?.index;

      if (currentTabIndex !== 0) {
        // Not on HomeTab → navigate back to HomeTab
        navigation.navigate("HomeTab");
        return true; // prevent default exit
      }

      // Already on HomeTab → exit app
      BackHandler.exitApp();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [navigation]);
      
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
  }, [currentIndex, pubs]);
   
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
      case 'FUND_REQUEST_PAYMENT': return t('history1.fund');
      case 'WALLET_TO_WALLET': return t('history1.wallet');
      case 'VIEW_CARD_DETAILS': return t('history1.cardView');
      case 'TONTINE_PAYMENT': return t('history1.tontine');
      case 'PAYMENT': return t('history1.payment');
      default: return type;
    }
  };

  const getMethodIcon = (transaction) => {
    switch (transaction.method?.toUpperCase()) {
      case 'MOBILE_MONEY':
        if (transaction.provider === 'ORANGE_MONEY' || transaction.provider?.toLowerCase() === 'orange') {
          return require('../../images/om.png');
        } else if (transaction.provider === 'MTN_MONEY') {
          return require('../../images/mtn.png');
        } else if (transaction.provider === 'WALLET_PAYMENT') {
          return require('../../images/wallet.jpeg');
        } else {
          return require('../../images/transaction.png');
        }

      case 'WALLET':
        if (transaction.provider === 'CMORANGEOM') {
          return require('../../images/om.png');
        } else if (transaction.provider === 'MTNMOMO') {
          return require('../../images/mtn.png');
        } else {
          return require('../../images/wallet.jpeg');
        }

      case 'VIRTUAL_CARD':
        return require('../../images/virtual.png');
      case 'BANK_TRANSFER':
        return require('../../images/ecobank.jpeg');
      default:
        return require('../../images/tontine.jpeg');
    }
  };

    const ReferralSuccessModal = () => (
    <Modal
      animationType="fade"
      transparent
      visible={showReferralSuccessModal}
      onRequestClose={() => setShowReferralSuccessModal(false)}
    >
      <View className="flex-1 justify-center items-center bg-black/70 px-6">
       
        <View className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
          {/* Celebration icon */}
          <View className="items-center mb-4">
            <View className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-pink-500 rounded-full justify-center items-center mb-3 shadow-lg">
              <Ionicons name="gift" size={40} color="white" />
            </View>
            <Text className="text-gray-900 text-2xl font-bold text-center">
              🎉 {t('referralSuccess.title') || "Congratulations!"} 🎉
            </Text>
          </View>
          
          {/* Message */}
          <View className="mb-6">
            <Text className="text-gray-700 text-lg text-center leading-7 mb-3">
              {t('referralSuccess.message1') || "Your referral code has been successfully used!"}
            </Text>
            <Text className="text-gray-600 text-center text-base leading-6">
              {t('referralSuccess.message2') || "The referral bonus has been added to your wallet. Thank you for inviting others to join!"}
            </Text>
          </View>
          
          {/* Close button */}
          <Pressable
            className="bg-gradient-to-r from-green-500 to-emerald-600 py-4 rounded-2xl shadow-lg active:opacity-90"
            onPress={() => setShowReferralSuccessModal(false)}
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name="checkmark-circle" size={24} color="white" className="mr-2" />
              <Text className="text-white font-bold text-lg">
                {t('referralSuccess.gotIt') || "Got it!"}
              </Text>
            </View>
          </Pressable>
          
          {/* Share option */}
          <Pressable
            className="mt-4 py-3 rounded-2xl border-2 border-green-500"
            onPress={() => {  setShowReferralSuccessModal(false);  }}
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name="share-social" size={20} color="#10B981" className="mr-2" />
              <Text className="text-green-600 font-semibold text-base">
                {t('referralSuccess.close')}
              </Text>
            </View>
          </Pressable>
        </View>
      </View>
    </Modal>
  );


  return (
    <View className="flex-1 bg-[#F2F2F2] pt-10 px-4">
      <StatusBar 
        backgroundColor="transparent"
        barStyle="dark-content"
        translucent={false}
      />

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
          {/* Ligne avec Bonjour + icône œil */}
        <View className="flex-row justify-between items-center mb-1">
          <Text className="text-black text-lg">{t("home.greeting")}</Text>
          <TouchableOpacity
            onPress={() => {
              if (showBalance) {
                setShowBalance(false);
              } else {
                navigation.navigate("Auth", {
                  screen: "PinCode",
                  params: {
                    onSuccess: () => {
                      setShowBalance(true);

                      // Automatically hide balance after 20s
                      setTimeout(() => {
                        setShowBalance(false);
                      }, 20000);

                      return Promise.resolve();
                    },
                    showBalance: true,
                  },
                });
              }
            }}
          >
            <Ionicons
              name={showBalance ? "eye-outline" : "eye-off-outline"}
              size={isSmallScreen ? scale(22) : scale(24)}
              color="black"
            />
          </TouchableOpacity>
        </View>


          {/* Nom aligné sous Bonjour */}
          <Text className="text-black text-2xl font-bold mb-2">
            {userProfile?.data?.user?.firstname} {userProfile?.data?.user?.lastname}
          </Text>

          {/* Bloc Solde */}
          <View className="flex-row justify-between items-center my-2">
            <Text className="text-black text-base">{t("home.balance")}</Text>
            <Text className="text-black text-xl font-bold">
              {isBalanceLoading ? (
                <Loader size="small" color="black" />
              ) : showBalance ? (
                userProfile?.data?.user?.country === "Canada" ? (
                  // Currency BEFORE balance
                  `${balanceData?.data?.currency ?? ""} ${(balanceData?.data?.balance ?? 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                ) : (
                  // Currency AFTER balance
                  `${(balanceData?.data?.balance ?? 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })} ${balanceData?.data?.currency ?? ""}`
                )
              ) : (
                "****"
              )}
            </Text>
          </View>


          {/* Boutons actions */}
          <View className="flex-row mt-1 gap-4">
            <TouchableOpacity
              onPress={() => navigation.navigate("SelectMethod")}
              className="bg-white px-3 py-2 rounded-full flex-row items-center flex-1 justify-center"
            >
               <Ionicons name="arrow-up-circle-outline" size={20} color="black" />
              <Text className="text-black font-bold text-xs ml-2">
                {t("home.transfer")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate("MethodType")}
              className="bg-white px-3 py-2 rounded-full flex-row items-center flex-1 justify-center"
            >
              <Ionicons name="wallet-outline" size={18} color="black" />
              <Text className="text-black font-bold text-xs ml-2">
                {t("home.recharge")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Services Section */}
    
          <Animated.View 
            style={{ transform: [{ translateY: slideAnim }], opacity: fadeAnim }}
            className="mb-1"
          >
            <View className="flex-row justify-between items-center mb-1">
              <Text className="text-gray-900 font-bold text-lg">
                {t("home.services")} 
              </Text>
              <TouchableOpacity 
                onPress={() => navigation.navigate("ServiceScreen")}
                className="flex-row items-center"
              >
                <Text className="text-green-600 font-semibold text-sm mr-1">
                  {t("home.seeAll")}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#16A34A" />
              </TouchableOpacity>
            </View>

            {/* Services grid */}
            <View className="flex-row justify-between flex-wrap">
  {(
    userProfile?.data?.user?.country === "Canada"
      ? [
          { label: t("home.canadaKyc"), icon: "shield-checkmark-outline", route: "VerifyIdentity" },
          { label: t("drawer.request1"), icon: "chatbubbles-outline", route: "NiuRequest", color: "#cc5de8", bgColor: "#f8f0fc" },
          //{ label: t("home.payBills"), icon: "calculator-outline", route: "PaymentSimulator", color: "#ff922b", bgColor: "#fff9f0" },
          { label: t("serviceScreen.support") || "Support", icon: "headset-outline", route: "ChatScreen", color: "#8B5CF6", bgColor: "#F5F3FF" },
        ]
      : [
          ...(userProfile?.data?.user?.country === "Cameroon"
            ? [{ label: t("home.virtualCard"), icon: "card-outline", route: "OnboardingCard" }]
            : []),

          { label: t("home.friendsShare"), icon: "people-outline", route: "WelcomeShare" },
          { label: t("home.fundRequest"), icon: "cash-outline", route: "WelcomeDemand" },
          { label: t("home.etontine"), icon: "layers-outline" },

        ]
  ).map((item, index) => (
    <TouchableOpacity
      key={index}
      className="items-center w-1/4 mb-1"
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
      <View className="bg-white p-4 rounded-2xl mb-2 shadow-sm border border-gray-100">
        <Ionicons name={item.icon} size={28} color="#16A34A" />
      </View>
      <Text className="text-xs text-gray-700 font-medium text-center">
        {item.label}
      </Text>
    </TouchableOpacity>
  ))}
              </View>

          </Animated.View>
      


       {/* Ads Carousel */}
          <Animated.View 
            style={{ transform: [{ translateY: slideAnim }], opacity: fadeAnim }}
            className="mb-1"
          >
            {isLoadingPubs ? (
              <View className="h-32 bg-gray-200 rounded-2xl justify-center items-center">
                <Loader />
              </View>
            ) : pubs?.items?.filter(pub => pub.isActive).length > 0 ? (
              <View>
                <FlatList
                  ref={flatListRef}
                  data={pubs.items.filter(pub => pub.isActive)}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item.id.toString()}
                  contentContainerStyle={{ paddingHorizontal: 5 }}
                  decelerationRate="fast"
                  snapToAlignment="start"
                  getItemLayout={(_, index) => ({
                    length: ITEM_WIDTH + 10,
                    offset: index * (ITEM_WIDTH + 10),
                    index,
                  })}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      onPress={() => item.link && Linking.openURL(item.link)}
                      style={{
                        width: ITEM_WIDTH,
                        height: 140,
                        borderRadius: 16,
                        overflow: "hidden",
                        marginRight: 10,
                      }}
                      className="shadow-sm"
                    >
                      <Image
                        source={{ uri: item.imageUrl }}
                        style={{ width: "100%", height: "100%" }}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  )}
                />
                {/* Indicators */}
                <View className="flex-row justify-center mt-3">
                  {pubs.items.filter(pub => pub.isActive).map((_, index) => (
                    <View
                      key={index}
                      className={`h-2 w-2 rounded-full mx-1 ${
                        index === currentIndex ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </View>
              </View>
            ) : (
              <View className="h-32 bg-gray-100 rounded-2xl justify-center items-center">
                <Ionicons name="megaphone-outline" size={32} color="#9CA3AF" />
                <Text className="text-gray-500 text-sm mt-2">
                  {t("home.noPubs")}
                </Text>
              </View>
            )}
          </Animated.View>

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
          let description = item.description;

          // Handle BANK_TRANSFER deposits with URL descriptions
          if (
            item.type?.toUpperCase() === "DEPOSIT" &&
            item.method?.toUpperCase() === "BANK_TRANSFER" &&
            description &&
            (description.startsWith("http://") || description.startsWith("https://"))
          ) {
            description = t("home.viewDocument");
          }

          // Handle TONTINE_PAYMENT descriptions to remove # and numbers
          if (item.type?.toUpperCase() === "TONTINE_PAYMENT" && description) {
            description = description.replace(/#\d+/, "").trim();
          }

          const iconSource = getMethodIcon(item);

          //  Determine which amount to display
          let displayAmount;
          if (
            item.type === "PAYMENT" ||
            item.type === "TONTINE_PAYMENT" ||
            item.type === "VIEW_CARD_DETAILS"
          ) {
            displayAmount = item.totalAmount;
          } else if (
            description?.trim() === "Retrait par SENDO" ||
            description?.trim() === "Dépôt par SENDO"
          ) {
            displayAmount = item.totalAmount;
          } else {
            displayAmount = item.amount;
          }

          // Format createdAt date
          const formattedDate = new Date(item.createdAt).toLocaleString("fr-FR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <TouchableOpacity
              key={index}
              className="flex-row items-center mb-4 border-b border-gray-300 pb-2"
              onPress={() =>
                navigation.navigate("Receipt", {
                  transaction: item,
                  user: userProfile?.data?.user,
                })
              }
            >
              {/* Left icon */}
              <Image
                source={iconSource}
                className="w-10 h-10 mr-3 rounded-full"
                resizeMode="contain"
              />

              {/* Center content */}
              <View className="flex-1">
                <Text className="text-black font-semibold">{description}</Text>
                <Text className="text-black text-sm">
                  {displayAmount?.toLocaleString()} {item.currency}
                </Text>
              </View>

              {/* Right side: status + date */}
              <View className="items-end">
                <Text className={`text-xs font-semibold ${statusColor}`}>
                  {t(`transactionStatus.${item.status?.toUpperCase()}`)}
                </Text>
                <Text className="text-gray-500 text-[10px] mt-1">{formattedDate}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>


      )}

      <Modal
        animationType="fade"
        transparent
        visible={showKycModal}
        onRequestClose={() => setShowKycModal(false)}
      >
         <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl">
            <View className="items-center mb-4">
              <View className="w-16 h-16 bg-yellow-100 rounded-full justify-center items-center mb-3">
                <Ionicons name="shield-checkmark-outline" size={32} color="#F59E0B" />
              </View>
              <Text className="text-gray-900 text-xl font-bold text-center">
                {t('kycModal.title')}
              </Text>
            </View>
            
            <Text className="text-gray-600 text-center text-base leading-6 mb-6">
              {t('kycModal.message')}
            </Text>
            
            <View className="flex-row gap-3">
              <Pressable
                className="flex-1 bg-gray-100 py-4 rounded-2xl"
                onPress={() => setShowKycModal(false)}
              >
                <Text className="text-gray-700 font-semibold text-center">
                  {t('kycModal.laterButton') || "Later"}
                </Text>
              </Pressable>
              
             <Pressable
              className="flex-1 bg-green-500 py-4 rounded-2xl shadow-sm"
              onPress={() => {
                setShowKycModal(false);
                if (userProfile?.data?.user.country === "Canada") {
                  navigation.navigate("VerifyIdentity");
                } else {
                  navigation.navigate("VerifyIdentity");
                }
              }}
            >
              <Text className="text-white font-semibold text-center">
                {t('kycModal.verifyButton') || "Verify Now"}
              </Text>
            </Pressable>

            </View>
          </View>
        </View>
      </Modal>
        <ReferralSuccessModal />
    </View>
  );
};

export default HomeScreen;