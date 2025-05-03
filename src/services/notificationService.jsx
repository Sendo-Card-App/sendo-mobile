import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Alert, Platform } from 'react-native';

export async function registerForPushNotificationsAsync() {
  if (!Device.isDevice) {
    Alert.alert('Erreur', 'Les notifications ne fonctionnent que sur un appareil physique.');
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    Alert.alert('Permission refusée', 'Impossible d’obtenir l’autorisation pour les notifications.');
    return;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync();
  return tokenData.data;
}

// Configure notification behavior when received
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
