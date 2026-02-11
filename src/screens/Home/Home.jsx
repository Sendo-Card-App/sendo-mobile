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
  AppState
} from "react-native";
import { Ionicons, AntDesign } from "@expo/vector-icons";
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
import NotificationBell from '../../components/NotificationBell';

const TopLogo = require("../../images/TopLogo.png");
import ButtomLogo from "../../images/ButtomLogo.png";

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;
const scale = (size) => (width / 375) * size;
const ITEM_WIDTH = width - 50;

const HomeScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [showBalance, setShowBalance] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(null);
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [createToken] = useCreateTokenMutation();
  const [showKycModal, setShowKycModal] = useState(false);
  const [showReferralSuccessModal, setShowReferralSuccessModal] = useState(false);
  const [hasShownReferralSuccess, setHasShownReferralSuccess] = useState(false);
  
  // Version check states
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  const [storeUrl, setStoreUrl] = useState('');
  const [currentVersion, setCurrentVersion] = useState('');
  const [isCheckingVersion, setIsCheckingVersion] = useState(true);
  const [versionCheckCompleted, setVersionCheckCompleted] = useState(false);
  const [updateRequired, setUpdateRequired] = useState(false); // NEW: Track if update is required

  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  const scaleAnim = useState(new Animated.Value(0.9))[0];
  const balancePulseAnim = useState(new Animated.Value(1))[0];

  // Fetch config data
  const { data: configData } = useGetConfigQuery();

  // Fetch user profile
  const {
    data: userProfile,
    isLoading: isProfileLoading,
    refetch: refetchProfile,
  } = useGetUserProfileQuery();
  
  const userId = userProfile?.data?.user?.id;
  const referralCode = userProfile?.data?.referralCode;
  const isReferralCodeUsed = referralCode?.isUsed;

  const { data: history, isLoading: isLoadingHistory, refetch } = useGetTransactionHistoryQuery(
    { 
      userId,
    },
    { 
      skip: !userId,
      pollingInterval: 1000,
    }
  );

  const { data: pubs, isLoading: isLoadingPubs } = useGetPubsQuery();

  // Fetch balance
  const {
    data: balanceData,
    isLoading: isBalanceLoading,
    refetch: refetchBalance,
  } = useGetBalanceQuery(userId, { 
    skip: !userId,
    pollingInterval: 1000,
  });

  const isLoading = isProfileLoading || isBalanceLoading;
  const { data: notificationsResponse } = useGetNotificationsQuery({ userId });

  // Extract notifications array safely
  const notifications = notificationsResponse?.data?.items || [];

  // Count unread notifications where `readed` is false
  const unreadCount = notifications.filter(notification => !notification.readed).length;

  // Function to compare version numbers
  const compareVersions = (v1, v2) => {
    // Split version strings into arrays of numbers
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    
    // Compare each part
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      
      if (p1 < p2) return -1; // v1 is less than v2
      if (p1 > p2) return 1;  // v1 is greater than v2
    }
    
    return 0; // versions are equal
  };

  // Function to get stored version from AsyncStorage
  const getStoredVersion = async () => {
    try {
      const storedVersion = await AsyncStorage.getItem('appVersion');
      return storedVersion;
    } catch (error) {
      console.error('Error getting stored version:', error);
      return null;
    }
  };

  // Function to check version and show update modal if needed
  const checkAppVersion = useCallback(async () => {
    try {
      if (!configData) {
        console.log('Waiting for config data...');
        return;
      }

      console.log('Checking version from config...');
      
      // Get required versions from config
      const requiredAndroidVersion = configData?.data?.find(item => item.name === 'SENDO_VERSION_APP_ANDROID')?.value;
      const requiredIosVersion = configData?.data?.find(item => item.name === 'SENDO_VERSION_APP_IOS')?.value;
      
      console.log('Required Android:', requiredAndroidVersion);
      console.log('Required iOS:', requiredIosVersion);
      
      // Get platform
      const isAndroid = Platform.OS === 'android';
      const isIos = Platform.OS === 'ios';
      
      // Determine which required version to use based on platform
      const requiredVersion = isAndroid ? requiredAndroidVersion : 
                            isIos ? requiredIosVersion : null;
      
      if (!requiredVersion) {
        console.log('No version requirement found in config for this platform');
        setVersionCheckCompleted(true);
        setIsCheckingVersion(false);
        return;
      }
      
      // Get stored version
      const storedVersion = await getStoredVersion();
      console.log('Stored version:', storedVersion);
      
      if (!storedVersion) {
        // First time: store the required version
        console.log('First time: storing required version:', requiredVersion);
        await AsyncStorage.setItem('appVersion', requiredVersion);
        setCurrentVersion(requiredVersion);
        setShowUpdateModal(false);
        setUpdateRequired(false);
      } else {
        // Compare stored version with required version
        setCurrentVersion(storedVersion);
        const comparison = compareVersions(storedVersion, requiredVersion);
        
        if (comparison < 0) {
          // Stored version is less than required version - show update modal
          console.log(`Version update needed: Stored=${storedVersion}, Required=${requiredVersion}`);
          const message = `Une nouvelle version (${requiredVersion}) est disponible. Veuillez mettre à jour pour continuer à utiliser Sendo.`;
          const url = isAndroid 
            ? 'https://play.google.com/store/apps/details?id=com.sfe.ca'
            : 'https://apps.apple.com/tr/app/sendo/id6753186956';
          
          setUpdateMessage(message);
          setStoreUrl(url);
          setShowUpdateModal(true);
          setUpdateRequired(true); // Set update as required
        } else if (comparison === 0) {
          // Versions are equal
          console.log('App version is up to date:', storedVersion);
          setShowUpdateModal(false);
          setUpdateRequired(false);
        } else {
          // Stored version is greater than required version (shouldn't normally happen)
          console.log('Stored version is newer than required:', storedVersion, requiredVersion);
          setShowUpdateModal(false);
          setUpdateRequired(false);
        }
      }
      
      setVersionCheckCompleted(true);
      setIsCheckingVersion(false);
      
    } catch (error) {
      console.error('Error checking app version:', error);
      setVersionCheckCompleted(true);
      setIsCheckingVersion(false);
      setUpdateRequired(false);
    }
  }, [configData]);

  // Check version when config data loads
  useEffect(() => {
    if (configData && !versionCheckCompleted) {
      checkAppVersion();
    }
  }, [configData, versionCheckCompleted, checkAppVersion]);

  // Function to update stored version after successful update
  const updateStoredVersion = async () => {
    try {
      const requiredAndroidVersion = configData?.data?.find(item => item.name === 'SENDO_VERSION_APP_ANDROID')?.value;
      const requiredIosVersion = configData?.data?.find(item => item.name === 'SENDO_VERSION_APP_IOS')?.value;
      
      const requiredVersion = Platform.OS === 'android' ? requiredAndroidVersion : 
                             Platform.OS === 'ios' ? requiredIosVersion : null;
      
      if (requiredVersion) {
        await AsyncStorage.setItem('appVersion', requiredVersion);
        setCurrentVersion(requiredVersion);
        console.log('Updated stored version to:', requiredVersion);
        // After updating, the app should work normally
        setUpdateRequired(false);
        setShowUpdateModal(false);
      }
    } catch (error) {
      console.error('Error updating stored version:', error);
    }
  };

  // Prevent navigation when update modal is shown
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (showUpdateModal || updateRequired) {
        // Prevent navigation when update modal is shown or update is required
        e.preventDefault();
        Alert.alert(
          'Mise à jour requise',
          'Vous devez mettre à jour l\'application avant de pouvoir continuer.',
          [{ text: 'OK' }]
        );
      }
    });

    return unsubscribe;
  }, [navigation, showUpdateModal, updateRequired]);

  // Prevent back button when update modal is shown
  useEffect(() => {
    const backAction = () => {
      if (showUpdateModal || updateRequired) {
        // Prevent going back when update modal is shown or update is required
        Alert.alert(
          'Mise à jour requise',
          'Vous devez mettre à jour l\'application avant de pouvoir continuer.',
          [{ text: 'OK' }]
        );
        return true;
      }

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
  }, [navigation, showUpdateModal, updateRequired]);

  // Function to handle update button press
  const handleUpdatePress = async () => {
    if (storeUrl) {
      try {
        // Try to open the store URL
        const canOpen = await Linking.canOpenURL(storeUrl);
        if (canOpen) {
          await Linking.openURL(storeUrl);
          // Update stored version after user goes to store
          updateStoredVersion();
        } else {
          throw new Error('Cannot open store URL');
        }
      } catch (err) {
        console.error('Failed to open store URL:', err);
        Alert.alert('Erreur', 'Impossible d\'ouvrir l\'App Store. Veuillez mettre à jour manuellement.');
      }
    }
  };

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
    // Only start animations if update is not required
    if (!updateRequired) {
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
    }
  }, [updateRequired]);

  // Check KYC status and show modal if needed
  useEffect(() => {
    // Only check KYC if update is not required
    if (updateRequired) return;

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

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, [userProfile, updateRequired]);

  // Refetch profile and balance when screen is focused
  useFocusEffect(
    useCallback(() => {
      // Only refetch if update is not required
      if (updateRequired) return;
      
      refetchProfile();
      if (userId) {
        refetchBalance();
        refetch(); 
      }
    }, [userId, updateRequired])
  );

  useEffect(() => {
    // Only check terms if update is not required
    if (updateRequired) return;

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
  }, [updateRequired]);
      
  useEffect(() => {
    // Only handle pubs if update is not required
    if (updateRequired) return;

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
  }, [currentIndex, pubs, updateRequired]);
   
  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED': return 'text-green-600';
      case 'FAILED': return 'text-red-600';
      case 'PENDING': return 'text-yellow-600';
      case 'BLOCKED': return 'text-orange-600';
      default: return 'text-gray-600';
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

  // Update Modal Component - FIXED: Remove onRequestClose handler
  const UpdateModal = () => (
    <Modal
      animationType="fade"
      transparent
      visible={showUpdateModal || updateRequired}
      onRequestClose={() => {}} // PREVENT CLOSING - keep empty function
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Update Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="cloud-download-outline" size={60} color="#16A34A" />
          </View>
          
          {/* Title */}
          <Text style={styles.title}>
            Mise à jour requise
          </Text>
          
          {/* Message */}
          <Text style={styles.message}>
            {updateMessage || "Une nouvelle version est disponible. Veuillez mettre à jour pour continuer à utiliser Sendo."}
          </Text>
          
          {/* Current Version Info */}
          <View style={styles.versionInfo}>
            <Text style={styles.versionText}>
              Version actuelle: {currentVersion}
            </Text>
          </View>
          
          {/* Update Button */}
          <Pressable
            style={styles.updateButton}
            onPress={handleUpdatePress}
          >
            {Platform.OS === 'android' && (
              <Ionicons name="logo-google-playstore" size={24} color="white" style={{marginRight: 10}} />
            )}
            {Platform.OS === 'ios' && (
              <Ionicons name="logo-apple" size={24} color="white" style={{marginRight: 10}} />
            )}
            <Text style={styles.buttonText}>
              Mettre à jour maintenant
            </Text>
          </Pressable>
          
          {/* Platform-specific info */}
          <Text style={styles.platformInfo}>
            {Platform.OS === 'android' 
              ? 'Vous serez redirigé vers Google Play Store'
              : 'Vous serez redirigé vers App Store'}
          </Text>
          
          {/* Note: This modal cannot be dismissed without updating */}
          <Text style={styles.noteText}>
            Vous devez mettre à jour l'application pour continuer à utiliser Sendo
          </Text>
        </View>
      </View>
    </Modal>
  );

  // Show loader while checking version
  if (isCheckingVersion && !versionCheckCompleted) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar backgroundColor="#F2F2F2" barStyle="dark-content" />
        <Loader />
        <Text style={styles.loadingText}>Vérification de la version...</Text>
      </View>
    );
  }

  // Don't render the main content if update is required - show only the modal
  if (updateRequired) {
    return (
      <View style={styles.fullScreenContainer}>
        <StatusBar 
          backgroundColor="transparent"
          barStyle="dark-content"
          translucent={false}
        />
        <UpdateModal />
      </View>
    );
  }

  // Render main content only if update is not required
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
                   { label: t("home.fund"), icon: "lock-closed-outline", route: "BlockedFundsList", color: "#8B5CF6", bgColor: "#F5F3FF" },
                  { label: t("drawer.request1"), icon: "chatbubbles-outline", route: "NiuRequest", color: "#cc5de8", bgColor: "#f8f0fc" },
                  { label: t("home.withdrawal"), icon: "cash-outline", route: "InteracWithdrawal", color: "#ff922b", bgColor: "#fff9f0" },
                 
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
          const typeLabel = getTypeLabel(item.type);
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

// Styles for the update modal
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 30,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 24,
  },
  versionInfo: {
    backgroundColor: '#0dbb5b',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 20,
  },
  versionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  updateButton: {
    backgroundColor: '#16A34A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 16,
    width: '100%',
    marginBottom: 15,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  platformInfo: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 10,
  },
  noteText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 5,
  },
});

export default HomeScreen;