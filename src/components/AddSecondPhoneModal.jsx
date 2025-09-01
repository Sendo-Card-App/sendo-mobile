import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Modal,
  Image, ScrollView
} from 'react-native';
import Loader from "./Loader";
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialIcons';

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
  const [filteredCountries, setFilteredCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCountries();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = countries.filter(country => 
        country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        country.code.includes(searchQuery)
      );
      setFilteredCountries(filtered);
    } else {
      setFilteredCountries(countries);
    }
  }, [searchQuery, countries]);

  const fetchCountries = async () => {
    try {
      const res = await fetch('https://restcountries.com/v3.1/all?fields=name,idd,flags,cca2');
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      const countriesList = data
        .map(c => {
          const name = c?.name?.common;
          const root = c?.idd?.root || '';
          const suffixes = c?.idd?.suffixes || [];
          let code = suffixes.length > 0 ? `${root}${suffixes[0]}` : root;

          if (!name || !code) return null;

          if (!code.startsWith('+')) {
            code = '+' + code;
          }

          const flag = c?.flags?.png || c?.flags?.svg || null;
          const isoCode = c?.cca2 || null;

          return { name, code, flag, isoCode };
        })
        .filter(Boolean)
        .sort((a, b) => a.name.localeCompare(b.name));

      setCountries(countriesList);
      setFilteredCountries(countriesList);

      // 🔽 Set default country to Cameroon (CM)
      const defaultCameroon = countriesList.find(c => c.isoCode === 'CM');
      setSelectedCountry(defaultCameroon || countriesList[0]);

    } catch (error) {
      console.log("Error fetching countries:", error);
      Toast.show({ type: 'error', text1: 'Failed to load countries' });
    }
  };

  const handleSendOtp = async () => {
    if (!phone) return;
    const fullPhoneNumber = `${selectedCountry.code}${phone}`;
    setLocalLoading(true);
    try {
      await onSendOtp({ phone: fullPhoneNumber });
      setOtpSent(true);
    } catch (err) {
      console.error(err);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!code) return;
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

  const handleCloseCountryPicker = () => {
    setShowCountryPicker(false);
    setSearchQuery('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
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
                  {selectedCountry?.flag && (
                    <Image
                      source={{ uri: selectedCountry.flag }}
                      style={{ width: 24, height: 16, marginRight: 5 }}
                    />
                  )}
                  <Text>{selectedCountry?.code}</Text>
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
                  textAlign: 'center',
                }}
              />

              <TouchableOpacity
                onPress={handleVerify}
                style={{
                  backgroundColor: '#7ddd7d',
                  padding: 15,
                  borderRadius: 30,
                  alignItems: 'center',
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
        transparent
        animationType="slide"
        onRequestClose={handleCloseCountryPicker}
      >
        <View style={{ flex: 1, justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{
            backgroundColor: 'white',
            margin: 20,
            padding: 20,
            borderRadius: 10,
            maxHeight: '70%'
          }}>
            {/* Header with back button and title */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
              <TouchableOpacity 
                onPress={handleCloseCountryPicker}
                style={{ marginRight: 10 }}
              >
                <Icon name="arrow-back" size={24} color="#000" />
              </TouchableOpacity>
              <Text style={{
                fontSize: 18,
                fontWeight: 'bold',
                flex: 1,
                textAlign: 'center'
              }}>
                {t('addSecondPhone.selectCountry')}
              </Text>
            </View>

            {/* Search bar */}
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#f0f0f0',
              borderRadius: 10,
              paddingHorizontal: 10,
              marginBottom: 15
            }}>
              <Icon name="search" size={20} color="#666" />
              <TextInput
                placeholder={t('addSecondPhone.searchPlaceholder')}
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  paddingHorizontal: 10,
                  fontSize: 16
                }}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Icon name="close" size={20} color="#666" />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView>
              {filteredCountries.length > 0 ? (
                filteredCountries.map((country) => (
                  <TouchableOpacity
                    key={`${country.code}-${country.name}`}
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
                      handleCloseCountryPicker();
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
                ))
              ) : (
                <Text style={{ textAlign: 'center', padding: 20, color: '#666' }}>
                  {t('addSecondPhone.noCountriesFound')}
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

export default AddSecondPhoneModal;