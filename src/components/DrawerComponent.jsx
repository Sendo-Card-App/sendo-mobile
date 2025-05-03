import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
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
import { useTranslation } from "react-i18next";
import { useGetUserProfileQuery, useLogoutMutation } from "../services/Auth/authAPI";
import Loader from "./Loader";
import { getData, removeData } from "../services/storage";
import Toast from "react-native-toast-message";

const DrawerComponent = ({ navigation }) => {
  const navigation2 = useNavigation();
  const { t } = useTranslation();

  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [authData, setAuthData] = useState(null);

  const {
    data: userProfile,
    isLoading: isProfileLoading,
    isFetching: isProfileFetching,
    refetch: refetchProfile,
  } = useGetUserProfileQuery();

  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  // Load stored auth data once on mount
  useEffect(() => {
    (async () => {
      const data = await getData('@authData');
      setAuthData(data);
      setIsAuthenticated(!!data);
      setAuthChecked(true);
    })();
  }, []);

  // Pull-to-refresh header
  const handleRefresh = useCallback(() => {
    setAuthChecked(false);
    (async () => {
      const data = await getData('@authData');
      setAuthData(data);
      setIsAuthenticated(!!data);
      setAuthChecked(true);
      refetchProfile();
    })();
  }, [refetchProfile]);

  const handleLogout = async () => {
    try {
      const stored = authData || (await getData('@authData'));
      if (!stored?.deviceId) throw new Error('Device ID not found');
      const deviceId = stored.deviceId;
  
      // Appelle l'API logout
      const response = await logout({ deviceId }).unwrap();
  
      // Succès API (statut 204 ou pas d’erreur)
      if (response?.status === 204 || response) {
        await removeData('@authData');
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Logged out successfully',
        });
      } else {
        throw new Error('Logout failed');
      }
    } catch (err) {
      console.warn('Logout error:', err);
  
      // Forcer une déconnexion locale si token expiré ou API injoignable
      await removeData('@authData');
      Toast.show({
        type: 'error',
        text1: 'Déconnexion',
        text2: err?.data?.data?.message || err.message || 'Déconnecté localement',
      });
    } finally {
      // Redirige vers login
      navigation2.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      });
    }
  };
  


  return (
    <SafeAreaView className="flex-1">
      {/* Header */}
      <View
        style={{ backgroundColor: '#7ddd7d', padding: 10 }}
        refreshControl={
          <RefreshControl
            refreshing={isProfileFetching}
            onRefresh={handleRefresh}
          />
        }
      >
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
      </View>

      {/* Body */}
      <View className="flex-1 mx-8">
        <View className="border-b border-gray-400 py-3">
          <Text className="font-bold text-gray-600">{t('drawer.bonus')}</Text>
          <Text className="text-xs text-gray-500 my-2">
            {t('drawer.bonus_description')}
          </Text>
          <Text className="text-sm text-gray-500">{t('drawer.bonus_code')}  {userProfile?.data?.firstname} {userProfile?.data?.lastname}</Text>
          <View className="flex-row items-center mt-2">
            <EvilIcons name="share-google" size={24} color="#7ddd7d" />
            <Text className="text-[#7ddd7d] font-bold">
              {t('drawer.invite_friends')}
            </Text>
          </View>
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
            onPress={() => navigation2.navigate("MonSolde")}
          >
            <AntDesign name="wallet" size={Platform.OS === "ios" ? 32 : 24} color="gray" />
            <View>
              <Text className="font-bold text-gray-500">{t('drawer.balance')}</Text>
            </View>
          </TouchableOpacity>

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
            className="flex-row gap-2 my-2 mb-5"
            onPress={() => navigation2.navigate("SettingsTab")}
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
