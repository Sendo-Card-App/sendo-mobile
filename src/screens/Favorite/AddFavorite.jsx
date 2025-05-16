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
  useRemoveFavoriteMutation 
} from '../../services/Contact/contactsApi';
import Loader from "../../components/Loader";

const { width, height } = Dimensions.get('window');

const AddFavorite = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { data: userProfile } = useGetUserProfileQuery();
  const userId = userProfile?.data.id;
  
  // API hooks
  const [synchronizeContacts] = useSynchronizeContactsMutation();
  const [addFavorite, { isLoading: isAddingFavorite }] = useAddFavoriteMutation();
  const [removeFavorite] = useRemoveFavoriteMutation();
  const { data: favoritesResponse, isLoading: isLoadingFavorites, refetch: refetchFavorites } = useGetFavoritesQuery(userId, { skip: !userId });
  
  // State
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [status, setStatus] = useState('idle');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('contacts'); // 'contacts' or 'favorites'
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    receptionMethod: 'Orange Money',
    country: 'Cameroun'
  });

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

  // Fetch and sync contacts
  const fetchAndSyncContacts = async () => {
    try {
      const hasPermission = await requestContactsPermission();
      if (!hasPermission) {
        setStatus('permission-denied');
        return;
      }

      setStatus('loading');
      
      // Initial fetch with pagination
      let allContacts = [];
      let hasMoreContacts = true;
      let offset = 0;
      const pageSize = 100;

      while (hasMoreContacts) {
        const { data, hasNextPage } = await Contacts.getContactsAsync({
          fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
          pageSize,
          pageOffset: offset,
        });

        const validContacts = data.filter(contact => 
          contact.phoneNumbers && contact.phoneNumbers.length > 0
        );

        allContacts = [...allContacts, ...validContacts];
        offset += pageSize;
        hasMoreContacts = hasNextPage;

        setContacts(allContacts);
        setStatus(`loading-${offset}`);
      }

      const batchSize = 50;
      for (let i = 0; i < allContacts.length; i += batchSize) {
        const batch = allContacts.slice(i, i + batchSize);
        const contactsToSync = batch.map(contact => ({
          name: contact.name,
          phone: contact.phoneNumbers[0].number
        }));

        await synchronizeContacts(contactsToSync).unwrap();
      }

      setStatus('ready');
      Toast.show({
        type: 'success',
        text1: 'Sync Complete',
        text2: `Successfully synced ${allContacts.length} contacts`
      });

    } catch (error) {
      console.error('Failed to sync contacts:', error);
      setStatus('error');
      Toast.show({
        type: 'error',
        text1: 'Sync Failed',
        text2: 'Failed to synchronize contacts with server'
      });
    }
  };

  // Handle delete favorite
  const handleDeleteFavorite = async (phone) => {
    try {
      Alert.alert(
        'Confirm Delete',
        'Are you sure you want to remove this contact from favorites?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Delete',
            onPress: async () => {
              await removeFavorite({ userId, phone }).unwrap();
              refetchFavorites();
              Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Contact removed from favorites'
              });
            },
            style: 'destructive',
          },
        ],
      );
    } catch (error) {
      console.error('Failed to delete favorite:', error);
      Toast.show({
        type: 'error',
        text1: 'Delete Failed',
        text2: 'Failed to remove contact from favorites'
      });
    }
  };

  // Phone number validation
  const isValidPhoneNumber = (phoneNumber) => {
    const cleaned = phoneNumber.replace(/[^\d+]/g, '');
    const cameroonRegex = /^(\+237|237)?[6|2|3]\d{8}$/;
    const canadaRegex = /^(\+1|1)?\d{10}$/;
    return cameroonRegex.test(cleaned) || canadaRegex.test(cleaned);
  };

  // Handle contact selection
  const handleSelectContact = (contact) => {
    if (!contact.phoneNumbers || contact.phoneNumbers.length === 0) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Contact',
        text2: 'Selected contact has no phone number'
      });
      return;
    }
    
    setSelectedContact(contact);
    setFormData({
      name: contact.name || '',
      phoneNumber: contact.phoneNumbers[0].number || '',
      receptionMethod: 'Orange Money',
      country: 'Cameroun'
    });
  };

  useEffect(() => {
    if (contacts.length > 0) {
      let result = [...contacts];
      
      // Filter out favorites
      if (favoritesResponse?.data?.length > 0) {
        const favoritePhones = favoritesResponse.data.map(fav => fav.phone);
        result = result.filter(
          contact => !favoritePhones.includes(contact.phoneNumbers[0]?.number)
        );
      }
      
      // Apply search filter
      if (searchQuery) {
        result = result.filter(contact => 
          contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.phoneNumbers?.[0]?.number?.includes(searchQuery)
        );
      }
      
      setFilteredContacts(result);
    }
  }, [contacts, favoritesResponse, searchQuery]);

  // Handle form submission
  const handleAddFavorite = async () => {
    if (!formData.name || !formData.phoneNumber) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Name and phone number are required'
      });
      return;
    }
    
    if (!isValidPhoneNumber(formData.phoneNumber)) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please enter a valid phone number'
      });
      return;
    }
    
    try {
      const isAlreadyFavorite = favoritesResponse?.data?.some(
        fav => fav.phone === formData.phoneNumber
      );
      
      if (isAlreadyFavorite) {
        Toast.show({
          type: 'error',
          text1: 'Duplicate Contact',
          text2: 'This contact is already in your favorites'
        });
        return;
      }
      
      await addFavorite({
        userId,
        phone: formData.phoneNumber
      }).unwrap();
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Contact added to favorites successfully'
      });
      navigation.goBack();
    } catch (error) {
      console.error('Failed to add favorite:', error);
      Toast.show({
        type: 'error',
        text1: 'Add Failed',
        text2: 'Failed to add contact to favorites'
      });
    }
  };

  // Load contacts on mount
  useEffect(() => {
    if (userId) {
      fetchAndSyncContacts();
    }
  }, [userId]);

  // Render contact list item
  const renderContactItem = ({ item }) => (
    <TouchableOpacity 
      className="p-4 border-b border-gray-200 flex-row items-center min-h-16 bg-white"
      onPress={() => handleSelectContact(item)}
      activeOpacity={0.7}
    >
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
        {item.phoneNumbers && item.phoneNumbers.length > 0 && (
          <Text className="text-gray-600 text-sm mt-1">
            {item.phoneNumbers[0].number}
          </Text>
        )}
      </View>
      <MaterialCommunityIcons 
        name="chevron-right" 
        size={width * 0.06} 
        color="#999" 
      />
    </TouchableOpacity>
  );

  // Render favorite item
  const renderFavoriteItem = ({ item }) => (
    <View className="p-4 border-b border-gray-200 flex-row items-center min-h-16 bg-white">
      <View className="flex-1">
        <Text className="font-bold text-base text-gray-800">
          {item.name || item.phone}
        </Text>
        <Text className="text-gray-600 text-sm mt-1">
          {item.phone}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => handleDeleteFavorite(item.phone)}
        className="p-2"
      >
        <MaterialCommunityIcons 
          name="delete" 
          size={width * 0.06} 
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
  if (status === 'loading' || isLoadingFavorites) {
    return <Loader />;
  }

  // Empty state
  if (status === 'ready' && filteredContacts.length === 0 && activeTab === 'contacts') {
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
      </View>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <View className="flex-1 justify-center items-center p-8 bg-white">
        <MaterialCommunityIcons 
          name="emoticon-sad-outline" 
          size={width * 0.15} 
          color="#f44336" 
        />
        <Text className="text-center mb-4 text-lg text-gray-600">
          {t('contacts.syncError')}
        </Text>
        <TouchableOpacity 
          className="bg-green-500 px-4 py-3 rounded-lg w-48 items-center"
          onPress={fetchAndSyncContacts}
        >
          <Text className="text-white text-base font-semibold">
            {t('common.retry')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Form view
  if (selectedContact) {
    return (
      <>
        <ScrollView 
          className="flex-1 bg-white"
          contentContainerStyle={{ paddingBottom: width * 0.1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="p-4">
            <Text className="text-xl mb-4 font-semibold text-gray-800">
              {t('contacts.addFavorite')}
            </Text>
            
            <Text className="mb-1 text-base text-gray-600">
              {t('contacts.beneficiaryName')}
            </Text>
            <TextInput
              className="h-14 border border-gray-300 mb-3 px-3 rounded-lg text-base bg-white"
              value={formData.name}
              onChangeText={(text) => setFormData({...formData, name: text})}
              placeholder={t('contacts.namePlaceholder')}
              placeholderTextColor="#999"
            />
            
            <Text className="mb-1 text-base text-gray-600">
              {t('contacts.phoneNumber')}
            </Text>
            <TextInput
              className="h-14 border border-gray-300 mb-3 px-3 rounded-lg text-base bg-white"
              value={formData.phoneNumber}
              onChangeText={(text) => setFormData({...formData, phoneNumber: text})}
              placeholder={t('contacts.phonePlaceholder')}
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
            
            <Text className="mb-1 text-base text-gray-600">
              {t('contacts.receptionMethod')}
            </Text>
            <View className="w-full mb-5 bg-gray-50 rounded-lg border border-gray-300 overflow-hidden">
              <Picker
                selectedValue={formData.receptionMethod}
                onValueChange={(itemValue) => 
                  setFormData({...formData, receptionMethod: itemValue})
                }
                style={{ height: height * 0.06 }}
                dropdownIconColor="#666"
              >
                <Picker.Item label="Orange Money" value="Orange Money" />
                <Picker.Item label="MTN Mobile Money" value="MTN Mobile Money" />
                <Picker.Item label={t('contacts.bankAccount')} value="Bank Account" />
              </Picker>
            </View>
            
            <View className="flex-row justify-between mt-4">
              <TouchableOpacity 
                className="flex-1 mx-1 py-3 rounded-lg items-center bg-red-500"
                onPress={() => setSelectedContact(null)}
                activeOpacity={0.7}
              >
                <Text className="text-white text-base font-semibold">
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="flex-1 mx-1 py-3 rounded-lg items-center bg-green-500"
                onPress={handleAddFavorite}
                disabled={isAddingFavorite}
                activeOpacity={0.7}
              >
                <Text className="text-white text-base font-semibold">
                  {isAddingFavorite ? t('common.processing') : t('contacts.addToFavorites')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        <Toast />
      </>
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
            Contacts
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
            Favorites ({favoritesResponse?.data?.length || 0})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View className="p-4 bg-gray-100 border-b border-gray-200">
        <TextInput
          className="h-14 border border-gray-300 px-4 rounded-lg text-base bg-white"
          placeholder={t('contacts.searchPlaceholder')}
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Contacts list */}
      {activeTab === 'contacts' && (
        <FlatList
          data={filteredContacts}
          keyExtractor={(item) => item.id}
          renderItem={renderContactItem}
          contentContainerStyle={{ paddingBottom: width * 0.05 }}
          refreshing={status === 'loading'}
          onRefresh={fetchAndSyncContacts}
          ListEmptyComponent={
            <View className="items-center p-8 justify-center">
              <Text className="text-base text-gray-600">
                {t('contacts.noContacts')}
              </Text>
            </View>
          }
        />
      )}

      {/* Favorites list */}
      {activeTab === 'favorites' && (
        <FlatList
          data={favoritesResponse?.data || []}
          keyExtractor={(item) => item.phone}
          renderItem={renderFavoriteItem}
          contentContainerStyle={{ paddingBottom: width * 0.05 }}
          ListEmptyComponent={
            <View className="items-center p-8 justify-center">
              <Text className="text-base text-gray-600">
                No favorites yet
              </Text>
            </View>
          }
        />
      )}

      <Toast />
    </View>
  );
};

export default AddFavorite;