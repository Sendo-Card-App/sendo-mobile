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
import { useRegisterMutation, useEmailSendMutation } from "../../services/Auth/authAPI";
import {
  signupStart,
  signupSuccess,
  signupFailure,
  resetSignupState,
} from "../../features/Auth/authSlice";
import { useTranslation } from "react-i18next";
import Toast from 'react-native-toast-message';
import Loader from "../../components/Loader";
import DateTimePicker from '@react-native-community/datetimepicker';

const Signup = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [register, { isLoading }] = useRegisterMutation();
  const [emailSend] = useEmailSendMutation();
  const { error, isSignupSuccess } = useSelector((state) => state.auth);

  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState({
    name: 'Cameroon',
    code: '+237',
    flag: 'https://flagcdn.com/w40/cm.png'
  });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showReferralCode, setShowReferralCode] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [signupDetails, setSignupDetails] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    referralCode: "",
    dateOfBirth: "",
    placeOfBirth: ""
  });

  const [validationErrors, setValidationErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    referralCode: "",
    dateOfBirth: "",
    placeOfBirth: ""
  });

  const isValidPhone = (phone) => /^\d+$/.test(phone);
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPassword = (password) => password.length >= 8;
  const isValidDate = (dateStr) => dateStr && dateStr.length > 0;

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
        case "dateOfBirth":
          if (!isValidDate(value)) error = t("signup.invalidDate");
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

   const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
      const formattedDate = selectedDate.toISOString().split('T')[0]; // YYYY-MM-DD
      handleChange("dateOfBirth", formattedDate);
    }
  };

  const validateStep = (step) => {
    let isValid = true;
    
    if (step === 1) {
      isValid = validateField("firstName", signupDetails.firstName) && 
                validateField("lastName", signupDetails.lastName) && 
                validateField("email", signupDetails.email);
    } else if (step === 2) {
      isValid = validateField("dateOfBirth", signupDetails.dateOfBirth) && 
                validateField("placeOfBirth", signupDetails.placeOfBirth) && 
                validateField("phone", signupDetails.phone) && 
                validateField("address", signupDetails.address);
    }
    
    return isValid;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill all fields correctly',
      });
    }
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSignup = async () => {
    if (!validateStep(3)) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill all fields correctly',
      });
      return;
    }

    const payload = {
      firstname: signupDetails.firstName,
      lastname: signupDetails.lastName,
      email: signupDetails.email,
      password: signupDetails.password,
      phone: `${selectedCountry.code}${signupDetails.phone}`,
      address: signupDetails.address,
      referralCode: signupDetails.referralCode,
      dateOfBirth: signupDetails.dateOfBirth,
      placeOfBirth: signupDetails.placeOfBirth
    };
    console.log("Signup payload:", payload);
    try {
      dispatch(signupStart({ phone: signupDetails.phone }));
      const response = await register(payload).unwrap();
       console.log("response from the backend:", response)
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
     console.error("Registration error:", JSON.stringify(err, null, 2));
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
    fetch("https://restcountries.com/v3.1/all?fields=name,idd,flags")
      .then((res) => res.json())
      .then((data) => {
        const countryList = data
          .map((country) => ({
            name: country.name.common,
            flag: country.flags?.png || country.flags?.svg || null,
            callingCode: country.idd?.root
              ? `${country.idd.root}${(country.idd.suffixes || [""])[0]}`
              : null,
          }))
          .filter((c) => c.callingCode && c.flag);
        setCountries(countryList.sort((a, b) => a.name.localeCompare(b.name)));
      })
      .catch((err) => {
        console.error("Failed to fetch countries:", err);
      });
  }, []);

  useEffect(() => {
    if (isSignupSuccess) {
      setTimeout(() => {
        navigation.navigate("OtpVerification", {
          phone: `${selectedCountry.code}${signupDetails.phone}`,
          email: signupDetails.email,
        });
      }, 500);
    }

    return () => dispatch(resetSignupState());
  }, [isSignupSuccess]);

  const openModal = () => setIsModalVisible(true);
  const closeModal = () => setIsModalVisible(false);
  const selectCountry = (country) => {
    setSelectedCountry({ 
      name: country.name,
      code: country.callingCode, 
      flag: country.flag 
    });
    closeModal();
  };

  const toggleReferralCode = () => {
    setShowReferralCode(!showReferralCode);
    if (!showReferralCode) {
      setSignupDetails(prev => ({ ...prev, referralCode: "" }));
    }
  };

  const renderStepIndicator = () => (
    <View className="flex-row justify-center mb-4">
      {[1, 2, 3].map((step) => (
        <View 
          key={step} 
          className={`w-8 h-8 rounded-full mx-2 items-center justify-center 
            ${currentStep === step ? 'bg-[#7ddd7d]' : 'bg-gray-300'}`}
        >
          <Text className="text-white font-bold">{step}</Text>
        </View>
      ))}
    </View>
  );

  const renderStepOne = () => (
    <>
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
          color: '#000'
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
          color: '#000' 
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
          color: '#000' 
        }}
      />
      {validationErrors.email && (
        <Text className="text-red-500 text-xs mb-3 pl-3">{validationErrors.email}</Text>
      )}

      <TouchableOpacity
        onPress={nextStep}
        className={`bg-[#7ddd7d] rounded-3xl p-4 items-center justify-center mt-4`}
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 3,
          elevation: 4,
        }}
      >
        <Text className="font-bold text-white text-center">
         {t("signup.next")}
        </Text>
      </TouchableOpacity>
    </>
  );

  const renderStepTwo = () => (
    <>
      <Text className="mb-2 text-3xl font-bold text-center">
         {t("signup.PD")}
      </Text>

      {/* Date of Birth */}
      <Text className="text-sm font-medium text-gray-700 mb-1 pl-3">  {t("signup.DOB")}</Text>
     <TouchableOpacity
        onPress={() => setShowDatePicker(true)}
        className="border-[#fff] bg-[#ffffff] rounded-3xl mb-2 py-4"
        style={{
          backgroundColor: '#fff',
          borderRadius: 30,
          paddingVertical: 14,
          paddingHorizontal: 20,
          fontSize: 16,
          borderWidth: 1,
          borderColor: validationErrors.dateOfBirth ? '#ff4444' : '#ddd',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
          color: '#000'
        }}
      >
        <Text style={{ color: signupDetails.dateOfBirth ? '#000' : '#888' }}>
          {signupDetails.dateOfBirth || t("signup.dateOfBirthPlaceholder")}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}

      {validationErrors.dateOfBirth && (
        <Text className="text-red-500 text-xs mb-3 pl-3">
          {validationErrors.dateOfBirth}
        </Text>
      )}
    

      {/* Place of Birth */}
      <Text className="text-sm font-medium text-gray-700 mb-1 pl-3">{t("signup.pob")}</Text>
      <TextInput
        placeholder= {t("signup.pfbPlaceholder") || "Enter your place of birth"}
        value={signupDetails.placeOfBirth}
        onChangeText={(text) => handleChange("placeOfBirth", text)}
        className="border-[#fff] bg-[#ffffff] rounded-3xl mb-2 py-4"
        style={{
          backgroundColor: '#fff',
          borderRadius: 30,
          paddingVertical: 14,
          paddingHorizontal: 20,
          fontSize: 16,
          borderWidth: 1,
          borderColor: validationErrors.placeOfBirth ? '#ff4444' : '#ddd',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
          color: '#000'
        }}
      />
      {validationErrors.placeOfBirth && (
        <Text className="text-red-500 text-xs mb-3 pl-3">{validationErrors.placeOfBirth}</Text>
      )}

      {/* Phone */}
      <Text className="text-sm font-medium text-gray-700 mb-1 pl-3">{t("signup.phone")}</Text>
      <View
        className="relative mb-2 flex-row bg-white rounded-3xl overflow-hidden items-center border border-[#ddd]"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
          color: '#000'
        }}
      >
        <TouchableOpacity onPress={openModal} className="px-3 flex-row items-center">
          {selectedCountry.flag ? (
            <Image
              source={{ uri: selectedCountry.flag }}
              style={{ width: 24, height: 16, borderRadius: 2, marginRight: 6 }}
              resizeMode="contain"
            />
          ) : null}
          <Text className="text-lg">{selectedCountry.code}</Text>
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
          color: '#000' 
        }}
      />
      {validationErrors.address && (
        <Text className="text-red-500 text-xs mb-3 pl-3">{validationErrors.address}</Text>
      )}

      <View className="flex-row justify-between mt-4">
        <TouchableOpacity
          onPress={prevStep}
          className={`bg-gray-300 rounded-3xl p-4 items-center justify-center flex-1 mr-2`}
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 3,
            elevation: 4,
          }}
        >
          <Text className="font-bold text-white text-center">
            {t("signup.back")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={nextStep}
          className={`bg-[#7ddd7d] rounded-3xl p-4 items-center justify-center flex-1 ml-2`}
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 3,
            elevation: 4,
          }}
        >
          <Text className="font-bold text-white text-center">
             {t("signup.next")}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderStepThree = () => (
    <>
      <Text className="mb-2 text-3xl font-bold text-center">
        {t("signup.infos")}
      </Text>

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
            color: '#000' 
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
              color: '#000' 
            }}
          />
        </>
      )}

      <View className="flex-row justify-between mt-4">
        <TouchableOpacity
          onPress={prevStep}
          className={`bg-gray-300 rounded-3xl p-4 items-center justify-center flex-1 mr-2`}
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 3,
            elevation: 4,
          }}
        >
          <Text className="font-bold text-white text-center">
            {t("signup.back")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSignup}
          disabled={isLoading}
          className={`bg-[#7ddd7d] rounded-3xl p-4 items-center justify-center flex-1 ml-2 ${isLoading ? "opacity-60" : ""}`}
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
    </>
  );

  return (
    <KeyboardAvoidinWrapper>
      <SafeAreaView className="bg-[#181e25] flex-1 items-center justify-center">
        <StatusBar style="light" backgroundColor="#181e25" />

        <TouchableOpacity className="absolute z-10 top-20 left-5" onPress={() => navigation.goBack()}>
          <AntDesign name="arrowleft" size={24} color="white" />
        </TouchableOpacity>

        <Image source={require("../../images/logo2.png")} className="mt-50 mb-3 w-28 h-28" />

        <View className="m-3 flex w-[85%] bg-[#e5e5e5] border-1 mt-3 mx-auto rounded-3xl mb-2 shadow-lg p-5">
          {renderStepIndicator()}
          
          {currentStep === 1 && renderStepOne()}
          {currentStep === 2 && renderStepTwo()}
          {currentStep === 3 && renderStepThree()}
        </View>

        {/* Sign In link */}
        {currentStep === 1 && (
          <>
            <Text className="text-center text-white mt-1">{t("signup.alreadyHaveAccount")}</Text>
            <TouchableOpacity onPress={handleToggle}>
              <Text className="border-2 border-[#7ddd7d] rounded-3xl bg-[#181e25] text-[#7ddd7d] py-3 mt-2 px-24">
                {t("signup.signIn")}
              </Text>
            </TouchableOpacity>
          </>
        )}

        {/* Country Picker Modal */}
        <Modal visible={isModalVisible} animationType="slide">
          <SafeAreaView className="flex-1 bg-white">
            <FlatList
              data={countries}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className="flex-row items-center p-4 border-b border-gray-200"
                  onPress={() => selectCountry(item)}
                >
                  <Image
                    source={{ uri: item.flag }}
                    style={{ width: 24, height: 16, marginRight: 10, borderRadius: 2 }}
                    resizeMode="contain"
                  />

                  <Text className="text-lg">{item.name} ({item.callingCode})</Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity
              className="absolute bottom-5 left-5 right-5 bg-green-500 py-4 rounded-full"
              onPress={closeModal}
            >
              <Text className="text-white text-center text-lg">{t("common.close")}</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </Modal>

        {/* Loader Overlay */}
        {isLoading && <Loader />}
      </SafeAreaView>
    </KeyboardAvoidinWrapper>
  );
};

export default Signup;