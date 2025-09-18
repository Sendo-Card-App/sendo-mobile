import { View, Text, TouchableOpacity, Image, ScrollView, Dimensions } from "react-native";
import React from "react";
import KycTab from "../../components/KycTab";
import TopLogo from "../../images/TopLogo.png";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

const AddressSelect = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  
  const handleLocationSelect = () => {
    navigation.navigate("AddressConfirm", {
      onConfirm: (locationData) => {
        route.params?.onAddressSelected?.(locationData);
        navigation.goBack();
      }
    });
  };
  
  const handleBillUpload = () => {
    navigation.navigate("Camera", {
      purpose: 'address_proof',
      onCapture: (image) => {
        const addressProof = {
          type: 'bill',
          uri: image.uri
        };
        route.params?.onAddressSelected?.(addressProof);
        navigation.goBack();
      }
    });
  };

  return (
    <View className="flex-1 bg-[#181e25] pt-0 relative">
      <StatusBar style="light" />
      
      {/* Header with Logo and Navigation */}
      <View className="relative h-32">
        <View className="absolute -top-12 left-0 right-0 items-center justify-center">
          <Image source={TopLogo} className="h-36 w-40" resizeMode="contain" />
        </View>
        
        <View className="flex-row items-center justify-between px-5 pt-16">
          <TouchableOpacity onPress={() => navigation.navigate("Adresse")}>
            <AntDesign name="left" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.openDrawer()} className="ml-auto">
            <Ionicons name="menu-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Title Section */}
      <View className="border border-dashed border-gray-300 my-1" />
      <Text className="text-center text-white text-2xl my-3">
        {t('address_verification.identity_verification')}
      </Text>

      {/* Main Content */}
      <ScrollView className="flex-1 pb-3 bg-white rounded-t-3xl">
        <View className="px-6 py-4">
          {/* Top Tab */}
          <KycTab isActive="5" />

          <View className="border-b border-gray-200 my-4" />

          {/* Location Verification Section */}
          <Text className="text-lg font-bold text-gray-800 mb-3 text-center">
            {t('address_verification.where_live')}
          </Text>
          <Text className="text-gray-600 mb-4 text-center">
            {t('address_verification.proof_location')}
          </Text>
          
          <View className="space-y-3">
            {/* Navigation for Location Plan */}
            <TouchableOpacity 
              onPress={handleLocationSelect}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center bg-gray-200 rounded-lg p-3">
                <Image
                  source={require("../../images/Localisation.png")}
                  className="w-[80%] mx-auto"
                  style={{ height: Dimensions.get('window').width * 0.45 }}
                  resizeMode="contain"
                />
              </View>
              <Text className="text-gray-700 text-center">
                {t('address_verification.location_map')}
              </Text>
            </TouchableOpacity>

            {/* Navigation for Utility Bill Upload */}
            <TouchableOpacity 
              onPress={handleBillUpload}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center bg-gray-200 rounded-lg p-3">
                <Image
                  source={require("../../images/Facture.png")}
                  className="w-[80%] mx-auto"
                  style={{ height: Dimensions.get('window').width * 0.45 }}
                  resizeMode="contain"
                />
              </View>
              <Text className="text-gray-700 text-center">
                {t('address_verification.utility_bill')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View className="py-4 flex-row justify-center items-center gap-2">
        <Ionicons name="shield-checkmark" size={18} color="orange" />
        <Text className="text-sm text-white">
          {t('address_verification.privacy_notice')}
        </Text>
      </View>
    </View>
  );
};

export default AddressSelect;