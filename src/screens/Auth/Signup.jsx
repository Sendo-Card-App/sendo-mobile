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
  const [showReferralCode, setShowReferralCode] = useState(false); // New state for referral code visibility

  const [signupDetails, setSignupDetails] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    referralCode: "",
  });

  const [validationErrors, setValidationErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    referralCode: "",
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
      referralCode: signupDetails.referralCode,
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
      }, 1000);
    }
    return () => dispatch(resetSignupState());
  }, [isSignupSuccess]);

  const openModal = () => setIsModalVisible(true);
  const closeModal = () => setIsModalVisible(false);
  const selectCountry = (country) => {
    setSelectedCountry({ code: country.callingCode, flag: country.flag });
    closeModal();
  };

  const toggleReferralCode = () => {
    setShowReferralCode(!showReferralCode);
    if (!showReferralCode) {
      setSignupDetails(prev => ({ ...prev, referralCode: "" }));
    }
  };

  return (
    <KeyboardAvoidinWrapper>
      <SafeAreaView className="bg-[#181e25] flex-1 items-center justify-center">
        <StatusBar style="light" backgroundColor="#181e25" />

        <TouchableOpacity className="absolute z-10 top-20 left-5" onPress={() => navigation.goBack()}>
          <AntDesign name="arrowleft" size={24} color="white" />
        </TouchableOpacity>

        <Image source={require("../../images/LogoSendo.png")} className="mt-50 mb-3 w-28 h-28" />

        <View className="m-3 flex w-[85%] bg-[#e5e5e5] border-1 mt-3 mx-auto rounded-3xl mb-2 shadow-lg p-5">
            <Text className="mb-2 text-3xl font-bold text-center">
              {t("signup.title")}
            </Text>

            {/* First Name */}
            <Text className="text-sm font-medium text-gray-700 mb-1 pl-3">{t("signup.firstName")}</Text>
            <TextInput
              placeholder={t("signup.firstNamePlaceholder") || "Enter your first name"}
              value={signupDetails.firstName}
              onChangeText={(text) => handleChange("firstName", text)}
              className="border-[#fff] bg-[#ffffff] rounded-3xl mb-2 py-4"
              style={{
                backgroundColor: '#fff',
                borderRadius: 30,
                paddingVertical: 14,
                paddingHorizontal: 20,
                fontSize: 16,
                borderWidth: 1,
                borderColor: validationErrors.firstName ? '#ff4444' : '#ddd',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
              }}
            />
            {validationErrors.firstName && (
              <Text className="text-red-500 text-xs mb-3 pl-3">{validationErrors.firstName}</Text>
            )}

            {/* Last Name */}
            <Text className="text-sm font-medium text-gray-700 mb-1 pl-3">{t("signup.lastName")}</Text>
            <TextInput
              placeholder={t("signup.lastNamePlaceholder") || "Enter your last name"}
              value={signupDetails.lastName}
              onChangeText={(text) => handleChange("lastName", text)}
              className="border-[#fff] bg-[#ffffff] rounded-3xl mb-2 py-4"
              style={{
                backgroundColor: '#fff',
                borderRadius: 30,
                paddingVertical: 14,
                paddingHorizontal: 20,
                fontSize: 16,
                borderWidth: 1,
                borderColor: validationErrors.lastName ? '#ff4444' : '#ddd',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
              }}
            />
            {validationErrors.lastName && (
              <Text className="text-red-500 text-xs mb-3 pl-3">{validationErrors.lastName}</Text>
            )}

            {/* Email */}
            <Text className="text-sm font-medium text-gray-700 mb-1 pl-3">{t("signup.email")}</Text>
            <TextInput
              placeholder={t("signup.emailPlaceholder") || "Enter your email"}
              value={signupDetails.email}
              onChangeText={text => handleChange("email", text)}
              keyboardType="email-address"
              autoCapitalize="none"
              className="border-[#fff] bg-[#ffffff] rounded-3xl mb-2 py-4"
              style={{
                backgroundColor: '#fff',
                borderRadius: 30,
                paddingVertical: 14,
                paddingHorizontal: 20,
                fontSize: 16,
                borderWidth: 1,
                borderColor: validationErrors.email ? '#ff4444' : '#ddd',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
              }}
            />
            {validationErrors.email && (
              <Text className="text-red-500 text-xs mb-3 pl-3">{validationErrors.email}</Text>
            )}

            {/* Phone */}
            <Text className="text-sm font-medium text-gray-700 mb-1 pl-3">{t("signup.phone")}</Text>
            <View className="relative mb-2 flex-row bg-white rounded-3xl overflow-hidden items-center border border-[#ddd]"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
              }}>
              <TouchableOpacity onPress={openModal} className="px-3">
                <Text className="text-lg">{selectedCountry.flag} {selectedCountry.code}</Text>
              </TouchableOpacity>
              <TextInput
                placeholder={t("signup.phonePlaceholder") || "Phone number"}
                value={signupDetails.phone}
                onChangeText={(text) => handleChange("phone", text)}
                keyboardType="phone-pad"
                className="flex-1 py-4 pl-3"
                style={{
                  fontSize: 16,
                  borderColor: validationErrors.phone ? '#ff4444' : 'transparent',
                  borderLeftWidth: 1,
                }}
              />
            </View>
            {validationErrors.phone && (
              <Text className="text-red-500 text-xs mb-3 pl-3">{validationErrors.phone}</Text>
            )}

            {/* Address */}
            <Text className="text-sm font-medium text-gray-700 mb-1 pl-3">{t("signup.address")}</Text>
            <TextInput
              placeholder={t("signup.addressPlaceholder") || "Enter your address"}
              value={signupDetails.address}
              onChangeText={(text) => handleChange("address", text)}
              className="border-[#fff] bg-[#ffffff] rounded-3xl mb-2 py-4"
              style={{
                backgroundColor: '#fff',
                borderRadius: 30,
                paddingVertical: 14,
                paddingHorizontal: 20,
                fontSize: 16,
                borderWidth: 1,
                borderColor: validationErrors.address ? '#ff4444' : '#ddd',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 2,
                elevation: 2,
              }}
            />
            {validationErrors.address && (
              <Text className="text-red-500 text-xs mb-3 pl-3">{validationErrors.address}</Text>
            )}

            {/* Referral Code Toggle */}
            <TouchableOpacity 
              onPress={toggleReferralCode}
              className="mb-3"
            >
              <Text className="text-center text-blue-500">
                {showReferralCode ? t("signup.referralHide") : t("signup.referralToggle")}
              </Text>
            </TouchableOpacity>

            {/* Referral Code (Conditional) */}
            {showReferralCode && (
              <>
                <Text className="text-sm font-medium text-gray-700 mb-1 pl-3">{t("signup.referralCode")}</Text>
                <TextInput
                  placeholder={t("signup.referralPlaceholder") || "Enter referral code (optional)"}
                  value={signupDetails.referralCode}
                  onChangeText={(text) => handleChange("referralCode", text)}
                  className="border-[#fff] bg-[#ffffff] rounded-3xl mb-2 py-4"
                  style={{
                    backgroundColor: '#fff',
                    borderRadius: 30,
                    paddingVertical: 14,
                    paddingHorizontal: 20,
                    fontSize: 16,
                    borderWidth: 1,
                    borderColor: '#ddd',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.1,
                    shadowRadius: 2,
                    elevation: 2,
                  }}
                />
              </>
            )}

            {/* Password */}
            <Text className="text-sm font-medium text-gray-700 mb-1 pl-3">{t("signup.password")}</Text>
            <View className="relative mb-2">
              <TextInput
                placeholder={t("signup.passwordPlaceholder") || "Create a password"}
                value={signupDetails.password}
                onChangeText={(text) => handleChange("password", text)}
                secureTextEntry={!showPassword}
                className="border-[#fff] bg-[#ffffff] rounded-3xl py-4 pr-12"
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 30,
                  paddingVertical: 14,
                  paddingHorizontal: 20,
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: validationErrors.password ? '#ff4444' : '#ddd',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.1,
                  shadowRadius: 2,
                  elevation: 2,
                }}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4"
              >
                <Feather name={showPassword ? "eye-off" : "eye"} size={20} color="gray" />
              </TouchableOpacity>
            </View>
            {validationErrors.password && (
              <Text className="text-red-500 text-xs mb-4 pl-3">{validationErrors.password}</Text>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSignup}
              disabled={isLoading}
              className={`bg-[#7ddd7d] rounded-3xl p-4 items-center justify-center ${isLoading ? "opacity-60" : ""}`}
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 3,
                elevation: 4,
              }}
            >
              {isLoading ? (
                <Loader color="#fff" />
              ) : (
                <Text className="font-bold text-white text-center">
                  {t("signup.buttonText")}
                </Text>
              )}
            </TouchableOpacity>
          </View>

{/* Modal remains exactly the same as your original */}

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
