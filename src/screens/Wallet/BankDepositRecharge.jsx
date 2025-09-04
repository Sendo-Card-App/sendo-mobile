import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, StatusBar } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import Loader from "../../components/Loader";
import { useBankrechargeMutation } from '../../services/WalletApi/walletApi';
import { Ionicons } from '@expo/vector-icons';

// Constants for better maintainability
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

const BankDepositRecharge = ({ navigation }) => {
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();
  const [bankRecharge] = useBankrechargeMutation();

  const handleDocumentPick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ALLOWED_FILE_TYPES,
        copyToCacheDirectory: true,
        multiple: false
      });

      if (!result.assets || result.assets.length === 0) return;

      const selectedFile = result.assets[0];
      const fileInfo = await FileSystem.getInfoAsync(selectedFile.uri);

      if (fileInfo.size > MAX_FILE_SIZE) {
        Toast.show({
          type: 'error',
          text1: t('common.error'),
          text2: t('bank_deposit.errors.file_size')
        });
        return;
      }
      
      setFile(selectedFile);
    } catch (error) {
      console.error('Document pick error:', error);
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: t('bank_deposit.errors.file_pick')
      });
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!amount || !file) {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: t('bank_deposit.errors.required_fields')
      });
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: t('bank_deposit.errors.invalid_amount')
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('method', 'BANK_TRANSFER');
      formData.append('amount', numericAmount.toString());

      // Determine file extension safely
      let fileExtension = 'jpg';
      if (file.name && file.name.includes('.')) {
        fileExtension = file.name.split('.').pop();
      } else if (file.uri && file.uri.includes('.')) {
        fileExtension = file.uri.split('.').pop();
      } else if (file.mimeType) {
        if (file.mimeType.includes('pdf')) fileExtension = 'pdf';
        else if (file.mimeType.includes('png')) fileExtension = 'png';
        else if (file.mimeType.includes('jpeg') || file.mimeType.includes('jpg')) fileExtension = 'jpg';
      }

      const filename = file.name || `bank_deposit_${Date.now()}.${fileExtension}`;

      formData.append('bankFile', {
        uri: file.uri,
        name: filename,
        type: file.mimeType || 'application/octet-stream',
      });

      const response = await bankRecharge(formData).unwrap();

      Toast.show({
        type: 'success',
        text1: t('common.success'),
        text2: response?.message || t('bank_deposit.success.default')
      });

      navigation.goBack();
    } catch (error) {
      console.error('Bank recharge error:', error);
      
      // Error handling with translation support
      let errorMessage = t('bank_deposit.errors.default');
      if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.error) {
        errorMessage = error.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar backgroundColor="#7ddd7d" barStyle="light-content" />
      
      {/* Header */}
      <View className="bg-[#7ddd7d] flex-row items-center justify-between px-4 py-4"
        style={{ paddingTop: 50 }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-bold">
          {t('screens.bankDeposit')}
        </Text>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20 }}>
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#0D1C6A', marginBottom: 30, textAlign: 'center' }}>
          {t('bank_deposit.title') || 'Bank Deposit'}
        </Text>

        {/* Amount Input */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
            {t('bank_deposit.amount')}
          </Text>
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            borderWidth: 1, 
            borderColor: '#ddd', 
            borderRadius: 10, 
            paddingHorizontal: 15, 
            backgroundColor: '#f9f9f9' 
          }}>
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
          <Text style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>
            {t('bank_deposit.proof')}
          </Text>
          <TouchableOpacity
            onPress={handleDocumentPick}
            style={{ 
              padding: 15, 
              backgroundColor: '#eee', 
              borderRadius: 10, 
              alignItems: 'center', 
              borderWidth: 1, 
              borderColor: '#ddd', 
              borderStyle: 'dashed' 
            }}
          >
            <Text style={{ color: '#333', textAlign: 'center' }}>
              {file ? file.name : t('bank_deposit.choose_file')}
            </Text>
          </TouchableOpacity>

          {file && (
            <Text style={{ fontSize: 12, color: '#666', marginTop: 5, textAlign: 'center' }}>
              {t('bank_deposit.selected_file')}: {file.name}
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
          {t('bank_deposit.file_requirements')}
        </Text>
      </ScrollView>
    </View>
  );
};

export default BankDepositRecharge;