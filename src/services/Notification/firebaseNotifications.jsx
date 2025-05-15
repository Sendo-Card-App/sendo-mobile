import messaging from '@react-native-firebase/messaging';
import { storeData, getData } from '../storage';
import { Alert } from 'react-native';
import * as Device from 'expo-device';

// Request notification permissions (similar to your existing function)
export async function requestNotificationPermissions() {
  if (!Device.isDevice) {
    console.log('Push notifications not supported on simulators');
    return null;
  }

  try {
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.warn('Permission denied for notifications');
      return null;
    }

    return await getFCMToken();
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return null;
  }
}

// Get FCM token (replacement for registerForPushNotificationsAsync)
export async function getFCMToken() {
  try {
    const token = await messaging().getToken();
    console.log('FCM Token:', token);
    await storeData('pushToken', token);
    return token;
  } catch (error) {
    console.error('Failed to get FCM token:', error);
    return null;
  }
}

// Handle token refresh
export function setupTokenRefreshListener() {
  return messaging().onTokenRefresh(async (token) => {
    console.log('FCM token refreshed:', token);
    await storeData('pushToken', token);
  });
}

// Background message handler
export function setupBackgroundHandler(navigation) {
  messaging().setBackgroundMessageHandler(async remoteMessage => {
    console.log('Message handled in the background!', remoteMessage);
    // Handle your background messages here
  });
}

// Foreground message handler
export function setupForegroundHandler(navigation) {
  return messaging().onMessage(async remoteMessage => {
    console.log('Message handled in the foreground!', remoteMessage);
    Alert.alert(
      remoteMessage.notification?.title || 'Notification',
      remoteMessage.notification?.body || 'New message received'
    );
    
    // You can add navigation logic here if needed
    if (remoteMessage.data?.screen) {
      navigation.navigate(remoteMessage.data.screen);
    }
  });
}