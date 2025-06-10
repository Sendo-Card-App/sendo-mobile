import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import om from '../../Images/om.png';
import mtn from '../../Images/mtn.png';

const SelectMethod = ({ navigation }) => {
  const { t } = useTranslation();
  const [showServiceModal, setShowServiceModal] = useState(false);

  const handleServiceSelect = (service) => {
    setShowServiceModal(false);
    navigation.navigate('WalletWithdrawal', { service });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', paddingTop: StatusBar.currentHeight || 20 }}>
      <View style={{ flex: 1, paddingHorizontal: 20 }}>

        {/* Header row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
          
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
          onPress={() => setShowServiceModal(true)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#F1F1F1',
            borderRadius: 10,
            padding: 15,
            marginBottom: 20,
          }}
        >
          <AntDesign name="mobile1" size={40} color="#999" style={{ marginRight: 5 }} />
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
          onPress={() => navigation.navigate('WalletTransfer')}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#F1F1F1',
            borderRadius: 10,
            padding: 15,
          }}
        >
          <Image source={require('../../Images/LogoSendo.png')} style={{ width: 40, height: 40, borderRadius: 20 }} />
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#0D1C6A', marginLeft: 10, flex: 1 }}>
            {t('select_method.sendo_transfer')}
          </Text>
          <Text style={{ fontSize: 12, color: '#999' }}>{t('select_method.no_fee')}</Text>
        </TouchableOpacity>
      </View>

      {/* Modal for service selection */}
      <Modal
        visible={showServiceModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowServiceModal(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPressOut={() => setShowServiceModal(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 20,
          }}
        >
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 12,
            width: '100%',
            padding: 20,
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 20 }}>
              {t('select_service')}
            </Text>

            {/* Service Buttons in Square Format */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
              <TouchableOpacity
                onPress={() => handleServiceSelect('OM')}
                style={{
                  width: 100,
                  height: 100,
                  backgroundColor: '#F1F1F1',
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Image source={om} style={{ width: 40, height: 40, marginBottom: 8 }} />
                <Text style={{ fontSize: 14, fontWeight: '500', textAlign: 'center' }}>{t('service_om')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleServiceSelect('MTN')}
                style={{
                  width: 100,
                  height: 100,
                  backgroundColor: '#F1F1F1',
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Image source={mtn} style={{ width: 40, height: 40, marginBottom: 8 }} />
                <Text style={{ fontSize: 14, fontWeight: '500', textAlign: 'center' }}>{t('service_mtn')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

export default SelectMethod;
