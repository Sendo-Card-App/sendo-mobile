import { View, Text, TouchableOpacity, Image, ScrollView, Dimensions } from "react-native";
import React from "react";
import KycTab from "../../components/KycTab";
import TopLogo from "../../images/TopLogo.png";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useDispatch } from 'react-redux';
import { setAddressProof } from '../../features/Kyc/kycReducer';

const AddressSelect = ({ navigation, route }) => {
  const dispatch = useDispatch();
  
  const handleLocationSelect = () => {
    navigation.navigate("AddressConfirm", {
      onConfirm: (locationData) => {
        dispatch(setAddressProof({
          type: 'location',
          uri: locationData.uri,
          name: `address_${Date.now()}.jpg`,
          coordinates: locationData.coordinates
        }));
        navigation.navigate("KycResume");
      }
    });
  };
  
  const handleBillUpload = () => {
    navigation.navigate("Camera", {
      purpose: 'address_proof',
      onCapture: (image) => {
        dispatch(setAddressProof({
          type: 'bill',
          uri: image.uri,
          name: `bill_${Date.now()}.jpg`
        }));
        navigation.navigate("KycResume");
      }
    });
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
          <TouchableOpacity onPress={() => navigation.openDrawer()} className="ml-auto">
            <Ionicons name="menu-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Title */}
      <View className="border border-dashed border-gray-300 my-1" />
      <Text className="text-center text-white text-2xl my-3">
        Justificatif de domicile
      </Text>

      {/* Main Content */}
      <ScrollView className="flex-1 pb-3 bg-white rounded-t-3xl">
        <View className="px-6 py-4">
          <KycTab isActive="5" />

          <View className="border-b border-gray-200 my-4" />

          <Text className="text-lg font-bold text-gray-800 mb-3 text-center">Où habitez-vous ?</Text>
          <Text className="text-gray-600 mb-4 text-center">
            Sélectionnez une option qui prouve votre localisation.
          </Text>
          
          <View className="space-y-3">
            {/* Location Option */}
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
              <Text className="text-gray-700 text-center">Plan de localisation</Text>
            </TouchableOpacity>

            {/* Utility Bill Option */}
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
              <Text className="text-gray-700 text-center">Facture d'eau/électricité</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View className="py-4 flex-row justify-center items-center gap-2">
        <Ionicons name="shield-checkmark" size={18} color="orange" />
        <Text className="text-sm text-white">
          Ne partagez pas vos informations personnelles
        </Text>
      </View>
    </View>
  );
};

export default AddressSelect;