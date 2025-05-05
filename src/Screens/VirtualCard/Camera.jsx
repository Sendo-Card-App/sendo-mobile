import { View, Text, TouchableOpacity, Dimensions, Image } from "react-native";
import React, { useRef, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { AntDesign, Feather, Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";

const Camera = ({ navigation, route }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [picture, setPicture] = useState(null);
  const [flash, setFlash] = useState(false);
  const [face, setFace] = useState(false);
  const { height } = Dimensions.get("screen");
  const cameraRef = useRef();
  const { purpose, onCapture } = route.params || {};

  const takePicture = async () => {
    if (cameraRef.current) {
      const option = { quality: 0.8, base64: true };
      const newPicture = await cameraRef.current.takePictureAsync(option);
      setPicture(newPicture);
    }
  };

  const handleSubmit = () => {
    if (picture && onCapture) {
      onCapture(picture);
    } else {
      navigation.goBack();
    }
  };

  const getTitle = () => {
    switch (purpose) {
      case 'selfie':
        return "Prenez un selfie avec votre pièce d'identité";
      case 'id_front':
        return "Prenez une photo du recto de votre pièce";
      case 'id_back':
        return "Prenez une photo du verso de votre pièce";
      case 'niu':
        return "Prenez une photo de votre document NIU";
      case 'address_proof':
        return "Prenez une photo de votre justificatif";
      default:
        return "Prenez une photo";
    }
  };

  if (!permission) {
    return (
      <View className="flex-1 justify-center items-center bg-[#181e25]">
        <Text className="text-white">Demande d'autorisation...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 justify-center items-center bg-[#181e25] p-4">
        <Text className="text-white text-center mb-4">
          Nous avons besoin de votre permission pour utiliser la caméra
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          className="bg-[#7ddd7d] px-6 py-3 rounded-lg"
        >
          <Text className="text-white">Autoriser la caméra</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="bg-[#181e25] flex-1 py-11 px-5">
      {/* Navigation */}
      <View className="py-4">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="arrowleft" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <Text className="text-white text-lg font-bold mb-4 text-center">
        {getTitle()}
      </Text>

      {/* Camera Preview */}
      <View
        className="bg-white rounded-3xl overflow-hidden items-center justify-center"
        style={{ height: height / 1.8 }}
      >
        {!picture ? (
          <>
            <TouchableOpacity
              className={`absolute right-5 top-5 z-20 ${
                flash ? "bg-[#7ddd7d]" : "bg-[#181e25]"
              } rounded-full p-3`}
              onPress={() => setFlash((prev) => !prev)}
            >
              <Ionicons name="flashlight-outline" size={24} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              className={`absolute right-5 top-20 z-20 ${
                face ? "bg-[#7ddd7d]" : "bg-[#181e25]"
              } rounded-full p-3`}
              onPress={() => setFace((prev) => !prev)}
            >
              <Ionicons name="camera-reverse" size={24} color="white" />
            </TouchableOpacity>
            
            <CameraView
              facing={face ? "front" : "back"}
              style={{ flex: 1, width: "100%" }}
              autofocus="on"
              enableTorch={flash}
              ref={cameraRef}
            />
          </>
        ) : (
          <Image source={{ uri: picture.uri }} className="w-full flex-1" />
        )}
      </View>

      <Text className="text-white text-center mt-3">
        Positionnez votre document dans le cadre
      </Text>

      {/* Controls */}
      {!picture ? (
        <View className="mt-auto">
          <TouchableOpacity
            className="bg-[#7ddd7d] w-20 h-20 rounded-full items-center justify-center mx-auto"
            onPress={takePicture}
          >
            <Ionicons name="camera-outline" size={40} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-center mt-3">
            Appuyez pour prendre la photo
          </Text>
        </View>
      ) : (
        <View className="mt-auto flex-row items-center justify-between mx-4">
          <TouchableOpacity
            className="items-center justify-center"
            onPress={() => setPicture(null)}
          >
            <Feather name="x" size={45} color="red" />
            <Text className="text-white">Annuler</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="items-center justify-center"
            onPress={handleSubmit}
          >
            <AntDesign name="check" size={45} color="#7ddd7d" />
            <Text className="text-white">Valider</Text>
          </TouchableOpacity>
        </View>
      )}

      <StatusBar style="light" />
    </View>
  );
};

export default Camera;