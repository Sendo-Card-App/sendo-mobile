import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import Loader from "../../components/Loader";
import { useRechargeWalletMutation } from '../../services/WalletApi/walletApi';
import PinVerificationModal from '../../components/PinVerificationModal';
import { useVerifyPasscodeMutation } from '../../services/Auth/authAPI';

const BankDepositRecharge = ({ navigation }) => {
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const { t } = useTranslation();
  const [rechargeWallet] = useRechargeWalletMutation();
  const [verifyPasscode] = useVerifyPasscodeMutation();

  const handleDocumentPick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
        multiple: false
      });

      if (result?.assets?.length > 0) {
        setFile(result.assets[0]);
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to pick file.'
      });
    }
  };

  const handleSubmit = () => {
    if (!amount || !file) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter amount and upload a file'
      });
      return;
    }
    setShowPinModal(true);
  };

  const handlePinVerified = async (pin) => {
    try {
      const verification = await verifyPasscode(pin).unwrap();
      if (!verification) throw new Error('Invalid PIN');

      setIsSubmitting(true);
      setShowPinModal(false);

      const formData = new FormData();
      formData.append('amount', amount);
      formData.append('pin', pin);
      formData.append('file', {
        uri: file.uri,
        name: file.name || 'upload.pdf',
        type: file.mimeType || 'application/octet-stream'
      });

      const response = await rechargeWallet(formData).unwrap();

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Recharge completed'
      });
      navigation.goBack();
    } catch (error) {
      const message = error?.data?.message || 'Transaction failed';
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#0D1C6A', marginBottom: 30, textAlign: 'center' }}>
        {t('bank_deposit.title') || 'Bank Deposit'}
      </Text>

      {/* Amount Input */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>{t('bank_deposit.amount')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 15, backgroundColor: '#f9f9f9' }}>
          <TextInput
            style={{ flex: 1, height: 50, color: '#333', fontSize: 16 }}
            placeholder={t('bank_deposit.amount_placeholder')}
            placeholderTextColor="#999"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
        </View>
      </View>

      {/* File Upload */}
      <TouchableOpacity
        onPress={handleDocumentPick}
        style={{ padding: 15, backgroundColor: '#eee', borderRadius: 10, alignItems: 'center', marginBottom: 10 }}
      >
        <Text style={{ color: '#333' }}>
          {file ? file.name : 'Upload PDF or Image'}
        </Text>
      </TouchableOpacity>

      {file?.mimeType?.startsWith('image') && (
        <Image source={{ uri: file.uri }} style={{ width: '100%', height: 200, marginBottom: 20, borderRadius: 10 }} resizeMode="contain" />
      )}

      <TouchableOpacity
        style={{ backgroundColor: '#7ddd7d', borderRadius: 10, padding: 15, alignItems: 'center', marginTop: 20 }}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? <Loader color="white" /> : <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>{t('bank_deposit.submit')}</Text>}
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

export default BankDepositRecharge;
