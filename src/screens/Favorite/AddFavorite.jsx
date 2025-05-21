import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  TextInput, 
  Alert, 
  Dimensions,
  ScrollView
} from 'react-native';
import * as Contacts from 'expo-contacts';
import * as Linking from 'expo-linking';
import { useNavigation } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';
import { useGetUserProfileQuery } from "../../services/Auth/authAPI";
import { 
  useSynchronizeContactsMutation,
  useAddFavoriteMutation,
  useGetFavoritesQuery,
  useRemoveFavoriteMutation,
  useGetSynchronizedContactsQuery
} from '../../services/Contact/contactsApi';
import Loader from "../../components/Loader";

const { width, height } = Dimensions.get('window');

// Phone number helper functions
const isValidPhoneNumber = (phoneNumber) => {
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');
  const cameroonRegex = /^(\+237|237)?[236]\d{8}$/;
  const canadaRegex = /^(\+1|1)?\d{10}$/;
  return cameroonRegex.test(cleaned) || canadaRegex.test(cleaned);
};

const formatPhoneNumber = (phoneNumber) => {
  const cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // Format Cameroon numbers
  if (/^(\+237|237)?[236]\d{8}$/.test(cleaned)) {
    return cleaned.startsWith('237') ? `+${cleaned}` : 
           cleaned.startsWith('+237') ? cleaned : `+237${cleaned}`;
  }
  
  // Format Canada numbers
  if (/^(\+1|1)?\d{10}$/.test(cleaned)) {
    return cleaned.startsWith('1') ? `+${cleaned}` : 
           cleaned.startsWith('+1') ? cleaned : `+1${cleaned}`;
  }
  
  return phoneNumber;
};

