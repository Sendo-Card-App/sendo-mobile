import React from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Toast } from 'react-native-toast-message';

const TopLogo = require('../../images/TopLogo.png');

const PaymentStatus = ({ date, status }) => {
  const colorMap = {
    'Payé': 'text-green-500',
    'En attente': 'text-orange-500',
    'Manqué': 'text-red-500',
  };

  return (
    <View className="flex-row justify-between px-4 py-3 border-b border-gray-200">
      <Text className="text-black font-medium">{date}</Text>
      <Text className={`font-semibold ${colorMap[status]}`}>{status}</Text>
    </View>
  );
};

export default function MemberHistory({ navigation }) {
  const statuses = [
    'En attente', 'Payé', 'Payé', 'Payé', 'Payé', 'Manqué', 'Manqué', 'Payé', 'Payé', 'Payé'
  ];

  return (
    <View className="flex-1 bg-white pt-10">
      <Toast position="top" />

      <View className="flex-row mb-4 items-center justify-between px-4">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={26} color="#000" />
        </TouchableOpacity>
      </View>

      <View className="absolute top-[-48] left-0 right-0 items-center">
        <Image source={TopLogo} className="h-[130px] w-[160px]" resizeMode="contain" />
      </View>

      <View className="border border-dashed border-gray-300 mb-6" />

      <View className="bg-white px-4 py-4 mx-4 rounded-xl shadow border">
        <View className="flex-row items-center mb-4">
          <Image
            source={{ uri: 'https://via.placeholder.com/100' }} // Replace with actual image
            className="h-16 w-16 rounded-full mr-4"
          />
          <View className="flex-1">
            <Text className="text-black font-bold">Nom: Mireille Doe</Text>
            <Text className="text-gray-700">Adresse: Bonamoussadi</Text>
            <Text className="text-gray-700">Contact: 612-345-678</Text>
            <Text className="text-gray-700">Membre depuis: 02/10/2024</Text>
            <Text className="text-gray-700">Rôle: Membre</Text>
          </View>
        </View>
        <Text className="text-green-600 text-sm font-semibold px-2 py-1 border border-green-600 rounded-full self-start">Active</Text>
      </View>

      <View className="flex-row justify-around mt-6 border-b border-gray-200 pb-2">
        <Text className="text-green-600 font-semibold">Cotisations</Text>
        <Text className="text-gray-400">Pénalités</Text>
        <Text className="text-gray-400">Historique</Text>
      </View>

      <View className="flex-row justify-end px-4 mt-2 mb-1">
        <Text className="text-gray-500">Filtre</Text>
        <Ionicons name="filter" size={18} color="gray" className="ml-1" />
      </View>

      <ScrollView className="flex-1">
        {statuses.map((status, index) => (
          <PaymentStatus key={index} date="03/06/2025" status={status} />
        ))}
      </ScrollView>
    </View>
  );
}
