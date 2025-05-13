import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Alert } from 'react-native';
import { EXPO_PUBLIC_API_URL } from './Auth/config';
import { getData, storeData } from './storage';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Register and store push token with Firebase
export async function registerForPushNotificationsAsync() {
  // Early return for simulators
  if (!Device.isDevice) {
    console.log('Push notifications not supported on simulators');
    return null;
  }

  try {
    // Check and request permissions
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      status = newStatus;
    }

    if (status !== 'granted') {
      console.warn('Permission denied for notifications');
      return null;
    }

    // Get the appropriate token based on platform
    let token;
    if (Platform.OS === 'android') {
      try {
        // First try to get native FCM token
        token = (await Notifications.getDevicePushTokenAsync()).data;
        console.log('FCM Token:', token);
      } catch (fcmError) {
        console.warn('Failed to get FCM token, falling back to Expo token:', fcmError);
        token = (await Notifications.getExpoPushTokenAsync()).data;
      }
    } else {
      // For iOS, use Expo token
      token = (await Notifications.getExpoPushTokenAsync()).data;
    }

    if (!token) {
      console.error('Failed to get any push token');
      return null;
    }

    // Store the token for later use
    await storeData('pushToken', token);
    return token;

  } catch (error) {
    console.error('Error in registerForPushNotificationsAsync:', error);
    return null;
  }
}

// Get stored push token with retry logic
export async function getStoredPushToken() {
  try {
    // First try to get stored token
    const storedToken = await getData('pushToken');
    if (storedToken) return storedToken;

    // If no stored token, try to register a new one
    console.log('No stored token, registering new one...');
    return await registerForPushNotificationsAsync();
  } catch (error) {
    console.warn('Failed to get stored push token:', error);
    return null;
  }
}

// Enhanced local notification with fallback
export async function sendPushNotification(title: string, body: string) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: 'general' },
      },
      trigger: { seconds: 1 },
    });
  } catch (error) {
    console.warn('Failed to send local notification:', error);
    // Fallback to alert if notification fails
    Alert.alert(title, body);
  }
}

// Robust backend notification sender
export async function sendPushTokenToBackend(
  title: string,
  body: string,
  type: string
) {
  try {
    const [authToken, pushToken] = await Promise.all([
      getData('authToken'),
      getStoredPushToken(),
    ]);

    if (!authToken) {
      throw new Error('Authentication token not found');
    }
    if (!pushToken) {
      throw new Error('No push token available');
    }

    const payload = {
      token: pushToken,
      title,
      body,
      type
    };

    const response = await fetch(`${EXPO_PUBLIC_API_URL}/notification/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
      timeout: 10000, // 10 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Notification API error:', errorText);
      throw new Error(errorText || 'Failed to send notification');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in sendPushTokenToBackend:', error);
    // Fallback to local notification if backend fails
    await sendPushNotification(title, body);
    throw error;
  }
}