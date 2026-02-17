import 'react-native-get-random-values';
import React, { useState, useEffect } from "react";
import { AntDesign, Feather } from "@expo/vector-icons";
import Icon from 'react-native-vector-icons/Ionicons';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StatusBar,
  Modal,
  FlatList,
  ActivityIndicator
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import KeyboardAvoidinWrapper from "../../components/KeyboardAvoidinWrapper";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { loginSuccess } from "../../features/Auth/authSlice";
import Loader from "../../components/Loader";
import { storeData } from "../../services/storage";
import Toast from 'react-native-toast-message';
import { useLoginWithPhoneMutation } from "../../services/Auth/authAPI";
import { useAppState } from '../../context/AppStateContext'; // Adjust path as needed

const Log = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [loginWithPhone, { isLoading }] = useLoginWithPhoneMutation();
  const { setIsPickingDocument } = useAppState(); // Get the setter from context

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Hardcoded countries array with only Cameroon and Canada
  const countries = [
    {
      name: 'Cameroon',
      code: '+237',
      flag: 'https://flagcdn.com/w40/cm.png'
    },
    {
      name: 'Canada',
      code: '+1',
      flag: 'https://flagcdn.com/w40/ca.png'
    }
  ];

  const [filteredCountries, setFilteredCountries] = useState(countries);
  const [fullPhoneNumber, setFullPhoneNumber] = useState(""); 
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState({
    name: 'Cameroon',
    code: '+237',
    flag: 'https://flagcdn.com/w40/cm.png'
  });

  // Set app state to prevent restart when modal opens
  useEffect(() => {
    if (countryModalVisible || languageModalVisible) {
      setIsPickingDocument(true);
    } else {
      setIsPickingDocument(false);
    }

    // Cleanup when component unmounts
    return () => {
      setIsPickingDocument(false);
    };
  }, [countryModalVisible, languageModalVisible, setIsPickingDocument]);

  useEffect(() => {
    if (phone && selectedCountry.code) {
      setFullPhoneNumber(`${selectedCountry.code}${phone}`);
    }
  }, [phone, selectedCountry.code]);

  // Filter countries based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCountries(countries);
    } else {
      const filtered = countries.filter(country => 
        country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        country.code.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCountries(filtered);
    }
  }, [searchQuery]);

  const handleLogin = async () => {
    if (!phone || !password) {
      Toast.show({ type: 'error', text1: 'Phone and password are required' });
      return;
    }

    try {
      setIsPickingDocument(true); // Prevent restart during login process
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
      console.error('Login error:', error);
      Toast.show({
        type: 'error',
        text1: error.data?.message || 'Login failed',
      });
    } finally {
      setIsPickingDocument(false); // Reset after login process completes
    }
  };

  const handleGuestLogin = () => {
    navigation.navigate("GuestLogin", { isGuest: true });
  };

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    setLanguageModalVisible(false);
  };

  const handleCountryModalToggle = (visible) => {
    setCountryModalVisible(visible);
    setIsPickingDocument(visible);
  };

  const handleLanguageModalToggle = (visible) => {
    setLanguageModalVisible(visible);
    setIsPickingDocument(visible);
  };

  const renderCountry = ({ item }) => (
    <TouchableOpacity
      onPress={() => {
        setSelectedCountry(item);
        handleCountryModalToggle(false);
        setSearchQuery(""); // Clear search when country is selected
      }}
      className="flex-row items-center py-3 px-4 border-b border-gray-200"
    >
      <Image source={{ uri: item.flag }} className="w-8 h-6 mr-3" resizeMode="contain" />
      <View>
        <Text className="text-base font-medium">{item.name}</Text>
        <Text className="text-sm text-gray-500">{item.code}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <>
      <KeyboardAvoidinWrapper>
        <SafeAreaView className="flex-1 bg-[#181e25] justify-center items-center">
          <StatusBar barStyle="light-content" backgroundColor="#181e25" />

          <View className="absolute top-14 w-full px-6 flex-row justify-between z-10">
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <AntDesign name="left" size={24} color="white" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => handleLanguageModalToggle(true)}>
               <Feather name="globe" size={18} color="white" />
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
                  onPress={() => handleLanguageModalToggle(false)}
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
                onPress={() => handleCountryModalToggle(true)}
                className="flex-row items-center bg-white py-3 px-4 rounded-l-2xl border-r border-gray-200"
              >
                <Image source={{ uri: selectedCountry.flag }} className="w-8 h-6 mr-2" resizeMode="contain" />
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

          {/* Country Selection Modal */}
          <Modal visible={countryModalVisible} animationType="slide">
            <SafeAreaView className="flex-1 bg-white">
              {/* Header with back button and title */}
              <View className="flex-row items-center px-4 py-3 pt-10 border-b border-gray-200">
                <TouchableOpacity 
                  onPress={() => handleCountryModalToggle(false)}
                  className="p-2 mr-2"
                >
                  <AntDesign name="left" size={24} color="black" />
                </TouchableOpacity>
                <Text className="text-xl font-bold flex-1 text-center">
                  {t("log.select_country")}
                </Text>
                <View style={{ width: 40 }} /> 
              </View>

              {/* Search Bar */}
              <View className="px-4 py-3 border-b border-gray-200">
                <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
                  <AntDesign name="search" size={20} color="gray" />
                  <TextInput
                    placeholder={t("log.search_country")}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    className="flex-1 ml-2 text-base"
                    autoFocus={true}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery("")}>
                      <AntDesign name="closecircle" size={18} color="gray" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {filteredCountries.length === 0 ? (
                <View className="flex-1 justify-center items-center">
                  <Text className="text-gray-500 text-lg">
                    {t("log.no_countries_found")}
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={filteredCountries}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={renderCountry}
                  contentContainerStyle={{ paddingVertical: 10 }}
                  initialNumToRender={20}
                  windowSize={10}
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