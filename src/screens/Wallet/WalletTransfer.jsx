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
  Modal,
  StyleSheet,
} from 'react-native';
import {
  useGetBalanceQuery,
  useTransferFundsMutation,
  useGetWalletDetailsQuery,
} from '../../services/WalletApi/walletApi';
import { useGetConfigQuery } from '../../services/Config/configApi';
import { useGetUserProfileQuery } from '../../services/Auth/authAPI';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { showErrorToast } from '../../utils/errorHandler';
import Loader from '../../components/Loader';

const WalletTransfer = ({ navigation }) => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [walletId, setWalletId] = useState('');
  const [description, setDescription] = useState('');
  const [userWalletId, setUserWalletId] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [debouncedWalletId, setDebouncedWalletId] = useState('');
  const [pendingTransferData, setPendingTransferData] = useState(null);
  const [showUnavailableModal, setShowUnavailableModal] = useState(false);

  // Debounce walletId input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedWalletId(walletId);
    }, 500);
    return () => clearTimeout(timer);
  }, [walletId]);

  const { data: userProfile, isLoading: isProfileLoading } = useGetUserProfileQuery();
  const userId = userProfile?.data?.user?.id;

  const isCanada = userProfile?.data?.user?.country === "Canada";

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
    data: configData,
    isLoading: isConfigLoading,
  } = useGetConfigQuery(undefined, {
    pollingInterval: 1000,
  });

  const getConfigValue = (name) => {
    const configItem = configData?.data?.find(item => item.name === name);
    return configItem ? configItem.value : null;
  };

  const SENDO_TO_SENDO_TRANSFER_FEES = getConfigValue('SENDO_TO_SENDO_TRANSFER_FEES');
  const SENDO_VALUE_CAD_CA_CAM = getConfigValue('SENDO_VALUE_CAD_CA_CAM');
  const TRANSFER_CA_CAM_AVAILABILITY = getConfigValue("TRANSFER_CA_CAM_AVAILABILITY");
  
  const feePercentage = SENDO_TO_SENDO_TRANSFER_FEES ? parseFloat(SENDO_TO_SENDO_TRANSFER_FEES) : 0;
  const cadToXafRate = SENDO_VALUE_CAD_CA_CAM ? parseFloat(SENDO_VALUE_CAD_CA_CAM) : 1;

  const transferAmount = parseFloat(amount) || 0;
  const feeAmount = isCanada ? (transferAmount * feePercentage) / 100 : 0;
  const totalAmount = isCanada ? transferAmount + feeAmount : transferAmount;
  const amountInXAF = isCanada ? transferAmount * cadToXafRate : transferAmount;

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
    const walletId = userProfile?.data?.user?.wallet?.matricule || userProfile?.data?.user?.walletId;
    if (walletId) setUserWalletId(walletId);
  }, [userProfile]);

  const [transferFunds, { isLoading: isTransferring }] = useTransferFundsMutation();

  // --- Service availability check ---
  const checkServiceAvailability = () => {
    if (!isCanada) {
      return true;
    }
    
    if (isConfigLoading || !configData) {
      return true;
    }
    
    return TRANSFER_CA_CAM_AVAILABILITY === "1";
  };

  // --- Check if sender is trying to send to themselves ---
  const checkSelfTransfer = () => {
    if (!userWalletId || !walletId) {
      return false;
    }
    return userWalletId.trim() === walletId.trim();
  };

  const handlePinVerified = async () => {
    if (isCanada && !checkServiceAvailability()) {
      setShowUnavailableModal(true);
      return;
    }

    const transferAmount = parseFloat(amount);
    
    if (checkSelfTransfer()) {
      showErrorToast('ACTION_FAILED', 'Vous ne pouvez pas transférer des fonds vers votre propre compte.');
      return;
    }

    if (!walletId || isNaN(transferAmount) || transferAmount <= 0) {
      showErrorToast('ACTION_FAILED', 'Veuillez fournir un montant supérieur à 0.');
      return;
    }

    const totalToDeduct = isCanada ? transferAmount + feeAmount : transferAmount;
    if (totalToDeduct > (balanceData?.data?.balance || 0)) {
      showErrorToast('ACTION_FAILED', 'Votre solde est insuffisant pour effectuer ce transfert.');
      return;
    }

    try {
      await transferFunds({
        fromWallet: userWalletId,
        toWallet: walletId,
        amount: transferAmount,
        transfer_description: description,
      }).unwrap();

      navigation.navigate('Success', {
        message: 'Transfert effectué avec succès !',
        nextScreen: 'MainTabs',
      });
    } catch (error) {
      console.log("Transfer error:", JSON.stringify(error, null, 2));
     
      const status = error?.status;
      if (status === 503) showErrorToast('SERVICE_UNAVAILABLE');
      else if (status === 500) showErrorToast('ACTION_FAILED', 'Erreur serveur lors du transfert');
      else if (status === 400) showErrorToast('ACTION_FAILED', 'Veuillez remplir tous les champs.');
      else if (status === 403) showErrorToast('KYC Erreur', 'Veuillez soumettre vos KYC.');
      else if (status === 404) showErrorToast('ACTION_FAILED', 'Portefeuille introuvable');
      else showErrorToast('ACTION_FAILED', error?.data?.message || 'Une erreur est survenue.');
    }
  };

  const isLoading = isProfileLoading || isBalanceLoading;

  return (
    <View style={styles.container}>
      {/* FIXED: StatusBar with correct configuration */}
      <StatusBar 
        backgroundColor="#7ddd7d" 
        barStyle="light-content"
        translucent={false}
      />

      {/* Header - Fixed with proper StatusBar integration */}
      <View style={[
        styles.header,
        {
          paddingTop: Platform.OS === 'android' 
            ? (StatusBar.currentHeight || 25) 
            : 50,
          height: Platform.OS === 'android' 
            ? 70 + (StatusBar.currentHeight || 25)
            : 90,
        }
      ]}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()} 
          style={styles.backButton}
        >
          <AntDesign name="left" size={24} color="white" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {t('screens.walletTransfer')}
        </Text>
        
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Balance */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>{t('wallet_transfer.available_balance')}</Text>
            {isLoading ? (
              <ActivityIndicator size="small" color="#0D1C6A" />
            ) : isBalanceError ? (
              <Text style={styles.errorText}>{t('wallet_transfer.balance_error')}</Text>
            ) : (
              <>
                <Text style={styles.balanceValue}>
                  {isCanada ? `${balanceData?.data?.currency} ` : ''}{balanceData?.data?.balance?.toFixed(2) || '0.00'}{!isCanada ? ` ${balanceData?.data?.currency}` : ''}
                </Text>
                {userWalletId && (
                  <Text style={styles.matriculeText}>
                    {t('wallet_transfer.your_matricule')}: {userWalletId}
                  </Text>
                )}
              </>
            )}
          </View>

          {/* Recipient */}
          <Text style={styles.inputLabel}>{t('wallet_transfer.recipient_id')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('wallet_transfer.recipient_placeholder')}
            placeholderTextColor="#999"
            value={walletId}
            onChangeText={setWalletId}
          />

          {walletId && (
            <>
              <Text style={styles.inputLabel}>{t('wallet_transfer.recipient_name')}</Text>
              <View style={styles.recipientContainer}>
                <TextInput
                  style={[
                    styles.input,
                    styles.recipientInput,
                    isRecipientError && styles.recipientError
                  ]}
                  value={
                    isRecipientLoading
                      ? t('wallet_transfer.loading_recipient')
                      : recipientName || t('wallet_transfer.recipient_info')
                  }
                  editable={false}
                />
                {isRecipientLoading && (
                  <Loader size="small" color="#0D1C6A" style={styles.recipientLoader} />
                )}
              </View>
            </>
          )}

          {/* Amount */}
          <Text style={styles.inputLabel}>
            {isCanada ? 'Montant (CAD)' : t('wallet_transfer.amount')}
          </Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder={t('wallet_transfer.amount_placeholder')}
            placeholderTextColor="#999"
            value={amount}
            onChangeText={setAmount}
          />

          {/* Fee for Canadians */}
          {isCanada && feePercentage > 0 && amount && !isNaN(transferAmount) && transferAmount > 0 && (
            <View style={styles.feeCard}>
              <Text style={styles.feeTitle}>
                {t('wallet_transfer.fee_information')}
              </Text>
              <Text style={styles.feeText}>
                {t('wallet_transfer.transfer_amount')}: {balanceData?.data?.currency} {transferAmount.toFixed(2)}
              </Text>
              <Text style={styles.feeText}>
                {t('wallet_transfer.transfer_fee')}: {feePercentage}% ({balanceData?.data?.currency} {feeAmount.toFixed(2)})
              </Text>
              <Text style={styles.totalText}>
                {t('wallet_transfer.total_amount')}: {balanceData?.data?.currency} {totalAmount.toFixed(2)}
              </Text>
              <View style={styles.feeDivider}>
                <Text style={styles.receiveTitle}>
                  {t('wallet_transfer.recipient_will_receive')}:
                </Text>
                <Text style={styles.receiveText}>
                  {amountInXAF.toFixed(2)} XAF (1 CAD = {cadToXafRate.toFixed(2)} XAF)
                </Text>
              </View>
            </View>
          )}

          {/* Description */}
          <Text style={styles.inputLabel}>{t('wallet_transfer.description')}</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            multiline
            placeholder={t('wallet_transfer.description_placeholder')}
            placeholderTextColor="#999"
            value={description}
            maxLength={255}
            onChangeText={text => setDescription(text.slice(0, 255))}
          />

          {/* Transfer Button */}
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("Auth", {
                screen: "PinCode",
                params: {
                  onSuccess: async () => {
                    await handlePinVerified();
                  },
                },
              })
            }
            disabled={isTransferring || isLoading || !userWalletId || !walletId}
            style={[
              styles.transferButton,
              (isTransferring || isLoading || !userWalletId || !walletId) && styles.buttonDisabled
            ]}
          >
            {isTransferring ? (
              <Loader color="#fff" />
            ) : (
              <Text style={styles.transferButtonText}>
                {t('wallet_transfer.transfer_button')}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Service Unavailable Modal */}
      <Modal
        visible={showUnavailableModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowUnavailableModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="warning-outline" size={48} color="#ff6b6b" />
            </View>
            
            <Text style={styles.modalTitle}>
              Canada to Cameroon Transfer Service Temporarily Unavailable
            </Text>
            
            <Text style={styles.modalMessage}>
              The Canada to Cameroon transfer service is currently unavailable. Please try again later or contact support for assistance.
            </Text>
            
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowUnavailableModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#7ddd7d',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 15,
    paddingHorizontal: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  headerRight: {
    width: 40,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: '5%',
    paddingBottom: 50,
    paddingTop: 10,
  },
  balanceCard: {
    backgroundColor: '#F1F1F1',
    borderRadius: 10,
    padding: 15,
    marginVertical: 20,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  balanceValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0D1C6A',
  },
  matriculeText: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  inputLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  recipientContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  recipientInput: {
    marginBottom: 0,
    backgroundColor: '#f9f9f9',
  },
  recipientError: {
    color: '#dc3545',
  },
  recipientLoader: {
    position: 'absolute',
    right: 15,
    top: 15,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  feeCard: {
    backgroundColor: '#e8f5e8',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#7ddd7d',
  },
  feeTitle: {
    fontSize: 14,
    color: '#2d5016',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  feeText: {
    fontSize: 14,
    color: '#2d5016',
    marginBottom: 3,
  },
  totalText: {
    fontSize: 16,
    color: '#2d5016',
    fontWeight: 'bold',
    marginTop: 5,
    marginBottom: 5,
  },
  feeDivider: {
    borderTopWidth: 1,
    borderTopColor: '#7ddd7d',
    paddingTop: 8,
    marginTop: 8,
  },
  receiveTitle: {
    fontSize: 14,
    color: '#2d5016',
    fontWeight: 'bold',
    marginBottom: 3,
  },
  receiveText: {
    fontSize: 14,
    color: '#2d5016',
  },
  transferButton: {
    backgroundColor: '#7ddd7d',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  transferButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButtonContainer: {
    width: '100%',
  },
  modalButton: {
    backgroundColor: '#ff6b6b',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default WalletTransfer;