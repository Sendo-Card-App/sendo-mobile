import AsyncStorage from '@react-native-async-storage/async-storage';

export const storeData = async (key, value) => {
  try {
    const jsonValue = JSON.stringify(value);
    await AsyncStorage.setItem(key, jsonValue);
  } catch (e) {
    console.error('Error storing data:', e);
    throw e;
  }
};

export const getData = async (key) => {
  try {
    const jsonValue = await AsyncStorage.getItem(key);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error('Error reading data:', e);
    throw e;
  }
};

export const removeData = async (key) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.error('Error removing data:', e);
    throw e;
  }
};
// In your storage service
export const clearStorage = async () => {
  try {
    await AsyncStorage.multiRemove([
      'authToken',
      'refreshToken',
      'userData',
      'appSettings',
      // Add any other keys you need to remove
    ]);
  } catch (e) {
    console.error('Failed to clear storage', e);
    throw e;
  }
};