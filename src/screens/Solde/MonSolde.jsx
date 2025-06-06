import { 
  View, Text, TouchableOpacity, ActivityIndicator, StatusBar, 
  Dimensions, Platform 
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useGetBalanceQuery } from "../../services/WalletApi/walletApi";
import { useGetUserProfileQuery } from "../../services/Auth/authAPI";
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import Loader from "../../components/Loader";

const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 375;
const isIOS = Platform.OS === 'ios';
const scale = (size) => (width / 375) * size;

const MonSolde = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [showBalance, setShowBalance] = useState(true);

  // Fetch user profile and enable refetch
  const {
    data: userProfile,
    isLoading: isProfileLoading,
    refetch: refetchProfile,
  } = useGetUserProfileQuery();

  const userId = userProfile?.data?.id;

  // Fetch balance and enable refetch
  const {
    data: balanceData,
    isLoading: isBalanceLoading,
    error: balanceError,
    isError: isBalanceError,
    refetch: refetchBalance,
  } = useGetBalanceQuery(userId, { skip: !userId });

  const isLoading = isProfileLoading || isBalanceLoading;

  // Refetch profile and balance when screen is focused
  useFocusEffect(
    useCallback(() => {
      refetchProfile();
      if (userId) {
        refetchBalance();
      }
    }, [userId])
  );

  useEffect(() => {
    if (balanceError) {
      let errorMessage = 'An unknown error occurred';
      if (balanceError.status === 401) errorMessage = 'Authentication required (missing passcode)';
      else if (balanceError.status === 403) errorMessage = 'Missing KYC documents';
      else if (balanceError.status === 404) errorMessage = 'Wallet not found';
      else if (balanceError.data?.message) errorMessage = balanceError.data.message;

      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage,
        position: 'top',
        visibilityTime: 10000,
        autoHide: true,
      });
    }
  }, [balanceError]);

  return (
    <View style={{
      flex: 1,
      padding: isSmallScreen ? scale(15) : scale(20),
      paddingTop: isIOS ? scale(30) : StatusBar.currentHeight + scale(10)
    }}>
      {/* Floating home button */}
      <TouchableOpacity
        onPress={() => navigation.navigate('MainTabs')}
        style={{
          position: 'absolute',
          zIndex: 999,
          backgroundColor: 'white',
          borderRadius: scale(50),
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 3,
          elevation: 5,
          top: (StatusBar.currentHeight || 0) + (isSmallScreen ? height * 0.70 : height * 0.70),
          right: isSmallScreen ? scale(15) : scale(20),
          padding: isSmallScreen ? scale(8) : scale(10)
        }}
      >
        <Ionicons name="home" size={isSmallScreen ? scale(38) : scale(44)} color="#7ddd7d" />
      </TouchableOpacity>

      {/* Balance Card */}
      <View style={{
        borderWidth: 1,
        borderColor: '#E2E8F0',
        borderRadius: scale(12),
        padding: isSmallScreen ? scale(15) : scale(20),
        marginHorizontal: isSmallScreen ? scale(10) : scale(16),
        marginTop: isSmallScreen ? scale(10) : scale(16),
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
      }}>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: scale(8)
        }}>
          <Text style={{
            fontSize: isSmallScreen ? scale(16) : scale(18),
            fontWeight: 'bold',
            color: '#4A5568',
          }}>
            {t('wallet_balance.title')}
          </Text>

          <TouchableOpacity
            onPress={refetchBalance}
            disabled={isLoading}
            style={{
              padding: scale(4),
              borderRadius: scale(20),
              backgroundColor: '#EBF8FF',
              marginRight: scale(8)
            }}
          >
            {isLoading ? (
              <Loader size="small" color="#0D1C6A" />
            ) : (
              <Ionicons name="refresh" size={isSmallScreen ? scale(18) : scale(20)} color="#0D1C6A" />
            )}
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={{ height: scale(48), justifyContent: 'center' }}>
            <ActivityIndicator size="small" color="#0D1C6A" />
          </View>
        ) : isBalanceError ? (
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            height: scale(48),
            justifyContent: 'center'
          }}>
            <Text style={{ color: '#E53E3E', marginRight: scale(8), fontSize: isSmallScreen ? scale(14) : scale(16) }}>
              {t('wallet_balance.error')}
            </Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', flex: 1 }}>
              <Text style={{
                fontSize: isSmallScreen ? scale(28) : scale(32),
                fontWeight: '700',
                color: '#1A365D',
                marginRight: scale(4)
              }}>
                {showBalance ? balanceData?.data.balance || "0.00" : "****"}
              </Text>
              <Text style={{
                fontSize: isSmallScreen ? scale(16) : scale(18),
                fontWeight: '600',
                color: '#718096'
              }}>
                {showBalance ? (balanceData?.data.currency || "XAF") : ""}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setShowBalance(!showBalance)}>
              <Ionicons
                name={showBalance ? "eye-outline" : "eye-off-outline"}
                size={isSmallScreen ? scale(24) : scale(28)}
                color="#4A5568"
              />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Action buttons */}
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: isSmallScreen ? scale(10) : scale(16),
        marginTop: isSmallScreen ? scale(30) : scale(40)
      }}>
        {[
          { icon: "add-circle-outline", color: "#7ddd7d", label: t('wallet_balance.recharge'), route: "MethodType" },
          { icon: "remove-circle-outline", color: "#5dade2", label: t('wallet_balance.withdraw'), route: "Withdrawal" },
          { icon: "swap-horizontal-outline", color: "#f39c12", label: t('wallet_balance.transfer'), route: "SelectMethod" },
        ].map(({ icon, color, label, route }, index) => (
          <View key={index} style={{ flex: 1, alignItems: 'center' }}>
            <TouchableOpacity
              style={{
                backgroundColor: color,
                width: isSmallScreen ? scale(60) : scale(70),
                height: isSmallScreen ? scale(60) : scale(70),
                borderRadius: isSmallScreen ? scale(30) : scale(35),
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 2,
                elevation: 2,
              }}
              onPress={() => navigation.navigate(route)}
            >
              <Ionicons name={icon} size={isSmallScreen ? scale(24) : scale(28)} color="white" />
            </TouchableOpacity>
            <Text style={{
              textAlign: 'center',
              color: 'black',
              fontSize: isSmallScreen ? scale(12) : scale(14),
              fontWeight: 'bold',
              marginTop: isSmallScreen ? scale(2) : scale(4)
            }}>
              {label}
            </Text>
          </View>
        ))}
      </View>

      {/* Simulator link */}
      <TouchableOpacity style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: scale(20),
        padding: isSmallScreen ? scale(12) : scale(15),
        marginBottom: isSmallScreen ? scale(15) : scale(20),
        marginTop: isSmallScreen ? scale(20) : scale(30),
        marginHorizontal: isSmallScreen ? scale(10) : scale(16),
        borderWidth: 1,
        borderColor: '#CBD5E0',
      }}
        onPress={() => navigation.navigate("PaymentSimulator")}
      >
        <AntDesign
          name="calculator"
          size={isSmallScreen ? scale(40) : scale(50)}
          color="#999"
          style={{ marginRight: isSmallScreen ? scale(10) : scale(12) }}
        />
        <Text style={{
          fontSize: isSmallScreen ? scale(14) : scale(16),
          fontWeight: 'bold',
          color: '#0D1C6A',
          flex: 1
        }}>
          {t('wallet_balance.simulator')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default MonSolde;
