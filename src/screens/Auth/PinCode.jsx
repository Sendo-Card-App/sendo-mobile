import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar, Platform, View, Text, ScrollView, TouchableOpacity, Image, TextInput , Alert, Linking } from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import Modal from 'react-native-modal';
import { useCreatePasscodeMutation } from '../../services/Auth/authAPI';
import { useSelector, useDispatch } from 'react-redux';
import { setPasscode, incrementAttempt, resetAttempts, lockPasscode, toggleBiometric, clearPasscode, setIsNewUser } from '../../features/Auth/passcodeSlice';
import { getData, removeData, storeData } from "../../services/storage";
import { useGetUserProfileQuery } from "../../services/Auth/authAPI";
import { clearAuth } from '../../features/Auth/authSlice';
import Loader from "../../components/Loader";
import { AntDesign, Ionicons, MaterialIcons } from "@expo/vector-icons"; 
import Communications from 'react-native-communications';
import Toast from 'react-native-toast-message';
import * as LocalAuthentication from 'expo-local-authentication';
import { useTranslation } from 'react-i18next';
import { getStoredPushToken } from '../../services/notificationService';
import { useGetTokenMutation, useCreateTokenMutation, useCheckPincodeMutation, useRefreshTokenMutation, } from '../../services/Auth/authAPI';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppState } from '../../context/AppStateContext';

