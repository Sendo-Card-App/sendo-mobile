import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Alert, Linking, Platform } from 'react-native';
import { getData, storeData } from './storage';

// Configure how notifications are displayed in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Helper to open app settings if permission denied
async function openAppSettings() {
  if (Platform.OS === 'ios') {
    await Linking.openURL('app-settings:');
  } else {
    await Notifications.openSettings(); // ✅ Android 12+
  }
}

// Register and get Expo push token
export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    console.log('❌ Must use a physical device for push notifications');
    return null;
  }

  try {
    // Check existing permission
    let { status } = await Notifications.getPermissionsAsync();

    // If not granted, request it
    if (status !== 'granted') {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      status = newStatus;
    }

    // If still not granted after request
    if (status !== 'granted') {
      Alert.alert(
        "Notifications désactivées",
        "Activez-les dans les paramètres pour recevoir des alertes importantes.",
        [
          { text: "Annuler", style: "cancel" },
          { text: "Ouvrir paramètres", onPress: openAppSettings }
        ]
      );
      return null;
    }

    // Get Expo token
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    if (token) {
      await storeData('pushToken', token);
      console.log('✅ Expo Push Token:', token);
      return token;
    }

    console.warn('❌ No push token retrieved');
    return null;
  } catch (error) {
    console.error('❌ Error registering push notifications:', error);
    return null;
  }
}

export async function getStoredPushToken() {
  while (true) {
    try {
      const storedToken = await getData('pushToken');
      if (storedToken) {
        return storedToken;
      }

      console.log('No stored token found. Registering...');
      const newToken = await registerForPushNotificationsAsync();
      if (newToken) return newToken;

      console.log('Retrying getStoredPushToken in 3 seconds...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error) {
      console.warn('Failed to retrieve push token:', error);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
}


export async function sendPushNotification(title, body) {
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
  title,
  body,
  type,
  metaData
) {
  try {
    const [authToken, pushToken] = await Promise.all([
      getData('authToken'),
      getStoredPushToken(),
    ]);

    //  Log the tokens retrieved
    console.log(' authToken:', authToken);
    console.log(' pushToken:', pushToken);

    if (!authToken) {
      console.warn(' No auth token found. Skipping backend push notification.');
      return;
    }

    if (!pushToken) {
      console.warn(' No push token found. Skipping backend push notification.');
      return;
    }

    const payload = {
      token: pushToken,
      title,
      body,
      type,
      ...metaData,
    };

    console.log(' Sending payload to backend:', payload);

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
      console.error('❌ Backend notification failed:', text);
      throw new Error(text || 'Notification sending failed');
    }

    const result = await response.json();
    console.log('✅ Notification sent successfully:', result);
    return result;

  } catch (error) {
    console.error('❌ sendPushTokenToBackend failed:', error);
    await sendPushNotification(title, body);
  }
}

