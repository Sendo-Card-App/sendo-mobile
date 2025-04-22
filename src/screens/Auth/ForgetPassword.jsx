import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, SafeAreaView, StatusBar, Image } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from "@react-navigation/native";

const ForgetPassword = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [email, setEmail] = useState('');

  const handleSubmit = () => {
    // Add your password update logic here with validation...
    Alert.alert("Success", "A reset link has been sent to your email.");
  };

  const handleToggle = () => {
    navigation.navigate('SignIn'); // Ensure you have your Sign In screen declared in the navigation stack.
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
      <View style={{ padding: 30, flex: 1, justifyContent: 'center', width: '75%',height: 50, backgroundColor: 'white', borderRadius: 10 }}>
        <TextInput
          secureTextEntry
          className="border border-gray-300 rounded-lg px-4 py-2 mb-4"
          placeholder="Enter Your Email"
          value={email}
          onChangeText={setEmail}
          style={{ height: 40, borderColor: 'gray', borderWidth: 1, marginBottom: 30, paddingLeft: 10 }}
        /> 

        <TouchableOpacity
          onPress={() => navigation.navigate('Auth')}
        >
          <Text style={{ marginBottom: 10, textAlign: 'right', paddingLeft: 16 }}>
            Forget Password
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={handleSubmit} 
          className="bg-[#7ddd7d] py-3 rounded-full mb-8"
        >
          <Text className="text-xl text-center font-bold">SOUMETTRE</Text>
        </TouchableOpacity>
      </View>

      <Text className="text-center text-white mt-5">
        Already have an account?
      </Text>
              
      <TouchableOpacity onPress={handleToggle}>
        <Text className="border-2 border-[#7ddd7d] rounded-3xl bg-[#181e25] text-[#7ddd7d] py-3 mt-2 px-24">
          SIGN IN
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default ForgetPassword;
