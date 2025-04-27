import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, StatusBar, Image } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useNavigation, useRoute } from "@react-navigation/native";
import Toast from 'react-native-toast-message';
import { useResetPasswordMutation } from "../../services/Auth/authAPI";
import Loader from "../../components/Loader";

const ResetPassword = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { token, email, phone } = route.params;
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const handleSubmit = async () => {
    if (!newPassword || !confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Both password fields are required',
      });
      return;
    }

    if (newPassword.length < 8) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Password must be at least 8 characters',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Passwords do not match',
      });
      return;
    }

    try {
      await resetPassword({ token, newPassword }).unwrap();
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Password has been reset successfully',
      });
      
      // Navigate to sign in after successful password reset
      navigation.navigate('SignIn');
    } catch (error) {
      console.log("Reset password error:", error);
      let errorMessage = 'An error occurred while resetting your password. Please try again.';
      
      if (error.data?.status === 500) {
        errorMessage = 'Failed to update password. Please try again.';
      }
      
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
      });
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView className="bg-[#181e25] flex-1 items-center justify-center">
      <StatusBar style="light" backgroundColor="#181e25" />

      <TouchableOpacity
        className="absolute z-10 top-5 left-5"
        onPress={handleBack}
      >
        <AntDesign name="arrowleft" size={24} color="white" />
      </TouchableOpacity>

      <Image
        source={require("../../images/LogoSendo.png")}
        className="mt-3 mb-3 w-28 h-28"
      />

      <View className="w-[85%] bg-[#f1f1f1] rounded-3xl p-5">
        <Text className="text-2xl font-bold text-center mb-5">
          Reset Password
        </Text>

        <Text className="text-center mb-5">
          {email ? `Reset password for ${email}` : `Reset password for ${phone}`}
        </Text>

        <TextInput
          placeholder="New Password"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          className="bg-white rounded-3xl py-4 px-5 mb-4"
        />

        <TextInput
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          className="bg-white rounded-3xl py-4 px-5 mb-5"
        />

        <TouchableOpacity
          onPress={handleSubmit}
          disabled={isLoading}
          className="bg-[#7ddd7d] rounded-3xl p-4 items-center justify-center"
        >
          {isLoading ? (
            <Loader />
          ) : (
            <Text className="font-bold text-white">
              Reset Password
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ResetPassword;