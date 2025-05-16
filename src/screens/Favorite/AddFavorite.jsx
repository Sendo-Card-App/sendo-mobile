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
  useGetFavoritesQuery 
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
  const { data: favoritesResponse, isLoading: isLoadingFavorites } = useGetFavoritesQuery(userId, { skip: !userId });
  
  // Ensure favorites is always an array
  const favorites = Array.isArray(favoritesResponse) ? favoritesResponse : 
                   (favoritesResponse?.data ? favoritesResponse.data : []);
  
  // State
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [status, setStatus] = useState('idle');
  const [searchQuery, setSearchQuery] = useState('');
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
    const pageSize = 100; // Number of contacts to fetch per batch

    while (hasMoreContacts) {
      // Fetch contacts in batches
      const { data, hasNextPage } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.Name, Contacts.Fields.PhoneNumbers],
        pageSize,
        pageOffset: offset,
      });

      // Filter valid contacts with phone numbers
      const validContacts = data.filter(contact => 
        contact.phoneNumbers && contact.phoneNumbers.length > 0
      );

      allContacts = [...allContacts, ...validContacts];
      offset += pageSize;
      hasMoreContacts = hasNextPage;

      // Update UI periodically with progress
      setContacts(allContacts);
      setStatus(`loading-${offset}`); // You can use this to show progress
    }

    // Prepare contacts for synchronization in batches
    const batchSize = 50; // Sync in smaller batches to avoid timeout
    for (let i = 0; i < allContacts.length; i += batchSize) {
      const batch = allContacts.slice(i, i + batchSize);
      const contactsToSync = batch.map(contact => ({
        name: contact.name,
        phone: contact.phoneNumbers[0].number
      }));

      // Sync current batch with backend
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
      if (favorites.length > 0) {
        const favoritePhones = favorites.map(fav => fav.phone);
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
  }, [contacts, favorites, searchQuery]);

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
      // Check if already in favorites
      const isAlreadyFavorite = favorites.some(
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
      
      // Add to favorites via API
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
      style={{
        padding: width * 0.05,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: height * 0.08,
        backgroundColor: '#fff'
      }}
      onPress={() => handleSelectContact(item)}
      activeOpacity={0.7}
    >
      <MaterialCommunityIcons 
        name="account-outline" 
        size={width * 0.07} 
        color="#666" 
        style={{ marginRight: width * 0.04 }}
      />
      <View style={{ flex: 1 }}>
        <Text style={{ 
          fontWeight: 'bold', 
          fontSize: width * 0.04,
          color: '#333'
        }}>
          {item.name || t('contacts.noName')}
        </Text>
        {item.phoneNumbers && item.phoneNumbers.length > 0 && (
          <Text style={{ 
            color: '#666', 
            fontSize: width * 0.035,
            marginTop: 4
          }}>
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

  // Permission denied view
  if (status === 'permission-denied') {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: width * 0.1,
        backgroundColor: '#fff'
      }}>
        <MaterialCommunityIcons 
          name="alert-circle-outline" 
          size={width * 0.15} 
          color="#f44336" 
        />
        <Text style={{
          textAlign: 'center',
          marginBottom: width * 0.05,
          fontSize: width * 0.045,
          color: '#555'
        }}>
          {t('contacts.permissionMessage')}
        </Text>
        <TouchableOpacity 
          style={{
            backgroundColor: '#4CAF50',
            padding: width * 0.04,
            borderRadius: 8,
            width: width * 0.6,
            alignItems: 'center'
          }}
          onPress={() => Linking.openSettings()}
        >
          <Text style={{ 
            color: 'white', 
            fontSize: width * 0.04,
            fontWeight: '600'
          }}>
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
  if (status === 'ready' && filteredContacts.length === 0) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: width * 0.1,
        backgroundColor: '#fff'
      }}>
        <MaterialCommunityIcons 
          name="account-search" 
          size={width * 0.15} 
          color="#999" 
        />
        <Text style={{
          textAlign: 'center',
          marginTop: width * 0.05,
          fontSize: width * 0.045,
          color: '#555'
        }}>
          {t('contacts.noContacts')}
        </Text>
      </View>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: width * 0.1,
        backgroundColor: '#fff'
      }}>
        <MaterialCommunityIcons 
          name="emoticon-sad-outline" 
          size={width * 0.15} 
          color="#f44336" 
        />
        <Text style={{
          textAlign: 'center',
          marginBottom: width * 0.05,
          fontSize: width * 0.045,
          color: '#555'
        }}>
          {t('contacts.syncError')}
        </Text>
        <TouchableOpacity 
          style={{
            backgroundColor: '#4CAF50',
            padding: width * 0.04,
            borderRadius: 8,
            width: width * 0.6,
            alignItems: 'center'
          }}
          onPress={fetchAndSyncContacts}
        >
          <Text style={{ 
            color: 'white', 
            fontSize: width * 0.04,
            fontWeight: '600'
          }}>
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
          style={{ flex: 1, backgroundColor: '#fff' }}
          contentContainerStyle={{ paddingBottom: width * 0.1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ padding: width * 0.05 }}>
            <Text style={{ 
              fontSize: width * 0.05,
              marginBottom: width * 0.05,
              fontWeight: '600',
              color: '#333'
            }}>
              {t('contacts.addFavorite')}
            </Text>
            
            <Text style={{ 
              marginBottom: width * 0.02,
              fontSize: width * 0.04,
              color: '#555'
            }}>
              {t('contacts.beneficiaryName')}
            </Text>
            <TextInput
              style={{
                height: height * 0.06,
                borderColor: '#ddd',
                borderWidth: 1,
                marginBottom: width * 0.04,
                paddingHorizontal: width * 0.03,
                borderRadius: 8,
                fontSize: width * 0.04,
                backgroundColor: '#fff'
              }}
              value={formData.name}
              onChangeText={(text) => setFormData({...formData, name: text})}
              placeholder={t('contacts.namePlaceholder')}
              placeholderTextColor="#999"
            />
            
            <Text style={{ 
              marginBottom: width * 0.02,
              fontSize: width * 0.04,
              color: '#555'
            }}>
              {t('contacts.phoneNumber')}
            </Text>
            <TextInput
              style={{
                height: height * 0.06,
                borderColor: '#ddd',
                borderWidth: 1,
                marginBottom: width * 0.04,
                paddingHorizontal: width * 0.03,
                borderRadius: 8,
                fontSize: width * 0.04,
                backgroundColor: '#fff'
              }}
              value={formData.phoneNumber}
              onChangeText={(text) => setFormData({...formData, phoneNumber: text})}
              placeholder={t('contacts.phonePlaceholder')}
              placeholderTextColor="#999"
              keyboardType="phone-pad"
            />
            
            <Text style={{ 
              marginBottom: width * 0.02,
              fontSize: width * 0.04,
              color: '#555'
            }}>
              {t('contacts.receptionMethod')}
            </Text>
            <View style={{
              width: '100%',
              marginBottom: width * 0.05,
              backgroundColor: '#f9f9f9',
              borderRadius: 8,
              borderWidth: 1,
              borderColor: '#ddd',
              overflow: 'hidden'
            }}>
              <Picker
                selectedValue={formData.receptionMethod}
                onValueChange={(itemValue) => 
                  setFormData({...formData, receptionMethod: itemValue})
                }
                style={{
                  height: height * 0.06,
                }}
                dropdownIconColor="#666"
              >
                <Picker.Item label="Orange Money" value="Orange Money" />
                <Picker.Item label="MTN Mobile Money" value="MTN Mobile Money" />
                <Picker.Item label={t('contacts.bankAccount')} value="Bank Account" />
              </Picker>
            </View>
            
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: width * 0.05
            }}>
              <TouchableOpacity 
                style={{
                  flex: 1,
                  marginHorizontal: width * 0.015,
                  padding: width * 0.035,
                  borderRadius: 8,
                  alignItems: 'center',
                  backgroundColor: '#f44336'
                }}
                onPress={() => setSelectedContact(null)}
                activeOpacity={0.7}
              >
                <Text style={{ 
                  color: 'white', 
                  fontSize: width * 0.04,
                  fontWeight: '600'
                }}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={{
                  flex: 1,
                  marginHorizontal: width * 0.015,
                  padding: width * 0.035,
                  borderRadius: 8,
                  alignItems: 'center',
                  backgroundColor: '#4CAF50'
                }}
                onPress={handleAddFavorite}
                disabled={isAddingFavorite}
                activeOpacity={0.7}
              >
                <Text style={{ 
                  color: 'white', 
                  fontSize: width * 0.04,
                  fontWeight: '600'
                }}>
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

  // Contact list view
  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{
        padding: width * 0.05,
        backgroundColor: '#f5f5f5',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd'
      }}>
        <TextInput
          style={{
            height: height * 0.06,
            borderColor: '#ddd',
            borderWidth: 1,
            paddingHorizontal: width * 0.04,
            borderRadius: 8,
            fontSize: width * 0.04,
            backgroundColor: '#fff'
          }}
          placeholder={t('contacts.searchPlaceholder')}
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
      <FlatList
        data={filteredContacts}
        keyExtractor={(item) => item.id}
        renderItem={renderContactItem}
        contentContainerStyle={{ paddingBottom: width * 0.05 }}
        refreshing={status === 'loading'}
        onRefresh={fetchAndSyncContacts}
        ListEmptyComponent={
          <View style={{ 
            alignItems: 'center', 
            padding: width * 0.1,
            justifyContent: 'center'
          }}>
            <Text style={{ 
              fontSize: width * 0.04,
              color: '#666'
            }}>
              {t('contacts.noContacts')}
            </Text>
          </View>
        }
      />
      <Toast />
    </View>
  );
};

export default AddFavorite;