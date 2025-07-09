import React, { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const NetworkProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [isError, setIsError] = useState(false);
  
  // Animation values
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(-100))[0];

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const wasConnected = isConnected;
      const nowConnected = state.isConnected;
      
      // Only trigger notifications when state actually changes
      if (nowConnected !== wasConnected) {
        setIsConnected(nowConnected);
        
        if (!nowConnected) {
          showNetworkNotification('No Internet Connection', true);
        } else {
          showNetworkNotification('Back Online', false);
        }
      }
    });

    return () => unsubscribe();
  }, [isConnected]);

  const showNetworkNotification = (message, isError) => {
    setNotificationMessage(message);
    setIsError(isError);
    setShowNotification(true);
    
    // Reset animations
    fadeAnim.setValue(0);
    slideAnim.setValue(-100);
    
    // Slide and fade in animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    ]).start();
    
    // Auto-hide after delay
    const timer = setTimeout(() => {
      hideNotification();
    }, 5000);

    return () => clearTimeout(timer);
  };

  const hideNotification = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start(() => {
      setShowNotification(false);
    });
  };

  return (
    <>
      {children}
      
      {showNotification && (
        <Animated.View 
          style={[
            styles.notificationContainer,
            { 
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <View style={[
            styles.notificationContent,
            { 
              backgroundColor: isError ? '#FF3B30' : '#34C759',
              borderLeftColor: isError ? '#D70015' : '#248A3D',
            }
          ]}>
            <Ionicons 
              name={isError ? 'wifi-off-outline' : 'wifi-outline'} 
              size={24} 
              color="white" 
              style={styles.icon}
            />
            <View style={styles.textContainer}>
              <Text style={styles.notificationText}>
                {notificationMessage}
              </Text>
              <Text style={styles.notificationSubText}>
                {isError 
                  ? 'Your device is offline. Some features may be limited.' 
                  : 'Your internet connection was restored.'}
              </Text>
            </View>
            <Ionicons 
              name="close" 
              size={20} 
              color="white" 
              style={styles.closeIcon}
              onPress={hideNotification}
            />
          </View>
        </Animated.View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  notificationContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  icon: {
    marginRight: 15,
  },
  closeIcon: {
    marginLeft: 'auto',
    padding: 5,
  },
  textContainer: {
    flex: 1,
  },
  notificationText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 3,
  },
  notificationSubText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    lineHeight: 18,
  },
});

export default NetworkProvider;