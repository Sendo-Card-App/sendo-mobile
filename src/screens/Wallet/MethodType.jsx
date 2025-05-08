import React, { useState } from 'react';
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { View, Text, TouchableOpacity, Image, SafeAreaView, StatusBar } from 'react-native';
import { useTranslation } from 'react-i18next';

const MethodType = ({navigation}) => {
  const { t } = useTranslation();
  const [showBankDetails, setShowBankDetails] = useState(false);

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

        <View>
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
            <View style={styles.bankDetailsContainer}>
              <TouchableOpacity 
                onPress={() => navigation.navigate("BankDepositRecharge", { 
                  methodType: "BANK_TRANSFER" 
                })}
                style={styles.transferButton}
              >
                <Text style={styles.transferButtonText}>{t('method.make_transfer')}</Text>
              </TouchableOpacity>

              <View style={styles.bankDetailRow}>
                <Text style={styles.bankDetailLabel}>{t('method.bank_name')}:</Text>
                <Text style={styles.bankDetailValue}>{bankDetails.bankName}</Text>
              </View>
              
              <View style={styles.bankDetailRow}>
                <Text style={styles.bankDetailLabel}>{t('method.account_number')}:</Text>
                <Text style={styles.bankDetailValue}>{bankDetails.accountNumber}</Text>
              </View>
              
              <View style={styles.bankDetailRow}>
                <Text style={styles.bankDetailLabel}>{t('method.account_name')}:</Text>
                <Text style={styles.bankDetailValue}>{bankDetails.accountName}</Text>
              </View>
              
              <View style={styles.bankDetailRow}>
                <Text style={styles.bankDetailLabel}>{t('method.full_iban')}:</Text>
                <Text style={styles.bankDetailValue}>{bankDetails.iban}</Text>
              </View>
              
              <View style={styles.bankDetailRow}>
                <Text style={styles.bankDetailLabel}>{t('method.bic_swift')}:</Text>
                <Text style={styles.bankDetailValue}>{bankDetails.bic}</Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = {
  bankDetailsContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: 10,
    padding: 15,
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#EEE'
  },
  bankDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  bankDetailLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500'
  },
  bankDetailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold'
  },
  transferButton: {
    backgroundColor: '#7ddd7d',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 15
  },
  transferButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16
  }
};

export default MethodType;