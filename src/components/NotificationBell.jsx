import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const NotificationBell = ({ unreadCount = 0, onPress }) => {
  const displayCount = unreadCount > 9 ? '10+' : unreadCount;

  return (
    <TouchableOpacity onPress={onPress} style={{ padding: 8 }}>
      <Ionicons name="notifications-outline" size={24} color="black" />
      {unreadCount > 0 && (
        <View
          style={{
            position: 'absolute',
            top: 2,
            right: 2,
            backgroundColor: 'red',
            minWidth: 16,
            height: 16,
            borderRadius: 8,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 2, // allows space for "10+"
          }}
        >
          <Text
            style={{
              color: 'white',
              fontSize: 10,
              fontWeight: 'bold',
            }}
          >
            {displayCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

export default NotificationBell;