const AddFavorite = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { data: userProfile } = useGetUserProfileQuery();
  const userId = userProfile?.data.id;
  
  // API hooks
  const [synchronizeContacts] = useSynchronizeContactsMutation();
  const [addFavorite, { isLoading: isAddingFavorite }] = useAddFavoriteMutation();
  const [removeFavorite] = useRemoveFavoriteMutation();
  const { 
    data: favoritesResponse, 
    isLoading: isLoadingFavorites, 
    refetch: refetchFavorites 
  } = useGetFavoritesQuery(userId, { skip: !userId });
  
  const { 
    data: synchronizedContacts, 
    isLoading: isLoadingContacts,
    refetch: refetchContacts 
  } = useGetSynchronizedContactsQuery(userId, { skip: !userId });

  // State
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [status, setStatus] = useState('idle');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('contacts');

  // Request contacts permission
  const requestContactsPermission = async () => {
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('contacts.permissionRequired'),
          t('contacts.permissionMessage'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('contacts.settings'), onPress: () => Linking.openSettings() }
          ]
        );
        return false;
      }
      return true;
    } catch (error) {
      console.error('Permission error:', error);
      Toast.show({
        type: 'error',
        text1: 'Permission Error',
        text2: 'Failed to request contacts permission'
      });
      return false;
    }
  };

  // Process contacts for backend
  const processContactsForBackend = (rawContacts) => {
    const contactsToSync = [];
    const sanitizeName = (name) => {
      return (name || '').replace(/[^\x00-\x7F]/g, '').trim() || 'Unknown';
    };

    for (const contact of rawContacts) {
      if (contact.phoneNumbers?.length > 0) {
        const rawPhoneNumber = contact.phoneNumbers[0].number;
        
        if (!rawPhoneNumber) continue;
        
        const phoneNumber = formatPhoneNumber(rawPhoneNumber.replace(/[^\d+]/g, ''));
        
        if (!isValidPhoneNumber(phoneNumber)) continue;
        
        const contactName = sanitizeName(
          contact.name || 
          contact.firstName || 
          contact.lastName || 
          contact.company || 
          'Unknown'
        );
        
        contactsToSync.push({
          name: contactName,
          phone: phoneNumber
        });
      }
    }

    return contactsToSync;
  };

  // Fetch and sync contacts
  const fetchAndSyncContacts = async () => {
    try {
      const hasPermission = await requestContactsPermission();
      if (!hasPermission) {
        setStatus('permission-denied');
        return;
      }

      setStatus('loading');
      
      // Get all contacts from device
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
      });
      
      // Process contacts to match backend format
      const contactsToSync = processContactsForBackend(data);
      
      // Process in batches
      const batchSize = 50;
      let successfulSyncs = 0;
      
      for (let i = 0; i < contactsToSync.length; i += batchSize) {
        const batch = contactsToSync.slice(i, i + batchSize);
        const payload = { contacts: batch };
        
        try {
          await synchronizeContacts(payload).unwrap();
          successfulSyncs += batch.length;
        } catch (error) {
          console.error(`Failed to sync batch starting at index ${i}`, error);
        }
      }
      
      // Refresh the synchronized contacts list
      await refetchContacts();
      
      setStatus('ready');
      Toast.show({
        type: 'success',
        text1: t('common.success'),
        text2: t('contacts.syncComplete', { count: successfulSyncs, total: contactsToSync.length })
      });

    } catch (error) {
      console.error('Sync failed:', error);
      setStatus('error');
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: error.message || t('contacts.syncFailed')
      });
    }
  };

  // Add contact to favorites
  const handleAddToFavorites = async (contact) => {
    try {
      await addFavorite({
        userId,
        phone: formatPhoneNumber(contact.phone)
      }).unwrap();
      
      Toast.show({
        type: 'success',
        text1: t('common.success'),
        text2: t('contacts.addedToFavorites')
      });
      
      refetchFavorites();
      refetchContacts();
      
    } catch (error) {
      console.log(error)
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: error.data?.message || t('contacts.favoriteError')
      });
    }
  };

  // Remove from favorites
  const handleRemoveFavorite = async (phone) => {
    try {
      await removeFavorite({ userId, phone }).unwrap();
      refetchFavorites();
      Toast.show({
        type: 'success',
        text1: t('common.success'),
        text2: t('contacts.removedFromFavorites')
      });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t('common.error'),
        text2: t('contacts.removeFavoriteError')
      });
    }
  };

  // Filter contacts based on search and favorites
  useEffect(() => {
    if (synchronizedContacts?.data?.length > 0) {
      let result = [...synchronizedContacts.data];
      
      if (favoritesResponse?.data?.length > 0) {
        const favoritePhones = favoritesResponse.data.map(fav => fav.phone);
        result = result.filter(
          contact => !favoritePhones.includes(formatPhoneNumber(contact.phone))
        );
      }
      
      if (searchQuery) {
        result = result.filter(contact => 
          contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.phone?.includes(searchQuery)
        );
      }
      
      setFilteredContacts(result);
    } else {
      setFilteredContacts([]);
    }
  }, [synchronizedContacts, favoritesResponse, searchQuery]);

  // Render contact list item with heart icon
  const renderContactItem = ({ item }) => (
    <View className="p-4 border-b border-gray-200 flex-row items-center min-h-16 bg-white">
      <MaterialCommunityIcons 
        name="account-outline" 
        size={width * 0.07} 
        color="#666" 
        className="mr-3"
      />
      <View className="flex-1">
        <Text className="font-bold text-base text-gray-800">
          {item.name || t('contacts.noName')}
        </Text>
        <Text className="text-gray-600 text-sm mt-1">
          {formatPhoneNumber(item.phone)}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => handleAddToFavorites(item)}
        className="p-2"
      >
        <MaterialCommunityIcons 
          name="heart" 
          size={24} 
          color="#f44336" 
        />
      </TouchableOpacity>
    </View>
  );

  // Render favorite item with delete icon
  const renderFavoriteItem = ({ item }) => (
    <View className="p-4 border-b border-gray-200 flex-row items-center min-h-16 bg-white">
      <MaterialCommunityIcons 
        name="account-outline" 
        size={width * 0.07} 
        color="#666" 
        className="mr-3"
      />
      <View className="flex-1">
        <Text className="font-bold text-base text-gray-800">
          {item.name || item.phone}
        </Text>
        <Text className="text-gray-600 text-sm mt-1">
          {formatPhoneNumber(item.phone)}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => handleRemoveFavorite(item.phone)}
        className="p-2"
      >
        <MaterialCommunityIcons 
          name="delete" 
          size={24} 
          color="#f44336" 
        />
      </TouchableOpacity>
    </View>
  );

  // Permission denied view
  if (status === 'permission-denied') {
    return (
      <View className="flex-1 justify-center items-center p-8 bg-white">
        <MaterialCommunityIcons 
          name="alert-circle-outline" 
          size={width * 0.15} 
          color="#f44336" 
        />
        <Text className="text-center mb-4 text-lg text-gray-600">
          {t('contacts.permissionMessage')}
        </Text>
        <TouchableOpacity 
          className="bg-green-500 px-4 py-3 rounded-lg w-48 items-center"
          onPress={() => Linking.openSettings()}
        >
          <Text className="text-white text-base font-semibold">
            {t('contacts.openSettings')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Loading state
  if (isLoadingContacts || isLoadingFavorites) {
    return <Loader />;
  }

  // Empty state for contacts
  if (activeTab === 'contacts' && !filteredContacts.length) {
    return (
      <View className="flex-1 justify-center items-center p-8 bg-white">
        <MaterialCommunityIcons 
          name="account-search" 
          size={width * 0.15} 
          color="#999" 
        />
        <Text className="text-center mt-4 text-lg text-gray-600">
          {t('contacts.noContacts')}
        </Text>
        <TouchableOpacity 
          className="bg-green-500 px-4 py-3 rounded-lg w-48 items-center mt-4"
          onPress={fetchAndSyncContacts}
        >
          <Text className="text-white text-base font-semibold">
            {t('contacts.syncNow')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Empty state for favorites
  if (activeTab === 'favorites' && !favoritesResponse?.data?.length) {
    return (
      <View className="flex-1 justify-center items-center p-8 bg-white">
        <MaterialCommunityIcons 
          name="heart-outline" 
          size={width * 0.15} 
          color="#999" 
        />
        <Text className="text-center mt-4 text-lg text-gray-600">
          {t('contacts.noFavorites')}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Tab navigation */}
      <View className="flex-row border-b border-gray-200">
        <TouchableOpacity 
          className={`flex-1 py-4 items-center ${activeTab === 'contacts' ? 'border-b-2 border-green-500' : ''}`}
          onPress={() => setActiveTab('contacts')}
        >
          <Text className={`text-base font-semibold ${activeTab === 'contacts' ? 'text-green-500' : 'text-gray-500'}`}>
            {t('contacts.contact')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          className={`flex-1 py-4 items-center ${activeTab === 'favorites' ? 'border-b-2 border-green-500' : ''}`}
          onPress={() => {
            setActiveTab('favorites');
            refetchFavorites();
          }}
        >
          <Text className={`text-base font-semibold ${activeTab === 'favorites' ? 'text-green-500' : 'text-gray-500'}`}>
            {t('contacts.favorites')} ({favoritesResponse?.data?.length || 0})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View className="p-4 bg-gray-100 border-b border-gray-200">
        <View className="flex-row items-center">
          <TextInput
            className="flex-1 h-14 border border-gray-300 px-4 rounded-lg text-base bg-white"
            placeholder={t('contacts.searchPlaceholder')}
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity 
            className="ml-2 bg-green-500 p-3 rounded-lg"
            onPress={fetchAndSyncContacts}
          >
            <MaterialCommunityIcons 
              name="sync" 
              size={24} 
              color="white" 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Contacts list */}
      {activeTab === 'contacts' && (
        <FlatList
          data={filteredContacts}
          keyExtractor={(item) => item.phone}
          renderItem={renderContactItem}
          contentContainerStyle={{ paddingBottom: width * 0.05 }}
          refreshing={isLoadingContacts}
          onRefresh={refetchContacts}
        />
      )}

      {/* Favorites list */}
     {activeTab === 'favorites' && (
      <FlatList
        data={favoritesResponse?.data || []}
        keyExtractor={(item) => item.phone}
        renderItem={renderFavoriteItem}
        contentContainerStyle={{ paddingBottom: width * 0.05 }}
        refreshing={isLoadingFavorites}
        onRefresh={refetchFavorites}
      />
    )}

      <Toast />
    </View>
  );
};

export default AddFavorite;