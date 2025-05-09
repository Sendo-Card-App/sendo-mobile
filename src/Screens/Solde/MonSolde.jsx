import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import React, { useEffect, useState } from "react";
import { Ionicons ,AntDesign } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useGetBalanceQuery } from "../../services/WalletApi/walletApi";
import { useGetUserProfileQuery } from "../../services/Auth/authAPI";
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

const MonSolde = () => {
  const navigation = useNavigation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();
  
  // First get the user profile to get the userId
  const { data: userProfile, isLoading: isProfileLoading, error: profileError } = useGetUserProfileQuery();
  const userId = userProfile?.data.id;
 
  // Then get the balance using the userId
  const { 
    data: balanceData, 
    isLoading: isBalanceLoading,
    error: balanceError,
    isError: isBalanceError,
    refetch: refetchBalance
  } = useGetBalanceQuery(userId, {
    skip: !userId // Skip the query if userId is not available
  });

  const isLoading = isProfileLoading || isBalanceLoading;
  
     //console.log(userProfile)
  // Handle API errors
  useEffect(() => {
    if (balanceError) {
      console.log('Balance error details:', balanceError);
      
      let errorMessage = 'An unknown error occurred';
      
      if (balanceError.status === 401) {
        errorMessage = 'Authentication required (missing passcode)';
      } else if (balanceError.status === 403) {
        errorMessage = 'Missing KYC documents';
      } else if (balanceError.status === 404) {
        errorMessage = 'Wallet not found';
      } else if (balanceError.data?.message) {
        errorMessage = balanceError.data.message;
      }
      
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
        position: 'top',
        visibilityTime: 10000, // Display for 10 seconds (10000ms)
        autoHide: true,
      });
    }
  }, [balanceError]);
   
  // Handle successful balance fetch
  useEffect(() => {
    if (balanceData && !isBalanceLoading) {
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Balance loaded successfully',
        position: 'bottom',
      });
    }
  }, [balanceData, isBalanceLoading]);

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ marginTop: 16,fontSize: 24,fontWeight: 'bold', marginBottom: 20 }}>{t('wallet_balance.title')}</Text>

      {isLoading ? (
        <ActivityIndicator color="#0D1C6A" />
      ) : isBalanceError ? (
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={{ color: 'red', marginRight: 8 }}>Impossible d'afficher le solde</Text>
          <TouchableOpacity onPress={refetchBalance}>
            <Ionicons name="refresh" size={20} color="#0D1C6A" />
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={{ fontSize: 32, fontWeight: 'bold' }}>
          {balanceData?.data.balance || "0.00"} {balanceData?.data.currency || "XAF"}
        </Text>
      )}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: 40 }}>
        <View>
        <TouchableOpacity
          style={{ 
            backgroundColor: '#7ddd7d', 
            width: 70, 
            height: 70, 
            borderRadius: 40, 
            alignItems: 'center', 
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 2,
            elevation: 2,
            marginHorizontal: 8
          }}
          onPress={() => navigation.navigate("MethodType")}
        >
          <Ionicons name="add-circle-outline" size={28} color="white" />
        </TouchableOpacity>
        <Text style={{ textAlign: 'center', color: 'black', fontSize: 12, fontWeight: 'bold', marginTop: 4 }}>
            {t('wallet_balance.recharge')}
          </Text>
          </View>
          <View>
        <TouchableOpacity
          style={{ 
            backgroundColor: '#5dade2', 
            width: 70, 
            height: 70, 
            borderRadius: 40, 
            alignItems: 'center', 
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 2,
            elevation: 2,
            marginHorizontal: 8
          }}
          onPress={() => navigation.navigate("Withdrawal")}
        >
          <Ionicons name="remove-circle-outline" size={28} color="white" />
         
        </TouchableOpacity>
        <Text style={{ textAlign: 'center', color: 'black', fontSize: 12, fontWeight: 'bold', marginTop: 4 }}>
            {t('wallet_balance.withdraw')}
          </Text>
          </View>

          <View>
        <TouchableOpacity
          style={{ 
            backgroundColor: '#f39c12', 
            width: 70, 
            height: 70, 
            borderRadius: 40, 
            alignItems: 'center', 
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.2,
            shadowRadius: 2,
            elevation: 2,
            marginHorizontal: 8
          }}
          onPress={() => navigation.navigate("SelectMethod")}
        >
          <Ionicons name="swap-horizontal-outline" size={28} color="white" />
          
        </TouchableOpacity>
        <Text style={{ textAlign: 'center', color: 'black', fontSize: 12, fontWeight: 'bold', marginTop: 4 }}>
            {t('wallet_balance.transfer')}
          </Text>
      </View>
      </View>
       <TouchableOpacity style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#FFF',
          borderRadius: 20,
          padding: 15,
          marginBottom: 20,
          marginTop:30,
          }}
          onPress={() => navigation.navigate("PaymentSimulator")}
          >
         <AntDesign name="calculator" size={50} color="#999" style={{ marginRight: 5 }} />
          <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#0D1C6A', marginLeft: 30, flex: 1 }}>
              {t('method.simule')}
          </Text>
         </TouchableOpacity>

      <Text style={{ 
        fontWeight: '800', 
        color: '#374151', 
        borderBottomWidth: 1, 
        borderTopWidth: 1, 
        borderColor: '#9CA3AF', 
        paddingTop: 24, 
        paddingBottom: 4, 
        borderStyle: 'dashed', 
        fontSize: 18 
      }}>
        {t('wallet_balance.referral_balance')}
      </Text>

      <Text style={{ fontWeight: '800', color: '#374151', marginTop: 8, fontSize: 18 }}>
        0,00 CAD
      </Text>

      <Text style={{ fontSize: 14, color: '#9CA3AF' }}>
        {t('wallet_balance.referral_terms')}
        <Text style={{ textDecorationLine: 'underline' }}> {t('wallet_balance.terms_conditions')}</Text>
      </Text>

      <Text style={{ color: '#7ddd7d', fontWeight: 'bold', fontSize: 14, marginVertical: 16 }}>
        {t('wallet_balance.share_referral')}
      </Text>
    </View>
  );
};

export default MonSolde;