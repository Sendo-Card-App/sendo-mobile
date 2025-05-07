import React, { useState, useEffect } from 'react';
import { StatusBar, Platform, View, Text, TouchableOpacity, Image, SafeAreaView, Alert } from 'react-native';
import { useCreatePasscodeMutation } from '../../services/Auth/authAPI';
import { useSelector, useDispatch } from 'react-redux';
import { setPasscode as setLocalPasscode, toggleBiometric } from '../../features/Auth/passcodeSlice';
import { getData } from '../../services/storage';
import Loader from "../../components/Loader";
import * as LocalAuthentication from 'expo-local-authentication';

const PinCode = ({ navigation, route }) => {
  const [pin, setPin] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState('UTILISATEUR');
  const [isLoading, setIsLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  
  const isSetup = route.params?.setup || false;
  const dispatch = useDispatch();
  const [createPasscode] = useCreatePasscodeMutation();
  //const { passcode: currentPasscode, biometricEnabled } = useSelector(state => state.passcode);
  const currentPasscode = useSelector(state => state.passcode?.passcode);
  const biometricEnabled = useSelector(state => state.passcode?.biometricEnabled);

  // Load user data and check biometric availability
  useEffect(() => {
    const initialize = async () => {
      try {
        const userData = await getData('userData');
        if (userData?.name) {
          setUserName(userData.name);
        }

        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        setBiometricAvailable(hasHardware && isEnrolled);
      } catch (error) {
        console.error('Initialization error:', error);
      }
    };
    
    initialize();
  }, []);

  // Handle biometric authentication
  const handleBiometricAuth = async () => {
    if (!biometricAvailable) return;
    
    try {
      setIsLoading(true);
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authentifiez-vous pour continuer',
        disableDeviceFallback: true,
      });
      
      if (result.success) {
        navigation.navigate('Main');
      } else {
        Alert.alert(
          'Échec de l\'authentification',
          'Veuillez utiliser votre code PIN',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Biometric error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle PIN input
  useEffect(() => {
    if (pin.length === 4) {
      handleComplete(pin);
    }
  }, [pin]);

  const handlePress = (value) => {
    if (locked) return;
    
    if (value === 'del') {
      setPin(pin.slice(0, -1));
    } else if (pin.length < 4) {
      setPin(pin + value);
    }
  };

  
const handleComplete = async (enteredPin) => {
  setIsLoading(true);
  try {
    const result = await createPasscode({ 
      passcode: enteredPin,
      isSetup // This tells the API whether to use body or header
    }).unwrap();

    if (result.status === 200) {
      if (isSetup) {
        // Only store locally if we're setting up
        dispatch(setLocalPasscode(enteredPin));
      }
      navigation.navigate('Main');
    } else if (result.status === 400) {
      const errorMessage = isSetup 
        ? 'Erreur de validation' 
        : 'Code PIN incorrect';
      setError(errorMessage);
      
      if (!isSetup) {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts >= 3) {
          setLocked(true);
          Alert.alert(
            'Compte bloqué',
            'Trop de tentatives. Veuillez vous reconnecter.',
            [{ text: 'OK', onPress: () => navigation.navigate('Auth') }]
          );
        }
      }
    } else if (result.status === 500) {
      setError('Erreur serveur');
    }
  } catch (error) {
    console.log("Error:", error);
    setError('Une erreur est survenue');
    if (!isSetup) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      if (newAttempts >= 3) {
        setLocked(true);
        Alert.alert(
          'Compte bloqué',
          'Trop de tentatives. Veuillez vous reconnecter.',
          [{ text: 'OK', onPress: () => navigation.navigate('Auth') }]
        );
      }
    }
  } finally {
    setIsLoading(false);
  }
};

  // Toggle biometric authentication
  const toggleBiometricAuth = async () => {
    try {
      setIsLoading(true);
      if (!biometricEnabled) {
        // First verify with PIN before enabling biometric
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Vérifiez votre identité pour activer la biométrie',
        });
        
        if (result.success) {
          dispatch(toggleBiometric(true));
          Alert.alert('Succès', 'Biométrie activée');
        }
      } else {
        dispatch(toggleBiometric(false));
        Alert.alert('Information', 'Biométrie désactivée');
      }
    } catch (error) {
      console.error('Biometric toggle error:', error);
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

  const handleForgotPin = () => {
    Alert.alert(
      'Code PIN oublié',
      'Vous devez vous reconnecter pour réinitialiser votre code PIN',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Se reconnecter',
          onPress: () => navigation.navigate('SignIn'),
          style: 'default',
        },
      ]
    );
  };

  const keypad = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', 'del'],
  ];

  return (
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
          {/* Add the Loader component at the top level */}
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
              Salut, {userName.toUpperCase()}
            </Text>
            <Text style={{ fontSize: 16, color: '#0D1C6A', marginTop: 10 }}>
              {isSetup ? 'Définissez votre code PIN' : 'Entrez votre code PIN pour déverrouiller l\'application'}
            </Text>

            {renderDots()}
            
            {error && (
              <Text style={{ color: 'red', marginTop: 10 }}>{error}</Text>
            )}
            
            {locked && (
              <Text style={{ color: 'red', marginTop: 10 }}>
                Trop de tentatives. Compte bloqué.
              </Text>
            )}
          </View>

          <View style={{ alignItems: 'center' }}>
            {/* Biometric authentication button */}
            {!isSetup && biometricAvailable && (
              <TouchableOpacity 
                onPress={handleBiometricAuth}
                disabled={locked || isLoading}
                style={{
                  marginBottom: 20,
                  padding: 10,
                  borderRadius: 20,
                  backgroundColor: '#F1F1F1',
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#0D1C6A', marginLeft: 5 }}>
                  {Platform.OS === 'ios' ? 'Utiliser Face ID' : 'Utiliser empreinte digitale'}
                </Text>
              </TouchableOpacity>
            )}

            {keypad.map((row, rowIndex) => (
              <View key={rowIndex} style={{ flexDirection: 'row', marginVertical: 10 }}>
                {row.map((item, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => handlePress(item === 'del' ? 'del' : item)}
                    style={{
                      width: 60,
                      height: 60,
                      borderRadius: 30,
                      justifyContent: 'center',
                      alignItems: 'center',
                      marginHorizontal: 10,
                      backgroundColor: '#F1F1F1',
                      opacity: locked ? 0.5 : 1,
                    }}
                    disabled={locked || isLoading}
                  >
                    <Text style={{ fontSize: 20, color: '#0D1C6A' }}>
                      {item === 'del' ? '⌫' : item}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}

            <TouchableOpacity onPress={handleForgotPin} disabled={locked || isLoading}>
              <Text style={{ color: locked ? '#ccc' : '#999', marginTop: 20 }}>
                J'ai oublié mon code PIN ?
              </Text>
            </TouchableOpacity>
            <Text style={{ color: '#999', marginTop: 10 }}>Sendo v1.o.0</Text>
          </View>
        </View>
      </SafeAreaView>
 
    </>
  );
};

export default PinCode;