import React, { useState } from "react";
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
import { v4 as uuidv4 } from "uuid";
import {
  loginStart,
  loginSuccess,
  loginFailure,
} from "../../features/Auth/authSlice";
import { useLoginWithEmailMutation } from "../../services/Auth/authAPI";
import { useTranslation } from "react-i18next";
import Loader from "../../components/Loader";
import SweetAlert from "react-native-sweet-alert";

const SignIn = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginWithEmail, { isLoading }] = useLoginWithEmailMutation();
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);

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

    if (hasError) return;

    const deviceId = uuidv4();
    dispatch(loginStart({ email, deviceId }));

    try {
      const response = await loginWithEmail({ email, password, deviceId }).unwrap();

      if (response?.accessToken && response?.user) {
        dispatch(loginSuccess({ ...response, deviceId }));
        navigation.navigate("Home");

        SweetAlert.showAlertWithOptions({
          title: "Success",
          subTitle: "Login Successful!",
          style: "success",
        });
      } else {
        SweetAlert.showAlertWithOptions({
          title: "Login Failed",
          subTitle: "Unknown error occurred.",
          style: "error",
        });
      }
    } catch (err) {
      console.log("Login error:", err);
      let errorMessage = "An error occurred during login.";
      if (err?.status === 403) {
        errorMessage = "Account Not Verified.";
      } else if (err?.status === 500) {
        errorMessage = "Could not connect. Please try again.";
      }

      dispatch(loginFailure(errorMessage));

      SweetAlert.showAlertWithOptions({
        title: "Login Failed",
        subTitle: errorMessage,
        style: "error",
      });
    }
  };

  const signInFacebook = () => {
    console.log("Sign in with Facebook");
  };

  const signInGoogle = () => {
    console.log("Sign in with Google");
  };

  const handleToggle = () => {
    navigation.navigate("Signup");
  };

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

        <View className="w-[80%] bg-[#f1f1f1] border-1 mt-3 pb-0 mx-auto rounded-3xl mb-2 px-5">
          <View className="mt-5 mb-5">
            <Text className="text-3xl font-bold flex-start">{t("signIn.title")}</Text>
          </View>

          <TextInput
            placeholder={t("signIn.email")}
            onChangeText={setEmail}
            value={email}
            autoCapitalize="none"
            keyboardType="email-address"
            className="border-[#fff] bg-[#ffffff] rounded-3xl text-center mb-2 py-5"
          />
          {emailError && (
            <Text className="text-red-500 text-center mb-2">
              Email is required
            </Text>
          )}

          <View className="relative">
            <TextInput
              placeholder={t("signIn.password")}
              onChangeText={setPassword}
              value={password}
              secureTextEntry={!showPassword}
              className="border-[#fff] bg-[#ffffff] rounded-3xl text-center mb-2 py-5"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={{ position: "absolute", right: 10, top: 12 }}
            >
              <AntDesign
                name={showPassword ? "eye" : "eyeo"}
                size={24}
                color="gray"
              />
            </TouchableOpacity>
          </View>
          {passwordError && (
            <Text className="text-red-500 text-center mb-2">
             Password is required
            </Text>
          )}

          <TouchableOpacity onPress={handleSubmit}>
            {isLoading ? (
              <Loader />
            ) : (
              <Text className="text-center mt-3 border-1-[#7ddd7d] bg-[#7ddd7d] rounded-3xl p-4 font-bold">
                {t("signIn.next")}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate("ForgetPassword")}>
            <Text style={{ marginTop: 20, textAlign: "right", paddingLeft: 16 }}>
              {t("signIn.forgotPassword")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity>
            <Text className="mt-5 text-center">
              {t("signIn.loginWith")}
            </Text>
          </TouchableOpacity>
          <Text className="text-center opacity-20">{t("signIn.orSignInWith")}</Text>

          <View className="flex-row items-center justify-center space-x-4">
            <TouchableOpacity onPress={signInFacebook}>
              <Image
                className="w-28 h-28"
                source={require("../../images/Artboard 2.png")}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={signInGoogle}>
              <Image
                className="w-28 h-28"
                source={require("../../images/Artboard 3.png")}
              />
            </TouchableOpacity>
          </View>
        </View>

        <Text className="text-center text-white mt-5">
          {t("signIn.dontHaveAccount")}
        </Text>

        <TouchableOpacity onPress={handleToggle}>
          <Text className="border-2 border-[#7ddd7d] rounded-3xl bg-[#181e25] text-[#7ddd7d] py-3 mt-2 px-24">
            {t("signIn.signUp")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity>
          <Text className="text-[#7ddd7d] underline mt-2">
            {t("signIn.guestUser")}
          </Text>
        </TouchableOpacity>
      </SafeAreaView>
    </KeyboardAvoidinWrapper>
  );
};

export default SignIn;
