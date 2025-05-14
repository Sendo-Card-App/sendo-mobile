import React, { useState, useEffect } from "react";
import { Modal, View, Text, TextInput, TouchableOpacity } from 'react-native';
import Loader from './Loader';
import { useTranslation } from 'react-i18next';

const OtpVerificationModal = ({ visible, onClose, onVerify, target, onResend }) => {
  const [otp, setOtp] = useState('');
  const [isResending, setIsResending] = useState(false);
  const { t } = useTranslation();

  const handleResend = async () => {
    setIsResending(true);
    try {
      await onResend();
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View className="flex-1 bg-black bg-opacity-50 justify-center items-center p-6">
        <View className="bg-white p-6 rounded-xl w-full">
          <Text className="text-lg font-bold mb-4">{t('otpModal.title')}</Text>
          <Text className="mb-4">{t('otpModal.instructions', { target })}</Text>
          
          <TextInput
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            className="border p-3 rounded-lg text-center text-lg mb-4"
          />
          
          <TouchableOpacity 
            onPress={() => onVerify(otp)}
            className="bg-green-500 p-3 rounded-lg items-center mb-2"
          >
            <Text className="text-white font-bold">{t('otpModal.verifyButton')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={handleResend}
            disabled={isResending}
            className="items-center p-2"
          >
            {isResending ? (
              <Loader small />
            ) : (
              <Text className="text-blue-500">{t('otpModal.resendButton')}</Text>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={onClose}
            className="items-center p-2 mt-2"
          >
            <Text className="text-red-500">{t('otpModal.cancelButton')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default OtpVerificationModal;