import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  StyleSheet,
  Modal,
} from 'react-native';
import Toast from 'react-native-toast-message';
import Loader from '../../components/Loader';
import { useRequestWithdrawalMutation } from '../../services/WalletApi/walletApi';
import { useGetUserProfileQuery } from '../../services/Auth/authAPI';
import { useGetConfigQuery } from '../../services/Config/configApi';
import { Ionicons, AntDesign, MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const InteracWithdrawal = ({ navigation }) => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [email, setEmail] = useState('');
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [formValidated, setFormValidated] = useState(false);
  
  // Fetch user profile to get wallet matricule
  const {
    data: userProfile,
    isLoading: isProfileLoading,
    error: profileError,
  } = useGetUserProfileQuery();

  // Fetch configuration for withdrawal fees
  const {
    data: configData,
    isLoading: isConfigLoading,
    error: configError,
  } = useGetConfigQuery();

  // Mutation for withdrawal request
  const [requestWithdrawal] = useRequestWithdrawalMutation();

  // Helper function to get config value
  const getConfigValue = (name) => {
    const configItem = configData?.data?.find((item) => item.name === name);
    return configItem ? parseFloat(configItem.value) : 0;
  };

  // Calculate withdrawal fee and net amount
  const withdrawalFeePercent = getConfigValue('SENDO_WITHDRAW_INTERAC_FEES') || 0;
  const amountNum = parseFloat(amount) || 0;
  const feeAmount = (amountNum * withdrawalFeePercent) / 100;
  const netAmount = amountNum - feeAmount;
  
  // Get wallet matricule from user profile
  const walletMatricule = userProfile?.data?.user?.wallet?.matricule;
  const userBalance = userProfile?.data?.user?.wallet?.balance || 0;
  const userCountry = userProfile?.data?.user?.country;
  const userFirstName = userProfile?.data?.user?.firstname || '';
  const userEmail = userProfile?.data?.user?.email || '';

  // Validate form and check if ready for confirmation
  const validateForm = () => {
    if (!amount || amountNum <= 0) {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: t('withdrawal.amount_required'),
      });
      return false;
    }

    if (amountNum > userBalance) {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: t('withdrawal.insufficient_balance'),
      });
      return false;
    }

    if (!email) {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: t('withdrawal.email_required'),
      });
      return false;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: t('withdrawal.invalid_email'),
      });
      return false;
    }

    if (!question) {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: t('withdrawal.question_required'),
      });
      return false;
    }

    if (!response) {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: t('withdrawal.response_required'),
      });
      return false;
    }

    return true;
  };

  // Check if form is valid to enable confirmation
  useEffect(() => {
    const isFormValid = () => {
      if (!amount || amountNum <= 0) return false;
      if (amountNum > userBalance) return false;
      if (!email) return false;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) return false;
      if (!question) return false;
      if (!response) return false;
      return true;
    };
    
    setFormValidated(isFormValid());
  }, [amount, email, question, response, userBalance]);

  // Handle confirmation button press
  const handleConfirmationPress = () => {
    if (!validateForm()) return;

    // Check if user is from Canada
    if (userCountry !== 'Canada') {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: t('withdrawal.canada_only'),
      });
      return;
    }

    // Check if we have wallet matricule
    if (!walletMatricule) {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: t('withdrawal.wallet_not_found'),
      });
      return;
    }

    setShowConfirmation(true);
  };

  // Handle withdrawal submission (called after PIN validation)
  const handleWithdrawal = async () => {
    setLoading(true);
    try {
      const payload = {
        matriculeWallet: walletMatricule,
        amount: amountNum,
        emailInterac: email,
        questionInterac: question,
        responseInterac: response,
      };

      const result = await requestWithdrawal(payload).unwrap();
      
      Toast.show({
        type: 'success',
        text1: t('withdrawal.success_title'),
        text2: result?.message || t('withdrawal.success_message'),
      });

      // Clear form
      setAmount('');
      setEmail('');
      setQuestion('');
      setResponse('');
      setShowConfirmation(false);
      
      // Navigate back after successful withdrawal
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
      
    } catch (error) {
      console.error('Withdrawal error:', error);
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: error?.data?.message || error?.error || t('withdrawal.general_error'),
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle PIN validation
  const handlePinValidation = () => {
    navigation.navigate("Auth", {
      screen: "PinCode",
      params: {
        onSuccess: async () => {
          setShowConfirmation(false);
          await handleWithdrawal();
        },
        onCancel: () => {
          setShowConfirmation(false);
        }
      },
    });
  };

  if (isProfileLoading || isConfigLoading) {
    return (
      <View style={styles.centered}>
        <Loader size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#7ddd7d" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t('withdrawal.title')}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Current Balance */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>{t('withdrawal.available_balance')}</Text>
          <Text style={styles.balanceAmount}>
            {userBalance.toFixed(2)} CAD
          </Text>
        </View>

        {/* Amount Input */}
        <Text style={styles.label}>{t('withdrawal.amount')}</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder={t('withdrawal.amount_placeholder')}
          value={amount}
          onChangeText={setAmount}
          placeholderTextColor="#999"
        />

        {/* Withdrawal Details */}
        {amountNum > 0 && (
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>{t('withdrawal.withdrawal_amount')}</Text>
              <Text style={styles.detailValue}>{amountNum.toFixed(2)} CAD</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                {t('withdrawal.fee')} ({withdrawalFeePercent}%)
              </Text>
              <Text style={[styles.detailValue, styles.feeText]}>
                -{feeAmount.toFixed(2)} CAD
              </Text>
            </View>
            
            <View style={styles.separator} />
            
            <View style={styles.detailRow}>
              <Text style={styles.netLabel}>{t('withdrawal.amount_received')}</Text>
              <Text style={styles.netValue}>{netAmount.toFixed(2)} CAD</Text>
            </View>
          </View>
        )}

        {/* Email Input */}
        <Text style={styles.label}>{t('withdrawal.interac_email')}</Text>
        <TextInput
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder={t('withdrawal.email_placeholder')}
          value={email}
          onChangeText={setEmail}
          placeholderTextColor="#999"
        />

        {/* Security Question */}
        <Text style={styles.label}>{t('withdrawal.security_question')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('withdrawal.question_placeholder')}
          value={question}
          onChangeText={setQuestion}
          placeholderTextColor="#999"
        />

        {/* Security Answer */}
        <Text style={styles.label}>{t('withdrawal.security_answer')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('withdrawal.answer_placeholder')}
          value={response}
          onChangeText={setResponse}
          secureTextEntry
          placeholderTextColor="#999"
        />

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#0D1C6A" />
          <Text style={styles.infoText}>
            {t('withdrawal.info_text')}
          </Text>
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[styles.continueButton, !formValidated && styles.buttonDisabled]}
          onPress={handleConfirmationPress}
          disabled={!formValidated || loading}
        >
          {loading ? (
            <Loader color="white" />
          ) : (
            <Text style={styles.buttonText}>
              {t('withdrawal.continue') || 'Continue'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Terms */}
        <Text style={styles.terms}>
          {t('withdrawal.terms')}
        </Text>
      </ScrollView>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmation}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowConfirmation(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('withdrawal.confirm_withdrawal') || 'Confirm Withdrawal'}</Text>
              <TouchableOpacity onPress={() => setShowConfirmation(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Withdrawal Summary */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Ionicons name="person-outline" size={20} color="#666" />
                  <Text style={styles.summaryLabel}>{t('withdrawal.recipient') || 'Recipient'}</Text>
                  <Text style={styles.summaryValue}>{userFirstName}</Text>
                </View>
                
                <View style={styles.summaryRow}>
                  <Ionicons name="mail-outline" size={20} color="#666" />
                  <Text style={styles.summaryLabel}>{t('withdrawal.interac_email')}</Text>
                  <Text style={styles.summaryValue}>{email}</Text>
                </View>
                
                <View style={styles.summaryRow}>
                  <Ionicons name="cash-outline" size={20} color="#666" />
                  <Text style={styles.summaryLabel}>{t('withdrawal.amount')}</Text>
                  <Text style={styles.summaryValue}>{amountNum.toFixed(2)} CAD</Text>
                </View>
                
                <View style={styles.summaryRow}>
                  <Ionicons name="pricetag-outline" size={20} color="#666" />
                  <Text style={styles.summaryLabel}>{t('withdrawal.fee')}</Text>
                  <Text style={[styles.summaryValue, styles.summaryFee]}>{feeAmount.toFixed(2)} CAD</Text>
                </View>
                
                <View style={styles.summarySeparator} />
                
                <View style={styles.summaryRow}>
                  <Ionicons name="wallet-outline" size={20} color="#28a745" />
                  <Text style={[styles.summaryLabel, styles.summaryNetLabel]}>{t('withdrawal.amount_received')}</Text>
                  <Text style={[styles.summaryValue, styles.summaryNetValue]}>{netAmount.toFixed(2)} CAD</Text>
                </View>
              </View>

              {/* Security Question Summary */}
              <View style={styles.securityCard}>
                <Text style={styles.securityTitle}>{t('withdrawal.security_details') || 'Security Details'}</Text>
                <View style={styles.securityRow}>
                  <Text style={styles.securityLabel}>{t('withdrawal.security_question')}:</Text>
                  <Text style={styles.securityValue}>{question}</Text>
                </View>
                <View style={styles.securityRow}>
                  <Text style={styles.securityLabel}>{t('withdrawal.security_answer')}:</Text>
                  <Text style={styles.securityValue}>••••••</Text>
                </View>
              </View>

              {/* Processing Time Info */}
              <View style={styles.processingCard}>
                <Ionicons name="time-outline" size={24} color="#0D1C6A" />
                <View style={styles.processingText}>
                  <Text style={styles.processingTitle}>
                    {t('withdrawal.estimated_time') || 'Estimated Processing Time'}
                  </Text>
                  <Text style={styles.processingDescription}>
                    {t('withdrawal.estimated_time_description') || '30 minutes to 2 hours, depending on your bank'}
                  </Text>
                </View>
              </View>

              {/* Email Confirmation Info */}
              <View style={styles.emailCard}>
                <Ionicons name="mail-open-outline" size={24} color="#0D1C6A" />
                <View style={styles.emailText}>
                  <Text style={styles.emailTitle}>
                    {t('withdrawal.email_confirmation') || 'Email Confirmation'}
                  </Text>
                  <Text style={styles.emailDescription}>
                    {t('withdrawal.email_confirmation_description') || 'You will receive a confirmation email at: '}
                    <Text style={styles.emailAddress}>{userEmail}</Text>
                  </Text>
                </View>
              </View>
            </ScrollView>

            {/* Modal Buttons */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowConfirmation(false)}
              >
                <Text style={styles.cancelButtonText}>
                  {t('common.cancel') || 'Cancel'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handlePinValidation}
                disabled={loading}
              >
                {loading ? (
                  <Loader color="white" />
                ) : (
                  <Text style={styles.confirmButtonText}>
                    {t('withdrawal.confirm_with_pin') || 'Confirm with PIN'}
                  </Text>
                )}
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
    backgroundColor: 'white',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#7ddd7d',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 50,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  balanceCard: {
    backgroundColor: '#f5f9ff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e7ff',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0D1C6A',
  },
  label: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  detailsCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  feeText: {
    color: '#dc3545',
  },
  separator: {
    height: 1,
    backgroundColor: '#dee2e6',
    marginVertical: 10,
  },
  netLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  netValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#e8f4ff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 25,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#0D1C6A',
    marginLeft: 10,
    lineHeight: 18,
  },
  continueButton: {
    backgroundColor: '#7ddd7d',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  terms: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0D1C6A',
  },
  modalBody: {
    padding: 20,
  },
  summaryCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  summaryFee: {
    color: '#dc3545',
  },
  summarySeparator: {
    height: 1,
    backgroundColor: '#dee2e6',
    marginVertical: 10,
  },
  summaryNetLabel: {
    fontWeight: 'bold',
    color: '#333',
  },
  summaryNetValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
  },
  securityCard: {
    backgroundColor: '#fff8e1',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ffe082',
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f57c00',
    marginBottom: 10,
  },
  securityRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  securityLabel: {
    fontSize: 14,
    color: '#666',
    width: 120,
  },
  securityValue: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  processingCard: {
    flexDirection: 'row',
    backgroundColor: '#e8f4ff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  processingText: {
    flex: 1,
    marginLeft: 15,
  },
  processingTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0D1C6A',
    marginBottom: 4,
  },
  processingDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  emailCard: {
    flexDirection: 'row',
    backgroundColor: '#f1f9f1',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
  },
  emailText: {
    flex: 1,
    marginLeft: 15,
  },
  emailTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 4,
  },
  emailDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  emailAddress: {
    fontWeight: 'bold',
    color: '#333',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 10,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  confirmButton: {
    flex: 1,
    padding: 16,
    borderRadius: 10,
    backgroundColor: '#7ddd7d',
    alignItems: 'center',
    marginLeft: 10,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default InteracWithdrawal;