import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Image,
  Modal,
  FlatList,
  TextInput as RNTextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
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

  // Hardcoded countries array with only Cameroon and Canada
  const countries = [
    {
      name: 'Cameroon',
      code: '+237',
      flag: 'https://flagcdn.com/w40/cm.png',
      callingCode: '+237'
    },
    {
      name: 'Canada',
      code: '+1',
      flag: 'https://flagcdn.com/w40/ca.png',
      callingCode: '+1'
    }
  ];

  const [filteredCountries, setFilteredCountries] = useState(countries);
  const [selectedCountry, setSelectedCountry] = useState({
    name: 'Cameroon',
    code: '+237',
    flag: 'https://flagcdn.com/w40/cm.png'
  });
  const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showReferralCode, setShowReferralCode] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Calculate minimum date (18 years ago from today)
  const calculateMinDate = () => {
    const today = new Date();
    const minDate = new Date(
      today.getFullYear() - 18,
      today.getMonth(),
      today.getDate()
    );
    return minDate;
  };

  // Calculate maximum date (100 years ago from today)
  const calculateMaxDate = () => {
    const today = new Date();
    const maxDate = new Date(
      today.getFullYear() - 100,
      today.getMonth(),
      today.getDate()
    );
    return maxDate;
  };

  const minDate = calculateMinDate();
  const maxDate = calculateMaxDate();

  // Filtrage des pays basé sur la recherche
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCountries(countries);
    } else {
      const filtered = countries.filter(country =>
        country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        country.callingCode.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCountries(filtered);
    }
  }, [searchQuery]);

  const [signupDetails, setSignupDetails] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    referralCode: "",
    dateOfBirth: "",
    placeOfBirth: "",
    country: "Cameroon" // Default country
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
    placeOfBirth: "",
    country: ""
  });

  const isValidPhone = (phone) => /^\d+$/.test(phone);
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPassword = (password) => password.length >= 8;
  
  // Function to check if user is at least 18 years old
  const isValidDateOfBirth = (dateStr) => {
    if (!dateStr) return false;
    
    const selectedDate = new Date(dateStr);
    const today = new Date();
    
    // Calculate age
    let age = today.getFullYear() - selectedDate.getFullYear();
    const monthDiff = today.getMonth() - selectedDate.getMonth();
    
    // Adjust age if birthday hasn't occurred yet this year
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < selectedDate.getDate())) {
      age--;
    }
    
    return age >= 18;
  };

  const isValidDate = (dateStr) => {
    if (!dateStr) return false;
    return isValidDateOfBirth(dateStr);
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
        case "password":
          if (!isValidPassword(value)) error = t("signup.invalidPassword");
          break;
        case "phone":
          if (!isValidPhone(value)) error = t("signup.invalidPhone");
          break;
        case "dateOfBirth":
          if (!isValidDate(value)) {
            // Check which error to show
            if (value) {
              const selectedDate = new Date(value);
              const today = new Date();
              let age = today.getFullYear() - selectedDate.getFullYear();
              const monthDiff = today.getMonth() - selectedDate.getMonth();
              
              if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < selectedDate.getDate())) {
                age--;
              }
              
              if (age < 18) {
                error = t("signup.ageRestriction") || "You must be at least 18 years old";
              } else {
                error = t("signup.invalidDate") || "Invalid date of birth";
              }
            } else {
              error = t("signup.fieldRequired");
            }
          }
          break;
        case "country":
          if (!value) error = t("signup.countryRequired");
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
      
      // Check age immediately after date selection
      if (!isValidDateOfBirth(formattedDate)) {
        Toast.show({
          type: 'error',
          text1: t('signup.ageErrorTitle') || 'Age Restriction',
          text2: t('signup.ageRestriction') || 'You must be at least 18 years old',
        });
      }
    }
  };

  const validateStep = (step) => {
    let isValid = true;
    
    if (step === 1) {
      isValid = validateField("firstName", signupDetails.firstName) && 
                validateField("lastName", signupDetails.lastName) && 
                validateField("email", signupDetails.email);
    } else if (step === 2) {
      // Special check for date of birth to show clear message
      if (!isValidDateOfBirth(signupDetails.dateOfBirth)) {
        setValidationErrors(prev => ({
          ...prev,
          dateOfBirth: t("signup.ageRestriction") || "You must be at least 18 years old"
        }));
        isValid = false;
      } else {
        isValid = validateField("dateOfBirth", signupDetails.dateOfBirth) && 
                  validateField("placeOfBirth", signupDetails.placeOfBirth) && 
                  validateField("phone", signupDetails.phone) && 
                  validateField("address", signupDetails.address) &&
                  validateField("country", signupDetails.country);
      }
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

    // Final age validation before submission
    if (!isValidDateOfBirth(signupDetails.dateOfBirth)) {
      Toast.show({
        type: 'error',
        text1: t('signup.ageErrorTitle') || 'Age Restriction',
        text2: t('signup.ageRestriction') || 'You must be at least 18 years old',
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
      placeOfBirth: signupDetails.placeOfBirth,
      country: signupDetails.country // Add country to payload
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

  const openCountryModal = () => setIsCountryModalVisible(true);
  const closeCountryModal = () => setIsCountryModalVisible(false);
  
  const selectCountry = (country) => {
    setSelectedCountry({ 
      name: country.name,
      code: country.callingCode, 
      flag: country.flag 
    });
    handleChange("country", country.name); // Update the country field in form
    closeCountryModal();
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

  const renderCountry = ({ item }) => (
    <TouchableOpacity
      onPress={() => selectCountry(item)}
      className="flex-row items-center px-4 py-3 border-b border-gray-100"
    >
      {item.flag ? (
        <Image
          source={{ uri: item.flag }}
          style={{ width: 30, height: 20, borderRadius: 3, marginRight: 12 }}
          resizeMode="contain"
        />
      ) : (
        <View style={{ width: 30, height: 20, marginRight: 12 }} />
      )}
      <View className="flex-1">
        <Text className="text-base font-medium">{item.name}</Text>
        <Text className="text-sm text-gray-500">{item.callingCode}</Text>
      </View>
      {selectedCountry.name === item.name && (
        <AntDesign name="check" size={20} color="#7ddd7d" />
      )}
    </TouchableOpacity>
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
      <View className="mb-2">
        <Text className="text-sm font-medium text-gray-700 mb-1 pl-3">
          {t("signup.DOB")} <Text className="text-gray-500 text-xs">({t("signup.minAge") || "Must be 18+"})</Text>
        </Text>
        <TouchableOpacity
          onPress={() => setShowDatePicker(true)}
          className="border-[#fff] bg-[#ffffff] rounded-3xl py-4"
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
          <View className="flex-row justify-between items-center">
            <Text style={{ color: signupDetails.dateOfBirth ? '#000' : '#888' }}>
              {signupDetails.dateOfBirth || t("signup.dateOfBirthPlaceholder")}
            </Text>
            <AntDesign name="calendar" size={20} color="#888" />
          </View>
        </TouchableOpacity>
        
        {validationErrors.dateOfBirth ? (
          <Text className="text-red-500 text-xs mt-2 pl-3">
            {validationErrors.dateOfBirth}
          </Text>
        ) : signupDetails.dateOfBirth && isValidDateOfBirth(signupDetails.dateOfBirth) ? (
          <Text className="text-green-600 text-xs mt-2 pl-3 flex-row items-center">
            <AntDesign name="checkcircle" size={12} color="#10B981" style={{ marginRight: 4 }} />
            {t("signup.ageVerified") || "Age verified (18+)"}
          </Text>
        ) : null}
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={minDate} // Can't select dates after 18 years ago
          minimumDate={maxDate} // Can't select dates before 100 years ago
        />
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

      {/* Country */}
      <Text className="text-sm font-medium text-gray-700 mb-1 pl-3">{t("signup.country")}</Text>
      <TouchableOpacity
        onPress={openCountryModal}
        className="border-[#fff] bg-[#ffffff] rounded-3xl mb-2 py-4 flex-row items-center justify-between px-4"
        style={{
          backgroundColor: '#fff',
          borderRadius: 30,
          paddingVertical: 14,
          paddingHorizontal: 20,
          fontSize: 16,
          borderWidth: 1,
          borderColor: validationErrors.country ? '#ff4444' : '#ddd',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
        }}
      >
        <Text style={{ color: signupDetails.country ? '#000' : '#888' }}>
          {signupDetails.country || t("signup.selectCountry")}
        </Text>
        <AntDesign name="down" size={16} color="#888" />
      </TouchableOpacity>
      {validationErrors.country && (
        <Text className="text-red-500 text-xs mb-3 pl-3">{validationErrors.country}</Text>
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
        <TouchableOpacity onPress={openCountryModal} className="px-3 flex-row items-center">
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
          disabled={!isValidDateOfBirth(signupDetails.dateOfBirth)}
          className={`${isValidDateOfBirth(signupDetails.dateOfBirth) ? 'bg-[#7ddd7d]' : 'bg-gray-400'} rounded-3xl p-4 items-center justify-center flex-1 ml-2`}
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
          disabled={isLoading || !isValidDateOfBirth(signupDetails.dateOfBirth)}
          className={`${isValidDateOfBirth(signupDetails.dateOfBirth) ? 'bg-[#7ddd7d]' : 'bg-gray-400'} rounded-3xl p-4 items-center justify-center flex-1 ml-2 ${isLoading ? "opacity-60" : ""}`}
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
          <AntDesign name="left" size={24} color="white" />
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
        <Modal visible={isCountryModalVisible} animationType="slide" transparent={false}>
          <SafeAreaView className="flex-1 bg-white">
            {/* Header avec bouton retour et titre */}
            <View className="flex-row items-center px-4 py-3 border-b border-gray-200">
              <TouchableOpacity 
                onPress={closeCountryModal}
                className="p-2 mr-2"
              >
                <AntDesign name="left" size={24} color="black" />
              </TouchableOpacity>
              <Text className="text-xl font-bold flex-1 text-center">
                {t("signup.select_country")}
              </Text>
              <View style={{ width: 40 }} /> 
            </View>

            {/* Barre de recherche */}
            <View className="px-4 py-3 border-b pt-10 border-gray-200">
              <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
                <AntDesign name="search" size={20} color="gray" />
                <TextInput
                  placeholder={t("signup.search_country")}
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

            {/* Liste des pays */}
            {filteredCountries.length === 0 ? (
              <View className="flex-1 justify-center items-center">
                <Text className="text-gray-500 text-lg">
                  {t("signup.no_countries_found")}
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

        {/* Loader Overlay */}
        {isLoading && <Loader />}
      </SafeAreaView>
    </KeyboardAvoidinWrapper>
  );
};

export default Signup;