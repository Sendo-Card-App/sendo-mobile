// components/PaymentConfirmationModal.js
import React from 'react';
import { View, Text, Modal, TouchableOpacity } from 'react-native';

const PaymentConfirmationModal = ({
  visible,
  onClose,
  onConfirm,
  amount,
  title,
  // on renomme les props internes pour coller à votre appel
  description,
  confirmLabel,
  cancelLabel = 'Annuler',
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50">
        <View className="bg-white rounded-lg p-5 w-80">
          <Text className="text-xl font-bold text-center mb-3">{title}</Text>
          
          <Text className="text-center mb-3">
            {/* on utilise description à la place de message */}
            {description}
          </Text>
          
          <Text className="text-center text-lg font-bold mb-5">
            Montant: {amount.toLocaleString()} FCFA
          </Text>
          
          <View className="flex-row justify-between">
            <TouchableOpacity
              className="px-5 py-2 border border-gray-300 rounded-lg"
              onPress={onClose}
            >
              <Text className="text-gray-700">{cancelLabel}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="px-5 py-2 bg-[#7ddd7d] rounded-lg"
              onPress={onConfirm}
            >
              <Text className="text-white">{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default PaymentConfirmationModal;
