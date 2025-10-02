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
import Toast from 'react-native-toast-message';
import { AntDesign, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import TopLogo from "../../images/TopLogo.png";
import { useDispatch } from "react-redux";
import KycTab from "../../components/KycTab";
import { setNiuDocument } from "../../features/Kyc/kycReducer";
import { useTranslation } from "react-i18next";
import { useAppState } from '../../context/AppStateContext'; // Import the hook

const NIU = ({ navigation }) => {
  const { t } = useTranslation();
  const { width } = Dimensions.get("screen");
  const dispatch = useDispatch();
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [taxIdNumber, setTaxIdNumber] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [isFormValid, setIsFormValid] = useState(false);
  const { setIsPickingDocument } = useAppState(); // Get the setter function

  const isValidTaxId = (value) => /^[A-Za-z0-9]{14}$/.test(value.trim());

  useEffect(() => {
    setIsFormValid(isValidTaxId(taxIdNumber) && selectedDocument !== null);
  }, [taxIdNumber, selectedDocument]);

  const handleTakePhoto = () => {
    if (!isValidTaxId(taxIdNumber)) {
      Alert.alert(t("niu.taxIdInvalid"), t("niu.taxIdValidationMessage"));
      return;
    }

    navigation.navigate("Camera", {
      purpose: "niu",
      onCapture: (image) => {
        setSelectedDocument({
          uri: image.uri,
          type: "image/jpeg",
          mimeType: "image/jpeg"
        });
        setCurrentStep(2);
      },
    });
  };

  const handlePickDocument = async () => {
    if (!isValidTaxId(taxIdNumber)) {
      Alert.alert(t("niu.taxIdInvalid"), t("niu.taxIdValidationMessage"));
      return;
    }

    try {
      // 🚨 Set picking state to true BEFORE opening picker
      setIsPickingDocument(true);
      
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result?.assets?.length) {
        setIsPickingDocument(false);
        return;
      }

      const file = result.assets[0];
      const fileInfo = await FileSystem.getInfoAsync(file.uri);
      const fileSizeMB = fileInfo.size / (1024 * 1024);

      if (fileSizeMB > 5) {
        Alert.alert(t("niu.fileTooLarge"), t("niu.documentSizeLimit"));
        setIsPickingDocument(false);
        return;
      }

      setSelectedDocument({
        name: file.name,
        uri: file.uri,
        type: file.mimeType || "application/octet-stream",
        mimeType: file.mimeType || "application/octet-stream",
      });
      setCurrentStep(2);
      
      // 🚨 Reset picking state after successful selection
      setIsPickingDocument(false);
      
    } catch (error) {
      console.error("Document selection error:", error);
      // 🚨 Reset picking state on error too
      setIsPickingDocument(false);
      Alert.alert(t("niu.error"), error.message || t("niu.documentSelectionError"));
    }
  };

  const handleContinue = async () => {
    if (!isFormValid) {
      Alert.alert(t("niu.incompleteForm"));
      return;
    }

    try {
      setIsProcessing(true);
      dispatch(setNiuDocument({
        document: selectedDocument,
        taxIdNumber: taxIdNumber.trim()
      }));
      navigation.navigate("KycResume", { 
        taxIdNumber: taxIdNumber.trim(),
        document: selectedDocument 
      });
    } catch (error) {
      console.error("Error in continue handler:", error);
      Alert.alert(t("niu.generalError"));
    } finally {
      setIsProcessing(false);
    }
  };

  const isImage =
    selectedDocument?.mimeType?.startsWith("image") ||
    selectedDocument?.type?.startsWith("image");

  const renderStepIndicator = () => (
    <View className="flex-row justify-center my-4">
      <View className={`h-2 rounded-full mx-1 ${currentStep >= 1 ? "bg-[#7ddd7d]" : "bg-gray-300"}`} style={{ width: width * 0.3 }} />
      <View className={`h-2 rounded-full mx-1 ${currentStep >= 2 ? "bg-[#7ddd7d]" : "bg-gray-300"}`} style={{ width: width * 0.3 }} />
    </View>
  );

  const renderStepOne = () => (
    <>
      <Text className="font-bold text-gray-800 mt-3 text-center">{t("niu.taxNumber")}</Text>
      <Text className="text-center text-gray-400 text-sm px-4">
        {t("niu.uploadInstruction")}
      </Text>

      <View className="w-[85%] mx-auto mt-6">
        <Text className="text-gray-800 font-semibold mb-1">{t("niu.taxIdLabel")}</Text>
        <TextInput
          value={taxIdNumber}
          onChangeText={setTaxIdNumber}
          placeholder={t("niu.taxIdPlaceholder")}
          placeholderTextColor="#aaa"
          className="bg-gray-100 rounded-lg px-4 py-3 text-gray-800"
          keyboardType="default"
          maxLength={14}
        />
      </View>

      <Image
        source={require("../../images/DGI.png")}
        className="w-[80%] mx-auto mt-8"
        style={{ height: width / 2 }}
        resizeMode="contain"
      />

      <View className="w-[85%] mx-auto mt-8 space-y-4">
        {/* <TouchableOpacity
          className={`flex-row items-center justify-center py-3 mb-8 rounded-full border-2 ${taxIdNumber.trim() ? "border-[#7ddd7d] bg-[#7ddd7d]/20" : "border-gray-300 bg-gray-100"}`}
          onPress={handleTakePhoto}
          disabled={!taxIdNumber.trim()}
        >
          <MaterialIcons 
            name="photo-camera" 
            size={24} 
            color={taxIdNumber.trim() ? "#7ddd7d" : "gray"} 
          />
          <Text className={`ml-2 text-lg font-bold ${taxIdNumber.trim() ? "text-[#7ddd7d]" : "text-gray-500"}`}>
            {t("niu.takePhotoButton")}
          </Text>
        </TouchableOpacity> */}

        <TouchableOpacity
          className={`flex-row items-center justify-center py-3 rounded-full border-2 ${taxIdNumber.trim() ? "border-gray-300" : "border-gray-300 bg-gray-100"}`}
          onPress={handlePickDocument}
          disabled={!taxIdNumber.trim()}
        >
          <MaterialIcons 
            name="upload-file" 
            size={24} 
            color="gray" 
          />
          <Text className={`ml-2 text-lg font-bold ${taxIdNumber.trim() ? "text-gray-500" : "text-gray-400"}`}>
            {t("niu.uploadButton")}
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );

  const renderStepTwo = () => (
    <>
      <Text className="font-bold text-gray-800 mt-3 text-center">{t("niu.documentPreview")}</Text>
      
      {selectedDocument && (
        <View className="w-full items-center mt-4">
          {isImage ? (
            <Image
              source={{ uri: selectedDocument.uri }}
              style={{ width: "80%", height: width / 1.77, borderRadius: 10 }}
              resizeMode="contain"
            />
          ) : (
            <View className="bg-gray-100 p-4 rounded-lg w-[80%] items-center">
              <MaterialIcons name="picture-as-pdf" size={60} color="red" />
              <Text className="mt-2 text-gray-700 text-center" numberOfLines={1}>
                {selectedDocument.name}
              </Text>
            </View>
          )}
          <TouchableOpacity
            className="mt-4"
            onPress={() => setSelectedDocument(null)}
          >
            <Text className="text-red-500">{t("niu.removeDocument")}</Text>
          </TouchableOpacity>
        </View>
      )}

      <View className="w-[85%] mx-auto mt-6">
        <Text className="text-gray-800 font-semibold mb-1">{t("niu.taxIdLabel")}</Text>
        <TextInput
          value={taxIdNumber}
          onChangeText={setTaxIdNumber}
          placeholder={t("niu.taxIdPlaceholder")}
          placeholderTextColor="#aaa"
          className="bg-gray-100 rounded-lg px-4 py-3 text-gray-800"
          keyboardType="default"
          maxLength={14}
        />
      </View>

      <View className="w-[89%] mx-auto px-8">
        <Text className="text-gray-400 my-1">{t("niu.description")}</Text>
        <Text className="text-gray-400 text-xs mt-2 italic">
          {t("niu.supportedFormats")}
        </Text>
      </View>

      <TouchableOpacity
        className={`py-3 rounded-full w-[85%] mx-auto mt-8  ${isFormValid ? "bg-[#7ddd7d]" : "bg-gray-300"}`}
        onPress={handleContinue}
        disabled={!isFormValid || isProcessing}
      >
        <Text className="text-xl text-center font-bold text-white">
          {isProcessing ? t("niu.processing") : t("niu.continueButton")}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        className="mt-4"
        onPress={() => setCurrentStep(1)}
      >
        <Text className="text-center text-blue-500">{t("niu.backToEdit")}</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <View className="bg-[#181e25] flex-1 pt-0 relative">
      <View className="border-b border-dashed border-white flex-row justify-between py-4 mt-10 items-center mx-5 pt-5">
        <View className="absolute -top-12 left-0 right-0 items-center justify-center">
          <Image source={TopLogo} className="h-36 w-40" resizeMode="contain" />
        </View>
        <TouchableOpacity onPress={() => navigation.navigate("KycResume")}>
          <AntDesign name="left" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.openDrawer()} className="ml-auto">
          <Ionicons name="menu-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View className="border border-dashed border-gray-300 my-1" />
      <Text className="text-center text-white text-2xl my-3">
        {t("niu.title")}
      </Text>

      <KeyboardAwareScrollView
        extraScrollHeight={Platform.OS === "ios" ? 100 : 50}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid
        className="bg-white rounded-t-3xl"
        contentContainerStyle={{ paddingBottom: 20, alignItems: "center" }}
      >
        <KycTab isActive="4" />
        {renderStepIndicator()}
        {currentStep === 1 ? renderStepOne() : renderStepTwo()}
      </KeyboardAwareScrollView>

      <View className="py-4 flex-row justify-center items-center gap-2">
        <Ionicons name="shield-checkmark" size={18} color="orange" />
        <Text className="text-sm text-white">{t("niu.securityNotice")}</Text>
      </View>

      <StatusBar style="light" />
    </View>
  );
};

export default NIU;