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
  Alert,
  SafeAreaView,
  StatusBar,
  Modal
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
import Loader from "../../components/Loader"; // Import the Loader component

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

  const handleNext = async () => {
    if (!phone) {
      Alert.alert("Error", "Please enter a valid phone number.");
      return;
    }
    try {
      setIsLoading(true);
      const fullPhone = isToggled ? `+1${phone}` : `+237${phone}`;
      // Trigger the OTP sending process
      await resendOtp(fullPhone).unwrap(); // Call resendOtp mutation
      setModalVisible(true); // Show OTP modal after OTP is sent
    } catch (err) {
      Alert.alert("Error", err.data?.message || "Failed to send OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (code) => {
    try {
      setIsLoading(true);
      const fullPhone = isToggled ? `+1${phone}` : `+237${phone}`;
      const response = await verifyOtp({ phone: fullPhone, code }).unwrap();

      const authData = {
        user: response.user,
        accessToken: response.accessToken,
        isGuest: false
      };

      await storeAuthData(authData);
      dispatch(loginSuccess(authData));
      setModalVisible(false);
      navigation.navigate("Home");
    } catch (err) {
      Alert.alert("Error", "Invalid OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setIsLoading(true);
      const fullPhone = isToggled ? `+1${phone}` : `+237${phone}`;
      await resendOtp(fullPhone).unwrap();
      Alert.alert("Success", "OTP resent successfully.");
    } catch (err) {
      Alert.alert("Error", err.data?.message || "Failed to resend OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = () => {
    navigation.navigate('Signup');
  };

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    setLanguageModalVisible(false);
  };

  return (
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
          <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
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

        <Image source={require("../../images/LogoSendo.png")} className="mt-3 mb-3 w-28 h-28" />

        <View className="w-[80%] bg-[#f1f1f1] rounded-3xl mb-2 px-5">
          <Text className="text-3xl font-bold mt-5 mb-5">{t("log.title")}</Text>

          <View className="flex-row space-x-4 bg-white rounded-3xl mb-5">
            <TouchableOpacity onPress={() => setIsToggled(!isToggled)}>
              <Image source={isToggled ? secondIcon : firstIcon} className="w-16 h-16" />
            </TouchableOpacity>
            <TextInput
              value={isToggled ? "+1" : "+237"}
              editable={false}
              className="ml-3"
            />
          </View>

          <TextInput
            placeholder={t("log.phoneNumber")}
            onChangeText={setPhone}
            value={phone}
            keyboardType="phone-pad"
            className="bg-white rounded-3xl text-center mb-5 py-5"
          />

          <TouchableOpacity
            disabled={isLoading}
            onPress={handleNext} // Trigger OTP send
            className="bg-[#7ddd7d] rounded-3xl p-4"
          >
            {isLoading ? (
              <Loader /> // Use Loader instead of ActivityIndicator
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

        <TouchableOpacity className="mt-2 mb-5">
          <Text className="text-[#7ddd7d] underline text-center">
            {t("signIn.guestUser")}
          </Text>
        </TouchableOpacity>

        <Modal animationType="slide" transparent={true} visible={isModalVisible}>
          <OtpVerification
            phone={isToggled ? `+1${phone}` : `+237${phone}`}
            onVerify={handleVerifyOtp}
            onResend={handleResendOtp}
            onClose={() => setModalVisible(false)}
          />
        </Modal>
      </SafeAreaView>
    </KeyboardAvoidinWrapper>
  );
};

export default Log;
