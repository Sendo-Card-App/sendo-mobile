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

const Penalty = () => {
  const navigation = useNavigation();

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

      <View style={{ position: 'absolute', top: -55, left: 0, right: 0, alignItems: 'center' }}>
        <Image source={TopLogo} style={{ height: 120, width: 160 }} resizeMode="contain" />
      </View>

      <View className="border border-dashed border-gray-300 mb-6" />

      {/* Titre */}
      <Text className="text-xl text-green-400 font-semibold mb-6">
        6. Pénalités
      </Text>

      {/* Dropdowns */}
      <View className="flex-row justify-between mb-8">
        <View className="flex-row justify-between mb-8">
            <TouchableOpacity
               onPress={() => navigation.navigate("PenaltyScreen")}
                className="flex-row items-center justify-center border border-green-500 py-5 px-4 rounded-full"
                style={{ backgroundColor: '#0C121D' }}
            >
                <Ionicons name="add-circle-outline" size={20} color="#fff" className="mr-2" />
                <Text className="text-white text-center">Définir une nouvelle pénalité</Text>
            </TouchableOpacity>
            </View>
      </View>

      {/* Suivant Button */}
      <TouchableOpacity
        onPress={() => navigation.navigate("Participant")}
        className="bg-green-400 py-5 rounded-full items-center"
      >
        <Text className="text-black font-semibold">Suivant</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default Penalty;
