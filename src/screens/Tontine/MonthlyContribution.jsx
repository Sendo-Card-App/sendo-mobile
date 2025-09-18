import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Image,
  ScrollView
} from 'react-native';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { SelectList } from 'react-native-dropdown-select-list'; // ou ton composant personnalisé
import { useNavigation } from '@react-navigation/native';

const TopLogo = require('../../images/TopLogo.png');

const MonthlyContribution = () => {
  const navigation = useNavigation();
  const [week, setWeek] = useState('');
  const [day, setDay] = useState('');

  const weeks = [
    { key: '1', value: 'Premier' },
    { key: '2', value: 'Deuxieme' },
    { key: '3', value: 'Troisiemme' },
    { key: '4', value: 'Quatriemme' },
    { key: '5', value: 'Derniere' }
  ];

  const days = [
    { key: 'mon', value: 'Lundi' },
    { key: 'tue', value: 'Mardi' },
    { key: 'wed', value: 'Mercredi' },
    { key: 'thu', value: 'Jeudi' },
    { key: 'fri', value: 'Vendredi' },
    { key: 'sat', value: 'Samedi' },
    { key: 'sun', value: 'Dimanche' }
  ];

  return (
    <ScrollView className="flex-1 bg-[#0C121D] px-4 pt-20">
      {/* Header Menu + Logo */}
       <View className="flex-row mb-4 items-center justify-between px-4">
          <TouchableOpacity onPress={() => navigation.goBack()}>
             <AntDesign name="left" size={24} color="white" />
          </TouchableOpacity>
  
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <Ionicons name="menu-outline" size={26} color="#fff" />
          </TouchableOpacity>
        </View>

      <View style={{ position: 'absolute', top: -20, left: 0, right: 0, alignItems: 'center' }}>
        <Image source={TopLogo} style={{ height: 130, width: 160 }} resizeMode="contain" />
      </View>

      <View className="border border-dashed border-gray-300 mb-6" />

      {/* Titre */}
      <Text className="text-xl text-green-400 font-semibold text-center mb-6">
        Date de cotisation mensuel
      </Text>

      {/* Dropdowns */}
      <View className="flex-row justify-between mb-8">
        <View className="w-[48%] border border-green-500 rounded p-2">
          <SelectList
            setSelected={setWeek}
            data={weeks}
            placeholder="Premier"
            boxStyles={{ backgroundColor: 'transparent', borderWidth: 0 }}
            dropdownStyles={{ backgroundColor: '#0C121D', borderWidth: 0 }}
            dropdownTextStyles={{ color: 'white' }}
            inputStyles={{ color: 'white' }}
          />
        </View>

        <View className="w-[48%] border border-green-500 rounded p-2">
          <SelectList
            setSelected={setDay}
            data={days}
            placeholder="Lundi"
            boxStyles={{ backgroundColor: 'transparent', borderWidth: 0 }}
            dropdownStyles={{ backgroundColor: '#0C121D', borderWidth: 0 }}
            dropdownTextStyles={{ color: 'white' }}
            inputStyles={{ color: 'white' }}
          />
        </View>
      </View>

      {/* Suivant Button */}
      <TouchableOpacity
        onPress={() => navigation.navigate("Participant")}
        className="bg-green-400 py-3 rounded-full items-center"
      >
        <Text className="text-black font-semibold">Suivant</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default MonthlyContribution;
