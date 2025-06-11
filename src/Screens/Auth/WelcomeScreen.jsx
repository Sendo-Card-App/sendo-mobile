import React, { useEffect, useRef } from 'react';
import { getData } from '../../services/storage';
import { useDispatch } from 'react-redux';
import { loginSuccess } from '../../features/Auth/authSlice';
import { View, Text, Image, StyleSheet, Animated, Easing, Dimensions } from 'react-native';
import LogoSendo from '../../images/LogoSendo.png';
import WorldMap from '../../images/WorldMap.png';
import Loader from "../../components/Loader"

const { width, height } = Dimensions.get('window');

const SplashScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const mapScaleAnim = useRef(new Animated.Value(1)).current;
   const dispatch = useDispatch();
  const [loading, setLoading] = React.useState(true);


  const dotAnims = Array.from({ length: 5 }, () => useRef(new Animated.Value(0)).current); 
  // 5 dots (you can add more)
  
   useEffect(() => {
       const checkAuthData = async () => {
         try {
           const authData = await getData('@authData');
           if (authData?.accessToken) {
             dispatch(loginSuccess(authData));
             navigation.replace("PinCode");
           } else {
             navigation.replace("AUTH");
           }
         } catch (error) {
           console.log("Error checking auth data:", error);
           navigation.replace("Auth");
         } finally {
           setLoading(false); // stop loader once done
         }
       };
     
       checkAuthData();
     }, [])
  
  
  useEffect(() => {
    Animated.parallel([
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
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(mapScaleAnim, {
          toValue: 1.1,
          duration: 8000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(mapScaleAnim, {
          toValue: 1,
          duration: 8000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Animate dots (fade in/out)
    dotAnims.forEach((anim, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 2000 + index * 500,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 2000 + index * 500,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });

    const timer = setTimeout(() => {
      navigation.replace('SignIn'); // Navigate to SignIn screen after 5 seconds
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) return <Loader />;


  return (
    <View style={styles.container}>

      {/* World Map */}
      <Animated.Image
        source={WorldMap}
        style={[
          styles.mapBackground,
          {
            transform: [{ scale: mapScaleAnim }],
            opacity: 0.2,
          }
        ]}
        resizeMode="cover"
      />

      {/* Green Dots */}
      {dotAnims.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.dot,
            {
              opacity: anim,
              top: dotPositions[index].top,
              left: dotPositions[index].left,
            }
          ]}
        />
      ))}

      {/* Logo */}
      <Animated.View style={[
        styles.logoContainer,
        {
          opacity: fadeAnim,
          transform: [
            { scale: scaleAnim },
            { translateY: slideAnim }
          ]
        }
      ]}>
        <Image
          source={LogoSendo}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Text */}
      <Animated.View style={[styles.textContainer, { opacity: fadeAnim }]}>
        <Text style={styles.subtitle}>Service de transfert d'argent</Text>

        <Animated.View style={[styles.divider, {
          width: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '60%']
          })
        }]} />

        <Animated.Text style={[
          styles.footer,
          {
            opacity: fadeAnim,
            transform: [{
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0]
              })
            }]
          }
        ]}>
          Sendo propulsé par Service Financiers Étudiants
        </Animated.Text>
      </Animated.View>

      {/* Background Circles */}
      <Animated.View style={[
        styles.circle1,
        {
          opacity: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.1]
          })
        }
      ]} />
      <Animated.View style={[
        styles.circle2,
        {
          opacity: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 0.05]
          })
        }
      ]} />
    </View>
  );
};

const dotPositions = [
  { top: height * 0.4, left: width * 0.5 },
  { top: height * 0.5, left: width * 0.5 },
  { top: height * 0.4, left: width * 0.8 },
  { top: height * 0.5, left: width * 0.3 },
  { top: height * 0.4, left: width * 0.2 },
]; // Random nice positions

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
    width: width * 1,
    
  },
  dot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#7ddd7d',
    zIndex: 2,
  },
  logoContainer: {
    marginBottom: 30,
    zIndex: 10,
  },
  logo: {
    width: 120,
    height: 120,
  },
  textContainer: {
    alignItems: 'center',
    zIndex: 10,
  },
  subtitle: {
    color: 'white',
    fontSize: 18,
    marginBottom: 400,
  },
  divider: {
    height: 2,
    backgroundColor: '#7ddd7d',
    marginVertical: 20,
  },
  footer: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
  },
  circle1: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#7ddd7d',
    top: -100,
    left: -100,
    zIndex: 0,
  },
  circle2: {
    position: 'absolute',
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: '#7ddd7d',
    bottom: -150,
    right: -100,
    zIndex: 0,
  },
});

export default SplashScreen;
