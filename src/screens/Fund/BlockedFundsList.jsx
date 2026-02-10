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
  const { data: fundsData, isLoading, refetch } = useGetFundsQuery({ page: 1, limit: 10 });
  
  const userCountry = userProfile?.data?.user?.country || 'CAMEROON';
  const isCAD = userCountry === 'CANADA';
  const userName = userProfile?.data?.user?.firstname || '';
  
  const funds = fundsData?.data?.items || [];

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
    setSelectedFund(fund);
    setModalVisible(true);
  };

  const confirmSubscription = () => {
    if (selectedFund) {
      setModalVisible(false);
      navigation.navigate('ConfirmSubscription', {
        fund: selectedFund,
        amount: isCAD ? selectedFund.amountCAD : selectedFund.amountXAF,
        currency: isCAD ? 'CAD' : 'XAF',
      });
    }
  };

  const navigateToMySubscriptions = () => {
    navigation.navigate('MySubscriptions');
  };

  const getFundColor = (index) => {
    const colors = ['#396a2b', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
    return colors[index % colors.length];
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
    const fundColor = getFundColor(index);

    return (
      <Animated.View 
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
        className="mx-4 mb-4"
      >
        <View 
          style={[styles.fundCard, { borderLeftColor: fundColor }]}
          className="bg-white rounded-xl p-4 shadow-lg"
        >
          {/* Badge Premium */}
          <View className="absolute -top-3 right-4 bg-gradient-to-r from-purple-600 to-pink-500 px-3 py-1 rounded-full shadow-md">
            <Text className="text-white text-xs font-bold">🔥 {t('blockedFunds.guaranteed')}</Text>
          </View>

          <View className="flex-row justify-between items-start mb-4">
            <View className="flex-1 pr-4">
              <View className="flex-row items-center mb-2">
                <View style={{ backgroundColor: fundColor + '20' }} className="p-2 rounded-lg mr-3">
                  <FontAwesome5 name="coins" size={16} color={fundColor} />
                </View>
                <Text className="text-xl font-bold text-gray-800">{item.name}</Text>
              </View>
              
              <View className="bg-gradient-to-r from-gray-50 to-white rounded-lg p-3 mb-3">
                <Text className="text-2xl font-extrabold text-gray-900 mb-1">
                  {amount.toLocaleString()} <Text className="text-base">{currency}</Text>
                </Text>
                <Text className="text-gray-500 text-xs">{t('blockedFunds.investmentAmount')}</Text>
              </View>

              {/* Commission Card */}
              <View className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-3 mb-3">
                <View className="flex-row justify-between items-center">
                  <View>
                    <Text className="text-gray-700 text-xs font-semibold">
                      {t('blockedFunds.annualReturn')}
                    </Text>
                    <Text className="text-green-600 text-lg font-bold">
                      {item.annualCommission}%
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-gray-700 text-xs font-semibold">
                      {t('blockedFunds.annualCommission')}
                    </Text>
                    <Text className="text-gray-800 text-base font-bold">
                      {annualCommission.toLocaleString()} {currency}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Timeline */}
              <View className="flex-row items-center justify-between bg-blue-50 rounded-lg p-2 mb-3">
                <View className="flex-row items-center">
                  <Ionicons name="calendar-outline" size={14} color="#3B82F6" />
                  <Text className="text-gray-600 text-xs ml-2 font-medium">
                    {new Date().getFullYear()}-01-01 → {new Date().getFullYear()}-06-30
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="lock-closed-outline" size={14} color="#3B82F6" />
                  <Text className="text-gray-600 text-xs ml-2 font-medium">
                    {new Date().getFullYear()}-12-31
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Features */}
          <View className="flex-row flex-wrap gap-2 mb-3">
            <View className="bg-purple-100 px-2 py-1 rounded-full">
              <Text className="text-purple-700 text-xs font-semibold">🔒 {t('blockedFunds.secure')}</Text>
            </View>
            <View className="bg-green-100 px-2 py-1 rounded-full">
              <Text className="text-green-700 text-xs font-semibold">📈 {t('blockedFunds.guaranteed')}</Text>
            </View>
            <View className="bg-blue-100 px-2 py-1 rounded-full">
              <Text className="text-blue-700 text-xs font-semibold">💸 {t('blockedFunds.taxFree')}</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => handleSubscribe(item)}
            style={[styles.subscribeButton, { backgroundColor: fundColor }]}
            className="rounded-lg py-3 items-center shadow-md"
          >
            <Text className="text-white/90 text-sm mt-1">{t('blockedFunds.subscribe')}</Text>
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
                data={funds}
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

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={navigateToMySubscriptions}
        style={styles.fab}
        className="absolute bottom-6 right-6 bg-gradient-to-r from-[#7ddd7d] to-[#5dc75d] rounded-full p-4 shadow-2xl"
      >
        <View className="flex-row items-center">
          <Ionicons name="wallet" size={24} color="black" />
          <Text className="text-black font-bold ml-2">{t('blockedFunds.mySubscriptions')}</Text>
        </View>
      </TouchableOpacity>

      {/* Confirmation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[styles.modalContent, { opacity: fadeAnim }]}
            className="bg-gradient-to-b from-gray-100 to-gray-200 rounded-3xl"
          >
            {selectedFund && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="p-6">
                  {/* Modal Header */}
                  <View className="items-center mb-6">
                    <View className="bg-gradient-to-r from-[#7ddd7d] to-[#5dc75d] p-4 rounded-2xl mb-4 shadow-md">
                      <Ionicons name="shield-checkmark" size={40} color="green" />
                    </View>
                    <Text style={styles.modalTitle}>
                      {t('blockedFunds.confirmation')}
                    </Text>
                    <Text className="text-black text-center">
                      {t('blockedFunds.confirmSubscription')}
                    </Text>
                  </View>

                  {/* Fund Details */}
                  <View className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-5 mb-6">
                    <View className="flex-row justify-between items-center mb-4">
                      <Text className="text-black font-bold text-lg">
                        {selectedFund.name}
                      </Text>
                      <View className="bg-green-100 px-3 py-1 rounded-full">
                        <Text className="text-green-700 font-bold">
                          {selectedFund.annualCommission}%
                        </Text>
                      </View>
                    </View>

                    <View className="space-y-3">
                      <DetailRow 
                        label={t('blockedFunds.investmentAmount')}
                        value={`${(isCAD ? selectedFund.amountCAD : selectedFund.amountXAF).toLocaleString()} ${isCAD ? 'CAD' : 'XAF'}`}
                        icon="cash-outline"
                        color="#10B981"
                      />
                      <DetailRow 
                        label={t('blockedFunds.annualCommission')}
                        value={`${((isCAD ? selectedFund.amountCAD : selectedFund.amountXAF) * selectedFund.annualCommission / 100).toLocaleString()} ${isCAD ? 'CAD' : 'XAF'}`}
                        icon="trending-up-outline"
                        color="#3B82F6"
                      />
                      <DetailRow 
                        label={t('blockedFunds.lockPeriod')}
                        value={calculateEndDate()}
                        icon="calendar-outline"
                        color="#F59E0B"
                      />
                      <DetailRow 
                        label={t('blockedFunds.startDate')}
                        value={`${new Date().getFullYear()}-01-01`}
                        icon="play-outline"
                        color="#8B5CF6"
                      />
                    </View>
                  </View>

                  {/* Terms Acceptance */}
                  <View className="bg-blue-50 rounded-xl p-4 mb-6">
                    <View className="flex-row items-start">
                      <Ionicons name="information-circle" size={20} color="#3B82F6" />
                      <Text className="text-blue-800 text-sm ml-2 flex-1">
                        {t('blockedFunds.termsAcceptance')}{' '}
                        <Text className="font-bold text-blue-900">
                          {t('blockedFunds.readTerms')}
                        </Text>
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View className="space-y-3">
                    <TouchableOpacity
                      style={[styles.modalButton, styles.confirmButton]}
                      onPress={confirmSubscription}
                      className="bg-gradient-to-r from-[#7ddd7d] to-[#5dc75d] rounded-xl py-4 shadow-md"
                    >
                      <Text className="text-white font-bold text-lg text-center">
                        {t('blockedFunds.confirmSubscription')}
                      </Text>
                      <Text className="text-white/90 text-center text-sm">
                        {t('blockedFunds.continue')}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.modalButton, styles.cancelButton]}
                      onPress={() => setModalVisible(false)}
                      className="bg-gray-200 rounded-xl py-4"
                    >
                      <Text className="text-gray-700 font-bold text-center">
                        {t('blockedFunds.cancel')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            )}
          </Animated.View>
        </View>
      </Modal>
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
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  subscribeButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
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