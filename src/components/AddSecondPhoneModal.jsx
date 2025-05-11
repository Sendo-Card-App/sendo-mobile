// components/AddSecondPhoneModal.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal } from 'react-native';

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

  const handleSendOtp = async () => {
    try {
      await onSendOtp(phone);
      setOtpSent(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerify = async () => {
    try {
      await onVerifyOtp({ phone, code });
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        backgroundColor: 'rgba(0,0,0,0.5)' 
      }}>
        <View style={{ 
          backgroundColor: 'white', 
          margin: 20, 
          padding: 20, 
          borderRadius: 10 
        }}>
          {!otpSent ? (
            <>
              <Text style={{ fontSize: 18, marginBottom: 10 }}>
                Add Second Phone Number
              </Text>
              <TextInput
                placeholder="Enter phone number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                style={{ 
                  borderWidth: 1, 
                  borderColor: '#ccc', 
                  padding: 10, 
                  marginBottom: 10 
                }}
              />
              <TouchableOpacity
                onPress={handleSendOtp}
                style={{ 
                  backgroundColor: '#7ddd7d', 
                  padding: 10, 
                  borderRadius: 5,
                  alignItems: 'center'
                }}
                disabled={isLoading}
              >
                <Text style={{ color: 'white' }}>
                  {isLoading ? 'Sending...' : 'Send OTP'}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={{ fontSize: 18, marginBottom: 10 }}>
                Enter OTP sent to {phone}
              </Text>
              <TextInput
                placeholder="Enter 6-digit OTP"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={6}
                style={{ 
                  borderWidth: 1, 
                  borderColor: '#ccc', 
                  padding: 10, 
                  marginBottom: 10 
                }}
              />
              <TouchableOpacity
                onPress={handleVerify}
                style={{ 
                  backgroundColor: '#7ddd7d', 
                  padding: 10, 
                  borderRadius: 5,
                  alignItems: 'center'
                }}
                disabled={isLoading}
              >
                <Text style={{ color: 'white' }}>
                  {isLoading ? 'Verifying...' : 'Verify OTP'}
                </Text>
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity
            onPress={onClose}
            style={{ 
              marginTop: 10,
              padding: 10,
              alignItems: 'center'
            }}
          >
            <Text style={{ color: 'red' }}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default AddSecondPhoneModal;