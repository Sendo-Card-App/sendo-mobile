import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons, FontAwesome5, MaterialIcons, AntDesign } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useGetMySubscriptionsQuery } from '../../services/Fund/fundSubscriptionApi';
import { useGetUserProfileQuery } from "../../services/Auth/authAPI";
import { useRequestWithdrawalMutation } from '../../services/Fund/fundSubscriptionApi';
import SubscriptionSkeleton from '../../components/SubscriptionSkeleton';

const MySubscriptions = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [selectedWithdrawalType, setSelectedWithdrawalType] = useState(null);
  const [showPinModal, setShowPinModal] = useState(false);

  const { data: userProfile } = useGetUserProfileQuery();
  const userId = userProfile?.data?.user?.id;
  
  const { data: subscriptionsData, isLoading, refetch } = useGetMySubscriptionsQuery(
    { userId, page: 1, limit: 20 },
    { skip: !userId }
  );
  
  const [requestWithdrawal, { isLoading: withdrawing }] = useRequestWithdrawalMutation();

  const subscriptions = subscriptionsData?.data?.items || [];
  const userCountry = userProfile?.data?.user?.country || 'CAMEROON';
  const isCAD = userCountry === 'CANADA';

  const calculateInterest = (subscription) => {
    const amount = isCAD ? subscription.fund.amountCAD : subscription.fund.amountXAF;
    const commission = subscription.fund.annualCommission;
    const startDate = new Date(subscription.createdAt || subscription.startDate);
    const now = new Date();
    const daysSinceStart = Math.floor((now - startDate) / (1000 * 60 * 60 * 24));
    const annualInterest = (amount * commission) / 100;
    const interestEarned = (annualInterest * daysSinceStart) / 365;
    
    const actualInterestEarned = subscription.interestAmount > 0 ? subscription.interestAmount : interestEarned;
    
    return {
      interestEarned: actualInterestEarned,
      annualInterest,
      daysSinceStart,
      progress: Math.min((daysSinceStart / 365) * 100, 100),
      commissionAmount: subscription.interestAmount || 0,
    };
  };

  // Fonction pour formater correctement les dates
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      
      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        console.log('Date invalide:', dateString);
        return 'N/A';
      }
      
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch (error) {
      console.log('Erreur de formatage de date:', error);
      return 'N/A';
    }
  };

  const handleWithdraw = (subscription, type) => {
    setSelectedSubscription(subscription);
    setSelectedWithdrawalType(type);
    setWithdrawModalVisible(true);
  };

  const handlePinVerified = async () => {
    setShowPinModal(false);
    
    try {
      const result = await requestWithdrawal({
        subscriptionId: selectedSubscription.id,
        type: selectedWithdrawalType,
      }).unwrap();
      
      console.log('Withdrawal result:', result);
      
      Alert.alert(
        t('blockedFunds.withdrawalSuccess'),
        t('blockedFunds.withdrawalSuccessMessage'),
        [
          {
            text: 'OK',
            onPress: () => {
              setWithdrawModalVisible(false);
              refetch();
            },
          },
        ]
      );
    } catch (error) {
      console.error('Withdrawal error:', error);
      Alert.alert(
        t('blockedFunds.withdrawalError'),
        error.data?.message || t('blockedFunds.withdrawalErrorMessage'),
        [{ 
          text: 'OK',
          onPress: () => {
            setWithdrawModalVisible(true);
          }
        }]
      );
    }
  };

  const confirmWithdrawal = () => {
    if (!selectedWithdrawalType) {
      Alert.alert('Erreur', 'Veuillez sélectionner un type de retrait');
      return;
    }
    
    setWithdrawModalVisible(false);
    setShowPinModal(true);
  };

  const handlePinCancel = () => {
    setShowPinModal(false);
    setWithdrawModalVisible(true);
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'ACTIVE':
        return { color: '#10B981', bg: '#D1FAE5', icon: 'checkmark-circle', label: 'Actif' };
      case 'PENDING':
        return { color: '#F59E0B', bg: '#FEF3C7', icon: 'time-outline', label: 'En attente' };
      case 'COMPLETED':
        return { color: '#3B82F6', bg: '#DBEAFE', icon: 'checkmark-done', label: 'Terminé' };
      case 'WITHDRAWN':
        return { color: '#8B5CF6', bg: '#EDE9FE', icon: 'cash-outline', label: 'Retiré' };
      case 'MATURED':
        return { color: '#FF6B6B', bg: '#FFE5E5', icon: 'calendar-outline', label: 'Mature' };
      case 'CANCELLED':
        return { color: '#EF4444', bg: '#FEE2E2', icon: 'close-circle', label: 'Annulé' };
      default:
        return { color: '#6B7280', bg: '#F3F4F6', icon: 'help-circle', label: status };
    }
  };

  const canWithdraw = (subscription) => {
    const { interestEarned } = calculateInterest(subscription);
    const withdrawableStatuses = ['ACTIVE', 'MATURED'];
    
    return (
      withdrawableStatuses.includes(subscription.status) && 
      interestEarned > 0
    );
  };

  const renderSubscriptionItem = ({ item, index }) => {
    const { interestEarned, annualInterest, progress, commissionAmount } = calculateInterest(item);
    const amount = isCAD ? item.fund.amountCAD : item.fund.amountXAF;
    const currency = isCAD ? 'CAD' : 'XAF';
    const statusConfig = getStatusConfig(item.status);
    
    const startDate = formatDate(item.startDate || item.createdAt);
    const endDate = formatDate(item.endDate);
    
    const availableAmount = item.status === 'MATURED' ? commissionAmount : interestEarned;

    return (
      <View style={styles.subscriptionCard}>
        <View className="flex-row justify-between items-start mb-4">
          <View className="flex-1">
            <View className="flex-row items-center mb-2">
              <View style={{ backgroundColor: statusConfig.bg }} className="p-2 rounded-lg mr-3">
                <Ionicons name={statusConfig.icon} size={20} color={statusConfig.color} />
              </View>
              <View>
                <Text className="text-xl font-bold text-gray-800">{item.fund.name}</Text>
                <Text className="text-gray-500 text-xs">ID: {item.id.substring(0, 8)}...</Text>
              </View>
            </View>
          </View>
          <View style={{ backgroundColor: statusConfig.bg }} className="px-3 py-1 rounded-full">
            <Text style={{ color: statusConfig.color }} className="text-sm font-semibold">
              {statusConfig.label}
            </Text>
          </View>
        </View>

        <View className="mb-4">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-gray-700 font-medium">{t('blockedFunds.investmentAmount')}</Text>
            <Text className="text-2xl font-bold text-gray-900">
              {item.amount.toLocaleString()} <Text className="text-lg">{item.currency}</Text>
            </Text>
          </View>
          
          {item.status === 'ACTIVE' && (
            <View className="mb-1">
              <Text className="text-gray-600 text-sm mb-1">
                Progression: {progress.toFixed(1)}%
              </Text>
              <View className="h-2 bg-gray-200 rounded-full">
                <View 
                  style={{ 
                    width: `${progress}%`,
                    backgroundColor: progress > 70 ? '#10B981' : progress > 30 ? '#3B82F6' : '#F59E0B'
                  }} 
                  className="h-full rounded-full"
                />
              </View>
            </View>
          )}
          
          {item.status === 'MATURED' && (
            <View className="bg-red-100 px-3 py-1 rounded-full items-center mb-2">
              <Text className="text-red-700 text-xs font-bold">
                ⚠️ Fonds arrivés à maturité - Prêts au retrait
              </Text>
            </View>
          )}
        </View>

        <View className="grid grid-cols-2 gap-3 mb-4">
          <DetailItem 
            label={t('blockedFunds.startDate')}
            value={startDate}
            icon="play-outline"
          />
          <DetailItem 
            label={t('blockedFunds.endDate')}
            value={endDate}
            icon="calendar-outline"
          />
          <DetailItem 
            label={t('blockedFunds.annualCommission')}
            value={`${item.commissionRate}%`}
            icon="trending-up-outline"
          />
          <DetailItem 
            label={item.status === 'MATURED' ? 'Commission totale' : t('blockedFunds.interestEarned')}
            value={`${availableAmount.toFixed(2).toLocaleString()} ${item.currency}`}
            icon="cash-outline"
            highlight={availableAmount > 0}
          />
        </View>

        {canWithdraw(item) && (
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => handleWithdraw(item, 'INTEREST_ONLY')}
              style={styles.withdrawButton}
              className="flex-1 bg-green-500 rounded-xl py-3 items-center"
            >
              <Text className="text-white font-bold">
                {item.status === 'MATURED' ? 'Retirer' : t('blockedFunds.withdrawInterest')}
              </Text>
            </TouchableOpacity>
           
          </View>
        )}

        {!canWithdraw(item) && (
          <View className="bg-gray-100 rounded-lg p-3 mt-2">
            <Text className="text-gray-600 text-sm text-center">
              {item.status === 'WITHDRAWN' ? '✅ Déjà retiré' : 
               item.status === 'CANCELLED' ? '❌ Investissement annulé' :
               item.status === 'PENDING' ? '⏳ En attente d\'activation' :
               '💤 Aucune commission disponible pour le moment'}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const calculateStats = () => {
    let totalInvested = 0;
    let totalInterest = 0;
    let totalCommission = 0;
    let maturedInvestments = 0;
    let activeInvestments = 0;

    subscriptions.forEach(sub => {
      totalInvested += sub.amount;
      totalInterest += calculateInterest(sub).interestEarned;
      totalCommission += sub.interestAmount || 0;
      
      if (sub.status === 'MATURED') maturedInvestments++;
      if (sub.status === 'ACTIVE') activeInvestments++;
    });

    return {
      totalInvested,
      totalInterest,
      totalCommission,
      maturedInvestments,
      activeInvestments,
    };
  };

  const stats = calculateStats();

  return (
    <View className="flex-1 bg-[#F2F2F2]">
      <View className="bg-[#7ddd7d] pt-12 pb-6 px-6 rounded-b-3xl">
        <View className="flex-row justify-between items-center mb-4">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="w-12 h-12 bg-white/20 rounded-2xl items-center justify-center"
          >
            <AntDesign name="left" size={24} color="white" />
          </TouchableOpacity>
          
          <View className="flex-1 items-center">
            <Text className="text-white font-bold text-2xl">{t('blockedFunds.mySubscriptions')}</Text>
            <Text className="text-white/90 text-sm">{t('blockedFunds.subtitle')}</Text>
          </View>
          
          <TouchableOpacity 
            onPress={refetch}
            className="w-12 h-12 bg-white/20 rounded-2xl items-center justify-center"
          >
            <Ionicons name="refresh" size={22} color="white" />
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-between bg-white/20 rounded-2xl p-4">
          <View className="items-center">
            <Text className="text-white font-bold text-2xl">
              {subscriptions.length}
            </Text>
            <Text className="text-white/90 text-xs">{t('blockedFunds.totalInvestments')}</Text>
          </View>
          <View className="items-center">
            <Text className="text-white font-bold text-2xl">
              {stats.maturedInvestments}
            </Text>
            <Text className="text-white/90 text-xs">Matures</Text>
          </View>
          <View className="items-center">
            <Text className="text-white font-bold text-2xl">
              {stats.totalCommission > 0 ? stats.totalCommission.toFixed(0) : stats.totalInterest.toFixed(0)}
            </Text>
            <Text className="text-white/90 text-xs">{t('blockedFunds.totalInterest')}</Text>
          </View>
        </View>
      </View>

      <View className="flex-1 px-6 pt-6">
        {isLoading ? (
          <View className="mt-4">
            {[1, 2, 3].map((_, index) => (
              <SubscriptionSkeleton key={index} />
            ))}
          </View>
        ) : (
          <FlatList
            data={subscriptions}
            renderItem={renderSubscriptionItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={
              <View className="items-center justify-center py-20">
                <View className="bg-white p-8 rounded-2xl items-center shadow-lg">
                  <FontAwesome5 name="wallet" size={80} color="#7ddd7d" />
                  <Text className="text-gray-800 text-xl font-bold mt-4">
                    {t('blockedFunds.noSubscriptions')}
                  </Text>
                  <Text className="text-gray-500 text-center mt-2">
                    {t('blockedFunds.noSubscriptionsDescription')}
                  </Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('BlockedFundsList')}
                    className="bg-gradient-to-r from-[#7ddd7d] to-[#5dc75d] rounded-xl px-8 py-3 mt-6"
                  >
                    <Text className="text-white font-bold">{t('blockedFunds.discoverFunds')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            }
          />
        )}
      </View>

      {/* Withdrawal Selection Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={withdrawModalVisible}
        onRequestClose={() => setWithdrawModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedSubscription && (
              <>
                <View className="items-center mb-6">
                  <View className="bg-gradient-to-r from-[#7ddd7d] to-[#5dc75d] p-4 rounded-2xl mb-4">
                    <FontAwesome5 name="hand-holding-usd" size={40} color="white" />
                  </View>
                  <Text className="text-2xl font-bold text-gray-800 mb-2">
                    {selectedSubscription.status === 'MATURED' ? 'Retrait des commissions' : t('blockedFunds.withdrawal')}
                  </Text>
                  <Text className="text-gray-600 text-center">
                    {selectedSubscription.status === 'MATURED' 
                      ? 'Vos fonds sont arrivés à maturité. Vous pouvez retirer vos commissions.' 
                      : t('blockedFunds.chooseWithdrawal')}
                  </Text>
                </View>

                <View className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-5 mb-6">
                  <Text className="text-gray-800 font-bold text-lg mb-3">
                    {selectedSubscription.fund.name}
                  </Text>
                  <DetailRow 
                    label="Statut"
                    value={getStatusConfig(selectedSubscription.status).label}
                  />
                  <DetailRow 
                    label={selectedSubscription.status === 'MATURED' ? 'Commission totale' : 'Intérêts acquis'}
                    value={`${calculateInterest(selectedSubscription).interestEarned.toFixed(2).toLocaleString()} ${selectedSubscription.currency}`}
                  />
                  <DetailRow 
                    label="Taux de commission"
                    value={`${selectedSubscription.commissionRate}%`}
                  />
                  <DetailRow 
                    label="Date de fin"
                    value={formatDate(selectedSubscription.endDate)}
                  />
                </View>

                <View className="space-y-3 mb-6">
                  <Text className="text-gray-700 font-bold">{t('blockedFunds.withdrawalType')}:</Text>
                  
                  <TouchableOpacity
                    onPress={() => setSelectedWithdrawalType('INTEREST_ONLY')}
                    style={[
                      styles.withdrawalOption,
                      selectedWithdrawalType === 'INTEREST_ONLY' && styles.selectedOption
                    ]}
                  >
                    <View className="flex-row items-center">
                      <View className={`w-6 h-6 rounded-full ${selectedWithdrawalType === 'INTEREST_ONLY' ? 'bg-[#7ddd7d]' : 'bg-gray-200'} mr-3 items-center justify-center`}>
                        {selectedWithdrawalType === 'INTEREST_ONLY' && (
                          <Ionicons name="checkmark" size={16} color="white" />
                        )}
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-800 font-bold">
                          {selectedSubscription.status === 'MATURED' ? 'Retirer commissions seulement' : t('blockedFunds.interestOnly')}
                        </Text>
                        <Text className="text-gray-600 text-sm">
                          {selectedSubscription.status === 'MATURED'
                            ? 'Retirer uniquement les commissions accumulées'
                            : t('blockedFunds.interestOnlyDescription')}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setSelectedWithdrawalType('FULL_WITHDRAWAL')}
                    style={[
                      styles.withdrawalOption,
                      selectedWithdrawalType === 'FULL_WITHDRAWAL' && styles.selectedOption
                    ]}
                  >
                    <View className="flex-row items-center">
                      <View className={`w-6 h-6 rounded-full ${selectedWithdrawalType === 'FULL_WITHDRAWAL' ? 'bg-purple-500' : 'bg-gray-200'} mr-3 items-center justify-center`}>
                        {selectedWithdrawalType === 'FULL_WITHDRAWAL' && (
                          <Ionicons name="checkmark" size={16} color="white" />
                        )}
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-800 font-bold">{t('blockedFunds.fullWithdrawal')}</Text>
                        <Text className="text-gray-600 text-sm">
                          {selectedSubscription.status === 'MATURED'
                            ? 'Retirer la totalité du fonds et des commissions'
                            : t('blockedFunds.fullWithdrawalDescription')}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>

                <View className="space-y-3">
                  <TouchableOpacity
                    onPress={confirmWithdrawal}
                    disabled={!selectedWithdrawalType || withdrawing}
                    className={`${!selectedWithdrawalType || withdrawing ? 'bg-gray-400' : 'bg-green-500'} rounded-xl py-4 items-center`}
                  >
                    {withdrawing ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="text-white font-bold text-lg">
                        {selectedSubscription.status === 'MATURED' ? 'Confirmer le retrait' : t('blockedFunds.confirmWithdrawal')}
                      </Text>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setWithdrawModalVisible(false)}
                    className="bg-gray-200 rounded-xl py-4 items-center"
                  >
                    <Text className="text-gray-700 font-bold">{t('blockedFunds.cancel')}</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* PIN Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showPinModal}
        onRequestClose={handlePinCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View className="items-center mb-6">
              <View className="bg-gradient-to-r from-[#7ddd7d] to-[#5dc75d] p-4 rounded-2xl mb-4">
                <Ionicons name="lock-closed" size={40} color="white" />
              </View>
              <Text className="text-2xl font-bold text-gray-800 mb-2">
                Validation du code PIN
              </Text>
              <Text className="text-gray-600 text-center">
                Veuillez entrer votre code PIN pour confirmer le retrait
              </Text>
            </View>

            <View className="space-y-4">
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate("Auth", {
                    screen: "PinCode",
                    params: {
                      onSuccess: handlePinVerified,
                      onCancel: handlePinCancel,
                    },
                  });
                  setShowPinModal(false);
                }}
                className="bg-green-500 rounded-xl py-4 items-center"
              >
                <Text className="text-white font-bold text-lg">Entrer le code PIN</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handlePinCancel}
                className="bg-gray-200 rounded-xl py-4 items-center"
              >
                <Text className="text-gray-700 font-bold">Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const DetailItem = ({ label, value, icon, highlight = false }) => (
  <View className="bg-white rounded-xl p-3 shadow-sm">
    <View className="flex-row items-center mb-1">
      <Ionicons name={icon} size={16} color="#6B7280" />
      <Text className="text-gray-600 text-xs ml-1">{label}</Text>
    </View>
    <Text className={`${highlight ? 'text-[#5dc75d]' : 'text-gray-800'} font-bold`}>
      {value}
    </Text>
  </View>
);

const DetailRow = ({ label, value }) => (
  <View className="flex-row justify-between items-center py-2 border-b border-gray-100">
    <Text className="text-gray-600">{label}</Text>
    <Text className="text-gray-800 font-bold">{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  subscriptionCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },
  withdrawButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 30,
  },
  withdrawalOption: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  selectedOption: {
    borderColor: '#7ddd7d',
    backgroundColor: '#f0f9f0',
  },
});

export default MySubscriptions;