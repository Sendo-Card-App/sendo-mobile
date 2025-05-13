import React, { useState, useEffect } from "react";
import { AntDesign } from "@expo/vector-icons";
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import KeyboardAvoidinWrapper from "../../components/KeyboardAvoidinWrapper";
import { useDispatch } from "react-redux";
import {
  loginStart,
  loginSuccess,
  loginFailure,
} from "../../features/Auth/authSlice";
import { refreshAuthToken } from "../../utils/authUtils";
import { setIsNewUser } from '../../features/Auth/passcodeSlice';
import { useLoginWithEmailMutation, useLoginWithPhoneMutation  } from "../../services/Auth/authAPI";
import { useTranslation } from "react-i18next";
import Loader from "../../components/Loader";
import Toast from "react-native-toast-message"; 
import { storeData, getData  } from "../../services/storage"; // Import the storage utility

const SignIn = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginWithEmail, { isLoading }] = useLoginWithEmailMutation();
  const [loginWithPhone] = useLoginWithPhoneMutation();
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [emailError, setEmailError] = useState(false);
  const [loading, setLoading] = React.useState(true);
  const [passwordError, setPasswordError] = useState(false);
  
 useEffect(() => {
     const checkAuthData = async () => {
       try {
         const authData = await getData('@authData');
         if (authData?.accessToken) {
           dispatch(loginSuccess(authData));
           navigation.replace("SignIn");
         } else {
           navigation.replace("AUTH");
         }
       } catch (error) {
         console.log("Error checking auth data:", error);
         navigation.replace("Auth");
       } finally {
         setLoading(false); // stop loader once done
       }
     };
   
     checkAuthData();
   }, [])
   

   useEffect(() => {
    const setupTokenRefresh = async () => {
      // Clear any existing interval
      if (refreshInterval) clearInterval(refreshInterval);

      const authData = await getData('@authData');
      if (authData?.refreshToken && authData?.deviceId) {
        // Set up new interval to refresh token every 30 minutes
        const interval = setInterval(async () => {
          try {
            const result = await loginWithPhone({
              refreshToken: authData.refreshToken,
              deviceId: authData.deviceId
            }).unwrap();

            if (result?.data?.accessToken) {
              const newAuthData = {
                ...authData,
                accessToken: result.data.accessToken,
                refreshToken: result.data.refreshToken || authData.refreshToken
              };
              
              await storeData('@authData', newAuthData);
              dispatch(loginSuccess(newAuthData));
            }
          } catch (error) {
            console.log("Token refresh failed:", error);
            clearInterval(interval);
          }
        }, 30 * 60 * 1000); // 30 minutes

        setRefreshInterval(interval);
      }
    };

    setupTokenRefresh();

    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, []);

  
  const handleSubmit = async () => {
    let hasError = false;
  
    if (!email) {
      setEmailError(true);
      hasError = true;
    } else {
      setEmailError(false);
    }
  
    if (!password) {
      setPasswordError(true);
      hasError = true;
    } else {
      setPasswordError(false);
    }
  
    if (hasError) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please fill in all required fields',
      });
      return;
    }
  
    dispatch(loginStart({ email }));
  
    try {
      // 1. Login with Email
      const response = await loginWithEmail({ email, password }).unwrap();
  
      if (response?.status === 200 && response?.data?.accessToken) {
        const userData = response.data;
  
         const authData = {
          user: userData,
          accessToken: userData.accessToken,
          refreshToken: userData.refreshToken, // Store refresh token
          deviceId: userData.deviceId,
          isGuest: false,
        };
        console.log(userData)
        await storeData('@authData', authData);
        dispatch(loginSuccess(authData)); 
        dispatch(setIsNewUser(true)); // <-- THIS IS CRUCIAL
        const interval = setInterval(async () => {
          try {
            const result = await loginWithPhone({
              refreshToken: authData.refreshToken,
              deviceId: authData.deviceId
            }).unwrap();

            if (result?.data?.accessToken) {
              const newAuthData = {
                ...authData,
                accessToken: result.data.accessToken,
                refreshToken: result.data.refreshToken || authData.refreshToken
              };
              
              await storeData('@authData', newAuthData);
              dispatch(loginSuccess(newAuthData));
            }
          } catch (error) {
            console.log("Token refresh failed:", error);
            clearInterval(interval);
          }
        }, 30 * 60 * 1000); // 30 minutes

        setRefreshInterval(interval);
        navigation.navigate("PinCode", { setup: true }); 
  
        Toast.show({
          type: 'success',
          text1: 'Login Successful',
          text2: response.message || 'Welcome back!',
        });
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (err) {
      console.log("Login error:", err);
  
      let errorMessage = "An error occurred during login.";
  
      if (err?.status === 403) {
        errorMessage = "Account Not Verified.";
      } else if (err?.status === 500) {
        errorMessage = "Could not connect. Please try again.";
      } else if (err?.status === 401) {
        errorMessage = "Invalid Email or Password.";
      } else if (err?.status === 404) {
        errorMessage = "User Not Found.";
      } else if (err?.data?.message) {
        errorMessage = err.data.message;
      }
  
      dispatch(loginFailure(errorMessage));
  
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: errorMessage,
      });
    }
  };
  
  

  const handleToggle = () => {
    navigation.navigate("Signup");
  };
  if (loading) return <Loader />;

  return (
    <KeyboardAvoidinWrapper>
      <SafeAreaView className="bg-[#181e25] flex-1 items-center justify-center">
        <StatusBar style="light" backgroundColor="#181e25" />
        <TouchableOpacity
          className="absolute z-10 top-20 left-5"
          onPress={() => navigation.goBack()}
        >
          <AntDesign name="arrowleft" size={24} color="white" />
        </TouchableOpacity>

        <Image
          source={require("../../images/LogoSendo.png")}
          className="mt-3 mb-3 w-28 h-28"
        />

        <View className="w-[80%] bg-gray-200 border-1 mt-3 pb-0 mx-auto rounded-3xl mb-2 px-5" style={{backgroundColor: '#e5e5e5'}}>
  <View className="mt-5 mb-5">
    <Text className="text-3xl font-bold flex-start">{t("signIn.title")}</Text>
  </View>

  {/* Email Field with Label */}
  <View className="mb-1">
    <Text className="text-sm font-medium text-gray-700 mb-1 pl-3">{t("signIn.email")}</Text>
    <TextInput
      placeholder={t("signIn.emailPlaceholder") || "Enter your email address"}
      onChangeText={setEmail}
      value={email}
      autoCapitalize="none"
      keyboardType="email-address"
      className="border-[#fff] bg-[#ffffff] rounded-3xl mb-3"
      style={{
        backgroundColor: '#fff',
        borderRadius: 30,
        paddingVertical: 14,
        paddingHorizontal: 20,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#ddd',
      }}
    />
  </View>
  {emailError && (
    <Text className="text-red-500 text-sm mb-2 pl-3">
      Email is required
    </Text>
  )}

  {/* Password Field with Label */}
  <View className="mb-1">
    <Text className="text-sm font-medium text-gray-700 mb-1 pl-3">{t("signIn.password")}</Text>
    <View className="relative">
      <TextInput
        placeholder={t("signIn.passwordPlaceholder") || "Enter your password"}
        onChangeText={setPassword}
        value={password}
        secureTextEntry={!showPassword}
        className="border-[#fff] bg-[#ffffff] rounded-3xl"
        style={{
          backgroundColor: '#fff',
          borderRadius: 30,
          paddingVertical: 14,
          paddingHorizontal: 20,
          fontSize: 16,
          borderWidth: 1,
          borderColor: '#ddd',
        }}
      />
      <TouchableOpacity
        onPress={() => setShowPassword(!showPassword)}
        style={{ position: "absolute", right: 15, top: 12 }}
      >
        <AntDesign
          name={showPassword ? "eye" : "eyeo"}
          size={24}
          color="gray"
        />
      </TouchableOpacity>
    </View>
  </View>
  {passwordError && (
    <Text className="text-red-500 text-sm mb-2 pl-3">
      Password is required
    </Text>
  )}

  {/* Submit Button */}
  <TouchableOpacity 
    onPress={handleSubmit}
    className="mt-6"
  >
    {isLoading ? (
      <Loader />
    ) : (
      <View style={{
        backgroundColor: '#7ddd7d',
        borderRadius: 30,
        paddingVertical: 16,
        paddingHorizontal: 20,
      }}>
        <Text className="text-center font-bold text-white" style={{fontSize: 16}}>
          {t("signIn.next")}
        </Text>
      </View>
    )}
  </TouchableOpacity>

  {/* Forgot Password Link */}
  <TouchableOpacity 
    onPress={() => navigation.navigate("ForgetPassword")}
    className="mt-4"
  >
    <Text style={{ textAlign: "right", color: '#555', fontSize: 14 }}>
      {t("signIn.forgotPassword")}
    </Text>
  </TouchableOpacity>

  {/* Divider */}
  <View className="flex-row items-center mt-5 mb-5">
    <View className="flex-1 h-px bg-gray-300"></View>
    <Text className="px-3 text-gray-500">{t("signIn.orSignInWith")}</Text>
    <View className="flex-1 h-px bg-gray-300"></View>
  </View>

  {/* OTP Login Option */}
  <TouchableOpacity 
    onPress={() => navigation.navigate("LogIn")}
    className="mb-5"
  >
    <Text className="text-center text-blue-600 font-medium">
      {t("signIn.otpLogin") || "Login with OTP"}
    </Text>
  </TouchableOpacity>
</View>

        <Text className="text-center text-white mt-5">
          {t("signIn.dontHaveAccount")}
        </Text>

        <TouchableOpacity onPress={handleToggle}>
          <Text className="border-2 border-[#7ddd7d] rounded-3xl bg-[#181e25] text-[#7ddd7d] py-3 mt-2 px-24">
            {t("signIn.signUp")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity  onPress={() => navigation.navigate("GuestLogin")}>
          <Text className="text-[#7ddd7d] underline mt-2">
            {t("signIn.guestUser")}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </KeyboardAvoidinWrapper>
  );
};

export default SignIn;