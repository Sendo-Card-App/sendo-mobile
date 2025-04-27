import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, StatusBar, Image, ScrollView } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";
import Loader from "../../components/Loader";
import Toast from 'react-native-toast-message';
import { useForgotPasswordMutation, useSendOtpMutation } from "../../services/Auth/authAPI";

const ForgetPassword = () => {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isEmailMethod, setIsEmailMethod] = useState(true);
  const [forgotPassword, { isLoading: isEmailLoading }] = useForgotPasswordMutation();
  const [sendOtp, { isLoading: isOtpLoading }] = useSendOtpMutation();

  const handleSubmit = async () => {
    if (isEmailMethod) {
      if (!email) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Email is required',
        });
        return;
      }

      try {
        await forgotPassword({ email }).unwrap();
        
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'A reset link has been sent to your email',
        });
        
        navigation.navigate('ResetPassword', { email });
        setEmail("");
      } catch (error) {
        console.log("Forgot password error:", error);
        let errorMessage = 'An error occurred. Please try again later.';
        
        if (error.data?.status === 404) {
          errorMessage = 'No account associated with this email';
        }
        
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: errorMessage,
        });
      }
    } else {
      if (!phone) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Phone number is required',
        });
        return;
      }

      try {
        await sendOtp({ phone }).unwrap();
        
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'OTP code has been sent to your phone',
        });
        
        navigation.navigate('OtpVerification', { phone });
        setPhone("");
      } catch (error) {
        console.log("OTP send error:", error);
        let errorMessage = 'An error occurred. Please try again later.';
        
        if (error.data?.status === 404) {
          errorMessage = 'No account associated with this phone number';
        }
        
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: errorMessage,
        });
      }
    }
  };

  const toggleMethod = () => {
    setIsEmailMethod(!isEmailMethod);
    setEmail("");
    setPhone("");
  };

  const handleBackToSignIn = () => {
    navigation.navigate('SignIn');
  };

  const isLoading = isEmailLoading || isOtpLoading;

  return (
    <SafeAreaView className="bg-[#181e25] flex-1 items-center justify-center">
      <StatusBar style="light" backgroundColor="#181e25" />

      <TouchableOpacity
        className="absolute  top-20 left-5"
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
            {isEmailMethod 
              ? "Enter your email to receive a reset link"
              : "Enter your phone number to receive an OTP code"}
          </Text>

          {isEmailMethod ? (
            <TextInput
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              className="bg-white rounded-3xl py-4 px-5 mb-5"
            />
          ) : (
            <TextInput
              placeholder="Enter your phone number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              className="bg-white rounded-3xl py-4 px-5 mb-5"
            />
          )}

          <TouchableOpacity onPress={toggleMethod} className="mb-5">
            <Text className="text-[#7ddd7d] text-center">
              {isEmailMethod 
                ? "Use phone number instead"
                : "Use email instead"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isLoading}
            className="bg-[#7ddd7d] rounded-3xl p-4 items-center justify-center"
          >
            {isLoading ? (
              <Loader />
            ) : (
              <Text className="font-bold text-white">
                Submit
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
    </SafeAreaView>
  );
};

export default ForgetPassword;
