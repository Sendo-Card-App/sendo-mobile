import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, StatusBar, Image, ScrollView } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useNavigation } from "@react-navigation/native";
import Loader from "../../components/Loader";
import Toast from 'react-native-toast-message';
import { useForgotPasswordMutation } from "../../services/Auth/authAPI";
import { useTranslation } from 'react-i18next';

const ForgetPassword = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [forgotPassword] = useForgotPasswordMutation();

  const handleSendEmail = async () => {
    if (!email) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Veuillez saisir votre adresse email',
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await forgotPassword({ email }).unwrap();
      //console.log('Response forget password:', JSON.stringify(response, null, 2));
      Toast.show({
        type: 'success',
        text1: 'Succès',
        text2: response?.message,
      });
      
     navigation.navigate('ResetPassword', { response });
      
    } catch (error) {
        //console.log("Forgot password error:", JSON.stringify(error, null, 2));
     
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error?.data?.message || 'Échec de la demande de réinitialisation',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSignIn = () => {
    navigation.navigate('SignIn');
  };

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
        source={require("../../images/logo2.png")}
        className="mt-10 mb-10 w-28 h-28"
      />

      <ScrollView contentContainerStyle={{ width: '100%', paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
        <View className="w-[85%] bg-[#f1f1f1] rounded-3xl p-5">
          <Text className="text-2xl font-bold text-center mb-5">
            {t('forgotPassword.title')}
          </Text>

          <Text className="text-center mb-5">
            {t('forgotPassword.subtitle')}
          </Text>

          <TextInput
            placeholder={t('forgotPassword.emailPlaceholder')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            className="bg-white rounded-3xl py-4 px-5 mb-5"
          />

          <TouchableOpacity
            onPress={handleSendEmail}
            disabled={isLoading}
            className="bg-[#7ddd7d] rounded-3xl p-4 items-center justify-center"
          >
            {isLoading ? (
              <Loader />
            ) : (
              <Text className="font-bold text-white">
                {t('forgotPassword.sendResetLink')}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity className="mt-5" onPress={handleBackToSignIn}>
          <Text className="text-[#7ddd7d] text-center">
            {t('forgotPassword.backToSignIn')}
          </Text>
        </TouchableOpacity>
      </ScrollView>
      
      <Toast />
    </SafeAreaView>
  );
};

export default ForgetPassword;