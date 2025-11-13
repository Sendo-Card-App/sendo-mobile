import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  Platform,
  StatusBar,
  ScrollView,
  Modal,
  Dimensions
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import React, { useState, useEffect, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import OrangeMoney from "../../images/om.png";
import { useNavigation } from "@react-navigation/native";
import SkeletonLoader from '../../components/SkeletonLoader';
import { useGetTransactionHistoryQuery } from "../../services/WalletApi/walletApi";
import { useGetUserProfileQuery } from "../../services/Auth/authAPI";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import Loader from "../../components/Loader";
import TransactionSkeleton from "../../components/TransactionSkeleton";

const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;

const HistoryCard = ({ transaction, user, onPress }) => {
  const { t } = useTranslation();
  
  // CORRECTION: Déterminer quel montant afficher
  const displayAmount = 
    transaction.type === 'PAYMENT' || transaction.type === 'TONTINE_PAYMENT' || transaction.type === 'VIEW_CARD_DETAILS'
      ? transaction.totalAmount 
      : transaction.amount;

  const getStatusColor = (status) => {
    switch(status?.toUpperCase()) {
      case 'COMPLETED': return 'text-green-600';
      case 'FAILED': return 'text-red-600';
      case 'PENDING': return 'text-yellow-600';
      case 'BLOCKED': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getTypeLabel = (type) => {
    switch(type?.toUpperCase()) {
      case 'DEPOSIT': return t('history1.deposit');
      case 'WITHDRAWAL': return t('history1.withdraw');
      case 'TRANSFER': return t('history1.transfer');
      case 'SHARED_PAYMENT': return t('history1.share');
      case 'WALLET_TO_WALLET': return t('history1.wallet');
      case 'VIEW_CARD_DETAILS': return t('history1.cardView');
      case 'TONTINE_PAYMENT': return t('history1.tontine');
      case 'FUND_REQUEST_PAYMENT': return t('history1.fund');
      case 'PAYMENT': return t('history1.payment');
      default: return type;
    }
  };

  const getMethodIcon = () => {
    const method = transaction.method?.toUpperCase() || '';
    const provider = transaction.provider;

    switch (method) {
      case 'MOBILE_MONEY':
        if (provider === 'ORANGE_MONEY' || provider?.toLowerCase() === 'orange') {
          return require('../../images/om.png');
        } else if (provider === 'MTN_MONEY') {
          return require('../../images/mtn.png');
        } else if (provider === 'WALLET_PAYMENT') {
          return require('../../images/wallet.jpeg');
        } else {
          return require('../../images/transaction.png');
        }

      case 'WALLET':
        if (provider === 'CMORANGEOM') {
          return require('../../images/om.png');
        } else if (provider === 'MTNMOMO') {
          return require('../../images/mtn.png');
        } else {
          return require('../../images/wallet.jpeg');
        }

      case 'VIRTUAL_CARD':
        return require('../../images/virtual.png');
      case 'BANK_TRANSFER':
        return require('../../images/ecobank.jpeg');

      default:
        return require('../../images/tontine.jpeg');
    }
  };

  return (
    <TouchableOpacity 
      onPress={onPress} 
      className={`border p-4 ${isSmallScreen ? 'mx-3' : 'mx-5'} my-2 rounded-3xl border-gray-500`}
    >
      <View className="border-b border-gray-500 pb-2 flex-row gap-2">
        <Image 
          source={getMethodIcon()} 
          className="w-10 h-10"
          resizeMode="contain"
        />
        <View className="flex-1">
          <Text className="text-gray-600 text-sm font-bold">
            {user?.firstname} {user?.lastname}
          </Text>
          <Text className="text-gray-600 text-xs">
            {transaction.transactionId || t('history1.unknownTransaction')}
          </Text>
          <Text className="text-gray-600 text-sm">
            {transaction.description}
          </Text>
        </View>
      </View>
      <View className="flex-row justify-between items-center pt-2">
        {/* CORRECTION: Utiliser displayAmount au lieu de transaction.amount */}
        <Text className="text-gray-600 text-lg font-bold">
          {displayAmount?.toLocaleString()} {transaction.currency}
        </Text>
        <View className="items-end">
          <Text className="text-gray-600 text-sm">
            {transaction.createdAt ? 
              moment.utc(transaction.createdAt).local().format('DD/MM/YYYY HH:mm') : 
              'N/A'
            }
          </Text>
          <Text className={`text-sm font-bold ${getStatusColor(transaction.status)}`}>
            {t(`history1.${transaction.status?.toLowerCase()}`)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const FilterModal = ({ visible, onClose, filters, setFilters, applyFilters }) => {
  const { t } = useTranslation();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateType, setDateType] = useState('start');

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newFilters = {
        ...filters,
        [dateType === 'start' ? 'startDate' : 'endDate']: selectedDate
      };    
      // If end date is before start date, auto-adjust it
      if (dateType === 'start' && newFilters.endDate && moment(selectedDate).isAfter(newFilters.endDate)) {
        newFilters.endDate = selectedDate;
      }   
      setFilters(newFilters);
    }
  };

  const quickDateFilters = [
    { label: t('history1.today'), value: 'today' },
    { label: t('history1.thisWeek'), value: 'week' },
    { label: t('history1.thisMonth'), value: 'month' },
    { label: t('history1.custom'), value: 'custom' }
  ];

  const methods = [
    { label: t('history1.mobileMoney'), value: 'MOBILE_MONEY' },
    { label: t('history1.Portefeuille'), value: 'WALLET' },
    { label: t('history1.bankTransfer'), value: 'BANK_TRANSFER' }
  ];

  const types = [
    { label: t('history1.deposit'), value: 'DEPOSIT' },
    { label: t('history1.withdraw'), value: 'WITHDRAW' },
    { label: t('history1.transfer'), value: 'TRANSFER' },
    { label: t('history1.card'), value: 'PAYMENT' }
  ];

  const statuses = [
    { label: t('history1.completed'), value: 'COMPLETED' },
    { label: t('history1.failed'), value: 'FAILED' },
    { label: t('history1.pending'), value: 'PENDING' },
    { label: t('history1.blocked'), value: 'BLOCKED' }
  ];

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-transparent bg-opacity-50">
        <View className={`bg-white p-5 rounded-t-3xl ${isSmallScreen ? 'max-h-[85%]' : 'max-h-[80%]'}`}>
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold">{t('history1.filterTitle')}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-green">{t('common3.close')}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView>
            {/* Date Filter */}
            <View className="mb-1">
              <Text className="font-bold mb-2">{t('history1.dateRange')}</Text>
              <View className="flex-row flex-wrap">
                {quickDateFilters.map(item => (
                  <TouchableOpacity
                    key={item.value}
                    className={`px-3 py-2 mr-2 mb-2 rounded-full ${filters.dateRange === item.value ? 'bg-green-500' : 'bg-gray-200'}`}
                    onPress={() => setFilters(prev => ({ ...prev, dateRange: item.value }))}
                  >
                    <Text className={filters.dateRange === item.value ? 'text-white' : 'text-gray-800'}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {filters.dateRange === 'custom' && (
                <>
                  <View className="flex-row justify-between mt-2">
                    <TouchableOpacity 
                      className="border p-2 rounded flex-1 mr-2"
                      onPress={() => {
                        setDateType('start');
                        setShowDatePicker(true);
                      }}
                    >
                      <Text>{filters.startDate ? moment(filters.startDate).format('DD/MM/YYYY') : t('history1.startDate')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      className="border p-2 rounded flex-1 ml-2"
                      onPress={() => {
                        setDateType('end');
                        setShowDatePicker(true);
                      }}
                    >
                      <Text>{filters.endDate ? moment(filters.endDate).format('DD/MM/YYYY') : t('history1.endDate')}</Text>
                    </TouchableOpacity>
                  </View>
                  {filters.startDate && filters.endDate && moment(filters.endDate).isBefore(filters.startDate) && (
                    <Text className="text-red-500 text-sm mt-1">
                      {t('history1.endDateBeforeStart')}
                    </Text>
                  )}
                </>
              )}
            </View>

            {/* Type Filter */}
            <View className="mb-4">
              <Text className="font-bold mb-2">{t('history1.type')}</Text>
              <View className="flex-row flex-wrap">
                {types.map(item => (
                  <TouchableOpacity
                    key={item.value}
                    className={`px-3 py-2 mr-2 mb-2 rounded-full ${filters.type === item.value ? 'bg-green-500' : 'bg-gray-200'}`}
                    onPress={() => setFilters(prev => ({ 
                      ...prev, 
                      type: prev.type === item.value ? null : item.value 
                    }))}
                  >
                    <Text className={filters.type === item.value ? 'text-white' : 'text-gray-800'}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Method Filter */}
            <View className="mb-4">
              <Text className="font-bold mb-2">{t('history1.method')}</Text>
              <View className="flex-row flex-wrap">
                {methods.map(item => (
                  <TouchableOpacity
                    key={item.value}
                    className={`px-3 py-2 mr-2 mb-2 rounded-full ${filters.method === item.value ? 'bg-green-500' : 'bg-gray-200'}`}
                    onPress={() => setFilters(prev => ({ 
                      ...prev, 
                      method: prev.method === item.value ? null : item.value 
                    }))}
                  >
                    <Text className={filters.method === item.value ? 'text-white' : 'text-gray-800'}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Status Filter */}
            <View className="mb-6">
              <Text className="font-bold mb-2">{t('history1.status')}</Text>
              <View className="flex-row flex-wrap">
                {statuses.map(item => (
                  <TouchableOpacity
                    key={item.value}
                    className={`px-3 py-2 mr-2 mb-2 rounded-full ${filters.status === item.value ? 'bg-green-500' : 'bg-gray-200'}`}
                    onPress={() => setFilters(prev => ({ 
                      ...prev, 
                      status: prev.status === item.value ? null : item.value 
                    }))}
                  >
                    <Text className={filters.status === item.value ? 'text-white' : 'text-gray-800'}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <View className="flex-row justify-between">
            <TouchableOpacity 
              className="px-4 py-3 bg-gray-200 rounded-full flex-1 mr-2"
              onPress={() => {
                setFilters({
                  dateRange: 'today',
                  method: null,
                  type: null,
                  status: null,
                  startDate: null,
                  endDate: null
                });
              }}
            >
              <Text className="text-center font-bold">{t('history1.reset')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className={`px-4 py-3 rounded-full flex-1 ml-2 ${
                filters.dateRange === 'custom' && 
                filters.startDate && 
                filters.endDate && 
                moment(filters.endDate).isBefore(filters.startDate)
                  ? 'bg-gray-400'
                  : 'bg-green-500'
              }`}
              onPress={() => {
                if (filters.dateRange === 'custom' && 
                    filters.startDate && 
                    filters.endDate && 
                    moment(filters.endDate).isBefore(filters.startDate)) {
                  Alert.alert(t('history1.invalidDateRange'));
                  return;
                }
                applyFilters();
                onClose();
              }}
              disabled={
                filters.dateRange === 'custom' && 
                filters.startDate && 
                filters.endDate && 
                moment(filters.endDate).isBefore(filters.startDate)
              }
            >
              <Text className="text-center text-white font-bold">{t('history1.apply')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {showDatePicker && (
        <Modal
          transparent={true}
          animationType="fade"
          visible={showDatePicker}
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View className="flex-1 justify-center items-center bg-white bg-opacity-50">
            <View className="bg-green p-5 rounded-lg w-80">
              <DateTimePicker
                value={dateType === 'start' ? (filters.startDate || new Date()) : (filters.endDate || new Date())}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={dateType === 'end' ? null : filters.endDate || null}
                minimumDate={dateType === 'start' ? null : filters.startDate || null}
              />
              <TouchableOpacity
                onPress={() => setShowDatePicker(false)}
                className="mt-4 p-2 bg-green-500 rounded-lg"
              >
                <Text className="text-white text-center">{t('common3.close')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </Modal>
  );
};

const History = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const userIdFromRedux = useSelector(state => state.auth.userId);
  const { data: userProfile } = useGetUserProfileQuery();
  const userIdFromProfile = userProfile?.data?.id;
  const userId = userIdFromRedux || userIdFromProfile;

  const [filters, setFilters] = useState({
    dateRange: 'today',
    method: null,
    type: null,
    status: null,
    startDate: null,
    endDate: null
  });

  const [appliedFilters, setAppliedFilters] = useState({
    page: 1,
    limit: 10,
    startDate: moment().startOf('day').format('YYYY-MM-DD'),
    endDate: moment().endOf('day').format('YYYY-MM-DD')
  });

  const [showFilterModal, setShowFilterModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, isError, refetch } = useGetTransactionHistoryQuery(
    { 
      userId,
      ...appliedFilters,
      pollingInterval: 10000,
    },
    { 
      skip: !userId,
      pollingInterval: 10000,
    }
  );

  if (!userId) {
    return (
      <View className="flex-1 bg-white" style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 40 }}>
        {/* Header with back button */}
        <View className="flex-row items-center justify-between p-4">
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text className="text-xl font-bold">{t('screens.history')}</Text>
          <View style={{ width: 40 }} />
        </View>
        
        <FlatList
          data={[1, 2, 3, 4, 5]}
          keyExtractor={(item) => item.toString()}
          renderItem={() => <TransactionSkeleton />}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  }

  const applyFilters = () => {
    const params = {
      page: 1,
      limit: 10,
      ...(filters.method && { method: filters.method }),
      ...(filters.type && { type: filters.type }),
      ...(filters.status && { status: filters.status }),
    };
    
    if (filters.dateRange) {
      switch(filters.dateRange) {
        case 'today':
          params.startDate = moment().startOf('day').utc().format();
          params.endDate = moment().endOf('day').utc().format();
          break;
        case 'week':
          params.startDate = moment().startOf('week').utc().format();
          params.endDate = moment().endOf('week').utc().format();
          break;
        case 'month':
          params.startDate = moment().startOf('month').utc().format();
          params.endDate = moment().endOf('month').utc().format();
          break;
        case 'custom':
          if (filters.startDate) {
            params.startDate = moment(filters.startDate).startOf('day').utc().format();
          }
          if (filters.endDate) {
            params.endDate = moment(filters.endDate).endOf('day').utc().format();
          }
          break;
      }
    } else {
      params.startDate = moment().startOf('day').utc().format();
      params.endDate = moment().endOf('day').utc().format();
    }
    
    setCurrentPage(1);
    setAppliedFilters(params);
  };

  useEffect(() => {
    if (filters.dateRange && filters.dateRange !== 'custom') {
      applyFilters();
    }
  }, [filters.dateRange]);

  const handleNextPage = () => {
    const newPage = currentPage + 1;
    setCurrentPage(newPage);
    setAppliedFilters(prev => ({ ...prev, page: newPage }));
  };

  const handlePrevPage = () => {
    const newPage = Math.max(1, currentPage - 1);
    setCurrentPage(newPage);
    setAppliedFilters(prev => ({ ...prev, page: newPage }));
  };

  useEffect(() => {
    refetch();
  }, [appliedFilters, refetch]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [])
  );

  if (isLoading && currentPage === 1) {
    return (
      <View className="flex-1 bg-white" style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 40 }}>
        {/* Header with back button */}
        <View className="flex-row items-center justify-between p-4">
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text className="text-xl font-bold">{t('screens.history')}</Text>
          <View style={{ width: 40 }} />
        </View>
        
        <FlatList
          data={[1, 2, 3, 4, 5]}
          keyExtractor={(item) => item.toString()}
          renderItem={() => <TransactionSkeleton />}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 justify-center items-center bg-white" style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 40 }}>
        {/* Header with back button */}
        <View className="flex-row items-center justify-between p-4 absolute top-0 w-full">
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
            <Ionicons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          <Text className="text-xl font-bold">{t('screens.history')}</Text>
          <View style={{ width: 40 }} />
        </View>
        
        <Text className="text-red-500">{t('history1.errorLoading')}</Text>
      </View>
    );
  }

  const transactions = data?.data?.transactions?.items || [];
  const userData = data?.data?.user || {};
  const pagination = data?.data?.transactions || { page: 1, totalItems: 0, totalPages: 1 };

  const isShowingToday = appliedFilters.startDate === moment().startOf('day').format('YYYY-MM-DD') && 
                         appliedFilters.endDate === moment().endOf('day').format('YYYY-MM-DD');
  const noTransactionsToday = isShowingToday && transactions.length === 0;

  return (
    <View className="flex-1 bg-white">
      <View
        className="bg-white px-5 flex-row items-center justify-between"
        style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 40 }}
      >
        {/* Title */}
        <Text className="text-xl font-bold text-gray-800">
          {isShowingToday ? t('history1.todayTransactions') : t('history1.title')}
        </Text>

        {/* Filter Button */}
        <TouchableOpacity
          className="flex-row items-center px-4 py-2 border rounded-full border-[#7ddd7d] bg-white shadow-sm"
          onPress={() => setShowFilterModal(true)}
        >
          <Text className="text-[#7ddd7d] font-medium mr-2">
            {t('history1.filter')}
          </Text>
          <MaterialIcons name="filter-list" size={18} color="#7ddd7d" />
        </TouchableOpacity>
      </View>

      <SkeletonLoader
        isLoading={isLoading}
        skeletonType="list"
        skeletonDuration={2000}
        fallbackToSpinner={true}
        error={isError}
      >
        {transactions.length > 0 ? (
          <FlatList
            data={transactions}
            renderItem={({ item }) => (
              <HistoryCard 
                transaction={item}
                user={userData}
                onPress={() => navigation.navigate('Receipt', { 
                  transaction: item,
                  user: userData 
                })}
              />
            )}
            keyExtractor={(item) => item.id.toString()}
            refreshing={isLoading}
            onRefresh={() => {
              setCurrentPage(1);
              refetch();
            }}
            contentContainerStyle={{ paddingBottom: 16 }}
            ListFooterComponent={() => (
              <View className="flex-row justify-between items-center p-4 bg-gray-100">
                <TouchableOpacity 
                  onPress={handlePrevPage}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 rounded ${currentPage === 1 ? 'bg-gray-300' : 'bg-green-500'}`}
                >
                  <Text className={currentPage === 1 ? 'text-gray-500' : 'text-white'}>
                    {t('common3.previous')}
                  </Text>
                </TouchableOpacity>
                
                <Text>
                  {t('history1.page')} {currentPage} {t('history1.of')} {pagination.totalPages}
                </Text>
                
                <TouchableOpacity 
                  onPress={handleNextPage}
                  disabled={currentPage >= pagination.totalPages}
                  className={`px-4 py-2 rounded ${currentPage >= pagination.totalPages ? 'bg-gray-300' : 'bg-green-500'}`}
                >
                  <Text className={currentPage >= pagination.totalPages ? 'text-gray-500' : 'text-white'}>
                    {t('common3.next')}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          />
        ) : (
          <View className="flex-1 justify-center items-center">
            <Text className="text-gray-500">
              {noTransactionsToday ? t('history1.noTransactionsToday') : t('history1.noTransactions')}
            </Text>
            <TouchableOpacity 
              className="mt-4 px-4 py-2 bg-green-500 rounded"
              onPress={() => {
                setCurrentPage(1);
                setAppliedFilters({ 
                  page: 1, 
                  limit: 10,
                  startDate: moment().startOf('day').format('YYYY-MM-DD'),
                  endDate: moment().endOf('day').format('YYYY-MM-DD')
                });
                setFilters({
                  dateRange: 'today',
                  method: null,
                  type: null,
                  status: null,
                  startDate: null,
                  endDate: null
                });
              }}
            >
              <Text className="text-white">{t('history1.resetFilters')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </SkeletonLoader>

      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        filters={filters}
        setFilters={setFilters}
        applyFilters={applyFilters}
      />
    </View>
  );
};

export default History;