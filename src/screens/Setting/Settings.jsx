import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  ScrollView,
  Modal,
  Alert
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDispatch } from 'react-redux';
import { AntDesign, Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import Loader from '../../components/Loader'; // make sure path is correct

const Settings = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const [isBiometricsEnabled, setIsBiometricsEnabled] = useState(false);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleNotifications = () => setIsNotificationsEnabled(prev => !prev);

  const toggleBiometrics = async () => {
    setLoading(true);

    try {
      const isHardwareSupported = await LocalAuthentication.hasHardwareAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!isHardwareSupported || supportedTypes.length === 0 || !isEnrolled) {
        Alert.alert(t('biometric_not_available'));
        setLoading(false);
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t('authenticate_to_toggle_biometrics'),
      });

      if (result.success) {
        setIsBiometricsEnabled(prev => !prev);
      }
    } catch (error) {
      console.error("Biometric error:", error);
    }

    setLoading(false);
  };

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    setSelectedLanguage(lang);
    setLanguageModalVisible(false);
  };

  // Hide bottom tab bar
  useEffect(() => {
    const parent = navigation.getParent();
    parent?.setOptions({ tabBarStyle: { display: 'none' } });

    return () => parent?.setOptions({ tabBarStyle: undefined });
  }, [navigation]);

  if (loading) return <Loader />;

  return (
    <ScrollView
      className="flex-1 bg-white"
      contentContainerStyle={{ paddingBottom: 30 }}
    >
      <Text className="p-5 ml-1 mt-10 text-xl font-bold text-gray-600">{t('security')}</Text>

      {/* Biometrics */}
      <View className="bg-blue-50 px-5 py-4 flex-row items-center mx-4 rounded-lg">
        <AntDesign name="lock" size={24} color="black" />
        <View className="ml-3 flex-1">
          <Text className="text-lg font-semibold">{t('biometrics')}</Text>
          <Text className="text-sm text-gray-500 mt-1">{t('unlock_app')}</Text>
        </View>
        <Switch
          trackColor={{ true: "#7ddd7d", false: "#f1f1f1" }}
          thumbColor={isBiometricsEnabled ? "#ffffff" : "#f8f8f8"}
          ios_backgroundColor="#f1f1f1"
          onValueChange={toggleBiometrics}
          value={isBiometricsEnabled}
        />
      </View>

      {/* Notifications */}
      <View className="bg-blue-50 px-5 py-4 flex-row items-center mx-4 mt-3 rounded-lg">
        <Ionicons name="notifications-outline" size={24} color="black" />
        <View className="ml-3 flex-1">
          <Text className="text-lg font-semibold">{t('notifications')}</Text>
          <Text className="text-sm text-gray-500 mt-1">{t('ensure_notifications')}</Text>
        </View>
        <Switch
          trackColor={{ true: "#7ddd7d", false: "#f1f1f1" }}
          thumbColor={isNotificationsEnabled ? "#ffffff" : "#f8f8f8"}
          ios_backgroundColor="#f1f1f1"
          onValueChange={toggleNotifications}
          value={isNotificationsEnabled}
        />
      </View>

      {/* Change Password */}
      <TouchableOpacity
        className="bg-blue-50 mx-4 mt-3 rounded-lg"
        onPress={() => navigation.navigate('ChangePassword')}
      >
        <View className="px-5 py-4 flex-row items-center">
          <MaterialIcons name="key" size={24} color="black" />
          <View className="ml-3 flex-1">
            <Text className="text-lg font-semibold">{t('change_password')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="gray" />
        </View>
      </TouchableOpacity>

      {/* Language Selector */}
      <View className="mt-6 mx-4">
        <TouchableOpacity
          className="flex-row items-center px-4 py-4 bg-blue-50 rounded-lg"
          onPress={() => setLanguageModalVisible(true)}
        >
          <Icon name="language" size={24} color="black" />
          <Text className="ml-3 text-lg font-semibold text-gray-800">{t('choose_language')}</Text>
          <View className="flex-1 items-end justify-center">
            <Text className="text-sm text-gray-500">{selectedLanguage === 'en' ? 'English' : 'Français'}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Language Modal */}
      <Modal animationType="slide" transparent={true} visible={languageModalVisible}>
        <View className="flex-1 justify-center items-center bg-transparent bg-opacity-50">
          <View className="w-3/4 bg-blue-50 rounded-lg py-5 px-4">
            <Text className="text-lg text-center mb-4 font-semibold">{t('choose_language')}</Text>
            <TouchableOpacity onPress={() => changeLanguage("en")}>
              <Text className="text-center font-bold py-2 text-base">English</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => changeLanguage("fr")}>
              <Text className="text-center font-bold py-2 text-base">Français</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setLanguageModalVisible(false)}>
              <Text className="text-center text-red-500 mt-4 font-bold text-base">{t('close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View className="h-20" />
    </ScrollView>
  );
};

export default Settings;
