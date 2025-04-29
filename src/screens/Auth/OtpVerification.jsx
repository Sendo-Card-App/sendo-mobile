import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { OtpInput } from "react-native-otp-entry";
import KeyboardAvoidinWrapper from "../../components/KeyboardAvoidinWrapper";
import { useDispatch } from "react-redux";
import { AntDesign } from '@expo/vector-icons';
import { useVerifyOtpMutation, useResendOtpMutation } from "../../services/Auth/authAPI";
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

  // Get phone from either props (modal) or route (screen)
  const phone = route?.params?.phone || componentRoute?.params?.phone;
  const isForgotPasswordFlow = componentRoute.params?.isForgotPassword || false;

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
        text1: 'Invalid Code',
        text2: 'Please enter a 6-digit OTP'
      });
      return;
    }

    setIsVerifying(true);
    try {
      console.log('Verifying OTP with:', verificationPayload);

      const response = await verifyOtp({ phone, code: otp }).unwrap();
      console.log('OTP Verification Response:', response);
      // Handle forgot password flow
      if (isForgotPasswordFlow) {
        Toast.show({
          type: 'success',
          text1: 'OTP verified successfully',
        });
        navigation.navigate("ResetPassword", { 
          phone,
          verificationToken: response.data?.token 
        });
        return;
      }

      dispatch(verifyOtpSuccess(response));

      Toast.show({
        type: 'success',
        text1: 'OTP verified successfully',
      });

      if (onVerify) {
        onVerify(response);
      } else {
        navigation.navigate("Auth");
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

      if (onResend) {
        onResend();
      }
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
  const handleBack = () => {
    navigation.goBack();
  };

  // For modal version
  if (onClose) {
    return (
      <Modal 
        animationType="slide" 
        transparent 
        visible={true}
        onRequestClose={onClose}
      >
        <KeyboardAvoidinWrapper>
          <View className="flex-1 bg-[#181e25] bg-opacity-50 justify-center items-center">
                <TouchableOpacity
              className="absolute z-10 top-5 left-5"
              onPress={handleBack}
            >
              <AntDesign name="arrowleft" size={24} color="white" />
            </TouchableOpacity>
            <View className="w-9/12 bg-white p-6 rounded-xl items-center"> 
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
                theme={{
                  containerStyle: { marginBottom: 20 },
                  pinCodeContainerStyle: { height: 50, width: 40 },
                  pinCodeTextStyle: { fontSize: 24 },
                }}
              />
              
              <View className="flex-row items-center mb-6">
                <Text className="text-gray-600 mr-2">
                  Code expires in
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
                    Resend OTP
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
                    Verify
                  </Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={onClose}
                className="mt-4"
              >
                <Text className="text-red-500">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidinWrapper>
      </Modal>
    );
  }

  // For screen version
  return (
    <SafeAreaView className="flex-1 bg-[#181e25] justify-center">
       <TouchableOpacity
              className="absolute z-10 top-20 left-5"
              onPress={handleBack}
            >
              <AntDesign name="arrowleft" size={24} color="white" />
            </TouchableOpacity>
      <KeyboardAvoidinWrapper>
        <View className="w-full bg-[#f1f1f1] rounded-t-3xl p-6 items-center" style={{marginTop: 100}}>
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
            theme={{
              containerStyle: { marginBottom: 20 },
              pinCodeContainerStyle: { height: 50, width: 40 },
              pinCodeTextStyle: { fontSize: 24 },
            }}
          />
          
          <View className="flex-row items-center mb-6">
            <Text className="text-gray-600 mr-2">
              Code expires in
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
                Resend OTP
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
                Verify
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidinWrapper>
    </SafeAreaView>
  );
};

export default OtpVerification;