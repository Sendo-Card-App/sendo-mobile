import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StatusBar,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { AntDesign, MaterialIcons } from '@expo/vector-icons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import HomeImage from '../../images/HomeImage2.png';
import button from '../../images/ButtomLogo.png';
import om from '../../images/om.png';
import mtn from '../../images/mtn.png';
import bank from '../../images/bank.png'; // 🏦 Add a bank icon in your assets

const PaymentMethod = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();

   const {
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
  // Common params to send in navigation
  const params = {
   // contact,
    amount,
    convertedAmount,
    totalAmount,
    transferFee,
    fromCurrency,
    toCurrency,
    countryName,
    cadRealTimeValue,
    provider,
  };
  console.log('Selected provider:', provider);

  // Check which method was selected
  if (provider === 'Virement Bancaire') {
    // Navigate to the new bank transfer screen
    navigation.navigate('BankTransferDetails', params);
  } else {
    // Keep existing behavior for Orange Money and MTN Money
    navigation.navigate('BeneficiarySelection', params);
  }
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

      {/* Payment Methods */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.methodsContainer}>
          <Pressable style={styles.card} onPress={() => handleSelect('Orange Money')}>
            <View style={styles.cardLeft}>
              <Image source={om} style={styles.logo} />
              <Text style={styles.bankName}>Orange Money</Text>
            </View>
            <AntDesign name="right-circle" size={20} color="#7ddd7d" />
          </Pressable>

          <Pressable style={styles.card} onPress={() => handleSelect('MTN Mobile Money')}>
            <View style={styles.cardLeft}>
              <Image source={mtn} style={styles.logo} />
              <Text style={styles.bankName}>MTN Mobile Money</Text>
            </View>
            <AntDesign name="right-circle" size={20} color="#7ddd7d" />
          </Pressable>

          <Pressable style={styles.card} onPress={() => handleSelect('Virement Bancaire')}>
              <View style={styles.cardLeft}>
                <Image source={bank} style={styles.logo} />
                <Text style={styles.bankName}>Virement Bancaire</Text>
              </View>
              <AntDesign name="right-circle" size={20} color="#7ddd7d" />
            </Pressable>

        </View>
      </ScrollView>

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
    borderColor: '#C0C0C0',
    borderWidth: 1,
    borderStyle: 'dashed',
    marginBottom: 15,
  },
  title: {
    color: '#000',
    fontSize: 22,
    marginBottom: 20,
    marginLeft: 10,
    fontWeight: 'bold',
  },
  methodsContainer: {
    gap: 15,
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E6E6E6',
    borderRadius: 16,
    paddingVertical: 15,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logo: {
    width: 45,
    height: 45,
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
