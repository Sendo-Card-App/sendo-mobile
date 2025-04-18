import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, StatusBar } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import Ionicons from "@expo/vector-icons/Ionicons";
import { MaterialIcons } from '@expo/vector-icons';
import HomeImage from "../../Images/HomeImage2.png";
import button from "../../Images/ButtomLogo.png";
import RoyalBank from "../../Images/RoyalBank.png"; // Make sure to import your images
import om from "../../Images/om.png"; // Import respective logos
import mtn from "../../Images/mtn.png"; // Import respective logos
import { useNavigation } from '@react-navigation/native';

const PaymentMethod = () => {
  const [selectedBank, setSelectedBank] = useState('');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const navigation = useNavigation();

  // Bank Data with logos
  const banks = [
    { id: '1', name: 'Royal Bank Canada', logo: RoyalBank },
    { id: '2', name: 'Banque Atlantique' },
    { id: '3', name: 'Orange Money', logo: om },
    { id: '4', name: 'Mobile Money', logo: mtn },
  ];

  const toggleDropdown = () => {
    setDropdownVisible(!dropdownVisible);
  };

  const selectBank = (bank) => {
    setSelectedBank(bank.name);
    setDropdownVisible(false);
  };

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: '#121212' }}>
      <StatusBar barStyle="light-content" />
      {/* Header */}
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
      <View style={{ borderColor: 'gray', borderWidth: 1, borderStyle: 'dashed', marginBottom: 4 }} />
      <Text style={{ color: 'white', fontSize: 25, marginBottom: 10, marginLeft: 40, fontWeight: "bold" }}>Moyen de paiement</Text>

      {/* Dropdown */}
      <TouchableOpacity
        style={{
          borderWidth: 1,
          borderColor: 'gray',
          padding: 15,
          borderRadius: 8,
          backgroundColor: 'white',
          marginTop: 30,
        }}
        onPress={toggleDropdown}
      >
        <Text>{selectedBank || 'Choisissez une banque'}</Text>
      </TouchableOpacity>

      {dropdownVisible && (
        <View
          style={{
            marginTop: -5,
            borderRadius: 8,
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            zIndex: 2,
            position: "relative",
            padding: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
          }}
        >
          <FlatList
            data={banks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 10,
                }}
                onPress={() => selectBank(item)}
              >
                <Image
                  source={item.logo} // Display each bank logo
                  style={{ width: 30, height: 30, marginRight: 10, borderRadius: 5 }}
                />
                <Text style={{ color: "black", fontSize: 20 }}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Next Button */}
      <TouchableOpacity
        style={{
          marginTop: 200,
          padding: 10,
          backgroundColor: 'green',
          borderRadius: 8,
          alignItems: 'center',
          width: 150,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
        onPress={() => navigation.navigate("BeneficiaryDetails")}
      >
        <Text style={{ color: 'black', fontSize: 16, fontWeight: 'bold' }}>SUIVANT</Text>
      </TouchableOpacity>

      {/* Footer (fixed to the bottom) */}
      <View style={{ flex: 1, justifyContent: 'flex-end', marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="shield-checkmark" size={18} color="orange" />
          <Text style={{ color: 'white', marginLeft: 5, fontSize: 12 }}>
            Ne partagez pas vos informations personnelles…
          </Text>
        </View>
      </View>
    </View>
  );
};

export default PaymentMethod;
