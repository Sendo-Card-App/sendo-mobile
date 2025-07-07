import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  Platform,
  ScrollView,
  Modal,
  Dimensions
} from "react-native";
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
  //console.log(transaction)
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
       case 'TONTINE_PAYMENT': return t('history1.tontine');
        case 'FUND_REQUEST_PAYMENT': return t('history1.fund');
        case 'PAYMENT': return t('history1.payment');
      default: return type;
    }
  };

  const getMethodIcon = () => {
  switch (transaction.method?.toUpperCase()) {
    case 'MOBILE_MONEY':
      if (transaction.provider === 'CMORANGEOM') {
        return require('../../images/om.png');
      } else if (transaction.provider === 'MTNMOMO') {
        return require('../../images/mtn.png');
      } else {
        return require('../../images/transaction.png'); // fallback générique
      }
    case 'BANK_TRANSFER':
      return require('../../images/uba.png');
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
            {getTypeLabel(transaction.type)}
          </Text>
        </View>
      </View>
      <View className="flex-row justify-between items-center pt-2">
        <Text className="text-gray-600 text-lg font-bold">
          {transaction.amount?.toLocaleString()} {transaction.currency}
        </Text>
        <View className="items-end">
          <Text className="text-gray-600 text-sm">
            {transaction.createdAt ? moment(transaction.createdAt).format('DD/MM/YYYY HH:mm') : 'N/A'}
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
      setFilters(prev => ({
        ...prev,
        [dateType === 'start' ? 'startDate' : 'endDate']: selectedDate
      }));
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
    { label: t('history1.bankTransfer'), value: 'BANK_TRANSFER' }
  ];

  const types = [
    { label: t('history1.deposit'), value: 'DEPOSIT' },
    { label: t('history1.withdraw'), value: 'WITHDRAW' },
    { label: t('history1.transfer'), value: 'TRANSFER' }
  ];

  const statuses = [
    { label: t('history1.success'), value: 'COMPLETED' },
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
              className="px-4 py-3 bg-green-500 rounded-full flex-1 ml-2"
              onPress={() => {
                applyFilters();
                onClose();
              }}
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
                style={Platform.OS === 'android' ? { alignSelf: 'center' } : {}}
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
      ...appliedFilters
    },
    { skip: !userId }
  );
    //console.log('Transaction History Data:', JSON.stringify(data, null, 2));

    if (!userId) {
    return (
     <FlatList
          data={[1, 2, 3, 4, 5]}
          keyExtractor={(item) => item.toString()}
          renderItem={() => <TransactionSkeleton />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20 }}
          showsVerticalScrollIndicator={false}
        />
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
          params.startDate = moment().startOf('day').format('YYYY-MM-DD');
          params.endDate = moment().endOf('day').format('YYYY-MM-DD');
          break;
        case 'week':
          params.startDate = moment().startOf('week').format('YYYY-MM-DD');
          params.endDate = moment().endOf('week').format('YYYY-MM-DD');
          break;
        case 'month':
          params.startDate = moment().startOf('month').format('YYYY-MM-DD');
          params.endDate = moment().endOf('month').format('YYYY-MM-DD');
          break;
        case 'custom':
          if (filters.startDate) params.startDate = moment(filters.startDate).format('YYYY-MM-DD');
          if (filters.endDate) params.endDate = moment(filters.endDate).format('YYYY-MM-DD');
          break;
      }
    } else {
      params.startDate = moment().startOf('day').format('YYYY-MM-DD');
      params.endDate = moment().endOf('day').format('YYYY-MM-DD');
    }
    
    setCurrentPage(1);
    setAppliedFilters(params);
  };

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
      refetch(); // force une requête au backend
    }, [])
  );
 if (isLoading && currentPage === 1) {
  return (
    <FlatList
          data={[1, 2, 3, 4, 5]}
          keyExtractor={(item) => item.toString()}
          renderItem={() => <TransactionSkeleton />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20 }}
          showsVerticalScrollIndicator={false}
        />
  );
}

  if (isError) {
   
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-red-500">{t('history1.errorLoading')}</Text>
        {/* <TouchableOpacity 
          className="mt-4 px-4 py-2 bg-green-500 rounded"
          onPress={refetch}
        >
          <Text className="text-white">{t('common3.retry')}</Text>
        </TouchableOpacity> */}
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
      <View className={`flex-row justify-between items-center ${Platform.OS === 'ios' ? 'mt-10' : 'mt-4'} p-4`}>
        <Text className="text-xl font-bold">
          {isShowingToday ? t('history1.todayTransactions') : t('history1.title')}
        </Text>
        <TouchableOpacity 
          className="px-3 py-1 border border-green rounded-full"
          onPress={() => setShowFilterModal(true)}
        >
          <Text className="text-green-500">{t('history1.filter')}</Text>
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