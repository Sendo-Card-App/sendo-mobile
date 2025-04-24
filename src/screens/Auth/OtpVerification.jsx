import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Image,
} from "react-native";
import { OtpInput } from "react-native-otp-entry";
import KeyboardAvoidinWrapper from "../../components/KeyboardAvoidinWrapper";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { useVerifyOtpMutation, useResendOtpMutation } from "../../services/Auth/authAPI";
import { verifyOtpSuccess } from "../../features/Auth/authSlice";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import Loader from "../../components/Loader";
import Toast from "react-native-toast-message";

const OTP_TIMER_DURATION = 300;

const OtpVerification = ({ route, onVerify, onResend, onClose }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const [verifyOtp] = useVerifyOtpMutation();
  const [resendOtp] = useResendOtpMutation();

  const phone = route?.params?.phone || '';
  const deviceId = route?.params?.deviceId || '';

  const [otp, setOtp] = useState("");
  const [seconds, setSeconds] = useState(OTP_TIMER_DURATION);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    let timer;
    if (seconds > 0) {
      timer = setInterval(() => setSeconds(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [seconds]);

  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      Toast.show({
        type: 'error',
        text1: 'Incomplete code',
      });
      return;
    }

    setIsVerifying(true);
    try {
      const response = await verifyOtp({ phone, code }).unwrap();

      await AsyncStorage.setItem('@authData', JSON.stringify({
        user: response.user,
        accessToken: response.accessToken,
        isGuest: false
      }));

      dispatch(verifyOtpSuccess(response));

      Toast.show({
        type: 'success',
        text1: 'OTP verified successfully',
      });

      if (onVerify) {
        onVerify(response);
      } else {
        navigation.navigate("Home");
      }

    } catch (err) {
      console.error("OTP Verification Error:", err);
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
      await resendOtp({ phone }).unwrap();
      setSeconds(OTP_TIMER_DURATION);

      Toast.show({
        type: 'success',
        text1: 'OTP resent successfully',
      });

    } catch (err) {
      console.error("Resend OTP Error:", err);
      Toast.show({
        type: 'error',
        text1: err?.data?.message || 'Failed to resend OTP',
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Modal 
      animationType="slide" 
      transparent 
      visible={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidinWrapper>
        <View className="flex-1 bg-[#181e25] bg-opacity-50 justify-center items-center">
          <View className="w-9/12 bg-white p-6 rounded-xl items-center"> 
            <Image
              className="w-40 h-40"
              source={require("../../images/Artboard 5.png")}
            />
            
            <Text className="mb-4 text-lg text-gray-800 opacity-40 text-center">
              {t("otpVerification.enterCode")} {phone}
            </Text>
            
            <OtpInput
              numberOfDigits={6}
              onTextChange={setOtp}
              focusColor="#7ddd7d"
              theme={{
                containerStyle: { marginBottom: 20 },
                pinCodeContainerStyle: { height: 50, width: 40 },
                pinCodeTextStyle: { fontSize: 24 },
              }}
            />
            
            <View className="flex-row items-center mb-6">
              <Text className="text-gray-600 mr-2">
                {t("otpVerification.codeExpiresIn")}
              </Text>
              <Text className="font-bold">
                {formatTime(seconds)}
              </Text>
            </View>
            
            <TouchableOpacity 
              onPress={handleResendOtp} 
              disabled={seconds > 0 || isResending}
              className="mb-6"
            >
              {isResending ? (
                <Loader />
              ) : (
                <Text className={`text-center ${seconds > 0 ? 'text-gray-400' : 'text-[#7ddd7d]'}`}>
                  {t("otpVerification.resendOtp")}
                </Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={handleVerifyOtp}
              disabled={otp.length !== 6 || isVerifying}
              className="w-full bg-[#7ddd7d] rounded-3xl p-4 items-center justify-center"
            >
              {isVerifying ? (
                <Loader />
              ) : (
                <Text className="font-bold text-white">
                  {t("otpVerification.verify")}
                </Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              onPress={onClose}
              className="mt-4"
            >
              <Text className="text-red-500">{t("cancel")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidinWrapper>
    </Modal>
  );
};

export default OtpVerification;
