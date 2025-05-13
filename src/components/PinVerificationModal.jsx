import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, SafeAreaView, StatusBar, Platform, Modal } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

const PinVerificationUI = ({ 
  visible,
  onClose,
  onVerify,
  title = "Enter Your PIN",
  subtitle = "Please enter your 4-digit PIN to confirm the transaction",
  isLocked = false,
  maxAttempts = 3 // Default to 3 attempts
}) => {
  const [pin, setPin] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [showError, setShowError] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  // Check for biometric authentication availability
  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricAvailable(compatible && enrolled);
  };

  const handleBiometricAuth = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to verify your identity',
        disableDeviceFallback: true,
      });

      if (result.success) {
        onVerify('biometric_success');
      }
    } catch (error) {
      console.log('Biometric authentication error:', error);
    }
  };

  // Auto-verify when 4 digits are entered
  useEffect(() => {
    if (pin.length === 4) {
      const isValid = onVerify(pin); // Assume onVerify returns boolean
      if (!isValid) {
        setAttempts(prev => prev + 1);
        setShowError(true);
        setTimeout(() => {
          setPin('');
          setShowError(false);
        }, 500); // Clear pin after showing error briefly
      }
    }
  }, [pin]);

  const handlePress = (value) => {
    if (isLocked) return;
    if (value === 'del') {
      setPin(pin.slice(0, -1));
    } else if (value === 'bio') {
      handleBiometricAuth();
    } else if (pin.length < 4) {
      setPin(pin + value);
    }
  };

  const renderDots = () => (
    <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 20 }}>
      {[...Array(4)].map((_, index) => (
        <View
          key={index}
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            marginHorizontal: 10,
            backgroundColor: index < pin.length ? 
              (showError ? 'red' : '#0D1C6A') : '#ccc',
          }}
        />
      ))}
    </View>
  );

  const keypad = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    [biometricAvailable ? 'bio' : '.', '0', 'del'],
  ];

  if (attempts >= maxAttempts) {
    return (
      <Modal
        visible={visible}
        transparent={true}
        animationType="slide"
        onRequestClose={onClose}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
          <View style={{ padding: 20, flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: 'white', borderRadius: 10, padding: 20, width: '90%', alignItems: 'center' }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#0D1C6A', marginBottom: 10 }}>
                Account Locked
              </Text>
              <Text style={{ fontSize: 16, color: '#0D1C6A', marginBottom: 30, textAlign: 'center' }}>
                Too many failed attempts. Please try again later.
              </Text>
              <TouchableOpacity
                style={{
                  backgroundColor: '#F1F1F1',
                  padding: 15,
                  borderRadius: 10,
                  width: '100%',
                  alignItems: 'center',
                }}
                onPress={onClose}
              >
                <Text style={{ color: '#0D1C6A', fontWeight: 'bold' }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
        <View style={{ padding: 20, flex: 1, justifyContent: 'center' }}>
          <View style={{ backgroundColor: 'white', borderRadius: 10, padding: 20 }}>
            {/* Header Section */}
            <View style={{ alignItems: 'center' }}>
              <Image
                source={require('../../src/images/LogoSendo.png')}
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  marginBottom: 20,
                }}
              />

              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#0D1C6A' }}>
                {title}
              </Text>
              <Text style={{ fontSize: 14, color: '#666', marginTop: 10, textAlign: 'center' }}>
                {subtitle}
              </Text>
              {showError && (
                <Text style={{ color: 'red', marginTop: 5 }}>
                  Incorrect PIN. {maxAttempts - attempts} attempts remaining.
                </Text>
              )}

              {renderDots()}
            </View>

            {/* Keypad Section */}
            <View style={{ alignItems: 'center', marginTop: 20 }}>
              {keypad.map((row, rowIndex) => (
                <View key={rowIndex} style={{ flexDirection: 'row', marginVertical: 10 }}>
                  {row.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handlePress(item)}
                      style={{
                        width: 70,
                        height: 70,
                        borderRadius: 35,
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginHorizontal: 10,
                        backgroundColor: item === 'bio' ? '#F1F1F1' : '#F1F1F1',
                      }}
                    >
                      {item === 'del' ? (
                        <Text style={{ fontSize: 24, color: '#0D1C6A' }}>⌫</Text>
                      ) : item === 'bio' ? (
                        <Image
                          source={require('../../src/images/face-id.png')} // Add your biometric icon
                          style={{ width: 30, height: 30 }}
                        />
                      ) : (
                        <Text style={{ fontSize: 24, color: '#0D1C6A' }}>{item}</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              ))}
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

export default PinVerificationUI;