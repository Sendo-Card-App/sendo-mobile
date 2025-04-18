import React from "react";
import { useState, useEffect, useRef } from "react";
import { AntDesign } from "@expo/vector-icons";
import { OtpInput } from "react-native-otp-entry";
import {
  View,
  Text,
  TextInput,
  Image,
  Modal,
  Alert,
  TouchableOpacity,
  Button,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import KeyboardAvoidinWrapper from "../../components/KeyboardAvoidinWrapper";
import { useNavigation } from "@react-navigation/native";

const Auth = () => {
  // state for the modal
  const [modalVisible, setModalVisible] = useState(false);

  const openModal = () => {
    setModalVisible(true);
  };

  // Function to handle closing the modal
  const closeModal = () => {
    setModalVisible(false);
  };

  // State to track the current icon
  const [isToggled, setIsToggled] = useState(false);

  // Icons to toggle between
  const firstIcon = require("../../Images/Artboard 1.png");
  const secondIcon = require("../../Images/Artboard 2 copy 2.png");
  const [isLogin, setIsLogin] = useState(true);

  // Shared States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Additional State for Sign-Up
  const [name, setName] = useState("");

  const handleToggle = () => {
    setIsLogin(!isLogin); // Toggle between Login and Sign-Up
    setEmail("");
    setPassword("");
    setName("");
  };

  const handleSubmit = () => {
    if (isLogin) {
      console.log("Logging in with:", { email, password });
      // Add login logic here
    } else {
      console.log("Signing up with:", { name, email, password });
      // Add sign-up logic here
    }
  };
  const [showOtpPopup, setShowOtpPopup] = useState(false);
  const [signupDetails, setSignupDetails] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    phone: "",
  });
  const [otp, setOtp] = useState("");

  const handleSignup = () => {
    // Validate signup form
    if (
      !signupDetails.email ||
      !signupDetails.password ||
      !signupDetails.phone
    ) {
      Alert.alert("Error", "All fields are required!");
      return;
    }

    // Simulate signup success and show OTP popup
    setShowOtpPopup(true);
    setModalVisible(true);
  };

  const handleVerifyOtp = () => {
    if (otp === "") {
      Alert.alert("Success", "OTP Verified!");
      setShowOtpPopup(false);
    } else {
      Alert.alert("Error", "Invalid OTP");
    }
  };

  //Simulate seconds and milliseconds
  const [seconds, setSeconds] = useState(30);
  const [milliseconds, setMilliseconds] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(true);
  const navigation = useNavigation();

  //useeffect of timer
  useEffect(() => {
    let timer;
    if (isTimerActive && (seconds > 0 || milliseconds > 0)) {
      timer = setInterval(() => {
        setMilliseconds((prevMilliseconds) => {
          if (prevMilliseconds === 0) {
            if (seconds > 0) {
              setSeconds((prevSeconds) => prevSeconds - 1);
              return 99;
            } else {
              setIsTimerActive(false);
              return 0;
            }
          }
          return prevMilliseconds - 1;
        });
      }, 10);
    }

    return () => clearInterval(timer);
  }, [isTimerActive, seconds, milliseconds]);

  const handleResendOtp = () => {
    if (!isTimerActive) {
      // Logic to resend OTP
      Alert.alert("OTP Resent!");
      setSeconds(30); // Reset timer
      setMilliseconds(0);
      setIsTimerActive(true);
    }
  };
  // inputs useState

  const [code, setCode] = useState(["", "", "", ""]);
  const inputRefs = [useRef(), useRef(), useRef(), useRef()];

  const handleChange = (text, index) => {
    const newCode = [...code];
    newCode[index] = text;

    if (text.length === 1 && index < 3) {
      // Move to the next input if the user types
      inputRefs[index + 1].current.focus();
    }

    if (text.length === 0 && index > 0) {
      // Move to the previous input if the user deletes
      inputRefs[index - 1].current.focus();
    }

    setCode(newCode);
  };

  const handleVerify = () => {
    const enteredCode = code.join(""); // Combine the 4 digits into one string
    if (enteredCode.length === 4) {
      Alert.alert("Code Entered", `You entered: ${enteredCode}`);
    } else {
      Alert.alert("Error", "Please enter all 4 digits.");
    }
  };

  const signInFacebook = () => {
    
  }

  const signInGoogle = () => {
    
  }
  return (
    <>
      <KeyboardAvoidinWrapper>
        <SafeAreaView className="bg-[#181e25] flex-1 items-center justify-center">
          <TouchableOpacity
            className="absolute z-10 top-5 left-5 "
            onPress={() => navigation.goBack()}
          >
            <AntDesign
              name="arrowleft"
              className="mt-10"
              size={24}
              color="white"
            />
          </TouchableOpacity>
          <Image
            source={require("../../Images/LogoSendo.png")}
            className="mt-3 mb-3 w-28 h-28"
          />

          {isLogin ? (
            <View className="flex-1 w-[80%]  bg-[#f1f1f1] border-1 mt-3 pb-0 mx-auto rounded-3xl mb-2 px-5">
              {/* Login Form */}
              <View className="mt-5">
                <Text className="text-3xl font-bold flex-start">Log In</Text>
              </View>
              <View className="mt-5 ">
                <View className="border-[#fff] flex-row space-x-4 bg-[#ffffff] rounded-3xl text-center opacity-1 text-black mb-5  ">
                  <TouchableOpacity onPress={() => setIsToggled(!isToggled)}>
                    <Image
                      source={isToggled ? secondIcon : firstIcon}
                      className="w-16 h-16 "
                    />
                  </TouchableOpacity>

                  <TextInput
                    keyboardType="phone-pad"
                    onChangeText={(text) => setCode(text)}
                    ref={inputRefs[0]}
                    value={code[0]}
                    maxLength={1}
                    className="ml-3"
                    placeholder={`${
                      isToggled ? "CANADA(+1)" : "CAMEROUN(+237)"
                    }`}
                  />
                </View>

                <TextInput
                  className="border-[#fff]  elevation-5 shadow-xl bg-[#ffffff] rounded-3xl text-center opacity-1 text-black mb-5 py-5 "
                  placeholder="Enter Phone Number"
                />
                <TouchableOpacity onPress={handleSubmit}>
                  <Text className="text-center mt-3 border-1-[#7ddd7d] bg-[#7ddd7d] rounded-3xl p-4 font-bold">
                    Next
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity>
                  <Text className="mt-5 text-center">
                    LOGIN WITH EMAIL/USERNAME
                  </Text>
                </TouchableOpacity>
                <Text className="text-center opacity-20">Or Sign in with</Text>
                <View className="flex-row items-center justify-center space-x-4">
                  <TouchableOpacity onPress={ signInFacebook}>
                    <Image
                      className="w-28 h-28 "
                      source={require("../../Images/Artboard 2.png")}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={signInGoogle}>
                    <Image
                      className="w-28 h-28 "
                      source={require("../../Images/Artboard 3.png")}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <View className="flex w-[85%] h-[65%]  justify-center items-center bg-[#f1f1f1] border-1 mt-0  mx-auto rounded-3xl  ">
              {/* Signup Form */}
              <View className="">
                <Text className="mt-8 text-3xl font-bold ">SignUp</Text>
              </View>
              <View className="m-3 px-8    w-[300px]">
                <TextInput
                  className="border-[#fff] bg-[#ffffff]  shadow-lg rounded-3xl text-center opacity-1 text-black mb-5 py-5 "
                  placeholder="Enter first name"
                  onChangeText={(text) =>
                    setSignupDetails({ ...signupDetails, firstname: text })
                  }
                />
                <TextInput
                  className="border-[#fff] bg-[#ffffff] rounded-3xl text-center opacity-1 text-black mb-5 py-5 "
                  placeholder="Enter last name"
                  onChangeText={(text) =>
                    setSignupDetails({ ...signupDetails, lastname: text })
                  }
                />
                <TextInput
                  className="border-[#fff] bg-[#ffffff] rounded-3xl text-center opacity-1 text-black mb-5 py-5"
                  onChangeText={(text) =>
                    setSignupDetails({ ...signupDetails, email: text })
                  }
                  placeholder="Enter email address"
                />
                <TextInput
                  className="border-[#fff] bg-[#ffffff] rounded-3xl mb-5 text-center opacity-1 text-black py-5 "
                  onChangeText={(text) =>
                    setSignupDetails({ ...signupDetails, password: text })
                  }
                  placeholder="Password"
                  secureTextEntry
                />
                <TextInput
                  className="border-[#fff] bg-[#ffffff] mb-5 rounded-3xl text-center opacity-1 text-black py-5 "
                  onChangeText={(text) =>
                    setSignupDetails({ ...signupDetails, phone: text })
                  }
                  placeholder="Enter Mobile No."
                  keyboardType="phone-pad"
                />

                <TouchableOpacity
                  className="text-center "
                  onPress={handleSignup}
                >
                  <Text
                    className="text-center mb-8 mt-3 border-[#7ddd7d] border-2 bg-[#7ddd7d] rounded-3xl p-4 font-bold"
                    color="#7ddd7d"
                  >
                    SIGN up
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          <StatusBar style="light" backgroundColor="#181e25" />
          <Text className="text-center text-white">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
          </Text>

          <TouchableOpacity onPress={handleToggle}>
            <Text className="border-2 border-[#7ddd7d] border-700 rounded-3xl bg-[#181e25]  text-[#7ddd7d] py-3 mt-2 px-24">
              {isLogin ? "SIGN UP" : "SIGN IN"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity>
            <Text className="text-[#7ddd7d] underline">
              {isLogin ? "login as a guest user" : ""}
            </Text>
          </TouchableOpacity>

          {/* OTP Popup */}
          {showOtpPopup && (
            <KeyboardAvoidinWrapper>
              <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={closeModal}
              >
                <View className="flex-1 bg-[#181e25] bg-opacity-50 justify-center items-center">
                  <View className="w-9/12 bg-[white] items-center p-6 rounded-xl shadow-md">
                    <Image
                      className="w-40 h-40 "
                      source={require("../../Images/Artboard 5.png")}
                    />
                    <Text className="mb-4 text-lg text-gray-800 opacity-40">
                      Enter 4 Digits code
                    </Text>

                    <OtpInput
                      numberOfDigits={4}
                      autoFocus={false}
                      hideStick={true}
                      placeholder=""
                      blurOnFilled={true}
                      disabled={false}
                      type="numeric"
                      secureTextEntry={false}
                      focusStickBlinkingDuration={500}
                      textInputProps={{
                        accessibilityLabel: "One-Time Password",
                      }}
                    />

                    <View className="flex-row space-x-4">
                      <Text className=" text-[rgb(243, 57, 57)] mb-2 mt-2 font-bold">
                        {`${String(seconds).padStart(2, "0")}:${String(
                          milliseconds
                        ).padStart(2, "0")}`}
                      </Text>

                      <TouchableOpacity
                        className="mb-5 ml-2 text-center"
                        onPress={handleResendOtp}
                        disabled={isTimerActive} // Disable button if timer is active
                      >
                        <Text
                          className={`text-black mt-2 font-bold ${
                            isTimerActive ? "opacity-50" : ""
                          }`}
                        >
                          Resend {">"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <TouchableOpacity
                    className="bg-[#7ddd7d] rounded-full mt-5 px-32 p-3"
                    onPress={() => {
                      setShowOtpPopup(false);
                      navigation.navigate("Home");
                    }}
                  >
                    <Text className="text-xl font-bold text-center text-black">
                      VERIFY
                    </Text>
                  </TouchableOpacity>
                </View>
              </Modal>
            </KeyboardAvoidinWrapper>
          )}
        </SafeAreaView>
      </KeyboardAvoidinWrapper>
    </>
  );
};
export default Auth;
