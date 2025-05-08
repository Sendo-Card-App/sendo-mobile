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
import { useGetBalanceQuery, useTransferFundsMutation } from '../../services/WalletApi/walletApi';
import { useGetUserProfileQuery } from '../../services/Auth/authAPI';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

const WalletTransfer = ({ navigation }) => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('0.0');
  const [walletId, setWalletId] = useState('');
  const [description, setDescription] = useState('');
  const [userWalletId, setUserWalletId] = useState(''); // Store user's matricule

  // First get the user profile to get the userId
  const { data: userProfile, isLoading: isProfileLoading } = useGetUserProfileQuery();
  const userId = userProfile?.data?.id;
  
  // Then get the balance using the userId
  const { 
    data: balanceData, 
    isLoading: isBalanceLoading,
    error: balanceError,
    isError: isBalanceError
  } = useGetBalanceQuery(userId, {
    skip: !userId // Skip the query if userId is not available
  });

  // Extract user's wallet matricule when balance data is available
  useEffect(() => {
    if (userProfile?.data?.wallet.matricule) {
      setUserWalletId(userProfile.data.wallet.matricule);
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
      // Include both fromWallet (user's matricule) and toWallet (recipient)
      await transferFunds({
        fromWallet: userWalletId, // User's own wallet matricule
        toWallet: walletId,     // Recipient's wallet ID
        amount: transferAmount,
        transfer_description: description
      }).unwrap();
      navigation.navigate('Success', {
        message: 'Transfert effectué avec succès!',
        nextScreen: 'Main' // or whatever screen you want to navigate to after
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
          <Text style={{ fontSize: 16, color: '#666' }}>{t('available_balance')}</Text>
          {isLoading ? (
            <ActivityIndicator size="small" color="#0D1C6A" />
          ) : isBalanceError ? (
            <Text style={{ color: 'red' }}>Erreur de chargement du solde</Text>
          ) : (
            <>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#0D1C6A' }}>
                {balanceData?.data?.balance?.toFixed(2) || '0.00'} FCFA
              </Text>
              {userWalletId ? (
                <Text style={{ fontSize: 14, color: '#666', marginTop: 5 }}>
                  Votre matricule: {userWalletId}
                </Text>
              ) : null}
            </>
          )}
        </View>

        {/* Recipient Wallet ID */}
        <Text style={{ fontSize: 16, color: '#666', marginBottom: 5 }}>Matricule du destinataire</Text>
        <TextInput
          style={styles.input}
          placeholder="Entrez le matricule du portefeuille"
          value={walletId}
          onChangeText={setWalletId}
        />

        {/* Amount Input */}
        <Text style={{ fontSize: 16, color: '#666', marginBottom: 5 }}>Montant (FCFA)</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder="0.0"
          value={amount}
          onChangeText={setAmount}
        />

        {/* Description */}
        <Text style={{ fontSize: 16, color: '#666', marginBottom: 5 }}>Description (optionnel)</Text>
        <TextInput
          style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
          placeholder="Ex: Transfert pour achat"
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
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Effectuer le transfert</Text>
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