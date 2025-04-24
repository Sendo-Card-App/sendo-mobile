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
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

const DrawerComponent = ({ navigation }) => {
  const navigation2 = useNavigation();
  const { t } = useTranslation();
  const { data: userProfile, isLoading, error, refetch } = useGetUserProfileQuery();
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout({ deviceId }).unwrap();
      
      // Clear authentication data
      await AsyncStorage.multiRemove(['@accessToken', '@refreshToken']);
      
      // Navigate to login screen
      navigation2.navigate("LogIn");
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Logged out successfully',
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to logout. Please try again.',
      });
    }
  };

  useEffect(() => {
    refetch();
  }, []);

  if (isLoading || isLoggingOut) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <Loader />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 justify-center items-center">
        <Text className="text-red-500">Error loading profile</Text>
        <TouchableOpacity 
          onPress={refetch} 
          className="mt-4 bg-[#7ddd7d] px-6 py-2 rounded-full"
        >
          <Text className="text-white">Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1">
      {/* The upper Green section */}
      <View className="bg-[#7ddd7d] pt-10 pl-10 pr-5 pb-5">
        <View className="flex-row justify-between items-center">
          <Text className="text-white font-bold text-xl">
            {userProfile?.firstname} {userProfile?.lastname}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.closeDrawer()}
            className="p-2"
          >
            <AntDesign name="arrowleft" size={24} color="white" />
          </TouchableOpacity>
        </View>
        <Text className="text-white">{userProfile?.email}</Text>
        <Text className="text-white">{userProfile?.phone}</Text>
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
            className="flex-row gap-2 my-2 items-center"
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
            className="flex-row gap-2 my-2"
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
            className="flex-row gap-2 my-2"
            onPress={() => navigation2.navigate("PayBill")}
          >
            <Ionicons
              name="calculator-outline"
              size={Platform.OS === "ios" ? 32 : 24}
              color="gray"
            />
            <View>
              <Text className="font-bold text-gray-500">{t('drawer.pay_bills')}</Text>
              <Text className="text-sm text-gray-500 pr-8">
                Payer des factures tels que les pass mobiles, internet et bouquets Tv
              </Text>
            </View>
          </TouchableOpacity>
          {/* Additional navigation items */}
          <TouchableOpacity
            className="flex-row gap-2 my-2"
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
            className="flex-row gap-2 my-2"
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
            className="flex-row gap-2 my-2"
            onPress={() => navigation2.navigate("Settings")}
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
            className="flex-row gap-2 my-2"
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
            className="flex-row gap-2 my-2"
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
