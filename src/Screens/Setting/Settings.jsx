import React, { useState } from 'react';
import { View, Text, Switch, Button } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Picker } from '@react-native-picker/picker'; // Import Picker

const Settings = () => {
  const { t, i18n } = useTranslation(); // Initialize translation hook
  const [isEnable, setisEnable] = useState(false);
  const ToggleSwitch = () => {
    setisEnable((prev) => !prev);
  };

  const [isEnableTwo, setisEnableTwo] = useState(false);
  const ToggleSwitchTwo = () => {
    setisEnableTwo((prev) => !prev);
  };

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang); // Change the language
  };

  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);

  return (
    <View className="flex-1">
      <Text className="p-5 ml-1 text-xl font-bold text-gray-600 ">{t('security')}</Text>
      <View className="bg-blue-50 border-0 px-5 py-3">
        <Text className="text-xl font-bold">{t('biometrics')}</Text>
        <View className="flex-row justify-between items-center">
          <Text className="text-xs text-gray-500">
            {t('unlock_app')}
          </Text>
          <Switch
            className="mb-3"
            trackColor={{ true: "#7ddd7d", false: "lightgray" }}
            thumbColor={isEnable ? "#ffffff" : "white"}
            onValueChange={ToggleSwitch}
            value={isEnable}
          />
        </View>
      </View>
      <View className="border-0 px-5 py-3">
        <Text className="text-xl font-bold">{t('notifications')}</Text>
        <View className="flex-row justify-between items-center">
          <Text className="text-xs text-gray-500">
            {t('ensure_notifications')}
          </Text>
          <Switch
            className="mb-3"
            trackColor={{ true: "#7ddd7d", false: "lightgray" }}
            thumbColor={isEnableTwo ? "#ffffff" : "white"}
            onValueChange={ToggleSwitchTwo}
            value={isEnableTwo}
          />
        </View>
      </View>
      {/* Language Dropdown */}
      <View style={{ padding: 20 }}>
        <Text className="text-xl">Choisir une Langue</Text>
        <Picker
          selectedValue={selectedLanguage}
          onValueChange={(itemValue) => {
            setSelectedLanguage(itemValue);
            changeLanguage(itemValue);
          }}
          style={{ height: 50, width: '100%' }}
        >
          <Picker.Item label="English" value="en" />
          <Picker.Item label="Français" value="fr" />
          {/* You can add more languages here */}
        </Picker>
      </View>
    </View>
  );
}

export default Settings;
