import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform
} from "react-native";
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import KycTab from "../../components/KycTab";
import { updatePersonalDetails } from '../../features/Kyc/kycReducer';
import TopLogo from "../../Images/TopLogo.png";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

const PersonalDetail = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const personalDetails = useSelector(state => state.kyc.personalDetails);

  const [formData, setFormData] = useState({
    country: personalDetails.country || '',
    region: personalDetails.region || '',
    city: personalDetails.city || '',
    district: personalDetails.district || '',
    profession: personalDetails.profession || '',
  });

  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    const { country, region, city, district, profession } = formData;

    if (!country || !region || !city || !district || !profession) {
      Alert.alert(t('personalDetail.errorTitle'), t('personalDetail.fillAllFields'));
      return;
    }

    dispatch(updatePersonalDetails(formData));
    navigation.navigate("KycResume");
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#181e25]"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View className="border-b border-dashed border-white flex-row justify-between py-4 mt-10 mx-5">
        <View className="absolute -top-12 left-0 right-0 items-center justify-center">
          <Image source={TopLogo} className="h-36 w-40" resizeMode="contain" />
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="arrowleft" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.openDrawer()} className="ml-auto">
          <Ionicons name="menu-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Title */}
      <View className="border border-dashed border-gray-300 my-1" />
      <Text className="text-center text-white text-2xl my-3">
        {t('personalDetail.title')}
      </Text>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="bg-white rounded-t-3xl p-4 mx-5 mb-4">
          <KycTab isActive="1" />
          <Text className="font-bold text-gray-800 mb-2 text-center">
            {t('personalDetail.header')}
          </Text>
          <Text className="text-xs text-gray-600 mb-3 text-center">
            {t('personalDetail.subheader')}
          </Text>
          <View className="border border-dashed border-gray-300 my-2" />

          {/* Champs */}
          {[
            { key: 'country', placeholder: 'enterCountry' },
            { key: 'region', placeholder: 'enterRegion' },
            { key: 'city', placeholder: 'enterCity' },
            { key: 'district', placeholder: 'enterDistrict' },
            { key: 'profession', placeholder: 'enterProfession' },
          ].map(({ key, placeholder }) => (
            <View key={key}>
              <Text className="font-bold text-gray-600 mt-4 mb-1 text-xs">
                {t(`personalDetail.${key}`)}
              </Text>
              <TextInput
                className="border border-gray-300 rounded-lg px-4 py-3 text-gray-800 mb-2"
                value={formData[key]}
                placeholder={t(`personalDetail.${placeholder}`)}
                onChangeText={(value) => handleInputChange(key, value)}
              />
            </View>
          ))}

          <View className="border border-dashed border-gray-300 my-2" />
          <Text className="text-gray-600 mb-4 text-center">
            {t('personalDetail.confidentialNotice')}
          </Text>

          <TouchableOpacity 
            className="bg-[#7ddd7d] py-3 rounded-full mt-4"
            onPress={handleSubmit}>
            <Text className="text-xl text-center font-bold">
              {t('personalDetail.saveButton')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <StatusBar style="light" />
    </KeyboardAvoidingView>
  );
};

export default PersonalDetail;
