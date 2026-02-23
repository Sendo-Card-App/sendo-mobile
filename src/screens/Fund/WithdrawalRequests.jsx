import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons, FontAwesome5, AntDesign, MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useGetWithdrawalRequestsQuery } from '../../services/Fund/fundSubscriptionApi';
import { useGetUserProfileQuery } from "../../services/Auth/authAPI";
import SubscriptionSkeleton from '../../components/SubscriptionSkeleton';

const WithdrawalRequests = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { subscriptionId } = route.params || {};
  
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: userProfile } = useGetUserProfileQuery();
  const userId = userProfile?.data?.user?.id;

  const { 
    data: withdrawalData, 
    isLoading, 
    refetch,
    isFetching 
  } = useGetWithdrawalRequestsQuery(
    { 
      userId, 
      page, 
      limit,
      subscriptionId 
    },
    {
      skip: !userId,
    }
  );

  const withdrawalRequests = withdrawalData?.data?.items || [];
  const totalPages = withdrawalData?.data?.totalPages || 1;
  const totalItems = withdrawalData?.data?.totalItems || 0;

  // console.log('Withdrawal Requests:', withdrawalRequests);
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'N/A';
    }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case 'PENDING':
        return { 
          color: '#F59E0B', 
          bg: '#FEF3C7', 
          icon: 'time-outline', 
          label: 'En attente',
          progress: '⏳'
        };
      case 'PROCESSING':
        return { 
          color: '#3B82F6', 
          bg: '#DBEAFE', 
          icon: 'sync-outline', 
          label: 'En traitement',
          progress: '🔄'
        };
      case 'COMPLETED':
        return { 
          color: '#10B981', 
          bg: '#D1FAE5', 
          icon: ' checkmark-circle', 
          label: 'Complété',
          progress: '✅'
        };
      case 'REJECTED':
        return { 
          color: '#EF4444', 
          bg: '#FEE2E2', 
          icon: 'close-circle', 
          label: 'Rejeté',
          progress: '❌'
        };
      case 'CANCELLED':
        return { 
          color: '#6B7280', 
          bg: '#F3F4F6', 
          icon: 'ban-outline', 
          label: 'Annulé',
          progress: '🚫'
        };
      default:
        return { 
          color: '#6B7280', 
          bg: '#F3F4F6', 
          icon: 'help-circle', 
          label: status,
          progress: '❓'
        };
    }
  };

  const getWithdrawalTypeLabel = (type) => {
    switch (type) {
      case 'INTEREST_ONLY':
        return { label: 'Intérêts seulement', icon: 'cash-outline', color: '#10B981' };
      case 'FULL_WITHDRAWAL':
        return { label: 'Retrait total', icon: 'wallet-outline', color: '#8B5CF6' };
      default:
        return { label: type, icon: 'help-circle-outline', color: '#6B7280' };
    }
  };

  const loadMore = () => {
    if (page < totalPages && !isFetching) {
      setPage(prev => prev + 1);
    }
  };

  const renderWithdrawalItem = ({ item }) => {
    const statusConfig = getStatusConfig(item.status);
    const typeConfig = getWithdrawalTypeLabel(item.type);
    
    return (
      <TouchableOpacity
        style={styles.requestCard}
        onPress={() => {
          setSelectedRequest(item);
          setDetailsModalVisible(true);
        }}
        activeOpacity={0.7}
      >
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-row items-center flex-1">
            <View style={{ backgroundColor: statusConfig.bg }} className="p-2.5 rounded-xl mr-3">
              <Ionicons name={statusConfig.icon} size={22} color={statusConfig.color} />
            </View>
            <View className="flex-1">
              <Text className="text-gray-800 font-bold text-base" numberOfLines={1}>
                {item.fundSubscription?.fund?.name || 'Fonds d\'investissement'}
              </Text>
              <View className="flex-row items-center mt-1">
                <MaterialIcons name="attach-money" size={14} color="#6B7280" />
                <Text className="text-gray-600 text-xs ml-1">
                  {item.fundSubscription?.amount?.toLocaleString()} {item.fundSubscription?.currency || 'CAD'}
                </Text>
              </View>
            </View>
          </View>
          <View style={{ backgroundColor: statusConfig.bg }} className="px-3 py-1.5 rounded-full">
            <Text style={{ color: statusConfig.color }} className="text-xs font-bold">
              {statusConfig.progress} {statusConfig.label}
            </Text>
          </View>
        </View>

        <View className="flex-row justify-between items-center bg-gray-50 p-3 rounded-xl">
          <View className="flex-row items-center">
            <View style={{ backgroundColor: typeConfig.color + '20' }} className="p-2 rounded-lg mr-2">
              <Ionicons name={typeConfig.icon} size={16} color={typeConfig.color} />
            </View>
            <View>
              <Text className="text-gray-500 text-xs">Type de retrait</Text>
              <Text className="text-gray-800 font-semibold text-sm">{typeConfig.label}</Text>
            </View>
          </View>
          
          <View className="items-end">
            <Text className="text-gray-500 text-xs">Date</Text>
            <Text className="text-gray-800 text-xs font-medium">{formatDate(item.createdAt)}</Text>
          </View>
        </View>

        {item.processedAt && (
          <View className="mt-2 flex-row items-center">
            <Ionicons name="checkmark-done-circle" size={14} color="#10B981" />
            <Text className="text-gray-500 text-xs ml-1">
              Traité le: {formatDate(item.processedAt)}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-[#F2F2F2]">
      {/* Header */}
      <View className="bg-[#7ddd7d] pt-12 pb-6 px-6 rounded-b-3xl">
        <View className="flex-row justify-between items-center mb-4">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="w-12 h-12 bg-white/20 rounded-2xl items-center justify-center"
          >
            <AntDesign name="left" size={24} color="white" />
          </TouchableOpacity>
          
          <View className="flex-1 items-center">
            <Text className="text-white font-bold text-2xl">Demandes de retrait</Text>
            <Text className="text-white/90 text-sm">Suivez vos retraits</Text>
          </View>
          
          <TouchableOpacity 
            onPress={refetch}
            className="w-12 h-12 bg-white/20 rounded-2xl items-center justify-center"
          >
            <Ionicons name="refresh" size={22} color="white" />
          </TouchableOpacity>
        </View>

        {/* Stats Summary */}
        <View className="flex-row justify-between bg-white/20 rounded-2xl p-4">
          <View className="items-center">
            <Text className="text-white font-bold text-2xl">{totalItems}</Text>
            <Text className="text-white/90 text-xs">Total demandes</Text>
          </View>
          <View className="items-center">
            <Text className="text-white font-bold text-2xl">
              {withdrawalRequests.filter(r => r.status === 'PENDING').length}
            </Text>
            <Text className="text-white/90 text-xs">En attente</Text>
          </View>
          <View className="items-center">
            <Text className="text-white font-bold text-2xl">
              {withdrawalRequests.filter(r => r.status === 'COMPLETED').length}
            </Text>
            <Text className="text-white/90 text-xs">Complétés</Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <View className="flex-1 px-6 pt-6">
        {isLoading ? (
          <View className="mt-4">
            {[1, 2, 3].map((_, index) => (
              <SubscriptionSkeleton key={index} />
            ))}
          </View>
        ) : (
          <FlatList
            data={withdrawalRequests}
            renderItem={renderWithdrawalItem}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={
              <RefreshControl refreshing={isFetching} onRefresh={refetch} />
            }
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            ListEmptyComponent={
              <View className="items-center justify-center py-20">
                <View className="bg-white p-8 rounded-2xl items-center shadow-lg">
                  <FontAwesome5 name="exchange-alt" size={80} color="#7ddd7d" />
                  <Text className="text-gray-800 text-xl font-bold mt-4">
                    Aucune demande de retrait
                  </Text>
                  <Text className="text-gray-500 text-center mt-2">
                    Vous n'avez pas encore effectué de demande de retrait.
                  </Text>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('MySubscriptions')}
                    className="bg-gradient-to-r from-[#7ddd7d] to-[#5dc75d] rounded-xl px-8 py-3 mt-6"
                  >
                    <Text className="text-white font-bold">Voir mes investissements</Text>
                  </TouchableOpacity>
                </View>
              </View>
            }
            ListFooterComponent={
              isFetching && page > 1 ? (
                <View className="py-4">
                  <ActivityIndicator size="large" color="#7ddd7d" />
                </View>
              ) : null
            }
          />
        )}
      </View>

      {/* Details Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={detailsModalVisible}
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedRequest && (
              <>
                <View className="items-center mb-4">
                  <View className="bg-gradient-to-r from-[#7ddd7d] to-[#5dc75d] p-4 rounded-2xl mb-3">
                    <Ionicons name="receipt-outline" size={40} color="white" />
                  </View>
                  <Text className="text-2xl font-bold text-gray-800 mb-1">
                    Détails du retrait
                  </Text>
                </View>

                <View className="bg-gray-50 rounded-2xl p-5 mb-4">
                  <View className="flex-row justify-between items-center mb-4 pb-3 border-b border-gray-200">
                    <Text className="text-gray-600 font-medium">Statut</Text>
                    <View style={{ backgroundColor: getStatusConfig(selectedRequest.status).bg }} className="px-4 py-2 rounded-full">
                      <Text style={{ color: getStatusConfig(selectedRequest.status).color }} className="font-bold">
                        {getStatusConfig(selectedRequest.status).label}
                      </Text>
                    </View>
                  </View>
                  
                  <DetailRow 
                    label="Montant investi"
                    value={`${selectedRequest.fundSubscription?.amount?.toLocaleString()} ${selectedRequest.fundSubscription?.currency || 'CAD'}`}
                    icon="cash-outline"
                  />
                   <DetailRow 
                    label="Interrêts générés"
                    value={`${selectedRequest.fundSubscription?.interestAmount?.toLocaleString()} ${selectedRequest.fundSubscription?.currency || 'CAD'}`}
                    icon="cash-outline"
                  />
                  <DetailRow 
                    label="Type de retrait"
                    value={getWithdrawalTypeLabel(selectedRequest.type).label}
                    icon="swap-horizontal-outline"
                  />
                  <DetailRow 
                    label="Date de demande"
                    value={formatDate(selectedRequest.createdAt)}
                    icon="calendar-outline"
                  />
                  {selectedRequest.processedAt && (
                    <DetailRow 
                      label="Date de traitement"
                      value={formatDate(selectedRequest.processedAt)}
                      icon="checkmark-done-circle-outline"
                    />
                  )}
                </View>

                <TouchableOpacity
                  onPress={() => {
                    setDetailsModalVisible(false);
                    navigation.navigate('MySubscriptions', {
                      subscriptionId: selectedRequest.subscriptionId,
                    });
                  }}
                  className="bg-green-500 rounded-xl py-3 items-center mb-3"
                >
                  <Text className="text-white font-bold">Voir l'investissement</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setDetailsModalVisible(false)}
                  className="bg-gray-200 rounded-xl py-3 items-center"
                >
                  <Text className="text-gray-700 font-bold">Fermer</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const DetailRow = ({ label, value, icon }) => (
  <View className="flex-row justify-between items-center py-2">
    <View className="flex-row items-center">
      <Ionicons name={icon} size={16} color="#6B7280" />
      <Text className="text-gray-600 text-sm ml-2">{label}</Text>
    </View>
    <Text className="text-gray-800 font-medium text-sm">{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  requestCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 30,
  },
});

export default WithdrawalRequests;