import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  SafeAreaView,
  StatusBar,
  Pressable,
  Dimensions,
  Platform,
} from 'react-native';
import { AntDesign, Entypo } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import om from '../../images/om.png';
import mtn from '../../images/mtn.png';
import HomeImage2 from '../../images/HomeImage2.png';
import TopLogo from '../../images/TopLogo.png'; 

const { height } = Dimensions.get('window');

const SelectMethod = ({ navigation }) => {
  const { t } = useTranslation();
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [isClickedOne, setisClickedOne] = useState(false);
  const [isClickedTwo, setisClickedTwo] = useState(false);
  const [isClickedThree, setisClickedThree] = useState(false);
  const [isClickedFour, setisClickedFour] = useState(false);

  const platformFont = Platform.OS === 'ios' ? 'Arial' : 'Roboto';

  const handleServiceSelect = (service) => {
    setShowServiceModal(false);
    navigation.navigate('WalletWithdrawal', { service });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', paddingTop: StatusBar.currentHeight || 20 }}>
      <View style={{ flex: 1, paddingHorizontal: 20 }}>

        {/* First row of boxes */}
        <View style={{ flexDirection: 'row', gap: 10, height: height / 4.5, marginBottom: 20 }}>

         {/* Box 2 - Transfert d'argent */}
          <Pressable
            style={{
              flex: 1,
              backgroundColor: '#fff',
              borderRadius: 24,
              padding: 10,
              borderWidth: 2,
              borderColor: isClickedTwo ? '#0D1C6A' : '#E0E0E0',
            }}
            onPress={() => {
              setisClickedTwo(true);
              setisClickedOne(false);
              navigation.navigate("BeneficiaryScreen");
            }}
          >
            <View style={{
              position: 'absolute',
              top: 10,
              left: 10,
              backgroundColor: '#fff',
              borderRadius: 999,
              borderColor: isClickedOne ? '#0D1C6A' : '#E0E0E0', 
            }}>
              <Entypo name="circle" size={24} color="lightgray" />
            </View>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
              <Image
                source={HomeImage2}
                style={{ width: '100%', height: height / 7, resizeMode: 'contain' }}
              />
              <View style={{ paddingVertical: 8 }}>
                <Text style={{
                  fontSize: 16,
                  fontFamily: platformFont,
                  textAlign: 'center',
                  color: '#7ddd7d',
                  fontStyle: 'italic',
                  fontWeight: '800',
                }}>Transfert CA-CM</Text>
                <Text style={{
                  fontSize: 16,
                  fontFamily: platformFont,
                  textAlign: 'center',
                  fontStyle: 'italic',
                  fontWeight: '800',
                }}>D'argent</Text>
              </View>
            </View>
          </Pressable>
         {/* Box 1 - Carte Virtuelle */}
          <Pressable
            style={{
              flex: 1,
              backgroundColor: '#fff',
              borderRadius: 24,
              padding: 10,
              borderWidth: 2,
              borderColor: isClickedOne ? '#0D1C6A' : '#E0E0E0',
            }}
            onPress={() => {
              setisClickedOne(true);
              setisClickedTwo(false);
              navigation.navigate("WalletTransfer");
            }}
          >
            <View style={{
              position: 'absolute',
              top: 10,
              left: 10,
              backgroundColor: isClickedOne ? '#181e25' : 'transparent',
              borderRadius: 999,
            }}>
              <Entypo name="circle" size={24} color="lightgray" />
            </View>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-end' }}>
              <Image
                source={TopLogo}
                style={{ width: '90', height: "80", resizeMode: 'contain' }}
              />
              <View style={{ paddingVertical: 8 }}>
                <Text style={{
                  fontSize: 16,
                  fontFamily: platformFont,
                  textAlign: 'center',
                  color: '#7ddd7d',
                  fontStyle: 'italic',
                  fontWeight: '800',
                }}>{t('select_method.sendo_transfer')}</Text>
                <Text style={{
                  fontSize: 16,
                  fontFamily: platformFont,
                  textAlign: 'center',
                  fontStyle: 'italic',
                  fontWeight: '800',
                }}>{t('select_method.transfer')}</Text>
              </View>
            </View>
          </Pressable>
          
        </View>

        {/* Second row of boxes */}
        <View style={{ flexDirection: 'row', gap: 10, height: height / 4.5 }}>
          {/* Transfer to Mobile */}
          <Pressable
            style={{
              flex: 1,
              backgroundColor: '#fff',
              borderRadius: 24,
              padding: 10,
              borderWidth: 2,
              borderColor: isClickedThree ? '#0D1C6A' : '#E0E0E0',
            }}
            onPress={() => {
              setisClickedOne(false);
              setisClickedTwo(false);
              setisClickedThree(true);
              setisClickedFour(false);
              setShowServiceModal(true);
            }}
          >
            <View style={{
              position: 'absolute',
              top: 10,
              left: 10,
              backgroundColor: isClickedThree ? '#181e25' : 'transparent',
              borderRadius: 999,
            }}>
              <Entypo name="circle" size={24} color="lightgray" />
            </View>
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <AntDesign name="mobile1" size={40} color="#999" />
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#0D1C6A', marginTop: 10, textAlign: 'center' }}>
                {t('select_method.transfer_to_mobile')}
              </Text>
              <Text style={{ fontSize: 12, color: '#999' }}>{t('select_method.transfer_fee')}</Text>
            </View>
          </Pressable>
         
        </View>
      </View>

      {/* Modal */}
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
