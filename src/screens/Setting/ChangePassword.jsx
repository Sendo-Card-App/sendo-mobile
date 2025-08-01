import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  useUpdatePasswordMutation,
  useGetMyProfileQuery,
} from '../../services/Auth/authAPI';
import {
  sendPushNotification,
  sendPushTokenToBackend,
  registerForPushNotificationsAsync,
} from '../../services/notificationService';
import Toast from 'react-native-toast-message';
import Loader from '../../components/Loader';
import { Ionicons } from '@expo/vector-icons';

const ChangePassword = () => {
  const { t } = useTranslation();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { data: profile } = useGetMyProfileQuery();
  const [updatePassword] = useUpdatePasswordMutation();

  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*()_+[\]{};':"\\|,.<>/?]/.test(password)) strength++;

    if (strength <= 1) return { label: t('Weak'), color: '#e74c3c', width: '33%' };
    if (strength === 2 || strength === 3) return { label: t('Medium'), color: '#f1c40f', width: '66%' };
    return { label: t('Strong'), color: '#2ecc71', width: '100%' };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  const handlePasswordUpdate = async () => {
    setIsLoading(true);
    try {
      const userId = profile?.data?.id;
      const result = await updatePassword({
        userId,
        oldPassword,
        newPassword,
      }).unwrap();

      if (result.status === 200 || result.code === 200) {
        try {
          const pushToken = await registerForPushNotificationsAsync();
          if (pushToken) {
            await sendPushTokenToBackend(
              pushToken,
              "Password Updated",
              "Your password has been changed successfully",
              "SUCCESS_MODIFY_PASSWORD"
            );
          }
          await sendPushNotification(
            "Security Update",
            "Your password has been changed successfully"
          );
        } catch (notificationError) {
          console.warn("Notification failed silently:", notificationError);
        }

        Toast.show({
          type: 'success',
          text1: t('Password updated'),
          text2: t('Your password has been successfully updated.'),
        });
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        Toast.show({
          type: 'error',
          text1: t('Update failed'),
          text2: result?.message || t('Failed to update password.'),
        });
      }
    } catch (err) {
      console.error('UpdatePassword error:', err);
      Toast.show({
        type: 'error',
        text1: t('Wrong password'),
        text2: t('Please enter your correct old password.'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Toast.show({
        type: 'error',
        text1: t('Field required'),
        text2: t('All fields are required'),
      });
      return;
    }

    if (oldPassword === newPassword) {
      Toast.show({
        type: 'error',
        text1: t('Password same as old'),
        text2: t('The new password must be different from the old one.'),
      });
      return;
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      Toast.show({
        type: 'error',
        text1: t('Weak password'),
        text2: t(
          'Password must be at least 8 characters, include one uppercase letter, one number, and one special character.'
        ),
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: t('Password mismatch'),
        text2: t('The passwords do not match.'),
      });
      return;
    }

    handlePasswordUpdate();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView
        contentContainerStyle={{ padding: 20, flexGrow: 1, justifyContent: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={{
            fontSize: 24,
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: 30,
            color: '#333',
          }}
        >
          {t('change_password')}
        </Text>

        {/* Old Password */}
        <View style={{ marginBottom: 20, position: 'relative' }}>
          <TextInput
            secureTextEntry={!showOldPassword}
            placeholder={t('old_password')}
            value={oldPassword}
            onChangeText={setOldPassword}
            placeholderTextColor="#999"
            style={{
              height: 50,
              borderColor: '#ddd',
              borderWidth: 1,
              borderRadius: 10,
              paddingLeft: 15,
              backgroundColor: '#f9f9f9',
            }}
          />
          <TouchableOpacity
            onPress={() => setShowOldPassword(v => !v)}
            style={{ position: 'absolute', right: 15, top: 15 }}
          >
            <Ionicons
              name={showOldPassword ? 'eye-off' : 'eye'}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
        </View>

        {/* New Password */}
        <View style={{ marginBottom: 10, position: 'relative' }}>
          <TextInput
            secureTextEntry={!showNewPassword}
            placeholder={t('new_password')}
            value={newPassword}
            onChangeText={setNewPassword}
            placeholderTextColor="#999"
            style={{
              height: 50,
              borderColor: '#ddd',
              borderWidth: 1,
              borderRadius: 10,
              paddingLeft: 15,
              backgroundColor: '#f9f9f9',
            }}
          />
          <TouchableOpacity
            onPress={() => setShowNewPassword(v => !v)}
            style={{ position: 'absolute', right: 15, top: 15 }}
          >
            <Ionicons
              name={showNewPassword ? 'eye-off' : 'eye'}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
        </View>

        {/* Password Strength */}
        {newPassword.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <View
              style={{
                height: 8,
                width: '100%',
                backgroundColor: '#eee',
                borderRadius: 10,
                overflow: 'hidden',
              }}
            >
              <View
                style={{
                  height: '100%',
                  width: passwordStrength.width,
                  backgroundColor: passwordStrength.color,
                }}
              />
            </View>
            <Text style={{ marginTop: 5, color: passwordStrength.color }}>
              {passwordStrength.label}
            </Text>
          </View>
        )}

        {/* Confirm Password */}
        <View style={{ marginBottom: 20, position: 'relative' }}>
          <TextInput
            secureTextEntry={!showConfirmPassword}
            placeholder={t('confirm_new_password')}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholderTextColor="#999"
            style={{
              height: 50,
              borderColor: '#ddd',
              borderWidth: 1,
              borderRadius: 10,
              paddingLeft: 15,
              backgroundColor: '#f9f9f9',
            }}
          />
          <TouchableOpacity
            onPress={() => setShowConfirmPassword(v => !v)}
            style={{ position: 'absolute', right: 15, top: 15 }}
          >
            <Ionicons
              name={showConfirmPassword ? 'eye-off' : 'eye'}
              size={20}
              color="#666"
            />
          </TouchableOpacity>
        </View>

        {/* Submit */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isLoading}
          style={{
            backgroundColor: '#7ddd7d',
            paddingVertical: 15,
            borderRadius: 10,
            alignItems: 'center',
            marginTop: 20,
            elevation: 3,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 3,
          }}
        >
          {isLoading ? (
            <Loader color="#fff" />
          ) : (
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>
              {t('submit')}
            </Text>
          )}
        </TouchableOpacity>

        <Toast />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ChangePassword;
