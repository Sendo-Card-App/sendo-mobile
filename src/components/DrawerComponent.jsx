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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
import { useGetUserProfileQuery, useLogoutMutation, useGetProfilePictureQuery } from "../services/Auth/authAPI";
import Loader from "./Loader";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Share } from 'react-native';
import { getData, removeData, storeData } from "../services/storage";
import Toast from "react-native-toast-message";

const DrawerComponent = ({ navigation }) => {
  const navigation2 = useNavigation();
  const { t } = useTranslation();

  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
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
    } = useGetUserProfileQuery(
      undefined, 
    {
      pollingInterval: 1000, // Refetch every 1 second
    }
  );

  const userId = userProfile?.data?.id;
  
    const { data: profilePicture, isLoading: isPictureLoading } = useGetProfilePictureQuery(
      userId, // pass userId here
      { pollingInterval: 1000 }
    );
  
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
  const checkTerms = async () => {
    const value = await AsyncStorage.getItem("hasAcceptedTerms");
    setHasAcceptedTerms(value === "true");
  };
  checkTerms();
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
      await removeData('@passcode');
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
      text1: 'Erreur',
      text2: 'Aucun code de parrainage disponible',
    });
    return;
  }

  const appName = 'Sendo'; 
  const appStoreLink = 'https://apps.apple.com/...';
  const playStoreLink = 'https://play.google.com/...';
  const referralCode = userProfile.data.referralCode;

  const message = `Salut ! Rejoins-moi sur ${appName} en utilisant mon code de parrainage ${referralCode} et nous recevrons tous les deux un bonus !

Télécharge l'application ici :
iOS : ${appStoreLink}
Android : ${playStoreLink}

Utilise mon code lors de ton inscription !`;

  const title = `Rejoins ${appName} avec mon code de parrainage`;

  Share.share({
    message,
    title,
  })
    .then(result => {
      if (result.action === Share.sharedAction) {
        // Partage réussi
      }
    })
    .catch(error => {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.message || 'Échec du partage du code de parrainage',
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
        <AntDesign name="left" size={24} color="white" />
      </TouchableOpacity>
    </View>
  ) : (
    <>
      <View className="flex-row justify-between items-center mt-4">
        <Text className="text-white font-bold text-xl">
        </Text>
        <TouchableOpacity onPress={() => navigation.closeDrawer()}>
          <AntDesign name="left" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View className="mt-4 bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-100">
        <View className="flex-row items-center justify-between">
          {/* 👤 Avatar */}
         <View className="flex-row items-center">
          {profilePicture?.data?.link ? (
            <Image
              source={{ uri: `${profilePicture.data.link}?t=${userProfile?.data?.updatedAt}` }}
              style={{ width: 50, height: 50, borderRadius: 25, marginRight: 10 }}
            />
          ) : (
            <View
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                marginRight: 10,
                backgroundColor: '#E5E7EB',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Ionicons name="person-circle-outline" size={30} color="#9CA3AF" />
            </View>
          )}

          <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", flexShrink: 1 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#1F2937", // gray-800
                flexShrink: 1,
                flexWrap: "wrap"
              }}
            >
              {userProfile?.data?.firstname} {userProfile?.data?.lastname}
            </Text>

            {userProfile?.data?.kycDocuments?.some(doc => doc.status === "APPROVED") && (
              <Ionicons
                name="checkmark-circle"
                size={18}
                color="#10B981"
                style={{ marginLeft: 6 }}
              />
            )}
          </View>
        </View>
        </View>

        <View className="mt-2">
          <View className="flex-row items-center">
            <Ionicons name="mail-outline" size={14} color="#6B7280" style={{ marginRight: 4 }} />
            <Text className="text-sm text-gray-600">{userProfile?.data?.email}</Text>
          </View>

          <View className="flex-row items-center mt-1">
            <Ionicons name="call-outline" size={14} color="#6B7280" style={{ marginRight: 4 }} />
            <Text className="text-sm text-gray-600">{userProfile?.data?.phone}</Text>
          </View>

          {/*  Matricule */}
          <View className="flex-row items-center mt-1">
            <Ionicons name="card-outline" size={14} color="#6B7280" style={{ marginRight: 4 }} />
            <Text className="text-sm text-gray-600">
             {t('drawer.matricule')} <Text className="font-medium">{userProfile?.data?.wallet?.matricule}</Text>
            </Text>
          </View>
        </View>
      </View>


          </>
        )}
      </View>


      {/* Body */}
      <View className="flex-1 mx-8">
        {/* <View className="border-b border-gray-400 py-3">
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
        </View> */}

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

          {/* <TouchableOpacity
            className="flex-row gap-2 my-2 mb-5"
            onPress={() => navigation2.navigate("History")}
          >
            <Ionicons name="list-outline" size={Platform.OS === "ios" ? 32 : 24} color="gray" />
            <View>
              <Text className="font-bold text-gray-500">{t('drawer.history')}</Text>
              <Text className="text-sm text-gray-500">
               {t('drawer.transactionHistory')}
              </Text>
            </View>
          </TouchableOpacity> */}

          <TouchableOpacity
            className="flex-row gap-2 my-2 mb-5"
            onPress={() => navigation2.navigate("Account")}
          >
            <Ionicons name="person-outline" size={Platform.OS === "ios" ? 32 : 24} color="gray" />
            <View>
              <Text className="font-bold text-gray-500">{t('drawer.account')}</Text>
              <Text className="text-sm text-gray-500">
              {t('drawer.personalInfo')}
              </Text>
            </View>
          </TouchableOpacity>
             
            
            <TouchableOpacity
              className="flex-row gap-2 my-2 mb-5"
               onPress={() => navigation2.navigate("VerifyIdentity")}
              
            >
              <MaterialCommunityIcons
                name="fingerprint"
                size={Platform.OS === "ios" ? 32 : 24}
                color="gray"
              />
              <View>
                <Text className="font-bold text-gray-500">{t('drawer.request')}</Text>
                <Text className="text-sm text-gray-500">{t('drawer.sub')}</Text>
              </View>
            </TouchableOpacity>

                     <TouchableOpacity
                      className="flex-row gap-2 my-2 mb-5"
                      onPress={() => navigation2.navigate("NiuRequest")}
                    >
                       <MaterialCommunityIcons name="file-document-outline" size={Platform.OS === "ios" ? 32 : 24} color="gray" />
                      <View>
                        <Text className="font-bold text-gray-500">{t('drawer.request1')}</Text>
                        <Text className="text-sm text-gray-500">
                          {t('drawer.sub1')}
                        </Text>
                      </View>
                    </TouchableOpacity>
                 <TouchableOpacity
                  className="flex-row gap-2 my-2 items-center mb-5"
                    onPress={() => navigation2.navigate("PaymentSimulator")}
                    >
                       <Ionicons name="calculator-outline" size={Platform.OS === "ios" ? 32 : 24} color="gray" />
                      <View>
                        <Text className="font-bold text-gray-500">{t('drawer.balance')}</Text>
                        <Text className="text-sm text-gray-500">
                        {t('drawer.currencyEstimator')}
                        </Text>
                      </View>
                   </TouchableOpacity>
          {/* <TouchableOpacity
            onPress={() => navigation2.navigate("Payment")}
            className="flex-row gap-2 my-2 mb-5"
          >
            <MaterialCommunityIcons name="bank-outline" size={Platform.OS === "ios" ? 32 : 24} color="gray" />
            <View>
              <Text className="font-bold text-gray-500">{t('drawer.payment')}</Text>
              <Text className="text-sm text-gray-500">
               {t('drawer.paymentMethods')}
              </Text>
            </View>
          </TouchableOpacity> */}
         <TouchableOpacity
            onPress={() => navigation2.navigate("AddFavorite")}
            className="flex-row gap-2 my-2 mb-5 items-center"
          >
            <MaterialCommunityIcons name="heart-outline" size={Platform.OS === "ios" ? 32 : 24} color="gray" />
            <View>
              <Text className="font-bold text-gray-500">{t('drawer.favorite')}</Text>
              <Text className="text-sm text-gray-500">{t('drawer.favorite_desc')}</Text>
            </View>
          </TouchableOpacity>
          {userProfile?.data?.country !== "Canada" && (

          <TouchableOpacity
            className="flex-row gap-2 my-2 mb-5 items-center"
            onPress={() => navigation2.navigate("WelcomeShare")}
          >
            <MaterialCommunityIcons name="account-multiple-outline" size={Platform.OS === "ios" ? 32 : 24} color="gray" />
            <View>
              <Text className="font-bold text-gray-500">{t("drawer.share")}</Text>
              <Text className="text-sm text-gray-500">{t("drawer.share_desc")}</Text>
            </View>
          </TouchableOpacity>
          )}
          {userProfile?.data?.country !== "Canada" && (
          <TouchableOpacity
            className="flex-row gap-2 my-2 mb-5 items-center"
            onPress={() => navigation2.navigate("WelcomeDemand")}
          >
            <MaterialCommunityIcons name="hand-coin" size={Platform.OS === "ios" ? 32 : 24} color="gray" />
            <View>
              <Text className="font-bold text-gray-500">{t("drawer.demand")}</Text>
              <Text className="text-sm text-gray-500">{t("drawer.demand_desc")}</Text>
            </View>
          </TouchableOpacity>
          )}

          {/* <TouchableOpacity
            className="flex-row gap-2 my-2 mb-5"
            onPress={() => navigation2.navigate("SettingsTab")}
          >
            <AntDesign name="setting" size={Platform.OS === "ios" ? 32 : 24} color="gray" />
            <View>
              <Text className="font-bold text-gray-500">{t('drawer.settings')}</Text>
              <Text className="text-sm text-gray-500">{t('drawer.security')}</Text>
            </View>
          </TouchableOpacity> */}

          <TouchableOpacity
            className="flex-row gap-2 my-2 mb-5"
            onPress={() => navigation2.navigate("Support")}
          >
            <Ionicons name="help-circle-outline" size={Platform.OS === "ios" ? 32 : 24} color="gray" />
            <View>
              <Text className="font-bold text-gray-500">{t('drawer.support')}</Text>
              <Text className="text-sm text-gray-500">
               {t('drawer.support2')}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row gap-2 my-2 mb-5"
            onPress={() => navigation2.navigate("AboutUs")}
          >
            <Ionicons name="information-circle-outline" size={Platform.OS === "ios" ? 32 : 24} color="gray" />
            <View>
              <Text className="font-bold text-gray-500">{t('drawer.about_us')}</Text>
              <Text className="text-sm text-gray-500 pr-8">
              {t('drawer.legal')}
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