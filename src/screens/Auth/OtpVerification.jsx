import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  SafeAreaView,
  TouchableOpacity,
  Image,
} from "react-native";
import { OtpInput } from "react-native-otp-entry";
import KeyboardAvoidinWrapper from "../../components/KeyboardAvoidinWrapper";
import { useDispatch } from "react-redux";
import { AntDesign } from "@expo/vector-icons";
import {
  useVerifyOtpMutation,
  useResendOtpMutation,
} from "../../services/Auth/authAPI";
import { 
  sendPushNotification,
  sendPushTokenToBackend,
  registerForPushNotificationsAsync
} from '../../services/notificationService';
import { TypesNotification } from "../../utils/constants";
import Toast from "react-native-toast-message";
import { useNavigation, useRoute } from "@react-navigation/native";
import Loader from "../../components/Loader";

const OTP_TIMER_DURATION = 100;

const OtpVerification = ({ route, onClose, onResend }) => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const componentRoute = useRoute();
  const [verifyOtp] = useVerifyOtpMutation();
  const [resendOtp] = useResendOtpMutation();

  const phone = route?.params?.phone || componentRoute?.params?.phone;
  const email = route?.params?.email || componentRoute?.params?.email;
  const initialCode = route?.params?.code || componentRoute?.params?.code;

  const [otp, setOtp] = useState(initialCode || "");
  const [seconds, setSeconds] = useState(OTP_TIMER_DURATION);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    let timer;
    if (seconds > 0) {
      timer = setInterval(() => setSeconds((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [seconds]);

  useEffect(() => {
    if (phone && initialCode && initialCode.length === 6) {
      setOtp(initialCode);
      handleVerifyOtp(initialCode);
    }
  }, []);

  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = timeInSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  const handleVerifyOtp = async (codeToVerify = otp) => {
  if (codeToVerify.length !== 6 || isVerifying) return;

  setIsVerifying(true);
  try {
    const response = await verifyOtp({ phone, code: codeToVerify }).unwrap();

    if (response.status === 201) {
      Toast.show({
        type: "success",
        text1: "Vérification réussie",
        text2: response.message || "Votre compte a été vérifié",
      });

      // Notification content
      const notificationContent = {
        title: "Compte vérifié",
        body: "Votre compte a été vérifié avec succès.",
        type: "SUCCESS_ACCOUNT_VERIFIED",
      };

      try {
        let pushToken = await getStoredPushToken();
        if (!pushToken) {
          pushToken = await registerForPushNotificationsAsync();
        }

        if (pushToken) {
          await sendPushTokenToBackend(
            pushToken,
            notificationContent.title,
            notificationContent.body,
            notificationContent.type,
            {
              phone,
              timestamp: new Date().toISOString(),
            }
          );
        }
      } catch (notificationError) {
        await sendPushNotification(
          notificationContent.title,
          notificationContent.body,
          {
            data: {
              type: notificationContent.type,
              phone,
            },
          }
        );
      }

      // Navigate to SignIn
      navigation.reset({
        index: 0,
        routes: [{ name: "SignIn" }],
      });
    }
  } catch (err) {
    const status =
      err?.status || err?.data?.status || err?.data?.data?.status;
    const errorMessage =
      err?.data?.message ||
      err?.data?.data?.message ||
      "Échec de la vérification OTP";

    if (errorMessage === "Token invalide") {
      Toast.show({
        type: "error",
        text1: "Jeton invalide",
        text2: "Le jeton de vérification est invalide",
        visibilityTime: 4000,
        position: "top",
      });
    } else {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: errorMessage,
      });
    }

    if ([400, 429].includes(status)) {
      setOtp("");
    }
  } finally {
    setIsVerifying(false);
  }
};


  const handleResendOtp = async () => {
    if (seconds > 0) return;

    setIsResending(true);
    try {
      await resendOtp({ phone }).unwrap();
      setSeconds(OTP_TIMER_DURATION);
      Toast.show({
        type: "success",
        text1: "Code OTP renvoyé avec succès",
      });
      if (onResend) onResend();
    } catch (err) {
      Toast.show({
        type: "error",
        text1: err?.data?.message || "Échec du renvoi du code",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const renderOtpScreen = () => (
    <KeyboardAvoidinWrapper>
      <View className="w-full bg-[#f1f1f1] rounded-t-3xl p-6 items-center" style={{ marginTop: 100 }}>
        <Image
          className="w-40 h-40"
          source={require("../../images/Artboard 5.png")}
        />
        <Text className="mb-4 text-lg text-gray-800 opacity-40 text-center">
          Enter code sent to {email}
        </Text>

        <OtpInput
          numberOfDigits={6}
          onTextChange={setOtp}
          focusColor="#7ddd7d"
          defaultValue={otp}
          theme={{
            containerStyle: { marginBottom: 20 },
            pinCodeContainerStyle: { height: 50, width: 40 },
            pinCodeTextStyle: { fontSize: 24 },
          }}
        />

        <View className="flex-row items-center mb-6">
          <Text className="text-gray-600 mr-2">Code expires in</Text>
          <Text className="font-bold">{formatTime(seconds)}</Text>
        </View>

        <TouchableOpacity
          onPress={handleResendOtp}
          disabled={seconds > 0 || isResending}
          className="mb-6"
        >
          {isResending ? (
            <Loader />
          ) : (
            <Text
              className={`text-center ${
                seconds > 0 ? "text-gray-400" : "text-[#7ddd7d]"
              }`}
            >
              Resend OTP
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleVerifyOtp()}
          disabled={otp.length !== 6 || isVerifying}
          className="w-full bg-[#7ddd7d] rounded-3xl p-4 items-center justify-center"
        >
          {isVerifying ? (
            <Loader />
          ) : (
            <Text className="font-bold text-white">Verify</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidinWrapper>
  );

  if (onClose) {
    return (
      <Modal animationType="slide" transparent visible={true} onRequestClose={onClose}>
        <View className="flex-1 bg-[#181e25] bg-opacity-50 justify-center items-center">
          <TouchableOpacity className="absolute z-10 top-5 left-5" onPress={handleBack}>
            <AntDesign name="arrowleft" size={24} color="white" />
          </TouchableOpacity>
          <View className="w-9/12 bg-white p-6 rounded-xl items-center">
            <Text className="mb-4 text-gray-600">Code sent to {phone}</Text>
            {renderOtpScreen()}
            <TouchableOpacity onPress={onClose} className="mt-4">
              <Text className="text-red-500">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#181e25] justify-center">
      <TouchableOpacity className="absolute z-10 top-20 left-5" onPress={handleBack}>
        <AntDesign name="arrowleft" size={24} color="white" />
      </TouchableOpacity>
      {renderOtpScreen()}
    </SafeAreaView>
  );
};

export default OtpVerification;
