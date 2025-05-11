import 'react-native-get-random-values';
import React, { useState, useEffect } from "react";
import { AntDesign } from "@expo/vector-icons";
import Icon from 'react-native-vector-icons/Ionicons';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Modal,
  FlatList,
  ActivityIndicator
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import KeyboardAvoidinWrapper from "../../components/KeyboardAvoidinWrapper";
import { OtpInput } from "react-native-otp-entry";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import {
  useResendOtpMutation,
  useVerifyOtpMutation,
  useSendOtpMutation
} from "../../services/Auth/authAPI";
import { loginSuccess } from "../../features/Auth/authSlice";
import Loader from "../../components/Loader";
import { storeData } from "../../services/storage";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

const Log = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [verifyOtp] = useVerifyOtpMutation();
  const [resendOtp] = useResendOtpMutation();
  const [sendOtp] = useSendOtpMutation();

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isModalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [seconds, setSeconds] = useState(60);

  const [countries, setCountries] = useState([]);
  const [fullPhoneNumber, setFullPhoneNumber] = useState(""); 
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState({
    name: 'Cameroon',
    code: '+237',
    flag: 'https://flagcdn.com/w40/cm.png'
  });

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
      Toast.show({ type: 'error', text1: 'Failed to load countries' });
    }
  };

  useEffect(() => {
    fetchCountries();
  }, []);

  useEffect(() => {
    if (phone && selectedCountry.code) {
      setFullPhoneNumber(`${selectedCountry.code}${phone}`);
    }
  }, [phone, selectedCountry.code]);

  // Timer for OTP resend
  useEffect(() => {
    const timer = seconds > 0 && setInterval(() => setSeconds(seconds - 1), 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  const storeAuthData = async (authData) => {
    try {
      await AsyncStorage.setItem('@authData', JSON.stringify(authData));
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error saving login data' });
    }
  };

  const handleNext = async () => {
    if (!phone) {
      Toast.show({ type: 'error', text1: 'Enter a valid phone number' });
      return;
    }

    try {
      setIsLoading(true);
      await resendOtp({ phone: fullPhoneNumber }).unwrap();
      Toast.show({ type: 'success', text1: 'OTP sent successfully' });
      setModalVisible(true);
      setSeconds(60); // Reset timer
    } catch (err) {
      Toast.show({ type: 'error', text1: err.data?.message || 'Failed to send OTP' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (code) => {
    if (code.length !== 6) return;
    
    setIsVerifying(true);
    try {
      const response = await verifyOtp({ phone: fullPhoneNumber, code }).unwrap();
      
      if (response.status === 200) {
        const authData = {
          user: response.data.user,
          accessToken: response.data.accessToken,
          isGuest: false
        };

        await storeData('@authData', authData);
        dispatch(loginSuccess(authData));
        
        setModalVisible(false);
        Toast.show({ type: 'success', text1: 'Login successful' });
        navigation.navigate("Main");
      }
    } catch (err) {
      console.log(err)
      Toast.show({
        type: 'error',
        text1: err?.data?.message || 'OTP verification failed',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (seconds > 0) return;
    
    setIsResending(true);
    try {
      await resendOtp({ phone: fullPhoneNumber }).unwrap();
      setSeconds(60);
      Toast.show({ type: 'success', text1: 'OTP resent successfully' });
    } catch (err) {
      Toast.show({ type: 'error', text1: err.data?.message || 'Resend failed' });
    } finally {
      setIsResending(false);
    }
  };

  const handleGuestLogin = () => {
    navigation.navigate("GuestLogin", { isGuest: true });
  };

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    setLanguageModalVisible(false);
  };

  const renderCountry = ({ item }) => (
    <TouchableOpacity
      onPress={() => {
        setSelectedCountry(item);
        setCountryModalVisible(false);
      }}
      className="flex-row items-center py-3 px-4 border-b border-gray-200"
    >
      <Image source={{ uri: item.flag }} className="w-8 h-6 mr-3" />
      <Text className="text-lg">{`${item.name} (${item.code})`}</Text>
    </TouchableOpacity>
  );

  return (
    <>
      <KeyboardAvoidinWrapper>
        <SafeAreaView className="flex-1 bg-[#181e25] justify-center items-center">
          <StatusBar barStyle="light-content" backgroundColor="#181e25" />

          <View className="absolute top-14 w-full px-6 flex-row justify-between z-10">
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <AntDesign name="arrowleft" size={24} color="white" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setLanguageModalVisible(true)}>
              <Icon name="language" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Language Modal */}
          <Modal animationType="slide" transparent visible={languageModalVisible}>
            <View className="flex-1 justify-center items-center bg-black/50">
              <View className="w-4/5 bg-white rounded-xl p-6">
                <Text className="text-xl font-bold mb-4 text-center">Select your language</Text>
                <TouchableOpacity 
                  onPress={() => changeLanguage("en")}
                  className="py-3 border-b border-gray-200"
                >
                  <Text className="text-lg text-center">English</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => changeLanguage("fr")}
                  className="py-3 border-b border-gray-200"
                >
                  <Text className="text-lg text-center">Français</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setLanguageModalVisible(false)}
                  className="mt-4"
                >
                  <Text className="text-red-500 text-lg text-center">Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Logo */}
          <Image 
            source={require("../../images/LogoSendo.png")} 
            className="w-24 h-24 mb-8" 
          />

          {/* Login Form */}
          <View className="w-4/5 bg-[#f1f1f1] rounded-3xl p-6 items-center">
            <Text className="text-2xl font-bold mb-6">{t("log.title")}</Text>

            <TouchableOpacity 
              onPress={() => setCountryModalVisible(true)}
              className="flex-row items-center bg-white w-full py-3 px-4 rounded-2xl mb-4"
            >
              <Image source={{ uri: selectedCountry.flag }} className="w-8 h-6 mr-3" />
              <Text className="font-bold text-lg">{selectedCountry.code}</Text>
            </TouchableOpacity>

            <TextInput
              placeholder={t("signup.phone")}
              onChangeText={setPhone}
              value={phone}
              keyboardType="phone-pad"
              className="bg-white w-full py-4 px-6 rounded-2xl text-center text-lg mb-6"
              maxLength={10}
            />

            <TouchableOpacity 
              onPress={handleNext}
              disabled={isLoading}
              className={`w-full py-4 rounded-2xl items-center ${isLoading ? 'bg-gray-400' : 'bg-[#7ddd7d]'}`}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">{t("log.next")}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => navigation.navigate('ForgetPassword')}
              className="self-end mt-3"
            >
              <Text className="text-gray-600">{t("log.forgetPassword")}</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-white mt-8">{t("signIn.dontHaveAccount")}</Text>
          
          <TouchableOpacity 
            onPress={() => navigation.navigate('Signup')}
            className="border-2 border-[#7ddd7d] rounded-2xl px-10 py-2 mt-3"
          >
            <Text className="text-[#7ddd7d] font-medium">{t("signIn.signUp")}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={handleGuestLogin}
            className="mt-4"
          >
            <Text className="text-[#7ddd7d] underline">{t("signIn.guestUser")}</Text>
          </TouchableOpacity>

          {/* Country Selection Modal */}
          <Modal visible={countryModalVisible} animationType="slide">
            <SafeAreaView className="flex-1 bg-white">
              {countries.length === 0 ? (
                <View className="flex-1 justify-center items-center">
                  <ActivityIndicator size="large" color="#7ddd7d" />
                </View>
              ) : (
                <FlatList
                  data={countries}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={renderCountry}
                  contentContainerStyle={{ paddingVertical: 20 }}
                />
              )}
            </SafeAreaView>
          </Modal>

          {/* OTP Verification Modal */}
          <Modal 
            animationType="slide" 
            transparent 
            visible={isModalVisible}
            onRequestClose={() => setModalVisible(false)}
          >
            <View className="flex-1 bg-black/50 justify-center items-center">
              <View className="w-5/6 bg-white rounded-2xl p-6">
                <TouchableOpacity 
                  onPress={() => setModalVisible(false)}
                  className="self-end mb-2"
                >
                  <AntDesign name="close" size={24} color="#333" />
                </TouchableOpacity>

                <Text className="text-2xl font-bold text-center mb-1">Enter Verification Code</Text>
                <Text className="text-gray-600 text-center mb-6">
                  We've sent a 6-digit code to {fullPhoneNumber}
                </Text>

                <OtpInput
                  numberOfDigits={6}
                  onTextChange={setOtp}
                  focusColor="#7ddd7d"
                  theme={{
                    containerStyle: { marginVertical: 20 },
                    pinCodeContainerStyle: { 
                      height: 50, 
                      width: 40,
                      borderWidth: 1,
                      borderColor: '#ddd',
                      borderRadius: 8
                    },
                    pinCodeTextStyle: { fontSize: 20 }
                  }}
                />

                <TouchableOpacity
                  onPress={() => handleVerifyOtp(otp)}
                  disabled={otp.length !== 6 || isVerifying}
                  className={`w-full py-4 rounded-xl items-center justify-center mt-4 ${otp.length === 6 ? 'bg-[#7ddd7d]' : 'bg-gray-300'}`}
                >
                  {isVerifying ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-bold text-lg">Verify</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleResendOtp}
                  disabled={seconds > 0 || isResending}
                  className="mt-6 items-center"
                >
                  {isResending ? (
                    <ActivityIndicator color="#7ddd7d" />
                  ) : (
                    <Text className={`text-lg ${seconds > 0 ? 'text-gray-400' : 'text-[#7ddd7d] font-bold'}`}>
                      {seconds > 0 ? `Resend in ${seconds}s` : 'Resend Code'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      </KeyboardAvoidinWrapper>
      <Toast />
    </>
  );
};

export default Log;