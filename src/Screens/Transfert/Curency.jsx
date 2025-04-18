import React from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, StatusBar } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import HomeImage from "../../Images/HomeImage2.png";
import button from "../../Images/ButtomLogo.png";
import ArrowGoRound from "../../Images/ArrowGoRound.png";
import person from "../../Images/person.png"; // Ensure you have this image in your project
import mtn from "../../Images/mtn.png"; // Ensure you have this image in your project
import om from "../../Images/om.png"; // Ensure you have this image in your project
import { useNavigation, useRoute } from '@react-navigation/native';

const Curency = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // Getting the parameters passed from BeneficiaryScreen
  const { countryName, conversionRate, flagImage } = route.params;

  return (
    <View style={{ flex: 1, backgroundColor: '#141414', padding: 16 }}>
      <StatusBar barStyle="light-content" />
      {/* Header Section */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
        <TouchableOpacity>
          <AntDesign name="arrowleft" size={24} color="white" onPress={() => navigation.goBack()} />
        </TouchableOpacity>
        <Image
          source={button}
          resizeMode="contain"
          style={{ width: 100, height: 70, marginLeft: 50 }}
        />
        <Image
          source={HomeImage}
          resizeMode="contain"
          style={{ width: 70, height: 70, marginTop: -15, marginLeft: 10 }}
        />
        <MaterialIcons name="menu" size={24} color="white" style={{ marginLeft: "auto" }} onPress={() => navigation.openDrawer()} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Currency Information */}
        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <Image source={flagImage} resizeMode="contain" style={{ width: 50, height: 50, marginBottom: 10 }} />
          <Text style={{ color: 'white', fontSize: 20 }}>{countryName}</Text>
          <Text style={{ color: 'white', marginTop: 15 }}>{conversionRate}</Text>
        </View>

        {/* Amount Section */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 30 }}>
          <View style={{ flex: 1, paddingHorizontal: 2, borderRadius: 10, borderColor: '#7f7f7f', borderWidth: 1, paddingVertical: 5, flexDirection: 'row', alignItems: 'center' }}>
            <TextInput
              keyboardType="number-pad"
              placeholder="Amount"
              placeholderTextColor="#aaa"
              style={{ flex: 1, color: 'white' }}
            />
          </View>
          <Image source={ArrowGoRound} style={{ width: 24, height: 24, marginLeft: 10 }} />
          <View style={{ flex: 1.5, paddingHorizontal: 2, borderRadius: 10, borderColor: '#7f7f7f', borderWidth: 1, paddingVertical: 5, flexDirection: 'row', alignItems: 'center' }}>
            <TextInput
              keyboardType="number-pad"
              placeholder="Converted Amount"
              placeholderTextColor="#aaa"
              style={{ flex: 1, color: 'white' }}
              editable={false} // Make this field read-only
            />
          </View>
        </View>
        <View style={{ borderColor: 'gray', borderWidth: 1, borderStyle: 'dashed', marginTop: 20, marginBottom: 4 }} />

        {/* Promo Code Section */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20 }}>
          <Text style={{ color: 'white', marginRight: 8 }}>CODE PROMO</Text>
          <TextInput
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: '#7f7f7f',
              borderRadius: 8,
              paddingHorizontal: 8,
              paddingVertical: 4,
              color: 'white',
              height: 40,
            }}
            placeholderTextColor="#aaa"
          />
          <TouchableOpacity style={{
            backgroundColor: '#7ddd7d',
            borderRadius: 8,
            paddingVertical: 6,
            paddingHorizontal: 12,
            marginLeft: 8,
          }}>
            <Text style={{ color: 'black' }}>OK</Text>
          </TouchableOpacity>
        </View>
        <View style={{ borderColor: 'gray', borderWidth: 1, borderStyle: 'dashed', marginTop: 20, marginBottom: 4 }} />


        {/* Instructions Section */}
        <View style={{ backgroundColor: '#333', borderRadius: 16, padding: 24, marginLeft: 5, marginTop: 50 }}>
          <Text style={{ color: 'white', fontSize: 14, textAlign: 'center' }}>Envoyer de l’argent au {countryName} est facile</Text>
          <Text style={{ color: 'white', marginTop: 10, fontSize: 10, textAlign: 'center' }}>Super rapides et sans frais pour les portefeuilles mobiles</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 15 }}>
            <Image source={person} resizeMode="contain" style={{ width: 70, height: 70, marginTop: -15 }} />
            <Image source={mtn} resizeMode="contain" style={{ width: 70, height: 70, marginTop: -15 }} />
            <Image source={om} resizeMode="contain" style={{ width: 70, height: 70, marginTop: -15 }} />
          </View>
        </View>
         {/* Next Button */}
         <TouchableOpacity style={{
          backgroundColor: '#7ddd7d',
          borderRadius: 8,
          paddingVertical: 12,
          alignItems: 'center',
          width: 200,
          alignSelf: 'center',
          marginTop: 50,
        }} onPress={() => navigation.navigate("BeneficiarySelection")}>
          <Text style={{ color: 'black', fontSize: 18 }}>Suivant</Text>
        </TouchableOpacity>


        {/* Footer Disclaimer */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 }}>
          <Ionicons name="shield-checkmark" size={18} color="orange" />
          <Text style={{ color: 'white', marginLeft: 5, fontSize: 12 }}>
            Ne partagez pas vos informations personnelles…
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default Curency;
