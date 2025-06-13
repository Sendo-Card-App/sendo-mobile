import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useGetUserProfileQuery } from "../../services/Auth/authAPI";
import { useGetMyFundRequestsQuery, useGetFundRequestListQuery } from '../../services/Fund/fundApi';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import TransactionSkeleton from '../../components/TransactionSkeleton';

const TopLogo = require('../../images/TopLogo.png');
import ButtomLogo from "../../images/ButtomLogo.png";

const statuses = ['ALL', 'PAID', 'PENDING', 'COMPLETED'];

const DemandList = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('historique');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { data: userProfile } = useGetUserProfileQuery();
  const userId = userProfile?.data?.id;

  const { data: fundRequests, isLoading: loadingRequests } = useGetMyFundRequestsQuery(userId, {
    skip: !userId,
  });

 //console.log("Full response:", JSON.stringify(fundRequests, null, 2));
  const { data: demandRequests, isLoading: loadingPublicRequests } = useGetFundRequestListQuery(
    { page: 1, limit: 10 },
    { skip: !userId }
  );
  //console.log("Full response:", JSON.stringify(demandRequests, null, 2));

  const renderMyRequest = ({ item }) => (
    
  <TouchableOpacity
    onPress={() => navigation.navigate("DetailsList", { demand: item })}
    className="bg-white rounded-xl p-4 mb-4"
  >
    <Text className="text-black font-bold text-base mb-1">{item.description}</Text>
    <Text className="text-green-500 text-sm font-bold mb-1">{item.amount} XAF</Text>
    <View className="mt-2">
      {item.recipients?.map((r, index) => (
        <Text key={index} className="text-gray-600 font-bold text-sm">
         {r.recipient?.firstname} {r.recipient?.lastname} -   [{t(`recipientStatus.${r.status.toLowerCase()}`)}]
        </Text>
      ))}
    </View>
    <View className="absolute right-3 top-3">
      <View className={`px-3 py-1 rounded-full ${item.status === 'ACCEPTED' ? 'bg-green-100' : 'bg-orange-100'}`}>
        <Text className={`text-xs font-semibold ${item.status === 'ACCEPTED' ? 'text-green-500' : 'text-orange-500'}`}>
          {item.status === 'FULLY_FUNDED' ? t('demandList.completed') : t('demandList.pending')}
        </Text>
      </View>
    </View>
  </TouchableOpacity>
);


const renderRecipientRequest = ({ item }) => {
  const fund = item.requestFund;
  if (!fund) return null;

  const recipients = fund.recipients || [];
  const isDisabled = item.status === 'COMPLETED' || recipients.every(r => r.status === 'PAID');

  return (
    <TouchableOpacity
      onPress={() => {
        if (!isDisabled) {
          navigation.navigate("RequestPay", { demand: item });
        }
      }}
      className={`bg-white rounded-xl p-4 mb-4 ${isDisabled ? 'opacity-80' : ''}`}
      disabled={isDisabled}
    >
      <Text className="text-black font-bold text-base mb-1">{fund.description}</Text>
      <Text className="text-green-500 text-sm font-bold mb-1">{fund.amount} XAF</Text>
      <Text className="text-gray-600 font-bold text-sm mb-1">
        {t('recipientStatus.requester')}: {fund.requesterFund?.firstname} {fund.requesterFund?.lastname}
      </Text>
      <View className="absolute right-3 top-3 space-y-1">
        <View className={`px-3 py-1 rounded-full ${item.status === 'COMPLETED' ? 'bg-green-100' : 'bg-orange-100'}`}>
          <Text className={`text-xs font-semibold ${item.status === 'COMPLETED' ? 'text-green-500' : 'text-orange-500'}`}>
            {item.status === 'FULLY_FUNDED' ? t('demandList.completed') : t('demandList.pending')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};




  const filteredMyRequests = (fundRequests?.data || []).filter(item => {
    if (statusFilter === 'ALL') return true;
    return item.status === statusFilter;
  });

  const filteredPublicRequests = (demandRequests?.data?.items || []).filter(item => {
    const status = item.status;
    const recipientStatus = item.requestFund?.recipients?.[0]?.status ?? '';
    if (statusFilter === 'ALL') return true;
    return status === statusFilter || recipientStatus === statusFilter;
  });

  return (
    <View className="flex-1 bg-[#0A0F1F] px-4 pt-10">
      <View className="flex-row justify-end mb-4 items-center">
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={{ position: 'absolute', top: -48, left: 0, right: 0, alignItems: 'center' }}>
        <Image source={TopLogo} style={{ height: 130, width: 160 }} resizeMode="contain" />
      </View>

      <View className="border border-dashed border-gray-300 mb-4" />

      <TouchableOpacity
        onPress={() => navigation.navigate("CreateRequest")}
        className="bg-green-400 rounded-full py-3 items-center mt-6 mb-6"
      >
        <Text className="text-white font-semibold">+ {t('demandList.createNew')}</Text>
      </TouchableOpacity>

      <View className="flex-row justify-between mb-4">
        <TouchableOpacity onPress={() => setActiveTab('historique')} className={`mr-4 pb-1 ${activeTab === 'historique' ? 'border-b-2 border-white' : ''}`}>
          <Text className={`font-bold ${activeTab === 'historique' ? 'text-white' : 'text-gray-400'}`}>{t('demandList.history')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('mes-demandes')} className={`pb-1 ${activeTab === 'mes-demandes' ? 'border-b-2 border-white' : ''}`}>
          <Text className={`font-bold ${activeTab === 'mes-demandes' ? 'text-white' : 'text-gray-400'}`}>{t('demandList.myRequests')}</Text>
        </TouchableOpacity>
      </View>

      <View className="mb-4 flex-row flex-wrap gap-2">
        {statuses.map(status => (
          <TouchableOpacity
            key={status}
            onPress={() => setStatusFilter(status)}
            className={`px-3 py-1 rounded-full ${statusFilter === status ? 'bg-white' : 'bg-gray-500'}`}
          >
            <Text className={`text-sm font-semibold ${statusFilter === status ? 'text-black' : 'text-white'}`}>
              {status === 'ALL' ? t('demandList.all') : t(`demandList.${status.toLowerCase()}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'historique' ? (
        loadingRequests ? (
           <FlatList
          data={[1, 2, 3, 4, 5]}
          keyExtractor={(item) => item.toString()}
          renderItem={() => <TransactionSkeleton />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20 }}
          showsVerticalScrollIndicator={false}
        />
        ) : (
          <FlatList
            data={filteredMyRequests}
            renderItem={renderMyRequest}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 30 }}
          />
        )
      ) : loadingPublicRequests ? (
        <FlatList
          data={[1, 2, 3, 4, 5]}
          keyExtractor={(item) => item.toString()}
          renderItem={() => <TransactionSkeleton />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={filteredPublicRequests}
          renderItem={renderRecipientRequest}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
        />
      )}
    </View>
  );
};

export default DemandList;
