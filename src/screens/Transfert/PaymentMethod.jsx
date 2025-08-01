import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  StatusBar,
  StyleSheet
} from 'react-native';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import HomeImage from '../../images/HomeImage2.png';
import button from '../../images/ButtomLogo.png';
import om from '../../images/om.png';
import mtn from '../../images/mtn.png';

const PaymentMethod = () => {
  const [selectedBank, setSelectedBank] = useState('');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();

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
    navigation.navigate('Address', {
      contact,
      amount,
      convertedAmount,
      totalAmount,
      transferFee,
      fromCurrency,
      toCurrency,
      countryName,
      cadRealTimeValue,
      provider: bank.provider,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F2" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="arrowleft" size={24} color="#000" />
        </TouchableOpacity>
        <Image source={button} style={styles.buttonLogo} resizeMode="contain" />
        <Image source={HomeImage} style={styles.homeImage} resizeMode="contain" />
        <MaterialIcons
          name="menu"
          size={24}
          color="#000"
          style={{ marginLeft: 'auto' }}
          onPress={() => navigation.openDrawer()}
        />
      </View>

      <View style={styles.divider} />
      <Text style={styles.title}>{t('paymentMethodScreen.title')}</Text>

      {/* Dropdown */}
      <TouchableOpacity style={styles.dropdownTrigger} onPress={toggleDropdown}>
        <Text style={{ color: selectedBank ? '#000' : '#888' }}>
          {selectedBank || t('paymentMethodScreen.choosePayment')}
        </Text>
      </TouchableOpacity>

      {dropdownVisible && (
        <View style={styles.dropdownList}>
          <FlatList
            data={banks}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.dropdownItem} onPress={() => selectBank(item)}>
                <View style={styles.logoContainer}>
                  <Image source={item.logo} style={styles.logo} />
                </View>
                <Text style={styles.bankName}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Ionicons name="shield-checkmark" size={18} color="#7ddd7d" />
        <Text style={styles.securityNote}>{t('paymentMethodScreen.securityNote')}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonLogo: {
    width: 100,
    height: 70,
    marginLeft: 40,
  },
  homeImage: {
    width: 70,
    height: 70,
    marginTop: -15,
    marginLeft: 10,
  },
  divider: {
    borderColor: 'gray',
    borderWidth: 1,
    borderStyle: 'dashed',
    marginBottom: 10,
  },
  title: {
    color: '#000',
    fontSize: 22,
    marginBottom: 10,
    marginLeft: 10,
    fontWeight: 'bold',
  },
  dropdownTrigger: {
    borderWidth: 1,
    borderColor: '#7ddd7d',
    padding: 15,
    borderRadius: 8,
    backgroundColor: '#fff',
    marginTop: 10,
  },
  dropdownList: {
    marginTop: 5,
    borderRadius: 8,
    backgroundColor: '#fff',
    padding: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  logoContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  logo: {
    width: 25,
    height: 25,
    resizeMode: 'contain',
  },
  bankName: {
    fontSize: 16,
    color: '#000',
  },
  footer: {
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  securityNote: {
    color: '#000',
    marginLeft: 5,
    fontSize: 12,
  },
});

export default PaymentMethod;
