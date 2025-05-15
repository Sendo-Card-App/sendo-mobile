import { 
  View, 
  Text, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  Platform,
  ScrollView,
  Modal 
} from "react-native";
import React, { useState, useEffect } from "react";
import OrangeMoney from "../../images/om.png";
import { useNavigation } from "@react-navigation/native";
import { useGetTransactionHistoryQuery } from "../../services/WalletApi/walletApi";
import { useGetUserProfileQuery } from "../../services/Auth/authAPI";
import { useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import Loader from "../../components/Loader";

const HistoryCard = ({ transaction, onPress }) => {
  const { t } = useTranslation();
  
  const getStatusColor = (status) => {
    switch(status?.toUpperCase()) {
      case 'SUCCESS': return 'text-green-600';
      case 'FAILED': return 'text-red-600';
      case 'PENDING': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getTypeLabel = (type) => {
    switch(type?.toUpperCase()) {
      case 'DEPOSIT': return t('history1.deposit');
      case 'WITHDRAW': return t('history1.withdraw');
      case 'TRANSFER': return t('history1.transfer');
      default: return type;
    }
  };

  const getMethodIcon = () => {
    switch(transaction.method?.toUpperCase()) {
      case 'MOBILE_MONEY':
        return transaction.recipient_number?.includes('2376') ? 
          OrangeMoney : require('../../images/om.png');
      case 'BANK_TRANSFER':
        return require('../../images/RoyalBank.png');
      default:
        return require('../../images/transaction.png');
    }
  };

  return (
    <TouchableOpacity onPress={onPress} className="border p-4 mx-5 my-2 rounded-3xl border-gray-500">
      <View className="border-b border-gray-500 pb-2 flex-row gap-2">
        <Image source={getMethodIcon()} className="w-10 h-10" />
        <View>
          <Text className="text-gray-600 text-sm">
            {transaction.recipient_name || transaction.recipient_number || t('history1.unknownRecipient')}
          </Text>
          <Text className="text-gray-600 text-sm font-bold">
            {getTypeLabel(transaction.type)}
          </Text>
        </View>
      </View>
      <View className="flex-row justify-between items-center pt-2">
        <Text className="text-gray-600 text-lg font-bold">
          {transaction.amount?.toLocaleString()} FCFA
        </Text>
        <View className="items-end">
          <Text className="text-gray-600 text-sm">
            {moment(transaction.created_at).format('DD/MM/YYYY à HH:mm')}
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
    { label: t('history1.success'), value: 'SUCCESS' },
    { label: t('history1.failed'), value: 'FAILED' },
    { label: t('history1.pending'), value: 'PENDING' }
  ];

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-transparent bg-opacity-50">
        <View className="bg-white p-5 rounded-t-3xl max-h-[80%]">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold">{t('history1.filterTitle')}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text className="text-blue-500">{t('common3.close')}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView>
            {/* Date Filter */}
            <View className="mb-1 ">
              <Text className="font-bold mb-2">{t('history1.dateRange')}</Text>
              <View className="flex-row flex-wrap">
                {quickDateFilters.map(item => (
                  <TouchableOpacity
                    key={item.value}
                    className={`px-3 py-2 mr-2 mb-2 rounded-full ${filters.dateRange === item.value ? 'bg-blue-500' : 'bg-gray-200'}`}
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

              {showDatePicker && (
            <Modal
              transparent={true}
              animationType="fade"
              visible={showDatePicker}
              onRequestClose={() => setShowDatePicker(false)}
            >
              <View className="flex-1 justify-center items-center bg-transparent bg-opacity-50">
                <View className="bg-black p-5 rounded-lg w-80">
                  <DateTimePicker
                    value={dateType === 'start' ? (filters.startDate || new Date()) : (filters.endDate || new Date())}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    style={Platform.OS === 'android' ? { alignSelf: 'center' } : {}}
                  />
                  <TouchableOpacity
                    onPress={() => setShowDatePicker(false)}
                    className="mt-4 p-2 bg-blue-500 rounded-lg"
                  >
                    <Text className="text-white text-center">{t('common3.close')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )}
            </View>

            {/* Type Filter */}
            <View className="mb-4">
              <Text className="font-bold mb-2">{t('history1.type')}</Text>
              <View className="flex-row flex-wrap">
                {types.map(item => (
                  <TouchableOpacity
                    key={item.value}
                    className={`px-3 py-2 mr-2 mb-2 rounded-full ${filters.type === item.value ? 'bg-blue-500' : 'bg-gray-200'}`}
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
                    className={`px-3 py-2 mr-2 mb-2 rounded-full ${filters.method === item.value ? 'bg-blue-500' : 'bg-gray-200'}`}
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
                    className={`px-3 py-2 mr-2 mb-2 rounded-full ${filters.status === item.value ? 'bg-blue-500' : 'bg-gray-200'}`}
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
                  dateRange: null,
                  method: null,
                  type: null,
                  status: null,
                  startDate: null,
                  endDate: null
                });
              }}
            >
              <Text className="text-center">{t('history1.reset')}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              className="px-4 py-3 bg-blue-500 rounded-full flex-1 ml-2"
              onPress={() => {
                applyFilters();
                onClose();
              }}
            >
              <Text className="text-white text-center">{t('history1.apply')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={dateType === 'start' ? (filters.startDate || new Date()) : (filters.endDate || new Date())}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
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
    dateRange: null,
    method: null,
    type: null,
    status: null,
    startDate: null,
    endDate: null
  });

  const [appliedFilters, setAppliedFilters] = useState({});
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, isError, refetch } = useGetTransactionHistoryQuery(
    { 
      userId,
      page: appliedFilters.page || 1,
      limit: appliedFilters.limit || 10,
      type: appliedFilters.type,
      status: appliedFilters.status,
      method: appliedFilters.method,
      startDate: appliedFilters.startDate,
      endDate: appliedFilters.endDate
    },
    { skip: !userId } // RTK Query option to skip if userId is falsy
  );

  // 3. Now conditionally render UI (after all hooks)
  if (!userId) {
    return (
      <View className="flex-1 justify-center items-center">
        <Loader size="large" />
        <Text className="mt-4 text-gray-500">{t('history1.loadingUser')}</Text>
      </View>
    );
  }

  // Rest of the component...

  const applyFilters = () => {
    const params = {
      page: 1,
      limit: 10,
      ...(filters.method && { method: filters.method }),
      ...(filters.type && { type: filters.type }),
      ...(filters.status && { status: filters.status }),
    };
    
    // Apply date filters
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
          if (filters.startDate) {
            params.startDate = moment(filters.startDate).format('YYYY-MM-DD');
          }
          if (filters.endDate) {
            params.endDate = moment(filters.endDate).format('YYYY-MM-DD');
          }
          break;
      }
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

  if (isLoading && currentPage === 1) {
    return (
      <View className="flex-1 justify-center items-center">
        <Loader size="large" />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-red-500">{t('history1.errorLoading')}</Text>
        <TouchableOpacity 
          className="mt-4 px-4 py-2 bg-blue-500 rounded"
          onPress={refetch}
        >
          <Text className="text-white">{t('common3.retry')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const transactions = data?.data?.items || [];
  const pagination = data?.data?.pagination || { page: 1, totalItems: 0, totalPages: 1 };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="flex-row justify-between items-center p-4">
        <Text className="text-xl font-bold">{t('history1.title')}</Text>
        <View className="flex-row items-center">
         
          <TouchableOpacity 
            className="px-3 py-1 border border-blue-500 rounded-full"
            onPress={() => setShowFilterModal(true)}
          >
            <Text className="text-blue-500">{t('history1.filter')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {transactions.length > 0 ? (
        <FlatList
          data={transactions}
          renderItem={({ item }) => (
            <HistoryCard 
              transaction={item} 
              onPress={() => navigation.navigate('Receipt', { transaction: item })}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          refreshing={isLoading}
          onRefresh={() => {
            setCurrentPage(1);
            refetch();
          }}
          ListFooterComponent={() => (
            <View className="flex-row justify-between items-center p-4 bg-gray-100">
              <TouchableOpacity 
                onPress={handlePrevPage}
                disabled={currentPage === 1}
                className={`px-4 py-2 rounded ${currentPage === 1 ? 'bg-gray-300' : 'bg-blue-500'}`}
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
                className={`px-4 py-2 rounded ${currentPage >= pagination.totalPages ? 'bg-gray-300' : 'bg-blue-500'}`}
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
          <Text className="text-gray-500">{t('history1.noTransactions')}</Text>
          <TouchableOpacity 
            className="mt-4 px-4 py-2 bg-blue-500 rounded"
            onPress={() => {
              setCurrentPage(1);
              setAppliedFilters({ page: 1, limit: 10 });
              setFilters({
                dateRange: null,
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