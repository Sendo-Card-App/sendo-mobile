import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, StatusBar, Image, ScrollView, Modal } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";
import Loader from "../../components/Loader";
import Toast from 'react-native-toast-message';
import { useForgotPasswordMutation, useResendOtpMutation, useVerifyOtpMutation } from "../../services/Auth/authAPI";

const ForgetPassword = () => {
  const navigation = useNavigation();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [token, setToken] = useState('');
  
  const [resendOtp, { isLoading: isOtpLoading }] = useResendOtpMutation();
  const [verifyOtp, { isLoading: isVerifyLoading }] = useVerifyOtpMutation();

  const handleSendOtp = async () => {   
    if (!phone) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Phone number is required',
      });
      return;
    }

    try {
      await resendOtp({ phone }).unwrap();
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'OTP code has been sent to your phone',
      });
      
      setShowOtpModal(true);
    } catch (error) {
      console.log("OTP send error:", error);
      let errorMessage = 'Failed to send OTP';
      
      if (error.data?.status === 404) {
        errorMessage = 'No account associated with this phone number';
      }
      
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
      });
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a valid 6-digit OTP',
      });
      return;
    }

    try {
      const response = await verifyOtp({ phone, code: otp }).unwrap();
      setToken(response.data.token); // Assuming the API returns a token
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'OTP verified successfully',
      });
      
      navigation.navigate('ResetPassword', { 
        phone,
        token: response.data.token 
      });
      
      setShowOtpModal(false);
      setOtp('');
    } catch (error) {
      console.log("OTP verification error:", error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error?.data?.message || 'Invalid OTP code',
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
            Forgot Password
          </Text>

          <Text className="text-center mb-5">
            Enter your phone number to receive an OTP code
          </Text>

          <TextInput
            placeholder="Enter your phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
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
                Send OTP
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity className="mt-5" onPress={handleBackToSignIn}>
          <Text className="text-[#7ddd7d] text-center">
            Back to Sign In
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
            <Text className="text-xl font-bold text-center mb-5">
              Enter OTP Code
            </Text>
            
            <Text className="text-center mb-5">
              We've sent a 6-digit code to {phone}
            </Text>

            <TextInput
              placeholder="Enter 6-digit OTP"
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
                  Cancel
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
                    Verify
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