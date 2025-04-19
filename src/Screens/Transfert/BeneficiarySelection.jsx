import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from '@expo/vector-icons/Feather';
import HomeImage from "../../images/HomeImage2.png";
import button from "../../images/ButtomLogo.png";
import Cameroon from "../../images/Cameroon.png";
import Canada from "../../images/Canada.png";
import { useNavigation } from '@react-navigation/native';

const BeneficiarySelection = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0D0D0D' }}>
      <StatusBar barStyle="light-content" />

      <View style={{ padding: 20 }}>
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

        <Text style={{ color: 'white', fontSize: 25, marginBottom: 10, marginLeft: 40, fontWeight: "bold" }}>Choisir un bénéficiaire</Text>

        {/* Add Beneficiary Button */}
        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'black', padding: 10, borderRadius: 8, marginBottom: 10, marginLeft: 25 }}>
          <View style={{
            backgroundColor: '#7ddd7d', // Background color for the circle  
            borderRadius: 25,         // Half of width/height for a perfect circle  
            width: 50,                // Width of the circle  
            height: 50,               // Height of the circle  
            justifyContent: 'center', // Center the icon vertically  
            alignItems: 'center',     // Center the icon horizontally  
          }}>
            <AntDesign name="user" size={20} color="white" />
          </View>

          <Text style={{ marginLeft: 10, color: 'white', fontSize: 15 }}>Ajoutez un nouveau destinataire</Text>
        </TouchableOpacity>

        {/* Search Input */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20, justifyContent: "center", backgroundColor: "white", borderWidth: 0.5, height: 40, borderRadius: 10, margin: 10 }}>
          <AntDesign name="search1" size={20} color="gray" /> 
          <TextInput
            style={{
              marginLeft: -2,
              paddingHorizontal: 40,
              color: 'black', // Change to black for better visibility  
              backgroundColor: 'white',
            }}
            placeholder="Rechercher des destinataires"
            placeholderTextColor="#aaa"
          />
        </View>

        <Text style={{ color: 'white', marginTop: 20, marginBottom: 5, fontSize: 20, marginLeft: 20 }}>Contacts</Text>

        {/* List of Contacts */}
        <ScrollView>
          <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }} onPress={() => navigation.navigate("PaymentMethod")}>
            <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', marginRight: 10 }}>
              <Text style={{ color: 'grey', fontSize: 20 }}>A</Text>
            </View>
            <Text style={{ color: 'white' }}>André</Text>
          </TouchableOpacity>
          {/* Add more contacts as needed */}
        </ScrollView>
      </View>

      {/* Footer (fixed to the bottom) */}
      <View style={{ flex: 1, justifyContent: 'flex-end', marginBottom: 20 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="shield-checkmark" size={18} color="orange" />
          <Text style={{ color: 'white', marginLeft: 5, fontSize: 12 }}>
            Ne partagez pas vos informations personnelles…
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default BeneficiarySelection;
