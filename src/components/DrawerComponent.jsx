import { 
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import React, { useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AntDesign,
  EvilIcons,
  Feather,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useTranslation } from 'react-i18next';
import { useGetUserProfileQuery, useLogoutMutation } from "../services/Auth/authAPI";
import Loader from "./Loader";
import { removeData } from "../services/storage"; // Import storage utilities
import Toast from 'react-native-toast-message';

const DrawerComponent = ({ navigation }) => {
  const navigation2 = useNavigation();
  const { t } = useTranslation();
   const { 
      data: userProfile, 
      isLoading, 
    } = useGetUserProfileQuery();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  // Handle logout logic
  const handleLogout = async () => {
    try {
      // Get the stored auth data
      const authData = await getData('@authData');
      
      if (!authData?.deviceId) {
        throw new Error('Device ID not found');
      }
      
      // Call logout API with deviceId
      await logout({ deviceId: authData.deviceId }).unwrap();
      
      // Clear authentication data
      await removeData('@authData');
      
      // Reset navigation stack and go to SignIn
      navigation2.reset({
        index: 0,
        routes: [{ name: 'SignIn' }],
      });

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Logged out successfully',
      });
    } catch (err) {
      console.error("Logout error:", err);
      
      // Even if logout API fails, clear local data
      await removeData('@authData');
      
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err?.data?.message || 'Logged out locally (server unavailable)',
      });
      
      navigation2.reset({
        index: 0,
        routes: [{ name: 'Auth' }],
      });
    }
  };

  // Handle session invalidation and redirect to SignIn page
  

  // If loading or error, show a loader
  if (isLoading || isLoggingOut) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <Loader />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1">
      {/* The upper Green section */}
      <View className="bg-[#7ddd7d] pt-10 pl-10 pr-5 pb-5">
        <View className="flex-row justify-between items-center">
          <Text className="text-white font-bold text-xl">
          {userProfile?.data?.firstname || ''} {userProfile?.data?.lastname || ''}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.closeDrawer()}
            className="p-2"
          >
            <AntDesign name="arrowleft" size={24} color="white" />
          </TouchableOpacity>
        </View>
        <Text className="text-white">{userProfile?.data?.email || ''}</Text>
        <Text className="text-white">{userProfile?.data?.phone || ''}</Text>
      </View>
      
      {/* Lower section */}
      <View className="flex-1 mx-8">
        {/* Bonus Section */}
        <View className="border-b border-gray-400 py-3">
          <Text className="font-bold text-gray-600">{t('drawer.bonus')}</Text>
          <Text className="text-xs my-2 text-gray-500">
            {t('drawer.bonus_description')}
          </Text>
          <Text className="text-sm text-gray-500">
            {t('drawer.bonus_code')}
          </Text>
          <View className="flex-row gap-2 items-center mt-2">
            <EvilIcons name="share-google" size={24} color="#7ddd7d" />
            <Text className="text-[#7ddd7d] font-bold">{t('drawer.invite_friends')}</Text>
          </View>
        </View>

        {/* Navigation Items */}
        <ScrollView className="py-4" showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            className="flex-row gap-2 my-2 items-center mb-5"
            onPress={() => navigation2.navigate("MonSolde")}
          >
            <AntDesign
              name="wallet"
              size={Platform.OS === "ios" ? 32 : 24}
              color="gray"
            />
            <View>
              <Text className="font-bold text-gray-500">{t('drawer.balance')}</Text>
            </View>
          </TouchableOpacity>
          
          {/* More navigation items */}
          <TouchableOpacity
            className="flex-row gap-2 my-2 mb-5"
            onPress={() => navigation2.navigate("History")}
          >
            <Ionicons
              name="document-text-outline"
              size={Platform.OS === "ios" ? 32 : 24}
              color="gray"
            />
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
            <Feather
              name="user"
              size={Platform.OS === "ios" ? 32 : 24}
              color="gray"
            />
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
            <MaterialCommunityIcons
              name="bank-outline"
              size={Platform.OS === "ios" ? 32 : 24}
              color="gray"
            />
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
            <AntDesign
              name="setting"
              size={Platform.OS === "ios" ? 32 : 24}
              color="gray"
            />
            <View>
              <Text className="font-bold text-gray-500">{t('drawer.settings')}</Text>
              <Text className="text-sm text-gray-500">Options & securite</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            className="flex-row gap-2 my-2 mb-5"
            onPress={() => navigation2.navigate("Support")}
          >
            <EvilIcons
              name="question"
              size={Platform.OS === "ios" ? 32 : 24}
              color="gray"
            />
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
            <EvilIcons
              name="exclamation"
              size={Platform.OS === "ios" ? 32 : 24}
              color="gray"
            />
            <View>
              <Text className="font-bold text-gray-500">{t('drawer.about_us')}</Text>
              <Text className="text-sm text-gray-500 pr-8">
                Mentions légales et conditions d'utilisation
              </Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Logout Button */}
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
