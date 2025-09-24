import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StatusBar,
  StyleSheet,
  Pressable
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

  const handleSelect = (provider) => {
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
      provider,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F2" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="left" size={24} color="#000" />
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

      {/* Pressables */}
      <Pressable style={styles.card} onPress={() => handleSelect('Orange Money')}>
        <Image source={om} style={styles.logo} />
        <Text style={styles.bankName}>Orange Money</Text>
      </Pressable>

      <Pressable style={styles.card} onPress={() => handleSelect('MTN Mobile Money')}>
        <Image source={mtn} style={styles.logo} />
        <Text style={styles.bankName}>MTN Mobile Money</Text>
      </Pressable>

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
    marginBottom: 20,
    marginLeft: 10,
    fontWeight: 'bold',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#7ddd7d',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  logo: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
    marginRight: 15,
  },
  bankName: {
    fontSize: 16,
    fontWeight: '600',
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
