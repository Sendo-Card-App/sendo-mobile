import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
  TextInput,
  Platform,
} from "react-native";
import React, { useState, useEffect } from "react";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import TopLogo from "../../images/TopLogo.png";
import { useDispatch } from "react-redux";
import KycTab from "../../components/KycTab";
import { setNiuDocument } from "../../features/Kyc/kycReducer";
import { useTranslation } from "react-i18next";

const NIU = ({ navigation }) => {
  const { t } = useTranslation();
  const { width } = Dimensions.get("screen");
  const dispatch = useDispatch();
  const [taxIdNumber, setTaxIdNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFormValid, setIsFormValid] = useState(false);

  // NIU number validation (14 alphanumeric characters)
  const isValidTaxId = (value) => /^[A-Za-z0-9]{14}$/.test(value.trim());

  useEffect(() => {
    setIsFormValid(isValidTaxId(taxIdNumber));
  }, [taxIdNumber]);

  const handleContinue = async () => {
    if (!isFormValid) {
      Alert.alert(
        t("niu.incompleteForm"),
        t("niu.taxIdValidationMessage")
      );
      return;
    }

    try {
      setIsProcessing(true);
      
      dispatch(setNiuDocument({
        taxIdNumber: taxIdNumber.trim().toUpperCase() 
      }));
      
      // Navigate back to KYC Resume
      navigation.navigate("KycResume", { 
         taxIdNumber: taxIdNumber.trim().toUpperCase()
      });
      
    } catch (error) {
      console.error("Error in continue handler:", error);
      Alert.alert(t("niu.error"), t("niu.generalError"));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View className="bg-[#181e25] flex-1 pt-0 relative">
      {/* Header */}
      <View className="border-b border-dashed border-white flex-row justify-between py-4 mt-10 items-center mx-5 pt-5">
        <View className="absolute -top-12 left-0 right-0 items-center justify-center">
          <Image source={TopLogo} className="h-36 w-40" resizeMode="contain" />
        </View>
        <TouchableOpacity onPress={() => navigation.navigate("KycResume")}>
          <AntDesign name="left" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-semibold">
          {t("niu.title")}
        </Text>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <KeyboardAwareScrollView
        extraScrollHeight={Platform.OS === "ios" ? 100 : 50}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        className="bg-white rounded-t-3xl mt-4"
        contentContainerStyle={{ paddingBottom: 30 }}
      >
        <KycTab isActive="4" />
        
        {/* Progress Indicator */}
        <View className="flex-row justify-center my-6">
          <View className="h-2 rounded-full bg-[#7ddd7d]" style={{ width: width * 0.6 }} />
        </View>

        <View className="px-5">
          {/* Title and Description */}
          <Text className="font-bold text-gray-800 text-center text-xl">
            {t("niu.taxNumber")}
          </Text>
          <Text className="text-center text-gray-500 text-sm px-4 mt-2 mb-8">
            {t("niu.enterTaxIdInstruction")}
          </Text>

          {/* DGI Image */}
          <Image
            source={require("../../images/DGI.png")}
            className="w-[70%] mx-auto mb-8"
            style={{ height: width / 2.5 }}
            resizeMode="contain"
          />

          {/* Tax ID Input */}
          <View className="w-full mb-6">
            <Text className="text-gray-800 font-semibold mb-3 text-lg">
              {t("niu.taxIdLabel")} *
            </Text>
            <TextInput
              value={taxIdNumber}
              onChangeText={(text) => setTaxIdNumber(text.toUpperCase())}
              placeholder={t("niu.taxIdPlaceholder")}
              placeholderTextColor="#9CA3AF"
              className="bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-4 text-gray-800 text-lg font-medium"
              keyboardType="default"
              maxLength={14}
              autoCapitalize="characters"
              autoCorrect={false}
              autoFocus={true}
            />
            
            {/* Validation Messages */}
            {taxIdNumber.length > 0 && !isValidTaxId(taxIdNumber) && (
              <View className="flex-row items-center mt-2">
                <Ionicons name="close-circle" size={16} color="#DC2626" />
                <Text className="text-red-600 text-sm ml-1">
                  {t("niu.taxIdFormatError")}
                </Text>
              </View>
            )}
            
            {isValidTaxId(taxIdNumber) && (
              <View className="flex-row items-center mt-2">
                <Ionicons name="checkmark-circle" size={16} color="#059669" />
                <Text className="text-green-600 text-sm ml-1">
                  {t("niu.taxIdValid")}
                </Text>
              </View>
            )}

            {/* Character Count */}
            <Text className="text-gray-500 text-xs mt-2 text-right">
              {taxIdNumber.length}/14
            </Text>
          </View>

          {/* Info Box */}
          <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={20} color="#3B82F6" />
              <Text className="text-blue-800 text-sm ml-2 flex-1">
                {t("niu.taxIdDescription")}
              </Text>
            </View>
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            className={`py-4 rounded-xl ${
              isFormValid ? "bg-[#7ddd7d]" : "bg-gray-300"
            } shadow-lg mb-4`}
            onPress={handleContinue}
            disabled={!isFormValid || isProcessing}
          >
            <Text className="text-xl text-center font-bold text-white">
              {isProcessing ? t("niu.processing") : t("niu.continueButton")}
            </Text>
          </TouchableOpacity>

          {/* Back Link */}
          <TouchableOpacity
            className="py-3"
            onPress={() => navigation.navigate("KycResume")}
          >
            <Text className="text-center text-gray-500 font-medium">
              {t("niu.backToKyc")}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>

      {/* Security Notice */}
      <View className="py-4 flex-row justify-center items-center gap-2 bg-[#181e25]">
        <Ionicons name="shield-checkmark" size={18} color="#7ddd7d" />
        <Text className="text-sm text-white text-center">
          {t("niu.securityNotice")}
        </Text>
      </View>

      <StatusBar style="light" />
    </View>
  );
};

export default NIU;