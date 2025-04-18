import { View, Text, Image, TouchableOpacity, ScrollView, TextInput } from "react-native";
import React from "react";
import TopLogo from "../../Images/TopLogo.png";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import KycTab from "../../components/KycTab";

const AddressConfirm = ({ navigation }) => {
  const [address, setAddress] = React.useState("");
  
  // Sample coordinates for the map
  const initialRegion = {
    latitude: 48.8566,
    longitude: 2.3522,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  // Sample marker location
  const markerLocation = {
    latitude: 48.8566,
    longitude: 2.3522,
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
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <AntDesign name="arrowleft" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.openDrawer()} className="ml-auto">
            <Ionicons name="menu-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Title Section */}
      <View className="border border-dashed border-gray-300 my-1" />
      <Text className="text-center text-white text-2xl my-3">
        Vérification de l'identité
      </Text>

      {/* Main Content */}
      <ScrollView className="flex-1 pb-3 bg-white rounded-t-3xl">
        <View className="px-6 py-4">
             {/* Top Tab */}
          <KycTab isActive="5" />

          {/* Map Section */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-800 mb-3 text-center">
              Où résidez-vous sur cette carte?
            </Text>
            
            {/* Search Bar */}
            <TextInput
              className="border border-gray-300 rounded-lg px-4 py-2 mb-4"
              placeholder="Search your address"
              value={address}
              onChangeText={setAddress}
            />
            
            {/* Map View */}
            {/* <View className="h-64 rounded-lg overflow-hidden border border-gray-200">
              <MapView
                style={{ flex: 1 }}
                initialRegion={initialRegion}
                showsUserLocation={true}
                showsMyLocationButton={true}
              >
                <Marker
                  coordinate={markerLocation}
                  title="Sunrise Center Bonaparte"
                  pinColor="red"
                />
              </MapView>
            </View> */}
            
            {/* Location Services Note */}
            <Text className="text-gray-500 text-sm mt-2 italic text-center">
              Vous pourriez avoir besoin d'activer votre localisation.
            </Text>
          </View>

          {/* Next Button */}
          <TouchableOpacity 
            className="bg-green-700 py-3 rounded-lg mt-4"
            onPress={() => navigation.navigate('KycResume')}
          >
            <Text className="text-white font-bold text-center">SUIVANT</Text>
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

export default AddressConfirm;