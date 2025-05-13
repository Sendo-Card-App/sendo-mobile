import React, { useState, useEffect } from 'react';
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
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [token, setToken] = useState('');
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState({
    name: 'Cameroon',
    code: '+237',
    flag: 'https://flagcdn.com/w320/cm.png'
  });
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  
  const [resendOtp, { isLoading: isOtpLoading }] = useResendOtpMutation();
  const [verifyOtp, { isLoading: isVerifyLoading }] = useVerifyOtpMutation();

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    try {
      const res = await fetch('https://restcountries.com/v3.1/all');
      const data = await res.json();
      const sorted = data.map(c => ({
        name: c.name.common,
        code: `+${c.idd.root?.replace('+', '') || ''}${c.idd.suffixes ? c.idd.suffixes[0] : ''}`,
        flag: c.flags?.png
      })).filter(c => c.code).sort((a, b) => a.name.localeCompare(b.name));
      setCountries(sorted);
    } catch (e) {
      Toast.show({ type: 'error', text1: t('errors.countriesLoadFailed') });
    }
  };

  const handleSendOtp = async () => {   
    if (!phone) {
      Toast.show({
        type: 'error',
        text1: t('errors.error'),
        text2: t('forgotPassword.phoneRequired'),
      });
      return;
    }

    const fullPhoneNumber = `${selectedCountry.code}${phone}`;

    try {
      await resendOtp({ phone: fullPhoneNumber }).unwrap();
      
      Toast.show({
        type: 'success',
        text1: t('common.success'),
        text2: t('forgotPassword.otpSent'),
      });
      
      setShowOtpModal(true);
    } catch (error) {
      console.log("OTP send error:", error);
      let errorMessage = t('forgotPassword.otpSendFailed');
      
      if (error.data?.status === 404) {
        errorMessage = t('forgotPassword.noAccountFound');
      }
      
      Toast.show({
        type: 'error',
        text1: t('errors.error'),
        text2: errorMessage,
      });
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      Toast.show({
        type: 'error',
        text1: t('errors1.error'),
        text2: t('forgotPassword.validOtpRequired'),
      });
      return;
    }

    const fullPhoneNumber = `${selectedCountry.code}${phone}`;

    try {
      const response = await verifyOtp({ phone: fullPhoneNumber, code: otp }).unwrap();
      setToken(response.data.token);
      
      Toast.show({
        type: 'success',
        text1: t('common.success'),
        text2: t('forgotPassword.otpVerified'),
      });
      
      navigation.navigate('ResetPassword', { 
        phone: fullPhoneNumber,
        token: response.data.token 
      });
      
      setShowOtpModal(false);
      setOtp('');
    } catch (error) {
      console.log("OTP verification error:", error);
      Toast.show({
        type: 'error',
        text1: t('errors1.error'),
        text2: error?.data?.message || t('forgotPassword.invalidOtp'),
      });
    }
  };

  const handleBackToSignIn = () => {
    navigation.navigate('SignIn');
  };

  const isLoading = isOtpLoading || isVerifyLoading;

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
        source={require("../../images/LogoSendo.png")}
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

          <View className="flex-row mb-5">
            <TouchableOpacity 
              className="bg-white rounded-l-3xl p-4 flex-row items-center"
              onPress={() => setShowCountryPicker(true)}
            >
              {selectedCountry.flag && (
                <Image 
                  source={{ uri: selectedCountry.flag }} 
                  className="w-6 h-4 mr-2" 
                />
              )}
              <Text>{selectedCountry.code}</Text>
              <AntDesign name="down" size={14} color="black" className="ml-1" />
            </TouchableOpacity>
            <TextInput
              placeholder={t('forgotPassword.phonePlaceholder')}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              className="bg-white rounded-r-3xl py-4 px-5 flex-1"
            />
          </View>

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

      {/* Country Picker Modal */}
      <Modal
        visible={showCountryPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="w-[85%] bg-[#f1f1f1] rounded-3xl p-5 max-h-[70%]">
            <Text className="text-xl font-bold text-center mb-5">
              {t('forgotPassword.selectCountry')}
            </Text>
            
            <ScrollView>
              {countries.map((country) => (
                <TouchableOpacity
                  key={country.code}
                  className="flex-row items-center p-3 border-b border-gray-200"
                  onPress={() => {
                    setSelectedCountry(country);
                    setShowCountryPicker(false);
                  }}
                >
                  {country.flag && (
                    <Image 
                      source={{ uri: country.flag }} 
                      className="w-8 h-6 mr-3" 
                    />
                  )}
                  <Text className="flex-1">{country.name}</Text>
                  <Text>{country.code}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              onPress={() => setShowCountryPicker(false)}
              className="bg-gray-300 rounded-3xl p-4 mt-5 items-center"
            >
              <Text className="font-bold">
                {t('common1.cancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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
              source={require("../../images/Artboard 5.png")}
            />
            <Text className="text-xl font-bold text-center mb-5">
              {t('forgotPassword.enterOtp')}
            </Text>
            
            <Text className="text-center mb-5">
              {t('forgotPassword.otpSentTo')} {selectedCountry.code}{phone}
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
                  {t('common1.cancel')}
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
                    {t('common1.verify')}
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