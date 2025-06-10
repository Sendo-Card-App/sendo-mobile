import React, { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  Image,
  RefreshControl,
  SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  AntDesign,
  EvilIcons,
  Feather,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import PinVerificationModal from './PinVerificationModal'; // Import your modal component
import { useSelector, useDispatch } from 'react-redux';
import { incrementAttempt, resetAttempts, lockPasscode } from '../features/Auth/passcodeSlice';
import { useTranslation } from "react-i18next";
import { useGetUserProfileQuery, useLogoutMutation } from "../services/Auth/authAPI";
import Loader from "./Loader";
import shareImage from "../Images/icones/shareImage.png"; // Adjust the path as necessary
import { Share } from 'react-native';
import { getData, removeData, storeData } from "../services/storage";
import Toast from "react-native-toast-message";

const DrawerComponent = ({ navigation }) => {
  const navigation2 = useNavigation();
  const { t } = useTranslation();

  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [stored,setStored] = useState('');
  const [authData, setAuthData] = useState(null);
  
  const [showPinModal, setShowPinModal] = useState(false);
  const dispatch = useDispatch();
  const { passcode, attempts, lockedUntil } = useSelector(state => state.passcode);
  const isLocked = lockedUntil && new Date(lockedUntil) > new Date()

  const {
    data: userProfile,
    isLoading: isProfileFetching,
    isLoading: isProfileLoading,
    refetch: refetchProfile,
  } = useGetUserProfileQuery();

  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  const isLoading = isProfileLoading || isProfileFetching;
   
   useFocusEffect(
      useCallback(() => {
        refetchProfile(); // force une requête au backend
      }, [])
    );
  // Load stored auth data once on mount
  useEffect(() => {
    const loadAuthData = async () => {
      const data = await getData('@authData');
      setAuthData(data);
      setIsAuthenticated(!!data);
      setAuthChecked(true);
    };
    loadAuthData();
  }, []);

  useEffect(() => {
    const backupAuthData = async () => {
      if (!authData) return; // Don't backup if no data
      
      try {
       
        await storeData('Stored', authData); // Now using the imported storeData function
       
      } catch (error) {
       
      }
    };
  
    backupAuthData();
  }, [authData]);

  
  const handleBalancePress = () => {
    if (isLocked) {
      Toast.show({
        type: 'error',
        text1: 'Account Locked',
        text2: 'Too many failed attempts. Please try again later.',
      });
      return;
    }
    setShowPinModal(true);
  };
  const handlePinVerify = (enteredPin) => {
    if (enteredPin === passcode) {
      // Correct PIN
      dispatch(resetAttempts());
      setShowPinModal(false);
      navigation2.navigate("MonSolde");
    } else {
      // Incorrect PIN
      dispatch(incrementAttempt());
      
      if (attempts + 1 >= 3) {
        dispatch(lockPasscode());
        setShowPinModal(false);
        Toast.show({
          type: 'error',
          text1: 'Account Locked',
          text2: 'Too many failed attempts. Please try again later.',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Incorrect PIN',
          text2: `You have ${3 - (attempts + 1)} attempts remaining`,
        });
      }
    }
  };

  const handleLogout = async () => {
    try {
      const currentAuthData = authData || (await getData('@authData'));
  
      if (!currentAuthData?.deviceId) {
        // Check backup storage as last resort
        const backupData = await getData('Stored');
    
        if (!backupData?.deviceId) {
          throw new Error('Device ID not found in any storage');
        }
      }
  
      const deviceId = currentAuthData.deviceId;
  
      // Clear all auth data
      await removeData('@authData');
      await removeData('Stored'); 
      setAuthData(null);
  
      // Call logout mutation
      await logout({ deviceId }).unwrap();
  
      // Show success message
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Logged out successfully',
      });
  
      // Close the drawer before navigating
      navigation.closeDrawer();
  
      // Reset navigation stack and navigate to Auth
      navigation2.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      });
  
    } catch (err) {
      console.error('Logout error:', err);
      
      let errorMessage = 'Logged out locally (server unavailable)';
      if (err.message) {
        errorMessage = err.message;
      } else if (err.data?.message) {
        errorMessage = err.data.message;
      }
  
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
      });
  
      // Still close drawer and navigate to auth screen even if server logout failed
      navigation.closeDrawer();
      navigation2.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      });
    }
  };

  if ( isProfileLoading || isLoggingOut) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <Loader />
      </SafeAreaView>
    );
  }
  const shareReferralCode = () => {
    if (!userProfile?.data?.referralCode) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'No referral code available',
      });
      return;
    }
  
    // Customize these values according to your app
    const appName = t('Sendo'); 
    const appStoreLink = 'https://apps.apple.com/...'; 
    const playStoreLink = 'https://play.google.com/...'; 
    
    const message = `Hey! Join me on ${appName} using my referral code ${userProfile.data.referralCode} and we both get a bonus!
  
  Download the app here:
  iOS: ${appStoreLink}
  Android: ${playStoreLink}
  
  Use my code when signing up!`;
  
    Share.share({
      message: message,
      title: `Join ${appName} with my referral code`,
    })
    .then(result => {
      if (result.action === Share.sharedAction) {
        // Track successful shares if needed
        //console.log('Shared successfully');
      }
    })
    .catch(error => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to share referral code',
      });
    });
  };
  

  return (
    <SafeAreaView className="flex-1">
      {/* Header */}
     <View style={{ 
  backgroundColor: '#7ddd7d', 
  padding: 20, 
  borderBottomLeftRadius: 30, 
  borderBottomRightRadius: 30 
}}>
  {isLoading ? (
    <View className="flex-row justify-between items-center py-4">
      <Loader/>
      <TouchableOpacity onPress={() => navigation.closeDrawer()}>
        <AntDesign name="arrowleft" size={24} color="white" />
      </TouchableOpacity>
    </View>
  ) : (
    <>
      <View className="flex-row justify-between items-center mt-10">
        <Text className="text-white font-bold text-xl">
          {userProfile?.data?.firstname} {userProfile?.data?.lastname}
        </Text>
        <TouchableOpacity onPress={() => navigation.closeDrawer()}>
          <AntDesign name="arrowleft" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View className="mt-2 bg-gray-800 px-4 py-3 rounded-md flex-row justify-between items-center">
        <View>
          <Text className="text-white">{userProfile?.data?.email}</Text>
          <Text className="text-white">{userProfile?.data?.phone}</Text>
        </View>
        {userProfile?.data?.isVerifiedEmail && (
          <Text className="text-green-600 bg-green-100 px-2 py-1 rounded-full">
            ✅ Verified
          </Text>
        )}
      </View>
    </>
  )}
</View>


      {/* Body */}
      <View className="flex-1 mx-8">
        <View className="border-b border-gray-400 py-3">
          <Text className="font-bold text-gray-600">{t('drawer.bonus')}</Text>
          <Text className="text-xs text-gray-500 my-2">
            {t('drawer.bonus_description')}
          </Text>
          <Text className="text-sm text-gray-500">{t('drawer.bonus_code')} {userProfile?.data?.referralCode}</Text>
          <TouchableOpacity onPress={shareReferralCode}>
          <View className="flex-row items-center mt-2">
            <EvilIcons name="share-google" size={24} color="#7ddd7d" />
            <Text className="text-[#7ddd7d] font-bold">
              {t('drawer.invite_friends')}
            </Text>
          </View>
          </TouchableOpacity>
        </View>

        <ScrollView
          className="py-4"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isProfileFetching}
              onRefresh={refetchProfile}
            />
          }
        >
          <TouchableOpacity
        className="flex-row gap-2 my-2 items-center mb-5"
        onPress={handleBalancePress}
      >
        <AntDesign name="wallet" size={Platform.OS === "ios" ? 32 : 24} color="gray" />
        <View>
          <Text className="font-bold text-gray-500">{t('drawer.balance')}</Text>
        </View>
      </TouchableOpacity>

      {/* Add the PinVerificationModal */}
      <PinVerificationModal
        visible={showPinModal}
        onClose={() => setShowPinModal(false)}
        onVerify={handlePinVerify}
        title=" Entrez votre code PIN"
        subtitle="Veuillez entrer votre code PIN à 4 chiffres pour consulter votre solde"
      />

          <TouchableOpacity
            className="flex-row gap-2 my-2 mb-5"
            onPress={() => navigation2.navigate("History")}
          >
            <Ionicons name="document-text-outline" size={Platform.OS === "ios" ? 32 : 24} color="gray" />
            <View>
              <Text className="font-bold text-gray-500">{t('drawer.history')}</Text>
              <Text className="text-sm text-gray-500">
                Listing chronologique de vos transactions
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row gap-2 my-2 mb-5"
            onPress={() => navigation2.navigate("Account")}
          >
            <Feather name="user" size={Platform.OS === "ios" ? 32 : 24} color="gray" />
            <View>
              <Text className="font-bold text-gray-500">{t('drawer.account')}</Text>
              <Text className="text-sm text-gray-500">
                Gérez vos informations personnelles
              </Text>
            </View>
          </TouchableOpacity>
           <TouchableOpacity
              className="flex-row gap-2 my-2 mb-5"
              onPress={() => navigation2.navigate("WelcomeShare")}
            >
              <MaterialCommunityIcons
                name="account-multiple-outline" // ou "chart-pie", "share-variant"
                size={Platform.OS === "ios" ? 32 : 24}
                color="gray"
              />
              <View>
                <Text className="font-bold text-gray-500">{t("drawer.share")}</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
                className="flex-row gap-2 my-2 mb-5"
                onPress={() => navigation2.navigate("WelcomeDemand")}
              >
                <MaterialCommunityIcons
                  name="hand-coin-outline" // ou "cash-send"
                  size={Platform.OS === "ios" ? 32 : 24}
                  color="gray"
                />
                <View>
                  <Text className="font-bold text-gray-500">{t("drawer.demand")}</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row gap-2 my-2 mb-5 items-center"
                onPress={() => navigation2.navigate("TontineList")}
              >
                <Feather
                  name="users" // good symbol for tontines (group savings)
                  size={Platform.OS === "ios" ? 28 : 22}
                  color="gray" // green tone to match the theme
                />
                <View>
                  <Text className="font-bold text-gray-500">{t("drawer.tontine")}</Text>
                  <Text className="text-sm text-gray-500">{t('drawer.h2')}</Text>
                </View>
              </TouchableOpacity>


           <TouchableOpacity
                      className="flex-row gap-2 my-2 mb-5"
                      onPress={() => navigation2.navigate("VerifyIdentity")}
                    >
                      <Feather name="file-text" size={Platform.OS === "ios" ? 32 : 24} color="gray" />
                      <View>
                        <Text className="font-bold text-gray-500">{t('drawer.request')}</Text>
                        <Text className="text-sm text-gray-500">
                         {t('drawer.sub')}
                        </Text>
                      </View>
                    </TouchableOpacity>
                     <TouchableOpacity
                      className="flex-row gap-2 my-2 mb-5"
                      onPress={() => navigation2.navigate("NiuRequest")}
                    >
                      <Feather name="file-text" size={Platform.OS === "ios" ? 32 : 24} color="gray" />
                      <View>
                        <Text className="font-bold text-gray-500">{t('drawer.request1')}</Text>
                        <Text className="text-sm text-gray-500">
                          {t('drawer.sub1')}
                        </Text>
                      </View>
                    </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation2.navigate("Payment")}
            className="flex-row gap-2 my-2 mb-5"
          >
            <MaterialCommunityIcons name="bank-outline" size={Platform.OS === "ios" ? 32 : 24} color="gray" />
            <View>
              <Text className="font-bold text-gray-500">{t('drawer.payment')}</Text>
              <Text className="text-sm text-gray-500">
                Gérez vos méthodes de paiement
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation2.navigate("AddFavorite")}
            className="flex-row gap-2 my-2 mb-5"
          >
            <MaterialCommunityIcons name="heart" size={Platform.OS === "ios" ? 32 : 24} color="gray" />
            <View>
              <Text className="font-bold text-gray-500">{t('drawer.favorite')}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row gap-2 my-2 mb-5"
            onPress={() => navigation2.navigate("Settings")}
          >
            <AntDesign name="setting" size={Platform.OS === "ios" ? 32 : 24} color="gray" />
            <View>
              <Text className="font-bold text-gray-500">{t('drawer.settings')}</Text>
              <Text className="text-sm text-gray-500">Options & securite</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row gap-2 my-2 mb-5"
            onPress={() => navigation2.navigate("Support")}
          >
            <EvilIcons name="question" size={Platform.OS === "ios" ? 32 : 24} color="gray" />
            <View>
              <Text className="font-bold text-gray-500">{t('drawer.support')}</Text>
              <Text className="text-sm text-gray-500">
                Service client, aide et contacts
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row gap-2 my-2 mb-5"
            onPress={() => navigation2.navigate("AboutUs")}
          >
            <EvilIcons name="exclamation" size={Platform.OS === "ios" ? 32 : 24} color="gray" />
            <View>
              <Text className="font-bold text-gray-500">{t('drawer.about_us')}</Text>
              <Text className="text-sm text-gray-500 pr-8">
                Mentions légales et conditions d'utilisation
              </Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Logout */}
      <View className="mx-8 border-t border-gray-400 pt-4 items-center">
        <TouchableOpacity
          onPress={handleLogout}
          className="flex-row gap-2 items-center"
          style={{ justifyContent: 'center' }}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? (
            <Loader small />
          ) : (
            <>
              <AntDesign name="logout" size={24} color="gray" />
              <Text className="font-bold text-gray-500">{t('drawer.logout')}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <Text
        className="text-center text-gray-400 text-sm font-bold mt-2"
        style={{ paddingBottom: Platform.OS === "ios" ? 32 : 20 }}
      >
        {t('drawer.app_version')}
      </Text>
    </SafeAreaView>
  );
};

export default DrawerComponent;