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
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Alert,
  AppState,
  SafeAreaView
} from "react-native";
import { Ionicons, AntDesign, MaterialIcons } from "@expo/vector-icons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Loader from "../../components/Loader";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useGetBalanceQuery } from "../../services/WalletApi/walletApi";
import { useGetUserProfileQuery, useCreateTokenMutation } from "../../services/Auth/authAPI";
import { useGetTransactionHistoryQuery } from "../../services/WalletApi/walletApi";
import { getStoredPushToken } from '../../services/notificationService';
import { useGetNotificationsQuery } from '../../services/Notification/notificationApi';
import { useGetPubsQuery } from '../../services/Pub/pubApi';
import { useGetConfigQuery } from '../../services/Config/configApi';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import i18n from '../../../i18n';
import NotificationBell from '../../components/NotificationBell';

const TopLogo = require("../../images/TopLogo.png");
import ButtomLogo from "../../images/ButtomLogo.png";

const FLAGS = {
  en: require('../../images/usa.png'),
  fr: require('../../images/fr.png'),
};

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;
const scale = (size) => (width / 375) * size;
const ITEM_WIDTH = width - 50;
const STATUS_BAR_HEIGHT = Platform.OS === "android" ? StatusBar.currentHeight : 0;

// Storage key for version
const STORAGE_KEYS = {
  APP_VERSION: 'appVersion',
  HAS_ACCEPTED_TERMS: 'hasAcceptedTerms',
  HAS_SEEN_REFERRAL_MODAL: 'hasSeenReferralSuccessModal',
  VERSION_CHECK_TIMESTAMP: 'versionCheckTimestamp'
};

const HomeScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [showBalance, setShowBalance] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(null);
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [createToken] = useCreateTokenMutation();
  const [showKycModal, setShowKycModal] = useState(false);
  const [showPubs, setShowPubs] = useState(true);
  const [showReferralSuccessModal, setShowReferralSuccessModal] = useState(false);
  const [hasShownReferralSuccess, setHasShownReferralSuccess] = useState(false);
  
  // Language modal states
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language || 'fr');
  const modalSlideAnim = useState(new Animated.Value(300))[0];
  
  // Version check states - CRITICAL: These determine the entire app flow
  const [isUpdateRequired, setIsUpdateRequired] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  const [storeUrl, setStoreUrl] = useState('');
  const [currentVersion, setCurrentVersion] = useState('');
  const [requiredVersion, setRequiredVersion] = useState('');
  const [isCheckingVersion, setIsCheckingVersion] = useState(true);
  const [versionCheckCompleted, setVersionCheckCompleted] = useState(false);
  const [configLoaded, setConfigLoaded] = useState(false);

  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const scaleAnim = useState(new Animated.Value(0.9))[0];
  const balancePulseAnim = useState(new Animated.Value(1))[0];

  // Fetch config data - this is critical for version check
  const { data: configData, isLoading: isConfigLoading } = useGetConfigQuery();

  // Fetch user profile - only after version check passes
  const {
    data: userProfile,
    isLoading: isProfileLoading,
    refetch: refetchProfile,
  } = useGetUserProfileQuery(undefined, {
    skip: isUpdateRequired || !versionCheckCompleted,
    pollingInterval: 100
  });
 // console.log('User Profile:', userProfile);
  const userId = userProfile?.data?.user?.id;
  const referralCode = userProfile?.data?.referralCode;
  const isReferralCodeUsed = referralCode?.isUsed;

  const { data: history, isLoading: isLoadingHistory, refetch } = useGetTransactionHistoryQuery(
    { userId },
    { 
      skip: !userId || isUpdateRequired || !versionCheckCompleted,
      pollingInterval: 100,
    }
  );
 // console.log(history)
  const { data: pubs, isLoading: isLoadingPubs } = useGetPubsQuery(undefined, {
    skip: isUpdateRequired || !versionCheckCompleted
  });

  const {
    data: balanceData,
    isLoading: isBalanceLoading,
    refetch: refetchBalance,
  } = useGetBalanceQuery(userId, { 
    skip: !userId || isUpdateRequired || !versionCheckCompleted,
    pollingInterval: 1000,
  });

  const { data: notificationsResponse } = useGetNotificationsQuery({ userId }, {
    skip: !userId || isUpdateRequired || !versionCheckCompleted
  });

  const notifications = notificationsResponse?.data?.items || [];
  const unreadCount = notifications.filter(notification => !notification.readed).length;

  const getExchangeRate = () => {
    const config = configData?.data;
    const rate = config?.find(item => item.name === 'SENDO_VALUE_CAD_CAM_CA')?.value;
    return rate ? parseFloat(rate) : 482;
  };

  const exchangeRate = getExchangeRate();

  // Function to animate modal in
  const animateModalIn = () => {
    Animated.timing(modalSlideAnim, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  // Function to animate modal out
  const animateModalOut = () => {
    Animated.timing(modalSlideAnim, {
      toValue: 300,
      duration: 300,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  // Language change function
  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    setSelectedLanguage(lang);
    animateModalOut();
    setTimeout(() => setLanguageModalVisible(false), 300);
    // You can implement your feedback function here
    Alert.alert('Succès', `${t('account.language_changed_to')} ${lang === 'en' ? 'English' : 'Français'}`);
  };

  // Function to compare version numbers safely
  const compareVersions = (v1, v2) => {
    try {
      if (!v1 || !v2) return 0;
      
      const parts1 = v1.split('.').map(Number);
      const parts2 = v2.split('.').map(Number);
      
      for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
        const p1 = parts1[i] || 0;
        const p2 = parts2[i] || 0;
        
        if (p1 < p2) return -1;
        if (p1 > p2) return 1;
      }
      return 0;
    } catch (error) {
      console.error('Error comparing versions:', error);
      return 0;
    }
  };

  // Function to get stored version from AsyncStorage
  const getStoredVersion = async () => {
    try {
      const storedVersion = await AsyncStorage.getItem(STORAGE_KEYS.APP_VERSION);
      return storedVersion;
    } catch (error) {
      console.error('Error getting stored version:', error);
      return null;
    }
  };

  // GATEKEEPER FUNCTION: This determines if the app should be usable
  const checkAppVersion = useCallback(async () => {
    try {
      setIsCheckingVersion(true);
      
      if (!configData?.data) {
        console.log('Waiting for config data...');
        return;
      }

      console.log('Checking version from config...');
      
      const requiredAndroidVersion = configData?.data?.find(
        item => item.name === 'SENDO_VERSION_APP_ANDROID'
      )?.value;
      
      const requiredIosVersion = configData?.data?.find(
        item => item.name === 'SENDO_VERSION_APP_IOS'
      )?.value;
      
      const isAndroid = Platform.OS === 'android';
      const requiredVersion = isAndroid ? requiredAndroidVersion : requiredIosVersion;
      
      if (!requiredVersion) {
        console.log('No version requirement found in config');
        setIsUpdateRequired(false);
        setVersionCheckCompleted(true);
        setIsCheckingVersion(false);
        return;
      }

      setRequiredVersion(requiredVersion);
      
      let storedVersion = await getStoredVersion();
      
      if (!storedVersion) {
        console.log('First time: storing required version:', requiredVersion);
        await AsyncStorage.setItem(STORAGE_KEYS.APP_VERSION, requiredVersion);
        await AsyncStorage.setItem(STORAGE_KEYS.VERSION_CHECK_TIMESTAMP, Date.now().toString());
        
        setCurrentVersion(requiredVersion);
        setIsUpdateRequired(false);
        setVersionCheckCompleted(true);
        setIsCheckingVersion(false);
        return;
      }
      
      setCurrentVersion(storedVersion);
      const comparison = compareVersions(storedVersion, requiredVersion);
      
      if (comparison < 0) {
        console.log(`⚠️ UPDATE REQUIRED: Stored=${storedVersion}, Required=${requiredVersion}`);
        
        const message = `Une nouvelle version (${requiredVersion}) est disponible. Veuillez mettre à jour pour continuer à utiliser Sendo.`;
        const url = isAndroid 
          ? 'https://play.google.com/store/apps/details?id=com.sfe.ca'
          : 'https://apps.apple.com/tr/app/sendo/id6753186956';
        
        setUpdateMessage(message);
        setStoreUrl(url);
        setIsUpdateRequired(true);
        setVersionCheckCompleted(true);
        setIsCheckingVersion(false);
      } else {
        console.log('✅ App version is up to date:', storedVersion);
        setIsUpdateRequired(false);
        setVersionCheckCompleted(true);
        setIsCheckingVersion(false);
      }
      
    } catch (error) {
      console.error('Error checking app version:', error);
      setIsUpdateRequired(false);
      setVersionCheckCompleted(true);
      setIsCheckingVersion(false);
    }
  }, [configData]);

  // Trigger version check when config loads
  useEffect(() => {
    if (configData && !versionCheckCompleted && !isUpdateRequired) {
      checkAppVersion();
    }
  }, [configData, versionCheckCompleted, isUpdateRequired, checkAppVersion]);

  // Function to handle update button press
  const handleUpdatePress = async () => {
    if (storeUrl) {
      try {
        const canOpen = await Linking.canOpenURL(storeUrl);
        if (canOpen) {
          await Linking.openURL(storeUrl);
          
          Alert.alert(
            'Mise à jour',
            'Une fois la mise à jour installée, ouvrez à nouveau l\'application.',
            [{ text: 'OK' }]
          );
        }
      } catch (err) {
        console.error('Failed to open store URL:', err);
        Alert.alert('Erreur', 'Impossible d\'ouvrir le store. Veuillez mettre à jour manuellement depuis l\'App Store ou Google Play.');
      }
    }
  };

  // Prevent navigation when update is required
  useEffect(() => {
    if (isUpdateRequired) {
      const unsubscribe = navigation.addListener('beforeRemove', (e) => {
        e.preventDefault();
      });
      return unsubscribe;
    }
  }, [navigation, isUpdateRequired]);

  // Prevent back button when update is required
  useEffect(() => {
    const backAction = () => {
      if (isUpdateRequired) {
        return true;
      }

      const state = navigation.getState();
      const currentTabIndex = state?.routes?.[0]?.state?.index;
      if (currentTabIndex !== 0) {
        navigation.navigate("HomeTab");
        return true;
      }
      BackHandler.exitApp();
      return true;
    };

    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, [navigation, isUpdateRequired]);

  // Rest of your effects - ONLY run if update is NOT required
  useEffect(() => {
    if (isUpdateRequired || !versionCheckCompleted) return;
    
    const checkReferralSuccess = async () => {
      if (isReferralCodeUsed && !hasShownReferralSuccess) {
        const hasSeenModal = await AsyncStorage.getItem(STORAGE_KEYS.HAS_SEEN_REFERRAL_MODAL);
        if (!hasSeenModal || hasSeenModal !== 'true') {
          setTimeout(() => {
            setShowReferralSuccessModal(true);
            AsyncStorage.setItem(STORAGE_KEYS.HAS_SEEN_REFERRAL_MODAL, 'true');
            setHasShownReferralSuccess(true);
          }, 1500);
        }
      }
    };

    if (userProfile && referralCode) {
      checkReferralSuccess();
    }
  }, [userProfile, referralCode, hasShownReferralSuccess, isUpdateRequired, versionCheckCompleted]);

  // Start animations - only if update not required
  useEffect(() => {
    if (!isUpdateRequired && versionCheckCompleted) {
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
    }
  }, [isUpdateRequired, versionCheckCompleted]);

  // KYC check - only if update not required
  useEffect(() => {
    if (isUpdateRequired || !versionCheckCompleted || !userProfile) return;

    const checkKYCStatus = () => {
      const hasEmptyKyc = userProfile?.data?.user?.kycDocuments?.length === 0;
      const isKycVerified = userProfile?.data?.user?.isVerifiedKYC;
      
      if (hasEmptyKyc || !isKycVerified) {
        setShowKycModal(true);
      }
    };

    checkKYCStatus();

    const interval = setInterval(checkKYCStatus, 120000);
    return () => clearInterval(interval);
  }, [userProfile, isUpdateRequired, versionCheckCompleted]);

  // Refetch on focus - only if update not required
  useFocusEffect(
    useCallback(() => {
      if (isUpdateRequired || !versionCheckCompleted) return;
      
      refetchProfile();
      if (userId) {
        refetchBalance();
        refetch(); 
      }
    }, [userId, isUpdateRequired, versionCheckCompleted])
  );

  // Terms check - only if update not required
  useEffect(() => {
    if (isUpdateRequired || !versionCheckCompleted) return;

    const checkTerms = async () => {
      try {
        const value = await AsyncStorage.getItem(STORAGE_KEYS.HAS_ACCEPTED_TERMS);
        if (value === null) {
          await AsyncStorage.setItem(STORAGE_KEYS.HAS_ACCEPTED_TERMS, 'false');
          setHasAcceptedTerms(false);
        } else {
          setHasAcceptedTerms(value === 'true');
        }
      } catch (error) {
        console.error('Error checking terms acceptance:', error);
      }
    };

    checkTerms();
  }, [isUpdateRequired, versionCheckCompleted]);
      
  // Pubs carousel - only if update not required
  useEffect(() => {
    if (isUpdateRequired || !versionCheckCompleted || !pubs?.items) return;
    
    const activeItems = pubs.items.filter(pub => pub.isActive);
    if (activeItems.length <= 1) return;

    const interval = setInterval(() => {
      let next = currentIndex + 1;
      if (next >= activeItems.length) next = 0;
      flatListRef.current?.scrollToIndex({ index: next, animated: true });
      setCurrentIndex(next);
    }, 10000);

    return () => clearInterval(interval);
  }, [currentIndex, pubs, isUpdateRequired, versionCheckCompleted]);
   
  // Helper functions

    const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED': return 'text-green-600';
      case 'FAILED': return 'text-red-600';
      case 'PENDING': return 'text-yellow-600';
      case 'BLOCKED': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };
  
 const getStatusColorValue = (status) => {
  switch (status?.toUpperCase()) {
    case 'COMPLETED': return '#16a34a'; // vert-600
    case 'FAILED': return '#dc2626';    // rouge-600
    case 'PENDING': return '#ca8a04';   // jaune-600
    case 'BLOCKED': return '#ea580c';   // orange-600
    default: return '#4b5563';           // gris-600
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

  const getTypeLabel = (type) => {
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
  
  const formatTransactionDisplay = (item) => {
    let displayAmount = item.amount;
    let displayCurrency = item.currency;
    let displayDescription = item.description;
    
    const userCountry = userProfile?.data?.user?.country;
    
    if (item.description === "Transfert CAM-CA") {
      if (userCountry === "Cameroon") {
        return {
          amount: item.amount,
          total: item.totalAmount,
          description: "Transfert CAM-CA",
          currency: "FCFA",
          showRate: true,
          rate: exchangeRate,
          isSpecialCase: true,
          formattedAmount: `${item.amount.toLocaleString('fr-FR')} XAF`
        };
      }
      
      if (userCountry === "Canada") {
        const amountInCAD = (item.amount / exchangeRate).toFixed(2);
        const totalInCAD = (item.totalAmount / exchangeRate).toFixed(2);
        
        return {
          amount: parseFloat(amountInCAD),
          total: parseFloat(totalInCAD),
          description: "Transfert CAM-CA",
          currency: "CAD",
          showRate: true,
          rate: exchangeRate,
          isSpecialCase: true,
          formattedAmount: `${amountInCAD} CAD`
        };
      }
      
      return {
        amount: item.amount,
        total: item.totalAmount,
        description: item.description,
        currency: item.currency,
        showRate: false,
        isSpecialCase: false
      };
    }

    if (item.type === "FUND_SUBSCRIPTION") {
      return {
        amount: item.amount,
        total: item.totalAmount,
        description: item.description?.replace("Souscription : #", "Fonds: ") || "Souscription de fonds",
        currency: item.currency,
        showRate: false,
        isSpecialCase: false
      };
    }

    if (
      item.type === "PAYMENT" ||
      item.type === "TONTINE_PAYMENT" ||
      item.type === "VIEW_CARD_DETAILS"
    ) {
      displayAmount = item.totalAmount;
    } else if (
      item.description?.trim() === "Retrait par SENDO" ||
      item.description?.trim() === "Dépôt par SENDO"
    ) {
      displayAmount = item.totalAmount;
    }

    if (
      item.type?.toUpperCase() === "DEPOSIT" &&
      item.method?.toUpperCase() === "BANK_TRANSFER" &&
      displayDescription &&
      (displayDescription.startsWith("http://") || displayDescription.startsWith("https://"))
    ) {
      displayDescription = t("home.viewDocument");
    }

    if (item.type?.toUpperCase() === "TONTINE_PAYMENT" && displayDescription) {
      displayDescription = displayDescription.replace(/#\d+/, "").trim();
    }

    return {
      amount: displayAmount,
      total: item.totalAmount,
      description: displayDescription,
      currency: displayCurrency,
      showRate: false,
      isSpecialCase: false
    };
  };

  const ReferralSuccessModal = () => (
    <Modal
      animationType="fade"
      transparent
      visible={showReferralSuccessModal && !isUpdateRequired}
      onRequestClose={() => setShowReferralSuccessModal(false)}
    >
      <View className="flex-1 justify-center items-center bg-black/70 px-6">
        <View className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">
          <View className="items-center mb-4">
            <View className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-pink-500 rounded-full justify-center items-center mb-3 shadow-lg">
              <Ionicons name="gift" size={40} color="white" />
            </View>
            <Text className="text-gray-900 text-2xl font-bold text-center">
              🎉 {t('referralSuccess.title') || "Congratulations!"} 🎉
            </Text>
          </View>
          <View className="mb-6">
            <Text className="text-gray-700 text-lg text-center leading-7 mb-3">
              {t('referralSuccess.message1') || "Your referral code has been successfully used!"}
            </Text>
            <Text className="text-gray-600 text-center text-base leading-6">
              {t('referralSuccess.message2') || "The referral bonus has been added to your wallet. Thank you for inviting others to join!"}
            </Text>
          </View>
          <Pressable
            className="bg-gradient-to-r from-green-500 to-emerald-600 py-4 rounded-2xl shadow-lg active:opacity-90"
            onPress={() => setShowReferralSuccessModal(false)}
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name="checkmark-circle" size={24} color="white" />
              <Text className="text-white font-bold text-lg ml-2">
                {t('referralSuccess.gotIt') || "Got it!"}
              </Text>
            </View>
          </Pressable>
        </View>
      </View>
    </Modal>
  );

  // 🔒 FORCED UPDATE MODAL
  const ForcedUpdateModal = () => (
    <Modal
      animationType="fade"
      transparent={false}
      visible={isUpdateRequired}
      onRequestClose={() => {
        return;
      }}
    >
      <View style={styles.fullScreenModal}>
        <View style={styles.updateModalContent}>
          <View style={styles.logoContainer}>
            <Image
              source={ButtomLogo}
              resizeMode="contain"
              style={styles.logo}
            />
          </View>
          
          <View style={styles.updateIconContainer}>
            <Ionicons name="cloud-upload-outline" size={60} color="#FFFFFF" />
          </View>
          
          <Text style={styles.updateTitle}>
            {t('update.requiredTitle') || "Mise à jour requise"}
          </Text>
          
          <Text style={styles.updateMessage}>
            {updateMessage || "Une nouvelle version est disponible. Veuillez mettre à jour pour continuer à utiliser Sendo."}
          </Text>
          
          <View style={styles.versionBadge}>
            <Text style={styles.versionText}>
              Nouvelle version: v{requiredVersion || ''}
            </Text>
          </View>
          
          <Pressable
            style={({ pressed }) => [
              styles.updateButton,
              pressed && styles.updateButtonPressed
            ]}
            onPress={handleUpdatePress}
          >
            <Ionicons 
              name={Platform.OS === 'android' ? 'logo-google-playstore' : 'logo-apple'} 
              size={24} 
              color="white" 
              style={styles.buttonIcon}
            />
            <Text style={styles.updateButtonText}>
              {t('update.updateNow') || "METTRE À JOUR MAINTENANT"}
            </Text>
          </Pressable>
          
          <Text style={styles.storeInfo}>
            {Platform.OS === 'android' 
              ? 'Vous serez redirigé vers Google Play Store'
              : 'Vous serez redirigé vers l\'App Store'}
          </Text>
          
          <Text style={styles.noEscapeText}>
            {t('update.requiredNotice') || "Cette mise à jour est obligatoire pour continuer à utiliser l'application"}
          </Text>
        </View>
      </View>
    </Modal>
  );

  // ✅ LOADING STATE
  if (isCheckingVersion || !versionCheckCompleted) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar backgroundColor="#F2F2F2" barStyle="dark-content" />
        <Loader size="large" />
        <Text style={styles.loadingText}>
          {t('common.checkingVersion') || "Vérification de l'application..."}
        </Text>
      </View>
    );
  }

  // ✅ GATEKEEPER STATE
  if (isUpdateRequired) {
    return <ForcedUpdateModal />;
  }

  // ✅ NORMAL STATE
  return (
    <View style={{ flex: 1, backgroundColor: "#f3efef" }}>
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />

      {/* HEADER */}
      <View
        style={{
          backgroundColor: "#84e884",
          paddingHorizontal: 20,
          paddingTop: STATUS_BAR_HEIGHT + 20,
          paddingBottom: 90,
          borderBottomLeftRadius: 20,
          borderBottomRightRadius: 20,
          position: "relative"
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginTop: 30,
            marginBottom: 20
          }}
        >
          {/* Profile */}
          <Ionicons name="person-circle-outline" size={36} color="#000" />

          <View style={{ marginLeft: 10 }}>
            <Text style={{ color: "#333", fontSize: 14 }}>
              {t("home.greeting")}
            </Text>
            <Text style={{ color: "#000", fontSize: 22, fontWeight: "bold" }}>
              {userProfile?.data?.user?.firstname}{" "}
              {userProfile?.data?.user?.lastname}
            </Text>
          </View>

          {/* Right actions: Language + Settings */}
          <View
            style={{
              marginLeft: "auto",
              flexDirection: "row",
              alignItems: "center"
            }}
          >
            {/* Language chooser */}
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginRight: 15
              }}
              onPress={() => {
                setLanguageModalVisible(true);
                animateModalIn();
              }}
            >
              <Image
                source={selectedLanguage === "en" ? FLAGS.en : FLAGS.fr}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  marginRight: 6
                }}
              />
              <Ionicons name="chevron-down" size={20} color="#000" />
            </TouchableOpacity>

            {/* Settings */}
            <TouchableOpacity onPress={() => navigation.openDrawer()}>
              <Ionicons name="menu-outline" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        
        <View
          style={{
            height: 1,
            backgroundColor: "#121111",
            marginHorizontal: 20,
            marginBottom: 20
          }}
        />

        {/* ACCOUNT CARD */}
        <View
          style={{
            position: "absolute",
            bottom: -50,
            left: 20,
            right: 20,
            backgroundColor: "#ffff",
            borderRadius: 12,
            padding: 16,
            elevation: 4,
            zIndex: 10
          }}
        >
          <TouchableOpacity 
            style={{ position: "absolute", top: 10, right: 10 }}
             onPress={() => navigation.navigate("Settings")}
          >
            <Ionicons name="settings-outline" size={24} color="#16a34a" />
          </TouchableOpacity>

          <Text style={{ color: "#0e0c0c", marginBottom: 5, fontWeight: "bold", fontSize: 18 }}>
            {t("home.currentAccount") || "Compte Sendo"}
          </Text>
          {/* userProfile?.data?.wallet?.matricule */}
          <Text style={{ color: "#666", marginBottom: 5 }}>
           {userProfile?.data?.user?.wallet?.matricule} 
          </Text>

         <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between", // 👈 key line
              marginTop: 25
            }}
          >
            {/* Balance */}
            <Text style={{ fontSize: 20, fontWeight: "bold" }}>
              {isBalanceLoading ? (
                <Loader size="small" color="#16a34a" />
              ) : showBalance ? (
                userProfile?.data?.user?.country === "Canada" ? (
                  `${balanceData?.data?.currency ?? ""} ${(balanceData?.data?.balance ?? 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                ) : (
                  `${(balanceData?.data?.balance ?? 0).toLocaleString(undefined, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })} ${balanceData?.data?.currency ?? ""}`
                )
              ) : (
                "****"
              )}
            </Text>

            {/* Eye button */}
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
                        setTimeout(() => setShowBalance(false), 20000);
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
                size={24}
                color="#16a34a"
              />
            </TouchableOpacity>
          </View>


        </View>
      </View>

      {/* CONTENT */}
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 70
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* QUICK ACTIONS */}
         <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: 10 
          }}>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>
              {t("home.quickTransactions") || "Transaction Rapide"}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate("ServiceScreen")}>
              <Text style={{ color: '#16a34a', fontWeight: '600' }}>
                {t("home.seeAll") || "Voir tout"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 2x2 Grid for main actions */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
              marginBottom: 8
            }}
          >
          </View>

          {/* Country-specific services in smaller cards */}
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between"
            }}
          >
            {(
              userProfile?.data?.user?.country === "Canada"
                ? [
                    { icon: "arrow-up-circle-outline", label: t("home.transfer"), route: "SelectMethod" },
                    { icon: "wallet-outline", label: t("home.recharge"), route: "MethodType" },
                    { icon: "shield-checkmark-outline", label: t("home.canadaKyc"), route: "VerifyIdentity" },
                    { icon: "lock-closed-outline", label: t("home.fund"), route: "BlockedFundsList" },
                    { icon: "chatbubbles-outline", label: t("drawer.request1"), route: "NiuRequest" },
                    { icon: "cash-outline", label: t("home.withdrawal"), route: "InteracWithdrawal" },
                  ]
                : [
                  { icon: "arrow-up-circle-outline", label: t("home.transfer"), route: "SelectMethod" },
                    { icon: "wallet-outline", label: t("home.recharge"), route: "MethodType" },
                    ...(userProfile?.data?.user?.country === "Cameroon"
                      ? [{ icon: "card-outline", label: t("home.virtualCard"), route: "OnboardingCard" }]
                      : []),
                    { icon: "people-outline", label: t("home.friendsShare"), route: "WelcomeShare" },
                    { icon: "cash-outline", label: t("home.fundRequest"), route: "WelcomeDemand" },
                    { icon: "layers-outline", label: t("home.etontine"), route: hasAcceptedTerms ? "TontineList" : "TermsAndConditions" },
                  ]
            ).map((item, index) => (
              <TouchableOpacity
                key={index}
                style={{
                  backgroundColor: "#F2F2F2",
                  width: "48%",
                  paddingVertical: 12,
                  paddingHorizontal: 10,
                  borderRadius: 8,
                  marginBottom: 8,
                  flexDirection: "row",          // 👈 inline layout
                  alignItems: "center",          // 👈 vertical centering
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 2
                }}
                onPress={() => navigation.navigate(item.route)}
              >
                <Ionicons
                  name={item.icon}
                  size={20}
                  color="#2F80ED"
                  style={{ marginRight: 8 }}
                />

                <Text
                  style={{
                    fontSize: 13,
                    color: "#000",
                    flexShrink: 1          
                  }}
                  numberOfLines={2}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>

            ))}
          </View>

          {/* PUB SECTION */}
          {showPubs && (
            <View
              style={{
                backgroundColor: "#F2F2F2",
                borderRadius: 12,
                padding: 15,
                marginVertical: 15,
                alignItems: "center",
                justifyContent: "center",
                elevation: 3,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                position: 'relative'
              }}
            >
              {/* Bouton de fermeture X */}
              <TouchableOpacity
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  zIndex: 10,
                  backgroundColor: 'rgba(0,0,0,0.05)',
                  borderRadius: 15,
                  width: 30,
                  height: 30,
                  justifyContent: 'center',
                  alignItems: 'center'
                }}
                onPress={() => setShowPubs(false)}
              >
                <Ionicons name="close" size={20} color="#666" />
              </TouchableOpacity>

              {isLoadingPubs ? (
                <Loader size="small" />
              ) : pubs?.items?.filter(pub => pub.isActive).length > 0 ? (
                <View style={{ width: '100%' }}>
                  <FlatList
                    ref={flatListRef}
                    data={pubs.items.filter(pub => pub.isActive)}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={{ paddingHorizontal: 0 }}
                    decelerationRate="fast"
                    snapToAlignment="start"
                    getItemLayout={(_, index) => ({
                      length: ITEM_WIDTH,
                      offset: index * ITEM_WIDTH,
                      index,
                    })}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        onPress={() => item.link && Linking.openURL(item.link)}
                        style={{
                          width: width - 70,
                          height: 140,
                          borderRadius: 8,
                          overflow: "hidden",
                          marginRight: 10,
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
                  <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 10 }}>
                    {pubs.items.filter(pub => pub.isActive).map((_, index) => (
                      <View
                        key={index}
                        style={{
                          height: 8,
                          width: 8,
                          borderRadius: 4,
                          backgroundColor: index === currentIndex ? '#16a34a' : '#ccc',
                          marginHorizontal: 4
                        }}
                      />
                    ))}
                  </View>
                </View>
              ) : (
                <>
                  <Text style={{ fontSize: 14, fontWeight: "bold", marginBottom: 10 }}>
                    {t("home.noPubs") || "Aucune publicité"}
                  </Text>
                  <Ionicons name="megaphone-outline" size={32} color="#9CA3AF" />
                </>
              )}
            </View>
          )}

         
          {/* ACTIVITIES */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 15 }}>
            <Text style={{ fontSize: 16, fontWeight: "bold" }}>
              {t("home.recentTransactions")}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate("TransferTab")}>
              <Text style={{ color: '#16a34a', fontWeight: '600' }}>
                {t("home.seeAll")}
              </Text>
            </TouchableOpacity>
          </View>

         {isLoadingHistory ? (
            <View style={{ alignItems: 'center', padding: 20 }}>
              <Loader />
            </View>
          ) : history?.data?.transactions?.items?.length === 0 ? (
            <Text style={{ color: '#666', textAlign: 'center', padding: 20 }}>
              {t("home.noTransactions")}
            </Text>
          ) : (
            history?.data?.transactions?.items?.slice(0, 3).map((item, index) => {
              const statusColorClass = getStatusColor(item.status); // Pour usage Tailwind si besoin
              const statusColorValue = getStatusColorValue(item.status); // Pour usage inline
              const formattedDate = new Date(item.createdAt).toLocaleString("fr-FR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
              
              const iconSource = getMethodIcon(item);
              const display = formatTransactionDisplay(item);

              return (
                <TouchableOpacity
                  key={index}
                  style={{
                    backgroundColor: "#F2F2F2",
                    padding: 15,
                    borderRadius: 10,
                    marginBottom: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 2
                  }}
                  onPress={() =>
                    navigation.navigate("Receipt", {
                      transaction: item,
                      user: userProfile?.data?.user,
                    })
                  }
                >
                  <Image
                    source={iconSource}
                    style={{ width: 40, height: 40, marginRight: 12, borderRadius: 20 }}
                    resizeMode="contain"
                  />

                  <View style={{ flex: 1 }}>
                    {/* TOP ROW: Description + Status */}
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: "#000",
                          fontWeight: "600",
                          flex: 1,
                          marginRight: 10,
                        }}
                        numberOfLines={1}
                      >
                        {display.description}
                      </Text>

                      {/* Utilisation de statusColorValue pour la couleur inline */}
                      <Text style={{ fontSize: 12, fontWeight: "600", color: statusColorValue }}>
                        {t(`transactionStatus.${item.status?.toUpperCase()}`)}
                      </Text>
                    </View>

                    {/* BOTTOM ROW: Amount + Date */}
                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginTop: 4,
                      }}
                    >
                      <Text style={{ color: "#000", fontSize: 13 }}>
                        {display.isSpecialCase
                          ? display.formattedAmount ||
                            `${display.amount?.toLocaleString()} ${display.currency || ""}`
                          : `${display.amount?.toLocaleString()} ${display.currency || ""}`}
                      </Text>

                      <Text style={{ color: "#999", fontSize: 11 }}>
                        {formattedDate}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </SafeAreaView>

      {/* KYC MODAL */}
      <Modal
        animationType="fade"
        transparent
        visible={showKycModal && !isUpdateRequired}
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
                  navigation.navigate("VerifyIdentity");
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

      {/* LANGUAGE SELECTION MODAL */}
      <Modal 
        animationType="none"
        transparent={true}
        visible={languageModalVisible}
        onRequestClose={() => {
          animateModalOut();
          setTimeout(() => setLanguageModalVisible(false), 300);
        }}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.modalContainer,
              { transform: [{ translateY: modalSlideAnim }] }
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('choose_language')}</Text>
              <TouchableOpacity 
                onPress={() => {
                  animateModalOut();
                  setTimeout(() => setLanguageModalVisible(false), 300);
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.languageOptions}>
              <TouchableOpacity 
                style={[
                  styles.languageOption,
                  selectedLanguage === 'en' && styles.selectedLanguageOption
                ]}
                onPress={() => changeLanguage("en")}
                activeOpacity={0.7}
              >
                <Image source={FLAGS.en} style={styles.flagImage} />
                <Text style={styles.languageOptionText}>English</Text>
                {selectedLanguage === 'en' && (
                  <Ionicons name="checkmark-circle" size={24} color="#7ddd7d" />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.languageOption,
                  selectedLanguage === 'fr' && styles.selectedLanguageOption
                ]}
                onPress={() => changeLanguage("fr")}
                activeOpacity={0.7}
              >
                <Image source={FLAGS.fr} style={styles.flagImage} />
                <Text style={styles.languageOptionText}>Français</Text>
                {selectedLanguage === 'fr' && (
                  <Ionicons name="checkmark-circle" size={24} color="#7ddd7d" />
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
  },
  loadingText: {
    marginTop: 20,
    color: '#666',
    fontSize: 16,
  },
  
  fullScreenModal: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  updateModalContent: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 30,
  },
  logo: {
    height: 60,
    width: 180,
  },
  updateIconContainer: {
    width: 100,
    height: 100,
    backgroundColor: '#16A34A',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  updateTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  updateMessage: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  versionBadge: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 30,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#16A34A',
  },
  updateButton: {
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    width: '100%',
    marginBottom: 16,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  updateButtonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  buttonIcon: {
    marginRight: 10,
  },
  updateButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  storeInfo: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 20,
  },
  noEscapeText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 10,
  },
  // Language modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    minHeight: 250,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: 5,
  },
  languageOptions: {
    gap: 12,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedLanguageOption: {
    borderColor: '#7ddd7d',
    backgroundColor: '#F0FDF4',
  },
  flagImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 12,
  },
  languageOptionText: {
    fontSize: 16,
    color: '#1F2937',
    flex: 1,
  },
});

export default HomeScreen;