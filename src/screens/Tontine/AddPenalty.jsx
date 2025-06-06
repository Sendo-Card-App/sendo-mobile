import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Image,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SelectList } from 'react-native-dropdown-select-list'; 
import { useNavigation } from '@react-navigation/native';

const TopLogo = require('../../images/TopLogo.png');

const AddPenality = () => {
  const navigation = useNavigation();
  const [week, setWeek] = useState('');
  const [day, setDay] = useState('');

 

  return (
    <ScrollView className="flex-1 bg-[#0C121D] px-4 pt-20">
      {/* Header Menu + Logo */}
      <View className="flex-row justify-end mb-4 items-center">
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
       . Penalites
      </Text>

      {/* Dropdowns */}
      <View className="flex-row justify-between mb-8">
         <TouchableOpacity
                  onPress={() => navigation.navigate("AddRecipients")}
                  style={{
                    alignSelf: "flex-end",
                    marginBottom: 10,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    backgroundColor: "#2B2F38",
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: "#7ddd7d", fontWeight: "bold" }}>
                    + {t("selectRecipient.add_manually")}
                  </Text>
                </TouchableOpacity>
      </View>

      {/* Suivant Button */}
      <TouchableOpacity
        onPress={() => console.log(`Selected: ${week}, ${day}`)}
        className="bg-green-400 py-3 rounded-full items-center"
      >
        <Text className="text-black font-semibold">Suivant</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default AddPenality;
