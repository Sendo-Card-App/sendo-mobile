import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Alert, Platform } from 'react-native';
import { EXPO_PUBLIC_API_URL } from './Auth/config';

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    Alert.alert('Erreur', 'Les notifications ne fonctionnent que sur un appareil physique.');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    Alert.alert('Permission refusée', 'Impossible d\'obtenir l\'autorisation pour les notifications.');
    return null;
  }

  const { data: token } = await Notifications.getExpoPushTokenAsync();
  return token;
}

export async function sendPushNotification(title: string, body: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { type: 'general' },
    },
    trigger: { seconds: 1 },
  });
}

export async function sendPushTokenToBackend(token: string, title: string, body: string, type: string) {
  try {
    const response = await fetch(`${EXPO_PUBLIC_API_URL}/notification/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        title,
        body,
        type
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send notification to backend');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending notification to backend:', error);
    throw error;
  }
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});