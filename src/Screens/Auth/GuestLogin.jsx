import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, Modal, FlatList, SafeAreaView, StatusBar } from 'react-native';
import { EvilIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

const GuestLogin = ({ navigation }) => {
  const { t } = useTranslation();
  const [referralCode, setReferralCode] = useState('');
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Sample referral data
  const referralData = {
    code: 'SENDO123',
    bonusAmount: '500 FCFA',
    inviteLink: 'https://sendo.app/invite/SENDO123'
  };

  const handleGuestLogin = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      navigation.navigate('Home', { 
        isGuest: true,
        ...(referralCode && { referralCode }) // Pass referral code if provided
      });
    }, 1500);
  };

  const handleShareReferral = () => {
    // In a real app, you would use the Share API here
    Toast.show({
      type: 'success',
      text1: t('referral.link_copied'),
      text2: `${t('referral.share_message')} ${referralData.inviteLink}`
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#181e25' }}>
      <StatusBar barStyle="light-content" backgroundColor="#181e25" />
      
      {/* Header */}
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        padding: 20,
        alignItems: 'center'
      }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <EvilIcons name="chevron-left" size={30} color="#7ddd7d" />
        </TouchableOpacity>
        <Text style={{ color: 'white', fontSize: 18 }}>{t('guest_login.title')}</Text>
        <View style={{ width: 30 }} /> 
      </View>

      {/* Main Content */}
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        paddingHorizontal: 30 
      }}>
        <Image
          source={require('../../Images/LogoSendo.png')}
          style={{ 
            width: 100, 
            height: 100, 
            alignSelf: 'center', 
            marginBottom: 30 
          }}
        />

        <Text style={{ 
          color: 'white', 
          fontSize: 24, 
          fontWeight: 'bold', 
          marginBottom: 20,
          textAlign: 'center'
        }}>
          {t('guest_login.welcome')}
        </Text>

        <Text style={{ 
          color: '#ccc', 
          marginBottom: 30,
          textAlign: 'center'
        }}>
          {t('guest_login.description')}
        </Text>

        {/* Referral Code Input */}
        <TextInput
          placeholder={t('guest_login.referral_placeholder')}
          placeholderTextColor="#999"
          value={referralCode}
          onChangeText={setReferralCode}
          style={{ 
            backgroundColor: '#f1f1f1',
            borderRadius: 30,
            paddingVertical: 15,
            paddingHorizontal: 20,
            marginBottom: 20,
            textAlign: 'center'
          }}
        />

        {/* Login Button */}
        <TouchableOpacity 
          onPress={handleGuestLogin}
          disabled={isLoading}
          style={{ 
            backgroundColor: '#7ddd7d',
            borderRadius: 30,
            padding: 15,
            alignItems: 'center',
            marginBottom: 20,
            opacity: isLoading ? 0.7 : 1
          }}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={{ 
              fontWeight: 'bold', 
              fontSize: 16 
            }}>
              {t('guest_login.continue_as_guest')}
            </Text>
          )}
        </TouchableOpacity>

        {/* Referral Info */}
        <TouchableOpacity 
          onPress={() => setShowReferralModal(true)}
          style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginTop: 20
          }}
        >
          <EvilIcons name="share-google" size={24} color="#7ddd7d" />
          <Text style={{ 
            color: '#7ddd7d', 
            fontWeight: 'bold',
            marginLeft: 5
          }}>
            {t('drawer.invite_friends')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Referral Modal */}
      <Modal
        visible={showReferralModal}
        animationType="slide"
        transparent={false}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f8f8' }}>
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            padding: 20,
            borderBottomWidth: 1,
            borderBottomColor: '#eee'
          }}>
            <Text style={{ 
              fontSize: 20, 
              fontWeight: 'bold' 
            }}>
              {t('referral.title')}
            </Text>
            <TouchableOpacity onPress={() => setShowReferralModal(false)}>
              <EvilIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={{ padding: 20 }}>
            <Text style={{ 
              fontSize: 16, 
              marginBottom: 20,
              lineHeight: 24
            }}>
              {t('referral.description')}
            </Text>

            <View style={{ 
              backgroundColor: '#7ddd7d20',
              borderRadius: 10,
              padding: 15,
              marginBottom: 20
            }}>
              <Text style={{ 
                fontWeight: 'bold', 
                marginBottom: 5,
                color: '#7ddd7d'
              }}>
                {t('referral.your_code')}
              </Text>
              <Text style={{ 
                fontSize: 24, 
                fontWeight: 'bold',
                marginBottom: 10
              }}>
                {referralData.code}
              </Text>
              <Text style={{ 
                color: '#666',
                marginBottom: 15
              }}>
                {t('referral.bonus_amount')}: {referralData.bonusAmount}
              </Text>
            </View>

            <Text style={{ 
              marginBottom: 15,
              fontWeight: 'bold'
            }}>
              {t('referral.how_it_works')}
            </Text>

            <View style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                <Text style={{ fontWeight: 'bold', marginRight: 10 }}>1.</Text>
                <Text>{t('referral.step1')}</Text>
              </View>
              <View style={{ flexDirection: 'row', marginBottom: 10 }}>
                <Text style={{ fontWeight: 'bold', marginRight: 10 }}>2.</Text>
                <Text>{t('referral.step2')}</Text>
              </View>
              <View style={{ flexDirection: 'row' }}>
                <Text style={{ fontWeight: 'bold', marginRight: 10 }}>3.</Text>
                <Text>{t('referral.step3')}</Text>
              </View>
            </View>

            <TouchableOpacity 
              onPress={handleShareReferral}
              style={{ 
                backgroundColor: '#7ddd7d',
                borderRadius: 30,
                padding: 15,
                alignItems: 'center'
              }}
            >
              <Text style={{ 
                fontWeight: 'bold', 
                color: 'white'
              }}>
                {t('referral.share_button')}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      <Toast />
    </SafeAreaView>
  );
};

export default GuestLogin;