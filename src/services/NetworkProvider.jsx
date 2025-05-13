import React, { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { View, Text, StyleSheet, Modal, Animated } from 'react-native';

const NetworkProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const wasConnected = isConnected;
      setIsConnected(state.isConnected);
      
      if (!state.isConnected && wasConnected) {
        showNetworkNotification('Connexion perdue', true);
      }
      
      if (state.isConnected && !wasConnected) {
        showNetworkNotification('Connexion rétablie', false);
      }
    });

    return () => unsubscribe();
  }, [isConnected]);

  const showNetworkNotification = (message, isError) => {
    setNotificationMessage(message);
    setIsError(isError);
    setShowNotification(true);
    
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // Hide after 3 seconds with fade out
    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowNotification(false);
      });
    }, 5000);
  };

  return (
    <>
      {children}
      
      <Modal
        transparent={true}
        visible={showNotification}
        animationType="none"
        onRequestClose={() => setShowNotification(false)}
      >
        <Animated.View 
          style={[
            styles.notificationContainer,
            { 
              backgroundColor: 'transparent',
              opacity: fadeAnim,
              transform: [{
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-50, 0]
                })
              }]
            }
          ]}
        >
          <View style={[
            styles.notificationContent,
            { backgroundColor: isError ? 'rgba(181, 36, 36, 0.9)' : 'rgba(76, 175, 80, 0.9)' }
          ]}>
            <Text style={styles.notificationText}>
              {notificationMessage}
            </Text>
            <Text style={styles.notificationSubText}>
              {isError 
                ? 'Votre appareil est hors ligne. Certaines fonctionnalités peuvent être limitées.' 
                : 'Vous êtes de nouveau en ligne.'}
            </Text>
          </View>
        </Animated.View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  notificationContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  notificationContent: {
    padding: 15,
    borderRadius: 8,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  notificationText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 5,
    textAlign: 'center',
  },
  notificationSubText: {
    color: 'white',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default NetworkProvider;