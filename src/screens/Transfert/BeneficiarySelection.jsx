import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
  Alert,
  Image,
  ActivityIndicator
} from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import Loader from '../../components/Loader';
import SkeletonLoader from "../../components/SkeletonLoader";
import HomeImage from "../../images/HomeImage2.png";
import button from "../../images/ButtomLogo.png";
import {  Feather as MaterialIcons } from '@expo/vector-icons';
import {
  useGetFavoritesQuery
} from '../../services/Contact/contactsApi';
import {
  useGetTransfersQuery,
  useInitTransferToDestinataireMutation
} from '../../services/WalletApi/walletApi';
import {
  useGetUserProfileQuery
} from '../../services/Auth/authAPI';

import {
  sendPushNotification,
  sendPushTokenToBackend,
  registerForPushNotificationsAsync,
  getStoredPushToken
} from '../../services/notificationService';

const BeneficiarySelection = ({ route }) => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('contacts');
  const [selectedReceiverId, setSelectedReceiverId] = useState(null);

  const {
    amount,
    convertedAmount,
    totalAmount,
    transferFee,
    fromCurrency,
    toCurrency,
    countryName,
    cadRealTimeValue
  } = route.params;

  const { data: userProfile } = useGetUserProfileQuery();
  const userId = userProfile?.data.id;

  const {
    data: favoritesResponse,
    isLoading: isLoadingFavorites,
    isError: isFavoritesError
  } = useGetFavoritesQuery(userId, { skip: !userId });

  const {
    data: transfersResponse,
    isLoading: isLoadingTransfers,
    isError: isTransfersError
  } = useGetTransfersQuery();

  const [initTransfer, { isLoading: isTransferLoading }] = useInitTransferToDestinataireMutation();

  const favorites = favoritesResponse?.data || [];
  const transfers = transfersResponse?.data || [];

  const filteredFavorites = favorites.filter(fav =>
    fav.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredTransfers = transfers.filter(tr =>
    tr.destinataire?.firstname?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectContact = (contact) => {
    navigation.navigate('PaymentMethod', {
      contact,
      amount,
      convertedAmount,
      totalAmount,
      transferFee,
      fromCurrency,
      toCurrency,
      countryName,
      cadRealTimeValue
    });
  };
   const handleSelectBeneficiary = (contact) => {
    navigation.navigate('PaymentMethod', {
      contact,
      amount,
      convertedAmount,
      totalAmount,
      transferFee,
      fromCurrency,
      toCurrency,
      countryName,
      cadRealTimeValue
    });
  };

 const handleInitTransfer = async (receiver, destinataireId) => {
  setSelectedReceiverId(destinataireId);

  
  const notificationData = {
    title: 'Transfert Initié',
    body: `Vous avez envoyé ${totalAmount} ${toCurrency}.`,
    type: 'SUCCESS_TRANSFER_FUNDS',
  };

  try {
    const response = await initTransfer({
      destinataireId,
      amount: totalAmount,
    }).unwrap();

    console.log('Transfer response:', response);

    if (response?.status === 200) {
      Toast.show({
        type: 'success',
        text1: 'Transfert initié',
        text2: 'Veuillez suivre l’évolution du statut dans l’historique.',
      });

      let pushToken = await getStoredPushToken();
      if (!pushToken) {
        pushToken = await registerForPushNotificationsAsync();
      }

      await sendPushTokenToBackend(
        notificationData.title,
        notificationData.body,
        notificationData.type,
        {
          amount: totalAmount,
          destinataireId,
          timestamp: new Date().toISOString(),
        }
      );

      navigation.navigate('Success', { result: response });
    } else {
      throw new Error(response?.message || 'Erreur lors du transfert.');
    }
  } catch (error) {
    console.log('Transfer error:', error);
    Toast.show({
      type: 'error',
      text1: 'Erreur',
      text2: error.message || 'Une erreur est survenue.',
    });

    await sendPushNotification(
      'Échec du transfert',
      error.message || 'Impossible d’envoyer les fonds.'
    );
  } finally {
    setSelectedReceiverId(null);
  }
};



  const renderContact = ({ item }) => (
    <TouchableOpacity
      className="flex-row items-center py-4 border-b border-gray-700 px-5"
      onPress={() => handleSelectContact(item)}
    >
      <View className="w-10 h-10 rounded-full bg-white justify-center items-center mr-3">
        <Text className="text-gray-700 text-lg font-semibold">
          {item.name?.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="text-white text-base">{item.name}</Text>
        <Text className="text-gray-400 text-sm mt-1">{item.phone}</Text>
      </View>
    </TouchableOpacity>
  );

 const renderTransfer = ({ item }) => {
  const receiver = item.destinataire;
  if (!receiver) return null;

  const fullName = `${receiver.firstname || ''} ${receiver.lastname || ''}`.trim();

  const confirmTransfer = () => {
    Alert.alert(
      'Confirmer le transfert',
      `Voulez-vous envoyer ${totalAmount} ${toCurrency} à ${fullName} ?`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Confirmer',
          onPress: () => handleInitTransfer(receiver, receiver.id),
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <TouchableOpacity
      className="flex-row items-center py-4 border-b border-gray-700 px-5"
      onPress={confirmTransfer}
      disabled={isTransferLoading}
    >
      <View className="w-10 h-10 rounded-full bg-white justify-center items-center mr-3">
        <Text className="text-gray-700 text-lg font-semibold">
          {fullName.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="text-white text-base">{fullName}</Text>
        <Text className="text-gray-400 text-sm mt-1">{receiver.phone}</Text>
      </View>
      {selectedReceiverId === receiver.id && (
        <ActivityIndicator size="small" color="#7ddd7d" />
      )}
    </TouchableOpacity>
  );
};


  return (
    <SafeAreaView className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
       <View className="flex-row items-center justify-between p-5">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="arrowleft" size={24} color="white" />
        </TouchableOpacity>
        <Image source={button} resizeMode="contain" style={{ width: 100, height: 70, marginLeft: 50 }} />
        <Image source={HomeImage} resizeMode="contain" style={{ width: 70, height: 70, marginTop: -15, marginLeft: 10 }} />
        <MaterialIcons name="menu" size={24} color="white" onPress={() => navigation.openDrawer()} />
      </View>
      <View className="px-4 py-3 border-b border-gray-800">
        <Text className="text-white text-xl font-bold">{t('choose_beneficiary')}</Text>
         <TouchableOpacity
            className="flex-row items-center bg-black px-5 py-3"
            onPress={() =>
              navigation.navigate('AddContact', {
                onSave: handleSelectBeneficiary,
                amount, convertedAmount, totalAmount, transferFee,
                fromCurrency, toCurrency, countryName, cadRealTimeValue
              })
            }
          >
            <View className="bg-green-500 rounded-full w-12 h-12 justify-center items-center">
              <AntDesign name="user" size={20} color="white" />
            </View>
            <Text className="ml-4 text-white text-base">{t('add_new_beneficiary')}</Text>
          </TouchableOpacity>


        <View className="flex-row mt-4 bg-gray-800 rounded-lg items-center px-3 py-2">
          <AntDesign name="search1" size={18} color="#aaa" />
          <TextInput
            className="flex-1 text-white ml-2"
            placeholder={t('search')}
            placeholderTextColor="#aaa"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View className="flex-row mt-4">
          <TouchableOpacity
            className={`flex-1 py-2 rounded-l-lg ${activeTab === 'contacts' ? 'bg-green-500' : 'bg-gray-700'}`}
            onPress={() => setActiveTab('contacts')}
          >
            <Text className={`text-center font-semibold ${activeTab === 'contacts' ? 'text-black' : 'text-white'}`}>
              {t('contacts.contact')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-2 rounded-r-lg ${activeTab === 'transfers' ? 'bg-green-500' : 'bg-gray-700'}`}
            onPress={() => setActiveTab('transfers')}
          >
            <Text className={`text-center font-semibold ${activeTab === 'transfers' ? 'text-black' : 'text-white'}`}>
              {t('my_destinataires')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View className="flex-1">
        {activeTab === 'contacts' ? (
          isLoadingFavorites ? (
            <SkeletonLoader />
          ) : isFavoritesError ? (
            <Text className="text-red-500 text-center mt-20">{t('error_loading_contacts')}</Text>
          ) : (
            <FlatList
              data={favoritesResponse || []}
              keyExtractor={(item) => item.phone}   
              renderItem={renderContact}
              ListEmptyComponent={() => (
                <Text className="text-white text-center mt-20">{t('no_contacts_found')}</Text>
              )}
            />
          )
        ) : (
          isLoadingTransfers ? (
            <SkeletonLoader />
          ) : isTransfersError ? (
            <Text className="text-red-500 text-center mt-20">{t('error_loading_transfers')}</Text>
          ) : (
            <FlatList
              data={filteredTransfers}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderTransfer}
              ListEmptyComponent={() => (
                <Text className="text-white text-center mt-20">{t('no_transfers_found')}</Text>
              )}
            />
          )
        )}
      </View>

      <View className="absolute bottom-5 left-0 right-0 flex-row justify-center items-center">
        <Ionicons name="shield-checkmark" size={18} color="orange" />
        <Text className="text-white text-xs ml-2">{t('disclaimer')}</Text>
      </View>

      <Toast />
    </SafeAreaView>
  );
};

export default BeneficiarySelection;
