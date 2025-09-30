import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import { getData } from "../../services/storage";
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../features/Auth/authSlice';

const { width, height } = Dimensions.get('window');

// Use require for images
const LogoSendo = require('../../images/logo2.png');
const WorldMap = require('../../images/WorldMap.png');

const SplashScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const mapScaleAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const dispatch = useDispatch();

  useEffect(() => {
    const checkAuthAndNavigate = async () => {
      try {
        // Check if user data exists in storage
        const authData = await getData('@authData');
        console.log('Auth data found:', !!authData);
        
        if (authData?.accessToken) {
          // User is authenticated - dispatch login success and navigate to PinCode
          dispatch(loginSuccess(authData));
          console.log('Navigating to PinCode');
          navigation.replace('PinCode');
        } else {
          // No auth data - navigate to SignIn
          console.log('Navigating to SignIn');
          navigation.replace('SignIn');
        }
      } catch (error) {
        console.log('Error checking auth data:', error);
        // If there's an error, default to SignIn
        navigation.replace('SignIn');
      }
    };

    // Start animations
    Animated.parallel([
      // Logo fade and scale
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.elastic(1),
        useNativeDriver: true,
      }),
      // Progress bar animation (3 seconds)
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
    ]).start();

    // Map breathing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(mapScaleAnim, {
          toValue: 1.1,
          duration: 4000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(mapScaleAnim, {
          toValue: 1,
          duration: 4000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Check authentication and navigate after 3 seconds (when progress bar completes)
    const timer = setTimeout(() => {
      checkAuthAndNavigate();
    }, 3000);

    return () => {
      console.log('SplashScreen unmounted');
      clearTimeout(timer);
    };
  }, [navigation, fadeAnim, scaleAnim, mapScaleAnim, progressAnim, dispatch]);

  // Interpolate the progress bar width
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* World Map Background with animation */}
      <Animated.Image
        source={WorldMap}
        style={[
          styles.mapBackground,
          {
            transform: [{ scale: mapScaleAnim }],
          }
        ]}
        resizeMode="cover"
        onError={(error) => console.log('WorldMap load error:', error.nativeEvent.error)}
      />
      
      {/* Logo with fade and scale animation */}
      <Animated.View 
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <Image
          source={LogoSendo}
          style={styles.logo}
          resizeMode="contain"
          onError={(error) => console.log('LogoSendo load error:', error.nativeEvent.error)}
        />
      </Animated.View>

      {/* Footer text with fade animation */}
      <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
        <Text style={styles.footerText}>
          Service de transfert d'argent
        </Text>
        
        {/* Progress Bar Container */}
        <View style={styles.progressBarContainer}>
          <Animated.View 
            style={[
              styles.progressBar,
              {
                width: progressWidth,
              }
            ]} 
          />
        </View>
        
        <Text style={styles.footerSubtext}>
          Propulsé par Service Financiers Étudiants
        </Text>
      </Animated.View>

      {/* Decorative circles */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181e25',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  mapBackground: {
    position: 'absolute',
    width: width * 1.3,
    height: height * 1.3,
    opacity: 0.15,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 50,
    zIndex: 10,
  },
  logo: {
    width: 220,
    height: 220,
    marginBottom: 15,
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
    width: '100%',
    zIndex: 10,
  },
  footerText: {
    color: 'white',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  progressBarContainer: {
    width: '60%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    marginBottom: 15,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#7ddd7d',
    borderRadius: 2,
  },
  footerSubtext: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    textAlign: 'center',
  },
  circle1: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#7ddd7d',
    top: -80,
    left: -80,
    opacity: 0.08,
  },
  circle2: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#7ddd7d',
    bottom: -120,
    right: -80,
    opacity: 0.05,
  },
});

export default SplashScreen;