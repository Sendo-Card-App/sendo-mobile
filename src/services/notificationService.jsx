import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Alert, Platform } from 'react-native';
import { API_URL } from './Auth/config';

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

export async function sendPushTokenToBackend(userId: string, token: string) {
  try {
    const response = await fetch(`${API_URL}/users/push-tokens`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        token,
        platform: Platform.OS,
        deviceId: Device.osBuildId
      }),
    });

    if (!response.ok) {
      throw new Error('Échec de l\'enregistrement du token');
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur lors de l\'envoi du token:', error);
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