const PinCode = ({ navigation, route }) => {
  const { t } = useTranslation();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(null);
    const { setIsPickingDocument } = useAppState();
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
  const [refreshTokenMutation] = useRefreshTokenMutation();
  
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
  } = useGetUserProfileQuery(undefined, {
    pollingInterval: 10
  });

  //console.log('User Profile in PinCode:', userProfile);
  const userId = userProfile?.data?.user?.id;
  const { data: serverTokenData } = useGetTokenMutation(userId, {
    skip: !userId
  });
  const [showContactSupportModal, setShowContactSupportModal] = useState(false);

  const isNewUser = useSelector((state) => state.auth.isNewUser);
  const isSetup = route.params?.setup ?? !hasStoredPasscode;
  const isLocked = lockedUntil && new Date(lockedUntil) > new Date();

  // 🔑 KEY FIX: Set PIN verification status when component mounts
  useEffect(() => {
    const setInitialPinStatus = async () => {
      // When PinCode screen opens, mark PIN as not verified
      await AsyncStorage.setItem('pinVerified', 'false');
    };
    
    setInitialPinStatus();
  }, []);

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
        console.error('Error checking passcode:', error);
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
      if (data) {
        setAuthData(data);

        const refreshToken = data.accessToken;
        const deviceId = data.deviceId;

        try {
          const result = await refreshTokenMutation({ refreshToken, deviceId }).unwrap();
          console.log("🔄 Refresh response:", result);

          if (result?.data?.accessToken) {
            const newAuthData = {
              ...data,
              accessToken: result.data.accessToken,
              deviceId: deviceId, 
            };

            await storeData('@authData', newAuthData);
            setAuthData(newAuthData);
          } else {
            console.warn("Failed to refresh token:", result);
          }
        } catch (err) {
          console.log('refresh token error:', JSON.stringify(err, null, 2));
        }
      }

      // Handle passcode logic
      const savedPasscode = userProfile?.data?.user?.passcode || (await getData('@passcode'));
      if (savedPasscode) {
        setHasStoredPasscode(true);
        dispatch(setPasscode(savedPasscode));
      } else {
        setHasStoredPasscode(false);
        dispatch(clearPasscode());
      }
    };

    loadInitialData();
  }, []);

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
    if (biometricEnabled && biometricAvailable && !isSetup && !isLocked && !isBlocked) {
      handleBiometricAuth();
    }
  }, [biometricEnabled, biometricAvailable, isSetup, isLocked, isBlocked]);

  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // 🔑 KEY FIX: Update biometric auth to set PIN verification status
  const handleBiometricAuth = async () => {
    // COMPLETELY BLOCK biometric auth if account is blocked
    if (isAuthenticating || isBlocked) {
      console.log('Biometric auth blocked: Account is suspended/blocked');
      return;
    }
    
    setIsAuthenticating(true);

    try {
      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: t('pin.biometricPrompt'),
        fallbackLabel: Platform.OS === 'ios' ? t('pin.usePinInstead') : undefined,
        disableDeviceFallback: false,
      });

      if (authResult.success) {
        dispatch(resetAttempts());

        // ✅ Set PIN as verified
        await AsyncStorage.setItem('pinVerified', 'true');

        // ✅ Récupérer le pincode stocké (si déjà défini)
        const storedPin = await getData('@passcode');

        if (storedPin) {
          // 🔐 Pincode déjà défini → on le recharge dans Redux
          dispatch(setPasscode(storedPin));
        } else if (route.params?.passcode) {
          // 🆕 Cas où un nouveau code est passé en paramètre → on le stocke
          dispatch(setPasscode(route.params.passcode));
          await storeData('@passcode', route.params.passcode);
        }

        // 🚀 Ensuite, même logique que handleComplete
        if (route.params?.onSuccess) {
          try {
            await route.params.onSuccess(storedPin || route.params.passcode || 'biometric_auth');
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
    if (pin.length === 4 && !isBlocked) {
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

  // 🔑 KEY FIX: Update handleComplete to set PIN verification status
  const handleComplete = async (enteredPin) => {
    if (isBlocked) return;
    
    setIsLoading(true);
    try {
      const checkResponse = await checkPincode(enteredPin).unwrap();
      console.log('Check Pincode Response:', checkResponse);

      // ✅ Pincode is correct
      if (checkResponse.status === 200 && checkResponse.data?.pincode === true) {
        dispatch(resetAttempts());

        // ✅ Set PIN as verified - CRITICAL FOR APPSTATE TO WORK
        await AsyncStorage.setItem('pinVerified', 'true');

        // Save passcode in Redux + local storage
        dispatch(setPasscode(enteredPin));
        await storeData('@passcode', enteredPin);

        if (route.params?.onSuccess) {
          // If WalletRecharge (or another screen) passed a callback
          await route.params.onSuccess(enteredPin);

          // Always return to previous screen after success
          navigation.goBack();
        } else if (route.params?.showBalance) {
          // Special case: just show balance
          navigation.goBack();
        } else {
          // Default flow → go to Main / Success
          navigation.replace('Main', { screen: 'MainTabs' });
        }

        return;
      }

      // Pincode incorrect
      if (
        checkResponse.status === 403 ||
        (checkResponse.status === 200 && checkResponse.data?.pincode === false)
      ) {
        const newAttempts = attempts + 1;
        dispatch(incrementAttempt());

        if (newAttempts >= 3) {
          setIsBlocked(true);
          setShowContactSupportModal(true);

          const errorMessage =
            checkResponse.data?.message === 'Compte suspendu ou bloqué'
              ? t('pin.accountSuspended')
              : t('pin.accountBlocked');

          setError(errorMessage);

          // Lock for 5 minutes
          const lockTime = new Date();
          lockTime.setMinutes(lockTime.getMinutes() + 5);
          dispatch(lockPasscode(lockTime.toISOString()));

          // Clear stored passcode + Redux state after 3 failed attempts
          await removeData('@passcode');
          dispatch(clearPasscode());
        } else {
          setError(t('pin.incorrectPin'));
        }

        setPin('');
        return;
      }

      // Unexpected case
      setError(t('pin.unexpectedError'));
      setPin('');
   } catch (error) {
  console.log('pincode error:', JSON.stringify(error, null, 2));

  // 🆕 No PIN yet → create one
  if (error?.data?.message?.includes('Aucun pincode défini')) {
    try {
      const createResponse = await createPasscode({ passcode: enteredPin }).unwrap();

      if (createResponse.status === 200) {
        // ✅ Set PIN as verified when creating new PIN
        await AsyncStorage.setItem('pinVerified', 'true');

        await storeData('@passcode', enteredPin);
        dispatch(setPasscode(enteredPin));
        dispatch(setIsNewUser(false));
        navigation.navigate('Main');
      } else {
        setError(t('pin.validationError'));
        setPin('');
      }
    } catch (createError) {
      console.log('create pin error:', createError);
      setError(t('pin.validationError'));
      setPin('');
    }
    return;
  }

  // 🆕 Handle "Compte suspendu"
  if (error?.data?.message === 'Compte suspendu ou bloqué') {
    setIsBlocked(true);
    setShowContactSupportModal(true);
    setError(t('pin.accountSuspended'));

    // Clear stored passcode if account is suspended
    await removeData('@passcode');
    dispatch(clearPasscode());
    return;
  }

  // Handle "Session invalide"
if (
  error?.data?.message?.includes('Session invalide') ||
  error?.data?.message?.includes('Token invalide')
) {
  await removeData('@passcode');
  dispatch(clearPasscode());
  await AsyncStorage.removeItem('pinVerified');

  // Redirect to SignIn screen
  navigation.reset({
    index: 0,
    routes: [{ name: 'SignIn' }],
  });
  return;
}


  // Default error
  showToast(
    'error',
    t('errors.title'),
    error?.data?.message || t('errors.default')
  );

  setPin('');
} finally {
  setIsLoading(false);
}
  };

   const handleCustomerServicePress = () => {
    setIsPickingDocument(true);
    navigation.navigate("ChatLive");
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

  // Block all interactions when account is blocked/suspended
  if (isBlocked) {
    return (
      <SafeAreaView style={{ 
        flex: 1, 
        backgroundColor: '#fff', 
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        {/* Blocked/Suspended Screen */}
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center',
          padding: 20 
        }}>
          <Image
            source={require('../../images/LogoSendo.png')}
            style={{
              width: 100,
              height: 100,
              marginBottom: 30,
            }}
          />

          <Text style={{ 
            fontSize: 24, 
            fontWeight: 'bold', 
            color: '#FF3B30',
            textAlign: 'center',
            marginBottom: 10
          }}>
            {t('pin.accountBlockedTitle')}
          </Text>
          
          <Text style={{ 
            fontSize: 16, 
            color: '#666',
            textAlign: 'center',
            marginBottom: 30,
            lineHeight: 22
          }}>
            {error || t('pin.contactSupportMessage')}
          </Text>

          {/* Only show the contact support button */}
          <TouchableOpacity
            onPress={() => {
              const url = "https://wa.me/message/GYEAYFKV6T2SO1";
              Linking.openURL(url).catch(() => {
                Alert.alert('Erreur', 'Impossible d\'ouvrir WhatsApp. Vérifiez qu\'il est installé.');
              });
            }}
            style={{
              backgroundColor: '#7ddd7d',
              padding: 15,
              borderRadius: 8,
              alignItems: 'center',
              minWidth: 200
            }}
          >
            <Text style={{ 
              color: 'white', 
              fontWeight: 'bold',
              fontSize: 16 
            }}>
              {t('pin.contactSupport')}
            </Text>
          </TouchableOpacity>

          {/* Floating WhatsApp Button (still accessible) */}
          <TouchableOpacity 
            onPress={() => {
              const url = "https://wa.me/message/GYEAYFKV6T2SO1";
              Linking.openURL(url).catch(() => {
                Alert.alert('Erreur', 'Impossible d\'ouvrir WhatsApp. Vérifiez qu\'il est installé.');
              });
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
        </View>
      </SafeAreaView>
    );
  }

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
            {t('pin.greeting')}, {userProfile?.data?.user?.firstname} {userProfile?.data?.user?.lastname}
          </Text>
          <Text style={{ fontSize: 16, color: '#0D1C6A', marginTop: 10 }}>
            {hasStoredPasscode ? t('pin.enterPin') : t('pin.setupPin')}
          </Text>

          {renderDots()}
          
          {error && (
            <Text style={{ color: 'red', marginTop: 10 }}>{error}</Text>
          )}
          
          {isLocked && (
            <View style={{ alignItems: 'center' }}>
              <Text style={{ color: 'red', marginTop: 10 }}>
                {t('pin.accountLocked')}
              </Text>
              {biometricAvailable && (
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

        {!isLocked && (
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
          onPress={handleCustomerServicePress}
          style={{
            position: 'absolute',
            bottom: 30,
            right: 30,
            backgroundColor: '#007AFF', // Bleu pour le chat
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
          <MaterialIcons name="chat" size={32} color="white" />
        </TouchableOpacity>

      {/* Contact Support Modal */}
      <Modal 
        isVisible={showContactSupportModal} 
        backdropOpacity={0.5}
        onBackdropPress={() => !isBlocked && setShowContactSupportModal(false)}
        backdropColor={isBlocked ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)'}
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
            onPress={handleCustomerServicePress}
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