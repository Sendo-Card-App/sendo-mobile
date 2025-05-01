import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  Modal,
  FlatList,
  TextInput as RNTextInput,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from "@react-navigation/native";
import { AntDesign } from "@expo/vector-icons";
import { Feather } from '@expo/vector-icons';
import KeyboardAvoidinWrapper from "../../components/KeyboardAvoidinWrapper";
import { useDispatch, useSelector } from "react-redux";
import { useRegisterMutation } from "../../services/Auth/authAPI";
import {
  signupStart,
  signupSuccess,
  signupFailure,
  resetSignupState,
} from "../../features/Auth/authSlice";
import { useTranslation } from "react-i18next";
import Toast from 'react-native-toast-message';
import Loader from "../../components/Loader";

const Signup = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [register, { isLoading }] = useRegisterMutation();
  const { error, isSignupSuccess } = useSelector((state) => state.auth);

  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState({ code: "+237", flag: "🇨🇲" });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [signupDetails, setSignupDetails] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    address: "",
  });

  const [validationErrors, setValidationErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    address: "",
  });

  const isValidPhone = (phone) => {
    return /^\d+$/.test(phone);
  };

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPassword = (password) => password.length >= 8;

  const validateField = (name, value) => {
    let error = "";

    if (!value) {
      error = t("signup.fieldRequired");
    } else {
      switch (name) {
        case "email":
          if (!isValidEmail(value)) error = t("signup.invalidEmail");
          break;
        case "password":
          if (!isValidPassword(value)) error = t("signup.invalidPassword");
          break;
        case "phone":
          if (!isValidPhone(value)) error = t("signup.invalidPhone");
          break;
      }
    }

    setValidationErrors((prev) => ({ ...prev, [name]: error }));
    return !error;
  };

  const handleChange = (name, value) => {
    setSignupDetails((prev) => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleSignup = async () => {
    const isFirstNameValid = validateField("firstName", signupDetails.firstName);
    const isLastNameValid = validateField("lastName", signupDetails.lastName);
    const isEmailValid = validateField("email", signupDetails.email);
    const isPhoneValid = validateField("phone", signupDetails.phone);
    const isPasswordValid = validateField("password", signupDetails.password);
    const isAddressValid = validateField("address", signupDetails.address);

    const payload = {
      firstname: signupDetails.firstName,
      lastname: signupDetails.lastName,
      email: signupDetails.email,
      password: signupDetails.password,
      phone: `${selectedCountry.code}${signupDetails.phone}`,
      address: signupDetails.address,
    };

    if (
      !isFirstNameValid ||
      !isLastNameValid ||
      !isEmailValid ||
      !isPhoneValid ||
      !isPasswordValid ||
      !isAddressValid
    ) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill all fields correctly',
      });
      return;
    }

    try {
      dispatch(signupStart({ phone: signupDetails.phone }));
      const response = await register(payload).unwrap();

      if (response.accessToken) {
        await AsyncStorage.setItem('@accessToken', response.accessToken);
      }

      dispatch(signupSuccess(response));
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Account created successfully',
      });
    } catch (err) {
      const errorData = {
        message: err?.data?.message || "Registration failed",
        status: err?.status,
        data: err?.data
      };

      dispatch(signupFailure(errorData));

      let errorMessage = "Registration failed. Please try again.";
      if (err?.data?.message) {
        if (err.data.message.includes("email")) errorMessage = "This email is already used.";
        else if (err.data.message.includes("phone")) errorMessage = "This phone is already used.";
        else errorMessage = err.data.message;
      }

      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
      });
    }
  };

  const handleToggle = () => {
    navigation.navigate("SignIn");
  };

  useEffect(() => {
    fetch("https://restcountries.com/v3.1/all")
      .then((res) => res.json())
      .then((data) => {
        const countryList = data
          .map((country) => ({
            name: country.name.common,
            flag: country.flag,
            callingCode: country.idd?.root ? `${country.idd.root}${(country.idd.suffixes || [""])[0]}` : null,
          }))
          .filter((c) => c.callingCode);
        setCountries(countryList.sort((a, b) => a.name.localeCompare(b.name)));
      });
  }, []);

  useEffect(() => {
    if (isSignupSuccess) {
      setTimeout(() => {
        navigation.navigate("OtpVerification", { phone: `${selectedCountry.code}${signupDetails.phone}` });
      }, 2000);
    }
    return () => dispatch(resetSignupState());
  }, [isSignupSuccess]);

  const openModal = () => setIsModalVisible(true);
  const closeModal = () => setIsModalVisible(false);
  const selectCountry = (country) => {
    setSelectedCountry({ code: country.callingCode, flag: country.flag });
    closeModal();
  };

  return (
    <KeyboardAvoidinWrapper>
      <SafeAreaView className="bg-[#181e25] flex-1 items-center justify-center">
        <StatusBar style="light" backgroundColor="#181e25" />

        <TouchableOpacity className="absolute z-10 top-20 left-5" onPress={() => navigation.goBack()}>
          <AntDesign name="arrowleft" size={24} color="white" />
        </TouchableOpacity>

        <Image source={require("../../images/LogoSendo.png")} className="mt-50 mb-3 w-28 h-28" />

        <View className="m-3 flex w-[85%] bg-[#f1f1f1] border-1 mt-3 mx-auto rounded-3xl mb-2 shadow-lg p-5">
          <Text className=" mb-2 text-3xl font-bold text-center">
            {t("signup.title")}
          </Text>

          {/* First Name */}
          <TextInput
            placeholder={t("signup.firstName")}
            value={signupDetails.firstName}
            onChangeText={(text) => handleChange("firstName", text)}
            className="border-[#fff] bg-[#ffffff] rounded-3xl mb-5 py-5 text-center"
            style={{
              backgroundColor: '#fff',
              borderRadius: 30,
              paddingVertical: 16,
              paddingHorizontal: 20,
              textAlign: 'center',
              fontSize: 16,
              // Shadow for iOS
              shadowColor: '#f0',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 10,
              shadowRadius: 1,
              // Shadow for Android
              elevation: 6,
              borderColor: validationErrors.email ? '#fff' : 'transparent',
              borderWidth: validationErrors.email ? 1 : 0,
            }}
          />
          {validationErrors.firstName && (
            <Text className="text-red-500 text-xs mb-2 text-center">{validationErrors.firstName}</Text>
          )}

          {/* Last Name */}
          <TextInput
            placeholder={t("signup.lastName")}
            value={signupDetails.lastName}
            onChangeText={(text) => handleChange("lastName", text)}
            className="border-[#fff] bg-[#ffffff] rounded-3xl mb-5 py-5 text-center"
            style={{
              backgroundColor: '#fff',
              borderRadius: 30,
              paddingVertical: 16,
              paddingHorizontal: 20,
              textAlign: 'center',
              fontSize: 16,
              // Shadow for iOS
              shadowColor: '#f0',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 10,
              shadowRadius: 1,
              // Shadow for Android
              elevation: 6,
              borderColor: validationErrors.email ? '#fff' : 'transparent',
              borderWidth: validationErrors.email ? 1 : 0,
            }}
          />
          {validationErrors.lastName && (
            <Text className="text-red-500 text-xs mb-2 text-center">{validationErrors.lastName}</Text>
          )}

            <TextInput
                    placeholder={t("signup.email")}
                    value={signupDetails.email}
                    onChangeText={text => handleChange("email", text)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={{
                      backgroundColor: '#fff',
                      borderRadius: 30,
                      paddingVertical: 16,
                      paddingHorizontal: 20,
                      textAlign: 'center',
                      fontSize: 16,
                      // Shadow for iOS
                      shadowColor: '#f0',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 10,
                      shadowRadius: 1,
                      // Shadow for Android
                      elevation: 6,
                      borderColor: validationErrors.email ? '#fff' : 'transparent',
                      borderWidth: validationErrors.email ? 1 : 0,
                    }}
                  />
                  {validationErrors.email ? (
                    <Text style={{ color: '#f00', fontSize: 12, marginTop: 9, textAlign: 'center' }}>
                      {validationErrors.email}
                    </Text>
                  ) : null}

          {/* Phone */}
          <View className="relative mb-5 mt-5 flex-row bg-white rounded-3xl overflow-hidden items-center">
            <TouchableOpacity onPress={openModal} className="px-3">
              <Text className="text-lg">{selectedCountry.flag} {selectedCountry.code}</Text>
            </TouchableOpacity>
            <RNTextInput
              placeholder="Phone number"
              value={signupDetails.phone}
              onChangeText={(text) => handleChange("phone", text)}
              keyboardType="phone-pad"
              className="flex-1 py-5 pl-3"
              style={{
                backgroundColor: '#fff',
                borderRadius: 30,
                paddingVertical: 16,
                paddingHorizontal: 20,
                textAlign: 'center',
                fontSize: 16,
                // Shadow for iOS
                shadowColor: '#f0',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 10,
                shadowRadius: 1,
                // Shadow for Android
                elevation: 6,
                borderColor: validationErrors.email ? '#fff' : 'transparent',
                borderWidth: validationErrors.email ? 1 : 0,
              }}
            />
          </View>
          {validationErrors.phone && (
            <Text className="text-red-500 text-xs mb-2 text-center">{validationErrors.phone}</Text>
          )}

          {/* Modal */}
          <Modal visible={isModalVisible} animationType="slide">
            <SafeAreaView className="flex-1 bg-white">
              <FlatList
                data={countries}
                keyExtractor={(item) => `${item.name}-${item.callingCode}`}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    className="p-4 border-b border-gray-200"
                    
                    onPress={() => selectCountry(item)}
                  >
                    <Text className="text-lg">{item.flag} {item.name} ({item.callingCode})</Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity onPress={closeModal} className="p-4 bg-gray-200">
                <Text className="text-center text-lg">Close</Text>
              </TouchableOpacity>
            </SafeAreaView>
          </Modal>

          {/* Address */}
          <TextInput
            placeholder={t("signup.address")}
            value={signupDetails.address}
            onChangeText={(text) => handleChange("address", text)}
            className="border-[#fff] bg-[#ffffff] rounded-3xl mb-5 py-5 text-center"
            style={{
              backgroundColor: '#fff',
              borderRadius: 30,
              paddingVertical: 16,
              paddingHorizontal: 20,
              textAlign: 'center',
              fontSize: 16,
              // Shadow for iOS
              shadowColor: '#f0',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 10,
              shadowRadius: 1,
              // Shadow for Android
              elevation: 6,
              borderColor: validationErrors.email ? '#fff' : 'transparent',
              borderWidth: validationErrors.email ? 1 : 0,
            }}
          />
          {validationErrors.address && (
            <Text className="text-red-500 text-xs mb-2 text-center">{validationErrors.address}</Text>
          )}

          {/* Password */}
          <View className="relative mb-8">
            <TextInput
              placeholder={t("signup.password")}
              value={signupDetails.password}
              onChangeText={(text) => handleChange("password", text)}
              secureTextEntry={!showPassword}
              className="border-[#fff] bg-[#ffffff] rounded-3xl py-5 pr-12 pl-4 text-center"
              style={{
                backgroundColor: '#fff',
                borderRadius: 30,
                paddingVertical: 16,
                paddingHorizontal: 20,
                textAlign: 'center',
                fontSize: 16,
                // Shadow for iOS
                shadowColor: '#f0',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 10,
                shadowRadius: 1,
                // Shadow for Android
                elevation: 6,
                borderColor: validationErrors.email ? '#fff' : 'transparent',
                borderWidth: validationErrors.email ? 1 : 0,
              }}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-5"
            >
              <Feather name={showPassword ? "eye-off" : "eye"} size={20} color="gray" />
            </TouchableOpacity>
          </View>

          {validationErrors.password && (
            <Text className="text-red-500 text-xs mb-5 text-center">
              {validationErrors.password}
            </Text>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            onPress={handleSignup}
            disabled={isLoading}
            className={`border-[#7ddd7d] border-2 bg-[#7ddd7d] rounded-3xl p-4 items-center justify-center ${isLoading ? "opacity-60" : ""}`}
            style={{
             
              borderRadius: 30,
              paddingVertical: 16,
              paddingHorizontal: 20,
              textAlign: 'center',
              fontSize: 16,
              // Shadow for iOS
              shadowColor: '#fff',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 10,
              shadowRadius: 1,
              // Shadow for Android
              elevation: 6,
              borderColor: validationErrors.email ? '#fff' : 'transparent',
              borderWidth: validationErrors.email ? 1 : 0,
            }}
          >
            {isLoading ? <Loader /> : <Text className="font-bold text-center">{t("signup.buttonText")}</Text>}
          </TouchableOpacity>
        </View>

        {/* Sign In link */}
        <Text className="text-center text-white mt-1">{t("signup.alreadyHaveAccount")}</Text>
        <TouchableOpacity onPress={handleToggle}>
          <Text className="border-2 border-[#7ddd7d] rounded-3xl bg-[#181e25] text-[#7ddd7d] py-3 mt-2 px-24">
            {t("signup.signIn")}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </KeyboardAvoidinWrapper>
  );
};

export default Signup;
