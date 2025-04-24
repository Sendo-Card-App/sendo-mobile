import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, StatusBar, Image } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from "@react-navigation/native";
import Loader from "../../components/Loader";
import Toast from 'react-native-toast-message';
import { useForgotPasswordMutation } from "../../services/Auth/authAPI";

const ForgetPassword = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const handleSubmit = async () => {
    if (!email) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Email is required',
      });
      return;
    }

    try {
      await forgotPassword(email).unwrap();

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'A reset link has been sent to your email.',
      });

      setEmail("");
    } catch (error) {
      console.log("Forgot password error:", error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'An error occurred. Please try again later.',
      });
    }
  };

  const handleToggle = () => {
    navigation.navigate('SignIn');
  };

  return (
    <SafeAreaView className="bg-[#181e25] flex-1 items-center justify-center">
      <StatusBar style="light" backgroundColor="#181e25" />

      <TouchableOpacity
        className="absolute z-10 top-5 left-5"
        onPress={() => navigation.goBack()}
      >
        <AntDesign name="arrowleft" size={24} color="white" />
      </TouchableOpacity>

      <Image
        source={require("../../images/LogoSendo.png")}
        className="mt-3 mb-3 w-28 h-28"
      />

      <View className="w-[85%] bg-[#f1f1f1] rounded-3xl p-5">
        <Text className="text-2xl font-bold text-center mb-5">
          {t("forgetPassword.title")}
        </Text>

        <Text className="text-center mb-5">
          {t("forgetPassword.instructions")}
        </Text>

        <TextInput
          placeholder={t("forgetPassword.emailPlaceholder")}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
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
              {t("forgetPassword.submitButton")}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity className="mt-5" onPress={handleToggle}>
        <Text className="text-[#7ddd7d] text-center">
          {t("forgetPassword.backToSignIn")}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default ForgetPassword;
