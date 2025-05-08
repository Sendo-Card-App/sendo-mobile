// components/PinVerificationModal.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';

const PinVerificationModal = ({ 
  visible, 
  onClose, 
  onVerify, 
  title = "Enter Your PIN",
  subtitle = "Please enter your 4-digit PIN to confirm the transaction"
}) => {
  const [pin, setPin] = useState('');

  const handlePinInput = (value) => {
    if (value === 'del') {
      setPin(pin.slice(0, -1));
    } else if (pin.length < 4) {
      setPin(pin + value);
    }
  };

  const handleVerify = () => {
    if (pin.length === 4) {
      onVerify(pin);
      setPin('');
    }
  };

  const renderPinDots = () => {
    return (
      <View style={styles.pinDotsContainer}>
        {[0, 1, 2, 3].map((i) => (
          <View 
            key={i} 
            style={[
              styles.pinDot,
              i < pin.length ? styles.pinDotFilled : null
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Text style={styles.modalSubtitle}>{subtitle}</Text>
          
          {renderPinDots()}
          
          <View style={styles.keypad}>
            {[
              ['1', '2', '3'],
              ['4', '5', '6'],
              ['7', '8', '9'],
              ['.', '0', 'del']
            ].map((row, rowIndex) => (
              <View key={rowIndex} style={styles.keypadRow}>
                {row.map((key, keyIndex) => (
                  <TouchableOpacity
                    key={keyIndex}
                    style={styles.keypadButton}
                    onPress={() => handlePinInput(key)}
                    disabled={key === ''}
                  >
                    <Text style={styles.keypadText}>
                      {key === 'del' ? '⌫' : key}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
          
          <View style={styles.modalButtons}>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={handleVerify}
              disabled={pin.length !== 4}
            >
              <Text style={styles.confirmButtonText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#0D1C6A',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
  pinDotsContainer: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  pinDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#0D1C6A',
    marginHorizontal: 10,
  },
  pinDotFilled: {
    backgroundColor: '#0D1C6A',
  },
  keypad: {
    width: '100%',
    marginBottom: 20,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  keypadButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F1F1',
  },
  keypadText: {
    fontSize: 24,
    color: '#0D1C6A',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    padding: 15,
    borderRadius: 10,
    width: '48%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F1F1F1',
  },
  confirmButton: {
    backgroundColor: '#7ddd7d',
  },
  cancelButtonText: {
    color: '#0D1C6A',
    fontWeight: 'bold',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default PinVerificationModal;