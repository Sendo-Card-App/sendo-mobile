import 'react-native-get-random-values';
import React, { useState, useEffect } from "react";
import { AntDesign } from "@expo/vector-icons";
import Icon from 'react-native-vector-icons/Ionicons';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Modal,
  FlatList,
  ActivityIndicator
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import KeyboardAvoidinWrapper from "../../components/KeyboardAvoidinWrapper";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../../features/Auth/authSlice";
import Loader from "../../components/Loader";
import { storeData } from "../../services/storage";
import Toast from 'react-native-toast-message';
import { useLoginWithPhoneMutation } from "../../services/Auth/authAPI";

const Log = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [loginWithPhone, { isLoading }] = useLoginWithPhoneMutation();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [countries, setCountries] = useState([]);
  const [fullPhoneNumber, setFullPhoneNumber] = useState(""); 
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState({
    name: 'Cameroon',
    code: '+237',
    flag: 'https://flagcdn.com/w40/cm.png'
  });

const fetchCountries = async () => {
  try {
    const res = await fetch('https://restcountries.com/v3.1/all?fields=name,idd,flags');

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();

    const countriesList = data
      .map(c => {
        const name = c?.name?.common;
        const root = c?.idd?.root || '';
        const suffixes = c?.idd?.suffixes || [];
        let code = suffixes.length > 0 ? `${root}${suffixes[0]}` : root;

        if (!name || !code) return null;

        if (!code.startsWith('+')) {
          code = '+' + code;
        }

        const flag = c?.flags?.png || c?.flags?.svg || null;

        return { name, code, flag };
      })
      .filter(Boolean)
      .sort((a, b) => a.name.localeCompare(b.name));

    setCountries(countriesList);
  } catch (error) {
    console.log("Error fetching countries:", error);
    Toast.show({ type: 'error', text1: 'Failed to load countries' });
  }
};



  useEffect(() => {
    fetchCountries();
  }, []);

  useEffect(() => {
    if (phone && selectedCountry.code) {
      setFullPhoneNumber(`${selectedCountry.code}${phone}`);
    }
  }, [phone, selectedCountry.code]);

  const handleLogin = async () => {
    if (!phone || !password) {
      Toast.show({ type: 'error', text1: 'Phone and password are required' });
      return;
    }

    try {
      const response = await loginWithPhone({
        phone: fullPhoneNumber,
        password
      }).unwrap();

      if (response.status === 200) {
        const { accessToken, deviceId } = response.data;
        
        // Store the authentication data
        await storeData('authData', {
          accessToken,
          deviceId,
          phone: fullPhoneNumber
        });

        dispatch(loginSuccess({
          accessToken,
          deviceId,
          phone: fullPhoneNumber
        }));

        Toast.show({ type: 'success', text1: response.message });
        navigation.navigate("PinCode");
      }
    } catch (error) {
      //console.error('Login error:', error);
      Toast.show({
        type: 'error',
        text1: error.data?.message || 'Login failed',
      });
    }
  };

  const handleGuestLogin = () => {
    navigation.navigate("GuestLogin", { isGuest: true });
  };

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    setLanguageModalVisible(false);
  };

  const renderCountry = ({ item }) => (
    <TouchableOpacity
      onPress={() => {
        setSelectedCountry(item);
        setCountryModalVisible(false);
      }}
      className="flex-row items-center py-3 px-4 border-b border-gray-200"
    >
      <Image source={{ uri: item.flag }} className="w-8 h-6 mr-3" />
      <Text className="text-lg">{`${item.name} (${item.code})`}</Text>
    </TouchableOpacity>
  );

  return (
    <>
      <KeyboardAvoidinWrapper>
        <SafeAreaView className="flex-1 bg-[#181e25] justify-center items-center">
          <StatusBar barStyle="light-content" backgroundColor="#181e25" />

          <View className="absolute top-14 w-full px-6 flex-row justify-between z-10">
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <AntDesign name="arrowleft" size={24} color="white" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setLanguageModalVisible(true)}>
              <Icon name="language" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Language Modal */}
          <Modal animationType="slide" transparent visible={languageModalVisible}>
            <View className="flex-1 justify-center items-center bg-black/50">
              <View className="w-4/5 bg-white rounded-xl p-6">
                <Text className="text-xl font-bold mb-4 text-center">{t("log.select")}</Text>
                <TouchableOpacity 
                  onPress={() => changeLanguage("en")}
                  className="py-3 border-b border-gray-200"
                >
                  <Text className="text-lg text-center">{t("log.en")}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => changeLanguage("fr")}
                  className="py-3 border-b border-gray-200"
                >
                  <Text className="text-lg text-center">{t("log.fr")}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setLanguageModalVisible(false)}
                  className="mt-4"
                >
                  <Text className="text-red-500 text-lg text-center">{t("log.close")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Logo */}
          <Image 
            source={require("../../images/logo2.png")} 
            className="w-24 h-24 mb-8" 
          />

          {/* Login Form */}
          <View className="w-4/5 bg-[#f1f1f1] rounded-3xl p-6 items-center">
            <Text className="text-2xl font-bold mb-6">{t("log.title")}</Text>

            {/* Combined Country Code and Phone Input */}
            <View className="flex-row w-full mb-4">
              <TouchableOpacity 
                onPress={() => setCountryModalVisible(true)}
                className="flex-row items-center bg-white py-3 px-4 rounded-l-2xl border-r border-gray-200"
              >
                <Image source={{ uri: selectedCountry.flag }} className="w-8 h-6 mr-2" />
                <Text className="font-bold text-lg">{selectedCountry.code}</Text>
              </TouchableOpacity>
              
              <TextInput
                placeholder={t("signup.phone")}
                onChangeText={setPhone}
                value={phone}
                keyboardType="phone-pad"
                className="flex-1 bg-white py-4 px-6 rounded-r-2xl text-lg"
                maxLength={10}
              />
            </View>

            <View className="relative w-full mb-6">
              <TextInput
                placeholder={t("signIn.password")}
                onChangeText={setPassword}
                value={password}
                secureTextEntry={!showPassword}
                className="bg-white w-full py-4 px-6 rounded-2xl text-center text-lg"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-4"
              >
                <Icon name={showPassword ? "eye-off" : "eye"} size={20} color="gray" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              onPress={handleLogin}
              disabled={isLoading}
              className={`w-full py-4 rounded-2xl items-center ${isLoading ? 'bg-[#7ddd7d]' : 'bg-[#7ddd7d]'}`}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-lg">{t("log.login")}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => navigation.navigate('ForgetPassword')}
              className="self-end mt-3"
            >
              <Text className="text-gray-600">{t("log.forgetPassword")}</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-white mt-8">{t("signIn.dontHaveAccount")}</Text>
          
          <TouchableOpacity 
            onPress={() => navigation.navigate('Signup')}
            className="border-2 border-[#7ddd7d] rounded-2xl px-10 py-2 mt-3"
          >
            <Text className="text-[#7ddd7d] font-medium">{t("signIn.signUp")}</Text>
          </TouchableOpacity>
          {/*           
          <TouchableOpacity 
            onPress={handleGuestLogin}
            className="mt-4"
          >
            <Text className="text-[#7ddd7d] underline">{t("signIn.guestUser")}</Text>
          </TouchableOpacity> */}

          {/* Country Selection Modal */}
          <Modal visible={countryModalVisible} animationType="slide">
            <SafeAreaView className="flex-1 bg-white">
              {countries.length === 0 ? (
                <View className="flex-1 justify-center items-center">
                  <ActivityIndicator size="large" color="#7ddd7d" />
                </View>
              ) : (
                <FlatList
                  data={countries}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={renderCountry}
                  contentContainerStyle={{ paddingVertical: 20 }}
                />
              )}
            </SafeAreaView>
          </Modal>
        </SafeAreaView>
      </KeyboardAvoidinWrapper>
      <Toast />
    </>
  );
};

export default Log;