import React, { useState, useEffect } from 'react';
import { StatusBar, Platform, View, Text, TouchableOpacity, Image, SafeAreaView, Alert } from 'react-native';
import { useCreatePasscodeMutation } from '../../services/Auth/authAPI';
import { useSelector, useDispatch } from 'react-redux';
import { setPasscode, incrementAttempt, resetAttempts, lockPasscode, toggleBiometric, clearPasscode,setIsNewUser } from '../../features/Auth/passcodeSlice';
import { getData } from '../../services/storage';
import { useGetUserProfileQuery } from "../../services/Auth/authAPI";
import Loader from "../../components/Loader";
import * as LocalAuthentication from 'expo-local-authentication';

const PinCode = ({ navigation, route }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState('UTILISATEUR');
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
  
  const accessToken = useSelector(state => state.auth.accessToken);
  const isNewUser = useSelector((state) => state.auth.isNewUser);
  const isSetup = route.params?.setup ?? !currentPasscode; // Changed to check if passcode exists
  const isLocked = lockedUntil && new Date(lockedUntil) > new Date();
  
  // Handle biometric authentication
  const handleBiometricAuth = async () => {
    try {
      const { success } = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Vérification biométrique requise',
        fallbackLabel: 'Utiliser le code PIN'
      });
      if (success) navigation.navigate('Main');
    } catch (err) {
      setError('Échec de l\'authentification biométrique');
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
    } else if (pin.length < 4) {
      setPin(pin + value);
    }
  };

  const handleComplete = async (enteredPin) => {
    setIsLoading(true);
    try {
      // Si un code PIN existe déjà 
      if (currentPasscode) {
        if (enteredPin === currentPasscode) {
          dispatch(resetAttempts());
          navigation.navigate('Main');
        } else {
          dispatch(incrementAttempt());
          setError('Code PIN incorrect');
  
          if (attempts + 1 >= 3) {
            dispatch(lockPasscode());
            dispatch(clearPasscode()); // Supprime le PIN
            Alert.alert(
              'Compte bloqué',
              'Trop de tentatives. Veuillez vous reconnecter.',
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
        // Sinon => Création du PIN
        const result = await createPasscode({ 
          passcode: enteredPin
        }).unwrap();
  
        if (result.status === 200) {
          dispatch(setPasscode(enteredPin));
          dispatch(setIsNewUser(false));
          navigation.navigate('Main');
        } else {
          setError('Erreur de validation');
        }
      }
    } catch (error) {
      console.log("Error:", error);
      setError('Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Helper function for failed attempts
  const handleFailedAttempt = () => {
    dispatch(incrementAttempt());
    setError('Incorrect PIN');
  
    if (attempts + 1 >= 3) {
      dispatch(lockPasscode());
      dispatch(clearPasscode());
      Alert.alert(
        'Account Locked',
        'Too many attempts. Please sign in again.',
        [{ text: 'OK', onPress: () => navigation.navigate('SignIn') }]
      );
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
            Salut, {userProfile?.data?.firstname}  {userProfile?.data?.lastname}
          </Text>
          <Text style={{ fontSize: 16, color: '#0D1C6A', marginTop: 10 }}>
            {isSetup ? 'Définissez votre code PIN' : 'Entrez votre code PIN pour déverrouiller l\'application'}
          </Text>

          {renderDots()}
          
          {error && (
            <Text style={{ color: 'red', marginTop: 10 }}>{error}</Text>
          )}
          
          {isLocked && (
            <Text style={{ color: 'red', marginTop: 10 }}>
              Trop de tentatives. Compte bloqué.
            </Text>
          )}
        </View>

        <View style={{ alignItems: 'center' }}>
          {!isSetup && biometricAvailable && (
            <TouchableOpacity 
              onPress={handleBiometricAuth}
              disabled={isLocked || isLoading}
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
                  <Text style={{ fontSize: 20, color: '#0D1C6A' }}>
                    {item === 'del' ? '⌫' : item}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}

          <TouchableOpacity onPress={handleForgotPin} disabled={isLocked || isLoading}>
            <Text style={{ color: isLocked ? '#ccc' : '#999', marginTop: 30 }}>
              J'ai oublié mon code PIN ?
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default PinCode;