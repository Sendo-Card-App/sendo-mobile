import React, { useEffect, useCallback, useState, useRef } from 'react';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Animated,
  Easing 
} from 'react-native';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';

import {
  useRequestVirtualCardMutation,
  useGetVirtualCardStatusQuery
} from '../../services/Card/cardApi';

const { width, height } = Dimensions.get('window');
const REQUEST_DATE_KEY = '@cardRequestDate';

const OnboardingCardScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [requestCard, { isLoading: isRequesting }] = useRequestVirtualCardMutation();
  const {
    data: cardRequest,
    isLoading: isFetchingStatus,
    refetch,
  } = useGetVirtualCardStatusQuery(undefined, {
    pollingInterval: 1000,
  });
 
  const status = cardRequest?.data?.onboardingSession?.onboardingSessionStatus;
  const [requestDate, setRequestDate] = useState(null);
  const [remainingTime, setRemainingTime] = useState(null);
  
  // Animations
  const earthRotation = useRef(new Animated.Value(0)).current;
  const sablierRotation = useRef(new Animated.Value(0)).current;
  const [isSablierRotating, setIsSablierRotating] = useState(false);

  const DEFAULT_DOCUMENT_TYPE = "NATIONALID";

  // Animation pour la Terre
  useEffect(() => {
    Animated.loop(
      Animated.timing(earthRotation, {
        toValue: 1,
        duration: 10000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  // Animation pour le sablier
  const startSablierRotation = () => {
    setIsSablierRotating(true);
    Animated.loop(
      Animated.timing(sablierRotation, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  };

  const stopSablierRotation = () => {
    setIsSablierRotating(false);
    sablierRotation.stopAnimation();
    sablierRotation.setValue(0);
  };

  useEffect(() => {
    if (['PENDING', 'WAITING_FOR_INFORMATION'].includes(status)) {
      startSablierRotation();
    } else {
      stopSablierRotation();
    }

    return () => {
      stopSablierRotation();
    };
  }, [status]);

  useEffect(() => {
    if (status === 'VERIFIED') {
      navigation.replace('CreateVirtualCard');
    }
  }, [status, navigation]);

  useEffect(() => {
    const loadDate = async () => {
      const savedDate = await AsyncStorage.getItem(REQUEST_DATE_KEY);
      if (savedDate) setRequestDate(savedDate);
    };
    loadDate();
  }, []);

  useEffect(() => {
    if (!requestDate) return;

    const interval = setInterval(() => {
      const start = new Date(requestDate);
      const now = new Date();
      const diffMs = 24 * 60 * 60 * 1000 - (now - start);

      if (diffMs <= 0) {
        setRemainingTime(null);
        clearInterval(interval);
        return;
      }

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      setRemainingTime(`${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [requestDate]);

  useFocusEffect(
    useCallback(() => {
      const interval = setInterval(() => {
        refetch();
      }, 10000);
      return () => clearInterval(interval);
    }, [refetch])
  );

 const handleRequestCard = async () => {
    try {
      const response = await requestCard({ documentType: DEFAULT_DOCUMENT_TYPE }).unwrap();

      Toast.show({
        type: 'success',
        text1: 'Demande envoyée',
        text2: 'Votre demande de carte virtuelle a été soumise avec succès.',
      });

      const now = new Date().toISOString();
      await AsyncStorage.setItem(REQUEST_DATE_KEY, now);
      setRequestDate(now);
      await refetch();
    } catch (error) {
      console.log("Full response:", JSON.stringify(error, null, 2));
     const backendMessage = error?.data?.data?.errors?.[0] 
      || error?.data?.message 
      || 'Erreur lors de la demande de carte';

    Toast.show({
      type: 'error',
      text1: 'Erreur',
      text2: backendMessage,
    });

    }
  };

  const renderMainContent = () => {
    if (['PENDING', 'WAITING_FOR_INFORMATION'].includes(status)) {
      return (
        <View style={styles.pendingContainer}>
          {/* Header with status badge */}
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>Sendo</Text>

            <Animated.Image
              source={require('../../images/sablier.png')}
              style={[
                styles.pendingImage,
                {
                  transform: [{
                    rotate: sablierRotation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg'],
                    })
                  }]
                }
              ]}
              resizeMode="contain"
            />
          </View>
          
          <Text style={styles.statusSubHeader}>
            {t('onboardingCard.pending.status.subHeader')}
          </Text>
          
          {/* Main content */}
          <View style={styles.contentContainer}>
            <Text style={styles.sectionTitle}>
              {t('onboardingCard.pending.title')}
            </Text>
            
            <Text style={styles.sectionDescription}>
              {t('onboardingCard.pending.subtitle')}
            </Text>
            
            {/* Status timeline */}
            <View style={styles.statusTimeline}>
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, styles.timelineDotActive]} />
                <View style={[styles.timelineLine, styles.timelineLineActive]} />
                <Text style={styles.timelineText}>
                  {t('onboardingCard.pending.timeline.requested')}
                </Text>
              </View>
              
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, 
                  status === 'WAITING_FOR_INFORMATION' ? styles.timelineDotActive : styles.timelineDotInactive
                ]} />
                <View style={[styles.timelineLine, 
                  status === 'WAITING_FOR_INFORMATION' ? styles.timelineLineActive : styles.timelineLineInactive
                ]} />
                <Text style={styles.timelineText}>
                  {t('onboardingCard.pending.timeline.verification')}
                </Text>
              </View>
              
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, styles.timelineDotInactive]} />
                <Text style={styles.timelineText}>
                  {t('onboardingCard.pending.timeline.approved')}
                </Text>
              </View>
            </View>
            
            {/* Request details */}
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  {t('onboardingCard.pending.labels.requestDate')}
                </Text>
                <Text style={styles.detailValue}>
                  {requestDate ? new Date(requestDate).toLocaleDateString() : '--'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      );
    }

    if (status === 'CANCELLED') {
      return (
        <View style={styles.statusContainer}>
          <Image
            source={require('../../images/cancelled.png')}
            style={styles.statusImage}
            resizeMode="contain"
          />
          <Text style={styles.statusTitle}>{t('onboardingCard.cancelled.title')}</Text>
          <Text style={styles.statusSubtitle}>
            {t('onboardingCard.cancelled.subtitle')}
          </Text>
        </View>
      );
    }

    return (
      <>
        <View style={styles.imageContainer}>
          <Animated.Image
            source={require('../../images/earth.jpeg')}
            style={[
              styles.earthImage,
              {
                transform: [{
                  rotate: earthRotation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '360deg'],
                  })
                }]
              }
            ]}
          />
          <Image
            source={require('../../images/virtual.png')}
            style={styles.cardImage}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>
          {t('onboardingCard.title')}
        </Text>
        <Text style={styles.subtitle}>
          {t('onboardingCard.subtitle')}
        </Text>
      </>
    );
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <TouchableOpacity 
        onPress={() => navigation.navigate("MainTabs")}
        style={styles.backButton}
      >
        <Ionicons name="arrow-back" size={24} color="black" />
      </TouchableOpacity>
      
      {renderMainContent()}

      <TouchableOpacity
        onPress={handleRequestCard}
        style={[
          styles.button,
          (isRequesting || ['PENDING', 'WAITING_FOR_INFORMATION'].includes(status) || isFetchingStatus) && 
          styles.buttonDisabled
        ]}
        disabled={isRequesting || ['PENDING', 'WAITING_FOR_INFORMATION'].includes(status) || isFetchingStatus}
      >
        {isRequesting || isFetchingStatus ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>
            {['PENDING', 'WAITING_FOR_INFORMATION'].includes(status)
              ? t('onboardingCard.button.pending')
              : t('onboardingCard.button.default')}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    justifyContent: 'space-between',
  },
  // Back button style
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 10,
  },
  imageContainer: {
    marginTop: 50,
    alignItems: 'center',
    position: 'relative',
  },
  earthImage: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
  },
  cardImage: {
    width: width * 0.5,
    height: width * 0.3,
    position: 'absolute',
    top: '30%',
    left: '20%',
  },
  statusImage: {
    width: width * 0.4,
    height: width * 0.4,
    marginBottom: 30,
  },
  
  // Pending state styles
  pendingContainer: {
    alignItems: 'center',
    width: '100%',
    marginTop: 30,
  },
  statusIllustration: {
    position: 'relative',
    marginBottom: 30,
  },
  pendingImage: {
    width: width * 0.4,
    height: width * 0.4,
  },
  statusBadge: {
    position: 'absolute',
    bottom: -10,
    alignSelf: 'center',
    paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusBadgePending: {
    backgroundColor: '#7ddd7d',
  },
  statusBadgeWaiting: {
    backgroundColor: '#7ddd7d',
  },
  statusBadgeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  pendingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  pendingSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  timelineContainer: {
    width: '80%',
    marginBottom: 30,
  },
  timeline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
  },
  timelineDotActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  timelineDotInactive: {
    backgroundColor: 'white',
    borderColor: '#CCCCCC',
  },
  timelineLine: {
    height: 3,
    width: '20%',
  },
  timelineLineActive: {
    backgroundColor: '#7ddd7d',
  },
  timelineLineInactive: {
    backgroundColor: '#CCCCCC',
  },
  timelineLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  timelineLabel: {
    fontSize: 12,
    color: '#666',
    width: '33%',
    textAlign: 'center',
  },
  detailsContainer: {
    width: '90%',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#555',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#222',
    fontWeight: '600',
  },
  timerContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  timerText: {
    color: '#1976D2',
    fontWeight: 'bold',
    fontSize: 14,
  },
  
  // Status container styles
  statusContainer: {
    alignItems: 'center',
    width: '100%',
    marginTop: 50,
    paddingHorizontal: 20,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  statusSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 24,
  },
  
  // Title styles
  title: {
    fontSize: 38,
    fontWeight: '900',
    textAlign: 'center',
    color: '#000',
    marginTop: 40,
    lineHeight: 45,
  },
  subtitle: {
    fontSize: 15,
    color: '#444',
    textAlign: 'center',
    paddingHorizontal: 10,
    marginTop: 20,
    lineHeight: 22,
  },
  
  // Button styles
  button: {
    backgroundColor: '#7ddd7d',
    borderRadius: 30,
    paddingVertical: 15,
    paddingHorizontal: 25,
    marginBottom: 40,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  buttonText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
   headerContainer: {
   
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
     textAlign: 'center',
    color: '#000',
  },
  statusSubHeader: {
    fontSize: 14,
    color: '#666',
     backgroundColor: '#7ddd7d',
    marginBottom: 30,
     textAlign: 'center',
    width: '100%',
     paddingHorizontal: 15,
    paddingVertical: 5,
    borderRadius: 20,
   
  },
  contentContainer: {
    width: '100%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
     textAlign: 'center',
    marginBottom: 10,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
     textAlign: 'center',
    lineHeight: 20,
  },
  statusTimeline: {
    marginBottom: 30,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  timelineDotActive: {
    backgroundColor: '#7ddd7d',
  },
  timelineDotInactive: {
    backgroundColor: '#CCCCCC',
  },
  timelineText: {
    fontSize: 14,
    color: '#333',
  },
  
  // Update existing styles to match the design
  pendingContainer: {
    alignItems: 'flex-start',
    width: '100%',
    marginTop: 20,
    paddingHorizontal: 10,
  },
  statusBadge: {
    backgroundColor: '#FFA500',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  detailsContainer: {
    width: '100%',
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  timerContainer: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  timerText: {
    color: '#1976D2',
    fontWeight: '500',
    fontSize: 12,
  },
  statusTimeline: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 30,
  width: '100%',
},
timelineItem: {
  alignItems: 'center',
  flex: 1,
},
timelineDot: {
  width: 16,
  height: 16,
  borderRadius: 8,
  marginBottom: 8,
},
timelineDotActive: {
  backgroundColor: '#7ddd7d',
},
timelineDotInactive: {
  backgroundColor: '#CCCCCC',
},
timelineLine: {
  height: 3,
  width: '100%',
  position: 'absolute',
  top: 6, // Half the dot height (16/2 = 8) minus half the line height (3/2 = 1.5) → 8-1.5=6.5 ≈ 6
  left: '50%',
},
timelineLineActive: {
  backgroundColor: '#7ddd7d',
},
timelineLineInactive: {
  backgroundColor: '#CCCCCC',
},
timelineText: {
  fontSize: 12,
  color: '#333',
  textAlign: 'center',
  marginTop: 5,
  fontWeight: '500',
},
});

export default OnboardingCardScreen;