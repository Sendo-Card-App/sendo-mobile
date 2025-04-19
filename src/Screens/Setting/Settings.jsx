import React, { useState } from 'react';
import { View, Text, Switch, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/Ionicons';
import { AntDesign, Ionicons, MaterialIcons } from '@expo/vector-icons'; // Import icons

const Settings = ({ navigation }) => {
  const { t, i18n } = useTranslation(); 
  const [isEnable, setIsEnable] = useState(false);
  const toggleSwitch = () => setIsEnable((prev) => !prev);

  const [isEnableTwo, setIsEnableTwo] = useState(false);
  const toggleSwitchTwo = () => setIsEnableTwo((prev) => !prev);

  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
  };

  return (
    <View className="flex-1">
      <Text className="p-5 ml-1 text-xl font-bold text-gray-600">{t('security')}</Text>
      
      {/* Biometrics Switch */}
      <View className="bg-blue-50 border-0 px-5 py-3 flex-row items-center">
        <AntDesign name="lock" size={24} color="black" />
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text className="text-xl font-bold">{t('biometrics')}</Text>
          <Text className="text-xs text-gray-500">{t('unlock_app')}</Text>
        </View>
        <Switch
          trackColor={{ true: "#7ddd7d", false: "lightgray" }}
          thumbColor={isEnable ? "#ffffff" : "white"}
          onValueChange={toggleSwitch}
          value={isEnable}
        />
      </View>

      {/* Notifications Switch */}
      <View className="border-0 px-5 py-3 flex-row items-center">
        <Ionicons name="notifications-outline" size={24} color="black" />
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text className="text-xl font-bold">{t('notifications')}</Text>
          <Text className="text-xs text-gray-500">{t('ensure_notifications')}</Text>
        </View>
        <Switch
          trackColor={{ true: "#7ddd7d", false: "lightgray" }}
          thumbColor={isEnableTwo ? "#ffffff" : "white"}
          onValueChange={toggleSwitchTwo}
          value={isEnableTwo}
        />
      </View>

      {/* Change Password Button with Icon */}
      <TouchableOpacity 
      className="bg-blue-50"
        onPress={() => navigation.navigate('ChangePassword')} 
        style={{ padding: 20, flexDirection: 'row', alignItems: 'center' }}
      >
        <MaterialIcons name="key" size={24} color="black" />
        <Text className="text-xl font-bold text-black-600" style={{ marginLeft: 10 }}>
          {t('change_password')}
        </Text>
        <Ionicons name="chevron-forward" size={20} color="black" style={{ marginLeft: 'auto' }} />
      </TouchableOpacity>


      {/* Language Dropdown */}
      <View style={{ padding: 20, alignItems: 'center' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <Icon name="language" size={24} color="#000" style={{ marginRight: 10 }} />
        <Text className="text-xl font-bold">{t('choose_language')}</Text>
      </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
          <Picker
            selectedValue={selectedLanguage}
            onValueChange={(itemValue) => {
              setSelectedLanguage(itemValue);
              changeLanguage(itemValue);
            }}
            style={{ height: 50, width: '80%' }}
          >
            <Picker.Item label="English" value="en" />
            <Picker.Item label="Français" value="fr" />
            {/* You can add more languages here */}
          </Picker>
        </View>
      </View>
    </View>
  );
}

export default Settings;
