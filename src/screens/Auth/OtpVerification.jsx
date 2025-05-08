import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from "react-native";
import { OtpInput } from "react-native-otp-entry";
import KeyboardAvoidinWrapper from "../../components/KeyboardAvoidinWrapper";
import { useDispatch } from "react-redux";
import { AntDesign } from '@expo/vector-icons';
import { useVerifyOtpMutation, useResendOtpMutation } from "../../services/Auth/authAPI";
import { sendPushNotification, sendPushTokenToBackend, registerForPushNotificationsAsync  } from '../../services/notificationService';
import { verifyOtpSuccess } from "../../features/Auth/authSlice";
import { useNavigation, useRoute } from "@react-navigation/native";
import Loader from "../../components/Loader";
import Toast from "react-native-toast-message";

const OTP_TIMER_DURATION = 300;

const OtpVerification = ({ route, onVerify, onResend, onClose }) => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const componentRoute = useRoute();
  const [verifyOtp] = useVerifyOtpMutation();
  const [resendOtp] = useResendOtpMutation();

  const phone = route?.params?.phone || componentRoute?.params?.phone;
  const initialCode = route?.params?.code || componentRoute?.params?.code;
  const isForgotPasswordFlow = componentRoute.params?.isForgotPassword || false;

  const [otp, setOtp] = useState(initialCode || "");
  const [seconds, setSeconds] = useState(OTP_TIMER_DURATION);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Timer
  useEffect(() => {
    let timer;
    if (seconds > 0) {
      timer = setInterval(() => setSeconds(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [seconds]);

  // Auto verification if phone and code exist
  useEffect(() => {
    if (phone && initialCode && initialCode.length === 6) {
      setOtp(initialCode);
      handleVerifyOtp(initialCode); // pass the code explicitly
    }
  }, []);

  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleVerifyOtp = async (codeToVerify = otp) => {
    if (codeToVerify.length !== 6 || isVerifying) return;
  
    setIsVerifying(true);
    try {
      const response = await verifyOtp({ phone, code: codeToVerify }).unwrap();
  
      if (response.status === 200) {
        // Send success notification
        try {
          // Get the push token from the notification service
          const pushToken = await registerForPushNotificationsAsync();
          
          if (pushToken) {
            // Send to backend with specific type
            await sendPushTokenToBackend(
              pushToken,
              "Account Verified",
              "Your account has been successfully verified!",
              "SUCCESS_ACCOUNT_VERIFIED"
            );
            
            // Local notification
            await sendPushNotification(
              "Verification Successful",
              "Your account is now verified!"
            );
          }
        } catch (notificationError) {
          console.warn("Notification failed silently:", notificationError);
        }
  
        Toast.show({
          type: 'success',
          text1: response.message || 'OTP verified successfully',
        });
  
        if (isForgotPasswordFlow) {
          navigation.navigate("ResetPassword", {
            phone,
            verificationToken: response.data?.token,
          });
        } else {
          dispatch(verifyOtpSuccess(response));
          onVerify ? onVerify(response) : navigation.navigate("Auth");
        }
      }
    } catch (err) {
      const status = err?.status;
      if (status === 404) {
        Toast.show({
          type: 'error',
          text1: 'Invalid or Expired Code',
          text2: 'The OTP code is incorrect or expired. Please request a new one.',
        });
      } else if (status === 500) {
        Toast.show({
          type: 'error',
          text1: 'Server Error',
          text2: 'An error occurred while verifying OTP. Please try again.',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: err?.data?.message || 'OTP verification failed',
        });
      }
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

      if (onResend) onResend();
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: err?.data?.message || 'Failed to resend OTP',
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const renderOtpScreen = () => (
    <KeyboardAvoidinWrapper>
      <View className="w-full bg-[#f1f1f1] rounded-t-3xl p-6 items-center" style={{ marginTop: 100 }}>
        <Image
          className="w-40 h-40"
          source={require("../../images/Artboard 5.png")}
        />
        <Text className="mb-4 text-lg text-gray-800 opacity-40 text-center">
          Enter code sent to {phone}
        </Text>

        <OtpInput
          numberOfDigits={6}
          onTextChange={setOtp}
          focusColor="#7ddd7d"
          defaultValue={otp}
          theme={{
            containerStyle: { marginBottom: 20 },
            pinCodeContainerStyle: { height: 50, width: 40 },
            pinCodeTextStyle: { fontSize: 24 },
          }}
        />

        <View className="flex-row items-center mb-6">
          <Text className="text-gray-600 mr-2">Code expires in</Text>
          <Text className="font-bold">{formatTime(seconds)}</Text>
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
              Resend OTP
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleVerifyOtp()}
          disabled={otp.length !== 6 || isVerifying}
          className="w-full bg-[#7ddd7d] rounded-3xl p-4 items-center justify-center"
        >
          {isVerifying ? (
            <Loader />
          ) : (
            <Text className="font-bold text-white">Verify</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidinWrapper>
  );

  if (onClose) {
    return (
      <Modal animationType="slide" transparent visible={true} onRequestClose={onClose}>
        <View className="flex-1 bg-[#181e25] bg-opacity-50 justify-center items-center">
          <TouchableOpacity className="absolute z-10 top-5 left-5" onPress={handleBack}>
            <AntDesign name="arrowleft" size={24} color="white" />
          </TouchableOpacity>
          <View className="w-9/12 bg-white p-6 rounded-xl items-center">
            {renderOtpScreen()}
            <TouchableOpacity onPress={onClose} className="mt-4">
              <Text className="text-red-500">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#181e25] justify-center">
      <TouchableOpacity className="absolute z-10 top-20 left-5" onPress={handleBack}>
        <AntDesign name="arrowleft" size={24} color="white" />
      </TouchableOpacity>
      {renderOtpScreen()}
    </SafeAreaView>
  );
};

export default OtpVerification;
