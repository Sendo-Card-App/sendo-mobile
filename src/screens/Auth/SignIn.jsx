import React, { useState, useEffect, useRef } from "react";
import { AntDesign, Ionicons, MaterialIcons } from "@expo/vector-icons"; // Ajout de MaterialIcons
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  StatusBar,
  Linking,
  Platform,
  AppState
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import KeyboardAvoidinWrapper from "../../components/KeyboardAvoidinWrapper";
import { useDispatch } from "react-redux";
import {
  loginStart,
  loginSuccess,
  loginFailure,
} from "../../features/Auth/authSlice";
import { refreshAuthToken } from "../../utils/authUtils";
import Communications from "react-native-communications"; 
import { setIsNewUser } from '../../features/Auth/passcodeSlice';
import { useLoginWithEmailMutation, useLoginWithPhoneMutation  } from "../../services/Auth/authAPI";
import { useTranslation } from "react-i18next";
import Loader from "../../components/Loader";
import Toast from "react-native-toast-message"; 
import { storeData, getData  } from "../../services/storage";
import { useAppState } from '../../context/AppStateContext';

const SignIn = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [loginWithEmail, { isLoading }] = useLoginWithEmailMutation();
  const [loginWithPhone] = useLoginWithPhoneMutation();
  const { setIsPickingDocument } = useAppState();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(null);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const isAutoFilling = useRef(false);
  const autofillTimeoutRef = useRef(null);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground - autofill might have just happened
        console.log('App has come to the foreground');
        if (isAutoFilling.current) {
          // Reset the autofill state after a short delay
          autofillTimeoutRef.current = setTimeout(() => {
            isAutoFilling.current = false;
            setIsPickingDocument(false);
          }, 1000);
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
      if (autofillTimeoutRef.current) {
        clearTimeout(autofillTimeoutRef.current);
      }
    };
  }, [setIsPickingDocument]);

  // Set app state to prevent restart during navigation and async operations
  useEffect(() => {
    // Set app state when component mounts to handle autofill
    setIsPickingDocument(true);
    
    // Cleanup when component unmounts
    return () => {
      setIsPickingDocument(false);
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      if (autofillTimeoutRef.current) {
        clearTimeout(autofillTimeoutRef.current);
      }
    };
  }, [setIsPickingDocument, refreshInterval]);

  const handleEmailChange = (text) => {
    setEmail(text);
    // If text changes rapidly (autofill), set the flag
    if (text.length > 0 && !isAutoFilling.current) {
      isAutoFilling.current = true;
      setIsPickingDocument(true);
    }
  };

  const handlePasswordChange = (text) => {
    setPassword(text);
    // If text changes rapidly (autofill), set the flag
    if (text.length > 0 && !isAutoFilling.current) {
      isAutoFilling.current = true;
      setIsPickingDocument(true);
    }
  };

  const handleEmailFocus = () => {
    setIsPickingDocument(true);
    isAutoFilling.current = false;
  };

  const handleEmailBlur = () => {
    // Delay reset to allow for autofill completion
    autofillTimeoutRef.current = setTimeout(() => {
      if (!isAutoFilling.current) {
        setIsPickingDocument(false);
      }
    }, 300);
  };

  const handlePasswordFocus = () => {
    setIsPickingDocument(true);
    isAutoFilling.current = false;
  };

  const handlePasswordBlur = () => {
    // Delay reset to allow for autofill completion
    autofillTimeoutRef.current = setTimeout(() => {
      if (!isAutoFilling.current) {
        setIsPickingDocument(false);
      }
    }, 300);
  };

  // Reset autofill state when both fields have values
  useEffect(() => {
    if (email && password && isAutoFilling.current) {
      // Autofill likely completed, reset after a delay
      const timer = setTimeout(() => {
        isAutoFilling.current = false;
        setIsPickingDocument(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [email, password, setIsPickingDocument]);

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
      setIsPickingDocument(true);
      
      const response = await loginWithEmail({ email, password }).unwrap();

      if (response?.status === 200 && response?.data?.accessToken) {
        const userData = response.data;

        const authData = {
          user: userData,
          accessToken: userData.accessToken,
          refreshToken: userData.refreshToken,
          deviceId: userData.deviceId,
          isGuest: false,
        };
        
        console.log(userData)
        await storeData('@authData', authData);
        dispatch(loginSuccess(authData)); 
        dispatch(setIsNewUser(true));
        
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
        }, 30 * 60 * 1000);

        setRefreshInterval(interval);
        
        setIsPickingDocument(false);
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
      setIsPickingDocument(false);

      let errorMessage = "An error on the server.";

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
    setIsPickingDocument(true);
    navigation.navigate("Signup");
  };

  const handleNavigation = (screenName) => {
    setIsPickingDocument(true);
    navigation.navigate(screenName);
  };

  const handleGoBack = () => {
    setIsPickingDocument(true);
    navigation.goBack();
  };

  // Remplacer WhatsApp par le chat live
  // const handleCustomerServicePress = () => {
  //   setIsPickingDocument(true);
  //   navigation.navigate("ChatScreen");
  // };

  return (
    <KeyboardAvoidinWrapper>
      <SafeAreaView className="bg-[#181e25] flex-1 items-center justify-center">
        <StatusBar style="light" backgroundColor="#181e25" />
        <TouchableOpacity
          className="absolute z-10 top-20 left-5"
          onPress={handleGoBack}
        >
          <AntDesign name="left" size={24} color="white" />
        </TouchableOpacity>

        <Image
          source={require("../../images/logo2.png")}
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
              ref={emailInputRef}
              placeholder={t("signIn.emailPlaceholder") || "Enter your email address"}
              onChangeText={handleEmailChange}
              onFocus={handleEmailFocus}
              onBlur={handleEmailBlur}
              value={email}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              textContentType="emailAddress"
              importantForAutofill="yes"
              autoCorrect={false}
              spellCheck={false}
              className="border-[#fff] bg-[#ffffff] rounded-3xl mb-3"
              style={{
                backgroundColor: '#fff',
                borderRadius: 30,
                paddingVertical: 14,
                paddingHorizontal: 20,
                fontSize: 16,
                borderWidth: 1,
                borderColor: '#ddd',
                color: '#000'
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
                ref={passwordInputRef}
                placeholder={t("signIn.passwordPlaceholder") || "Enter your password"}
                onChangeText={handlePasswordChange}
                onFocus={handlePasswordFocus}
                onBlur={handlePasswordBlur}
                value={password}
                secureTextEntry={!showPassword}
                autoComplete="password"
                textContentType="password"
                importantForAutofill="yes"
                autoCorrect={false}
                spellCheck={false}
                className="border-[#fff] bg-[#ffffff] rounded-3xl"
                style={{
                  backgroundColor: '#fff',
                  borderRadius: 30,
                  paddingVertical: 14,
                  paddingHorizontal: 20,
                  fontSize: 16,
                  borderWidth: 1,
                  borderColor: '#ddd',
                  color: '#000'
                }}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: 15, top: 12 }}
              >
                  <AntDesign
                    name={showPassword ? "eye" : "eye"}
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
            disabled={isLoading}
          >
            {isLoading ? (
              <View style={{
                backgroundColor: '#7ddd7d',
                borderRadius: 30,
                paddingVertical: 16,
                paddingHorizontal: 20,
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Loader size="small" />
              </View>
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
            onPress={() => handleNavigation("ForgetPassword")}
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
            onPress={() => handleNavigation("LogIn")}
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

        {/* ✅ Remplacer WhatsApp par le bouton de service client - Chat live */}
        {/* <TouchableOpacity 
          onPress={handleCustomerServicePress}
          style={{
            position: 'absolute',
            bottom: 30,
            right: 30,
            backgroundColor: '#007AFF', // Bleu pour le chat
            width: 60,
            height: 60,
            borderRadius: 30,
            justifyContent: 'center',
            alignItems: 'center',
            elevation: 5,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
          }}
        >
          <MaterialIcons name="chat" size={32} color="white" />
        </TouchableOpacity> */}
      </SafeAreaView>
    </KeyboardAvoidinWrapper>
  );
};

export default SignIn;