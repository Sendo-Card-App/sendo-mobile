import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  SafeAreaView,
  StatusBar,
} from 'react-native';

const AddBeneficiary = ({navigation}) => {
  const [search, setSearch] = useState('');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', paddingTop: StatusBar.currentHeight || 20 }}>
      <View style={{ flex: 1, paddingHorizontal: 20 }}>

        {/* Title */}
        <Text style={{
          fontSize: 18,
          fontWeight: 'bold',
          color: '#0D1C6A',
          marginBottom: 25,
          marginTop: 30,
        }}>
          Envoyez Gratuitement de l'argent à vos amis Sendo
        </Text>

        {/* Search input */}
        <Text style={{ marginBottom: 5, color: '#333' }}>Rechercher un contact existant</Text>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#F1F1F1',
          borderRadius: 10,
          paddingHorizontal: 10,
          marginBottom: 20
        }}>
          <Text style={{ fontSize: 16, color: '#999', marginRight: 5 }}>❓</Text>
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Rechercher"
            placeholderTextColor="#999"
            style={{ flex: 1, paddingVertical: 10 }}
          />
        </View>

        {/* Recents */}
        <Text style={{ fontWeight: '500', marginBottom: 5 }}>Récents</Text>
        <Text style={{ color: '#888', marginBottom: 20 }}>Aucune transaction récente</Text>

        {/* Add contact */}
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 30
        }}>
          <Text style={{ flex: 1, color: '#333' }}>Ajouter ou rechercher un contact existant</Text>
          <TouchableOpacity 
           onPress={() => navigation.navigate("AddContact")}
          style={{
            backgroundColor: '#F1F1F1',
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 8
          }}>
            <Text style={{ color: '#0D1C6A', fontWeight: '600' }}>➕ Ajouter un bénéficiaire</Text>
          </TouchableOpacity>
        </View>

        {/* No contact found */}
        <Text style={{ textAlign: 'center', color: '#999', marginBottom: 20 }}>
          Aucun contact trouvé.
        </Text>

        {/* Refresh button */}
        <TouchableOpacity style={{
          alignSelf: 'center',
          paddingVertical: 12,
          paddingHorizontal: 40,
          borderRadius: 25,
          backgroundColor: 'linear-gradient(to right, #00C9FF, #92FE9D)', // Not supported natively, used fallback
          backgroundColor: '#00C9FF', // fallback solid color
        }}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Rafraîchir</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default AddBeneficiary;
