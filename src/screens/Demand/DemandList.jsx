import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useGetUserProfileQuery } from "../../services/Auth/authAPI";
import { useGetMyFundRequestsQuery, useGetFundRequestListQuery } from '../../services/Fund/fundApi';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import TransactionSkeleton from '../../components/TransactionSkeleton';

const TopLogo = require('../../images/TopLogo.png');
import ButtomLogo from "../../images/ButtomLogo.png";

// Statuts mis à jour avec les bons statuts du backend
const statuses = ['ALL', 'PENDING',  'FULLY_FUNDED', 'PAID'];

const DemandList = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('historique');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const { data: userProfile } = useGetUserProfileQuery();
  const userId = userProfile?.data?.user?.id;

  const { data: fundRequests, isLoading: loadingRequests } = useGetMyFundRequestsQuery(userId, {
    skip: !userId,
    pollingInterval: 1000,
  });

  //console.log(fundRequests)

  const { data: demandRequests, isLoading: loadingPublicRequests } = useGetFundRequestListQuery(
    { page: 1, limit: 10 },
    { 
      skip: !userId,
      pollingInterval: 1000,
    }
  );

  // Fonction pour obtenir la couleur du badge selon le statut
  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED':
      case 'FULLY_FUNDED':
      case 'PAID':
        return { bg: 'bg-green-100', text: 'text-green-500' };
      case 'PENDING':
        return { bg: 'bg-orange-100', text: 'text-orange-500' };
      case 'REJECTED':
      case 'FAILED':
        return { bg: 'bg-red-100', text: 'text-red-500' };
      case 'ACCEPTED':
        return { bg: 'bg-blue-100', text: 'text-blue-500' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-500' };
    }
  };

  // Fonction pour traduire le statut
  const translateStatus = (status) => {
    switch (status) {
      case 'FULLY_FUNDED':
      case 'COMPLETED':
        return t('demandList.completed');
      case 'PENDING':
        return t('demandList.pending');
      case 'ACCEPTED':
        return t('demandList.accepted');
      case 'PAID':
        return t('demandList.paid');
      case 'REJECTED':
        return t('demandList.rejected');
      default:
        return status;
    }
  };

  const renderMyRequest = ({ item }) => {
    const statusColors = getStatusColor(item.status);
    
    return (
      <TouchableOpacity
        onPress={() => navigation.navigate("DetailsList", { demand: item })}
        className="bg-white rounded-xl p-4 mb-4"
      >
        <Text className="text-black font-bold text-base mb-1">{item.description}</Text>
        <Text className="text-green-500 text-sm font-bold mb-1">{item.amount} XAF</Text>
        <View className="mt-2">
          {item.recipients?.map((r, index) => (
            <Text key={index} className="text-gray-600 font-bold text-sm">
              {r.recipient?.firstname} {r.recipient?.lastname} - [{t(`recipientStatus.${r.status.toLowerCase()}`)}]
            </Text>
          ))}
        </View>
        <View className="absolute right-3 top-3">
          <View className={`px-3 py-1 rounded-full ${statusColors.bg}`}>
            <Text className={`text-xs font-semibold ${statusColors.text}`}>
              {translateStatus(item.status)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderRecipientRequest = ({ item }) => {
    const fund = item.requestFund || item;
    if (!fund) return null;

    const statusColors = getStatusColor(fund.status);
    const recipients = fund.recipients || [];
    const isDisabled = fund.status === 'COMPLETED' || fund.status === 'FULLY_FUNDED' || 
                      recipients.every(r => r.status === 'PAID');

    return (
      <TouchableOpacity
        onPress={() => {
          if (!isDisabled) {
            navigation.navigate("RequestPay", { demand: fund });
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
          <View className={`px-3 py-1 rounded-full ${statusColors.bg}`}>
            <Text className={`text-xs font-semibold ${statusColors.text}`}>
              {translateStatus(fund.status)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Filtrage des demandes personnelles
  const filteredMyRequests = (fundRequests?.data || []).filter(item => {
    if (statusFilter === 'ALL') return true;
    
    // Pour le filtre "PENDING", on inclut tous les statuts en attente
    if (statusFilter === 'PENDING') {
      return ['PENDING', 'ACCEPTED'].includes(item.status);
    }
    
    // Pour le filtre "PAID", on vérifie si tous les destinataires sont payés
    if (statusFilter === 'PAID') {
      return item.recipients?.every(r => r.status === 'PAID');
    }
    
    // Pour les autres filtres, on compare directement le statut
    return item.status === statusFilter;
  });

  // Filtrage des demandes publiques
  const filteredPublicRequests = (demandRequests?.data?.items || []).filter(item => {
    const fund = item.requestFund || item;
    if (!fund) return false;
    
    if (statusFilter === 'ALL') return true;
    
    // Pour le filtre "PENDING", on inclut tous les statuts en attente
    if (statusFilter === 'PENDING') {
      return ['PENDING', 'ACCEPTED'].includes(fund.status);
    }
    
    // Pour le filtre "PAID", on vérifie si le statut est PAYÉ
    if (statusFilter === 'PAID') {
      return fund.status === 'PAID' || fund.recipients?.some(r => r.status === 'PAID');
    }
    
    // Pour les autres filtres, on compare directement le statut
    return fund.status === statusFilter;
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
        <TouchableOpacity 
          onPress={() => setActiveTab('historique')} 
          className={`mr-4 pb-1 ${activeTab === 'historique' ? 'border-b-2 border-white' : ''}`}
        >
          <Text className={`font-bold ${activeTab === 'historique' ? 'text-white' : 'text-gray-400'}`}>
            {t('demandList.history')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setActiveTab('mes-demandes')} 
          className={`pb-1 ${activeTab === 'mes-demandes' ? 'border-b-2 border-white' : ''}`}
        >
          <Text className={`font-bold ${activeTab === 'mes-demandes' ? 'text-white' : 'text-gray-400'}`}>
            {t('demandList.myRequests')}
          </Text>
        </TouchableOpacity>
      </View>

      <View className="mb-4 flex-row flex-wrap gap-2">
        {statuses.map(status => (
          <TouchableOpacity
            key={status}
            onPress={() => setStatusFilter(status)}
            className={`px-2 py-2 rounded-full items-center justify-center ${statusFilter === status ? 'bg-white' : 'bg-gray-500'}`}
            style={{ flexGrow: 1, flexBasis: '23%' }}
          >
            <Text className={`text-sm font-semibold text-center ${statusFilter === status ? 'text-black' : 'text-white'}`}>
              {status === 'ALL' 
                ? t('demandList.all') 
                : t(`demandList.${status.toLowerCase()}`) || status}
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
            ListEmptyComponent={
              <Text className="text-white text-center mt-10">
                {t('demandList.noRequests')}
              </Text>
            }
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
          keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
          ListEmptyComponent={
            <Text className="text-white text-center mt-10">
              {t('demandList.noRequests')}
            </Text>
          }
        />
      )}
      
      {/* Floating Home button */}
      <TouchableOpacity
        onPress={() => navigation.navigate("MainTabs")}
        style={styles.floatingHomeButton}
      >
        <Ionicons name="home" size={44} color="#7ddd7d" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingHomeButton: {
    position: "absolute",
    bottom: 24,
    right: 24,
    backgroundColor: "#1A1A1A",
    padding: 10,
    borderRadius: 50,
    elevation: 10,
  },
});

export default DemandList;