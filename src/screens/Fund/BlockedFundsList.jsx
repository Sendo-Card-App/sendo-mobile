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
  const [activeTab, setActiveTab] = useState('available'); // 'available' or 'my'

  const scrollX = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const { data: userProfile } = useGetUserProfileQuery();
  const { data: fundsData, isLoading, refetch } = useGetFundsQuery(
    { page: 1, limit: 10 },
     { pollingInterval: 1000 }
    );
  //console.log("User list in fundsData:", JSON.stringify(fundsData, null, 2));

  const userCountry = userProfile?.data?.user?.country || 'Cameroon';
  //console.log('User Country:', userCountry);
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
  // Navigate directly to ConfirmSubscription page
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
    if (funds.length === 0) return 10; // Valeur par défaut
    const total = funds.reduce((sum, fund) => sum + fund.annualCommission, 0);
    return (total / funds.length).toFixed(1);
  };

  const renderFundItem = ({ item, index }) => {
    const amount = isCAD ? item.amountCAD : item.amountXAF;
    const currency = isCAD ? 'CAD' : 'XAF';
    const annualCommission = (amount * item.annualCommission) / 100;
    
    // Get fund rank based on sorted funds
    const fundRank = sortedFunds.findIndex(f => f.id === item.id) + 1;

    return (
      <Animated.View 
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
        className="mx-4 mb-4"
      >
        <View 
          style={[styles.fundCard, { borderLeftWidth: 6, borderLeftColor: '#7ddd7d' }]}
          className="bg-white rounded-2xl p-5 shadow-lg"
        >
          {/* Fund Header with Rank Badge */}
          <View className="flex-row justify-between items-start mb-1">
            <View className="flex-1">
              <View className="flex-row items-center mb-2">
                {/* Rank Badge */}
                <View className="w-10 h-10 bg-[#7ddd7d] rounded-xl items-center justify-center mr-3">
                  <Text className="text-white font-bold text-lg">#{fundRank}</Text>
                </View>
                <View>
                  <Text className="text-xl font-bold text-gray-800">{item.name}</Text>
                  <Text className="text-gray-500 text-sm mt-1">
                    {t('blockedFunds.plan')} {fundRank} • {t('blockedFunds.annualInvestment')}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Investment Amount - Main Highlight */}
          <View className="bg-gradient-to-r from-[#7ddd7d]/10 to-[#7ddd7d]/5 rounded-2xl p-1 mb-2 border border-[#7ddd7d]/20">
            <View className="items-center">
              <Text className="text-gray-500 text-sm font-medium mb-1">
                {t('blockedFunds.investmentAmount')}
                
              </Text>
              <Text className="text-gray-900 text-3xl font-bold mb-1">
                {amount.toLocaleString()} <Text className="text-2xl">{currency}</Text>
              </Text>
            </View>
          </View>

          {/* Returns Section */}
          <View className="bg-gray-50 rounded-2xl p-1 mb-3">
            <View className="flex-row justify-between items-center">
              {/* Annual Return */}
              <View className="items-center flex-1">
                <View className="w-14 h-14 bg-[#7ddd7d] rounded-full items-center justify-center mb-2">
                  <MaterialIcons name="trending-up" size={24} color="white" />
                </View>
                <Text className="text-gray-600 text-xs font-medium">
                  {t('blockedFunds.annualReturn')}
                </Text>
                <Text className="text-[#7ddd7d] text-2xl font-bold mt-1">
                  {item.annualCommission}%
                </Text>
                <Text className="text-gray-500 text-xs">{t('blockedFunds.guaranteedRate')}</Text>
              </View>
              
              {/* Divider */}
              <View className="w-px h-16 bg-gray-200 mx-4" />
              
              {/* Annual Commission */}
              <View className="items-center flex-1">
                <View className="w-14 h-14 bg-[#7ddd7d]/20 rounded-full items-center justify-center mb-2">
                  <Ionicons name="cash-outline" size={24} color="#7ddd7d" />
                </View>
                <Text className="text-gray-600 text-xs font-medium">
                  {t('blockedFunds.annualCommission')}
                </Text>
                <Text className="text-gray-800 text-xl font-bold mt-1">
                  {annualCommission.toLocaleString()}
                </Text>
                <Text className="text-gray-500 text-xs">{currency}</Text>
              </View>
            </View>
          </View>

          {/* Investment Timeline */}
          <View className="mb-2">
            <View className="flex-row items-center mb-2">
              <Ionicons name="calendar-outline" size={18} color="#7ddd7d" />
              <Text className="text-gray-700 font-medium ml-2">
                {t('blockedFunds.investmentPeriod')}
              </Text>
            </View>
            
            <View className="bg-gray-50 rounded-xl p-3">
              <View className="flex-row justify-between items-center mb-2">
                <View className="items-center flex-1">
                  <View className="w-8 h-8 bg-[#7ddd7d] rounded-full items-center justify-center mb-1">
                    <Ionicons name="play" size={14} color="white" />
                  </View>
                  <Text className="text-gray-600 text-xs">{t('blockedFunds.startDate')}</Text>
                  <Text className="text-gray-800 text-sm font-semibold">
                    {new Date().getFullYear()}-01-01
                  </Text>
                </View>
                
                <View className="flex-1 px-2">
                  <View className="h-px bg-[#7ddd7d]/30 mx-2" />
                  <Text className="text-center text-xs text-gray-500 mt-1">
                    {t('blockedFunds.lockPeriod')}
                  </Text>
                </View>
                
                <View className="items-center flex-1">
                  <View className="w-8 h-8 bg-[#7ddd7d] rounded-full items-center justify-center mb-1">
                    <Ionicons name="lock-closed" size={14} color="white" />
                  </View>
                  <Text className="text-gray-600 text-xs">{t('blockedFunds.endDate')}</Text>
                  <Text className="text-gray-800 text-sm font-semibold">
                    {new Date().getFullYear()}-12-31
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Key Features */}
          <View className="flex-row justify-between mb-2">
            <View className="items-center flex-1">
              <View className="w-10 h-10 bg-[#7ddd7d]/10 rounded-full items-center justify-center mb-2">
                <Ionicons name="shield-checkmark-outline" size={20} color="#7ddd7d" />
              </View>
              <Text className="text-gray-700 text-xs font-medium">
                {t('blockedFunds.secure')}
              </Text>
            </View>
            
            <View className="items-center flex-1">
              <View className="w-10 h-10 bg-[#7ddd7d]/10 rounded-full items-center justify-center mb-2">
                <MaterialIcons name="verified" size={20} color="#7ddd7d" />
              </View>
              <Text className="text-gray-700 text-xs font-medium">
                {t('blockedFunds.guaranteed')}
              </Text>
            </View>
            
            <View className="items-center flex-1">
              <View className="w-10 h-10 bg-[#7ddd7d]/10 rounded-full items-center justify-center mb-2">
                <MaterialIcons name="savings" size={20} color="#7ddd7d" />
              </View>
              <Text className="text-gray-700 text-xs font-medium">
                {t('blockedFunds.highYield')}
              </Text>
            </View>
          </View>

          {/* Subscribe Button */}
          <TouchableOpacity
            onPress={() => handleSubscribe(item)}
            className="bg-[#7ddd7d] rounded-xl py-4 items-center justify-center shadow-md"
            style={{
              shadowColor: '#7ddd7d',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 5,
            }}
          >
            <Text className="text-white font-bold text-lg">{t('blockedFunds.subscribe')}</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <View className="flex-1 bg-[#F2F2F2]">
      <StatusBar backgroundColor="#7ddd7d" barStyle="light-content" />
      
      {/* Header Gradient */}
      <Animated.View 
        style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        className="bg-[#7ddd7d] pt-12 pb-6 px-6 rounded-b-3xl"
      >
        <View className="flex-row justify-between items-center mb-4">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="w-12 h-12 bg-white/20 rounded-2xl items-center justify-center"
          >
            <AntDesign name="left" size={24} color="black" />
          </TouchableOpacity>
          
          <View className="flex-1 items-center">
            <Text className="text-black font-bold text-2xl">{t('blockedFunds.title')}</Text>
            <Text className="text-black/90 text-sm">{t('blockedFunds.subtitle')}</Text>
          </View>
          
          <TouchableOpacity 
            onPress={navigateToMySubscriptions}
            className="w-12 h-12 bg-white/20 rounded-2xl items-center justify-center"
          >
            <Ionicons name="wallet-outline" size={22} color="black" />
          </TouchableOpacity>
        </View>

        {/* Welcome Section */}
        <View className="bg-white/20 rounded-2xl p-4 mb-1">
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-black font-bold text-lg">
                👋 {t('blockedFunds.welcome', { name: userName }) || `Bonjour ${userName}`}
              </Text>
              <Text className="text-black/90 text-sm mt-1">
                {t('blockedFunds.description')}
              </Text>
            </View>
            <View className="bg-black/30 p-3 rounded-xl">
              <MaterialIcons name="trending-up" size={28} color="white" />
            </View>
          </View>
        </View>

        {/* Stats Bar */}
        <View className="flex-row justify-between mt-1">
          <View className="items-center">
            <Text className="text-black font-bold text-xl">{funds.length}</Text>
            <Text className="text-black/90 text-xs">{t('blockedFunds.plansAvailable')}</Text>
          </View>
          <View className="items-center">
            <Text className="text-black font-bold text-xl">{getAverageCommission()}%</Text>
            <Text className="text-black/90 text-xs">{t('blockedFunds.annualReturn')}</Text>
          </View>
          <View className="items-center">
            <Text className="text-black font-bold text-xl">{new Date().getFullYear()}</Text>
            <Text className="text-black/90 text-xs">{t('blockedFunds.year')}</Text>
          </View>
        </View>
      </Animated.View>

      {/* Content */}
      <View className="flex-1 px-4 pt-1">
        {/* Tab Navigation */}
        <View className="flex-row bg-white rounded-xl p-1 mb-6 shadow-md">
          <TouchableOpacity
            onPress={() => setActiveTab('available')}
            className={`flex-1 py-3 rounded-lg ${activeTab === 'available' ? 'bg-[#7ddd7d] shadow-md' : ''}`}
          >
            <Text className={`text-center font-bold ${activeTab === 'available' ? 'text-white' : 'text-gray-600'}`}>
               {t('tabs2.fundsList')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={navigateToMySubscriptions}
            className={`flex-1 py-3 rounded-lg ${activeTab === 'my' ? 'bg-[#7ddd7d] shadow-md' : ''}`}
          >
            <Text className={`text-center font-bold ${activeTab === 'my' ? 'text-white' : 'text-gray-600'}`}>
               {t('tabs2.myInvestments')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Available Funds List */}
        {activeTab === 'available' && (
          <>
            <View className="flex-row justify-between items-center mb-1">
              <Text className="text-gray-800 text-lg font-bold">{t('blockedFunds.investmentPlans')}</Text>
              <TouchableOpacity onPress={refetch} className="flex-row items-center">
                <Ionicons name="refresh" size={20} color="#7ddd7d" />
                <Text className="text-[#5dc75d] text-sm ml-1 font-medium">
                  {t('blockedFunds.refresh')}
                </Text>
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <View className="mt-4">
                {[1, 2, 3].map((_, index) => (
                  <FundSkeleton key={index} />
                ))}
              </View>
            ) : (
              <FlatList
                data={sortedFunds} // Use sorted funds instead of original funds
                renderItem={renderFundItem}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
                ListEmptyComponent={
                  <View className="items-center justify-center py-20">
                    <View className="bg-white p-8 rounded-2xl items-center shadow-lg">
                      <Ionicons name="wallet-outline" size={80} color="#7ddd7d" />
                      <Text className="text-gray-800 text-xl font-bold mt-4">
                        {t('blockedFunds.noFunds')}
                      </Text>
                      <Text className="text-gray-500 text-center mt-2">
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
      <Ionicons name={icon} size={18} color={color} />
      <Text className="text-gray-600 font-medium ml-2">{label}</Text>
    </View>
    <Text className="text-gray-800 font-bold">{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  header: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 15,
  },
  fundCard: {
    borderLeftWidth: 6,
    borderLeftColor: '#7ddd7d',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  subscribeButton: {
    shadowColor: '#7ddd7d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  fab: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#7ddd7d',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    maxHeight: SCREEN_HEIGHT * 0.8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.4,
    shadowRadius: 30,
    elevation: 30,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0a0c0f',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButton: {
    shadowColor: '#7ddd7d',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 15,
  },
  cancelButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
});

export default BlockedFundsList;