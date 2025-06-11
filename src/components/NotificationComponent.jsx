import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  FlatList, 
  TouchableWithoutFeedback,
  ActivityIndicator
} from 'react-native';
import { useGetNotificationsQuery } from '../services/Notification/notificationApi';
import { useGetUserProfileQuery } from "../services/Auth/authAPI";
import Icon from 'react-native-vector-icons/MaterialIcons';

const NotificationComponent = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  
  // Get user profile first
  const { data: userProfile } = useGetUserProfileQuery();
  const userId = userProfile?.data?.id;

  // Get notifications with pagination
  const { 
    data: notificationsResponse, 
    isLoading, 
    isError,
    refetch,
    error: notificationError
  } = useGetNotificationsQuery(
    { 
      userId,
      page,
      limit
      // Add other filters as needed:
      // type: 'INFORMATION',
      // status: 'SENDED'
    }, 
    {
      skip: !userId
    }
  );

  const notifications = notificationsResponse?.data || [];
  console.log(notifications)
  const totalNotifications = notificationsResponse?.total || 0;

  // Debug logs
  useEffect(() => {
    if (notificationError) {
      console.log('Notification error:', notificationError);
    }
  }, [notificationError]);

  const handleLoadMore = () => {
    if (notifications.length < totalNotifications) {
      setPage(prev => prev + 1);
    }
  };

  const getIconName = (type) => {
    const iconMap = {
      SUCCESS_ACCOUNT_VERIFIED: 'check-circle',
      INFORMATION: 'info',
      MARKETING: 'campaign',
      SUCCESS_KYC_VERIFIED: 'verified',
      SUCCESS_TRANSFER_FUNDS: 'swap-horiz',
      SUCCESS_DEPOSIT_CARD: 'credit-card',
      PAYMENT_FAILED: 'error',
      ERROR: 'warning',
      // Add more mappings as needed
    };
    return iconMap[type] || 'notifications';
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

  const renderFooter = () => {
    if (isLoading) {
      return <ActivityIndicator size="small" color="#0000ff" />;
    }
    return null;
  };

  if (isLoading && page === 1) return <ActivityIndicator size="large" />;
  if (isError) return <Text>Error loading notifications</Text>;

  return (
    <>
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
          {notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="notifications-off" size={40} color="#ccc" />
              <Text style={styles.emptyText}>No notifications yet</Text>
            </View>
          ) : (
            <FlatList
              data={notifications}
              renderItem={renderItem}
              keyExtractor={item => item.id}
              contentContainerStyle={styles.listContent}
              refreshing={isLoading}
              onRefresh={() => {
                setPage(1);
                refetch();
              }}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              ListFooterComponent={renderFooter}
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  clearText: {
    color: '#0D1C6A',
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginTop: 10,
    textAlign: 'center',
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