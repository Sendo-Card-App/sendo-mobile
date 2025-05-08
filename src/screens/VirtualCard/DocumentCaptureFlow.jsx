import { View, Text, Image, TouchableOpacity, ScrollView } from "react-native";
import React, { useState } from "react";
import TopLogo from "../../images/TopLogo.png";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useDispatch } from 'react-redux';
import { setIdentityDocument } from '../../features/Kyc/kycReducer';

const DocumentCaptureFlow = ({ navigation, route }) => {
  const { documentType, requiredCaptures, frontLabel, backLabel } = route.params;
  const dispatch = useDispatch();
  const [capturedImages, setCapturedImages] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);

  const handleImageCaptured = (image) => {
    const newImages = [...capturedImages];
    newImages[currentStep] = image;
    setCapturedImages(newImages);

    if (currentStep < requiredCaptures - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      const docData = { type: documentType };
      if (requiredCaptures >= 1) docData.front = newImages[0];
      if (requiredCaptures >= 2) docData.back = newImages[1];

      dispatch(setIdentityDocument(docData));
      navigation.navigate("KycResume");
    }
  };

  const getCurrentLabel = () => {
    if (currentStep === 0) return frontLabel;
    if (currentStep === 1) return backLabel;
    return "Photo";
  };

  return (
    <View className="flex-1 bg-[#181e25] pt-0 relative">
      <StatusBar style="light" />

      {/* Header */}
      <View className="relative h-32">
        <View className="absolute -top-12 left-0 right-0 items-center justify-center">
          <Image source={TopLogo} className="h-36 w-40" resizeMode="contain" />
        </View>

        <View className="flex-row items-center justify-between px-5 pt-16">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <AntDesign name="arrowleft" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-white font-bold">
            {currentStep + 1}/{requiredCaptures}
          </Text>
          <TouchableOpacity onPress={() => navigation.openDrawer()} className="ml-auto">
            <Ionicons name="menu-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Title */}
      <View className="border border-dashed border-gray-300 my-1" />
      <Text className="text-center text-white text-2xl my-3">
        Capture {getCurrentLabel()}
      </Text>

      {/* Main content */}
      <View className="flex-1 pb-3 bg-white rounded-t-3xl">
        {capturedImages[currentStep] ? (
          <ScrollView className="flex-1 p-4">
            {/* Show all captured images so far */}
            {capturedImages.map((img, index) => (
              img && (
                <View key={index} className="mb-6">
                  <Text className="text-gray-600 mb-2 text-center font-bold">
                    {index === 0 ? frontLabel : backLabel}
                  </Text>
                  <Image
                    source={{ uri: img.uri }}
                    className="w-full h-64 rounded-lg"
                    resizeMode="contain"
                  />
                </View>
              )
            ))}

            {/* Instructions */}
            <Text className="text-gray-600 text-center">
              Vérifiez que la photo est claire et lisible
            </Text>

            {/* Actions */}
            <View className="flex-row justify-between w-full px-4 mt-8">
              <TouchableOpacity
                className="bg-red-500 px-6 py-3 rounded-lg"
                onPress={() => {
                  const newImages = [...capturedImages];
                  newImages[currentStep] = null;
                  setCapturedImages(newImages);
                }}
              >
                <Text className="text-white font-bold">Reprendre</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="bg-[#7ddd7d] px-6 py-3 rounded-lg"
                onPress={() => handleImageCaptured(capturedImages[currentStep])}
              >
                <Text className="text-white font-bold">
                  {currentStep < requiredCaptures - 1 ? 'Suivant' : 'Terminer'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        ) : (
          <View className="flex-1 items-center justify-center p-4">
            <Text className="text-gray-600 mb-4 text-center">
              Prenez une photo du {getCurrentLabel().toLowerCase()} de votre document
            </Text>

            <TouchableOpacity
              className="bg-[#7ddd7d] px-6 py-3 rounded-lg"
              onPress={() => navigation.navigate("Camera", {
                purpose: 'document',
                label: getCurrentLabel(),
                onCapture: handleImageCaptured
              })}
            >
              <Text className="text-white font-bold">Ouvrir l'appareil photo</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Footer */}
      <View className="py-4 flex-row justify-center items-center gap-2">
        <Ionicons name="shield-checkmark" size={18} color="orange" />
        <Text className="text-sm text-white">
          Ne partagez pas vos informations personnelles…
        </Text>
      </View>
    </View>
  );
};

export default DocumentCaptureFlow;
