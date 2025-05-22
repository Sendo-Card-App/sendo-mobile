import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, StatusBar, Image, ScrollView, Modal } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";
import Loader from "../../components/Loader";
import Toast from 'react-native-toast-message';
import { useForgotPasswordMutation, useResendOtpMutation, useVerifyOtpMutation } from "../../services/Auth/authAPI";
import { useTranslation } from 'react-i18next';

const ForgetPassword = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [forgotPassword] = useForgotPasswordMutation();
  const [verifyOtp] = useVerifyOtpMutation();

  const handleSendOtp = async () => {   
    if (!email) {
      Toast.show({
        type: 'error',
        text1: t('errors.error'),
        text2: t('forgotPassword.emailRequired'),
      });
      return;
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Toast.show({
        type: 'error',
        text1: t('errors1.error'),
        text2: t('forgotPassword.invalidEmail'),
      });
      return;
    }

    setIsLoading(true);
    try {
      await forgotPassword({ email }).unwrap();
       setToken(response.data.token);
      Toast.show({
        type: 'success',
        text1: t('common.success'),
        text2: t('forgotPassword.otpSent'),
      });
      
       navigation.navigate('ResetPassword', { 
        email,
        token: response.data.token 
      });
      
      setShowOtpModal(true);
    } catch (error) {
      console.log("Forgot password error:", error);
      let errorMessage = t('forgotPassword.otpSendFailed');
      
      if (error.data?.status === 404) {
        errorMessage = t('forgotPassword.noAccountFound');
      }
      
      Toast.show({
        type: 'error',
        text1: t('errors1.error'),
        text2: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      Toast.show({
        type: 'error',
        text1: t('errors.error'),
        text2: t('forgotPassword.validOtpRequired'),
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await verifyOtp({ email, code: otp }).unwrap();
      setToken(response.data.token);
      
      Toast.show({
        type: 'success',
        text1: t('common.success'),
        text2: t('forgotPassword.otpVerified'),
      });
      
      navigation.navigate('ResetPassword', { 
        email,
        token: response.data.token 
      });
      
      setShowOtpModal(false);
      setOtp('');
    } catch (error) {
      console.log("OTP verification error:", error);
      Toast.show({
        type: 'error',
        text1: t('errors.error'),
        text2: error?.data?.message || t('forgotPassword.invalidOtp'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSignIn = () => {
    navigation.navigate('SignIn');
  };

  return (
    <SafeAreaView className="bg-[#181e25] flex-1 items-center justify-center">
      <StatusBar style="light" backgroundColor="#181e25" />

      <TouchableOpacity
        className="absolute top-20 left-5"
        onPress={() => navigation.goBack()}
      >
        <AntDesign name="arrowleft" size={24} color="white" />
      </TouchableOpacity>

      <Image
        source={require("../../Images/LogoSendo.png")}
        className="mt-10 mb-10 w-28 h-28"
      />

      <ScrollView contentContainerStyle={{ width: '100%', paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        <View className="w-[85%] bg-[#f1f1f1] rounded-3xl p-5">
          <Text className="text-2xl font-bold text-center mb-5">
            {t('forgotPassword.title')}
          </Text>

          <Text className="text-center mb-5">
            {t('forgotPassword.subtitle')}
          </Text>

          <TextInput
            placeholder={t('forgotPassword.emailPlaceholder')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            className="bg-white rounded-3xl py-4 px-5 mb-5"
          />

          <TouchableOpacity
            onPress={handleSendOtp}
            disabled={isLoading}
            className="bg-[#7ddd7d] rounded-3xl p-4 items-center justify-center"
          >
            {isLoading ? (
              <Loader />
            ) : (
              <Text className="font-bold text-white">
                {t('forgotPassword.sendOtp')}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity className="mt-5" onPress={handleBackToSignIn}>
          <Text className="text-[#7ddd7d] text-center">
            {t('forgotPassword.backToSignIn')}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* OTP Verification Modal */}
      <Modal
        visible={showOtpModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowOtpModal(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="w-[85%] bg-[#f1f1f1] rounded-3xl p-5">
            <Image
              className="w-40 h-40 self-center"
              source={require("../../Images/Artboard 5.png")}
            />
            <Text className="text-xl font-bold text-center mb-5">
              {t('forgotPassword.enterOtp')}
            </Text>
            
            <Text className="text-center mb-5">
              {t('forgotPassword.otpSentTo')} {email}
            </Text>

            <TextInput
              placeholder={t('forgotPassword.otpPlaceholder')}
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              className="bg-white rounded-3xl py-4 px-5 mb-5 text-center text-lg"
            />

            <View className="flex-row justify-between">
              <TouchableOpacity
                onPress={() => {
                  setShowOtpModal(false);
                  setOtp('');
                }}
                className="bg-gray-300 rounded-3xl p-4 flex-1 mr-2 items-center"
              >
                <Text className="font-bold">
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleVerifyOtp}
                disabled={isLoading || otp.length !== 6}
                className="bg-[#7ddd7d] rounded-3xl p-4 flex-1 ml-2 items-center"
              >
                {isLoading ? (
                  <Loader small white />
                ) : (
                  <Text className="font-bold text-white">
                    {t('common.verify')}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ForgetPassword;