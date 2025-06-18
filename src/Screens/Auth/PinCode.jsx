import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { StatusBar, Platform, View, Text, TouchableOpacity, Image, SafeAreaView, Alert } from 'react-native';
import { useCreatePasscodeMutation } from '../../services/Auth/authAPI';
import { useSelector, useDispatch } from 'react-redux';
import { setPasscode, incrementAttempt, resetAttempts, lockPasscode, toggleBiometric, clearPasscode, setIsNewUser } from '../../features/Auth/passcodeSlice';
import { getData, removeData, storeData } from "../../services/storage";
import { useGetUserProfileQuery } from "../../services/Auth/authAPI";
import { clearAuth } from '../../features/Auth/authSlice';
import Loader from "../../components/Loader";
import Toast from 'react-native-toast-message';
import * as LocalAuthentication from 'expo-local-authentication';
import { useTranslation } from 'react-i18next';
import { getStoredPushToken } from '../../services/notificationService';
import { useGetTokenMutation, useCreateTokenMutation } from '../../services/Auth/authAPI';

const PinCode = ({ navigation, route }) => {
  const { t } = useTranslation();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [hasStoredPasscode, setHasStoredPasscode] = useState(false);
  const [biometricType, setBiometricType] = useState(null);
  const [authData, setAuthData] = useState(null);
  
  const dispatch = useDispatch();
  const [createPasscode] = useCreatePasscodeMutation();
  const [createToken] = useCreateTokenMutation();
  
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
  
  const isNewUser = useSelector((state) => state.auth.isNewUser);
  const isSetup = route.params?.setup ?? !hasStoredPasscode;
  const isLocked = lockedUntil && new Date(lockedUntil) > new Date();

  // Check and update token when component mounts or user profile changes
 useEffect(() => {
  const checkAndUpdateToken = async () => {
    if (!userId) return;

    try {
      const localToken = await getStoredPushToken();
      const serverToken = serverTokenData?.data?.token;

      if (localToken && localToken !== serverToken) {
        const response = await createToken({ userId, token: localToken }).unwrap();
        console.log('✅ Token update response:', response); 
      }
    } catch (error) {
      console.log(' Error:', JSON.stringify(error, null, 2));
    }
  };
  checkAndUpdateToken();
}, [userId, serverTokenData]);


  // Clear session function
    const clearSession = async () => {
      try {
        await removeData('@authData');
        await removeData('@passcode'); 
        dispatch(clearAuth());
        dispatch(clearPasscode());
      } catch (error) {
        console.error('Error clearing session:', error);
      }
    };


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

  useFocusEffect(
    useCallback(() => {
      refetch(); // force a query to the backend
    }, [])
  );
 useEffect(() => {
    const loadInitialData = async () => {
      const data = await getData('@authData');
      setAuthData(data);

      const savedPasscode = await getData('@passcode');
      if (savedPasscode) {
        setHasStoredPasscode(true);
        dispatch(setPasscode(savedPasscode));
      } else {
        setHasStoredPasscode(false);
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
    if (biometricEnabled && biometricAvailable && !isSetup && !isLocked) {
      handleBiometricAuth();
    }
  }, [biometricEnabled, biometricAvailable, isSetup, isLocked]);

  // Handle biometric authentication
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

  const handlePress = (value) => {
    if (isLocked) return;
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
    // Get passcode directly from AsyncStorage 
    const storedPasscode = await getData('@passcode');
    
    if (storedPasscode) {
      if (enteredPin === storedPasscode) {
        dispatch(resetAttempts());
        
        // Handle different scenarios based on why we came to PinCode
        if (route.params?.showBalance) {
          // Case 1: Came from balance viewing request
          if (route.params?.onSuccess) {
            await route.params.onSuccess(enteredPin);
          }
          navigation.goBack(); // Go back to HomeScreen
        } 
        else if (route.params?.onSuccess) {
          // Case 2: Came from other operations (like transfer confirmation)
          await route.params.onSuccess(enteredPin);
          navigation.replace('Main', { screen: 'Success' });
        } 
        else {
          // Case 3: Regular authentication flow
          navigation.replace('Main');
        }
      } else {
        // Incorrect PIN handling
        setError(t('pin.incorrectPin'));
        setPin('');
        dispatch(incrementAttempt());

        if (attempts + 1 >= 3) {
          const lockTime = new Date();
          lockTime.setMinutes(lockTime.getMinutes() + 5);
          dispatch(lockPasscode(lockTime.toISOString()));
          
          Alert.alert(
            t('pin.accountLocked'),
            t('pin.lockedFor5Minutes'),
            [
              { 
                text: t('common.ok'), 
                onPress: () => {
                  if (biometricAvailable) {
                    handleBiometricAuth();
                  }
                }
              }
            ]
          );
        }
      }
    } else {
      // New user setting up PIN for first time
      const result = await createPasscode({ passcode: enteredPin }).unwrap();
      if (result.status === 200) {
        await storeData('@passcode', enteredPin); 
        dispatch(setPasscode(enteredPin));
        dispatch(setIsNewUser(false));
        
        navigation.navigate('Main');
      } else {
        setError(t('pin.validationError'));
        setPin('');
      }
    }
  } catch (error) {
    console.log("Error:", error);
    showToast('error', t('errors.title'), error.data?.message || "compte supendu");
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

  const handleForgotPin = async () => {
  Alert.alert(
    t('pin.forgotPin'),
    t('pin.forgotPinMessage'),
    [
      {
        text: t('common.cancel'),
        style: 'cancel',
        onPress: () => console.log('Cancel pressed') // Optional logging
      },
      {
        text: t('common.signIn'),
        onPress: async () => {
          try {
            // Clear authentication data
            await removeData('@authData');
            await removeData('@passcode');
            
            // Update state
            setAuthData(null);
            
            // Navigate to sign in after a slight delay for better UX
            setTimeout(() => {
              navigation.navigate('SignIn', { 
                screen: 'Auth',
                params: { showForgotPinMessage: true }
              });
            });
            
          } catch (error) {
            console.error('Error clearing auth data:', error);
            Toast.show({
              type: 'error',
              text1: t('common.error'),
              text2: t('pin.clearDataError')
            });
          }
        }
      },
    ],
    { cancelable: false } // Prevent dismissing by tapping outside
  );
};

  // Get appropriate biometric icon
    const getBiometricIcon = () => {
    if (biometricType === 'face') {
      return require('../../Images/face-id.png');
    } else if (biometricType === 'fingerprint') {
      return require('../../Images/fingerprint.png');
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
            source={require('../../Images/LogoSendo.png')}
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
              <View key={rowIndex} style={{ flexDirection: 'row', marginVertical: 10, marginTop: 5, }}>
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

            <TouchableOpacity onPress={handleForgotPin} disabled={isLoading}>
              <Text style={{ color: '#999', marginTop: 50, marginBottom:50 }}>
                {t('pin.forgotPinQuestion')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default PinCode;