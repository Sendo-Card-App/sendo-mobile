import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import Loader from "../../components/Loader";
import { useRechargeWalletMutation } from '../../services/WalletApi/walletApi';
import PinVerificationModal from '../../components/PinVerificationModal';
import { useVerifyPasscodeMutation } from '../../services/Auth/authAPI'; // Import the new hook

const BankDepositRecharge = ({ navigation, route }) => {
  const { methodType = "BANK_TRANSFER" } = route.params || {};
  const [formData, setFormData] = useState({
    amount: '',
    transactionReference: '',
    bankName: '',
    accountNumber: '',
    methodType: methodType
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const { t } = useTranslation();
  const [rechargeWallet] = useRechargeWalletMutation();
  const [verifyPasscode] = useVerifyPasscodeMutation(); // Use the new hook

  const handleChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    const { amount, transactionReference, bankName, accountNumber, methodType } = formData;

    if (!amount || !transactionReference || !bankName || !accountNumber) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill all fields'
      });
      return;
    }

    setShowPinModal(true);
  };

  const handlePinVerified = async (pin) => {
    try {
      // Verify PIN using the API mutation
      const verificationResponse = await verifyPasscode(pin).unwrap();
      
      if (!verificationResponse) {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Invalid PIN'
        });
        return;
      }

      setIsSubmitting(true);
      setShowPinModal(false);
      
      const rechargeData = {
        method: methodType,
        amount: Number(formData.amount),
        transactionReference: formData.transactionReference,
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        pin
      };

      const response = await rechargeWallet(rechargeData).unwrap();
      
      if (response) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: 'Recharge completed successfully'
        });
        navigation.goBack();
      }
    } catch (error) {
      console.error('Transaction error:', error);
      let errorMessage = 'Error during transaction';
      
      if (error.status === 400) {
        errorMessage = 'Insufficient balance';
      } else if (error.status === 403) {
        errorMessage = 'Missing KYC Documents';
      } else if (error.status === 404) {
        errorMessage = 'Wallet not found';
      } else if (error.data?.message) {
        errorMessage = error.data.message;
      }
      
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>
        Method: {methodType}
      </Text>
      
      {/* Amount Input */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('bank_deposit.amount')}</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="cash-outline" size={20} color="#666" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder={t('bank_deposit.amount_placeholder')}
            placeholderTextColor="#999"
            keyboardType="numeric"
            value={formData.amount}
            onChangeText={(text) => handleChange('amount', text)}
          />
        </View>
      </View>
      
      {/* Transaction Reference */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('bank_deposit.reference')}</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="receipt-outline" size={20} color="#666" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder={t('bank_deposit.reference_placeholder')}
            placeholderTextColor="#999"
            value={formData.transactionReference}
            onChangeText={(text) => handleChange('transactionReference', text)}
          />
        </View>
      </View>
      
      {/* Bank Name */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('bank_deposit.bank_name')}</Text>
        <View style={styles.inputWrapper}>
          <AntDesign name="bank" size={20} color="#666" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder={t('bank_deposit.bank_placeholder')}
            placeholderTextColor="#999"
            value={formData.bankName}
            onChangeText={(text) => handleChange('bankName', text)}
          />
        </View>
      </View>
      
      {/* Account Number */}
      <View style={styles.inputContainer}>
        <Text style={styles.label}>{t('bank_deposit.account_number')}</Text>
        <View style={styles.inputWrapper}>
          <Ionicons name="card-outline" size={20} color="#666" style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder={t('bank_deposit.account_placeholder')}
            placeholderTextColor="#999"
            keyboardType="numeric"
            value={formData.accountNumber}
            onChangeText={(text) => handleChange('accountNumber', text)}
          />
        </View>
      </View>
      
      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <Loader color="white" />
        ) : (
          <Text style={styles.submitButtonText}>{t('bank_deposit.submit')}</Text>
        )}
      </TouchableOpacity>
      <PinVerificationModal
        visible={showPinModal}
        onClose={() => setShowPinModal(false)}
        onVerify={handlePinVerified}
        title="Confirm Transaction"
        subtitle="Enter your PIN to confirm the bank deposit"
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0D1C6A',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    backgroundColor: '#f9f9f9',
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: '#333',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#7ddd7d',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default BankDepositRecharge;