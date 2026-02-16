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
  Alert,
} from 'react-native';
import Toast from 'react-native-toast-message';
import Loader from '../../components/Loader';
import { useRequestWithdrawalMutation } from '../../services/WalletApi/walletApi';
import { useGetUserProfileQuery } from '../../services/Auth/authAPI';
import { useGetConfigQuery } from '../../services/Config/configApi';
import { Ionicons, AntDesign, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const InteracWithdrawal = ({ navigation }) => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [email, setEmail] = useState('');
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showEmailWarning, setShowEmailWarning] = useState(false);
  
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
  const userName = userProfile?.data?.user?.fullname || '';

  // Show email warning when email is entered
  useEffect(() => {
    if (email && email.length > 5) {
      const timer = setTimeout(() => {
        setShowEmailWarning(true);
      }, 5000); // Show warning after 5 second of typing

      return () => clearTimeout(timer);
    }
  }, [email]);

  // Close email warning after 15 seconds
  useEffect(() => {
    if (showEmailWarning) {
      const timer = setTimeout(() => {
        setShowEmailWarning(false);
      }, 15000); // Close after 15 seconds
      return () => clearTimeout(timer);
    }
  }, [showEmailWarning]);

  // Validate form
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

  // Handle preview (show summary)
  const handlePreview = () => {
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

    setShowSummary(true);
  };

  // Handle final withdrawal submission
  const handleConfirmWithdrawal = async () => {
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
      
      // Navigate back after successful withdrawal
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
      
    } catch (error) {
      console.log("Withdrawal error:", JSON.stringify(error, null, 2));
     
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: error?.data?.message || error?.error || t('withdrawal.general_error'),
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle confirm button click - close modal then navigate to PIN
  const handleConfirmButtonClick = () => {
    // Close the modal first
    setShowSummary(false);
    
    // Add a small delay to ensure modal is closed before navigation
    setTimeout(() => {
      navigation.navigate("Auth", {
        screen: "PinCode",
        params: {
          onSuccess: async () => {
            await handleConfirmWithdrawal();
          },
        },
      });
    }, 300); // 300ms delay to ensure smooth transition
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
          {t('withdrawal.title') || 'Interac Withdrawal'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Amount Input */}
        <Text style={styles.label}>{t('withdrawal.amount')}</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          placeholder={t('withdrawal.amount_placeholder') || 'Enter amount in CAD'}
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
                {feeAmount.toFixed(2)} CAD
              </Text>
            </View>
            
            <View style={styles.separator} />
            
            <View style={styles.detailRow}>
              <Text style={styles.netLabel}>{t('withdrawal.amount_received')}</Text>
              <Text style={styles.netValue}>{amountNum.toFixed(2)} CAD</Text>
            </View>
          </View>
        )}

        {/* Email Input */}
        <Text style={styles.label}>{t('withdrawal.interac_email')}</Text>
        <View style={styles.emailContainer}>
          <TextInput
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder={t('withdrawal.email_placeholder') || 'Enter Interac email'}
            value={email}
            onChangeText={setEmail}
            placeholderTextColor="#999"
          />
        </View>

        {/* Email Warning Popup */}
        {showEmailWarning && (
          <View style={styles.warningPopup}>
            <View style={styles.warningContent}>
              <FontAwesome name="exclamation-triangle" size={24} color="#f39c12" />
              <View style={styles.warningTextContainer}>
                <Text style={styles.warningTitle}>
                  {t('withdrawal.email_warning_title') || 'Important Warning'}
                </Text>
                <Text style={styles.warningText}>
                  {t('withdrawal.email_warning_message', { name: userName }) || 
                    `The Interac email must be registered under your name (${userName}). If the email is not registered under your name, the transaction will be cancelled and a $1 CAD cancellation fee will be deducted from your Sendo account.`}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Security Question */}
        <Text style={styles.label}>{t('withdrawal.security_question')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('withdrawal.question_placeholder') || 'Security question'}
          value={question}
          onChangeText={setQuestion}
          placeholderTextColor="#999"
        />

        {/* Security Answer */}
        <Text style={styles.label}>{t('withdrawal.security_answer')}</Text>
        <TextInput
          style={styles.input}
          placeholder={t('withdrawal.answer_placeholder') || 'Security answer'}
          value={response}
          onChangeText={setResponse}
          secureTextEntry
          placeholderTextColor="#999"
        />

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#0D1C6A" />
          <Text style={styles.infoText}>
            {t('withdrawal.info_text') || 
              'The security question and answer will be used for Interac verification. Ensure they are memorable.'}
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.button, (loading || amountNum <= 0) && styles.buttonDisabled]}
          onPress={handlePreview}
          disabled={loading || amountNum <= 0}
        >
          <Text style={styles.buttonText}>
            {t('withdrawal.preview') || 'Preview Withdrawal'}
          </Text>
        </TouchableOpacity>

        {/* Terms */}
        <Text style={styles.terms}>
          {t('withdrawal.terms') || 
            'By proceeding, you agree to our terms and conditions. Withdrawals may take 1-3 business days to process.'}
        </Text>
      </ScrollView>

      {/* Summary Modal */}
      <Modal
        visible={showSummary}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSummary(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('withdrawal.summary_title') || 'Withdrawal Summary'}</Text>
              <TouchableOpacity 
                onPress={() => setShowSummary(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Summary Card */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>{t('withdrawal.amount')}</Text>
                  <Text style={styles.summaryValue}>{amountNum.toFixed(2)} CAD</Text>
                </View>
                
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>{t('withdrawal.fee')}</Text>
                  <Text style={[styles.summaryValue, styles.summaryFee]}>
                    {feeAmount.toFixed(2)} CAD ({withdrawalFeePercent}%)
                  </Text>
                </View>
                
                <View style={styles.summarySeparator} />
                
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>{t('withdrawal.amount_received')}</Text>
                  <Text style={[styles.summaryValue, styles.summaryNet]}>
                    {netAmount.toFixed(2)} CAD
                  </Text>
                </View>
              </View>

              {/* Details Section */}
              <View style={styles.detailsSection}>
                <Text style={styles.detailsTitle}>{t('withdrawal.details') || 'Transaction Details'}</Text>
                
                <View style={styles.detailItem}>
                  <Text style={styles.detailKey}>{t('withdrawal.interac_email')}</Text>
                  <Text style={styles.detailValueSummary}>{email}</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Text style={styles.detailKey}>{t('withdrawal.security_question')}</Text>
                  <Text style={styles.detailValueSummary}>{question}</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Text style={styles.detailKey}>{t('withdrawal.security_answer')}</Text>
                  <Text style={styles.detailValueSummary}>••••••••</Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Text style={styles.detailKey}>{t('withdrawal.transaction_date') || 'Date'}</Text>
                  <Text style={styles.detailValueSummary}>
                    {new Date().toLocaleDateString()}
                  </Text>
                </View>
              </View>

              {/* Important Notice */}
              <View style={styles.noticeBox}>
                <MaterialIcons name="warning" size={20} color="#f39c12" />
                <Text style={styles.noticeText}>
                  {t('withdrawal.summary_notice') || 
                    'Please verify all details before confirming. Transactions cannot be cancelled once submitted.'}
                </Text>
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowSummary(false)}
              >
                <Text style={styles.cancelButtonText}>
                  {t('common.cancel') || 'Cancel'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleConfirmButtonClick}
                disabled={loading}
              >
                {loading ? (
                  <Loader color="white" size="small" />
                ) : (
                  <Text style={styles.confirmButtonText}>
                    {t('withdrawal.confirm') || 'Confirm Withdrawal'}
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
  emailContainer: {
    position: 'relative',
  },
  warningPopup: {
    backgroundColor: '#fff9e6',
    borderWidth: 1,
    borderColor: '#ffeaa7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    marginTop: -10,
  },
  warningContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  warningTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#856404',
    lineHeight: 16,
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
    fontSize: 13,
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
  button: {
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
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  summaryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  summaryFee: {
    color: '#dc3545',
  },
  summaryNet: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
  },
  summarySeparator: {
    height: 1,
    backgroundColor: '#dee2e6',
    marginVertical: 8,
  },
  detailsSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#eee',
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailKey: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailValueSummary: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  noticeBox: {
    flexDirection: 'row',
    backgroundColor: '#fff9e6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: '#856404',
    marginLeft: 10,
    lineHeight: 18,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  confirmButton: {
    backgroundColor: '#7ddd7d',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default InteracWithdrawal;