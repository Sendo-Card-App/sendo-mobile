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
import person from '../../images/person.png';
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
  } = useGetConfigQuery();

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

  const isToCameroon = countryName === 'Cameroon';
  const TRANSFER_FEES = parseFloat(getConfigValue('TRANSFER_FEES'));
  const CAD_SENDO_VALUE = parseFloat(getConfigValue('CAD_SENDO_VALUE'));

  useEffect(() => {
    const timer = setTimeout(() => {
      if (amount && !isNaN(amount)) {
        setIsLoading(true);
        try {
          const numericAmount = parseFloat(amount);
          if (isNaN(numericAmount)) {
            setError(t('invalid_amount'));
            return;
          }

          let result;
          let total;
          let feeConverted;

          if (isToCameroon) {
            result = numericAmount * cadRealTimeValue;
            feeConverted = TRANSFER_FEES * cadRealTimeValue;
            total = result + feeConverted;
          } else {
            result = numericAmount / cadRealTimeValue;
            feeConverted = TRANSFER_FEES;
            total = result + feeConverted;
          }

          setConvertedAmount(result.toFixed(2));
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
    }, 300);

    return () => clearTimeout(timer);
  }, [amount, cadRealTimeValue, TRANSFER_FEES]);

  const handleAmountChange = (text) => {
    const cleanedText = text.replace(/[^0-9.]/g, '');
    setAmount(cleanedText);
  };

  const handleNext = () => {
    const numericTotal = parseFloat(totalAmount);
    if (numericTotal > 500000) {
      setShowMaxAmountAlert(true);
      return;
    }
    if (isToCameroon && parseFloat(convertedAmount) < CAD_SENDO_VALUE) {
      setShowAlert(true);
      return;
    }

    navigation.navigate('BeneficiarySelection', {
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
      <StatusBar backgroundColor="#F2F2F2" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="arrowleft" size={24} color="black" />
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
          <View style={styles.amountInputContainer}>
            <TextInput
              keyboardType="decimal-pad"
              placeholder={isToCameroon ? t('amount_cad') : t('amount_xaf')}
              placeholderTextColor="#aaa"
              style={styles.amountInput}
              value={amount}
              onChangeText={handleAmountChange}
            />
          </View>

          <Image source={ArrowGoRound} style={styles.arrowIcon} />

          <View style={styles.amountInputContainer}>
            {isLoading ? (
              <Loader size="small" color="#7ddd7d" style={{ flex: 1 }} />
            ) : (
              <TextInput
                placeholder={isToCameroon ? t('amount_xaf') : t('amount_cad')}
                placeholderTextColor="#aaa"
                style={styles.amountInput}
                value={convertedAmount}
                editable={false}
              />
            )}
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

        {/* {convertedAmount && (
          <View style={styles.totalContainer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{t('total_to_send')} :</Text>
              <Text style={styles.totalAmount}>
                {totalAmount} {isToCameroon ? 'XAF' : 'CAD'}
              </Text>
            </View>
          </View>
        )} */}

        <View style={styles.divider} />

        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>
            {t('sending_money_to', { country: countryName })}
          </Text>
          <Text style={styles.infoCardSubtitle}>
            {t('fast_and_free')}
          </Text>
          <View style={styles.paymentMethods}>
            <Image source={person} style={styles.paymentMethodIcon} />
            <Image source={mtn} style={styles.paymentMethodIcon} />
            <Image source={om} style={styles.paymentMethodIcon} />
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

      {/* Custom Alert Modal */}
      <Modal transparent animationType="fade" visible={showAlert}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>
              Le montant minimum d'une transaction pour le Cameroun est de{' '}
              <Text style={styles.boldText}>{CAD_SENDO_VALUE} XAF</Text>.
              {'\n'}Veuillez ressayer avec un montant supérieur à{' '}
              <Text style={styles.boldText}>{CAD_SENDO_VALUE} XAF</Text>.
            </Text>
            <TouchableOpacity
              onPress={() => setShowAlert(false)}
              style={styles.modalButton}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal transparent animationType="fade" visible={showMaxAmountAlert}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>
              Pour les transactions entre le Canada et le Cameroun, le montant maximum autorisé est de{' '}
              <Text style={styles.boldText}>500 000 XAF</Text>.
              {'\n'}Merci de saisir un montant inférieur ou égal à cette limite.
            </Text>
            <TouchableOpacity
              onPress={() => setShowMaxAmountAlert(false)}
              style={styles.modalButton}
            >
              <Text style={styles.modalButtonText}>OK</Text>
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
    fontSize: 20
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
  amountInput: {
    flex: 1,
    color: 'black',
    height: '100%',
    paddingHorizontal: 10
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
  totalContainer: {
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 16,
    marginTop: 20,
    marginHorizontal: 20
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  totalLabel: {
    color: '#fff',
    fontSize: 17
  },
  totalAmount: {
    color: '#7ddd7d',
    fontSize: 17,
    fontWeight: 'bold'
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
    fontSize: 14,
    textAlign: 'center'
  },
  infoCardSubtitle: {
    color: '#7ddd7d',
    marginTop: 10,
    fontSize: 10,
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
    paddingVertical: 12,
    alignItems: 'center',
    width: 200,
    alignSelf: 'center',
    marginTop: 50
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
    marginBottom: 15
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