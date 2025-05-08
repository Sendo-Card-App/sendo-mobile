import React from 'react';
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { View, Text, TouchableOpacity, Image, SafeAreaView, StatusBar } from 'react-native';

const SelectMethod = ({navigation}) => {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', paddingTop: StatusBar.currentHeight || 20 }}>
      <View style={{ flex: 1, paddingHorizontal: 20 }}>

        {/* Header row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <TouchableOpacity>
            <AntDesign name="arrowleft" size={24} color="white" onPress={() => navigation.goBack()} />
          </TouchableOpacity>
          <TouchableOpacity style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 10,
            marginBottom: 10,
            backgroundColor: '#F1F1F1',
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderRadius: 20,
          }}>
            <Text style={{ fontSize: 12, color: '#0D1C6A' }}>📊 Limite de retrait</Text>
          </TouchableOpacity>
        </View>

        {/* Section 1 */}
        <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 10 }}>
          Envoyer de l'argent sur vos comptes MOMO ou OM
        </Text>

        <TouchableOpacity style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#F1F1F1',
          borderRadius: 10,
          padding: 15,
          marginBottom: 20,
        }}>
          <Image source={require('../../images/om.png')} style={{ width: 40, height: 40, borderRadius: 20 }} />
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#0D1C6A', marginLeft: 10, flex: 1 }}>
            Transférer vers Mobile...
          </Text>
          <Text style={{ fontSize: 12, color: '#999' }}>2.5% frais de transfert</Text>
        </TouchableOpacity>

        {/* Section 2 */}
        <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 10 }}>
          Envoyez de l'argent à vos amis de Sendo
        </Text>

        <TouchableOpacity 
         onPress={() => navigation.navigate("WalletTransfer")}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#F1F1F1',
          borderRadius: 10,
          padding: 15,
        }}>
          <Image source={require('../../images/LogoSendo.png')} style={{ width: 40, height: 40, borderRadius: 20 }} />
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#0D1C6A', marginLeft: 10, flex: 1 }}>
            Sendo - Sendo Tra...
          </Text>
          <Text style={{ fontSize: 12, color: '#999' }}>0 % de frais</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default SelectMethod;
