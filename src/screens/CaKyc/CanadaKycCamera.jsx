import { View, Text, TouchableOpacity, Dimensions, Image } from "react-native";
import React, { useRef, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { AntDesign, Feather, Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useTranslation } from 'react-i18next';
import { useDispatch } from "react-redux";
import { 
  setIdentityDocumentFront, 
  setIdentityDocumentBack, 
  setSelfie, 
  setPassportDocument 
} from "../../features/Kyc/kycReducer";
import { useAppState } from '../../context/AppStateContext';

const CanadaKycCamera = ({ navigation, route }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [picture, setPicture] = useState(null);
  const [flash, setFlash] = useState(false);
  const [face, setFace] = useState(false);
  const { height } = Dimensions.get("screen");
  const cameraRef = useRef();
  const dispatch = useDispatch();
  const { purpose, onCapture, selectedIdentityType } = route.params || {};
  const { t } = useTranslation();
  
  const { setIsPickingDocument } = useAppState();

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

      // Handle document dispatch based on purpose and identity type
      switch (purpose) {
        case 'selfie':
          dispatch(setSelfie(file));
          break;
        case 'id_front':
          // For identity documents that require passport, still store as front
          if (selectedIdentityType === 'passeport_canadien') {
            dispatch(setPassportDocument(file));
          } else {
            dispatch(setIdentityDocumentFront(file));
          }
          break;
        case 'id_back':
          dispatch(setIdentityDocumentBack(file));
          break;
        case 'passport':
          dispatch(setPassportDocument(file));
          break;
        default:
          console.warn(`Unknown purpose: ${purpose}`);
      }

      // Call the onCapture callback if provided
      if (onCapture) {
        onCapture(picture);
      }

      // Reset the document picking state when submitting
      setIsPickingDocument(false);

      // Navigate back to CanadaKycSubmission
      navigation.goBack();
    }
  };

  const handleCancel = () => {
    setIsPickingDocument(false);
    setPicture(null);
  };

  const handleGoBack = () => {
    setIsPickingDocument(false);
    navigation.goBack();
  };

  const getTitle = () => {
    switch (purpose) {
      case 'selfie':
        return t('canadaKyc.selfieCameraTitle', 'Take a Selfie');
      case 'id_front':
        if (selectedIdentityType === 'passeport_canadien') {
          return t('canadaKyc.passportCameraTitle', 'Capture Passport');
        } else if (selectedIdentityType === 'permis_conduire') {
          return t('canadaKyc.drivingLicenseFrontTitle', 'Capture Driving License Front');
        } else if (selectedIdentityType === 'carte_resident_permanent') {
          return t('canadaKyc.residentCardFrontTitle', 'Capture Resident Card Front');
        } else if (selectedIdentityType === 'permis_etude_plus_passport') {
          return t('canadaKyc.studyPermitFrontTitle', 'Capture Study Permit Front');
        } else if (selectedIdentityType === 'permis_travail_plus_passport') {
          return t('canadaKyc.workPermitFrontTitle', 'Capture Work Permit Front');
        } else if (selectedIdentityType === 'document_aveile_plus_passport') {
          return t('canadaKyc.aveileDocumentFrontTitle', 'Capture AVEILE Document Front');
        }
        return t('canadaKyc.idFrontCameraTitle', 'Capture Document Front');
      case 'id_back':
        if (selectedIdentityType === 'permis_conduire') {
          return t('canadaKyc.drivingLicenseBackTitle', 'Capture Driving License Back');
        } else if (selectedIdentityType === 'carte_resident_permanent') {
          return t('canadaKyc.residentCardBackTitle', 'Capture Resident Card Back');
        }
        return t('canadaKyc.idBackCameraTitle', 'Capture Document Back');
      case 'passport':
        return t('canadaKyc.passportCameraTitle', 'Capture Passport');
      default:
        return t('canadaKyc.defaultCameraTitle', 'Capture Document');
    }
  };

  const getSubtitle = () => {
    switch (purpose) {
      case 'selfie':
        return t('canadaKyc.selfieCameraSubtitle', 'Make sure your face is clearly visible and well-lit');
      case 'id_front':
        if (selectedIdentityType === 'passeport_canadien') {
          return t('canadaKyc.passportCameraSubtitle', 'Capture the photo page of your Canadian passport');
        } else if (selectedIdentityType === 'permis_conduire') {
          return t('canadaKyc.drivingLicenseFrontSubtitle', 'Capture the front side of your driving license');
        } else if (selectedIdentityType === 'carte_resident_permanent') {
          return t('canadaKyc.residentCardFrontSubtitle', 'Capture the front side of your permanent resident card');
        } else if (selectedIdentityType === 'permis_etude_plus_passport') {
          return t('canadaKyc.studyPermitFrontSubtitle', 'Capture the front side of your study permit');
        } else if (selectedIdentityType === 'permis_travail_plus_passport') {
          return t('canadaKyc.workPermitFrontSubtitle', 'Capture the front side of your work permit');
        } else if (selectedIdentityType === 'document_aveile_plus_passport') {
          return t('canadaKyc.aveileDocumentFrontSubtitle', 'Capture the front side of your AVEILE document');
        }
        return t('canadaKyc.idFrontCameraSubtitle', 'Ensure the document is clear and all text is readable');
      case 'id_back':
        if (selectedIdentityType === 'permis_conduire') {
          return t('canadaKyc.drivingLicenseBackSubtitle', 'Capture the back side of your driving license');
        } else if (selectedIdentityType === 'carte_resident_permanent') {
          return t('canadaKyc.residentCardBackSubtitle', 'Capture the back side of your permanent resident card');
        }
        return t('canadaKyc.idBackCameraSubtitle', 'Ensure the back side is clearly visible');
      case 'passport':
        return t('canadaKyc.passportCameraSubtitle', 'Capture the photo page of your passport');
      default:
        return t('canadaKyc.defaultCameraSubtitle', 'Position the document within the frame');
    }
  };

  const getCaptureHint = () => {
    switch (purpose) {
      case 'selfie':
        return t('canadaKyc.selfieCaptureHint', 'Tap to capture your selfie');
      case 'id_front':
      case 'id_back':
      case 'passport':
        return t('canadaKyc.documentCaptureHint', 'Tap to capture the document');
      default:
        return t('canadaKyc.defaultCaptureHint', 'Tap to capture');
    }
  };

  const getPositionHint = () => {
    switch (purpose) {
      case 'selfie':
        return t('canadaKyc.selfiePositionHint', 'Position your face in the center');
      case 'id_front':
      case 'id_back':
      case 'passport':
        return t('canadaKyc.documentPositionHint', 'Position the document to fill the frame');
      default:
        return t('canadaKyc.defaultPositionHint', 'Position the subject in the frame');
    }
  };

  // Determine if front camera should be used (for selfies)
  const shouldUseFrontCamera = purpose === 'selfie';

  return (
    <View className="bg-[#181e25] flex-1 py-11 px-5">
      {/* Top navigation with back arrow */}
      <View className="py-4">
        <TouchableOpacity onPress={handleGoBack}>
          <AntDesign name="left" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Camera title */}
      <Text className="text-white text-lg font-bold mb-4 text-center">
        {getTitle()}
      </Text>

      {/* Camera subtitle */}
      <Text className="text-gray-300 text-sm mb-4 text-center">
        {getSubtitle()}
      </Text>

      {/* Camera setup */}
      <View
        className="bg-white rounded-3xl overflow-hidden items-center justify-center"
        style={{ height: height / 1.8 }}
      >
        {!permission ? (
          <AntDesign name="loading" size={24} color="black" />
        ) : !permission.granted ? (
          <View className="flex-1 justify-center items-center">
            <Text className="mb-4 text-gray-800 text-center">
              {t('canadaKyc.cameraPermissionRequest', 'We need your permission to use the camera')}
            </Text>
            <TouchableOpacity
              onPress={requestPermission}
              className="bg-[#7ddd7d] px-4 py-2 rounded-lg"
            >
              <Text className="text-white font-medium">
                {t('canadaKyc.grantPermission', 'Grant Permission')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : !picture ? (
          <>
            {/* Flash toggle - only show for back camera and non-selfie purposes */}
            {!shouldUseFrontCamera && (
              <TouchableOpacity
                className={`absolute right-5 top-5 z-20 ${
                  flash ? "bg-[#7ddd7d]" : "bg-[#181e25]"
                } rounded-full p-3`}
                onPress={() => setFlash((prev) => !prev)}
              >
                <Ionicons name="flashlight-outline" size={24} color="white" />
              </TouchableOpacity>
            )}

            {/* Camera flip toggle - only show for non-selfie purposes */}
            {!shouldUseFrontCamera && (
              <TouchableOpacity
                className={`absolute right-5 top-20 z-20 ${
                  face ? "bg-[#7ddd7d]" : "bg-[#181e25]"
                } rounded-full p-3`}
                onPress={() => setFace((prev) => !prev)}
              >
                <Ionicons name="camera-reverse" size={24} color="white" />
              </TouchableOpacity>
            )}

            <CameraView
              facing={shouldUseFrontCamera ? "front" : (face ? "front" : "back")}
              style={{ flex: 1, width: "100%" }}
              autofocus="on"
              enableTorch={flash && !shouldUseFrontCamera}
              ref={cameraRef}
            />
          </>
        ) : (
          <Image 
            source={{ uri: picture.uri }} 
            className="w-full flex-1" 
            resizeMode="contain"
          />
        )}
      </View>

      <Text className="text-white text-center mt-3">
        {getPositionHint()}
      </Text>

      {/* Button to take a picture */}
      {!picture ? (
        <View className="mt-auto">
          <TouchableOpacity
            className="bg-[#7ddd7d] w-20 h-20 rounded-full items-center justify-center mx-auto"
            onPress={takePicture}
          >
            <Ionicons name="camera-outline" size={40} color="white" />
          </TouchableOpacity>
          <Text className="text-white text-center mt-3">
            {getCaptureHint()}
          </Text>
        </View>
      ) : (
        <View className="mt-auto flex-row items-center justify-between mx-4">
          <TouchableOpacity
            className="items-center justify-center"
            onPress={handleCancel}
          >
            <Feather name="x" size={45} color="red" />
            <Text className="text-white mt-1">{t('canadaKyc.cancel', 'Cancel')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="items-center justify-center"
            onPress={handleSubmit}
          >
            <AntDesign name="check" size={45} color="#7ddd7d" />
            <Text className="text-white mt-1">{t('canadaKyc.accept', 'Accept')}</Text>
          </TouchableOpacity>
        </View>
      )}

      <StatusBar style="light" />
    </View>
  );
};

export default CanadaKycCamera;