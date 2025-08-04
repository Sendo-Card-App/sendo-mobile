import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar, Platform, View, Text, ScrollView, TouchableOpacity, Image, TextInput ,SafeAreaView, Alert } from 'react-native';
import Modal from 'react-native-modal';
import { useCreatePasscodeMutation } from '../../services/Auth/authAPI';
import { useSelector, useDispatch } from 'react-redux';
import { setPasscode, incrementAttempt, resetAttempts, lockPasscode, toggleBiometric, clearPasscode, setIsNewUser } from '../../features/Auth/passcodeSlice';
import { getData, removeData, storeData } from "../../services/storage";
import { useGetUserProfileQuery } from "../../services/Auth/authAPI";
import { clearAuth } from '../../features/Auth/authSlice';
import Loader from "../../components/Loader";
import { Ionicons } from '@expo/vector-icons';
import Communications from 'react-native-communications';
import Toast from 'react-native-toast-message';
import * as LocalAuthentication from 'expo-local-authentication';
import { useTranslation } from 'react-i18next';
import { getStoredPushToken } from '../../services/notificationService';
import { useGetTokenMutation, useCreateTokenMutation, useCheckPincodeMutation } from '../../services/Auth/authAPI';


const PinCode = ({ navigation, route }) => {
  const { t } = useTranslation();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(null);
  const [passcodeExists, setPasscodeExists] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [hasStoredPasscode, setHasStoredPasscode] = useState(false);
  const [biometricType, setBiometricType] = useState(null);
  const [authData, setAuthData] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  
  const dispatch = useDispatch();
  const [createPasscode] = useCreatePasscodeMutation();
  const [createToken] = useCreateTokenMutation();
  const [checkPincode] = useCheckPincodeMutation();
  
  const {
    passcode: currentPasscode,
    attempts,
    lockedUntil,
    biometricEnabled
  } = useSelector(state => state.passcode);
  
  const { 
    data: userProfile, 
    isLoading: isProfileLoading, 
    error: profileError,
    refetch 
  } = useGetUserProfileQuery();

  const userId = userProfile?.data?.id;
  const { data: serverTokenData } = useGetTokenMutation(userId, {
    skip: !userId
  });
  const [showContactSupportModal, setShowContactSupportModal] = useState(false);

  const isNewUser = useSelector((state) => state.auth.isNewUser);
  const isSetup = route.params?.setup ?? !hasStoredPasscode;
  const isLocked = lockedUntil && new Date(lockedUntil) > new Date();

  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        const result = await refetch();
        const profile = result?.data?.data;

        if (profile?.passcode) {
          setPasscodeExists(true);
        } else {
          setPasscodeExists(false);
        }
      } catch (error) {
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const showToast = (type, title, message) => {
    Toast.show({
      type: type,
      text1: title,
      text2: message,
      visibilityTime: 4000,
      autoHide: true,
      topOffset: 30,
    });
  };

  useEffect(() => {
  const loadInitialData = async () => {
    const data = await getData('@authData');
    setAuthData(data);

    // Check both local storage and user profile for passcode
    const savedPasscode = userProfile?.data?.passcode || await getData('@passcode');
    if (savedPasscode) {
      setHasStoredPasscode(true);
      dispatch(setPasscode(savedPasscode));
    } else {
      setHasStoredPasscode(false);
      dispatch(clearPasscode()); // Ensure state is clear if no passcode exists
    }
  };

  loadInitialData();
}, [userProfile?.data?.passcode]); 
  // Check for biometric availability
  useEffect(() => {
    const checkBiometrics = async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
        
        setBiometricAvailable(hasHardware && isEnrolled);
        
        if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('face');
        } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType('fingerprint');
        }
      } catch (error) {
        console.error('Error checking biometrics:', error);
      }
    };
    
    checkBiometrics();
  }, []);

  // Auto-trigger biometric auth when component mounts if enabled
  useEffect(() => {
    if (biometricEnabled && biometricAvailable && !isSetup && !isLocked) {
      handleBiometricAuth();
    }
  }, [biometricEnabled, biometricAvailable, isSetup, isLocked]);

  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleBiometricAuth = async () => {
    if (isAuthenticating) return;
    setIsAuthenticating(true);
    try {
      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: t('pin.biometricPrompt'),
        fallbackLabel: Platform.OS === 'ios' ? t('pin.usePinInstead') : undefined,
        disableDeviceFallback: false,
      });

      if (authResult.success) {
        dispatch(resetAttempts());

        if (route.params?.onSuccess) {
          try {
            await route.params.onSuccess('biometric_auth');
            navigation.goBack();
          } catch (error) {
            console.error('Transfer failed after biometric auth:', error);
            showToast('error', t('errors.title'), error.message || t('errors.default'));
          }
        } else {
          navigation.navigate('Main');
        }
      } else if (authResult.error === 'user_cancel') {
        // Do nothing
      } else if (authResult.error === 'not_enrolled') {
        showToast('error', t('errors.title'), t('pin.biometricNotEnrolled'));
      } else {
        setError(t('pin.biometricFailed'));
      }
    } catch (err) {
      console.error('Biometric auth error:', err);
      setError(t('pin.biometricFailed'));

      if (route.params?.onSuccess) {
        showToast('error', t('errors.title'), t('pin.biometricFailed'));
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Handle PIN input
  useEffect(() => {
    if (pin.length === 4) {
      handleComplete(pin);
    }
  }, [pin]);
   
    useEffect(() => {
    return () => {
      // Clear the pin when component unmounts
      setPin('');
    };
  }, []);
  const handlePress = (value) => {
    if (isLocked || isBlocked) return;
    setError(null);
    
    if (value === 'del') {
      setPin(pin.slice(0, -1));
    } else if (value === 'biometric') {
      handleBiometricAuth();
    } else if (pin.length < 4) {
      setPin(pin + value);
    }
  };

const handleComplete = async (enteredPin) => {
  setIsLoading(true);
  try {
    const checkResponse = await checkPincode(enteredPin).unwrap();
    console.log('Check Pincode Response:', checkResponse);
    
    if (checkResponse.status === 200 && checkResponse.data?.pincode === true) {
      // Pincode is correct
      dispatch(resetAttempts());
      
      // Store the passcode in Redux and local storage
      dispatch(setPasscode(enteredPin));
      await storeData('@passcode', enteredPin);
      
      if (route.params?.showBalance) {
        if (route.params?.onSuccess) {
          await route.params.onSuccess(enteredPin);
        }
        navigation.goBack();
      } else if (route.params?.onSuccess) {
        await route.params.onSuccess(enteredPin);
        navigation.replace('Main', { screen: 'Success' });
      } else {
        navigation.replace('Main');
      }
    } else if (checkResponse.status === 403 || 
              (checkResponse.status === 200 && checkResponse.data?.pincode === false)) {
      // Pincode is incorrect
      const newAttempts = attempts + 1;
      dispatch(incrementAttempt());
      
      if (newAttempts >= 3) {
        setIsBlocked(true);
        setShowContactSupportModal(true);
        
        const errorMessage = checkResponse.data?.message === "Compte suspendu ou bloqué" 
          ? t('pin.accountSuspended') 
          : t('pin.accountBlocked');
        
        setError(errorMessage);
        
        const lockTime = new Date();
        lockTime.setMinutes(lockTime.getMinutes() + 5);
        dispatch(lockPasscode(lockTime.toISOString()));
      } else {
        setError(t('pin.incorrectPin'));
      }
      setPin('');
    } else if (checkResponse.status === 404) {
      // User doesn't have a pincode yet - create one
      const createResponse = await createPasscode({ passcode: enteredPin }).unwrap();
      if (createResponse.status === 200) {
        // Store the new passcode in both Redux and local storage
        await storeData('@passcode', enteredPin);
        dispatch(setPasscode(enteredPin));
        dispatch(setIsNewUser(false));
        navigation.navigate('Main');
      } else {
        setError(t('pin.validationError'));
        setPin('');
      }
    } else {
      setError(t('pin.unexpectedError'));
      setPin('');
    }
  } catch (error) {
    console.log('Error:', error);
    
    if (error?.data?.message === "Compte suspendu ou bloqué") {
      setIsBlocked(true);
      setShowContactSupportModal(true);
      setError(t('pin.accountSuspended'));
      // Clear stored passcode if account is suspended
      await removeData('@passcode');
      dispatch(clearPasscode());
    } else {
      showToast('error', t('errors.title'), error?.data?.message || t('errors.default'));
    }
    
    setPin('');
  } finally {
    setIsLoading(false);
  }
};

  const renderDots = () => (
    <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 20 }}>
      {[...Array(4)].map((_, index) => (
        <View
          key={index}
          style={{
            width: 13,
            height: 12,
            borderRadius: 6,
            marginHorizontal: 10,
            backgroundColor: index < pin.length ? (error ? 'red' : '#000') : '#ccc',
          }}
        />
      ))}
    </View>
  );

  const getBiometricIcon = () => {
    if (biometricType === 'face') {
      return require('../../images/face-id.png');
    } else if (biometricType === 'fingerprint') {
      return require('../../../assets/fingerprint.png');
    }
    return null;
  };

  const keypad = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    [biometricAvailable ? 'biometric' : '', '0', 'del'],
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
      {isLoading && (
        <View style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}>
          <Loader />
        </View>
      )}
      
      <View style={{ padding: 20, flex: 1, justifyContent: 'space-between' }}>
        <View style={{ alignItems: 'center' }}>           
          <Image
            source={require('../../images/LogoSendo.png')}
            style={{
              width: 100,
              height: 100,
              alignSelf: 'center',
              marginVertical: 30,
            }}
          />

          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#0D1C6A' }}>
            {t('pin.greeting')}, {userProfile?.data?.firstname} {userProfile?.data?.lastname}
          </Text>
          <Text style={{ fontSize: 16, color: '#0D1C6A', marginTop: 10 }}>
            {hasStoredPasscode ? t('pin.enterPin') : t('pin.setupPin')}
          </Text>

          {renderDots()}
          
          {error && (
            <Text style={{ color: 'red', marginTop: 10 }}>{error}</Text>
          )}
          
          {(isLocked || isBlocked) && (
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: 'red', marginTop: 10 }}>
                {isBlocked ? t('pin.accountBlocked') : t('pin.accountLocked')}
              </Text>
              {biometricAvailable && !isBlocked && (
                <TouchableOpacity
                  onPress={handleBiometricAuth}
                  activeOpacity={0.7}
                  accessibilityLabel="Unlock with biometric"
                  style={{ marginTop: 15, alignItems: 'center' }}
                >
                  <Image
                    source={getBiometricIcon()}
                    style={{ width: 50, height: 50 }}
                    resizeMode="contain"
                  />
                  <Text style={{ color: '#0D1C6A', marginTop: 5 }}>
                    {t('pin.unlockWithBiometric')}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {!(isLocked || isBlocked) && (
          <View style={{ alignItems: 'center' }}>
            {keypad.map((row, rowIndex) => (
              <View key={rowIndex} style={{ flexDirection: 'row', marginVertical: 10, marginTop: 15, }}>
                {row.map((item, index) => (
                  item ? (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handlePress(item)}
                      style={{
                        width: 80,
                        height: 60,
                        borderRadius: 30,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginHorizontal: 10,
                        backgroundColor: '#F1F1F1',
                      }}
                      disabled={isLoading}
                    >
                      {item === 'biometric' ? (
                        <Image
                          source={getBiometricIcon()}
                          style={{ width: 30, height: 30 }}
                        />
                      ) : (
                        <Text style={{ fontSize: 20, color: '#0D1C6A' }}>
                          {item === 'del' ? '⌫' : item}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <View key={index} style={{ width: 80, marginHorizontal: 10 }} />
                  )
                ))}
              </View>
            ))}

            {/* Add Forgot Pincode button */}
            <TouchableOpacity 
              onPress={() => setShowContactSupportModal(true)}
              style={{
                marginTop: 20,
                padding: 10,
              }}
            >
              <Text style={{ 
                color: '#0D1C6A', 
                textDecorationLine: 'underline',
                fontSize: 16,
              }}>
                {t('pin.forgotPin')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
       {/* Floating WhatsApp Button */}
      <TouchableOpacity 
        onPress={() => {
          const phoneNumber = '+237650464066'; // Replace with your support WhatsApp number
          const message = t('whatsapp.defaultMessage');
          Communications.text(phoneNumber, message);
        }}
        style={{
          position: 'absolute',
          bottom: 30,
          right: 30,
          backgroundColor: '#25D366',
          width: 60,
          height: 60,
          borderRadius: 30,
          justifyContent: 'center',
          alignItems: 'center',
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
        }}
      >
        <Ionicons name="logo-whatsapp" size={36} color="white" />
      </TouchableOpacity>

      {/* Contact Support Modal */}
      <Modal 
        isVisible={showContactSupportModal} 
        backdropOpacity={0.5}
        onBackdropPress={() => setShowContactSupportModal(false)}
      >
        <View style={{ 
          backgroundColor: 'white', 
          padding: 20,
          borderRadius: 10,
        }}>
          <Text style={{ 
            fontSize: 18, 
            fontWeight: 'bold', 
            marginBottom: 20,
            textAlign: 'center'
          }}>
            {t('pin.accountBlockedTitle')}
          </Text>
          
          <Text style={{ 
            marginBottom: 20,
            textAlign: 'center'
          }}>
            {t('pin.contactSupportMessage')}
          </Text>
          
          <TouchableOpacity
            onPress={() => setShowContactSupportModal(false)}
            style={{
              backgroundColor: '#7ddd7d',
              padding: 15,
              borderRadius: 8,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: 'white', fontWeight: 'bold' }}>
              {t('common.ok')}
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default PinCode;