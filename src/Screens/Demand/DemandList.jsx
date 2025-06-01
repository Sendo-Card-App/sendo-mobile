import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const TopLogo = require('../../Images/TopLogo.png'); // à adapter selon ton projet

const DemandList = () => {
  const navigation = useNavigation();

  const demandes = [
    { id: 1, title: 'Facture service', amount: '150,000 Xaf', status: 'En attente', name: 'Mr. Homer Jean' },
    { id: 2, title: 'Facture service', amount: '150,000 Xaf', status: 'Complété', name: 'Mr. Homer Jean' },
    { id: 3, title: 'Facture service', amount: '150,000 Xaf', status: 'En attente', name: 'Mr. Homer Jean' },
    { id: 4, title: 'Facture service', amount: '150,000 Xaf', status: 'Complété', name: 'Mr. Homer Jean' },
    { id: 5, title: 'Facture service', amount: '150,000 Xaf', status: 'Complété', name: 'Mr. Homer Jean' },
  ];

  return (
    <View className="flex-1 bg-[#0A0F1F] px-4 pt-10">
      {/* Menu Icon */}
      <View className="flex-row justify-end mb-4">
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Logo */}
      <View
        style={{
          position: 'absolute',
          top: -48,
          left: 0,
          right: 0,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Image source={TopLogo} style={{ height: 140, width: 160 }} resizeMode="contain" />
      </View>

      {/* Dotted Line */}
      <View className="border border-dashed border-gray-300 mb-4" />

      {/* Button */}
      <TouchableOpacity 
      onPress={() => navigation.navigate("CreateRequest")}
      className="bg-green-400 rounded-full py-3 items-center mt-6 mb-6">
        <Text className="text-white font-semibold">+ Créer une nouvelle demande</Text>
      </TouchableOpacity>

      {/* Tabs */}
      <View className="flex-row justify-between mb-4">
        <TouchableOpacity className="mr-4 border-b-2 border-white pb-1">
          <Text className="text-white font-bold">Historique</Text>
        </TouchableOpacity>
        <TouchableOpacity>
          <Text className="text-gray-400">Mes Demandes</Text>
        </TouchableOpacity>
       
      </View>
       <TouchableOpacity className="ml-auto">
          <View className="flex-row items-center">
            <Text className="text-white mr-1">Filtrer</Text>
            <Ionicons name="filter-outline" size={18} color="white" />
          </View>
        </TouchableOpacity>

      {/* Demandes List */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {demandes.map((item) => (
          <View key={item.id} className="bg-white rounded-xl p-4 mb-4">
            <Text className="text-black font-semibold">{item.title}</Text>
            <Text className="text-black">{item.amount}</Text>
            <Text className="text-gray-600">{item.name}</Text>

            <View className="absolute right-3 top-3">
              <View
                className={`px-3 py-1 rounded-full ${
                  item.status === 'Complété'
                    ? 'bg-green-100'
                    : 'bg-orange-100'
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    item.status === 'Complété'
                      ? 'text-green-500'
                      : 'text-orange-500'
                  }`}
                >
                  {item.status}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default DemandList;
