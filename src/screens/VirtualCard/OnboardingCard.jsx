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
  Easing,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTranslation } from 'react-i18next';
import { Ionicons, AntDesign } from "@expo/vector-icons";

import {
  useRequestVirtualCardMutation,
  useGetVirtualCardStatusQuery
} from '../../services/Card/cardApi';
import { useGetUserProfileQuery } from "../../services/Auth/authAPI";
import { useGetConfigQuery } from "../../services/Config/configApi";

const { width, height } = Dimensions.get('window');
const REQUEST_DATE_KEY = '@cardRequestDate';

const OnboardingCardScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [requestCard, { isLoading: isRequesting }] = useRequestVirtualCardMutation();
  const { data: configData, isLoading: isConfigLoading } = useGetConfigQuery(undefined, { 
    pollingInterval: 1000 // Refetch every 1 second
  });

  const getConfigValue = (key) => {
    const item = configData?.data?.find((c) => c.name === key);
    return item?.value ?? null;
  };

    const cardFees = getConfigValue("SENDO_CREATING_CARD_FEES");
  const isFirstCardFree = getConfigValue("IS_FREE_FIRST_CREATING_CARD") === "1";
  const displayedFees = isFirstCardFree ? "0 XAF" : `${cardFees} XAF`;
  const total = displayedFees;
  
  // Remove pollingInterval to prevent excessive re-renders
  const { 
    data: cardRequest, 
    isLoading: isFetchingStatus, 
    refetch 
  } = useGetVirtualCardStatusQuery(undefined, { 
    pollingInterval: 1000 // Refetch every 1 second
  });

   //console.log("card request:", JSON.stringify(cardRequest, null, 2));
 
  const status = cardRequest?.data?.onboardingSession?.onboardingSessionStatus;
    //console.log("card request:", JSON.stringify(status, null, 2));
  const [requestDate, setRequestDate] = useState(null);
  const [remainingTime, setRemainingTime] = useState(null);
   const { data: userProfile, isLoading: isProfileLoading } = useGetUserProfileQuery(undefined, { 
    pollingInterval: 1000 // Refetch every 1 second
  });
    //console.log("userProfile list:", JSON.stringify(userProfile, null, 2));

    const profileStatus = userProfile?.data?.user?.virtualCard?.status;

    //  First try onboardingSession (cardRequest)
    // If not found, fallback to virtualCard status from userProfile
     const finalStatus =
        cardRequest?.data?.onboardingSession?.onboardingSessionStatus ||
        userProfile?.data?.virtualCard?.status;

  const hasNavigated = useRef(false);
  const navigationTriggered = useRef(false);
  
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

  // Animation pour le sablier - use useCallback to memoize
  const startSablierRotation = useCallback(() => {
    setIsSablierRotating(true);
    Animated.loop(
      Animated.timing(sablierRotation, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [sablierRotation]);

  const stopSablierRotation = useCallback(() => {
    setIsSablierRotating(false);
    sablierRotation.stopAnimation();
    sablierRotation.setValue(0);
  }, [sablierRotation]);

  useEffect(() => {
    if (['PENDING', 'WAITING_FOR_INFORMATION'].includes(status)) {
      startSablierRotation();
    } else {
      stopSablierRotation();
    }

    return () => {
      stopSablierRotation();
    };
  }, [status, startSablierRotation, stopSablierRotation]);

  // FIXED: Use useFocusEffect with proper cleanup
  useFocusEffect(
    useCallback(() => {
      // Reset navigation flag when screen comes into focus
      navigationTriggered.current = false;
      
      return () => {
        // Cleanup when screen loses focus
        navigationTriggered.current = false;
      };
    }, [])
  );

  // FIXED: Navigation effect with proper conditions
    useEffect(() => {
    if (!finalStatus || navigationTriggered.current) return;

    navigationTriggered.current = true;

    if (finalStatus === "VERIFIED") {
      // User finished KYC, redirect to create card
      setTimeout(() => {
        navigation.replace("CreateVirtualCard");
      }, 100);
    } else if (
      ["ACTIVE", "PRE_ACTIVE", "FROZEN", "BLOCKED", "SUPENDED"].includes(finalStatus)
    ) {
      // User already has a card → manage it
      setTimeout(() => {
        navigation.replace("ManageVirtualCard");
      }, 100);
    }
  }, [finalStatus, navigation]);


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
    if (status === 'REFUSED_TIMEOUT') {
      return (
        <View style={styles.statusContainer}>
          <Image
            source={require('../../images/time-out.png')}
            style={styles.statusImage}
            resizeMode="contain"
          />
          <Text style={styles.statusTitle}>
            {t('onboardingCard.refusedTimeout.title')}
          </Text>
          <Text style={styles.statusSubtitle}>
            {t('onboardingCard.refusedTimeout.subtitle')}
          </Text>
          
          {/* Explanation section */}
          <View style={styles.explanationContainer}>
            <Text style={styles.explanationTitle}>
              {t('onboardingCard.refusedTimeout.explanationTitle')}
            </Text>
            <Text style={styles.explanationText}>
              {t('onboardingCard.refusedTimeout.explanationText')}
            </Text>
          </View>
          
          {/* Next steps */}
          <View style={styles.nextStepsContainer}>
            <Text style={styles.nextStepsTitle}>
              {t('onboardingCard.refusedTimeout.nextStepsTitle')}
            </Text>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>
                {t('onboardingCard.refusedTimeout.step1')}
              </Text>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>
                {t('onboardingCard.refusedTimeout.step2')}
              </Text>
            </View>
          </View>
        </View>
      );
    }

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
         {/*  Fees message */}
        {!isConfigLoading && (
          <Text style={styles.feeMessage}>
            {t("onboardingCard.feeMessage", {
              total,
            })}
          </Text>
        )}
        <Text style={styles.subtitle}>
          {t('onboardingCard.subtitle')}
        </Text>
        
      </>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Back Button */}
        <TouchableOpacity 
          onPress={() => navigation.navigate("MainTabs")}
          style={styles.backButton}
        >
          <AntDesign name="left" size={24} color="white" />
        </TouchableOpacity>
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderMainContent()}
        </ScrollView>

        <TouchableOpacity
          onPress={handleRequestCard}
          style={[
            styles.button,
            (isRequesting || 
            ['PENDING', 'WAITING_FOR_INFORMATION'].includes(status) || 
            isFetchingStatus) && 
            styles.buttonDisabled
          ]}
          disabled={isRequesting || 
                    ['PENDING', 'WAITING_FOR_INFORMATION'].includes(status) || 
                    isFetchingStatus}
        >
          {isRequesting || isFetchingStatus ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {status === 'REFUSED_TIMEOUT' 
                ? t('onboardingCard.button.retry')
                : ['PENDING', 'WAITING_FOR_INFORMATION'].includes(status)
                ? t('onboardingCard.button.pending')
                : t('onboardingCard.button.default')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 10,
  },
    feeMessage: {
    marginTop: 15,
    fontSize: 16,
    color: "#444",
    textAlign: "center",
    fontWeight: "500",
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
  
  // Status container styles
  statusContainer: {
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
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
  
  // REFUSED_TIMEOUT specific styles
  explanationContainer: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: '#FFEAA7',
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 10,
    textAlign: 'center',
  },
  explanationText: {
    fontSize: 14,
    color: '#856404',
    textAlign: 'center',
    lineHeight: 20,
  },
  nextStepsContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  nextStepsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#7ddd7d',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  stepText: {
    fontSize: 14,
    color: '#555',
    flex: 1,
    lineHeight: 20,
  },
  
  // Pending state styles
  pendingContainer: {
    alignItems: 'flex-start',
    width: '100%',
    marginTop: 20,
    paddingHorizontal: 10,
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
  pendingImage: {
    width: width * 0.4,
    height: width * 0.4,
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
    top: 6,
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
    marginBottom: 5,
    width: '90%',
    alignSelf: 'center',
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
});

export default OnboardingCardScreen;