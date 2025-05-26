import React from 'react';
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { View, Text, TouchableOpacity, Image, SafeAreaView, StatusBar } from 'react-native';
import { useTranslation } from 'react-i18next';

const SelectMethod = ({navigation}) => {
  const { t } = useTranslation();

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
            <Text style={{ fontSize: 12, color: '#0D1C6A' }}>{t('select_method.withdrawal_limit')}</Text>
          </TouchableOpacity>
        </View>

        {/* Section 1 */}
        <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 10 }}>
          {t('select_method.send_to_mobile')}
        </Text>

        <TouchableOpacity 
        onPress={() => navigation.navigate("WalletWithdrawal")}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#F1F1F1',
          borderRadius: 10,
          padding: 15,
          marginBottom: 20,
        }}>
          <Image source={require('../../Images/om.png')} style={{ width: 40, height: 40, borderRadius: 20 }} />
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#0D1C6A', marginLeft: 10, flex: 1 }}>
            {t('select_method.transfer_to_mobile')}
          </Text>
          <Text style={{ fontSize: 12, color: '#999' }}>{t('select_method.transfer_fee')}</Text>
        </TouchableOpacity>

        {/* Section 2 */}
        <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 10 }}>
          {t('select_method.send_to_friends')}
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
          <Image source={require('../../Images/LogoSendo.png')} style={{ width: 40, height: 40, borderRadius: 20 }} />
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#0D1C6A', marginLeft: 10, flex: 1 }}>
            {t('select_method.sendo_transfer')}
          </Text>
          <Text style={{ fontSize: 12, color: '#999' }}>{t('select_method.no_fee')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default SelectMethod;