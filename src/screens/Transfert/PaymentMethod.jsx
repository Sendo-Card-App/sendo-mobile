import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, Image, StatusBar } from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import Ionicons from "@expo/vector-icons/Ionicons";
import { MaterialIcons } from '@expo/vector-icons';
import HomeImage from "../../images/HomeImage2.png";
import { useTranslation } from 'react-i18next';

import button from "../../images/ButtomLogo.png";
import Visa from "../../images/Visa.png";
import om from "../../images/om.png";
import mtn from "../../images/mtn.png";
import { useNavigation, useRoute } from '@react-navigation/native';

const PaymentMethod = () => {
  const [selectedBank, setSelectedBank] = useState('');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const navigation = useNavigation();
  const { t } = useTranslation();
  const route = useRoute();
  
  const { 
    contact,
    amount,
    convertedAmount,
    totalAmount,
    transferFee,
    fromCurrency,
    toCurrency,
    countryName,
    cadRealTimeValue
  } = route.params;

  const banks = [
    { id: '2', name: 'Orange Money', logo: om, provider: 'Orange Money' },
    { id: '3', name: 'MTN Mobile Money', logo: mtn, provider: 'MTN Mobile Money' },
  ];

  const toggleDropdown = () => {
    setDropdownVisible(!dropdownVisible);
  };

  const selectBank = (bank) => {
    setSelectedBank(bank.name);
    setDropdownVisible(false);

    navigation.navigate("Address", { 
      contact,
      amount,
      convertedAmount,
      totalAmount,
      transferFee,
      fromCurrency,
      toCurrency,
      countryName,
      cadRealTimeValue,
      provider: bank.provider
    });
  };

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: '#121212' }}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="arrowleft" size={24} color="white" />
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
      <Text style={{ color: 'white', fontSize: 25, marginBottom: 10, marginLeft: 40, fontWeight: "bold" }}>
        {t("paymentMethodScreen.title")}
      </Text>

      {/* Dropdown Trigger */}
      <TouchableOpacity
        style={{
          borderWidth: 1,
          borderColor: 'gray',
          padding: 15,
          borderRadius: 8,
          backgroundColor: 'white',
          marginTop: 10,
        }}
        onPress={toggleDropdown}
      >
        <Text>{selectedBank || t("paymentMethodScreen.choosePayment")}</Text>
      </TouchableOpacity>

      {/* Dropdown List */}
      {dropdownVisible && (
        <View
          style={{
            marginTop: 5,
            borderRadius: 8,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
                {/* Square Logo Container */}
                <View style={{
                  width: 40,
                  height: 40,
                  backgroundColor: 'white',
                  borderRadius: 8,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginRight: 10,
                  borderWidth: 1,
                  borderColor: '#ccc',
                }}>
                  <Image
                    source={item.logo}
                    style={{ width: 25, height: 25, resizeMode: 'contain' }}
                  />
                </View>
                <Text style={{ color: "black", fontSize: 16 }}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Footer */}
      <View style={{ flex: 1, justifyContent: 'flex-end', marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="shield-checkmark" size={18} color="orange" />
          <Text style={{ color: 'white', marginLeft: 5, fontSize: 12 }}>
            {t("paymentMethodScreen.securityNote")}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default PaymentMethod;
