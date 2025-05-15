import React, { useState, useEffect } from 'react';
import { StatusBar, Platform, View, Text, TouchableOpacity, Image, SafeAreaView, Alert } from 'react-native';
import { useCreatePasscodeMutation } from '../../services/Auth/authAPI';
import { useSelector, useDispatch } from 'react-redux';
import { setPasscode, incrementAttempt, resetAttempts, lockPasscode, toggleBiometric, clearPasscode, setIsNewUser } from '../../features/Auth/passcodeSlice';
import { getData, clearStorage } from '../../services/storage'; // Updated import
import { useGetUserProfileQuery } from "../../services/Auth/authAPI";
import { clearAuth } from '../../features/Auth/authSlice'; // Add this import
import Loader from "../../components/Loader";
import Toast from 'react-native-toast-message';
import * as LocalAuthentication from 'expo-local-authentication';
import { useTranslation } from 'react-i18next'; // Add for translations

const PinCode = ({ navigation, route }) => {
  const { t } = useTranslation(); // Initialize translation
  const [pin, setPin] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  
  const dispatch = useDispatch();
  const [createPasscode] = useCreatePasscodeMutation();
  
  // Get state from Redux
  const {
    passcode: currentPasscode,
    attempts,
    lockedUntil,
    biometricEnabled
  } = useSelector(state => state.passcode);
  
  // Get user profile
  const { 
    data: userProfile, 
    isLoading: isProfileLoading, 
    error: profileError 
  } = useGetUserProfileQuery();
  
  const isNewUser = useSelector((state) => state.auth.isNewUser);
  const isSetup = route.params?.setup ?? !currentPasscode;
  const isLocked = lockedUntil && new Date(lockedUntil) > new Date();

  // Clear session function
  const clearSession = async () => {
    try {
      await clearStorage(); // Clear all storage
      dispatch(clearAuth()); // Clear auth state
      dispatch(clearPasscode()); // Clear passcode state
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
  // Check for biometric availability
  useEffect(() => {
    const checkBiometrics = async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(hasHardware && isEnrolled);
    };
    checkBiometrics();
  }, []);

  // Handle biometric authentication
  const handleBiometricAuth = async () => {
    try {
      const { success } = await LocalAuthentication.authenticateAsync({
        promptMessage: t('pin.biometricPrompt'),
        fallbackLabel: t('pin.usePinInstead')
      });
      if (success) {
        dispatch(resetAttempts());
        navigation.navigate('Main');
      }
    } catch (err) {
      setError(t('pin.biometricFailed'));
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
      if (currentPasscode) {
        if (enteredPin === currentPasscode) {
          dispatch(resetAttempts());
          navigation.navigate('Main');
        } else {
          setError(t('pin.incorrectPin'));
          setPin('');
          dispatch(incrementAttempt());
  
          if (attempts + 1 >= 3) {
            dispatch(lockPasscode());
            await clearSession(); // Clear session when locked out
            Alert.alert(
              t('pin.accountLocked'),
              t('pin.tooManyAttempts'),
              [
                { 
                  text: 'OK', 
                  onPress: () => navigation.navigate('SignIn') 
                }
              ]
            );
          }
        }
      } else {
        const result = await createPasscode({ passcode: enteredPin }).unwrap();
        if (result.status === 200) {
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
      setError(t('pin.generalError'));
      setPin('');
       showToast('error', t('errors.title'), t('pin.generalError'));
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
        },
        {
          text: t('common.signIn'),
          onPress: async () => {
            await clearSession(); // Clear session when forgetting PIN
            navigation.navigate('SignIn');
          },
          style: 'default',
        },
      ]
    );
  };

  // Updated keypad with biometric option
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
              borderRadius: 50,
            }}
          />

          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#0D1C6A' }}>
            {t('pin.greeting')}, {userProfile?.data?.firstname} {userProfile?.data?.lastname}
          </Text>
          <Text style={{ fontSize: 16, color: '#0D1C6A', marginTop: 10 }}>
            {isSetup ? t('pin.setupPin') : t('pin.enterPin')}
          </Text>

          {renderDots()}
          
          {error && (
            <Text style={{ color: 'red', marginTop: 10 }}>{error}</Text>
          )}
          
          {isLocked && (
            <Text style={{ color: 'red', marginTop: 10 }}>
              {t('pin.accountLocked')}
            </Text>
          )}
        </View>

        <View style={{ alignItems: 'center' }}>
          {keypad.map((row, rowIndex) => (
            <View key={rowIndex} style={{ flexDirection: 'row', marginVertical: 10 }}>
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
                      opacity: isLocked ? 0.5 : 1,
                    }}
                    disabled={isLocked || isLoading}
                  >
                    {item === 'biometric' ? (
                      <Image
                        source={
                          Platform.OS === 'ios' 
                            ? require('../../images/face-id.png')
                            : require('../../images/fingerprint.png')
                        }
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

          <TouchableOpacity onPress={handleForgotPin} disabled={isLocked || isLoading}>
            <Text style={{ color: isLocked ? '#ccc' : '#999', marginTop: 30 }}>
              {t('pin.forgotPinQuestion')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default PinCode;