import React, { useState } from 'react';
import { AntDesign } from "@expo/vector-icons";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  Modal,
  Pressable
} from 'react-native';
import { useTranslation } from 'react-i18next';

import om from "../../images/om.png";
import mtn from "../../images/mtn.png";

const MethodType = ({ navigation }) => {
  const { t } = useTranslation();
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);

  const bankDetails = {
    bankName: "Royal Bank International",
    accountNumber: "1234567890",
    accountName: "John Doe",
    iban: "GB33BUKB20201555555555",
    bic: "BUKBGB22"
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff', paddingTop: StatusBar.currentHeight || 20 }}>
      <View style={{ flex: 1, paddingHorizontal: 20 }}>

        {/* Header */}
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
            <Text style={{ fontSize: 12, color: '#0D1C6A' }}>{t('method.withdrawal_limit')}</Text>
          </TouchableOpacity>
        </View>

        {/* Mobile Transfer Section */}
        <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 10 }}>
          {t('method.send_to_mobile')}
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
          }}>
          <AntDesign name="mobile1" size={50} color="#999" style={{ marginRight: 5 }} />
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#0D1C6A', marginLeft: 10, flex: 1 }}>
            {t('method.transfer_to_mobile')}
          </Text>
          <Text style={{ fontSize: 12, color: '#999' }}>{t('method.transfer_fee')}</Text>
        </TouchableOpacity>

        {/* Bank Transfer Section */}
        <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 10 }}>
          {t('method.send_to_friends')}
        </Text>

        <TouchableOpacity
          onPress={() => setShowBankDetails(!showBankDetails)}
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
          <AntDesign
            name={showBankDetails ? "up" : "down"}
            size={16}
            color="#666"
            style={{ marginLeft: 10 }}
          />
        </TouchableOpacity>

        {showBankDetails && (
          <View style={{
            backgroundColor: '#F8F8F8',
            borderRadius: 10,
            padding: 15,
            marginTop: 5,
            borderWidth: 1,
            borderColor: '#EEE'
          }}>
            <TouchableOpacity
              onPress={() => navigation.navigate("BankDepositRecharge", {
                methodType: "BANK_TRANSFER"
              })}
              style={{
                backgroundColor: '#7ddd7d',
                borderRadius: 8,
                padding: 12,
                alignItems: 'center',
                marginBottom: 15
              }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                {t('method.make_transfer')}
              </Text>
            </TouchableOpacity>

            {[
              { label: t('method.bank_name'), value: bankDetails.bankName },
              { label: t('method.account_number'), value: bankDetails.accountNumber },
              { label: t('method.account_name'), value: bankDetails.accountName },
              { label: t('method.full_iban'), value: bankDetails.iban },
              { label: t('method.bic_swift'), value: bankDetails.bic },
            ].map((item, index) => (
              <View
                key={index}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginBottom: 10
                }}
              >
                <Text style={{ fontSize: 14, color: '#666', fontWeight: '500' }}>{item.label}:</Text>
                <Text style={{ fontSize: 14, color: '#333', fontWeight: 'bold' }}>{item.value}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Service Selection Modal */}
        <Modal
          transparent
          animationType="fade"
          visible={showServiceModal}
          onRequestClose={() => setShowServiceModal(false)}
        >
          <Pressable
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.5)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => setShowServiceModal(false)}
          >
            <View
              style={{
                backgroundColor: '#fff',
                padding: 20,
                borderRadius: 12,
                width: 300,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 20 }}>
                {t('method.select_service')}
              </Text>

              {/* Services Grid */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
                {/* Orange Money */}
                <TouchableOpacity
                  style={{
                    width: 120,
                    height: 120,
                    backgroundColor: '#F5F5F5',
                    borderRadius: 12,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginRight: 10,
                  }}
                  onPress={() => {
                    setShowServiceModal(false);
                    navigation.navigate("WalletRecharge", { service: 'OM' });
                  }}
                >
                  <Image source={om} style={{ width: 50, height: 50, marginBottom: 8 }} />
                  <Text style={{ fontSize: 14, fontWeight: '500', textAlign: 'center' }}>
                    {t('method.service_om')}
                  </Text>
                </TouchableOpacity>

                {/* MTN Mobile Money */}
                <TouchableOpacity
                  style={{
                    width: 120,
                    height: 120,
                    backgroundColor: '#F5F5F5',
                    borderRadius: 12,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    setShowServiceModal(false);
                    navigation.navigate("WalletRecharge", { service: 'MTN' });
                  }}
                >
                  <Image source={mtn} style={{ width: 50, height: 50, marginBottom: 8 }} />
                  <Text style={{ fontSize: 14, fontWeight: '500', textAlign: 'center' }}>
                    {t('method.service_mtn')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Modal>


      </View>
    </SafeAreaView>
  );
};

export default MethodType;
