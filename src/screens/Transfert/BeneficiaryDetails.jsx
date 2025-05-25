import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  StatusBar
} from "react-native";
import { AntDesign } from '@expo/vector-icons';
import Ionicons from "@expo/vector-icons/Ionicons";
import { MaterialIcons } from '@expo/vector-icons';
import HomeImage from "../../images/HomeImage2.png";
import button from "../../images/ButtomLogo.png";
import { useNavigation, useRoute } from '@react-navigation/native';
import { useInitTransferMutation } from '../../services/Transfer/transferApi';
import Toast from 'react-native-toast-message';

const BeneficiaryDetails = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [initTransfer, { isLoading }] = useInitTransferMutation();
  
  const {
    contact,
    amount,
    convertedAmount,
    totalAmount,
    transferFee,
    fromCurrency,
    toCurrency,
    countryName,
    cadRealTimeValue,
    provider
  } = route.params;

  const [phoneNumber, setPhoneNumber] = useState(contact?.phone || '');
  const [recipientName, setRecipientName] = useState(contact?.name || '');
  const [address, setAddress] = useState('');

  const handleSubmit = async () => {
    if (!phoneNumber || !recipientName) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill all required fields'
      });
      return;
    }

    try {
      await initTransfer({
        country: countryName,
        amount: parseFloat(amount),
        firstname: recipientName.split(' ')[0],
        lastname: recipientName.split(' ').slice(1).join(' ') || ' ',
        phone: phoneNumber,
        provider,
        address,
        description: `Transfer of ${amount} ${fromCurrency} to ${recipientName}`
      }).unwrap();
      
      navigation.navigate('Success', {
        message: 'Transfer initiated successfully',
        nextScreen: 'MainTabs'
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Transfer failed',
        text2: error.data?.message || 'Something went wrong'
      });
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#121212' }}>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
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
          <MaterialIcons 
            name="menu" 
            size={24} 
            color="white" 
            style={{ marginLeft: "auto" }} 
            onPress={() => navigation.openDrawer()}
          />
        </View>
        <View style={{ borderColor: 'gray', borderWidth: 1, borderStyle: 'dashed', marginBottom: 4 }} />
        
        <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' }}>
          Beneficiary Details
        </Text>
        
        <Text style={{ color: '#D1D1D1', marginBottom: 8 }}>
          {provider === 'ORANGE_MONEY' ? 'Orange Money' : 'MTN Mobile Money'}
        </Text>
        
        <Text style={{ color: 'white', marginBottom: 20 }}>
          The recipient name must match their legal name registered with their mobile operator.
        </Text>

        <TextInput
          placeholder="Recipient Full Name"
          placeholderTextColor="#B0B0B0"
          style={{
            backgroundColor: 'white',
            color: 'black',
            padding: 15,
            borderRadius: 8,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: 'gray'
          }}
          value={recipientName}
          onChangeText={setRecipientName}
        />

        <TextInput
          placeholder="Phone Number"
          placeholderTextColor="#B0B0B0"
          keyboardType="phone-pad"
          style={{
            backgroundColor: 'white',
            color: 'black',
            padding: 15,
            borderRadius: 8,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: 'gray'
          }}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
        />

        <TextInput
          placeholder="Address (Optional)"
          placeholderTextColor="#B0B0B0"
          style={{
            backgroundColor: 'white',
            color: 'black',
            padding: 15,
            borderRadius: 8,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: 'gray'
          }}
          value={address}
          onChangeText={setAddress}
        />

        <Text style={{ color: '#D1D1D1', marginBottom: 20 }}>
          Please verify the recipient information as we may not be able to refund the transfer once it has been sent.
        </Text>

        <TouchableOpacity 
          style={{
            backgroundColor: '#7ddd7d',
            padding: 15,
            borderRadius: 8,
            alignItems: 'center',
            marginTop: 20,
            opacity: isLoading ? 0.7 : 1
          }}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Text style={{ color: 'black', fontSize: 16, fontWeight: 'bold' }}>
            {isLoading ? 'Processing...' : 'NEXT'}
          </Text>
        </TouchableOpacity>
        
        {/* Footer Disclaimer */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 40 }}>
          <Ionicons name="shield-checkmark" size={18} color="orange" />
          <Text style={{ color: 'white', marginLeft: 5, fontSize: 12 }}>
            Do not share your personal information...
          </Text>
        </View>
      </ScrollView>
      <Toast />
    </SafeAreaView>
  );
};

export default BeneficiaryDetails;