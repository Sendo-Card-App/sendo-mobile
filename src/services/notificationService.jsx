import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Alert } from 'react-native';
import { getData, storeData } from './storage';

// Configure how notifications are displayed in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ✅ TRÈS SIMPLE: Vérifie seulement les permissions existantes
export async function registerForPushNotificationsAsync() {
  try {
    if (!Device.isDevice) {
      console.log('❌ Must use a physical device for push notifications');
      return null;
    }

    // Vérifier silencieusement les permissions existantes
    const { status } = await Notifications.getPermissionsAsync();

    // Seulement si permission déjà accordée, récupérer le token
    if (status === 'granted') {
      const token = (await Notifications.getExpoPushTokenAsync()).data;
      if (token) {
        await storeData('pushToken', token);
        console.log('✅ Expo Push Token stored');
        return token;
      }
    }

    // Si pas accordé, retourner null SANS BLOQUER
    console.log('🔕 Push notifications not granted, app continues normally');
    return null;

  } catch (error) {
    console.error('❌ Error checking push notifications:', error);
    return null;
  }
}

// ✅ SIMPLE: Récupération non-bloquante du token
export async function getStoredPushToken() {
  try {
    // Vérifier d'abord le token existant
    const storedToken = await getData('pushToken');
    if (storedToken) {
      return storedToken;
    }

    // Si pas de token, vérifier silencieusement
    console.log('No stored token found. Checking permissions...');
    const newToken = await registerForPushNotificationsAsync();
    return newToken; // Peut être null

  } catch (error) {
    console.warn('Failed to retrieve push token:', error);
    return null;
  }
}

// ✅ OPTIONNEL: Demande GENTILLE des notifications (seulement si vous voulez une approche proactive)
export async function requestOptionalNotifications() {
  return new Promise(async (resolve) => {
    try {
      if (!Device.isDevice) {
        resolve(null);
        return;
      }

      const { status } = await Notifications.getPermissionsAsync();
      
      // Si déjà accordé, retourner le token
      if (status === 'granted') {
        const token = (await Notifications.getExpoPushTokenAsync()).data;
        if (token) {
          await storeData('pushToken', token);
          console.log('✅ Notifications already granted');
          resolve(token);
          return;
        }
      }
      
      // Si indéterminé, vous POUVEZ demander gentiment (optionnel)
      if (status === 'undetermined') {
        // ✅ Cette alerte est OPTIONNELLE - vous pouvez même la supprimer
        Alert.alert(
          "Notifications Optionnelles",
          "Souhaitez-vous activer les notifications pour recevoir des alertes importantes ?",
          [
            {
              text: "Plus tard",
              style: "cancel",
              onPress: () => resolve(null)
            },
            {
              text: "Activer",
              onPress: async () => {
                try {
                  const { status: newStatus } = await Notifications.requestPermissionsAsync();
                  if (newStatus === 'granted') {
                    const token = (await Notifications.getExpoPushTokenAsync()).data;
                    if (token) {
                      await storeData('pushToken', token);
                      resolve(token);
                    } else {
                      resolve(null);
                    }
                  } else {
                    resolve(null);
                  }
                } catch (error) {
                  resolve(null);
                }
              }
            }
          ]
        );
      } else {
        // Déjà refusé, ne pas déranger
        resolve(null);
      }
    } catch (error) {
      console.error('Error in optional notification request:', error);
      resolve(null);
    }
  });
}

// Fonctions restantes inchangées
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

export async function sendPushTokenToBackend(title, body, type, metaData) {
  try {
    const [authToken, pushToken] = await Promise.all([
      getData('authToken'),
      getStoredPushToken(), // Non-bloquant
    ]);

    // Fallback gracieux si pas de token
    if (!pushToken) {
      console.log('No push token, using local notification');
      await sendPushNotification(title, body);
      return;
    }

    if (!authToken) {
      await sendPushNotification(title, body);
      return;
    }

    const payload = {
      token: pushToken,
      title,
      body,
      type,
      ...metaData,
    };

    const response = await fetch(`${process.env.EXPO_TEST_API_URL}/notification/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Notification sending failed');
    }

    return await response.json();

  } catch (error) {
    console.error('Backend notification failed, using local:', error);
    await sendPushNotification(title, body);
  }
}