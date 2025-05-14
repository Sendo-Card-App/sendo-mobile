import { View, Text, TouchableOpacity, TextInput } from "react-native";
import React from "react";
import { StatusBar } from "expo-status-bar";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { FontAwesome6 } from "@expo/vector-icons";
import { AntDesign, EvilIcons, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from 'react-i18next';

const Payment = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  
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
          <MaterialCommunityIcons
            name="bank-outline"
            size={24}
            color="#4B5563"
          />
          <Text className="font-bold text-gray-600 text-lg">
            {t('payment2.connect_bank')}
          </Text>
          <FontAwesome6
            name="arrow-right-long"
            size={24}
            color="#4B5563"
            className="ml-auto"
          />
        </View>
        <Text className="text-sm text-gray-500">
          {t('payment2.connect_description')}
        </Text>
      </View>

      <View className="py-4 mb-4 gap-4 border-b border-dashed">
        <TouchableOpacity
          className="bg-[#7ddd7d] py-3 rounded-lg shadow-sm shadow-black"
          onPress={() => navigation.navigate("CreateVirtualCard")}
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
        onPress={() => navigation.navigate("VerifyIdentity")}
      >
        <Text className="text-center text-lg font-bold">
          {t('payment2.get_visa')}
        </Text>
      </TouchableOpacity>

      <Text className="font-extrabold text-gray-800 border-b border-gray-400 pt-6 pb-1 border-dashed text-lg">
        {t('payment2.bonus_balance')}
      </Text>
      <Text className="font-extrabold text-gray-800 mt-2 text-lg">
        0,00 CAD
      </Text>

      <Text className="text-sm text-gray-400">
        {t('payment2.referral_terms')}
        <Text className="underline"> {t('payment2.terms_conditions')}</Text>
      </Text>

      <Text className="text-[#7ddd7d] font-bold text-sm my-4">
        {t('payment2.share_referral')}
      </Text>

      <View className="mb-5 py-3 mt-auto flex-row gap-4 items-center">
         <TouchableOpacity 
                            onPress={() => navigation.navigate('MainTabs')}
                            style={styles.floatingHomeButton}
                          >
                            <Ionicons name="home" size={44} color="#7ddd7d" />
                          </TouchableOpacity>
        <TouchableOpacity
          className="bg-[#7ddd7d] rounded-full items-center justify-center px-4 py-2"
          onPress={() => navigation.navigate("Success")}
        >
          <Text className="text-md text-center font-bold">{t('payment2.generate_code')}</Text>
        </TouchableOpacity>

        <TextInput className="border rounded-2xl border-gray-400 py-3.5 pl-2 flex-1" />
      </View>
      <StatusBar backgroundColor="#7ddd7d" />
      
    </View>
  );
};
const styles = {
  floatingHomeButton: {
    position: 'absolute',
    top: StatusBar.currentHeight + 500,
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
 
};

export default Payment;