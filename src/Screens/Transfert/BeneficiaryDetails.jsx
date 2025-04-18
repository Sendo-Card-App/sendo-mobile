import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  StyleSheet,
  StatusBar
} from "react-native";
import { AntDesign } from '@expo/vector-icons';
import Ionicons from "@expo/vector-icons/Ionicons";
import { MaterialIcons } from '@expo/vector-icons';
import HomeImage from "../../Images/HomeImage2.png";
import button from "../../Images/ButtomLogo.png";
import { useNavigation } from '@react-navigation/native';

const BeneficiaryDetails = () => {
  const navigation = useNavigation();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [recipientName, setRecipientName] = useState('');

  

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <StatusBar barStyle="light-content" />
        
        {/* Header - Reused from PaymentMethod */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <AntDesign name="arrowleft" size={24} color="white" onPress={() => navigation.goBack()} />
          </TouchableOpacity>

          <Image
            source={button}
            resizeMode="contain"
            style={styles.logoButton}
          />
          <Image
            source={HomeImage}
            resizeMode="contain"
            style={styles.logoHome}
          />
          <MaterialIcons 
            name="menu" 
            size={24} 
            color="white" 
            style={styles.menuIcon} 
            onPress={() => navigation.openDrawer()}
          />
        </View>
          <View style={{ borderColor: 'gray', borderWidth: 1, borderStyle: 'dashed', marginBottom: 4 }} />
        <Text style={styles.title}>Détails sur le bénéficiaire</Text>
        <Text style={styles.subtitle}>Orange Money</Text>
        
        <Text style={styles.description}>
          Le nom du bénéficiaire doit être son nom légal, tel qu'il est enregistré auprès de son opérateur mobile.
        </Text>

        <TextInput
          placeholder="André le Canadien"
          placeholderTextColor="#B0B0B0"
          style={styles.input}
          value={recipientName}
          onChangeText={setRecipientName}
        />

        <TextInput
          placeholder="+237 -"
          placeholderTextColor="#B0B0B0"
          keyboardType="phone-pad"
          style={styles.input}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
        />

        <Text style={styles.warningText}>
          Veuillez vérifier les informations du destinataire car nous ne pourrons peut-être pas rembourser le transfert une fois qu'il a été envoyé.
        </Text>

        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.navigate("Address")}
        >
          <Text style={styles.buttonText}>SUIVANT</Text>
        </TouchableOpacity>
        
       {/* Footer Disclaimer */}
       <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 180 }}>
          <Ionicons name="shield-checkmark" size={18} color="orange" />
          <Text style={{ color: 'white', marginLeft: 5, fontSize: 12 }}>
            Ne partagez pas vos informations personnelles…
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212'
  },
  scrollContainer: {
    padding: 20
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 1
  },
  logoButton: {
    width: 100,
    height: 70,
    marginLeft: 50
  },
  logoHome: {
    width: 70,
    height: 70,
    marginTop: -15,
    marginLeft: 10
  },
  menuIcon: {
    marginLeft: 'auto'
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop: 10,
    textAlign: 'center'
  },
  subtitle: {
    color: '#D1D1D1',
    marginBottom: 8
  },
  description: {
    color: 'white',
    marginBottom: 8
  },
  input: {
    backgroundColor: 'white',
    color: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'gray'
  },
  warningText: {
    color: '#D1D1D1',
    marginBottom: 16
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    paddingVertical: 10
  },
  footerText: {
    color: 'white',
    fontSize: 14,
    marginLeft: 8
  }
});

export default BeneficiaryDetails;