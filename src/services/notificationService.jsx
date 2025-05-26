import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Alert, Platform } from 'react-native';
import { getData, storeData } from './storage';

// Configure how notifications are shown
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Register and store push token
export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    console.log('Push notifications not supported on simulators');
    return null;
  }

  try {
    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      status = newStatus;
    }

    if (status !== 'granted') {
      console.warn('Permission denied for notifications');
      return null;
    }

    let token;
    if (Platform.OS === 'android') {
      try {
        token = (await Notifications.getDevicePushTokenAsync()).data;
        console.log('FCM Token:', token);
      } catch (err) {
        console.warn('FCM token failed, fallback to Expo token:', err);
        token = (await Notifications.getExpoPushTokenAsync()).data;
      }
    } else {
      token = (await Notifications.getExpoPushTokenAsync()).data;
    }

    if (!token) {
      console.error('No push token retrieved');
      return null;
    }

    await storeData('pushToken', token);
    return token;
  } catch (error) {
    console.error('Error registering push notifications:', error);
    return null;
  }
}

export async function getStoredPushToken() {
  try {
    const storedToken = await getData('pushToken');
    if (storedToken) return storedToken;

    console.log('No stored token found. Registering...');
    return await registerForPushNotificationsAsync();
  } catch (error) {
    console.warn('Failed to retrieve push token:', error);
    return null;
  }
}

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
    console.warn('Local notification failed:', error);
    Alert.alert(title, body);
  }
}

export async function sendPushTokenToBackend(
  title: string,
  body: string,
  type: string,
  metaData: object = {}
) {
  try {
    const [authToken, pushToken] = await Promise.all([
      getData('authToken'),
      getStoredPushToken(),
    ]);

    if (!authToken) {
      console.warn('No auth token found. Skipping backend push notification.');
      return;
    }

    if (!pushToken) {
      console.warn('No push token found. Skipping backend push notification.');
      return;
    }

    const payload = {
      token: pushToken,
      title,
      body,
      type,
      ...metaData,
    };

    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/notification/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Backend notification failed:', text);
      throw new Error(text || 'Notification sending failed');
    }

    return await response.json();
  } catch (error) {
    console.error('sendPushTokenToBackend failed:', error);
    await sendPushNotification(title, body);
  }
}
