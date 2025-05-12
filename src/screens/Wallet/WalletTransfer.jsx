import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { 
  sendPushNotification,
  sendPushTokenToBackend,
  registerForPushNotificationsAsync
} from '../../services/notificationService';
import { useGetBalanceQuery, useTransferFundsMutation, useGetWalletDetailsQuery } from '../../services/WalletApi/walletApi';
import { useGetUserProfileQuery } from '../../services/Auth/authAPI';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import Loader from "../../components/Loader";

const WalletTransfer = ({ navigation }) => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('0.0');
  const [walletId, setWalletId] = useState('');
  const [description, setDescription] = useState('');
  const [userWalletId, setUserWalletId] = useState('');
   const [recipientName, setRecipientName] = useState('');
  const [debouncedWalletId, setDebouncedWalletId] = useState(''); // Added missing state declaration
  
   // Debounce walletId input to prevent rapid API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedWalletId(walletId);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [walletId]);

  const { data: userProfile, isLoading: isProfileLoading } = useGetUserProfileQuery();
  const userId = userProfile?.data?.id;
  
  const { 
    data: balanceData, 
    isLoading: isBalanceLoading,
    error: balanceError,
    isError: isBalanceError
  } = useGetBalanceQuery(userId, {
    skip: !userId
  });

 const { 
    data: recipientData, 
    isLoading: isRecipientLoading,
    isError: isRecipientError,
    error: recipientError,
    refetch: refetchRecipient
  } = useGetWalletDetailsQuery(debouncedWalletId, {
    skip: !debouncedWalletId,
  });
  

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
  const walletId = userProfile?.data?.wallet?.matricule || 
                  userProfile?.data?.walletId;
  if (walletId) {
    setUserWalletId(walletId);
  } else {
    console.warn('No wallet ID found in profile:', userProfile?.data);
  }
}, [userProfile]);

  const [transferFunds, { isLoading: isTransferring }] = useTransferFundsMutation();

  const handleTransfer = async () => {
    if (!walletId) {
      Toast.show({ 
        type: 'error', 
        text1: 'Erreur',
        text2: 'Veuillez fournir un matricule de portefeuille valide.' 
      });
      return;
    }

    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount)) {
      Toast.show({
        type: 'error', 
        text1: 'Erreur', 
        text2: 'Veuillez entrer un montant valide.' 
      });
      return;
    }

    if (transferAmount <= 0) {
      Toast.show({ 
        type: 'error', 
        text1: 'Erreur', 
        text2: 'Le montant doit être supérieur à 0.' 
      });
      return;
    }

    if (balanceData?.data?.balance && transferAmount > balanceData.data.balance) {
      Toast.show({ 
        type: 'error',
        text1: 'Erreur', 
        text2: 'Votre solde est insuffisant pour effectuer ce transfert.' 
      });
      return;
    }

    try {
      await transferFunds({
        fromWallet: userWalletId,
        toWallet: walletId,
        amount: transferAmount,
        transfer_description: description
      }).unwrap();
        // Send success notification
      try {
        const pushToken = await registerForPushNotificationsAsync();
        if (pushToken) {
          await sendPushTokenToBackend(
            pushToken,
            "Transfer Successful",
            `Your transfer of ${transferAmount} FCFA was completed`,
            "SUCCESS_TRANSFER_FUND",  // Specific type for transfers
            {
              amount: transferAmount,
              recipientWallet: walletId,
              timestamp: new Date().toISOString()
            }
          );
        }
        
        // Local notification
        await sendPushNotification(
          "Transfer Completed",
          `You sent ${transferAmount} FCFA to wallet ${walletId}`
        );
      } catch (notificationError) {
        console.warn("Notification failed silently:", notificationError);
      }
      navigation.navigate('Success', {
        message: 'Transfert effectué avec succès!',
        nextScreen: 'MonSolde'
      });
    } catch (error) {
      let errorMessage = 'Une erreur est survenue. Veuillez réessayer.';
      const status = error?.status;
      
      if (status === 400) {
        errorMessage = 'Veuillez remplir tous les champs.';
      } else if (status === 404) {
        errorMessage = 'Portefeuille introuvable';
      } else if (status === 500) {
        errorMessage = 'Erreur lors du transfert';
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      }
      
      Toast.show({ 
        type: 'error', 
        text1: 'Erreur', 
        text2: errorMessage 
      });
    }
  };

 const isLoading = isProfileLoading || isBalanceLoading;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', paddingTop: StatusBar.currentHeight }}>
      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        {/* Balance Display */}
        <View style={{ backgroundColor: '#F1F1F1', borderRadius: 10, padding: 15, marginBottom: 20, marginTop: 20 }}>
          <Text style={{ fontSize: 16, color: '#666' }}>{t('wallet_transfer.available_balance')}</Text>
          {isLoading ? (
            <ActivityIndicator size="small" color="#0D1C6A" />
          ) : isBalanceError ? (
            <Text style={{ color: 'red' }}>{t('wallet_transfer.balance_error')}</Text>
          ) : (
            <>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#0D1C6A' }}>
                {balanceData?.data?.balance?.toFixed(2) || '0.00'} FCFA
              </Text>
              {userWalletId && (
                <Text style={{ fontSize: 14, color: '#666', marginTop: 5 }}>
                  {t('wallet_transfer.your_matricule')}: {userWalletId}
                </Text>
              )}
            </>
          )}
        </View>

        {/* Recipient Wallet ID */}
        <Text style={{ fontSize: 16, color: '#666', marginBottom: 5 }}>{t('wallet_transfer.recipient_id')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('wallet_transfer.recipient_placeholder')}
          value={walletId}
          onChangeText={setWalletId}
        />

        {/* Recipient Name (Read-only) */}
        {walletId && (
          <>
            <Text style={{ fontSize: 16, color: '#666', marginBottom: 5 }}>{t('wallet_transfer.recipient_name')}</Text>
            <TextInput
              style={[
                styles.input, 
                { 
                  backgroundColor: '#f9f9f9',
                  color: isRecipientError ? 'red' : '#333'
                }
              ]}
              value={
                isRecipientLoading ? t('common.loading') : 
                recipientName || t('wallet_transfer.recipient_info')
              }
              editable={false}
            />
          </>
        )}

        {/* Amount Input */}
        <Text style={{ fontSize: 16, color: '#666', marginBottom: 5 }}>{t('wallet_transfer.amount')}</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder={t('wallet_transfer.amount_placeholder')}
          value={amount}
          onChangeText={setAmount}
        />

        {/* Description */}
        <Text style={{ fontSize: 16, color: '#666', marginBottom: 5 }}>{t('wallet_transfer.description')}</Text>
        <TextInput
          style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
          placeholder={t('wallet_transfer.description_placeholder')}
          multiline
          value={description}
          onChangeText={setDescription}
        />

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.button, { opacity: isTransferring ? 0.7 : 1 }]}
          onPress={handleTransfer}
          disabled={isTransferring || isLoading || !userWalletId}
        >
          {isTransferring ? (
            <Loader color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t('wallet_transfer.transfer_button')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};
const styles = {
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20
  },
  button: {
    backgroundColor: '#7ddd7d',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  }
};

export default WalletTransfer;