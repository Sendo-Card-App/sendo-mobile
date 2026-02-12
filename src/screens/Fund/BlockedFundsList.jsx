import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  Modal,
  Alert,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons, MaterialIcons, FontAwesome5, AntDesign } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useGetFundsQuery } from '../../services/Fund/fundSubscriptionApi';
import { useGetUserProfileQuery } from "../../services/Auth/authAPI";
import FundSkeleton from '../../components/FundSkeleton';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TopLogo = require('../../images/TopLogo.png');

const BlockedFundsList = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [selectedFund, setSelectedFund] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('available');

  const scrollX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const { data: userProfile } = useGetUserProfileQuery();
  const { data: fundsData, isLoading, refetch } = useGetFundsQuery(
    { page: 1, limit: 10 },
    { pollingInterval: 1000 }
  );

  const userCountry = userProfile?.data?.user?.country || 'Cameroon';
  const isCAD = userCountry === 'Canada';
  const userName = userProfile?.data?.user?.firstname || '';
  
  const funds = fundsData?.data?.items || [];
  
  // Sort funds by amount from smallest to largest
  const sortedFunds = [...funds].sort((a, b) => 
    (isCAD ? a.amountCAD : a.amountXAF) - (isCAD ? b.amountCAD : b.amountXAF)
  );

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const calculateEndDate = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const subscriptionEnd = new Date(currentYear, 11, 31);
    return subscriptionEnd.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleSubscribe = (fund) => {
    navigation.navigate('ConfirmSubscription', {
      fund: fund,
      amount: isCAD ? fund.amountCAD : fund.amountXAF,
      currency: isCAD ? 'CAD' : 'XAF',
      annualCommission: fund.annualCommission,
    });
  };

  const navigateToMySubscriptions = () => {
    navigation.navigate('MySubscriptions');
  };

  // Calcul des statistiques
  const getAverageCommission = () => {
    if (funds.length === 0) return 10;
    const total = funds.reduce((sum, fund) => sum + fund.annualCommission, 0);
    return (total / funds.length).toFixed(1);
  };

