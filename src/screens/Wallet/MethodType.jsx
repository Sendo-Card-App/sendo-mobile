import React, { useState } from 'react';
import { AntDesign } from "@expo/vector-icons";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StatusBar,
  Modal,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useGetUserProfileQuery } from "../../services/Auth/authAPI";

import om from "../../images/om.png";
import mtn from "../../images/mtn.png";

const MethodType = ({ navigation }) => {
  const { t } = useTranslation();
  const [showBankDetails, setShowBankDetails] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);

  // ✅ get user country
  const {
    data: userProfile,
    isLoading: isProfileLoading,
    refetch: refetchProfile,
  } = useGetUserProfileQuery();
  
  const isCanada = userProfile?.data?.country === "Canada";

  // ✅ Bank details (only if not Canada)
  const bankDetails = !isCanada
    ? {
        beneficiary: "SERVICES FINANCIERS ETUDIANTS CAMEROUN S.A.S",
        bankName: "ECOBANK CAMEROUN S.A.",
        bankCode: "10029",
        branchCode: "00001",
        accountNumber: "30180056507",
        ribKey: "47",
        swiftBic: "ECOCCMCX",
        iban: "CM21 10029 00001 30180056507 47",
        reference: "30180056507",
      }
    : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#7ddd7d' }}>
      {/* StatusBar */}
      <StatusBar backgroundColor="#7ddd7d" barStyle="light-content" />

      {/* Header */}
      <View
        style={{
          backgroundColor: '#7ddd7d',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
          paddingBottom: 12,
        }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="left" size={24} color="white" />
        </TouchableOpacity>

        <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
          {t('screens.selectMethod')}
        </Text>

        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <AntDesign name="menu-fold" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: '#fff' }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }}
      >
        {/* Mobile Transfer Section */}
        <Text style={{ fontSize: 16, fontWeight: '500', marginVertical: 10 }}>
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
          }}
        >
          <AntDesign name="mobile" size={50} color="#999" style={{ marginRight: 5 }} />
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#0D1C6A', marginLeft: 10, flex: 1 }}>
            {t('method.transfer_to_mobile')}
          </Text>
          <Text style={{ fontSize: 12, color: '#999' }}>{t('method.transfer_fee')}</Text>
        </TouchableOpacity>

        {/* Bank or Interac Section */}
        <Text style={{ fontSize: 16, fontWeight: '500', marginBottom: 10 }}>
          {isCanada ? t('method.send_interac') : t('method.send_to_friends')}
        </Text>

        <TouchableOpacity
          onPress={() => setShowBankDetails(!showBankDetails)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#F1F1F1',
            borderRadius: 10,
            padding: 15,
          }}
        >
          <AntDesign name={isCanada ? "mail" : "bank"} size={50} color="#999" style={{ marginRight: 5 }} />
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#0D1C6A', marginLeft: 10, flex: 1 }}>
            {isCanada ? t('method.interac_transfer') : t('method.sendo_transfer')}
          </Text>
          <Text style={{ fontSize: 12, color: '#999' }}>
            {isCanada ? t('method.no_fee') : t('method.no_fee')}
          </Text>
          <AntDesign name={showBankDetails ? "up" : "down"} size={16} color="#666" style={{ marginLeft: 10 }} />
        </TouchableOpacity>

        {showBankDetails && (
          <View
            style={{
              backgroundColor: '#F8F8F8',
              borderRadius: 10,
              padding: 15,
              marginTop: 5,
              borderWidth: 1,
              borderColor: '#EEE',
            }}
          >
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("BankDepositRecharge", {
                  methodType: isCanada ? "INTERAC" : "BANK_TRANSFER",
                })
              }
              style={{
                backgroundColor: '#7ddd7d',
                borderRadius: 8,
                padding: 12,
                alignItems: 'center',
                marginBottom: 15,
              }}
            >
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                {isCanada ? t('method.make_interac') : t('method.make_transfer')}
              </Text>
            </TouchableOpacity>

            {isCanada ? (
              <>
                <Text style={{ fontSize: 14, color: '#333', textAlign: 'center' }}>
                  {t('method.interac_instructions')}
                </Text>
                <Text style={{ fontSize: 14, color: '#0D1C6A', fontWeight: 'bold', textAlign: 'center', marginTop: 5 }}>
                  sendoperations@sf-e.ca
                </Text>
              </>
            ) : (
              <>
                {[
                  { label: t('method.beneficiary'), value: bankDetails.beneficiary },
                  { label: t('method.bank_name'), value: bankDetails.bankName },
                  { label: t('method.bank_code'), value: bankDetails.bankCode },
                  { label: t('method.branch_code'), value: bankDetails.branchCode },
                  { label: t('method.account_number'), value: bankDetails.accountNumber },
                  { label: t('method.rib_key'), value: bankDetails.ribKey },
                  { label: t('method.bic_swift'), value: bankDetails.swiftBic },
                ].map((item, index) => (
                  <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                    <Text style={{ fontSize: 14, color: '#666', fontWeight: '500' }}>{item.label}:</Text>
                    <Text style={{ fontSize: 14, color: '#333', fontWeight: 'bold', maxWidth: 180, textAlign: 'right' }}>
                      {item.value}
                    </Text>
                  </View>
                ))}

                {/* IBAN scroll */}
                <View style={{ flexDirection: 'row', marginBottom: 10, alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, color: '#666', fontWeight: '500', width: 120 }}>
                    {t('method.full_iban')}:
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <Text style={{ fontSize: 14, color: '#333', fontWeight: 'bold' }}>{bankDetails.iban}</Text>
                  </ScrollView>
                </View>
              </>
            )}
          </View>
        )}

        {/* Service Modal */}
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
      </ScrollView>
    </SafeAreaView>
  );
};

export default MethodType;
