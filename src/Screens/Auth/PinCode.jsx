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
import Toast from 'react-native-toast-message';
import * as LocalAuthentication from 'expo-local-authentication';
import { useTranslation } from 'react-i18next';
import { getStoredPushToken } from '../../services/notificationService';
import { useGetTokenMutation, useCreateTokenMutation } from '../../services/Auth/authAPI';
import { useSendOtpMutation, useUpdatePasscodeMutation } from '../../services/Auth/authAPI';

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
  const [showResetModal, setShowResetModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [sendOtp] = useSendOtpMutation();
  const [updatePasscode] = useUpdatePasscodeMutation();


  const isNewUser = useSelector((state) => state.auth.isNewUser);
  const isSetup = route.params?.setup ?? !hasStoredPasscode;
  const isLocked = lockedUntil && new Date(lockedUntil) > new Date();

  useEffect(() => {
    const intervalId = setInterval(async () => {
      try {
        const result = await refetch(); // fetch latest user profile
        const profile = result?.data?.data;

        if (profile?.passcode) {
          setPasscodeExists(true);
        } else {
          setPasscodeExists(false);
        }
      } catch (error) {
        console.error('Failed to refetch user profile:', error);
      }
    }, 10000);

    // Clear interval on component unmount
    return () => clearInterval(intervalId);
  }, []);


  // Check and update token when component mounts or user profile changes
//  useEffect(() => {
//   const checkAndUpdateToken = async () => {
//     if (!userId) return;

//     try {
//       const localToken = await getStoredPushToken();
//       const serverToken = serverTokenData?.data?.token;

//       if (localToken && localToken !== serverToken) {
//         const response = await createToken({ userId, token: localToken }).unwrap();
//         console.log('✅ Token update response:', response); 
//       }
//     } catch (error) {
//       console.log(' Error:', JSON.stringify(error, null, 2));
//     }
//   };
//   checkAndUpdateToken();
// }, [userId, serverTokenData]);
  


  // Clear session function
    
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
    const storedPasscode = await getData('@passcode');
    if (storedPasscode) {
      if (enteredPin === storedPasscode) {
        dispatch(resetAttempts());

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
      } else {
        const newAttempts = attempts + 1;
        dispatch(incrementAttempt());

        if (newAttempts >= 3) {
          const lockTime = new Date();
          lockTime.setMinutes(lockTime.getMinutes() + 5);
          dispatch(lockPasscode(lockTime.toISOString()));

          try {
            await sendOtp({ email: userProfile?.data?.phone });
            showToast('info', t('pin.otpSentTitle'), t('pin.otpSentMessage'));
            setShowResetModal(true);
          } catch (err) {
            showToast('error', t('errors.title'), t('pin.otpSendFailed'));
          }
        } else {
          setError(t('pin.incorrectPin'));
          setPin('');
        }
        return;
      }
    } else {
      // Setup phase or pin not stored locally
      if (userProfile?.data?.passcode) {
        if (enteredPin === userProfile?.data?.passcode) {
          await storeData('@passcode', enteredPin);
          dispatch(setPasscode(enteredPin));
          navigation.navigate('Main');
        } else {
          setError(t('pin.incorrectPin'));
          setPin('');
        }
      } else {
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
    }
  } catch (error) {
    console.log('Error:', error);
    showToast('error', t('errors.title'), error.data?.message || 'Compte suspendu');
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
            onPress: () => console.log('Cancel pressed')
          },
          {
            text: t('pin.sendOtp'),
            onPress: async () => {
              try {
               await sendOtp({ phone: userProfile?.data?.phone });
                showToast('info', t('pin.otpSentTitle'), t('pin.otpSentMessage'));
                setShowResetModal(true); // show the modal for user to enter OTP and new passcode
              } catch (error) {
                console.log('❌ OTP send error:', JSON.stringify(error, null, 2));
                showToast('error', t('errors.title'), t('pin.otpSendFailed'));
              }
            }
          },
        ],
        { cancelable: false }
      );
    };

  // Get appropriate biometric icon
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
     <Modal 
  isVisible={showResetModal} 
  backdropOpacity={0.5}
  style={{ margin: 0, justifyContent: 'flex-start' }} // Align to top
>
  <SafeAreaView style={{ flex: 1 }}>
    <ScrollView 
      contentContainerStyle={{ 
        padding: 20,
        paddingTop: 50, // Add extra padding at top
        backgroundColor: 'white',
        borderRadius: 10,
      }}
      keyboardShouldPersistTaps="handled" // Allows tapping buttons when keyboard is open
    >
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 20 }}>
        {t('pin.resetPasscode')}
      </Text>

      <Text style={{ marginBottom: 5, color: '#555' }}>
        {t('pin.enterOtp')}
      </Text>
      <TextInput
        placeholder={t('pin.enterOtp')}
        value={otpCode}
        onChangeText={setOtpCode}
        keyboardType="numeric"
        maxLength={6}
        style={{
          borderColor: '#ccc',
          borderWidth: 1,
          borderRadius: 8,
          padding: 10,
          marginBottom: 15,
        }}
      />

      <Text style={{ marginBottom: 5, color: '#555' }}>
        {t('pin.enterNewPin')}
      </Text>
      <TextInput
        placeholder={t('pin.enterNewPin')}
        value={newPasscode}
        onChangeText={setNewPasscode}
        secureTextEntry
        keyboardType="numeric"
        maxLength={4}
        style={{
          borderColor: '#ccc',
          borderWidth: 1,
          borderRadius: 8,
          padding: 10,
          marginBottom: 25, // Increased margin
          color: '#000',
          backgroundColor: '#fff'
        }}
      />

      <View style={{ marginBottom: 20 }}> {/* Added container for buttons */}
        <TouchableOpacity
          onPress={async () => {
            try {
              if (newPasscode.length !== 4 || otpCode.length !== 6) {
                showToast('error', t('errors.title'), t('pin.invalidInputs'));
                return;
              }

              const res = await updatePasscode({
                passcode: newPasscode,
                code: otpCode,
              }).unwrap();
              console.log(res)
              if (res.status === 200) {
                await storeData('@passcode', newPasscode);
                dispatch(setPasscode(newPasscode));
                dispatch(resetAttempts());
                setShowResetModal(false);
                setOtpCode('');
                setNewPasscode('');
                showToast('success', t('pin.successTitle'), t('pin.resetSuccess'));
                navigation.navigate('Main');
              } else {
                showToast('error', t('errors.title'), t('pin.resetFailed'));
              }
            } catch (err) {
              showToast('error', t('errors.title'), err?.data?.message || t('pin.resetFailed'));
            }
          }}
          style={{
            backgroundColor: '#7ddd7d',
            padding: 15, // Increased padding
            borderRadius: 8,
            alignItems: 'center',
            marginBottom: 15, // Added margin between buttons
          }}
        >
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
            {t('pin.confirmReset')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setShowResetModal(false)}
          style={{
            padding: 15,
            borderRadius: 8,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: '#ccc',
          }}
        >
          <Text style={{ color: 'red', fontWeight: 'bold', fontSize: 16 }}>
            {t('common.cancel')}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  </SafeAreaView>
</Modal>

    </SafeAreaView>
  );
};

export default PinCode;