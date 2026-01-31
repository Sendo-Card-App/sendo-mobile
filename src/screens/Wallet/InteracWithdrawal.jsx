import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  StyleSheet,
} from 'react-native';
import Toast from 'react-native-toast-message';
import Loader from '../../components/Loader';
import { useRequestWithdrawalMutation } from '../../services/WalletApi/walletApi';
import { useGetUserProfileQuery } from '../../services/Auth/authAPI';
import { useGetConfigQuery } from '../../services/Config/configApi';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

const InteracWithdrawal = ({ navigation }) => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [email, setEmail] = useState('');
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  
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

  // Handle withdrawal submission
  const handleWithdrawal = async () => {
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
          placeholder={t('withdrawal.email_placeholder') || 'Enter Interac email'}
          value={email}
          onChangeText={setEmail}
          placeholderTextColor="#999"
        />

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
          style={[styles.button, loading && styles.buttonDisabled]}
                   onPress={() =>
            navigation.navigate("Auth", {
              screen: "PinCode",
              params: {
                onSuccess: async () => {
                  await handleWithdrawal();
                },
              },
            })
          }
          disabled={loading || amountNum <= 0}
        >
          {loading ? (
            <Loader color="white" />
          ) : (
            <Text style={styles.buttonText}>
              {t('withdrawal.submit') || 'Request Withdrawal'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Terms */}
        <Text style={styles.terms}>
          {t('withdrawal.terms') || 
            'By proceeding, you agree to our terms and conditions. Withdrawals may take 1-3 business days to process.'}
        </Text>
      </ScrollView>
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
});

export default InteracWithdrawal;