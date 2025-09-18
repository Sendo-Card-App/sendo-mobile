import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useGetBalanceQuery,
  useTransferFundsMutation,
  useGetWalletDetailsQuery,
} from '../../services/WalletApi/walletApi';
import { useGetUserProfileQuery } from '../../services/Auth/authAPI';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { showErrorToast } from '../../utils/errorHandler';
import Loader from '../../components/Loader';
import PinVerificationModal from '../../components/PinVerificationModal'; // PIN modal

const WalletTransfer = ({ navigation }) => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [walletId, setWalletId] = useState('');
  const [description, setDescription] = useState('');
  const [userWalletId, setUserWalletId] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [debouncedWalletId, setDebouncedWalletId] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingTransferData, setPendingTransferData] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedWalletId(walletId);
    }, 500);
    return () => clearTimeout(timer);
  }, [walletId]);

  const { data: userProfile, isLoading: isProfileLoading } = useGetUserProfileQuery();
  const userId = userProfile?.data?.id;

  const {
    data: balanceData,
    isLoading: isBalanceLoading,
    error: balanceError,
    isError: isBalanceError,
  } = useGetBalanceQuery(userId, {
    skip: !userId,
    pollingInterval: 10000,
  });

  const {
    data: recipientData,
    isLoading: isRecipientLoading,
    isError: isRecipientError,
  } = useGetWalletDetailsQuery(debouncedWalletId, { skip: !debouncedWalletId });

  useEffect(() => {
    if (recipientData?.data?.user) {
      const { firstname, lastname } = recipientData.data.user;
      setRecipientName(`${firstname} ${lastname}`);
    } else if (isRecipientError) {
      setRecipientName(t('wallet_transfer.recipient_not_found'));
    } else if (!debouncedWalletId) {
      setRecipientName('');
    }
  }, [recipientData, isRecipientError, debouncedWalletId, t]);

  useEffect(() => {
    const walletId = userProfile?.data?.wallet?.matricule || userProfile?.data?.walletId;
    if (walletId) setUserWalletId(walletId);
  }, [userProfile]);

  const [transferFunds, { isLoading: isTransferring }] = useTransferFundsMutation();

  const validateAndOpenPinModal = () => {
    const transferAmount = parseFloat(amount);
    if (!walletId || isNaN(transferAmount) || transferAmount <= 0) {
      showErrorToast('ACTION_FAILED', 'Veuillez fournir un montant supérieur à 0.');
      return;
    }

    if (transferAmount > (balanceData?.data?.balance || 0)) {
      showErrorToast('ACTION_FAILED', 'Votre solde est insuffisant pour effectuer ce transfert.');
      return;
    }

    setPendingTransferData({
      fromWallet: userWalletId,
      toWallet: walletId,
      amount: transferAmount,
      description,
    });
    setShowPinModal(true);
  };

  const handlePinVerified = async () => {
    if (!pendingTransferData) return;

    const { fromWallet, toWallet, amount: transferAmount, description } = pendingTransferData;

    try {
      await transferFunds({
        fromWallet,
        toWallet,
        amount: transferAmount,
        transfer_description: description,
      }).unwrap();

      setShowPinModal(false);
      setPendingTransferData(null);

      navigation.navigate('Success', {
        message: 'Transfert effectué avec succès !',
        nextScreen: 'MainTabs',
      });
    } catch (error) {
      const status = error?.status;
      if (status === 503) showErrorToast('SERVICE_UNAVAILABLE');
      else if (status === 500) showErrorToast('ACTION_FAILED', 'Erreur serveur lors du transfert');
      else if (status === 400) showErrorToast('ACTION_FAILED', 'Veuillez remplir tous les champs.');
      else if (status === 403) showErrorToast('KYC Erreur', 'Veuillez soumettre vos KYC.');
      else if (status === 404) showErrorToast('ACTION_FAILED', 'Portefeuille introuvable');
      else showErrorToast('ACTION_FAILED', error?.data?.message || 'Une erreur est survenue.');

      setShowPinModal(false);
      setPendingTransferData(null);
    }
  };

  const isLoading = isProfileLoading || isBalanceLoading;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar backgroundColor="#7ddd7d" barStyle="light-content" />

      {/* Header with back button */}
      <View style={{
        backgroundColor: '#7ddd7d',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 20,
        paddingBottom: 15,
        paddingHorizontal: 15,
      }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40 }}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={{
          color: '#fff',
          fontSize: 20,
          fontWeight: 'bold',
          textAlign: 'center',
          flex: 1,
        }}>
          {t('screens.walletTransfer')}
        </Text>

        {/* Placeholder to balance layout */}
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: '5%', paddingBottom: 50 }}>
          {/* Available Balance */}
          <View style={{ backgroundColor: '#F1F1F1', borderRadius: 10, padding: 15, marginVertical: 20 }}>
            <Text style={{ fontSize: 16, color: '#666' }}>{t('wallet_transfer.available_balance')}</Text>
            {isLoading ? (
              <ActivityIndicator size="small" color="#0D1C6A" />
            ) : isBalanceError ? (
              <Text style={{ color: 'red' }}>{t('wallet_transfer.balance_error')}</Text>
            ) : (
              <>
                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#0D1C6A' }}>
                  {balanceData?.data?.balance?.toFixed(2) || '0.00'} {balanceData?.data?.currency}
                </Text>
                {userWalletId && (
                  <Text style={{ fontSize: 14, color: '#666', marginTop: 5 }}>
                    {t('wallet_transfer.your_matricule')}: {userWalletId}
                  </Text>
                )}
              </>
            )}
          </View>

          {/* Recipient */}
          <Text style={{ fontSize: 16, color: '#666', marginBottom: 5 }}>
            {t('wallet_transfer.recipient_id')}
          </Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: '#E0E0E0',
              borderRadius: 10,
              padding: 15,
              fontSize: 16,
              marginBottom: 20,
              backgroundColor: '#fff',
            }}
            placeholder={t('wallet_transfer.recipient_placeholder')}
            value={walletId}
            onChangeText={setWalletId}
          />

          {walletId ? (
            <>
              <Text style={{ fontSize: 16, color: '#666', marginBottom: 5 }}>
                {t('wallet_transfer.recipient_name')}
              </Text>
              <View style={{ position: 'relative', marginBottom: 20 }}>
                <TextInput
                  style={{
                    borderWidth: 1,
                    borderColor: '#E0E0E0',
                    borderRadius: 10,
                    padding: 15,
                    fontSize: 16,
                    backgroundColor: '#f9f9f9',
                    color: isRecipientError ? 'red' : '#333',
                  }}
                  value={
                    isRecipientLoading
                      ? t('wallet_transfer.loading_recipient')
                      : recipientName || t('wallet_transfer.recipient_info')
                  }
                  editable={false}
                />
                {isRecipientLoading && (
                  <Loader
                    size="small"
                    color="#0D1C6A"
                    style={{ position: 'absolute', right: 15, top: 15 }}
                  />
                )}
              </View>
            </>
          ) : null}

          {/* Amount */}
          <Text style={{ fontSize: 16, color: '#666', marginBottom: 5 }}>
            {t('wallet_transfer.amount')}
          </Text>
          <TextInput
            style={{
              borderWidth: 1,
              borderColor: '#E0E0E0',
              borderRadius: 10,
              padding: 15,
              fontSize: 16,
              marginBottom: 20,
              backgroundColor: '#fff',
            }}
            keyboardType="numeric"
            placeholder={t('wallet_transfer.amount_placeholder')}
            value={amount}
            onChangeText={setAmount}
          />

          {/* Description */}
        <Text style={{ fontSize: 16, color: '#666', marginBottom: 5 }}>
          {t('wallet_transfer.description')}
        </Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: '#E0E0E0',
            borderRadius: 10,
            padding: 15,
            fontSize: 16,
            marginBottom: 20,
            height: 100,
            textAlignVertical: 'top',
            backgroundColor: '#fff',
          }}
          multiline
          placeholder={t('wallet_transfer.description_placeholder')}
          value={description}
          maxLength={255} // limit to 255 characters
          onChangeText={text => setDescription(text.slice(0, 255))} // ensure truncation
        />

          {/* Transfer Button */}
          <TouchableOpacity
            onPress={validateAndOpenPinModal}
            disabled={isTransferring || isLoading || !userWalletId}
            style={{
              backgroundColor: '#7ddd7d',
              padding: 15,
              borderRadius: 10,
              alignItems: 'center',
              marginTop: 10,
              opacity: isTransferring ? 0.7 : 1,
            }}
          >
            {isTransferring ? (
              <Loader color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
                {t('wallet_transfer.transfer_button')}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* PIN Verification Modal */}
      <PinVerificationModal
        visible={showPinModal}
        onClose={() => {
          setShowPinModal(false);
          setPendingTransferData(null);
        }}
        onVerify={handlePinVerified}
        title="Confirm Transaction"
        subtitle="Enter your PIN to confirm the wallet transfer"
      />
    </SafeAreaView>
  );
};

export default WalletTransfer;
