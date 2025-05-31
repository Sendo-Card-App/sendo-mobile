import { View, Text, TouchableOpacity, Image, Dimensions, ScrollView } from "react-native";
import React from "react";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import TopLogo from "../../images/TopLogo.png";
import { useDispatch, useSelector } from 'react-redux';
import KycTab from "../../components/KycTab";
import { setIdentityDocumentType, setIdentityDocumentFront, setIdentityDocumentBack } from '../../features/Kyc/kycReducer';
import { IDENTITY_TYPES } from '../../features/Kyc/kycReducer';
import { useTranslation } from 'react-i18next';

const IdentityCard = ({ navigation }) => {
  const { width } = Dimensions.get("screen");
  const dispatch = useDispatch();
  const { identityDocument } = useSelector(state => state.kyc);
  const { t } = useTranslation();
  
  const handleFrontCapture = () => {
  navigation.navigate("Camera", { purpose: "id_front" });
};

const handleBackCapture = () => {
  navigation.navigate("Camera", { purpose: "id_back"});
};

  

  const handleDocumentTypeChange = (type) => {
    dispatch(setIdentityDocumentType(type));
    dispatch(setIdentityDocumentFront(null));
    if (type === IDENTITY_TYPES.CNI) {
      dispatch(setIdentityDocumentBack(null));
    }
  };

  const handleRemoveFront = () => {
    dispatch(setIdentityDocumentFront(null));
  };

  const handleRemoveBack = () => {
    dispatch(setIdentityDocumentBack(null));
  };

  return (
    <View className="bg-[#181e25] flex-1 pt-0 relative">
      {/* Header */}
      <View className="relative h-32">
        <View className="absolute -top-12 left-0 right-0 items-center justify-center">
          <Image source={TopLogo} className="h-36 w-40" resizeMode="contain" />
        </View>
        
        <View className="flex-row items-center justify-between px-5 pt-16">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <AntDesign name="arrowleft" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.openDrawer()} className="ml-auto">
            <Ionicons name="menu-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Title */}
      <View className="border border-dashed border-gray-300 my-1" />
      <Text className="text-center text-white text-2xl my-3">
        {t('identity_card.title')}
      </Text>

      {/* Main Content */}
      <ScrollView className="flex-1 pb-3 bg-white rounded-t-3xl" contentContainerStyle={{ paddingBottom: 20 }}>
        <View className="px-6 py-4">
          <KycTab isActive="3" />

          {/* Document Type Selection */}
          <Text className="font-bold text-gray-800 mb-3">{t('identity_card.document_type')}</Text>
          <View className="flex-row justify-between mb-6">
            {Object.values(IDENTITY_TYPES).map(type => (
              <TouchableOpacity
                key={type}
                className={`px-4 py-2 rounded-lg ${identityDocument.type === type ? 'bg-[#7ddd7d]' : 'bg-gray-200'}`}
                onPress={() => handleDocumentTypeChange(type)}
              >
                <Text className={identityDocument.type === type ? 'text-white' : 'text-gray-800'}>
                  {type}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Front Side */}
          <Text className="font-bold text-gray-800 mb-1">{t('identity_card.front_side')}</Text>
          {identityDocument.front ? (
            <View className="relative mb-4">
              <View className="h-48 w-full rounded-lg overflow-hidden">
                <Image
                  source={{ uri: identityDocument.front.uri }}
                  className="h-full w-full"
                  resizeMode="contain"
                />
              </View>
              <TouchableOpacity
                className="absolute top-2 right-2 bg-red-500 rounded-full p-2"
                onPress={handleRemoveFront}
              >
                <AntDesign name="close" size={16} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                className="absolute bottom-2 right-2 bg-[#7ddd7d] rounded-full p-2"
                onPress={handleFrontCapture}
              >
                <Ionicons name="camera" size={16} color="white" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              className="h-48 bg-gray-100 rounded-lg items-center justify-center mb-2"
              onPress={handleFrontCapture}
            >
              <Ionicons name="camera" size={40} color="gray" />
              <Text className="text-gray-500 mt-2">{t('identity_card.take_photo_front')}</Text>
            </TouchableOpacity>
          )}

          {/* Back Side (only for CNI) */}
          {identityDocument.type === IDENTITY_TYPES.CNI && (
            <>
              <Text className="font-bold text-gray-800 mb-1">{t('identity_card.back_side')}</Text>
              {identityDocument.back ? (
                <View className="relative mb-4">
                  <View className="h-48 w-full rounded-lg overflow-hidden">
                    <Image
                      source={{ uri: identityDocument.back.uri }}
                      className="h-full w-full"
                      resizeMode="contain"
                    />
                  </View>
                  <TouchableOpacity
                    className="absolute top-2 right-2 bg-red-500 rounded-full p-2"
                    onPress={handleRemoveBack}
                  >
                    <AntDesign name="close" size={16} color="white" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="absolute bottom-2 right-2 bg-[#7ddd7d] rounded-full p-2"
                    onPress={handleBackCapture}
                  >
                    <Ionicons name="camera" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  className="h-48 bg-gray-100 rounded-lg items-center justify-center mb-2"
                  onPress={handleBackCapture}
                >
                  <Ionicons name="camera" size={40} color="gray" />
                  <Text className="text-gray-500 mt-2">{t('identity_card.take_photo_back')}</Text>
                </TouchableOpacity>
              )}
            </>
          )}

          {/* Next Button */}
          <TouchableOpacity
            className={`py-3 rounded-full mt-4 ${identityDocument.front && (identityDocument.type !== IDENTITY_TYPES.CNI || identityDocument.back) ? 'bg-[#7ddd7d]' : 'bg-gray-400'}`}
            onPress={() => navigation.navigate("KycResume")}
            disabled={!identityDocument.front || (identityDocument.type === IDENTITY_TYPES.CNI && !identityDocument.back)}
          >
            <Text className="text-xl text-center font-bold">{t('identity_card.next_button')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer */}
      <View className="py-4 flex-row justify-center items-center gap-2">
        <Ionicons name="shield-checkmark" size={18} color="orange" />
        <Text className="text-sm text-white">
          {t('identity_card.privacy_notice')}
        </Text>
      </View>

      <StatusBar style="light" />
    </View>
  );
};

export default IdentityCard;