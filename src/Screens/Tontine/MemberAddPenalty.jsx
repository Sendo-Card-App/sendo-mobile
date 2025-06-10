import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Modal, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { Toast } from 'react-native-toast-message';

const TopLogo = require('../../Images/TopLogo.png');

export default function MembersPenalty({ navigation }) {
  const [motif, setMotif] = useState('Cotisation manqué');
  const [action, setAction] = useState('Amende');
  const [somme, setSomme] = useState('5000 xaf');
  const [note, setNote] = useState('Amende');
  const [deadline, setDeadline] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formatted = selectedDate.toLocaleDateString();
      setDeadline(formatted);
    }
  };

  const confirmForm = () => {
    Toast.show({
      type: 'success',
      text1: 'Enregistré avec succès',
    });
    // handle your form submit here
  };

  return (
    <View className="flex-1 bg-white pt-10">
      <Toast position="top" />

      {/* Header */}
      <View className="flex-row mb-4 items-center justify-between px-4">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={26} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Logo */}
      <View className="absolute top-[-48] left-0 right-0 items-center">
        <Image source={TopLogo} className="h-[130px] w-[160px]" resizeMode="contain" />
      </View>

      <View className="border border-dashed border-gray-300 mb-6" />

      {/* Form Card */}
      <View className="bg-white mx-4 px-4 py-6 rounded-2xl shadow border">
        {/* Motif */}
        <Text className="text-black font-semibold mb-1">Motif</Text>
        <View className="border border-gray-300 rounded-md mb-4">
          <Picker selectedValue={motif} onValueChange={(value) => setMotif(value)}>
            <Picker.Item label="Cotisation manqué" value="Cotisation manqué" />
            <Picker.Item label="Retard de paiement" value="Retard de paiement" />
          </Picker>
        </View>

        {/* Action */}
        <Text className="text-black font-semibold mb-1">Action</Text>
        <TextInput
          className="border border-gray-300 rounded-md px-4 py-2 mb-4"
          value={action}
          onChangeText={setAction}
        />

        {/* Somme */}
        <Text className="text-black font-semibold mb-1">Somme</Text>
        <TextInput
          className="border border-gray-300 rounded-md px-4 py-2 mb-4"
          value={somme}
          onChangeText={setSomme}
          keyboardType="numeric"
        />

        {/* Note */}
        <Text className="text-black font-semibold mb-1">Note</Text>
        <TextInput
          className="border border-gray-300 rounded-md px-4 py-2 mb-4"
          value={note}
          onChangeText={setNote}
        />

        {/* Délai */}
        <Text className="text-black font-semibold mb-1">Délai</Text>
        <TouchableOpacity
          className="border border-gray-300 rounded-md px-4 py-2 flex-row items-center justify-between mb-6"
          onPress={() => setShowDatePicker(true)}
        >
          <Text className="text-gray-700">{deadline || 'Sélectionner une date'}</Text>
          <Ionicons name="calendar-outline" size={20} color="gray" />
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={new Date()}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
          />
        )}

        {/* Buttons */}
        <TouchableOpacity
          className="bg-green-500 rounded-full py-3 mb-3"
          onPress={confirmForm}
        >
          <Text className="text-white text-center font-semibold">Confirmer</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="border border-red-500 rounded-full py-3"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-red-500 text-center font-semibold">Annuler</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
