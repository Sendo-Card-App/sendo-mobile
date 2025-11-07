import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { AntDesign, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useGetConfigQuery } from '../../services/Config/configApi';
import { useInitiateBankTransferMutation } from '../../services/Transfer/transferApi'; // Import the new hook

const TransferSummary = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();

  const {
    data: configData,
    isLoading: isConfigLoading,
    error: configError
  } = useGetConfigQuery(undefined, {
    pollingInterval: 1000,
  });

  // Use the bank transfer mutation
  const [initiateBankTransfer, { 
    isLoading: isTransferLoading, 
    error: transferError 
  }] = useInitiateBankTransferMutation();

  const [isProcessing, setIsProcessing] = useState(false);

  // Get transfer fee from config
  const getConfigValue = (name) => {
    const configItem = configData?.data?.find(item => item.name === name);
    return configItem ? configItem.value : null;
  };

  const TRANSFER_FEES = parseFloat(getConfigValue('TRANSFER_FEES')) || 0;

  // Extract all parameters from navigation
  const {
    contact,
    amount,
    convertedAmount,
    totalAmount: initialTotalAmount,
    transferFee: initialTransferFee,
    fromCurrency,
    toCurrency,
    countryName,
    cadRealTimeValue,
    selectedBank,
    selectedBankId,
    accountName,
    iban,
    bankImage,
  } = route.params;

  // Calculate fees and total amount
  const calculateTransferDetails = () => {
    const transferFeeUSD = TRANSFER_FEES;
    const transferFeeInFromCurrency = transferFeeUSD * cadRealTimeValue;
    const amountNumber = parseFloat(amount) || 0;
    console.log(amountNumber)
    const total = amountNumber + transferFeeInFromCurrency;
    
    return {
      transferFeeUSD,
      transferFeeInFromCurrency: transferFeeInFromCurrency.toFixed(2),
      totalAmount: total.toFixed(2),
      convertedAmount: (amountNumber * cadRealTimeValue).toFixed(2),
    };
  };

  const {
    transferFeeUSD,
    transferFeeInFromCurrency,
    totalAmount,
    convertedAmount: finalConvertedAmount,
  } = calculateTransferDetails();

  const handleConfirmTransfer = async () => {
    Alert.alert(
      'Confirmation',
      'Voulez-vous confirmer ce transfert?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Confirmer',
          onPress: async () => {
            await processBankTransfer();
          },
        },
      ]
    );
  };

 const processBankTransfer = async () => {
  // Instead of running transfer immediately, go to PinCode screen first
  navigation.navigate('Auth', {
    screen: 'PinCode',
    params: {
      onSuccess: async (pin) => {
        setIsProcessing(true);
        try {
          // Prepare the data for your API call
          const transferData = {
            amount: parseFloat(finalConvertedAmount),
            bankName: selectedBank,
            nameAccount: accountName,
            accountNumber: iban,
            pin, // Include the verified PIN
          };

          console.log('Sending bank transfer data:', transferData);

          const response = await initiateBankTransfer(transferData).unwrap();

          console.log('Transfer successful:', response);

          // Navigate to success page with all relevant data
            navigation.navigate("Success", { result: response.data });
        } catch (error) {
          console.error('Transfer failed:', error);

          let errorMessage = 'Une erreur est survenue lors du transfert.';

          if (error?.data?.message) {
            errorMessage = error.data.message;
          } else if (error?.error) {
            errorMessage = error.error;
          } else if (error?.status === 'FETCH_ERROR') {
            errorMessage = 'Erreur de connexion. Vérifiez votre internet.';
          }

          Alert.alert('Erreur de Transfert', errorMessage, [{ text: 'OK', style: 'default' }]);
        } finally {
          setIsProcessing(false);
        }
      },
    },
  });
};


  const handleEdit = (screen) => {
    // Navigate back to edit specific information
    navigation.navigate(screen, { ...route.params });
  };

  // Show loading state for config or transfer processing
  if (isConfigLoading || isProcessing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7ddd7d" />
        <Text style={styles.loadingText}>
          {isProcessing ? 'Traitement du transfert...' : 'Chargement des frais de transfert...'}
        </Text>
      </View>
    );
  }

  if (configError) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
        <Text style={styles.errorText}>Erreur de chargement des frais</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F2" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <AntDesign name="left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Résumé du Transfert</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <View style={styles.divider} />

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Beneficiary Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bénéficiaire</Text>
            <TouchableOpacity onPress={() => handleEdit('ContactSelection')}>
              <Text style={styles.editButton}>Modifier</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.infoCard}>
            <View style={styles.contactInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {contact?.name?.charAt(0) || 'C'}
                </Text>
              </View>
              <View style={styles.contactDetails}>
                <Text style={styles.contactName}>{contact?.name || 'Non spécifié'}</Text>
                <Text style={styles.contactPhone}>{contact?.phone || 'Non spécifié'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Transfer Details Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Détails du Transfert</Text>
            <TouchableOpacity onPress={() => handleEdit('TransferAmount')}>
              <Text style={styles.editButton}>Modifier</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.infoCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Montant à envoyer</Text>
              <Text style={styles.detailValue}>
                {amount} {fromCurrency}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Taux de change</Text>
              <Text style={styles.detailValue}>
                1 {fromCurrency} = {cadRealTimeValue} {toCurrency}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Montant converti</Text>
              <Text style={styles.detailValue}>
                {finalConvertedAmount} {toCurrency}
              </Text>
            </View>
            
            <View style={[styles.detailRow, styles.feeRow]}>
              <View>
                <Text style={styles.detailLabel}>Frais de transfert</Text>
                <Text style={styles.feeDescription}>
                  {TRANSFER_FEES} {fromCurrency} 
                </Text>
              </View>
              <Text style={styles.feeValue}>
                {cadRealTimeValue} {toCurrency}
              </Text>
            </View>
            
            <View style={styles.totalRow}>
              <View style={styles.totalLabels}>
                <Text style={styles.totalLabel}>Total à débiter</Text>
              </View>
              <View style={styles.totalValues}>
                <Text style={styles.totalValue}>
                  {amount} {fromCurrency}
                </Text>
                <Text style={styles.convertedAmount}>
                  {finalConvertedAmount} {toCurrency}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Bank Details Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Informations Bancaires</Text>
            <TouchableOpacity onPress={() => handleEdit('BankTransferDetails')}>
              <Text style={styles.editButton}>Modifier</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.infoCard}>
            <View style={styles.bankHeader}>
              {bankImage && (
                <Image 
                  source={bankImage} 
                  style={styles.bankLogo}
                  resizeMode="contain"
                />
              )}
              <Text style={styles.bankName}>{selectedBank}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Titulaire du compte</Text>
              <Text style={styles.detailValue}>{accountName}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>IBAN</Text>
              <Text style={styles.detailValue}>{iban}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Pays</Text>
              <Text style={styles.detailValue}>{countryName}</Text>
            </View>
          </View>
        </View>

        {/* Important Notice */}
        <View style={styles.noticeCard}>
          <Ionicons name="information-circle-outline" size={20} color="#007AFF" />
          <View style={styles.noticeContent}>
            <Text style={styles.noticeTitle}>Important</Text>
            <Text style={styles.noticeText}>
              Vérifiez attentivement toutes les informations avant de confirmer le transfert. 
              Les transferts sont irréversibles une fois confirmés.
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[
              styles.confirmButton,
              (isTransferLoading || isProcessing) && styles.buttonDisabled
            ]}
            onPress={handleConfirmTransfer}
            disabled={isTransferLoading || isProcessing}
          >
            {isTransferLoading || isProcessing ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={styles.confirmButtonText}>CONFIRMER LE TRANSFERT</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={isTransferLoading || isProcessing}
          >
            <Text style={styles.cancelButtonText}>Annuler</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
  },
   buttonDisabled: {
    backgroundColor: '#C0C0C0',
    opacity: 0.6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#7ddd7d',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#000',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 15,
    backgroundColor: '#F2F2F2',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: 34,
  },
  divider: {
    borderColor: '#C0C0C0',
    borderWidth: 1,
    borderStyle: 'dashed',
    marginHorizontal: 20,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 15,
  },
  section: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  editButton: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#7ddd7d',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  contactPhone: {
    fontSize: 14,
    color: '#666',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
  },
  feeRow: {
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    textAlign: 'right',
  },
  feeDescription: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  feeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
    textAlign: 'right',
  },
   totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start', // Changed from 'center' to 'flex-start'
    paddingVertical: 12,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#E6E6E6',
  },
  totalLabels: {
    flex: 1,
  },
  totalValues: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7ddd7d',
  },
  convertedAmount: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    fontStyle: 'italic',
  },
  bankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F2',
  },
  bankLogo: {
    width: 40,
    height: 30,
    marginRight: 12,
  },
  bankName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F8FF',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    marginBottom: 20,
  },
  noticeContent: {
    flex: 1,
    marginLeft: 12,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  noticeText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 30,
  },
  confirmButton: {
    backgroundColor: '#7ddd7d',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  confirmButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#C0C0C0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TransferSummary;