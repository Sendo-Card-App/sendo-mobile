import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform, 
  StyleSheet, 
  TouchableOpacity,
  Modal,
  FlatList,
  Dimensions
} from 'react-native';
import { AntDesign } from "@expo/vector-icons";
import Toast from 'react-native-toast-message';
import Loader from "../../components/Loader";
import { useSimulatePaymentMutation } from '../../services/WalletApi/walletApi';
import { useGetConfigQuery } from '../../services/Config/configApi';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

const PaymentSimulator = () => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('100');
  const [currency, setCurrency] = useState('USD');
  const [conversionData, setConversionData] = useState({
    data: {
      result: {
        amountConverted: 0,
        partnerVisaFees: 0,
        sendoFees: 0,
        totalAmount: 0
      },
      fees: {
        percentagePartnerFees: 0,
        percentageSendoFees: 0
      }
    }
  });
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  
  const [simulatePayment] = useSimulatePaymentMutation();
  
  // Get config data
  const { 
    data: configData, 
    isLoading: isConfigLoading,
    error: configError
  } = useGetConfigQuery();
  
  // Extract needed config values
  const getConfigValue = (name) => {
    const configItem = configData?.data?.find(item => item.name === name);
    return configItem ? configItem.value : null;
  };

  const USD_REAL_TIME_VALUE = getConfigValue('USD_REAL_TIME_VALUE') || 625;
  const EUR_REAL_TIME_VALUE = getConfigValue('EUR_REAL_TIME_VALUE') || 655;
  const CAD_REAL_TIME_VALUE = getConfigValue('CAD_REAL_TIME_VALUE') || 480;
  const PARTNER_VISA_FEES = getConfigValue('PARTNER_VISA_FEES') || 1.79;
  const SENDO_SERVICE_FEES = getConfigValue('SENDO_SERVICE_FEES') || 0.01;

  const currencies = [
    { code: 'USD', name: 'US Dollar', rate: USD_REAL_TIME_VALUE },
    { code: 'EUR', name: 'Euro', rate: EUR_REAL_TIME_VALUE },
    { code: 'CAD', name: 'Canadian Dollar', rate: CAD_REAL_TIME_VALUE }
  ];
  
  const currentCurrency = currencies.find(c => c.code === currency) || currencies[0];

  const handleCurrencySelect = (selectedCurrency) => {
    setCurrency(selectedCurrency);
    setShowCurrencyDropdown(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (amount && !isNaN(parseFloat(amount))) {
        handleSimulatePayment();
      }
    }); 

    return () => clearTimeout(timer);
  }, [amount, currency]);

  const handleSimulatePayment = async () => {
    if (!amount || isNaN(parseFloat(amount))) {
      return;
    }

    try {
      setIsCalculating(true);
      const response = await simulatePayment({
        amount: parseFloat(amount),
        currency
      }).unwrap();

      setConversionData(response);

    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Simulation Failed',
        text2: error.data?.message || error.message || 'Failed to simulate payment',
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleRecharge = () => {
    console.log('next page');
  };

  if (isConfigLoading) {
    return <Loader />;
  }

  if (configError) {
    Toast.show({
      type: 'error',
      text1: 'Configuration Error',
      text2: 'Failed to load exchange rates',
    });
    return null;
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.instructionText}>
          {t('paymentSimulator.title')}
        </Text>
        
        {/* Amount Input */}
        <View style={styles.amountInputContainer}>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            style={styles.amountInput}
            placeholder={t('paymentSimulator.amountPlaceholder')}
          />
          <TouchableOpacity 
            style={styles.currencySelector}
            onPress={() => setShowCurrencyDropdown(true)}
          >
            <Text style={styles.currencyText}>{currency}</Text>
            <AntDesign name="down" size={16} color="#666" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.exchangeRateText}>
          {t('paymentSimulator.exchangeRate')}{currency} = {currentCurrency.rate} FCFA
        </Text>

        {/* Currency Dropdown Modal */}
        <Modal
          visible={showCurrencyDropdown}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowCurrencyDropdown(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <FlatList
                data={currencies}
                keyExtractor={(item) => item.code}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.currencyItem}
                    onPress={() => handleCurrencySelect(item.code)}
                  >
                    <Text style={[
                      styles.currencyItemText,
                      currency === item.code && styles.selectedCurrency
                    ]}>
                      {item.code} - {item.name} ({item.rate} FCFA)
                    </Text>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCurrencyDropdown(false)}
              >
                <Text style={styles.closeButtonText}>{t('paymentSimulator.closeButton')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Conversion Results - Always visible with initial 0 values */}
        <View style={styles.resultsContainer}>
          <View style={styles.feeRow}>
            <Text style={styles.sectionTitle}>
              {t('paymentSimulator.convertedAmount')}
            </Text>
            <Text style={styles.convertedAmount}>
              {conversionData.data.result.amountConverted.toLocaleString('fr-FR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })} FCFA
            </Text>
          </View>

          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>
              {t('paymentSimulator.partnerFees')}
            </Text>
            <Text style={styles.feeValue}>
              {conversionData.data.result.partnerVisaFees.toLocaleString('fr-FR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })} FCFA ({PARTNER_VISA_FEES}%)
            </Text>
          </View>

          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>
              {t('paymentSimulator.sendoFees')}
            </Text>
            <Text style={styles.feeValue}>
              {conversionData.data.result.sendoFees.toLocaleString('fr-FR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })} FCFA ({SENDO_SERVICE_FEES}%)
            </Text>
          </View>

          <View style={styles.feeRow}>
            <Text style={styles.totalLabel}>
              {t('paymentSimulator.totalAmount')}
            </Text>
            <Text style={styles.totalAmount}>
              {conversionData.data.result.totalAmount.toLocaleString('fr-FR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })} FCFA
            </Text>
          </View>
        </View>

        <View style={styles.disclaimerContainer}>
          <View style={styles.disclaimerContent}>
            <Text style={styles.disclaimerText}>
              {t('paymentSimulator.disclaimer')}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.simulateButton}
          onPress={handleRecharge}
          disabled={isCalculating}
        >
          <Text style={styles.simulateButtonText}>
            {t('paymentSimulator.rechargeButton')}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  simulateButton: {
    backgroundColor: '#7ddd7d',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  simulateButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  content: {
    padding: 20,
  },
  instructionText: {
    fontSize: 15,
    color: 'black',
    textAlign:'center',
    fontWeight: 'bold',
    marginBottom: 30,
    marginTop:12,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 5,
    marginBottom: 10,
  },
  amountInput: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  disclaimerContainer: {
    borderWidth: 1,
    borderStyle: 'dotted',
    borderColor: '#999',
    borderRadius: 8,
    padding: 12,
    marginTop: 30,
  },
  disclaimerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  helpIcon: {
    marginRight: 8,
    marginTop: 5,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 10,
  },
  currencyText: {
    fontSize: 18,
    marginRight: 8,
  },
  exchangeRateText: {
    fontSize: 12,
    color: 'black',
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom:15,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 10,
    maxHeight: '60%',
  },
  currencyItem: {
    padding: 15,
  },
  currencyItemText: {
    fontSize: 18,
    textAlign: 'center',
  },
  selectedCurrency: {
    color: '#7ddd7d',
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
  },
  closeButton: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  closeButtonText: {
    color: '#7ddd7d',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  resultsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#666',
  },
  convertedAmount: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  feeLabel: {
    fontSize: 16,
    color: '#666',
  },
  feeValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  totalContainer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
  },
  totalAmount: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#d35400',
  },
  disclaimerText: {
    fontSize: 12,
    color: '#999',
    marginTop: 30,
    fontStyle: 'italic',
  },
});

export default PaymentSimulator;