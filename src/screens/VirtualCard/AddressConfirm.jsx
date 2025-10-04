import { View, Text, TouchableOpacity, Image, ScrollView } from "react-native";
import React, { useState } from "react";
// ✅ Use legacy API to avoid "getInfoAsync is deprecated" crash
import * as FileSystem from "expo-file-system/legacy";
import * as DocumentPicker from "expo-document-picker";
import Toast from "react-native-toast-message";
import TopLogo from "../../images/TopLogo.png";
import { AntDesign, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import KycTab from "../../components/KycTab";
import { useDispatch } from "react-redux";
import { setAddressProof } from "../../features/Kyc/kycReducer";
import { useTranslation } from "react-i18next";
import { useAppState } from '../../context/AppStateContext'; // Import the hook

const AddressConfirm = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [selectedDoc, setSelectedDoc] = useState(null);
  const { setIsPickingDocument } = useAppState(); // Get the setter function

  const pickDocument = async () => {
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

      // ✅ Use legacy getInfoAsync
      const fileInfo = await FileSystem.getInfoAsync(file.uri);
      const fileSizeMB = fileInfo.size / (1024 * 1024);

      if (fileSizeMB > 5) {
        Toast.show({
          type: "error",
          text1: t("niu.fileTooLarge"),
          text2: t("niu.documentSizeLimit"),
        });
        setIsPickingDocument(false);
        return;
      }

      setSelectedDoc({
        name: file.name,
        uri: file.uri,
        mimeType: file.mimeType || "application/octet-stream",
        type: file.mimeType?.includes("image") ? "image" : "document",
      });
      
      // 🚨 Reset picking state after successful selection
      setIsPickingDocument(false);
      
    } catch (error) {
      console.error("Document selection error:", error);
      // 🚨 Reset picking state on error too
      setIsPickingDocument(false);
      Toast.show({
        type: "error",
        text1: t("niu.error"),
        text2: error.message || t("niu.documentSelectionError"),
      });
    }
  };

  const handleConfirm = () => {
    if (!selectedDoc) {
      Toast.show({
        type: "error",
        text1: t("niu.error"),
        text2: t("addressConfirm.selectBeforeConfirm"),
      });
      return;
    }

    try {
      dispatch(
        setAddressProof({
          type: "document",
          uri: selectedDoc.uri,
          name: selectedDoc.name,
          mimeType: selectedDoc.mimeType,
        })
      );

      navigation.navigate("KycResume");
    } catch (error) {
      console.error("Confirmation error:", error);
      Toast.show({
        type: "error",
        text1: t("error"),
        text2: t("addressConfirm.confirmFailed"),
      });
    }
  };

  const renderDocumentPreview = () => {
    if (!selectedDoc) return null;

    return selectedDoc.type === "image" ? (
      <View className="relative mb-4">
        <Image
          source={{ uri: selectedDoc.uri }}
          className="h-64 w-full rounded-lg"
          resizeMode="contain"
        />
        <TouchableOpacity
          onPress={() => setSelectedDoc(null)}
          className="absolute top-2 right-2 bg-white rounded-full p-1"
        >
          <MaterialIcons name="cancel" size={24} color="red" />
        </TouchableOpacity>
        <Text className="text-center text-gray-600 mt-1">{selectedDoc.name}</Text>
      </View>
    ) : (
      <View className="bg-gray-100 p-4 rounded-lg mb-4 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <Ionicons name="document" size={32} color="#3b82f6" />
          <View className="ml-3">
            <Text className="font-medium text-gray-800" numberOfLines={1}>
              {selectedDoc.name}
            </Text>
            <Text className="text-xs text-gray-500">{selectedDoc.mimeType}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => setSelectedDoc(null)}>
          <MaterialIcons name="cancel" size={24} color="red" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-[#181e25] pt-0 relative">
      <StatusBar style="light" />
      <View className="relative h-32">
        <View className="absolute -top-12 left-0 right-0 items-center justify-center">
          <Image source={TopLogo} className="h-36 w-40" resizeMode="contain" />
        </View>

        <View className="flex-row items-center justify-between px-5 pt-16">
          <TouchableOpacity onPress={() => navigation.navigate("AddressSelect")}>
            <AntDesign name="left" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.openDrawer()} className="ml-auto">
            <Ionicons name="menu-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="border border-dashed border-gray-300 my-1" />
      <Text className="text-center text-white text-2xl my-3">
        {t("addressConfirm.title")}
      </Text>

      <ScrollView className="flex-1 pb-3 bg-white rounded-t-3xl">
        <View className="px-6 py-4">
          <KycTab isActive="5" />

          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-800 mb-3 text-center">
              {t("addressConfirm.documentProof")}
            </Text>

            {renderDocumentPreview()}

            {!selectedDoc && (
              <TouchableOpacity
                onPress={pickDocument}
                className="h-40 border-2 border-dashed border-gray-300 rounded-lg items-center justify-center"
              >
                <Ionicons name="cloud-upload" size={48} color="#7ddd7d" />
                <Text className="text-gray-700 font-medium mt-2">
                  {t("addressConfirm.selectDocument")}
                </Text>
                <Text className="text-gray-500 text-sm">
                  {t("addressConfirm.documentTypes")}
                </Text>
              </TouchableOpacity>
            )}

            <View className="mt-4 bg-blue-50 p-3 rounded-lg">
              <Text className="font-medium text-blue-800">
                {t("addressConfirm.acceptedDocuments")}
              </Text>
              {t("addressConfirm.documentsList", { returnObjects: true }).map((item, idx) => (
                <Text key={idx} className="text-gray-600 text-sm mt-1">
                  {item}
                </Text>
              ))}
            </View>
          </View>

          <TouchableOpacity
            className={`py-4 rounded-lg mt-4 ${selectedDoc ? "bg-[#7ddd7d]" : "bg-gray-400"}`}
            onPress={handleConfirm}
            disabled={!selectedDoc}
          >
            <Text className="text-white font-bold text-center">
              {t("addressConfirm.confirmButton")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View className="py-4 flex-row justify-center items-center gap-2">
        <Ionicons name="shield-checkmark" size={18} color="orange" />
        <Text className="text-sm text-white">{t("addressConfirm.securityNotice")}</Text>
      </View>

      <Toast />
    </View>
  );
};

export default AddressConfirm;