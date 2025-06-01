import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useGetUserProfileQuery } from "../../services/Auth/authAPI";
import { useGetMyFundRequestsQuery, useGetFundRequestListQuery } from '../../services/Fund/fundApi';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const TopLogo = require('../../images/TopLogo.png');
import ButtomLogo from "../../images/ButtomLogo.png";

const DemandList = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState('historique');

  const { data: userProfile, isLoading: profileLoading } = useGetUserProfileQuery();
  const userId = userProfile?.data?.id;

  const { data: fundRequests, isLoading: loadingRequests } = useGetMyFundRequestsQuery(userId, {
    skip: !userId,
  });

  const { data: demandRequests, isLoading: loadingPublicRequests } = useGetFundRequestListQuery(
    { page: 1, limit: 10 },
    { skip: !userId }
  );
   //console.log(JSON.stringify(fundRequests, null, 2));
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
            {r.recipient?.firstname} {r.recipient?.lastname}
          </Text>
        ))}
      </View>
      <View className="absolute right-3 top-3">
        <View className={`px-3 py-1 rounded-full ${item.status === 'PAID' ? 'bg-green-100' : 'bg-orange-100'}`}>
          <Text className={`text-xs font-semibold ${item.status === 'PAID' ? 'text-green-500' : 'text-orange-500'}`}>
            {item.status === 'PAID' ? 'Complété' : 'En attente'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderRecipientRequest = ({ item }) => {
  const fund = item.requestFund;
  const recipients = fund.recipients;
  const recipient = recipients?.[0]; // Prend le premier destinataire (ou undefined)
  const recipientStatus = recipient?.status ?? "UNKNOWN";
  return (
    <TouchableOpacity
      onPress={() => navigation.navigate("RequestPay", { demand: item })}
      className="bg-white rounded-xl p-4 mb-4"
    >
      <Text className="text-black font-bold text-base mb-1">{fund.description}</Text>
      <Text className="text-green-500 text-sm font-bold mb-1">{fund.amount} XAF</Text>
      <Text className="text-gray-600 font-bold text-sm mb-1">
        Demandeur: {fund.requesterFund.firstname} {fund.requesterFund.lastname}
      </Text>

      <View className="absolute right-3 top-3 space-y-1">
        {/* Statut de la demande */}
        <View className={`px-3 py-1 rounded-full ${item.status === 'COMPLETED' ? 'bg-green-100' : 'bg-orange-100'}`}>
          <Text className={`text-xs font-semibold ${item.status === 'COMPLETED' ? 'text-green-500' : 'text-orange-500'}`}>
            {item.status === 'COMPLETED' ? 'Complété' : 'En attente'}
          </Text>
        </View>

        {/* Statut du destinataire (PAID ou pas) */}
        <View className={`px-3 py-1 mt-5 rounded-full ${recipientStatus === 'PAID' ? 'bg-green-100' : 'bg-orange-100'}`}>
          <Text className={`text-xs font-semibold ${recipientStatus === 'PAID' ? 'text-green-500' : 'text-orange-500'}`}>
            {recipientStatus === 'PAID' ? 'Payé' : 'En attente'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};


  return (
    <View className="flex-1 bg-[#0A0F1F] px-4 pt-10">
      {/* Header */}
      <View className="flex-row justify-end mb-4 items-center">
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Top Logo */}
      <View style={{ position: 'absolute', top: -48, left: 0, right: 0, alignItems: 'center' }}>
        <Image source={TopLogo} style={{ height: 130, width: 160 }} resizeMode="contain" />
      </View>

      {/* Dotted Line */}
      <View className="border border-dashed border-gray-300 mb-4" />

      {/* Create Request Button */}
      <TouchableOpacity
        onPress={() => navigation.navigate("CreateRequest")}
        className="bg-green-400 rounded-full py-3 items-center mt-6 mb-6"
      >
        <Text className="text-white font-semibold">+ Créer une nouvelle demande</Text>
      </TouchableOpacity>

      {/* Tabs */}
      <View className="flex-row justify-between mb-4">
        <TouchableOpacity onPress={() => setActiveTab('historique')} className={`mr-4 pb-1 ${activeTab === 'historique' ? 'border-b-2 border-white' : ''}`}>
          <Text className={`font-bold ${activeTab === 'historique' ? 'text-white' : 'text-gray-400'}`}>Historique</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setActiveTab('mes-demandes')} className={`pb-1 ${activeTab === 'mes-demandes' ? 'border-b-2 border-white' : ''}`}>
          <Text className={`font-bold ${activeTab === 'mes-demandes' ? 'text-white' : 'text-gray-400'}`}>Mes Demandes</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Icon */}
      <TouchableOpacity className="ml-auto mb-4">
        <View className="flex-row items-center">
          <Text className="text-white mr-1">Filtrer</Text>
          <Ionicons name="filter-outline" size={18} color="white" />
        </View>
      </TouchableOpacity>

      {/* List */}
      {activeTab === 'historique' ? (
        loadingRequests ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : (
          <FlatList
            data={fundRequests?.data || []}
            renderItem={renderMyRequest}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 30 }}
          />
        )
      ) : loadingPublicRequests ? (
        <ActivityIndicator size="large" color="#fff" />
      ) : (
        <FlatList
          data={demandRequests?.data?.items || []}
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
