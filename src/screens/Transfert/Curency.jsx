import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
  Modal,
  StyleSheet
} from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useGetConfigQuery } from '../../services/Config/configApi';
import Loader from '../../components/Loader';

import HomeImage from '../../images/HomeImage2.png';
import button from '../../images/ButtomLogo.png';
import ArrowGoRound from '../../images/ArrowGoRound.png';
import bank from '../../images/bank.png';
import mtn from '../../images/mtn.png';
import om from '../../images/om.png';

const Curency = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();

  const {
    countryName,
    conversionRate,
    flagImage,
    cadRealTimeValue
  } = route.params;

const {
  data: configData,
  isLoading: isConfigLoading,
  error: configError
} = useGetConfigQuery(undefined, {
  pollingInterval: 1000, 
});

  const getConfigValue = (name) => {
    const configItem = configData?.data?.find(item => item.name === name);
    return configItem ? configItem.value : null;
  };

  const [amount, setAmount] = useState('');
  const [convertedAmount, setConvertedAmount] = useState('');
  const [transferFee, setTransferFee] = useState(0);
  const [totalAmount, setTotalAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAlert, setShowAlert] = useState(false);
  const [showMaxAmountAlert, setShowMaxAmountAlert] = useState(false);
  const [activeInput, setActiveInput] = useState('source'); // 'source' or 'target'

  const isToCameroon = countryName === 'Cameroon';
  const TRANSFER_FEES = parseFloat(getConfigValue('TRANSFER_FEES'));
  const SENDO_VALUE_CAD_CA_CAM = parseFloat(getConfigValue('SENDO_VALUE_CAD_CA_CAM'));
  const MIN_AMOUNT_TO_TRANSFER_FROM_CANADA = parseFloat(getConfigValue('MIN_AMOUNT_TO_TRANSFER_FROM_CANADA'));

  // Conversion functions
  const convertSourceToTarget = (sourceValue) => {
    const numericAmount = parseFloat(sourceValue) || 0;
    if (isToCameroon) {
      // CAD to XAF
      return numericAmount * cadRealTimeValue;
    } else {
      // XAF to CAD
      return numericAmount / cadRealTimeValue;
    }
  };

  const convertTargetToSource = (targetValue) => {
    const numericAmount = parseFloat(targetValue) || 0;
    if (isToCameroon) {
      // XAF to CAD
      return numericAmount / cadRealTimeValue;
    } else {
      // CAD to XAF
      return numericAmount * cadRealTimeValue;
    }
  };

  // Calculate fees based on source amount
  const calculateFees = (sourceAmount) => {
    const numericSource = parseFloat(sourceAmount) || 0;
    let feeConverted;

    if (isToCameroon) {
      feeConverted = TRANSFER_FEES * cadRealTimeValue;
    } else {
      feeConverted = TRANSFER_FEES;
    }

    return feeConverted;
  };

  // Calculate total amount
  const calculateTotal = (sourceAmount, convertedAmt) => {
    const numericSource = parseFloat(sourceAmount) || 0;
    const numericConverted = parseFloat(convertedAmt) || 0;
    
    if (isToCameroon) {
      // Total in XAF = converted amount + fee in XAF
      return numericConverted + (TRANSFER_FEES * cadRealTimeValue);
    } else {
      // Total in CAD = converted amount + fee in CAD
      return numericConverted + TRANSFER_FEES;
    }
  };

  // Handle source amount change (CAD when sending to Cameroon, XAF when sending from Cameroon)
  const handleSourceAmountChange = (text) => {
    const cleanedText = text.replace(/[^0-9.]/g, '');
    setAmount(cleanedText);
    setActiveInput('source');

    if (cleanedText && !isNaN(cleanedText)) {
      setIsLoading(true);
      try {
        const converted = convertSourceToTarget(cleanedText);
        const feeConverted = calculateFees(cleanedText);
        const total = calculateTotal(cleanedText, converted);

        setConvertedAmount(converted.toFixed(2));
        setTransferFee(feeConverted.toFixed(2));
        setTotalAmount(total.toFixed(2));
        setError(null);
      } catch (err) {
        setError(t('conversion_failed'));
      } finally {
        setIsLoading(false);
      }
    } else {
      setConvertedAmount('');
      setTransferFee(0);
      setTotalAmount('');
      setError(null);
    }
  };

  // Handle target amount change (XAF when sending to Cameroon, CAD when sending from Cameroon)
  const handleTargetAmountChange = (text) => {
    const cleanedText = text.replace(/[^0-9.]/g, '');
    setConvertedAmount(cleanedText);
    setActiveInput('target');

    if (cleanedText && !isNaN(cleanedText)) {
      setIsLoading(true);
      try {
        const sourceConverted = convertTargetToSource(cleanedText);
        const feeConverted = calculateFees(sourceConverted);
        const total = calculateTotal(sourceConverted, cleanedText);

        setAmount(sourceConverted.toFixed(2));
        setTransferFee(feeConverted.toFixed(2));
        setTotalAmount(total.toFixed(2));
        setError(null);
      } catch (err) {
        setError(t('conversion_failed'));
      } finally {
        setIsLoading(false);
      }
    } else {
      setAmount('');
      setTransferFee(0);
      setTotalAmount('');
      setError(null);
    }
  };

  // Clean up effect - we'll use the handlers directly now
  useEffect(() => {
    // This effect is now empty because we handle conversions directly in the handlers
  }, []);

  const handleNext = () => {
    const numericSource = parseFloat(amount);
    const numericConverted = parseFloat(convertedAmount);
    
    if (numericConverted > 500000) {
      setShowMaxAmountAlert(true);
      return;
    }
    
    if (isToCameroon && numericConverted < MIN_AMOUNT_TO_TRANSFER_FROM_CANADA) {
      setShowAlert(true);
      return;
    }

    navigation.navigate('PaymentMethod', {
      amount,
      convertedAmount,
      totalAmount,
      transferFee,
      fromCurrency: isToCameroon ? 'CAD' : 'XAF',
      toCurrency: isToCameroon ? 'XAF' : 'CAD',
      countryName,
      conversionRate,
      cadRealTimeValue
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#F2F2F2" barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="left" size={24} color="black" />
        </TouchableOpacity>

        <Image source={button} style={styles.logo} resizeMode="contain" />
        <Image source={HomeImage} style={styles.homeImage} resizeMode="contain" />

        <MaterialIcons
          name="menu"
          size={24}
          color="black"
          style={styles.menuIcon}
          onPress={() => navigation.openDrawer()}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        <View style={styles.countryHeader}>
          <Image source={flagImage} style={styles.flag} resizeMode="contain" />
          <Text style={styles.countryName}>{countryName}</Text>
          <Text style={styles.conversionRateText}>{conversionRate}</Text>
        </View>

        <View style={styles.amountContainer}>
          {/* Source Currency Input */}
         <View style={styles.amountContainer}>
          {/* Source Currency Input */}
          <View style={[
            styles.amountInputContainer,
            activeInput === 'source' && styles.activeInput
          ]}>
            <TextInput
              keyboardType="decimal-pad"
              placeholder={isToCameroon ? t('amount_cad') : t('amount_xaf')}
              placeholderTextColor="#aaa"
              style={styles.amountInput}
              value={amount}
              onChangeText={handleSourceAmountChange}
              onFocus={() => setActiveInput('source')}
            />
            <Text style={styles.currencyLabel}>
              {isToCameroon ? 'CAD' : 'XAF'}
            </Text>
            
            {/* Show loader overlay only when loading and this input is active */}
            {isLoading && activeInput === 'source' && (
              <View style={styles.inputLoaderOverlay}>
                <Loader size="small" color="#7ddd7d" />
              </View>
            )}
          </View>

          <Image source={ArrowGoRound} style={styles.arrowIcon} />

          {/* Target Currency Input */}
          <View style={[
            styles.amountInputContainer,
            activeInput === 'target' && styles.activeInput
          ]}>
            <TextInput
              keyboardType="decimal-pad"
              placeholder={isToCameroon ? t('amount_xaf') : t('amount_cad')}
              placeholderTextColor="#aaa"
              style={styles.amountInput}
              value={convertedAmount}
              onChangeText={handleTargetAmountChange}
              onFocus={() => setActiveInput('target')}
            />
            <Text style={styles.currencyLabel}>
              {isToCameroon ? 'XAF' : 'CAD'}
            </Text>
            
            {/* Show loader overlay only when loading and this input is active */}
            {isLoading && activeInput === 'target' && (
              <View style={styles.inputLoaderOverlay}>
                <Loader size="small" color="#7ddd7d" />
              </View>
            )}
          </View>
        </View>

          <Image source={ArrowGoRound} style={styles.arrowIcon} />

          {/* Target Currency Input */}
          <View style={[
            styles.amountInputContainer,
            activeInput === 'target' && styles.activeInput
          ]}>
            {isLoading && activeInput === 'source' ? (
              <Loader size="small" color="#7ddd7d" style={{ flex: 1 }} />
            ) : (
              <TextInput
                keyboardType="decimal-pad"
                placeholder={isToCameroon ? t('amount_xaf') : t('amount_cad')}
                placeholderTextColor="#aaa"
                style={styles.amountInput}
                value={convertedAmount}
                onChangeText={handleTargetAmountChange}
                onFocus={() => setActiveInput('target')}
              />
            )}
            <Text style={styles.currencyLabel}>
              {isToCameroon ? 'XAF' : 'CAD'}
            </Text>
          </View>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="warning-outline" size={20} color="#ff6b6b" style={styles.warningIcon} />
            <Text style={styles.errorText}>
              {error}
            </Text>
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>
            {t('sending_money_to', { country: countryName })}
          </Text>
          <Text style={styles.infoCardSubtitle}>
            {t('fast_and_free')}
          </Text>
          <View style={styles.paymentMethods}>
            <Image source={bank} style={styles.paymentMethodIcon} />
            <Image source={om} style={styles.paymentMethodIcon} />
            <Image source={mtn} style={styles.paymentMethodIcon} />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.nextButton, (!amount || !convertedAmount) && styles.disabledButton]}
          onPress={handleNext}
          disabled={!amount || !convertedAmount}
        >
          <Text style={styles.nextButtonText}>{t('next')}</Text>
        </TouchableOpacity>

        <View style={styles.securityInfo}>
          <Ionicons name="shield-checkmark" size={18} color="#7ddd7d" />
          <Text style={styles.securityText}>
            {t('disclaimer')}
          </Text>
        </View>
      </ScrollView>

      {/* Minimum Amount Alert Modal */}
      <Modal transparent animationType="fade" visible={showAlert}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>
              {t('min_amount_alert_part1')}
              <Text style={styles.boldText}>{MIN_AMOUNT_TO_TRANSFER_FROM_CANADA} XAF</Text>.
              {'\n'}{t('min_amount_alert_part2')}
              <Text style={styles.boldText}>{MIN_AMOUNT_TO_TRANSFER_FROM_CANADA} XAF</Text>.
            </Text>
            <TouchableOpacity
              onPress={() => setShowAlert(false)}
              style={styles.modalButton}
            >
              <Text style={styles.modalButtonText}>{t('ok')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Maximum Amount Alert Modal */}
      <Modal transparent animationType="fade" visible={showMaxAmountAlert}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>
              {t('max_amount_alert_part1')}
              <Text style={styles.boldText}>500 000 XAF</Text>.
              {'\n'}{t('max_amount_alert_part2')}
            </Text>
            <TouchableOpacity
              onPress={() => setShowMaxAmountAlert(false)}
              style={styles.modalButton}
            >
              <Text style={styles.modalButtonText}>{t('ok')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
    padding: 16
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 25
  },
  logo: {
    width: 100,
    height: 70,
    marginLeft: 50
  },
  homeImage: {
    width: 70,
    height: 70,
    marginTop: -15,
    marginLeft: 10
  },
  menuIcon: {
    marginLeft: 'auto'
  },
  scrollView: {
    flex: 1
  },
  countryHeader: {
    alignItems: 'center',
    marginTop: 20
  },
  flag: {
    width: 50,
    height: 50,
    marginBottom: 10
  },
  countryName: {
    color: 'black',
    fontSize: 20,
    fontWeight: 'bold'
  },
  conversionRateText: {
    color: 'black',
    marginTop: 15,
    fontWeight: 'bold'
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30
  },
  amountInputContainer: {
    flex: 1,
    paddingHorizontal: 2,
    borderRadius: 10,
    borderColor: '#7ddd7d',
    borderWidth: 1,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    backgroundColor: 'white'
  },
  activeInput: {
    borderColor: '#7ddd7d',
    borderWidth: 2,
    shadowColor: '#7ddd7d',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  amountInput: {
    flex: 1,
    color: 'black',
    height: '100%',
    paddingHorizontal: 10
  },
  currencyLabel: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
    marginRight: 10
  },
  arrowIcon: {
    width: 24,
    height: 24,
    marginLeft: 10,
    marginRight: 10
  },
  errorContainer: {
    backgroundColor: '#ffecec',
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#ff6b6b'
  },
  warningIcon: {
    marginRight: 8
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    textAlign: 'center',
    flex: 1
  },
  detailsContainer: {
    backgroundColor: '#e8f5e8',
    borderRadius: 10,
    padding: 16,
    marginTop: 20,
    marginHorizontal: 20
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  detailLabel: {
    color: '#2e7d32',
    fontSize: 14
  },
  detailValue: {
    color: '#2e7d32',
    fontSize: 14,
    fontWeight: '500'
  },
  totalLabel: {
    color: '#2e7d32',
    fontSize: 16,
    fontWeight: 'bold'
  },
  totalAmount: {
    color: '#2e7d32',
    fontSize: 16,
    fontWeight: 'bold'
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#c8e6c9',
    paddingTop: 10,
    marginTop: 5
  },
  divider: {
    borderColor: '#ddd',
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 20,
    marginBottom: 4
  },
  infoCard: {
    backgroundColor: '#333',
    borderRadius: 16,
    padding: 24,
    marginLeft: 5,
    marginTop: 50
  },
  infoCardTitle: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'bold'
  },
  infoCardSubtitle: {
    color: '#7ddd7d',
    marginTop: 10,
    fontSize: 12,
    textAlign: 'center'
  },
  paymentMethods: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 15
  },
  paymentMethodIcon: {
    width: 70,
    height: 70,
    marginTop: -15
  },
  nextButton: {
    backgroundColor: '#7ddd7d',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    width: 200,
    alignSelf: 'center',
    marginTop: 50,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  disabledButton: {
    opacity: 0.5
  },
  nextButtonText: {
    color: 'black',
    fontSize: 18,
    fontWeight: 'bold'
  },
  securityInfo: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20
  },
  securityText: {
    color: 'black',
    marginLeft: 5,
    fontSize: 12
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)'
  },
  modalContent: {
    backgroundColor: '#222',
    padding: 20,
    borderRadius: 12,
    width: '80%',
    alignItems: 'center'
  },
  modalText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 22
  },
  boldText: {
    fontWeight: 'bold'
  },
  modalButton: {
    backgroundColor: '#7ddd7d',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 8
  },
  modalButtonText: {
    color: 'black',
    fontWeight: 'bold'
  }
});

export default Curency;