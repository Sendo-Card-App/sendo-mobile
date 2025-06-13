import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSelector } from 'react-redux';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import {
  useResetPasswordMutation,
  useGetUserProfileQuery,
} from '../../services/Auth/authAPI';
import Loader from '../../components/Loader';

const ResetPassword = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { response } = route.params || {};

  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const accessToken = useSelector((state) => state.auth.accessToken);
  const { data: userProfile } = useGetUserProfileQuery();

  useEffect(() => {
    if (userProfile) {
      console.log('User Profile:', userProfile);
    }
  }, [userProfile]);

  const handleSubmit = async () => {
    if (!otpCode || !newPassword || !confirmPassword) {
      Toast.show({
        type: 'error',
        text1: t('resetPassword.title'),
        text2: t('resetPassword.toast.requiredFields'),
      });
      return;
    }

    if (newPassword.length < 8) {
      Toast.show({
        type: 'error',
        text1: t('resetPassword.title'),
        text2: t('resetPassword.toast.minLength'),
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: t('resetPassword.title'),
        text2: t('resetPassword.toast.mismatch'),
      });
      return;
    }

    try {
      await resetPassword({
        code: otpCode,
        newPassword,
      }).unwrap();

      Toast.show({
        type: 'success',
        text1: t('resetPassword.title'),
        text2: t('resetPassword.toast.success'),
      });

      navigation.navigate('SignIn');
    } catch (error) {
      console.log('Reset password error:', error);
      let errorMessage = t('resetPassword.toast.genericError');

      if (error.data?.status === 500) {
        errorMessage = t('resetPassword.toast.updateError');
      }

      Toast.show({
        type: 'error',
        text1: t('resetPassword.title'),
        text2: errorMessage,
      });
    }
  };

  return (
    <SafeAreaView className="bg-[#181e25] flex-1">
      <StatusBar style="light" backgroundColor="#181e25" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            className="absolute z-10 top-5 left-5"
            onPress={() => navigation.goBack()}
          >
            <AntDesign name="arrowleft" size={24} color="white" />
          </TouchableOpacity>

          <View className="items-center justify-center py-8">
            <Image
              source={require('../../images/LogoSendo.png')}
              className="w-28 h-28 mb-6"
            />

            <View className="w-[85%] bg-[#f1f1f1] rounded-3xl p-5">
              <Text className="text-2xl font-bold text-center mb-5 text-black">
                {t('resetPassword.title')}
              </Text>

              <Text className="text-center mb-5 text-gray-600">
                {response?.email
                  ? t('resetPassword.descriptionEmail', { email: response.email })
                  : response?.phone
                    ? t('resetPassword.descriptionPhone', { phone: response.phone })
                    : t('resetPassword.descriptionGeneric')}
              </Text>

              {/* OTP Code */}
              <View className="mb-4">
                <Text className="text-gray-700 font-bold mb-2">
                  {t('resetPassword.otpLabel')}
                </Text>
                <TextInput
                  placeholder={t('resetPassword.otpPlaceholder')}
                  value={otpCode}
                  onChangeText={setOtpCode}
                  keyboardType="numeric"
                  className="bg-white rounded-3xl py-4 px-5"
                />
              </View>

              {/* New Password */}
              <View className="mb-4">
                <Text className="text-gray-700 font-bold mb-2">
                  {t('resetPassword.newPasswordLabel')}
                </Text>
                <View className="relative">
                  <TextInput
                    placeholder={t('resetPassword.newPasswordPlaceholder')}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                    className="bg-white rounded-3xl py-4 px-5 pr-12"
                  />
                  <TouchableOpacity
                    className="absolute right-3 top-4"
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  >
                    <MaterialIcons
                      name={showNewPassword ? 'visibility-off' : 'visibility'}
                      size={24}
                      color="#777"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Confirm Password */}
              <View className="mb-5">
                <Text className="text-gray-700 font-bold mb-2">
                  {t('resetPassword.confirmPasswordLabel')}
                </Text>
                <View className="relative">
                  <TextInput
                    placeholder={t('resetPassword.confirmPasswordPlaceholder')}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    className="bg-white rounded-3xl py-4 px-5 pr-12"
                  />
                  <TouchableOpacity
                    className="absolute right-3 top-4"
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <MaterialIcons
                      name={showConfirmPassword ? 'visibility-off' : 'visibility'}
                      size={24}
                      color="#777"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Submit Button */}
              <TouchableOpacity
                onPress={handleSubmit}
                disabled={isLoading}
                className="bg-[#7ddd7d] rounded-3xl p-4 items-center justify-center"
              >
                {isLoading ? (
                  <Loader />
                ) : (
                  <Text className="font-bold text-white">
                    {t('resetPassword.button')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ResetPassword;
