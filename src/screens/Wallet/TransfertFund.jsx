import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';

const TransfertFund = ({ navigation }) => {
  const [amount, setAmount] = useState('0.0');
  const [reason, setReason] = useState('');
  const textInputRef = useRef(null);

  const handleNumberPress = (num) => {
    if (num === '✗') {
      setAmount(prev => prev.length > 1 ? prev.slice(0, -1) : '0.0');
    } else if (num === '.') {
      if (!amount.includes('.')) {
        setAmount(prev => prev + '.');
      }
    } else {
      setAmount(prev => prev === '0.0' ? num : prev + num);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', paddingTop: StatusBar.currentHeight }}>
      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        {/* Transfer Section */}
        <Text style={{ 
          fontSize: 18, 
          color: '#666',
          marginTop: 30,
          textAlign: 'center',
          marginBottom: 10
        }}>
          Transfert vers
        </Text>
        
        <TouchableOpacity 
          onPress={() => {
            textInputRef.current?.focus();
          }}
        >
          <Text style={{ 
            fontSize: 36, 
            fontWeight: 'bold',
            alignItems: 'center',
            textAlign: 'center',
            color: '#0D1C6A',
            marginBottom: 20
          }}>
            {amount}
          </Text>
        </TouchableOpacity>

        {/* Hidden TextInput that will trigger the number pad */}
        <TextInput
          ref={textInputRef}
          style={{ height: 0, width: 0 }}
          keyboardType="numeric"
          value={amount}
          onChangeText={(text) => {
            // Only allow numbers and one decimal point
            const formattedText = text.replace(/[^0-9.]/g, '');
            const parts = formattedText.split('.');
            if (parts.length <= 2) {
              setAmount(formattedText);
            }
          }}
        />

        {/* Rest of your component remains the same */}
        {/* Fee Section */}
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 30
        }}>
          <Text style={{ 
            fontSize: 16, 
            color: '#666',
            marginRight: 10
          }}>
            Frais : Gratuit
          </Text>
          <TouchableOpacity>
            <Text style={{ 
              fontSize: 16, 
              color: '#0D1C6A',
              textDecorationLine: 'underline'
            }}>
              Détails
            </Text>
          </TouchableOpacity>
        </View>

        {/* Reason Input */}
        <TextInput
          style={{ 
            borderWidth: 1,
            borderColor: '#E0E0E0',
            borderRadius: 10,
            paddingHorizontal: 15,
            paddingVertical: 10,
            fontSize: 16,
            color: '#000',
            marginBottom: 40
          }}
          value={reason}
          onChangeText={setReason}
          placeholder=" Indiquer un motif. Exemple : pour un ami."
        />

        {/* Continue Button */}
        <TouchableOpacity
          style={{ 
            backgroundColor: '#7ddd7d',
            paddingVertical: 15,
            borderRadius: 10,
            alignItems: 'center',
            marginTop: 20,
            marginBottom: 20
          }}
          onPress={() => navigation.navigate('WalletTransfer')}
        >
          <Text style={{ 
            color: '#fff', 
            fontSize: 18,
            fontWeight: 'bold'
          }}>
            Continuer
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default TransfertFund;