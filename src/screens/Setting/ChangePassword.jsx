import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';

const ChangePassword = () => {
  const { t } = useTranslation();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = () => {
    // Add your password update logic here with validation...
  };

  return (
    <View style={{ padding: 20 }}>
      <Text className="text-xl font-bold">{t('change_password')}</Text>
      <TextInput
        secureTextEntry
        className="border border-gray-300 rounded-lg px-4 py-2 mb-4"
        placeholder={t('old_password')}
        value={oldPassword}
        onChangeText={setOldPassword}
        style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 30,marginTop:30, paddingLeft: 10 }}
      />
      <TextInput
        secureTextEntry
        className="border border-gray-300 rounded-lg px-4 py-2 mb-4"
        placeholder={t('new_password')}
        value={newPassword}
        onChangeText={setNewPassword}
        style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 20, paddingLeft: 10 }}
      />
      <TextInput
        secureTextEntry
        className="border border-gray-300 rounded-lg px-4 py-2 mb-4"
        placeholder={t('confirm_new_password')}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 30, paddingLeft: 10 }}
      />

      {/* Password Requirements Message */}
      <Text className="text-sm text-gray-600 mb-4">
        {t('password_requirements')}
      </Text>

      <TouchableOpacity 
        onPress={handleSubmit} 
        className="mt-auto bg-[#7ddd7d] py-3 rounded-full mb-8"
      >
        <Text className="text-xl text-center font-bold">SOUMETTRE</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ChangePassword;
