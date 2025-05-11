import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar, 
  Image,
  ScrollView
} from 'react-native';
import { useSelector } from 'react-redux';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from "@react-navigation/native";
import Toast from 'react-native-toast-message';
import { useResetPasswordMutation, useGetUserProfileQuery  } from "../../services/Auth/authAPI";
import Loader from "../../components/Loader";

const ResetPassword = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { token, email, phone } = route.params;
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const accessToken = useSelector((state) => state.auth.accessToken);
  const { data: userProfile, isLoading: isProfileLoading, error: profileError } = useGetUserProfileQuery();
     
console.log('my profile',userProfile)
  console.log('Access Token:', accessToken);
   
  useEffect(() => {
  if (userProfile) {
    console.log('User Profile:', userProfile);
    // Token is in the headers, not typically in the response body
  }
}, [userProfile]);

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

  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  return (
    <SafeAreaView className="bg-[#181e25] flex-1">
      <StatusBar style="light" backgroundColor="#181e25" />

      <ScrollView 
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          className="absolute z-10 top-5 left-5"
          onPress={handleBack}
        >
          <AntDesign name="arrowleft" size={24} color="white" />
        </TouchableOpacity>

        <View className="items-center justify-center py-8">
          <Image
            source={require("../../images/LogoSendo.png")}
            className="w-28 h-28 mb-6"
          />

          <View className="w-[85%] bg-[#f1f1f1] rounded-3xl p-5">
            <Text className="text-2xl font-bold text-center mb-5">
              Reset Password
            </Text>

            <Text className="text-center mb-5">
              {email ? `Reset password for ${email}` : `Reset password for ${phone}`}
            </Text>

            <View className="mb-4">
              <Text className="text-gray-700 font-bold mb-2">New Password</Text>
              <View className="relative">
                <TextInput
                  placeholder="Enter new password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNewPassword}
                  className="bg-white rounded-3xl py-4 px-5 pr-12"
                />
                <TouchableOpacity 
                  className="absolute right-3 top-4"
                  onPress={toggleNewPasswordVisibility}
                >
                  <MaterialIcons 
                    name={showNewPassword ? "visibility-off" : "visibility"} 
                    size={24} 
                    color="#777" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <View className="mb-5">
              <Text className="text-gray-700 font-bold mb-2">Confirm Password</Text>
              <View className="relative">
                <TextInput
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  className="bg-white rounded-3xl py-4 px-5 pr-12"
                />
                <TouchableOpacity 
                  className="absolute right-3 top-4"
                  onPress={toggleConfirmPasswordVisibility}
                >
                  <MaterialIcons 
                    name={showConfirmPassword ? "visibility-off" : "visibility"} 
                    size={24} 
                    color="#777" 
                  />
                </TouchableOpacity>
              </View>
            </View>

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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ResetPassword;