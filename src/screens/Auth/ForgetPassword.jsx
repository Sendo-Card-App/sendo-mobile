import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, SafeAreaView, StatusBar, Image } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from "@react-navigation/native";
import Loader from "../../components/Loader"; // Import Loader component

const ForgetPassword = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false); // State to track loading

  const handleSubmit = async () => {
    if (!email) {
      Alert.alert(t('error'), t('emailRequired'));
      return;
    }

    setIsLoading(true); // Start loading

    try {
      // Simulate a delay for password reset logic (replace with actual API call)
      setTimeout(() => {
        Alert.alert("Success", "A reset link has been sent to your email.");
        setIsLoading(false); // Stop loading
      }, 2000);
    } catch (error) {
      setIsLoading(false); // Stop loading on error
      Alert.alert("Error", "An error occurred. Please try again later.");
    }
  };

  const handleToggle = () => {
    navigation.navigate('SignIn'); // Navigate to SignIn screen
  };

  return (
    <SafeAreaView className="bg-[#181e25] flex-1 items-center justify-center">
      <StatusBar style="light" backgroundColor="#181e25" />

      {/* Back Button and Logo */}
      <TouchableOpacity
        className="absolute z-10 top-5 left-5"
        onPress={() => navigation.goBack()}
      >
        <AntDesign name="arrowleft" className="mt-10" size={24} color="white" />
      </TouchableOpacity>

      <Image
        source={require("../../images/LogoSendo.png")}
        className="mt-3 mb-3 w-28 h-28"
      />

      {/* White Background View for Input and Buttons */}
      <View style={{ padding: 30, flex: 1, justifyContent: 'center', width: '75%', height: 50, backgroundColor: 'white', borderRadius: 10 }}>
        <TextInput
          secureTextEntry
          className="border border-gray-300 rounded-lg px-4 py-2 mb-4"
          placeholder={t("forgetPassword.enterEmail")}
          value={email}
          onChangeText={setEmail}
          style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 30, paddingLeft: 10 }}
        />

        {/* Forget Password Link */}
        <TouchableOpacity
          onPress={() => navigation.navigate('Auth')}
        >
          <Text style={{ marginBottom: 10, textAlign: 'right', paddingLeft: 16 }}>
            {t("forgetPassword.forgetPassword")}
          </Text>
        </TouchableOpacity>

        {/* Submit Button */}
        <TouchableOpacity 
          onPress={handleSubmit} 
          className="bg-[#7ddd7d] py-3 rounded-full mb-8"
        >
          <Text className="text-xl text-center font-bold">{t("submit")}</Text>
        </TouchableOpacity>
        
        {/* Loader */}
        {isLoading && <Loader />} {/* Display Loader when isLoading is true */}
      </View>

      <Text className="text-center text-white mt-5">
        {t("alreadyHaveAccount")}
      </Text>

      {/* SignIn Button */}
      <TouchableOpacity onPress={handleToggle}>
        <Text className="border-2 border-[#7ddd7d] rounded-3xl bg-[#181e25] text-[#7ddd7d] py-3 mt-2 px-24">
          {t("signIn")}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default ForgetPassword;
