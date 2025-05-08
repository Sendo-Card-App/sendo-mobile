import React, { useState } from 'react';
import { StatusBar, Platform } from 'react-native';
import { View, Text, TouchableOpacity, Image, SafeAreaView } from 'react-native';

const PinCode = () => {
  const [pin, setPin] = useState('');

  const handlePress = (value) => {
    if (value === 'del') {
      setPin(pin.slice(0, -1));
    } else if (pin.length < 4) {
      setPin(pin + value);
    }
  };

  const renderDots = () => {
    return (
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 20 }}>
        {[...Array(4)].map((_, index) => (
          <View
            key={index}
            style={{
              width: 13,
              height: 12,
              borderRadius: 6,
              marginHorizontal: 10,
              backgroundColor: index < pin.length ? '#000' : '#ccc',
            }}
          />
        ))}
      </View>
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

      <View style={{ padding: 20, flex: 1, justifyContent: 'space-between' }}>
        <View style={{ alignItems: 'center' }}>
          <TouchableOpacity style={{ alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: '#0D1C6A', fontSize: 16, marginRight: 5 }}>🎧 Nous contacter</Text>
          </TouchableOpacity>

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

          <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#0D1C6A' }}>Salut, MIGUEL JUNIOR</Text>
          <Text style={{ fontSize: 16, color: '#0D1C6A', marginTop: 10 }}>
            Entrez votre code PIN pour déverrouiller l'application
          </Text>

          {renderDots()}
        </View>

        <View style={{ alignItems: 'center' }}>
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
                  }}
                >
                  <Text style={{ fontSize: 20, color: '#0D1C6A' }}>{item === 'del' ? '⌫' : item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}

          <TouchableOpacity>
            <Text style={{ color: '#999', marginTop: 20 }}>J'ai oublié mon code PIN ?</Text>
          </TouchableOpacity>

          <Text style={{ color: '#999', marginTop: 10 }}>Sendo v1.o.0</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default PinCode;
