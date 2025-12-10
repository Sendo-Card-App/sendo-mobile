import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  TextInput, 
  Alert, 
  Dimensions,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import * as Contacts from 'expo-contacts';
import * as Linking from 'expo-linking';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, AntDesign, MaterialCommunityIcons } from "@expo/vector-icons";
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
import TransactionSkeleton from '../../components/TransactionSkeleton';
import { useAppState } from '../../context/AppStateContext'; // Import the hook

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

// Serialization helper
const ensureSerializable = (data) => {
  return JSON.parse(JSON.stringify(data));
};

// Error handler
const handleSyncError = (error) => {
  console.error('Sync error details:', error);
  
  if (error?.code === 'MINIFIED_ERROR_38') {
    return 'Data synchronization error. Please try with fewer contacts.';
  }
  
  if (error?.status === 413) {
    return 'Too many contacts to sync at once. Please try again.';
  }
  
  return error.data?.message || error.message || 'Sync failed. Please try again.';
};

const AddFavorite = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { data: userProfile } = useGetUserProfileQuery();
  const userId = userProfile?.data.user?.id;
  const { setIsPickingDocument } = useAppState(); // Use the AppState context
  
  // API hooks
  const [synchronizeContacts] = useSynchronizeContactsMutation();
  const [addFavorite, { isLoading: isAddingFavorite }] = useAddFavoriteMutation();
  const [removeFavorite] = useRemoveFavoriteMutation();
  const { 
    data: favoritesResponse, 
    isLoading: isLoadingFavorites, 
    refetch: refetchFavorites 
  } = useGetFavoritesQuery(userId, { 
    skip: !userId,
    pollingInterval: 1000,
  });

  //console.log(favoritesResponse)

  const { 
    data: synchronizedContacts, 
    isLoading: isLoadingContacts,
    refetch: refetchContacts 
  } = useGetSynchronizedContactsQuery(userId, { skip: !userId });

  // State
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [currentlyAdding, setCurrentlyAdding] = useState(null);
  const [status, setStatus] = useState('idle');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('contacts');
  const [syncProgress, setSyncProgress] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

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
      return String(name || '').replace(/[^\x00-\x7F]/g, '').trim() || 'Unknown';
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

    return ensureSerializable(contactsToSync);
  };

  // Fixed synchronization function
  const fetchAndSyncContacts = async () => {
    try {
      // Set app state to indicate we're syncing contacts
      setIsPickingDocument(true);
      
      const hasPermission = await requestContactsPermission();
      if (!hasPermission) {
        setStatus('permission-denied');
        setIsPickingDocument(false);
        return;
      }

      setStatus('loading');
      setIsSyncing(true);
      setSyncProgress(0);
      
      // Get all contacts from device
      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
      });
      
      if (!data || data.length === 0) {
        setStatus('ready');
        setIsSyncing(false);
        setIsPickingDocument(false);
        Toast.show({
          type: 'info',
          text1: 'No Contacts',
          text2: 'No contacts found on your device'
        });
        return;
      }
      
      // Process contacts to match backend format
      const contactsToSync = processContactsForBackend(data);
      console.log('Processed contacts for sync count:', contactsToSync.length);
      
      if (contactsToSync.length === 0) {
        setStatus('ready');
        setIsSyncing(false);
        setIsPickingDocument(false);
        Toast.show({
          type: 'info',
          text1: 'No Valid Contacts',
          text2: 'No valid phone numbers found in your contacts'
        });
        return;
      }
      
      // Process in smaller batches for production
      const batchSize = 50;
      let successfulSyncs = 0;
      let failedSyncs = 0;
      
      for (let i = 0; i < contactsToSync.length; i += batchSize) {
        const progress = Math.round((i / contactsToSync.length) * 100);
        setSyncProgress(progress);
        
        const batch = contactsToSync.slice(i, i + batchSize);
        
        // Ensure batch contains only serializable data
        const serializableBatch = batch.map(contact => ({
          name: String(contact.name || 'Unknown'),
          phone: String(contact.phone || '')
        }));
        
        try {
          // Send only the contacts array as payload (no userId wrapper)
          const response = await synchronizeContacts(serializableBatch).unwrap();
          successfulSyncs += batch.length;
          console.log(`Batch ${Math.floor(i/batchSize) + 1} sync successful`);
        } catch (error) {
          console.error(`Failed to sync batch starting at index ${i}`, error);
          failedSyncs += batch.length;
          
          // Continue with next batches even if one fails
          continue;
        }
      }
      
      setSyncProgress(100);
      
      // Refresh the synchronized contacts list
      await refetchContacts();
      
      setStatus('ready');
      setIsSyncing(false);
      setIsPickingDocument(false); // Reset app state
      
      Toast.show({
        type: successfulSyncs > 0 ? 'success' : 'error',
        text1: successfulSyncs > 0 ? 'Sync Complete' : 'Sync Failed',
        text2: `Synced ${successfulSyncs}/${contactsToSync.length} contacts${failedSyncs > 0 ? ` (${failedSyncs} failed)` : ''}`
      });

    } catch (error) {
      console.error('Sync failed:', error);
      setStatus('error');
      setIsSyncing(false);
      setIsPickingDocument(false); // Reset app state even on error
      const errorMessage = handleSyncError(error);
      Toast.show({
        type: 'error',
        text1: 'Sync Failed',
        text2: errorMessage
      });
    }
  };

  // Filter contacts based on search and favorites
  useEffect(() => {
    if (synchronizedContacts?.data?.length > 0) {
      // First deduplicate by phone number
      const uniqueContacts = [];
      const seenPhones = new Set();
      
      for (const contact of synchronizedContacts.data) {
        const formattedPhone = formatPhoneNumber(contact.phone);
        if (!seenPhones.has(formattedPhone)) {
          seenPhones.add(formattedPhone);
          uniqueContacts.push(contact);
        }
      }
      
      // Then filter out favorites and apply search
      let result = [...uniqueContacts];
      
      if (favoritesResponse?.data?.length > 0) {
        const favoritePhones = favoritesResponse.data.map(fav => 
          formatPhoneNumber(fav.phone)
        );
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

  const handleAddFavorite = async (contact) => {
    if (currentlyAdding) return; // Prevent multiple clicks
    
    setCurrentlyAdding(contact.phone);
    try {
      await addFavorite({
        userId,
        phone: formatPhoneNumber(contact.phone),
        name: contact.name
      }).unwrap();
      
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Contact added to favorites'
      });
      refetchContacts();
      refetchFavorites();
    } catch (error) {
        console.log('Add favorite error:', JSON.stringify(error, null, 2));
     
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.data?.data?.errors || 'Failed to add favorite'
      });
    } finally {
      setCurrentlyAdding(null);
    }
  };

  const handleRemoveFavorite = async (phone) => {
    try {
      await removeFavorite({ userId, phone }).unwrap();
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Contact removed from favorites'
      });
      refetchFavorites();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.data?.message || 'Failed to remove favorite'
      });
    }
  };

  // Render contact list item with heart icon
  const renderContactItem = ({ item }) => {
    const isAdding = currentlyAdding === item.phone;
    
    const isFavorite = favoritesResponse?.data?.some(
      fav => formatPhoneNumber(fav.phone) === formatPhoneNumber(item.phone)
    );
    
    if (isFavorite) return null;
 
    const isDuplicate = filteredContacts.some(
      contact => 
        contact !== item && 
        formatPhoneNumber(contact.phone) === formatPhoneNumber(item.phone)
    );
    
    // Don't render duplicates
    if (isDuplicate) return null;

    return (
      <View style={{ 
        padding: 16, 
        borderBottomWidth: 1, 
        borderBottomColor: '#eee',
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: 'white'
      }}>
        <MaterialCommunityIcons 
          name="account-outline" 
          size={24} 
          color="#666" 
          style={{ marginRight: 12 }}
        />
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#333' }}>
            {item.name || t('contacts.noName')}
          </Text>
          <Text style={{ color: '#666', fontSize: 14, marginTop: 4 }}>
            {formatPhoneNumber(item.phone)}
          </Text>
        </View>
        <TouchableOpacity
          onPress={() => handleAddFavorite(item)}
          disabled={isAdding || isSyncing}
          style={{ padding: 8 }}
        >
          {isAdding ? (
            <ActivityIndicator size="small" color="#f44336" />
          ) : (
            <MaterialCommunityIcons 
              name="heart-outline" 
              size={24} 
              color="#f44336" 
            />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // Render favorite item
  const renderFavoriteItem = ({ item }) => (
    <View style={{ 
      padding: 16, 
      borderBottomWidth: 1, 
      borderBottomColor: '#eee',
      flexDirection: 'row', 
      alignItems: 'center', 
      backgroundColor: 'white',
      minHeight: 64
    }}>
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: 'bold', fontSize: 16, color: '#333' }}>
          {item.name || item.phone}
        </Text>
        <Text style={{ color: '#666', fontSize: 14, marginTop: 4 }}>
          {formatPhoneNumber(item.phone)}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => handleRemoveFavorite(item.phone)}
        style={{ padding: 8 }}
      >
        <MaterialCommunityIcons 
          name="delete-outline" 
          size={24} 
          color="#f44336" 
        />
      </TouchableOpacity>
    </View>
  );

  // Sync progress component
  const SyncProgress = () => (
    <View style={{ padding: 16, backgroundColor: '#f8f9fa', alignItems: 'center' }}>
      <Text style={{ color: '#666', marginBottom: 8 }}>
        Syncing contacts... {syncProgress}%
      </Text>
      <View style={{ 
        height: 4, 
        backgroundColor: '#e9ecef', 
        borderRadius: 2, 
        width: '100%',
        overflow: 'hidden'
      }}>
        <View style={{ 
          height: '100%', 
          backgroundColor: '#28a745', 
          width: `${syncProgress}%`,
          borderRadius: 2
        }} />
      </View>
    </View>
  );

  // Permission denied view
  if (status === 'permission-denied') {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: 32, 
        backgroundColor: 'white' 
      }}>
        <MaterialCommunityIcons 
          name="alert-circle-outline" 
          size={width * 0.15} 
          color="#f44336" 
        />
        <Text style={{ 
          textAlign: 'center', 
          marginBottom: 16, 
          fontSize: 18, 
          color: '#666',
          marginTop: 16
        }}>
          {t('contacts.permissionMessage')}
        </Text>
        <TouchableOpacity 
          style={{ 
            backgroundColor: '#28a745', 
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 8,
            width: 192,
            alignItems: 'center'
          }}
          onPress={() => Linking.openSettings()}
        >
          <Text style={{ 
            color: 'white', 
            fontSize: 16, 
            fontWeight: '600' 
          }}>
            {t('contacts.openSettings')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Loading state
  if (isLoadingContacts || isLoadingFavorites) {
    return (
      <View style={{ flex: 1, backgroundColor: 'white' }}>
        <StatusBar backgroundColor="#7ddd7d" barStyle="light-content" />
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#7ddd7d',
            paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 40,
            paddingBottom: 15,
            paddingHorizontal: 15,
          }}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40 }}>
            <AntDesign name="left" size={24} color="white" />
          </TouchableOpacity>

          <Text style={{ 
              color: '#fff', 
              fontSize: 20, 
              fontWeight: 'bold', 
              flex: 1, 
              textAlign: 'center' 
          }}>
            {t('screens.addFavorite')}
          </Text>

          <View style={{ width: 40 }} />
        </View>
        <FlatList
          data={[1, 2, 3, 4, 5]}
          keyExtractor={(item) => item.toString()}
          renderItem={() => <TransactionSkeleton />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 20 }}
          showsVerticalScrollIndicator={false}
        />
      </View>
    );
  }

  // Empty state for contacts
  if (activeTab === 'contacts' && !filteredContacts.length && !isSyncing) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: 32, 
        backgroundColor: 'white' 
      }}>
        <MaterialCommunityIcons 
          name="account-search" 
          size={width * 0.15} 
          color="#999" 
        />
        <Text style={{ 
          textAlign: 'center', 
          marginTop: 16, 
          fontSize: 18, 
          color: '#666' 
        }}>
          {t('contacts.noContacts')}
        </Text>
        <TouchableOpacity 
          style={{ 
            backgroundColor: '#28a745', 
            paddingHorizontal: 16,
            paddingVertical: 12,
            borderRadius: 8,
            width: 192,
            alignItems: 'center',
            marginTop: 16
          }}
          onPress={fetchAndSyncContacts}
          disabled={isSyncing}
        >
          <Text style={{ 
            color: 'white', 
            fontSize: 16, 
            fontWeight: '600' 
          }}>
            {t('contacts.syncNow')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <StatusBar backgroundColor="#7ddd7d" barStyle="light-content" />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#7ddd7d',
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 40,
          paddingBottom: 15,
          paddingHorizontal: 15,
        }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40 }}>
          <AntDesign name="left" size={24} color="white" />
        </TouchableOpacity>

        <Text style={{ 
            color: '#fff', 
            fontSize: 20, 
            fontWeight: 'bold', 
            flex: 1, 
            textAlign: 'center' 
        }}>
          {t('screens.addFavorite')}
        </Text>

        <View style={{ width: 40 }} />
      </View>

      {/* Sync Progress */}
      {isSyncing && <SyncProgress />}

      {/* Tab navigation */}
      <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e5e5' }}>
        <TouchableOpacity 
          style={{ 
            flex: 1, 
            paddingVertical: 16, 
            alignItems: 'center',
            borderBottomWidth: activeTab === 'contacts' ? 2 : 0,
            borderBottomColor: activeTab === 'contacts' ? '#28a745' : 'transparent'
          }}
          onPress={() => setActiveTab('contacts')}
        >
          <Text style={{ 
            fontSize: 16, 
            fontWeight: '600', 
            color: activeTab === 'contacts' ? '#28a745' : '#666' 
          }}>
            {t('contacts.contact')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={{ 
            flex: 1, 
            paddingVertical: 16, 
            alignItems: 'center',
            borderBottomWidth: activeTab === 'favorites' ? 2 : 0,
            borderBottomColor: activeTab === 'favorites' ? '#28a745' : 'transparent'
          }}
          onPress={() => {
            setActiveTab('favorites');
            refetchFavorites();
          }}
        >
          <Text style={{ 
            fontSize: 16, 
            fontWeight: '600', 
            color: activeTab === 'favorites' ? '#28a745' : '#666' 
          }}>
            {t('contacts.favorites')} ({favoritesResponse?.length || 0})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={{ padding: 16, backgroundColor: '#f8f9fa', borderBottomWidth: 1, borderBottomColor: '#e5e5e5' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TextInput
            style={{ 
              flex: 1, 
              height: 56, 
              borderWidth: 1, 
              borderColor: '#dee2e6', 
              paddingHorizontal: 16, 
              borderRadius: 8, 
              fontSize: 16, 
              backgroundColor: 'white'
            }}
            placeholder={t('contacts.searchPlaceholder')}
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          <TouchableOpacity 
            style={{ 
              marginLeft: 8, 
              backgroundColor: '#28a745', 
              padding: 12, 
              borderRadius: 8 
            }}
            onPress={fetchAndSyncContacts}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <MaterialCommunityIcons 
                name="sync" 
                size={24} 
                color="white" 
              />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Contacts list */}
      {activeTab === 'contacts' && (
        <FlatList
          data={filteredContacts}
          keyExtractor={(item) => item.phone}
          renderItem={renderContactItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshing={isLoadingContacts}
          onRefresh={refetchContacts}
          ListEmptyComponent={
            isSyncing ? null : (
              <View style={{ alignItems: 'center', padding: 32, justifyContent: 'center' }}>
                <Text style={{ fontSize: 16, color: '#666' }}>
                  {t('contacts.noContactsFound')}
                </Text>
              </View>
            )
          }
        />
      )}

      {/* Favorites list */}
      {activeTab === 'favorites' && (
        <FlatList
          data={favoritesResponse || []}
          keyExtractor={(item) => item.phone}
          renderItem={renderFavoriteItem}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', padding: 32, justifyContent: 'center' }}>
              <Text style={{ fontSize: 16, color: '#666' }}>
                {t('contacts.noFavorites')}
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