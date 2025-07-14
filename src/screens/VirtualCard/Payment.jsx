import { View, Text, TouchableOpacity, TextInput, Platform, Dimensions, StyleSheet } from "react-native";
import React, { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { FontAwesome6 } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from 'react-i18next';
import { useGetUserProfileQuery } from "../../services/Auth/authAPI";

// Get screen dimensions
const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 375;

const Payment = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { data: userProfile, isLoading: isProfileLoading } = useGetUserProfileQuery();

  // Navigate to ManageVirtualCard if virtual card is active
  useEffect(() => {
    if (!isProfileLoading && userProfile?.virtualCard?.status) {
      const status = userProfile.virtualCard.status;
      if (status === "ACTIVE" || status === "PRE_ACTIVE") {
        navigation.navigate("ManageVirtualCard");
      }
    }
  }, [userProfile, isProfileLoading]);

  return (
    <View className="flex-1 p-6">
      <Text className="text-center text-sm text-gray-400">
        {t('payment2.no_payment_method')}
      </Text>

      <TouchableOpacity
        className="bg-[#7ddd7d] py-3 rounded-lg mt-5 shadow-sm shadow-black"
        onPress={() => navigation.navigate("BankCard")}
      >
        <Text className="text-center text-lg font-bold">{t('payment2.add_card')}</Text>
      </TouchableOpacity>

      <View className="border-y mt-6 border-dashed py-4">
        <View className="flex-row gap-2 items-end">
          <MaterialCommunityIcons name="bank-outline" size={24} color="#4B5563" />
          <Text className="font-bold text-gray-600 text-lg">
            {t('payment2.connect_bank')}
          </Text>
          <FontAwesome6 name="arrow-right-long" size={24} color="#4B5563" />
        </View>
        <Text className="text-sm text-gray-500">
          {t('payment2.connect_description')}
        </Text>
      </View>

      <View className="py-4 mb-4 gap-4 border-b border-dashed">
        <TouchableOpacity
          className="bg-[#7ddd7d] py-3 rounded-lg shadow-sm shadow-black"
          onPress={() => navigation.navigate("OnboardingCard")}
        >
          <Text className="text-center text-lg font-bold">
            {t('payment2.create_virtual')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-[#5c6165] py-3 rounded-lg shadow-sm shadow-black"
          onPress={() => navigation.navigate("ManageVirtualCard")}
        >
          <Text className="text-center text-lg font-bold">
            {t('payment2.manage_virtual')}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        className="bg-[#7ddd7d] py-3 rounded-lg shadow-sm shadow-black"
        onPress={() => navigation.navigate("KycResume")}
      >
        <Text className="text-center text-lg font-bold">
          {t('payment2.get_visa')}
        </Text>
      </TouchableOpacity>

      <View className="mb-5 py-3 mt-auto flex-row gap-4 items-center">
        <TouchableOpacity
          onPress={() => navigation.navigate('MainTabs')}
          style={styles.floatingHomeButton}
        >
          <Ionicons
            name="home"
            size={isSmallScreen ? 36 : 44}
            color="#7ddd7d"
          />
        </TouchableOpacity>
      </View>
      <StatusBar backgroundColor="#7ddd7d" />
    </View>
  );
};

const styles = StyleSheet.create({
  floatingHomeButton: {
    position: 'absolute',
    top: Platform.select({
      ios: height * 0.82,
      android: height * 0.8
    }),
    right: 20,
    zIndex: 999,
    backgroundColor: 'rgba(235, 248, 255, 0.9)',
    padding: 10,
    borderRadius: 20,
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
});

export default Payment;
