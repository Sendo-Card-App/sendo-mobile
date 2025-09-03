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
  Dimensions,
  StatusBar
} from 'react-native';
import { AntDesign } from "@expo/vector-icons";
import Toast from 'react-native-toast-message';
import Loader from "../../components/Loader";
import { useSimulatePaymentMutation } from '../../services/WalletApi/walletApi';
import { useGetConfigQuery } from '../../services/Config/configApi';
import { useTranslation } from 'react-i18next';
import { useNavigation } from "@react-navigation/native";
import {
  useGetVirtualCardsQuery,
  useGetVirtualCardDetailsQuery,
} from "../../services/Card/cardApi";

const { width } = Dimensions.get('window');

const PaymentSimulator = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();

  const { data: cards } = useGetVirtualCardsQuery();
  const [selectedCardId, setSelectedCardId] = useState(null);
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

  const { data: cardDetails } = useGetVirtualCardDetailsQuery(selectedCardId, {
    skip: !selectedCardId,
  });
  const cardData = cardDetails?.data;

  const [simulatePayment] = useSimulatePaymentMutation();
  const { 
    data: configData, 
    isLoading: isConfigLoading,
    error: configError
  } = useGetConfigQuery();

  const getConfigValue = (name) => {
    const configItem = configData?.data?.find(item => item.name === name);
    return configItem ? configItem.value : null;
  };

  const USD_SENDO_VALUE = getConfigValue('USD_SENDO_VALUE');
  const EUR_SENDO_VALUE = getConfigValue('EUR_SENDO_VALUE');
  const CAD_SENDO_VALUE = getConfigValue('CAD_SENDO_VALUE');
  const YEN_SENDO_VALUE = getConfigValue('YEN_SENDO_VALUE');
  const PARTNER_VISA_FEES = getConfigValue('PARTNER_VISA_FEES');
  const SENDO_SERVICE_FEES = getConfigValue('SENDO_SERVICE_FEES');

  const currencies = [
    { code: 'USD', name: 'US Dollar', rate: USD_SENDO_VALUE },
    { code: 'EUR', name: 'Euro', rate: EUR_SENDO_VALUE },
    { code: 'CAD', name: 'Canadian Dollar', rate: CAD_SENDO_VALUE },
    { code: 'JPY', name: 'Japanese Yen', rate: YEN_SENDO_VALUE }
  ];

  const getFlagEmoji = (currencyCode) => {
    const countryCodeMap = {
      USD: 'US',
      EUR: 'EU',
      CAD: 'CA',
      JPY: 'JP'
    };
    const countryCode = countryCodeMap[currencyCode] || 'US';
    return countryCode
      .toUpperCase()
      .split('')
      .map(char => String.fromCodePoint(0x1F1E6 - 65 + char.charCodeAt(0)))
      .join('');
  };

  const currentCurrency = currencies.find(c => c.code === currency) || currencies[0];

  const handleCurrencySelect = (selectedCurrency) => {
    setCurrency(selectedCurrency);
    setShowCurrencyDropdown(false);
  };

  useEffect(() => {
    if (cards?.data?.length > 0) {
      setSelectedCardId(cards.data[0].cardId);
    }
  }, [cards]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (amount && !isNaN(parseFloat(amount))) {
        handleSimulatePayment();
      }
    });
    return () => clearTimeout(timer);
  }, [amount, currency]);

  const handleSimulatePayment = async () => {
    if (!amount || isNaN(parseFloat(amount))) return;
    try {
      const payload = { amount: parseFloat(amount), currency };
      setIsCalculating(true);
      const response = await simulatePayment(payload).unwrap();
      setConversionData(response);
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Simulation Failed",
        text2: error.data?.message || error.message || "Failed to simulate payment",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  if (isConfigLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Loader size="large" />
      </View>
    );
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
       <StatusBar backgroundColor="#7ddd7d" barStyle="light-content" />
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40 }}>
          <AntDesign name="arrowleft" size={24} color="#fff" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {t('screens.paymentSimulator')}
        </Text>

        <View style={{ width: 40 }} /> 
      </View>
      <View style={styles.content}>
        <Text style={styles.instructionText}>
          {t('paymentSimulator.title')}
        </Text>
        
        {/* Amount Input */}
       <View style={styles.amountInputContainer}>
   <Text style={styles.flagEmoji}>{getFlagEmoji(currency)}</Text>
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
              <Text style={styles.modalTitle}>{t('paymentSimulator.selectCurrency')}</Text>
              
              <FlatList
                data={currencies}
                keyExtractor={(item) => item.code}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.currencyItem,
                      currency === item.code && styles.selectedCurrencyItem
                    ]}
                    onPress={() => handleCurrencySelect(item.code)}
                  >
                    <View style={styles.currencyItemContent}>
                      <Text style={styles.flagEmojiSmall}>{getFlagEmoji(item.code)}</Text>
                      <View style={styles.currencyTextContainer}>
                        <Text style={[
                          styles.currencyCodeText,
                          currency === item.code && styles.selectedCurrencyText
                        ]}>
                          {item.code}
                        </Text>
                        <Text style={[
                          styles.currencyNameText,
                          currency === item.code && styles.selectedCurrencyText
                        ]}>
                          {item.name}
                        </Text>
                      </View>
                      <Text style={[
                        styles.currencyRateText,
                        currency === item.code && styles.selectedCurrencyText
                      ]}>
                        {item.rate} FCFA
                      </Text>
                    </View>
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

       {cardData?.id && (
          <TouchableOpacity 
            style={styles.simulateButton}
            onPress={() =>
              navigation.navigate("CardAction", {
                cardId: cardData.id,
                action: "recharge",
              })
            }
            disabled={isCalculating}
          >
            <Text style={styles.simulateButtonText}>
              {t('paymentSimulator.rechargeButton')}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
   container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#7ddd7d',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 40,
    paddingBottom: 15,
    paddingHorizontal: 15,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 19,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  content: { padding: 20 },
  instructionText: {
    fontSize: 15,
    color: 'black',
    textAlign:'center',
    fontWeight: 'bold',
    marginBottom: 30,
    marginTop:12,
  },
  simulateButton: {
    backgroundColor: '#7ddd7d',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  flagEmoji: {
    fontSize: 48,
    marginRight: 6,
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
    marginTop: 20,
  },
  disclaimerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
   modalContent: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 15,
    maxHeight: '70%',
    paddingVertical: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 15,
    color: '#333',
  },
  currencyItem: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  selectedCurrencyItem: {
    backgroundColor: '#f0f8f0',
  },
  currencyItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  flagEmojiSmall: {
    fontSize: 24,
    marginRight: 12,
  },
  currencyTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  currencyCodeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  currencyNameText: {
    fontSize: 12,
    color: '#666',
  },
  currencyRateText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#444',
  },
  selectedCurrencyText: {
    color: '#7ddd7d',
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 20,
  },
  closeButton: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#7ddd7d',
    fontWeight: 'bold',
    fontSize: 16,
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