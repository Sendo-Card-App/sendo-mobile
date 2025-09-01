import { View, Text, TouchableOpacity, Linking } from "react-native";
import React from "react";
import { StatusBar } from "expo-status-bar";
import { AntDesign, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const Support = ({navigation}) => {
  const { t } = useTranslation();

  const openLink = (url) => {
    Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
  };

  const callNumber = (phoneNumber) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const openWhatsApp = (phoneNumber) => {
    Linking.openURL(`https://wa.me/${phoneNumber.replace(/\D/g, '')}`);
  };

  return (
    <View className="flex-1 pt-6">
      <Text className="text-center font-bold text-gray-400 text-sm">
        {t('support2.help_available')}
      </Text>
       <TouchableOpacity
              className=" mx-4 mt-3 rounded-lg"
              onPress={() => navigation.navigate('ChatScreen')}
            >
              <View className="px-5 py-4 flex-row items-center">
                 <Ionicons name="chatbubble-outline" size={24} color="black" />
                <View className="ml-3 flex-1">
                  <Text className="text-lg font-semibold">{t('client')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="gray" />
              </View>
            </TouchableOpacity>
      
      <View className="bg-green-50 p-3 px-6 mt-3 rounded-lg">
        <Text className="text-gray-900 font-bold text-xl">{t('support2.faq')}</Text>
        <Text className="text-gray-600">{t('support2.faq_description')}</Text>
      </View>
      
      <View className="px-6 mt-3 rounded-lg">
        <Text className="text-gray-900 font-bold">{t('support2.email')}</Text>
        <Text className="text-gray-600">{t('support2.email_description')}</Text>
      </View>
      
      <View className="bg-green-50 p-3 px-6 mt-3 rounded-lg">
        <Text className="text-gray-900 font-bold">{t('support2.phone')}</Text>
        <TouchableOpacity onPress={() => callNumber('+237640726036')}>
          <Text className="text-green-600 underline">+237 6 40 72 60 36</Text>
        </TouchableOpacity>
        <View className="flex-row mt-2">
          <TouchableOpacity 
            className="mr-4 p-2 bg-green-100 rounded-full"
            onPress={() => callNumber('+237640726036')}
          >
            <Ionicons name="call-outline" size={20} color="green" />
          </TouchableOpacity>
          <TouchableOpacity 
            className="p-2 bg-green-100 rounded-full"
            onPress={() => openWhatsApp('+237640726036')}
          >
            <Ionicons name="logo-whatsapp" size={20} color="green" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View className="p-6">
        <Text className="text-gray-900 font-bold mb-2">{t('support2.follow_us') || "Follow Us"}</Text>
        <View className="flex-row justify-between">
          <TouchableOpacity 
            className="p-3 bg-blue-100 rounded-full"
            onPress={() => openLink('https://www.facebook.com/share/15ZwvWb3pq/?mibextid=wwXIfr')}
          >
            <Ionicons name="logo-facebook" size={24} color="#3b5998" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="p-3 bg-pink-100 rounded-full"
            onPress={() => openLink('https://www.instagram.com/payschool7?igsh=MWdkdnZ5dGt2YmNncg%3D%3D&utm_source=qr')}
          >
            <Ionicons name="logo-instagram" size={24} color="#E1306C" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="p-3 bg-black rounded-full"
            onPress={() => openLink('https://x.com/sfeetudiant?s=21')}
          >
            <Ionicons name="logo-twitter" size={24} color="white" />
          </TouchableOpacity>
        </View>
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

export default Support;