import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  SafeAreaView, StatusBar, Modal, FlatList
} from 'react-native';
import { AntDesign } from '@expo/vector-icons';

const COUNTRY_CODES = [
  { code: '+237', label: '🇨🇲 CM' },
  { code: '+1', label: '🇨🇦 CA' },
  { code: '+33', label: '🇫🇷 FR' },
  // Add more if needed
];

const AddContact = ({ navigation }) => {
  const [selectedCode, setSelectedCode] = useState('+237');
  const [selectLabel, setSelectLabel] = useState('🇨🇲 CM');
  const [showModal, setShowModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [contactName, setContactName] = useState('');
  const [showRecommendation, setShowRecommendation] = useState(true);

  const handleSelectCode = (code) => {
    setSelectedCode(code);
    setSelectLabel(code.label);
    setShowModal(false);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', paddingTop: StatusBar.currentHeight }}>
      <View style={{ flex: 1, paddingHorizontal: 20 }}>

        {/* Phone Number Input */}
        <Text style={{ color: '#999', fontSize: 16, marginTop: 30, marginBottom: 10 }}>
          Numéro de mobile
        </Text>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: '#E0E0E0',
          borderRadius: 10,
          paddingHorizontal: 15,
          paddingVertical: 10,
          marginBottom: 20,
        }}>
          <TouchableOpacity
            onPress={() => setShowModal(true)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginRight: 10,
            }}
          >
            <Text style={{ fontSize: 16, color: '#000', marginRight: 5 }}>{selectedCode}</Text>
            <AntDesign name="down" size={14} color="#666" />
          </TouchableOpacity>
          <View style={{ height: '100%', width: 1, backgroundColor: '#E0E0E0', marginHorizontal: 10 }} />
          <TextInput
            style={{ flex: 1, fontSize: 16, color: '#000' }}
            placeholder="Numéro de téléphone"
            keyboardType="phone-pad"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
          />
        </View>

        {/* Country Code Modal */}
        <Modal visible={showModal} transparent animationType="slide">
          <TouchableOpacity
            onPress={() => setShowModal(false)}
            style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center' }}
          >
            <View style={{
              marginHorizontal: 40,
              backgroundColor: '#fff',
              borderRadius: 10,
              paddingVertical: 10,
              paddingHorizontal: 20,
              maxHeight: 300,
            }}>
              <FlatList
                data={COUNTRY_CODES}
                keyExtractor={(item) => item.code}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={{ paddingVertical: 10 }}
                    onPress={() => handleSelectCode(item.code)}
                  >
                    <Text style={{ fontSize: 16 }}>{item.label} {item.code}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Recommendation */}
        {showRecommendation && (
          <Text style={{ color: '#666', fontSize: 14, marginBottom: 30 }}>
            1. Nous vous recommandons d'utiliser un numéro MoMo/OM
          </Text>
        )}

        {/* Contact Name Input */}
        <Text style={{ color: '#999', fontSize: 16, marginBottom: 5 }}>
          Ajouter un nom ou une étiquette à ce numéro
        </Text>
        <Text style={{ color: '#999', fontSize: 14, marginBottom: 10, fontStyle: 'italic' }}>
          [Eg: Nandi]
        </Text>
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
          value={contactName}
          onChangeText={setContactName}
          placeholder="Nom du contact"
        />

        {/* Save Button */}
        <TouchableOpacity
          style={{
            backgroundColor: '#7ddd7d',
            paddingVertical: 15,
            borderRadius: 10,
            alignItems: 'center',
          }}
          onPress={() => navigation.navigate("TransfertFund")}
        >
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
            Enregistrer
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default AddContact;
