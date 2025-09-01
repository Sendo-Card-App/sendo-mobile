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
  ActivityIndicator,
  StyleSheet
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
import { Feather as MaterialIcons } from '@expo/vector-icons';
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
  
  console.log('Favorites Response:', favoritesResponse);
   const favorites = Array.isArray(favoritesResponse) ? favoritesResponse : [];

    console.log('Favorites:', favorites);
  const {
    data: transfersResponse,
    isLoading: isLoadingTransfers,
    isError: isTransfersError
  } = useGetTransfersQuery();

  const [initTransfer, { isLoading: isTransferLoading }] = useInitTransferToDestinataireMutation();

  const transfers = transfersResponse?.data || [];

  const filteredFavorites = favorites.filter(fav =>
    fav.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredTransfers = transfers.filter(tr =>
    tr.destinataire?.firstname?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectContact = (contact) => {
    const fullContact = {
      ...contact,
      firstname: contact?.user?.firstname || '',
      lastname: contact?.user?.lastname || '',
      email: contact?.user?.email || '',
    };

    navigation.navigate('PaymentMethod', {
      contact: fullContact,
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
    const fullContact = {
      ...contact,
      firstname: contact?.user?.firstname || '',
      lastname: contact?.user?.lastname || '',
      email: contact?.user?.email || '',
    };

    navigation.navigate('PaymentMethod', {
      contact: fullContact,
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
    
    try {
      const response = await initTransfer({
        destinataireId,
        amount: totalAmount,
      }).unwrap();

      if (response?.status === 200) {
        Toast.show({
          type: 'success',
          text1: t('transfer_initiated'),
          text2: t('transfer_status_message'),
        });
        navigation.navigate('Success', { result: response });
      } else {
        throw new Error(response?.message || t('transfer_error'));
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: t('error'),
        text2: error.message || t('generic_error'),
      });
    } finally {
      setSelectedReceiverId(null);
    }
  };

  const renderContact = ({ item }) => (
    <TouchableOpacity
      style={styles.contactItem}
      onPress={() => handleSelectContact(item)}
    >
      <View style={styles.contactAvatar}>
        <Text style={styles.avatarText}>
          {item.name?.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.contactInfo}>
        <Text style={styles.contactName}>{item.name}</Text>
        <Text style={styles.contactPhone}>{item.phone}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderTransfer = ({ item }) => {
    const receiver = item.destinataire;
    if (!receiver) return null;

    const fullName = `${receiver.firstname || ''} ${receiver.lastname || ''}`.trim();

    const confirmTransfer = () => {
      Alert.alert(
        t('confirm_transfer'),
        t('transfer_confirmation_message', { amount: totalAmount, currency: toCurrency, name: fullName }),
        [
          {
            text: t('cancel'),
            style: 'cancel',
          },
          {
            text: t('confirm'),
            onPress: () => handleInitTransfer(receiver, receiver.id),
          },
        ],
        { cancelable: true }
      );
    };

    return (
      <TouchableOpacity
        style={styles.contactItem}
        onPress={confirmTransfer}
        disabled={isTransferLoading}
      >
        <View style={styles.contactAvatar}>
          <Text style={styles.avatarText}>
            {fullName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.contactInfo}>
          <Text style={styles.contactName}>{fullName}</Text>
          <Text style={styles.contactPhone}>{receiver.phone}</Text>
        </View>
        {selectedReceiverId === receiver.id && (
          <ActivityIndicator size="small" color="#7ddd7d" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#F2F2F2" barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="arrowleft" size={24} color="black" />
        </TouchableOpacity>
        <Image source={button} resizeMode="contain" style={styles.logo} />
        <Image source={HomeImage} resizeMode="contain" style={styles.homeImage} />
        <MaterialIcons 
          name="menu" 
          size={24} 
          color="black" 
          onPress={() => navigation.openDrawer()} 
        />
      </View>

      {/* Main Content */}
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{t('choose_beneficiary')}</Text>
        
        {/* Add New Beneficiary */}
        <TouchableOpacity
          style={styles.addBeneficiaryButton}
          onPress={() =>
            navigation.navigate('AddContact', {
              onSave: handleSelectBeneficiary,
              amount, convertedAmount, totalAmount, transferFee,
              fromCurrency, toCurrency, countryName, cadRealTimeValue
            })
          }
        >
          <View style={styles.addBeneficiaryIcon}>
            <AntDesign name="user" size={20} color="black" />
          </View>
          <Text style={styles.addBeneficiaryText}>{t('add_new_beneficiary')}</Text>
        </TouchableOpacity>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <AntDesign name="search1" size={18} color="#aaa" />
          <TextInput
            style={styles.searchInput}
            placeholder={t('search')}
            placeholderTextColor="#aaa"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'contacts' && styles.activeTab]}
            onPress={() => setActiveTab('contacts')}
          >
            <Text style={[styles.tabText, activeTab === 'contacts' && styles.activeTabText]}>
              {t('contacts.contact')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'transfers' && styles.activeTab]}
            onPress={() => setActiveTab('transfers')}
          >
            <Text style={[styles.tabText, activeTab === 'transfers' && styles.activeTabText]}>
              {t('my_destinataires')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* List Content */}
        <View style={styles.listContainer}>
          {activeTab === 'contacts' ? (
            isLoadingFavorites ? (
              <SkeletonLoader />
            ) : isFavoritesError ? (
              <Text style={styles.errorText}>{t('error_loading_contacts')}</Text>
            ) : (
              <FlatList
                data={filteredFavorites}
                keyExtractor={(item) => item.phone}
                renderItem={renderContact}
                ListEmptyComponent={() => (
                  <Text style={styles.emptyText}>{t('no_contacts_found')}</Text>
                )}
              />
            )
          ) : (
            isLoadingTransfers ? (
              <SkeletonLoader />
            ) : isTransfersError ? (
              <Text style={styles.errorText}>{t('error_loading_transfers')}</Text>
            ) : (
              <FlatList
                data={filteredTransfers}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderTransfer}
                ListEmptyComponent={() => (
                  <Text style={styles.emptyText}>{t('no_transfers_found')}</Text>
                )}
              />
            )
          )}
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Ionicons name="shield-checkmark" size={18} color="#7ddd7d" />
        <Text style={styles.footerText}>{t('disclaimer')}</Text>
      </View>

      <Toast />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 24,
  },
  logo: {
    width: 100,
    height: 70,
  },
  homeImage: {
    width: 70,
    height: 70,
    marginTop: -15,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  title: {
    color: 'black',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  addBeneficiaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  addBeneficiaryIcon: {
    backgroundColor: '#7ddd7d',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBeneficiaryText: {
    color: 'black',
    fontSize: 16,
    marginLeft: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#7ddd7d',
  },
  searchInput: {
    flex: 1,
    color: 'black',
    marginLeft: 8,
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#333',
  },
  activeTab: {
    backgroundColor: '#7ddd7d',
  },
  tabText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  activeTabText: {
    color: 'black',
  },
  listContainer: {
    flex: 1,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#333',
    fontSize: 18,
    fontWeight: 'bold',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    color: 'black',
    fontSize: 16,
  },
  contactPhone: {
    color: '#666',
    fontSize: 14,
    marginTop: 4,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 40,
  },
  emptyText: {
    color: 'black',
    textAlign: 'center',
    marginTop: 40,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F2F2F2',
  },
  footerText: {
    color: 'black',
    fontSize: 12,
    marginLeft: 8,
  },
});

export default BeneficiarySelection;