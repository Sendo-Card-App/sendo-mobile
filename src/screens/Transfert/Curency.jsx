import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
  Modal
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

  const isToCameroon = countryName === 'Cameroon';
  const TRANSFER_FEES = parseFloat(getConfigValue('TRANSFER_FEES'));
  const MIN_AMOUNT_TO_TRANSFER_FROM_CANADA = parseFloat(getConfigValue('MIN_AMOUNT_TO_TRANSFER_FROM_CANADA'));

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
    if (isToCameroon && parseFloat(convertedAmount) < MIN_AMOUNT_TO_TRANSFER_FROM_CANADA) {
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
    <View style={{ flex: 1, backgroundColor: '#0D0D0D', padding: 16 }}>
      <StatusBar barStyle="light-content" />

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginTop: 25 }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="arrowleft" size={24} color="white" />
        </TouchableOpacity>

        <Image source={button} style={{ width: 100, height: 70, marginLeft: 50 }} resizeMode="contain" />
        <Image source={HomeImage} style={{ width: 70, height: 70, marginTop: -15, marginLeft: 10 }} resizeMode="contain" />

        <MaterialIcons
          name="menu"
          size={24}
          color="white"
          style={{ marginLeft: 'auto' }}
          onPress={() => navigation.openDrawer()}
        />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={{ alignItems: 'center', marginTop: 20 }}>
          <Image source={flagImage} style={{ width: 50, height: 50, marginBottom: 10 }} resizeMode="contain" />
          <Text style={{ color: 'white', fontSize: 20 }}>{countryName}</Text>
          <Text style={{ color: 'white', marginTop: 15 }}>{conversionRate}</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 30 }}>
          <View style={{
            flex: 1,
            paddingHorizontal: 2,
            borderRadius: 10,
            borderColor: '#7f7f7f',
            borderWidth: 1,
            paddingVertical: 5,
            flexDirection: 'row',
            alignItems: 'center',
            height: 50
          }}>
            <TextInput
              keyboardType="decimal-pad"
              placeholder={isToCameroon ? t('amount_cad') : t('amount_xaf')}
              placeholderTextColor="#aaa"
              style={{ flex: 1, color: 'white', height: '100%' }}
              value={amount}
              onChangeText={handleAmountChange}
            />
          </View>

          <Image source={ArrowGoRound} style={{ width: 24, height: 24, marginLeft: 10 }} />

          <View style={{
            flex: 1.5,
            paddingHorizontal: 2,
            borderRadius: 10,
            borderColor: '#7f7f7f',
            borderWidth: 1,
            paddingVertical: 5,
            flexDirection: 'row',
            alignItems: 'center',
            height: 50
          }}>
            {isLoading ? (
              <Loader size="small" color="#7ddd7d" style={{ flex: 1 }} />
            ) : (
              <TextInput
                placeholder={isToCameroon ? t('amount_xaf') : t('amount_cad')}
                placeholderTextColor="#aaa"
                style={{ flex: 1, color: 'white', height: '100%' }}
                value={convertedAmount}
                editable={false}
              />
            )}
          </View>
        </View>
          {error && (
            <View style={{
              backgroundColor: '#441111',
              padding: 12,
              borderRadius: 10,
              marginTop: 10,
              marginHorizontal: 20,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Ionicons name="warning-outline" size={20} color="#ff6b6b" style={{ marginRight: 8 }} />
              <Text style={{ color: '#ff6b6b', fontSize: 14, textAlign: 'center', flex: 1 }}>
                {error}
              </Text>
            </View>
          )}

          {convertedAmount && (
            <View style={{
              backgroundColor: '#1a1a1a',
              borderRadius: 10,
              padding: 16,
              marginTop: 20,
              marginHorizontal: 20
            }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                <Text style={{ color: '#ccc', fontSize: 14 }}>{t('transfer_fee')}</Text>
                <Text style={{ color: 'white', fontSize: 14 }}>
                  {transferFee} {isToCameroon ? 'XAF' : 'CAD'}
                </Text>
              </View>

              <View style={{
                height: 1,
                backgroundColor: '#333',
                marginVertical: 6
              }} />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: '#ccc', fontSize: 14 }}>{t('total_to_send')}</Text>
                <Text style={{ color: '#7ddd7d', fontSize: 16, fontWeight: 'bold' }}>
                  {totalAmount} {isToCameroon ? 'XAF' : 'CAD'}
                </Text>
              </View>
            </View>
          )}


        <View style={{ borderColor: 'gray', borderWidth: 1, borderStyle: 'dashed', marginTop: 20, marginBottom: 4 }} />

        {/* <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 20 }}>
          <Text style={{ color: 'white', marginRight: 8 }}>{t('promo_code')}</Text>
          <TextInput
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: '#7f7f7f',
              borderRadius: 8,
              paddingHorizontal: 8,
              paddingVertical: 4,
              color: 'white',
              height: 40
            }}
            placeholderTextColor="#aaa"
          />
          <TouchableOpacity style={{
            backgroundColor: '#7ddd7d',
            borderRadius: 8,
            paddingVertical: 6,
            paddingHorizontal: 12,
            marginLeft: 8
          }}>
            <Text style={{ color: 'black' }}>{t('ok')}</Text>
          </TouchableOpacity>
        </View> */}

        {/* <View style={{ borderColor: 'gray', borderWidth: 1, borderStyle: 'dashed', marginTop: 20, marginBottom: 4 }} /> */}

        <View style={{ backgroundColor: '#333', borderRadius: 16, padding: 24, marginLeft: 5, marginTop: 50 }}>
          <Text style={{ color: 'white', fontSize: 14, textAlign: 'center' }}>
            {t('sending_money_to', { country: countryName })}
          </Text>
          <Text style={{ color: 'white', marginTop: 10, fontSize: 10, textAlign: 'center' }}>
            {t('fast_and_free')}
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 15 }}>
            <Image source={person} style={{ width: 70, height: 70, marginTop: -15 }} />
            <Image source={mtn} style={{ width: 70, height: 70, marginTop: -15 }} />
            <Image source={om} style={{ width: 70, height: 70, marginTop: -15 }} />
          </View>
        </View>

        <TouchableOpacity
          style={{
            backgroundColor: '#7ddd7d',
            borderRadius: 8,
            paddingVertical: 12,
            alignItems: 'center',
            width: 200,
            alignSelf: 'center',
            marginTop: 50,
            opacity: (!amount || !convertedAmount) ? 0.5 : 1
          }}
          onPress={handleNext}
          disabled={!amount || !convertedAmount}
        >
          <Text style={{ color: 'black', fontSize: 18 }}>{t('next')}</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 }}>
          <Ionicons name="shield-checkmark" size={18} color="orange" />
          <Text style={{ color: 'white', marginLeft: 5, fontSize: 12 }}>
            {t('disclaimer')}
          </Text>
        </View>
      </ScrollView>

      {/* Custom Alert Modal */}
      <Modal transparent animationType="fade" visible={showAlert}>
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.6)'
        }}>
          <View style={{
            backgroundColor: '#222',
            padding: 20,
            borderRadius: 12,
            width: '80%',
            alignItems: 'center'
          }}>
            <Text style={{ color: 'white', fontSize: 16, textAlign: 'center', marginBottom: 15 }}>
              Le montant minimum d'une transaction pour le Cameroun est de{' '}
              <Text style={{ fontWeight: 'bold' }}>{MIN_AMOUNT_TO_TRANSFER_FROM_CANADA} XAF</Text>.
              {'\n'}Veuillez ressayer avec un montant supérieur à{' '}
              <Text style={{ fontWeight: 'bold' }}>{MIN_AMOUNT_TO_TRANSFER_FROM_CANADA} XAF</Text>.
            </Text>
            <TouchableOpacity
              onPress={() => setShowAlert(false)}
              style={{
                backgroundColor: '#7ddd7d',
                paddingVertical: 10,
                paddingHorizontal: 25,
                borderRadius: 8
              }}
            >
              <Text style={{ color: 'black', fontWeight: 'bold' }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Curency;
