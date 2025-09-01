import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import Loader from "../../components/Loader";
import { useBankrechargeMutation } from '../../services/WalletApi/walletApi';

const BankDepositRecharge = ({ navigation }) => {
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();
  const [bankRecharge] = useBankrechargeMutation();

  const handleDocumentPick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
        copyToCacheDirectory: true,
        multiple: false
      });

      if (result?.assets?.length > 0) {
        const selectedFile = result.assets[0];
        
        // Check file size (limit to 5MB)
        const fileInfo = await FileSystem.getInfoAsync(selectedFile.uri);
        if (fileInfo.size > 5 * 1024 * 1024) {
          Toast.show({
            type: 'error',
            text1: 'Error',
            text2: 'File size must be less than 5MB'
          });
          return;
        }

        setFile(selectedFile);
      }
    } catch (error) {
      console.error('Document pick error:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to pick file.'
      });
    }
  };

  const handleSubmit = async () => {
    if (!amount || !file) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter amount and upload a file',
      });
      return;
    }

    if (parseFloat(amount) <= 0) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Amount must be greater than 0',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Create a clean file object for FormData
      const filename = file.name || `bank_deposit_${Date.now()}.${file.mimeType?.includes('image') ? 'jpg' : 'pdf'}`;
      
      const formData = new FormData();
      formData.append('method', 'BANK_TRANSFER');
      formData.append('amount', parseFloat(amount).toString());
      
      // Use the correct file structure for React Native
      formData.append('bankFile', {
        uri: file.uri,
        name: filename,
        type: file.mimeType || 'application/octet-stream',
      });

      console.log('FormData being sent:', {
        amount: parseFloat(amount),
        method: 'BANK_TRANSFER',
        file: {
          name: filename,
          type: file.mimeType,
          size: file.size
        }
      });

      const response = await bankRecharge(formData).unwrap();

      console.log('Server response:', response);

      Toast.show({
        type: 'success',
        text1: 'Succès',
        text2: response?.message || 'Virement bancaire envoyé avec succès.',
      });
      
      navigation.goBack();
      
    } catch (error) {
      console.error('Bank recharge error:', error);
      
      // Enhanced error handling for production
      let errorMessage = 'Échec de la transaction';
      
      // Handle different error structures (development vs production)
      if (error) {
        // Check for RTK Query error structure
        if (error.data?.message) {
          errorMessage = error.data.message;
        } 
        // Check for axios-like error structure
        else if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        }
        // Check for network error
        else if (error.message) {
          errorMessage = error.message;
        }
        // Check for status codes directly on error object
        else if (error.status === 413) {
          errorMessage = 'Fichier trop volumineux';
        } else if (error.status === 415) {
          errorMessage = 'Type de fichier non supporté';
        } else if (error.status === 400) {
          errorMessage = 'Données invalides';
        }
        // Handle string errors
        else if (typeof error === 'string') {
          errorMessage = error;
        }
      }

      // Log the complete error for debugging
      console.log('Complete error object:', JSON.stringify(error, null, 2));

      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: errorMessage,
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
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>Justificatif de virement</Text>
        <TouchableOpacity
          onPress={handleDocumentPick}
          style={{ padding: 15, backgroundColor: '#eee', borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderStyle: 'dashed' }}
        >
          <Text style={{ color: '#333', textAlign: 'center' }}>
            {file ? file.name : '📎 Choisir un fichier (PDF ou Image)'}
          </Text>
        </TouchableOpacity>
        
        {file && (
          <Text style={{ fontSize: 12, color: '#666', marginTop: 5, textAlign: 'center' }}>
            Fichier sélectionné: {file.name}
          </Text>
        )}
      </View>

      {file?.mimeType?.startsWith('image') && (
        <Image 
          source={{ uri: file.uri }} 
          style={{ width: '100%', height: 200, marginBottom: 20, borderRadius: 10 }} 
          resizeMode="contain" 
        />
      )}

      <TouchableOpacity
        style={{ 
          backgroundColor: isSubmitting ? '#ccc' : '#7ddd7d', 
          borderRadius: 10, 
          padding: 15, 
          alignItems: 'center', 
          marginTop: 20,
          opacity: isSubmitting ? 0.7 : 1
        }}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <Loader color="white" />
        ) : (
          <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>
            {t('bank_deposit.submit')}
          </Text>
        )}
      </TouchableOpacity>

      {/* Info Text */}
      <Text style={{ fontSize: 12, color: '#666', marginTop: 20, textAlign: 'center' }}>
        Formats acceptés: PDF, JPG, PNG (max 5MB)
      </Text>
    </ScrollView>
  );
};

export default BankDepositRecharge;