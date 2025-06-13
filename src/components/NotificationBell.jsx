import React from 'react';
import { TouchableOpacity, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const NotificationBell = ({ unreadCount = 0, onPress }) => (
  <TouchableOpacity onPress={onPress} style={{ padding: 8 }}>
    <Ionicons name="notifications-outline" size={24} color="white" />
    {unreadCount > 0 && (
      <View style={{
        position: 'absolute',
        top: 2,
        right: 2,
        backgroundColor: 'red',
        width: 16,
        height: 16,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>{unreadCount}</Text>
      </View>
    )}
  </TouchableOpacity>
);

export default NotificationBell;
