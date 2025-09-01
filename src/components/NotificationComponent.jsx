import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useGetNotificationsQuery, useMarkAsReadMutation } from '../services/Notification/notificationApi';
import { useGetUserProfileQuery } from '../services/Auth/authAPI';
import { MaterialIcons } from '@expo/vector-icons';
import Loader from './Loader';
import { skipToken } from '@reduxjs/toolkit/query/react';
import { TypesNotification } from '../utils/constants';
import { useState } from 'react';

export const getIconName = (type) => {
  const map = {
    [TypesNotification.SUCCESS_ACCOUNT_VERIFIED]: 'check-circle',
    [TypesNotification.INFORMATION]: 'info',
    [TypesNotification.MARKETING]: 'campaign',
    [TypesNotification.SUCCESS_KYC_VERIFIED]: 'verified',
    [TypesNotification.SUCCESS_TRANSFER_FUNDS]: 'swap-horiz',
    [TypesNotification.SUCCESS_DEPOSIT_WALLET]: 'account-balance-wallet',
    [TypesNotification.SUCCESS_DEPOSIT_CARD]: 'credit-card',
    [TypesNotification.PAYMENT_FAILED]: 'error',
    [TypesNotification.SUCCESS_ADD_SECOND_NUMBER]: 'add-call',
    [TypesNotification.SUCCESS_VERIFY_SECOND_NUMBER]: 'verified-user',
    [TypesNotification.SUCCESS_CREATING_CARD]: 'credit-card',
    [TypesNotification.ERROR]: 'warning',
    [TypesNotification.SUCCESS_MODIFY_PASSWORD]: 'lock-open',
    [TypesNotification.SUCCESS_MODIFY_ACCOUNT_INFORMATIONS]: 'manage-accounts',
    [TypesNotification.DELETE_ACCOUNT]: 'delete',
    [TypesNotification.ENABLED_ACCOUNT]: 'toggle-on',
    [TypesNotification.DISABLED_ACCOUNT]: 'toggle-off',
    [TypesNotification.PROCESSED_REQUEST]: 'task-alt',
    [TypesNotification.MESSAGE]: 'message',
    [TypesNotification.FUND_REQUEST]: 'request-page',
    [TypesNotification.SHARED_EXPENSE]: 'group',
    [TypesNotification.TONTINE]: 'savings',
  };

  return map[type] || 'notifications';
};


const NotificationComponent = () => {
   const { data: userProfile, isLoading, error } = useGetUserProfileQuery(
      undefined, 
      {
        pollingInterval: 1000, 
      }
    );
  const userId = userProfile?.data?.id;

  const [page, setPage] = useState(1);
    const limit = 20;

  const {
    data: notificationsResponse,
    isLoading: notificationsLoading,
    refetch,
  } = useGetNotificationsQuery(userId ? { userId, page, limit,
      pollingInterval: 1000,
   } : skipToken);

   //console.log('Liste des notification:', JSON.stringify(notificationsResponse, null, 2));

  const [markAsRead] = useMarkAsReadMutation();

  if (profileLoading || notificationsLoading) {
    return (
      <View style={styles.loading}>
        <Loader size="large" color="#0D1C6A" />
      </View>
    );
  }

  const allNotifications = notificationsResponse?.data?.items || [];
  //const unreadNotifications = allNotifications.filter((n) => !n.readed);

const handleMarkRead = async (notification) => {
  if (notification.readed) return;

  try {
    await markAsRead(notification.id).unwrap();
    refetch(); // rafraîchir, mais on n'enlèvera pas la notification de l'affichage
  } catch (err) {
    console.warn('Failed to mark notification as read', err);
  }
}

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => handleMarkRead(item)}
      style={[styles.notificationItem, { backgroundColor: '#EBF4FF' }]}
    >
      <View style={styles.iconContainer}>
        <MaterialIcons name={getIconName(item.type)} size={24} color="green" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { fontWeight: '700', color: 'green' }]}>{item.title}</Text>
        <Text style={styles.body}>{item.content}</Text>
        <Text style={styles.date}>{new Date(item.createdAt).toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
  <FlatList
    data={allNotifications}
    renderItem={({ item }) => (
      <TouchableOpacity
        onPress={() => handleMarkRead(item)}
        style={[
          styles.notificationItem,
          {
            backgroundColor: item.readed ? '#f9f9f9' : '#EBF4FF',
          },
        ]}
      >
        <View style={styles.iconContainer}>
          <MaterialIcons name={getIconName(item.type)} size={24} color="green" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { fontWeight: '700', color: 'green' }]}>
            {item.title}
          </Text>
          <Text style={styles.body}>{item.content}</Text>
          <Text style={styles.date}>
            {new Date(item.createdAt).toLocaleString()}
          </Text>
        </View>
      </TouchableOpacity>
    )}
    keyExtractor={(item) => item.id.toString()}
    contentContainerStyle={{ paddingBottom: 20 }}
    ListEmptyComponent={() => (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="notifications-off" size={40} color="#ccc" />
        <Text style={styles.emptyText}>No notifications</Text>
      </View>
    )}
  />
);
};

const styles = StyleSheet.create({
  notificationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  iconContainer: {
    marginRight: 16,
  },
  title: {
    fontSize: 16,
  },
  body: {
    fontSize: 14,
    color: '#666',
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 32,
  },
  emptyText: {
    color: '#999',
    marginTop: 8,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default NotificationComponent;
