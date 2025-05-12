import React, { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { View, Text, StyleSheet } from 'react-native';
import Toast from 'react-native-toast-message';

const NetworkProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const wasConnected = isConnected;
      setIsConnected(state.isConnected);
      
      if (!state.isConnected && wasConnected) {
        Toast.show({
          type: 'error',
          text1: 'Connexion perdue',
          text2: 'Votre appareil est hors ligne. Certaines fonctionnalités peuvent être limitées.',
          visibilityTime: 5000,
          autoHide: false,
          topOffset: 50,
        });
      }
      
      if (state.isConnected && !wasConnected) {
        Toast.show({
          type: 'success',
          text1: 'Connexion rétablie',
          text2: 'Vous êtes de nouveau en ligne.',
          visibilityTime: 3000,
        });
      }
    });

    return () => unsubscribe();
  }, [isConnected]);

  if (!isConnected) {
    return (
      <View style={styles.offlineContainer}>
        <Text style={styles.offlineText}>Mode hors ligne - Connexion limitée</Text>
      </View>
    );
  }

  return children;
};

const styles = StyleSheet.create({
  offlineContainer: {
    backgroundColor: '#b52424',
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  offlineText: {
    color: 'white'
  }
});

export default NetworkProvider;