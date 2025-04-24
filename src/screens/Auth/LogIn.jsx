import 'react-native-get-random-values';
import React, { useState } from "react";
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
  StyleSheet
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import KeyboardAvoidinWrapper from "../../components/KeyboardAvoidinWrapper";
import OtpVerification from "./OtpVerification";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import {
  useResendOtpMutation,
  useVerifyOtpMutation
} from "../../services/Auth/authAPI";
import { loginSuccess } from "../../features/Auth/authSlice";
import Loader from "../../components/Loader";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

const Log = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [verifyOtp] = useVerifyOtpMutation();
  const [resendOtp] = useResendOtpMutation();

  const [phone, setPhone] = useState("");
  const [isModalVisible, setModalVisible] = useState(false);
  const [isToggled, setIsToggled] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const firstIcon = require("../../images/Artboard 1.png");
  const secondIcon = require("../../images/Artboard 2 copy 2.png");

  const storeAuthData = async (authData) => {
    try {
      await AsyncStorage.setItem('@authData', JSON.stringify(authData));
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to save login data',
        position: 'bottom'
      });
    }
  };

  const handleNext = async () => {
    if (!phone) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a valid phone number',
        position: 'bottom'
      });
      return;
    }

    try {
      setIsLoading(true);
      await resendOtp(phone).unwrap();
      setModalVisible(true);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'OTP sent successfully',
        position: 'bottom'
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.data?.message || 'Failed to send OTP',
        position: 'bottom'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (code) => {
    try {
      setIsLoading(true);
      const response = await verifyOtp({ phone, code }).unwrap();

      const authData = {
        user: response.user,
        accessToken: response.accessToken,
        isGuest: false
      };

      await storeAuthData(authData);
      dispatch(loginSuccess(authData));
      setModalVisible(false);
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Login successful',
        position: 'bottom'
      });
      navigation.navigate("Main");
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Invalid OTP. Please try again',
        position: 'bottom'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setIsLoading(true);
      await resendOtp(phone).unwrap();
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'OTP resent successfully',
        position: 'bottom'
      });
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.data?.message || 'Failed to resend OTP',
        position: 'bottom'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = () => {
    Toast.show({
      type: 'info',
      text1: 'Info',
      text2: 'Continuing as guest user',
      position: 'bottom'
    });
    navigation.navigate("Home", { isGuest: true });
  };

  const handleToggle = () => {
    navigation.navigate('Signup');
  };

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    setLanguageModalVisible(false);
    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: `Language changed to ${lang === 'en' ? 'English' : 'French'}`,
      position: 'bottom'
    });
  };

  return (
    <>
      <KeyboardAvoidinWrapper>
        <SafeAreaView className="bg-[#181e25] flex-1 items-center justify-center">
          <StatusBar style="light" backgroundColor="#181e25" />

          <View className="absolute z-10 top-20 flex-row justify-between w-full px-5">
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <AntDesign name="arrowleft" size={24} color="white" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setLanguageModalVisible(!languageModalVisible)}>
              <Icon name="language" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <Modal animationType="slide" transparent={true} visible={languageModalVisible}>
            <View className="flex-1 justify-center items-center bg-transparent bg-opacity-50">
              <View className="w-3/4 bg-white rounded-lg py-5">
                <Text className="text-lg text-center mb-4">Select your language</Text>
                <TouchableOpacity onPress={() => changeLanguage("en")}>
                  <Text className="text-center py-2">English</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => changeLanguage("fr")}>
                  <Text className="text-center py-2">Français</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setLanguageModalVisible(false)}>
                  <Text className="text-center text-red-500 mt-4">Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Image source={require("../../images/LogoSendo.png")} className=" mb-10 w-28 h-28" />

          <View className="w-[80%] bg-[#f1f1f1] rounded-3xl mb-2 px-5">
            <Text className="text-3xl font-bold mt-5 mb-5">{t("log.title")}</Text>

            <View className="flex-row space-x-4 bg-white rounded-3xl mb-5 items-center">
              <TouchableOpacity onPress={() => setIsToggled(!isToggled)}>
                <Image source={isToggled ? secondIcon : firstIcon} className="w-16 h-16" />
              </TouchableOpacity>
              <Text className="ml-3 text-lg font-bold">
                {isToggled ? "+1 (CA)" : "+237 (CMR)"}
              </Text>
            </View>

            <TextInput
              placeholder={t("signup.phone")}
              onChangeText={setPhone}
              value={phone}
              keyboardType="phone-pad"
              className="bg-white rounded-3xl text-center mb-5 py-5"
              maxLength={isToggled ? 10 : 9}
            />

            <TouchableOpacity
              disabled={isLoading}
              onPress={handleNext}
              className="bg-[#7ddd7d] rounded-3xl p-4"
            >
              {isLoading ? (
                <Loader />
              ) : (
                <Text className="font-bold text-center">{t("log.next")}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('ForgetPassword')}>
              <Text className="mt-2 text-right pr-2 text-blue-500">
                {t("log.forgetPassword")}
              </Text>
            </TouchableOpacity>
          </View>

          <Text className="text-center text-white mt-5">
            {t("signIn.dontHaveAccount")}
          </Text>

          <TouchableOpacity onPress={handleToggle} className="mt-2">
            <Text className="border-2 border-[#7ddd7d] rounded-3xl text-[#7ddd7d] py-3 px-24 text-center">
              {t("signIn.signUp")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            className="mt-2 mb-5"
            onPress={handleGuestLogin}
          >
            <Text className="text-[#7ddd7d] underline text-center">
              {t("signIn.guestUser")}
            </Text>
          </TouchableOpacity>

          <Modal animationType="slide" transparent={true} visible={isModalVisible}>
            <OtpVerification
              phone={phone}
              onVerify={handleVerifyOtp}
              onResend={handleResendOtp}
              onClose={() => setModalVisible(false)}
            />
          </Modal>
        </SafeAreaView>
      </KeyboardAvoidinWrapper>
      <Toast />
    </>
  );
};

export default Log;