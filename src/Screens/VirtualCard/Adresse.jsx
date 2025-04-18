import React from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, ImageBackground, Dimensions } from 'react-native';
import TopLogo from "../../Images/TopLogo.png";
import BG from "../../Images/BG.jpg"; // Update with your background image path
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

// Get device width for responsive designs
const { width } = Dimensions.get('window');

const Addresse = ({ navigation }) => {
  return (
    <ImageBackground source={BG} style={{ flex: 1 }} resizeMode="cover">
      {/* Main Content - Centering the Box */}
      <View className="flex-1 justify-center items-center">
        <View className="bg-white bg-opacity-80 p-6 rounded-lg shadow-lg w-11/12 max-w-md">
          <Image
            source={require("../../Images/Localisation.png")} // Placeholder image
            style={{
              width: "100%", // Make the image responsive
              height: width * 0.45, // Set height based on width for aspect ratio
              marginBottom: 10, // Added margin for spacing
            }}
            resizeMode="contain" // Ensure the image scales correctly
          />
          <Text className="text-gray-700 text-center leading-5 mb-6">
            To enhance your security and streamline our Know Your
            Customer (KYC) process, SENDO requires access to your
            device's background location. Rest assured, this
            information is solely used for identity verification purposes
            and is treated with the utmost confidentiality.
          </Text>
          
          {/* Action Buttons */}
          <View className="flex-row justify-between">
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              className="bg-gray-200 px-6 py-3 rounded-lg flex-1 mr-2"
            >
              <Text className="text-gray-800 font-medium text-center">CANCEL</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => navigation.navigate("AddressSelect")}
              className="bg-green-500 px-6 py-3 rounded-lg flex-1 ml-2"
            >
              <Text className="text-white font-medium text-center">PROCEED</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ImageBackground>
  );
};

export default Addresse;
