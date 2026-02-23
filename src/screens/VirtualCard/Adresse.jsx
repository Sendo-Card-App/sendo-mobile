import React from 'react';
import { View, Text, TouchableOpacity, Image, Dimensions } from 'react-native';
import { StatusBar } from "expo-status-bar";
import { useDispatch } from 'react-redux';
import { setAddressProof } from '../../features/Kyc/kycReducer';
import { useTranslation } from 'react-i18next';

const Addresse = ({ navigation }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  
  const handleProceed = () => {
    navigation.navigate("AddressSelect", {
      onAddressSelected: (addressProof) => {
        dispatch(setAddressProof(addressProof));
        navigation.navigate("KycResume");
      }
    });
  };

  return (
    <View style={{ flex: 1, }}>
      
      {/* Status Bar */}
      <StatusBar 
        style="dark" 
        backgroundColor="#7ddd7d" 
      />

      <View className="flex-1 justify-center items-center">
        <View className="bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-md">
          <Image
            source={require("../../images/Localisation.png")}
            style={{
              width: "100%",
              height: Dimensions.get('window').width * 0.45,
              marginBottom: 10,
            }}
            resizeMode="contain"
          />
          
          <Text className="text-gray-700 text-center leading-5 mb-6">
            {t('address_verification.security_message')}
          </Text>
          
          <View className="flex-row justify-between">
            <TouchableOpacity 
              onPress={() => navigation.navigate("KycResume")}
              className="bg-gray-200 px-6 py-3 rounded-lg flex-1 mr-2"
            >
              <Text className="text-gray-800 font-medium text-center">CANCEL</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleProceed}
              className="bg-green-500 px-6 py-3 rounded-lg flex-1 ml-2"
            >
              <Text className="text-white font-medium text-center">PROCEED</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

export default Addresse;
