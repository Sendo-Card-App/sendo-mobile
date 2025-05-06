import React from 'react';
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { View, Text, TouchableOpacity, Image, SafeAreaView, StatusBar } from 'react-native';
import { useTranslation } from 'react-i18next';

const MethodType = ({navigation}) => {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', paddingTop: StatusBar.currentHeight || 20 }}>
      <View style={{ flex: 1, paddingHorizontal: 20 }}>

        {/* Header row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <AntDesign name="" size={24} color="#0D1C6A" />
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
            <Text style={{ fontSize: 12, color: '#0D1C6A' }}>{t('method.withdrawal_limit')}</Text>
          </TouchableOpacity>
        </View>

        {/* Section 1 */}
        <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 10 }}>
          {t('method.send_to_mobile')}
        </Text>

        <TouchableOpacity style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#F1F1F1',
            borderRadius: 10,
            padding: 15,
            marginBottom: 20,
            }}>
            <AntDesign name="mobile1" size={50} color="#999" style={{ marginRight: 5 }} />
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#0D1C6A', marginLeft: 10, flex: 1 }}>
                {t('method.transfer_to_mobile')}
            </Text>
            <Text style={{ fontSize: 12, color: '#999' }}>{t('method.transfer_fee')}</Text>
        </TouchableOpacity>

        {/* Section 2 */}
        <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 10 }}>
          {t('method.send_to_friends')}
        </Text>

        <TouchableOpacity 
            onPress={() => navigation.navigate("BankDepositRecharge", { 
              methodType: "BANK_TRANSFER" 
            })}
            style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#F1F1F1',
                borderRadius: 10,
                padding: 15,
            }}>
            <AntDesign name="bank" size={50} color="#999" style={{ marginRight: 5 }} />
            <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#0D1C6A', marginLeft: 10, flex: 1 }}>
                {t('method.sendo_transfer')}
            </Text>
            <Text style={{ fontSize: 12, color: '#999' }}>{t('method.no_fee')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default MethodType;