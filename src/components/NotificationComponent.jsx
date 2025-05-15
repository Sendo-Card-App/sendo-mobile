import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, FlatList, TouchableWithoutFeedback } from 'react-native';
import { useGetNotificationsQuery, useMarkAsReadMutation } from '../services/Notification/notificationApi';
import { useGetUserProfileQuery } from "../services/Auth/authAPI";
import Icon from 'react-native-vector-icons/MaterialIcons';

const NotificationComponent = () => {
  const [modalVisible, setModalVisible] = useState(false);
  
  // 1. Get user profile first
  const { data: userProfile, isLoading: isProfileLoading } = useGetUserProfileQuery();
  const userId = userProfile?.data?.id;

  // 2. Only fetch notifications if userId exists
  const { 
    data: notifications = [], 
    isLoading, 
    isError,
    refetch,
    error: notificationError // Add error tracking
  } = useGetNotificationsQuery(userId, {
    skip: !userId // Skip if no userId
  });

  const [markAsRead] = useMarkAsReadMutation();

  // Debug logs
  useEffect(() => {
    console.log('Current User ID:', userId);
    console.log('Notifications data:', notifications);
    if (notificationError) {
      console.log('Notification error:', notificationError);
    }
  }, [userId, notifications, notificationError]);

  // Get unread count
  const unreadCount = notifications?.filter(n => !n?.isRead)?.length || 0;

  // Refresh notifications periodically
  useEffect(() => {
    if (!userId) return; // Don't refresh if no userId

    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [userId, refetch]);

  const handleNotificationPress = async (notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
      refetch(); // Refresh notifications after marking as read
    }
    // Handle navigation based on notification type
    // setModalVisible(false);
    // navigation.navigate(notification.type);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.notificationItem, !item.isRead && styles.unread]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.iconContainer}>
        <Icon 
          name={getIconName(item.type)} 
          size={24} 
          color={item.isRead ? '#888' : '#0D1C6A'} 
        />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, !item.isRead && styles.boldTitle]}>
          {item.title}
        </Text>
        <Text style={styles.body}>{item.body}</Text>
        <Text style={styles.time}>
          {new Date(item.createdAt).toLocaleString()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Helper function to get icon based on notification type
  const getIconName = (type) => {
    switch(type) {
      case 'payment': return 'payment';
      case 'transaction': return 'swap-horiz';
      case 'account': return 'account-circle';
      default: return 'notifications';
    }
  };

  if (isLoading) return null;
  if (isError) return null;

  return (
    <>
      {/* Notification Bell Icon with Badge */}
      <TouchableOpacity 
        style={styles.bellContainer}
        onPress={() => setModalVisible(true)}
      >
        <Icon name="notifications" size={24} color="#000" />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 9 ? '9+' : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Notification Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay} />
        </TouchableWithoutFeedback>

        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Notifications</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              renderItem={renderItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  // Bell Icon and Badge Styles
  bellContainer: {
    position: 'relative',
    padding: 10,
  },
  badge: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'red',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '70%',
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },

  // Notification Item Styles
  notificationItem: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  unread: {
    backgroundColor: '#f5f9ff',
  },
  iconContainer: {
    marginRight: 15,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    marginBottom: 5,
    color: '#555',
  },
  boldTitle: {
    fontWeight: 'bold',
    color: '#000',
  },
  body: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  time: {
    fontSize: 12,
    color: '#999',
  },
});

export default NotificationComponent;