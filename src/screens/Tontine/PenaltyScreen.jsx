import React, { useState } from 'react';
import { View, Text, TextInput, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TopLogo = require('../../images/TopLogo.png');

const App = ({ navigation }) => {
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View className="flex-1 justify-center items-center bg-gray-900 px-4">

      {/* Header Menu + Logo */}
      <View className="flex-row items-center justify-between w-full mb-4 ">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Top Logo */}
      <View style={{ position: 'absolute', top: -20, left: 0, right: 0, alignItems: 'center' }}>
        <Image source={TopLogo} style={{ height: 120, width: 160 }} resizeMode="contain" />
      </View>

      {/* Dashed Divider */}
      <View className="border border-dashed border-gray-300 w-full mb-6" />

      {/* Modal Container */}
      <View className="bg-white rounded-lg p-5 w-[90%] shadow-md">
        <Text className="text-lg font-semibold mb-2">6. Pénalités</Text>

        <Text className="text-sm font-medium text-gray-700 mb-1">Condition</Text>
        <View className="mb-3">
          <TextInput
            className="border border-gray-300 rounded px-3 py-2"
            placeholder="Cotisation manqué"
          />
        </View>

        <Text className="text-sm font-medium text-gray-700 mb-1">Action</Text>
        <View className="mb-3">
          <TextInput
            className="border border-gray-300 rounded px-3 py-2"
            placeholder="Amende"
          />
        </View>

        <Text className="text-sm font-medium text-gray-700 mb-1">Somme</Text>
        <TextInput
          className="border border-gray-300 rounded px-3 py-2 mb-4"
          value="5,000 xaf"
          editable={false}
        />

        <View className="flex-row justify-between">
          <TouchableOpacity
            className="bg-green-500 px-4 py-2 rounded"
            onPress={() => setModalVisible(false)}
          >
            <Text className="text-white text-center">Confirmer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-red-500 px-4 py-2 rounded"
            onPress={() => setModalVisible(false)}
          >
            <Text className="text-white text-center">Annuler</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default App;
