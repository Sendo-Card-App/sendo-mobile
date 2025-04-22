import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  StatusBar,
  Image,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from "@react-navigation/native";
import { AntDesign } from "@expo/vector-icons";
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

const Signup = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [register, { isLoading }] = useRegisterMutation();
  const { error,  isSignupSuccess  } = useSelector((state) => state.auth);

  const [isToggled, setIsToggled] = useState(false);
  const firstIcon = require("../../images/Artboard 1.png");
  const secondIcon = require("../../images/Artboard 2 copy 2.png");

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
    const prefix = isToggled ? "+1" : "+237";
    return phone.startsWith(prefix) || /^\d+$/.test(phone);
  };

  const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const isValidPassword = (password) => {
    return password.length >= 8;
  };

  const validateField = (name, value) => {
    let error = "";

    if (!value) {
      error = t("signup.fieldRequired");
    } else {
      switch (name) {
        case "email":
          if (!isValidEmail(value)) error = t("signup.invalidEmail");
          break;
        case "phone":
          if (!isValidPhone(value))
            error = t("signup.invalidPhone");
          break;
        case "password":
          if (!isValidPassword(value))
            error = t("signup.invalidPassword");
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
      phone: isToggled ? `+1${signupDetails.phone}` : `+237${signupDetails.phone}`,
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
      return;
    }
  
    try {
      dispatch(signupStart({ phone: signupDetails.phone }));
      const response = await register(payload).unwrap();
      // Store the access token if it exists in the response
      if (response.accessToken) {
        await AsyncStorage.setItem('@accessToken', response.accessToken);
      }
      dispatch(signupSuccess(response));
    } catch (err) {
     
      
      // Create a serializable error object
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
  
      Alert.alert(t("error"), errorMessage);
    }
  };

  const handleToggle = () => {
    navigation.navigate("SignIn");
  };

  useEffect(() => {
    if (isSignupSuccess) {
      Alert.alert(t("success"), t("signup.successMessage"));
      setTimeout(() => {
        navigation.navigate("OtpVerification");
      }, 2000);
    }
  }, [isSignupSuccess]);

  useEffect(() => {
    return () => {
      dispatch(resetSignupState());
    };
  }, []);

  return (
    <KeyboardAvoidinWrapper>
      <SafeAreaView className="bg-[#181e25] flex-1 items-center justify-center">
        <StatusBar style="light" backgroundColor="#181e25" />

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

        <View className="m-3 flex w-[85%] bg-[#f1f1f1] border-1 mt-3 mx-auto rounded-3xl mb-2 shadow-lg p-5">
          <Text className="mt-5 mb-5 text-3xl font-bold text-center">
            {t("signup.title")}
          </Text>

          {/* First Name */}
          <TextInput
            placeholder={t("signup.firstName")}
            value={signupDetails.firstName}
            onChangeText={(text) => handleChange("firstName", text)}
            className="border-[#fff] bg-[#ffffff] rounded-3xl mb-5 py-5 text-center"
          />
          {validationErrors.firstName && (
            <Text className="text-red-500 text-xs mb-2 text-center">
              {validationErrors.firstName}
            </Text>
          )}

          {/* Last Name */}
          <TextInput
            placeholder={t("signup.lastName")}
            value={signupDetails.lastName}
            onChangeText={(text) => handleChange("lastName", text)}
            className="border-[#fff] bg-[#ffffff] rounded-3xl mb-5 py-5 text-center"
          />
          {validationErrors.lastName && (
            <Text className="text-red-500 text-xs mb-2 text-center">
              {validationErrors.lastName}
            </Text>
          )}

          {/* Email */}
          <TextInput
            placeholder={t("signup.email")}
            value={signupDetails.email}
            onChangeText={(text) => handleChange("email", text)}
            keyboardType="email-address"
            autoCapitalize="none"
            className="border-[#fff] bg-[#ffffff] rounded-3xl mb-5 py-5 text-center"
          />
          {validationErrors.email && (
            <Text className="text-red-500 text-xs mb-2 text-center">
              {validationErrors.email}
            </Text>
          )}

          {/* Phone */}
          <View className="relative mb-5">
            <TextInput
              placeholder={isToggled ? "CANADA(+1) Phone" : "CAMEROUN(+237) Phone"}
              value={signupDetails.phone}
              onChangeText={(text) => handleChange("phone", text)}
              className="border-[#fff] bg-[#ffffff] rounded-3xl py-5 text-center pl-10"
              keyboardType="phone-pad"
            />
            <TouchableOpacity
              onPress={() => setIsToggled(!isToggled)}
              className="absolute left-3 top-1/2 transform -translate-y-1/2"
            >
              <Image
                source={isToggled ? secondIcon : firstIcon}
                className="w-12 h-12"
              />
            </TouchableOpacity>
            {validationErrors.phone && (
              <Text className="text-red-500 text-xs mb-2 text-center">
                {validationErrors.phone}
              </Text>
            )}
          </View>

          {/* Address */}
          <TextInput
            placeholder={t("signup.address")}
            value={signupDetails.address}
            onChangeText={(text) => handleChange("address", text)}
            className="border-[#fff] bg-[#ffffff] rounded-3xl mb-5 py-5 text-center"
          />
          {validationErrors.address && (
            <Text className="text-red-500 text-xs mb-2 text-center">
              {validationErrors.address}
            </Text>
          )}

          {/* Password */}
          <TextInput
            placeholder={t("signup.password")}
            value={signupDetails.password}
            onChangeText={(text) => handleChange("password", text)}
            secureTextEntry
            className="border-[#fff] bg-[#ffffff] rounded-3xl mb-8 py-5 text-center"
          />
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
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="font-bold text-center">{t("signup.buttonText")}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Sign In link */}
        <Text className="text-center text-white mt-5">{t("signup.alreadyHaveAccount")}</Text>
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
