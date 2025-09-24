import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, StatusBar } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import Toast from 'react-native-toast-message';
import Loader from "../../components/Loader";
import { useBankrechargeMutation } from '../../services/WalletApi/walletApi';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const BankDepositRecharge = ({ navigation }) => {
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const [bankRecharge] = useBankrechargeMutation();

const pickFile = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*' });
    if (!result.assets || !result.assets.length) return;
    setFile(result.assets[0]);
  } catch (err) {
    Toast.show({ type: 'error', text1: 'Erreur', text2: 'Impossible de sélectionner le fichier' });
  }
};

const handleSubmit = async () => {
  if (!amount || !file) {
    Toast.show({ type: 'error', text1: 'Erreur', text2: 'Veuillez remplir tous les champs obligatoires' });
    return;
  }

  setLoading(true);
  try {
    const formData = new FormData();
    formData.append('method', 'BANK_TRANSFER');
    formData.append('amount', amount);
    formData.append('bankFile', {
      uri: file.uri,
      name: file.name || `fichier_${Date.now()}`,
      type: file.mimeType || 'application/octet-stream',
    });

    const response = await bankRecharge(formData).unwrap();

    Toast.show({ type: 'success', text1: 'Succès', text2: response?.message || 'Dépôt bancaire effectué avec succès' });
    navigation.goBack();
  } catch (error) {
    Toast.show({
      type: 'error',
      text1: 'Erreur',
      text2: error?.data?.message || error?.error || error?.message || 'Une erreur est survenue lors du dépôt bancaire'
    });
  } finally {
    setLoading(false);
  }
};



  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <StatusBar backgroundColor="#7ddd7d" barStyle="light-content" />
      
      {/* Header */}
      <View style={{ backgroundColor: '#7ddd7d', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>{t('screens.bankDeposit')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0D1C6A', marginBottom: 20, textAlign: 'center' }}>
          {t('bank_deposit.title') || 'Bank Deposit'}
        </Text>

        {/* Amount Input */}
        <Text style={{ marginBottom: 5 }}>{t('bank_deposit.amount')}</Text>
        <TextInput
          style={{ borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, marginBottom: 20 }}
          keyboardType="numeric"
          placeholder={t('bank_deposit.amount_placeholder')}
          value={amount}
          onChangeText={setAmount}
        />

        {/* File Upload */}
        <TouchableOpacity onPress={pickFile} style={{ padding: 15, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, marginBottom: 10, alignItems: 'center', backgroundColor: '#f5f5f5' }}>
          <Text>{file ? file.name : t('bank_deposit.choose_file')}</Text>
        </TouchableOpacity>

        {file?.mimeType?.startsWith('image') && (
          <Image source={{ uri: file.uri }} style={{ width: '100%', height: 180, marginBottom: 20, borderRadius: 10 }} resizeMode="contain" />
        )}

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          style={{ backgroundColor: loading ? '#ccc' : '#7ddd7d', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 20 }}
        >
          {loading ? <Loader color="white" /> : <Text style={{ color: 'white', fontWeight: 'bold' }}>{t('bank_deposit.submit')}</Text>}
        </TouchableOpacity>

        <Text style={{ fontSize: 12, color: '#666', textAlign: 'center' }}>{t('bank_deposit.file_requirements')}</Text>
      </ScrollView>
    </View>
  );
};

export default BankDepositRecharge;
