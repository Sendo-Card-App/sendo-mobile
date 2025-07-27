import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {
  sendPushNotification,
  sendPushTokenToBackend,
  registerForPushNotificationsAsync,
} from '../../services/notificationService';
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
import PinVerificationModal from '../../components/PinVerificationModal'; // ✅ PIN modal

const WalletTransfer = ({ navigation }) => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('0.0');
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
  } = useGetBalanceQuery(userId, { skip: !userId });

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
    if (walletId) {
      setUserWalletId(walletId);
    }
  }, [userProfile]);

  const [transferFunds, { isLoading: isTransferring }] = useTransferFundsMutation();

  const validateAndOpenPinModal = () => {
    const transferAmount = parseFloat(amount);
    if (!walletId || isNaN(transferAmount) || transferAmount <= 500) {
      showErrorToast('ACTION_FAILED', 'Veuillez fournir un matricule valide et un montant supérieur à 0.');
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
      message: 'Transfer completed successfully!',
      nextScreen: 'MainTabs',
    });
  } catch (error) {
    console.log('Response:', JSON.stringify(error, null, 2));
    const status = error?.status;

    if (status === 503) showErrorToast('SERVICE_UNAVAILABLE');
    else if (status === 500) showErrorToast('ACTION_FAILED', 'Erreur serveur lors du transfert');
    else if (status === 400) showErrorToast('ACTION_FAILED', 'Veuillez remplir tous les champs.');
    else if (status === 404) showErrorToast('ACTION_FAILED', 'Portefeuille introuvable');
    else showErrorToast('ACTION_FAILED', error?.data?.message || 'Une erreur est survenue.');

    setShowPinModal(false);
    setPendingTransferData(null);
  }
};


  const isLoading = isProfileLoading || isBalanceLoading;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', paddingTop: StatusBar.currentHeight }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: '5%', paddingBottom: 50 }}>
          <TouchableOpacity
            onPress={() => navigation.navigate('MainTabs')}
            style={{
              position: 'absolute',
              top: StatusBar.currentHeight + 600,
              right: 20,
              zIndex: 999,
              backgroundColor: 'rgba(235, 248, 255, 0.9)',
              padding: 10,
              borderRadius: 20,
              elevation: 3,
            }}
          >
            <Ionicons name="home" size={44} color="#7ddd7d" />
          </TouchableOpacity>

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
                      ? t('wallet_transfer.loading_recipient') // Define this in i18n or replace with "Chargement..."
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
            onChangeText={setDescription}
          />

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

      {/*  PIN Modal */}
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
