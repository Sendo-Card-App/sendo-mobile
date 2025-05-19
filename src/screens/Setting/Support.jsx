import { View, Text, TouchableOpacity } from "react-native";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { AntDesign, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';


const support = ({navigation}) => {
  const { t } = useTranslation();

  return (
    <View className="flex-1 pt-6">
      <Text className="text-center font-bold text-gray-400 text-sm">
        {t('support2.help_available')}
      </Text>
       <TouchableOpacity
              className=" mx-4 mt-3 rounded-lg"
              onPress={() => navigation.navigate('Chat')}
            >
              <View className="px-5 py-4 flex-row items-center">
                 <Ionicons name="chatbubble-outline" size={24} color="black" />
                <View className="ml-3 flex-1">
                  <Text className="text-lg font-semibold">{t('client')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="gray" />
              </View>
            </TouchableOpacity>
      
      <View className="bg-gray-200 p-3 px-6 mt-3 rounded-lg">
        <Text className="text-gray-900 font-bold text-xl">{t('support2.faq')}</Text>
        <Text className="text-gray-600">{t('support2.faq_description')}</Text>
      </View>
      <View className="px-6 mt-3 rounded-lg">
        <Text className="text-gray-900 font-bold">{t('support2.email')}</Text>
        <Text className="text-gray-600">{t('support2.email_description')}</Text>
      </View>
      <View className="bg-gray-200 p-3 px-6 mt-3 rounded-lg">
        <Text className="text-gray-900 font-bold">{t('support2.phone')}</Text>
        <Text className="text-gray-600">{t('support2.phone_description')}</Text>
      </View>
      <View className="p-6 gap-3">
        <Text className="text-gray-600">
          {t('support2.contact_instructions')}
        </Text>
        <Text className="text-gray-600">
          {t('support2.account_deletion')}
        </Text>
      </View>
      <StatusBar backgroundColor="#7ddd7d"/>
    </View>
  );
};

export default support;