import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, Image, ScrollView } from 'react-native';
import Loader from "./Loader";
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';

const AddSecondPhoneModal = ({
  visible,
  onClose,
  onSendOtp,
  onVerifyOtp,
  isLoading,
  error,
}) => {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
   const { t } = useTranslation();
  const [localLoading, setLocalLoading] = useState(false);
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState({
    name: 'Cameroon',
    code: '+237',
    flag: 'https://flagcdn.com/w320/cm.png'
  });
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    try {
      const res = await fetch('https://restcountries.com/v3.1/all');
      const data = await res.json();
      const sorted = data.map(c => ({
        name: c.name.common,
        code: `+${c.idd.root?.replace('+', '') || ''}${c.idd.suffixes ? c.idd.suffixes[0] : ''}`,
        flag: c.flags?.png
      })).filter(c => c.code).sort((a, b) => a.name.localeCompare(b.name));
      setCountries(sorted);
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Failed to load countries' });
    }
  };

  const handleSendOtp = async () => {
    if (!phone) {
      return;
    }
    
    const fullPhoneNumber = `${selectedCountry.code}${phone}`;
    
    setLocalLoading(true);
    try {
      await onSendOtp({phone: fullPhoneNumber});
      setOtpSent(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!code) {
      return;
    }
    
    const fullPhoneNumber = `${selectedCountry.code}${phone}`;
    
    setLocalLoading(true);
    try {
      await onVerifyOtp({ phone: fullPhoneNumber, code });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLocalLoading(false);
    }
  };

   return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={{ backgroundColor: 'white', margin: 20, padding: 20, borderRadius: 10 }}>
          {!otpSent ? (
            <>
              <Text style={{ fontSize: 18, marginBottom: 10 }}>
                {t('addSecondPhone.title')}
              </Text>
              
              <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                <TouchableOpacity
                  style={{ 
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#fff',
                    borderRadius: 30,
                    paddingVertical: 14,
                    paddingHorizontal: 15,
                    borderWidth: 1,
                    marginRight: 5,
                  }}
                  onPress={() => setShowCountryPicker(true)}
                >
                  {selectedCountry.flag && (
                    <Image 
                      source={{ uri: selectedCountry.flag }} 
                      style={{ width: 24, height: 16, marginRight: 5 }} 
                    />
                  )}
                  <Text>{selectedCountry.code}</Text>
                </TouchableOpacity>
                
                <TextInput
                  placeholder={t('addSecondPhone.phonePlaceholder')}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  style={{ 
                    flex: 1,
                    backgroundColor: '#fff',
                    borderRadius: 30,
                    paddingVertical: 14,
                    paddingHorizontal: 20,
                    fontSize: 16,
                    borderWidth: 1,
                  }}
                />
              </View>
              
              <TouchableOpacity
                onPress={handleSendOtp}
                style={{ 
                  backgroundColor: '#7ddd7d', 
                  padding: 15, 
                  borderRadius: 30,
                  alignItems: 'center',
                }}
                disabled={localLoading || !phone}
              >
                {localLoading ? (
                  <Loader small white />
                ) : (
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>
                    {t('addSecondPhone.sendOtp')}
                  </Text>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Image
                className="w-40 h-40"
                source={require("../images/Artboard 5.png")}
              />
              <Text style={{ fontSize: 18, marginBottom: 10 }}>
                {t('addSecondPhone.otpTitle', { phone: `${selectedCountry.code}${phone}` })}
              </Text>
              
              <TextInput
                placeholder={t('addSecondPhone.otpPlaceholder')}
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
                style={{ 
                  backgroundColor: '#fff',
                  borderRadius: 30,
                  paddingVertical: 14,
                  paddingHorizontal: 20,
                  fontSize: 16,
                  borderWidth: 1,
                  marginBottom: 10,
                  textAlign: 'center'
                }}
              />
              
              <TouchableOpacity
                onPress={handleVerify}
                style={{ 
                  backgroundColor: '#7ddd7d', 
                  padding: 15, 
                  borderRadius: 30,
                  alignItems: 'center'
                }}
                disabled={localLoading || !code}
              >
                {localLoading ? (
                  <Loader small white />
                ) : (
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>
                    {t('addSecondPhone.verifyOtp')}
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}
          
          <TouchableOpacity
            onPress={() => {
              setOtpSent(false);
              setPhone('');
              setCode('');
              onClose();
            }}
            style={{ marginTop: 15, padding: 10, alignItems: 'center' }}
          >
            <Text style={{ color: 'red', fontWeight: 'bold' }}>
              {t('addSecondPhone.cancel')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Country Picker Modal */}
      <Modal
        visible={showCountryPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCountryPicker(false)}
      >
        <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: 'white', margin: 20, padding: 20, borderRadius: 10, maxHeight: '70%' }}>
            <Text style={{ fontSize: 18, marginBottom: 15, fontWeight: 'bold', textAlign: 'center' }}>
              {t('addSecondPhone.selectCountry')}
            </Text>
            
            <ScrollView>
              {countries.map((country) => (
                <TouchableOpacity
                  key={country.code}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    paddingHorizontal: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: '#f0f0f0'
                  }}
                  onPress={() => {
                    setSelectedCountry(country);
                    setShowCountryPicker(false);
                  }}
                >
                  {country.flag && (
                    <Image 
                      source={{ uri: country.flag }} 
                      style={{ width: 30, height: 20, marginRight: 10 }} 
                    />
                  )}
                  <Text style={{ flex: 1 }}>{country.name}</Text>
                  <Text>{country.code}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            
            <TouchableOpacity
              onPress={() => setShowCountryPicker(false)}
              style={{ 
                backgroundColor: '#f0f0f0', 
                padding: 12, 
                borderRadius: 30,
                alignItems: 'center',
                marginTop: 15
              }}
            >
              <Text style={{ fontWeight: 'bold' }}>
                {t('addSecondPhone.countryPickerCancel')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

export default AddSecondPhoneModal;