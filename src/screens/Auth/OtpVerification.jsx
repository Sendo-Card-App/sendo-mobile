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
import { useVerifyOtpMutation, useResendOtpMutation, useSendOtpMutation  } from "../../services/Auth/authAPI";
import { 
  sendPushNotification,
  sendPushTokenToBackend,
  registerForPushNotificationsAsync
} from '../../services/notificationService';
import { verifyOtpSuccess } from "../../features/Auth/authSlice";
import { useNavigation, useRoute } from "@react-navigation/native";
import Loader from "../../components/Loader";
import Toast from "react-native-toast-message";

const OTP_TIMER_DURATION = 100;

const OtpVerification = ({ route, onVerify, onResend, onClose }) => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const componentRoute = useRoute();
  const [verifyOtp] = useVerifyOtpMutation();
  const [resendOtp] = useResendOtpMutation();
  const [sendOtp] = useSendOtpMutation();

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
  
  useEffect(() => {
    const sendInitialOtp = async () => {
      if (phone) {
        try {
          await resendOtp({ phone }).unwrap();
          Toast.show({
            type: 'success',
            text1: 'OTP sent successfully',
          });
        } catch (err) {
          Toast.show({
            type: 'error',
            text1: err?.data?.message || 'Failed to send OTP',
          });
        }
      }
    };

    sendInitialOtp();
  }, [phone]);

 const handleVerifyOtp = async (codeToVerify = otp) => {
  if (codeToVerify.length !== 6 || isVerifying) return;

  setIsVerifying(true);
  try {
    const response = await verifyOtp({ phone, code: codeToVerify }).unwrap();

    if (response.status === 200) {
      // Enhanced notification handling
      try {
        const notificationPromises = [];
        
        // 1. Register for push notifications if not already done
        const pushToken = await getStoredPushToken() || await registerForPushNotificationsAsync();
        
        if (pushToken) {
          // Format notification content
          const notificationDetails = `Account Verification Details:
          - Phone: ${phone}
          - Time: ${new Date().toLocaleString()}
          - Status: Successfully Verified`;

          // Send to backend
          notificationPromises.push(
            sendPushTokenToBackend(
              "Account Verified",
              notificationDetails,
              "SUCCESS_ACCOUNT_VERIFIED"
            )
          );
        }

        // Always send local notification
        notificationPromises.push(
          sendPushNotification(
            "Verification Successful", 
            "Your account is now verified!"
          )
        );

        await Promise.all(notificationPromises);
      } catch (notificationError) {
        console.warn("Notification subsystem failed:", notificationError);
        // Fallback to simple toast if notifications fail
        Toast.show({
          type: 'info',
          text1: 'Verification complete',
          text2: 'Your account is now verified',
        });
      }

      // Show success message
      Toast.show({
        type: 'success',
        text1: response.message || 'OTP verified successfully',
        visibilityTime: 3000
      });

      // Navigate after a slight delay
      setTimeout(() => {
        navigation.navigate("Auth");
      }, 500);
    }
  } catch (err) {
    console.error('OTP Verification Error:', err);
    
    // Enhanced error handling
    const status = err?.status;
    const errorMessage = err?.data?.message || 'OTP verification failed';
    
    const errorResponses = {
      400: {
        text1: 'Invalid Request',
        text2: 'The verification code format is invalid'
      },
      404: {
        text1: 'Invalid or Expired Code',
        text2: 'The OTP code is incorrect or expired. Please request a new one.'
      },
      429: {
        text1: 'Too Many Attempts',
        text2: 'Please wait before trying again'
      },
      500: {
        text1: 'Server Error',
        text2: 'An error occurred while verifying OTP. Please try again.'
      },
      default: {
        text1: 'Verification Failed',
        text2: errorMessage
      }
    };

    Toast.show({
      type: 'error',
      ...(errorResponses[status] || errorResponses.default),
    });

    // Reset OTP field on certain errors
    if ([404, 429].includes(status)) {
      setOtp('');
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
      <TouchableOpacity 
        className="absolute z-10 top-5 left-5" 
        onPress={handleBack}
      >
        <AntDesign name="arrowleft" size={24} color="white" />
      </TouchableOpacity>
      
      <View className="w-9/12 bg-white p-6 rounded-xl items-center">
        {/* Phone Number Display */}
        <Text className="mb-4 text-gray-600">
          Code sent to {phone}
        </Text>
        
        {/* OTP Input and Controls */}
        {renderOtpScreen()}
        
        {/* Cancel Button */}
        <TouchableOpacity 
          onPress={onClose} 
          className="mt-4"
        >
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