const renderFundItem = ({ item, index }) => {
  const amount = isCAD ? item.amountCAD : item.amountXAF;
  const currency = isCAD ? 'CAD' : 'XAF';
  const annualCommission = (amount * item.annualCommission) / 100;
  const endDate = "31/12/2026"; // Date de fin fixe
  
  // Get fund rank based on sorted funds
  const fundRank = sortedFunds.findIndex(f => f.id === item.id) + 1;
  
  // Vert Sendo comme couleur principale
  const primaryColor = '#7ddd7d';
  const darkGreen = '#2C3E50'; // Vert foncé/gris pour les accents

  return (
    <Animated.View 
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
      className="mx-4 mb-4"
    >
      <View 
        style={[styles.fundCard]}
        className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100"
      >
        {/* Header - Design épuré style INV */}
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center">
            <View style={{ backgroundColor: '#F0F9F0' }} className="w-14 h-14 rounded-2xl items-center justify-center mr-3">
              <Text style={{ color: primaryColor }} className="font-bold text-2xl">
                #{fundRank}
              </Text>
            </View>
            <View>
              <Text className="text-2xl font-bold text-gray-900">
                {item.name}
              </Text>
              <Text className="text-gray-500 text-sm mt-1">
                {t('blockedFunds.plan')} {fundRank}
              </Text>
            </View>
          </View>
        </View>

        {/* Date de fin - Style épuré */}
        <View className="mb-4">
          <Text className="text-gray-500 text-xs font-medium mb-1">
            {t('blockedFunds.endDate') || 'Se termine le :'}
          </Text>
          <Text className="text-gray-900 text-xl font-bold">
            {endDate}
          </Text>
        </View>

        {/* Montant d'investissement */}
        <View className="mb-4">
          <Text className="text-gray-500 text-xs font-medium mb-1">
            {t('blockedFunds.investmentAmount')}
          </Text>
          <Text className="text-gray-900 text-3xl font-bold">
            {amount.toLocaleString()}{' '}
            <Text className="text-lg font-semibold text-gray-700">
              {currency}
            </Text>
          </Text>
        </View>

        {/* Commission annuelle et rendement - Ligne unique */}
        <View className="flex-row justify-between items-center mb-6">
          <View className="flex-1">
            <Text className="text-gray-500 text-xs font-medium mb-1">
              {t('blockedFunds.annualCommission')}
            </Text>
            <Text className="text-gray-900 text-2xl font-bold">
              {annualCommission.toLocaleString()}{' '}
              <Text className="text-sm font-semibold text-gray-700">
                {currency}
              </Text>
            </Text>
          </View>
          
          <View className="w-px h-10 bg-gray-200 mx-4" />
          
          <View className="flex-1">
            <Text className="text-gray-500 text-xs font-medium mb-1">
              {t('blockedFunds.annualReturn')}
            </Text>
            <View className="flex-row items-center">
              <Text style={{ color: primaryColor }} className="text-2xl font-bold">
                {item.annualCommission}%
              </Text>
            </View>
          </View>
        </View>

        {/* <TouchableOpacity 
          onPress={() => {
            setSelectedFund(item);
            setModalVisible(true);
          }}
          className="mb-6"
        >
          <Text style={{ color: primaryColor }} className="text-base font-semibold">
            {t('blockedFunds.moreInfo') || 'Plus d\'infos >'}
          </Text>
        </TouchableOpacity> */}

        {/* Bouton Souscrire */}
        <TouchableOpacity
          onPress={() => handleSubscribe(item)}
          style={{ 
            backgroundColor: primaryColor,
            shadowColor: darkGreen,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 6,
            elevation: 3,
          }}
          className="rounded-2xl py-5 items-center justify-center"
        >
          <Text className="text-white font-bold text-lg">
            {t('blockedFunds.subscribe')}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

  return (
    <View className="flex-1 bg-white">
      <StatusBar backgroundColor="#7ddd7d" barStyle="light-content" />
      
      {/* Header - Design minimaliste */}
      <Animated.View 
        style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        className="bg-white pt-12 pb-6 px-6 border-b border-gray-100"
      >
        <View className="flex-row justify-between items-center mb-4">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="w-12 h-12 bg-gray-50 rounded-2xl items-center justify-center"
          >
            <AntDesign name="left" size={22} color="#2C3E50" />
          </TouchableOpacity>
          
          <View className="flex-1 items-center">
            <Text className="text-gray-800 font-bold text-2xl">{t('blockedFunds.title')}</Text>
            <Text className="text-gray-500 text-sm">{t('blockedFunds.subtitle')}</Text>
          </View>
          
          <TouchableOpacity 
            onPress={navigateToMySubscriptions}
            className="w-12 h-12 bg-gray-50 rounded-2xl items-center justify-center"
          >
            <Ionicons name="wallet-outline" size={22} color="#2C3E50" />
          </TouchableOpacity>
        </View>

        {/* Welcome Section - Design épuré */}
        <View className="bg-gray-50 rounded-2xl p-4 mb-2">
          <View className="flex-row items-center">
            <View className="flex-1">
              <Text className="text-gray-800 font-bold text-lg">
                👋 {t('blockedFunds.welcome', { name: userName }) || `Bonjour ${userName}`}
              </Text>
              <Text className="text-gray-600 text-sm mt-1">
                {t('blockedFunds.description')}
              </Text>
            </View>
            <View className="bg-gray-200 p-3 rounded-xl">
              <MaterialIcons name="trending-up" size={24} color="#2C3E50" />
            </View>
          </View>
        </View>

        {/* Stats Bar - Design épuré */}
        <View className="flex-row justify-between mt-2">
          <View className="items-center">
            <Text className="text-gray-800 font-bold text-xl">{funds.length}</Text>
            <Text className="text-gray-500 text-xs">{t('blockedFunds.plansAvailable')}</Text>
          </View>
          <View className="items-center">
            <Text className="text-gray-800 font-bold text-xl">{getAverageCommission()}%</Text>
            <Text className="text-gray-500 text-xs">{t('blockedFunds.avgReturn') || 'Rendement moy.'}</Text>
          </View>
          <View className="items-center">
            <Text className="text-gray-800 font-bold text-xl">{new Date().getFullYear()}</Text>
            <Text className="text-gray-500 text-xs">{t('blockedFunds.year')}</Text>
          </View>
        </View>
      </Animated.View>

      {/* Content */}
      <View className="flex-1 px-4 pt-4">
        {/* Tab Navigation - Design épuré */}
        <View className="flex-row bg-gray-50 rounded-xl p-1 mb-6">
          <TouchableOpacity
            onPress={() => setActiveTab('available')}
            className={`flex-1 py-3 rounded-lg ${activeTab === 'available' ? 'bg-white shadow-sm' : ''}`}
          >
            <Text className={`text-center font-medium ${activeTab === 'available' ? 'text-gray-800' : 'text-gray-500'}`}>
              {t('tabs2.fundsList')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={navigateToMySubscriptions}
            className={`flex-1 py-3 rounded-lg ${activeTab === 'my' ? 'bg-white shadow-sm' : ''}`}
          >
            <Text className={`text-center font-medium ${activeTab === 'my' ? 'text-gray-800' : 'text-gray-500'}`}>
              {t('tabs2.myInvestments')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Available Funds List */}
        {activeTab === 'available' && (
          <>
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-gray-800 text-lg font-bold">{t('blockedFunds.investmentPlans')}</Text>
              <TouchableOpacity onPress={refetch} className="flex-row items-center">
                <Ionicons name="refresh" size={18} color="#2C3E50" />
                <Text className="text-gray-600 text-sm ml-1 font-medium">
                  {t('blockedFunds.refresh')}
                </Text>
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <View className="mt-2">
                {[1, 2, 3].map((_, index) => (
                  <FundSkeleton key={index} />
                ))}
              </View>
            ) : (
              <FlatList
                data={sortedFunds}
                renderItem={renderFundItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
                ListEmptyComponent={
                  <View className="items-center justify-center py-16">
                    <View className="bg-white p-8 rounded-2xl items-center">
                      <View className="bg-gray-50 p-6 rounded-full mb-4">
                        <Ionicons name="wallet-outline" size={60} color="#2C3E50" />
                      </View>
                      <Text className="text-gray-800 text-xl font-bold mt-2">
                        {t('blockedFunds.noFunds')}
                      </Text>
                      <Text className="text-gray-500 text-center mt-2 px-6">
                        {t('blockedFunds.noFundsDescription')}
                      </Text>
                    </View>
                  </View>
                }
              />
            )}
          </>
        )}
      </View>
    </View>
  );
};

const DetailRow = ({ label, value, icon, color }) => (
  <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
    <View className="flex-row items-center">
      <Ionicons name={icon} size={18} color={color || '#2C3E50'} />
      <Text className="text-gray-600 ml-2">{label}</Text>
    </View>
    <Text className="text-gray-800 font-semibold">{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  header: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  fundCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#2C3E50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  subscribeButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
});

export default BlockedFundsList;