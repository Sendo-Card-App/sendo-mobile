import { View, Text, Image, TouchableOpacity, Dimensions, Alert } from "react-native";
import React, { useState } from "react";
import TopLogo from "../../images/TopLogo.png";
import { useTranslation } from 'react-i18next';
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";



const IdentityVerification = ({ navigation }) => {
  const { width } = Dimensions.get("screen");
  const { t } = useTranslation();
  const [documentUri, setDocumentUri] = useState(null); // State to hold the uploaded document URI
  const [cameraPermission, setCameraPermission] = useState(null); // State for camera permission

  // Function to handle document upload
  const handleUpload = async () => {
    // Request permission to access media library
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert("Permission to access camera roll is required!");
      return;
    }

    // Launch image picker for selecting a document
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.images,
      allowsEditing: false,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setDocumentUri(result.assets[0].uri); // Set the uploaded document URI
    }
  };

  return (
    <View className="bg-[#181e25] flex-1 pt-0 relative">
      {/* Top Navigation */}
      <View className="border-b border-dashed border-white flex-row justify-between py-4 mt-10 items-center mx-5 pt-5">
        <View className="absolute -top-12 left-0 right-0 items-center justify-center">
          <Image source={TopLogo} className="h-36 w-40" resizeMode="contain" />
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="left" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.openDrawer()} className="ml-auto">
          <Ionicons name="menu-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <View className="border border-dashed border-gray-300 my-1" />
      <Text className="text-center text-white text-2xl my-3">
        {t('identityVerification.title')}
      </Text>

      {/* Form Section */}
      <View className="flex-1 pb-3 overflow-hidden bg-white rounded-t-3xl items-center">
        <Text className="font-bold text-gray-800 mt-3">
          {t('identityVerification.uploadInstruction')}
        </Text>
        <Text className="text-center text-gray-400 text-sm">
          {t('identityVerification.uploadDescription')}
        </Text>

        <TouchableOpacity
          className="mb-2 mt-3 bg-green-300 py-3 w-[85%] mx-auto flex flex-col items-center justify-center"
          onPress={handleUpload}
        >
          <Ionicons name="cloud-upload-outline" size={60} color="#4CAF50" style={{ marginBottom: 4 }} />  
          <Text className="text-sm text-center text-white font-bold">
            {t('identityVerification.uploadButton')}
          </Text>
        </TouchableOpacity>

        <Text className="text-center my-4 text-gray-600">
          {t('identityVerification.orSeparator')}
        </Text>

        <TouchableOpacity
          className="mb-2 mt-3 bg-green-300 py-3 rounded-full w-[85%] mx-auto flex flex-row items-center justify-center"
          onPress={() => navigation.navigate("Camera")}
        >
          <Ionicons name="camera" size={20} color="#fff" style={{ marginRight: 8 }} />
          <Text className="text-sm text-center text-white">
            {t('identityVerification.cameraButton')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="mb-2 mt-auto bg-[#7ddd7d] py-3 rounded-full w-[85%] mx-auto"
          onPress={() => navigation.navigate("IdentityVerification")}
        >
          <Text className="text-xl text-center font-bold">
            {t('identityVerification.finishButton')}
          </Text>
        </TouchableOpacity>
      </View>

      <View className="py-4 flex-row justify-center items-center gap-2">
        <Ionicons name="shield-checkmark" size={18} color="orange" />
        <Text className="text-sm text-white">
          {t('identityVerification.privacyNotice')}
        </Text>
      </View>

      <StatusBar style="light" />
    </View>
  );
};

export default IdentityVerification;