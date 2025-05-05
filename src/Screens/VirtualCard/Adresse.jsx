import React from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, ImageBackground, Dimensions } from 'react-native';
import TopLogo from "../../images/TopLogo.png";
import BG from "../../images/BG.jpg";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useDispatch } from 'react-redux';
import { setAddressProof } from '../../features/Kyc/kycReducer';

const Addresse = ({ navigation }) => {
  const dispatch = useDispatch();
  
  const handleProceed = () => {
    navigation.navigate("AddressSelect", {
      onAddressSelected: (addressProof) => {
        dispatch(setAddressProof({
          type: addressProof.type,
          uri: addressProof.uri,
          name: `address_${Date.now()}.jpg`,
          coordinates: addressProof.coordinates
        }));
        navigation.navigate("KycResume");
      }
    });
  };

  return (
    <ImageBackground source={BG} style={{ flex: 1 }} resizeMode="cover">
      <View className="flex-1 justify-center items-center">
        <View className="bg-white bg-opacity-90 p-6 rounded-lg shadow-lg w-11/12 max-w-md">
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
            Pour finaliser votre vérification, nous avons besoin de confirmer votre adresse. 
            Vous pouvez soit partager votre localisation, soit télécharger un justificatif de domicile.
          </Text>
          
          {/* Action Buttons */}
          <View className="flex-row justify-between">
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              className="bg-gray-200 px-6 py-3 rounded-lg flex-1 mr-2"
            >
              <Text className="text-gray-800 font-medium text-center">RETOUR</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleProceed}
              className="bg-[#7ddd7d] px-6 py-3 rounded-lg flex-1 ml-2"
            >
              <Text className="text-white font-medium text-center">CONTINUER</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
};

export default Addresse;