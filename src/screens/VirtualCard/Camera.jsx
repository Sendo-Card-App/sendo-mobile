import { View, Text, TouchableOpacity, Dimensions, Image } from "react-native";
import React, { useRef, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { AntDesign, Feather, Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useTranslation } from 'react-i18next';
import { useDispatch } from "react-redux";
import { setIdentityDocumentFront, setIdentityDocumentBack,setSelfie,setNiuDocument,setAddressProof } from "../../features/Kyc/kycReducer";

const Camera = ({ navigation, route }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [picture, setPicture] = useState(null);
  const [flash, setFlash] = useState(false);
  const [face, setFace] = useState(false);
  const { height } = Dimensions.get("screen");
  const cameraRef = useRef();
  const dispatch = useDispatch();
  const { purpose, onCapture, returnTo, sid } = route.params || {};
  const { t } = useTranslation();

  const takePicture = async () => {
    if (cameraRef.current) {
      const option = { quality: 0.8, base64: true };
      const newPicture = await cameraRef.current.takePictureAsync(option);
      setPicture(newPicture);
    }
  };

const handleSubmit = () => {
  if (picture) {
    const file = {
      uri: picture.uri,
      type: 'image/jpeg',
      name: `${purpose}_${new Date().toISOString()}.jpg`
    };

    switch (purpose) {
      case 'id_front':
        dispatch(setIdentityDocumentFront(file));
        break;
      case 'id_back':
        dispatch(setIdentityDocumentBack(file));
        break;
      case 'selfie':
        dispatch(setSelfie(file));
        break;
      case 'address_proof':
        dispatch(setAddressProof(file));
        break;
      case 'niu':
        dispatch(setNiuDocument({
          document: file,
          taxIdNumber: sid?.trim() || ''
        }));
        break;
      default:
        console.warn(`Unknown purpose: ${purpose}`);
    }

    if (['selfie', 'niu', 'address_proof'].includes(purpose)) {
      navigation.navigate("KycResume");
    } else {
      navigation.goBack();
    }
  }
};




  const getTitle = () => {
    switch (purpose) {
      case 'selfie':
        return t('camera.selfie_guide');
      case 'niu':
        return t('camera.niu_guide');
         case 'id_front':
        return t('camera.id_front_guide');
      case 'id_back':
        return t('camera.id_back_guide');
      case 'passport':
        return t('camera.passport_guide');
      case 'driving_license':
        return t('camera.driving_license_guide');
      case 'cni':
        return t('camera.cni_guide');
      case 'id_card':
        return t('camera.id_card_guide');
      case 'address_proof':
        return t('camera.address_guide');
      default:
        return t('camera.default_guide');
    }
  };

  return (
    <View className="bg-[#181e25] flex-1 py-11 px-5">
      {/* the top navigation with a back arrow */}
      <View className="py-4">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="left" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Camera title */}
      <Text className="text-white text-lg font-bold mb-4 text-center">
        {getTitle()}
      </Text>

      {/* Camera setup */}
      <View
        className="bg-white rounded-3xl overflow-hidden items-center justify-center"
        style={{ height: height / 1.8 }}
      >
        {!permission ? (
          <AntDesign name="loading1" size={24} color="black" />
        ) : !permission.granted ? (
          <View className="flex-1 justify-center items-center">
            <Text className="mb-4">
              {t('camera.permission_request')}
            </Text>
            <TouchableOpacity
              onPress={requestPermission}
              className="bg-[#7ddd7d] px-4 py-2 rounded-lg"
            >
              <Text>{t('camera.grant_permission')}</Text>
            </TouchableOpacity>
          </View>
        ) : !picture ? (
          <>
            <TouchableOpacity
              className={`absolute right-5 top-5 z-20 ${
                flash ? "bg-[#7ddd7d]" : "bg-[#181e25]"
              }  rounded-full p-3`}
              onPress={() => setFlash((prev) => !prev)}
            >
              <Ionicons name="flashlight-outline" size={24} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              className={`absolute right-5 top-20 z-20 ${
                face ? "bg-[#7ddd7d]" : "bg-[#181e25]"
              }  rounded-full p-3`}
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
        {t('camera.position_hint')}
      </Text>

      {/* button to take a picture */}
      {!picture ? (
        <View className="mt-auto">
          <TouchableOpacity
            className="bg-[#7ddd7d] w-20 h-20 rounded-full items-center justify-center mx-auto"
            onPress={takePicture}
          >
            <Ionicons name="camera-outline" size={40} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-center mt-3">
            {t('camera.capture_hint')}
          </Text>
        </View>
      ) : (
        <View className="mt-auto flex-row items-center justify-between mx-4">
          <TouchableOpacity
            className="items-center justify-center"
            onPress={() => setPicture(null)}
          >
            <Feather name="x" size={45} color="red" />
            <Text className="text-white">{t('camera.cancel')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="items-center justify-center"
            onPress={handleSubmit}
          >
            <AntDesign name="check" size={45} color="#7ddd7d" />
            <Text className="text-white">{t('camera.accept')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <StatusBar style="light" />
    </View>
  );
};

export default Camera;