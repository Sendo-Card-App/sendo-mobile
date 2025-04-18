import { View, Text, Image, TouchableOpacity, ScrollView, TextInput } from "react-native";
import React, { useState } from "react";
import { MaterialIcons } from '@expo/vector-icons';
import button from "../../images/ButtomLogo.png";
import HomeImage from "../../images/HomeImage2.png";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

const Address = ({ navigation }) => {
  const [formData, setFormData] = useState({
    country: 'Canada',
    street: '1 Rue Sendo',
    postalCode: '75 200',
    city: 'Quebec'
  });

  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#000000', padding: 0 }}>
      <StatusBar style="light" />
      
      {/* Header with Logo and Navigation */}
      <View style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 10
        }}>
          <TouchableOpacity>
            <AntDesign name="arrowleft" size={24} color="white" onPress={() => navigation.goBack()} />
          </TouchableOpacity>

          <Image
            source={button}
            resizeMode="contain"
            style={{ width: 100, height: 80, marginLeft: 50 }}
          />
          <Image
            source={HomeImage}
            resizeMode="contain"
            style={{ width: 70, height: 70, marginTop: -15, marginLeft: 10 }}
          />
          <MaterialIcons
            name="menu"
            size={24}
            color="white"
            style={{ marginLeft: "auto" }}
            onPress={() => navigation.openDrawer()}
          />
        </View>

      {/* Title Section */}
      <View className="border border-dashed border-gray-300 my-1" />
      <Text className="text-center font-bold text-white text-2xl my-3">
        Votre Adresse de résidence
      </Text>

      {/* Main Content */}
      <ScrollView className="flex-1 pb-3" contentContainerStyle={{ backgroundColor: '#000000', borderTopLeftRadius: 30, borderTopRightRadius: 30 }}>
        <View className="px-6 py-4">
          
          {/* Country */}
          <View className="mb-4">
            <Text className="text-white mb-2">Pays</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 bg-white"
              value={formData.country}
              onChangeText={(text) => handleInputChange('country', text)}
              placeholder="Entrez votre pays"
            />
          </View>
           <View style={{ borderColor: 'gray', borderWidth: 1, borderStyle: 'dashed', marginBottom: 1 }} />
          
          {/* Street */}
          <View className="mb-4">
            <Text className="text-white mb-2">Rue</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 bg-white"
              value={formData.street}
              onChangeText={(text) => handleInputChange('street', text)}
              placeholder="Entrez votre rue"
            />
          </View>
           <View style={{ borderColor: 'gray', borderWidth: 1, borderStyle: 'dashed', marginBottom: 1 }} />
          
          {/* City */}
          <View className="mb-6">
            <Text className="text-white mb-2">Ville</Text>
            <TextInput
              className="border border-gray-300 rounded-lg p-3 bg-white"
              value={formData.city}
              onChangeText={(text) => handleInputChange('city', text)}
              placeholder="Entrez votre ville"
            />
          </View>
          
          {/* Next Button */}
          <TouchableOpacity 
            className="bg-green-500 py-3 rounded-xl mt-2 items-center justify-center"
            onPress={() => navigation.navigate('BankCard1')}
          >
            <Text className="text-white font-bold text-lg">Suivant</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer */}
      <View className="py-4 flex-row justify-center items-center gap-2">
        <Ionicons name="shield-checkmark" size={18} color="orange" />
        <Text className="text-sm text-white">
          Ne partagez pas vos informations personnelles…
        </Text>
      </View>
    </View>
  );
};

export default Address;
