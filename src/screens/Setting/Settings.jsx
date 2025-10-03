import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  ScrollView,
  Modal,
  Image,
  StyleSheet,
  Platform,
  Linking,
  StatusBar,
  Animated,
  Easing,
  Dimensions
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { AntDesign, Ionicons, MaterialIcons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Notifications from 'expo-notifications';
import Loader from '../../components/Loader';
import { useAppState } from '../../context/AppStateContext';

const { width, height } = Dimensions.get('window');

// Flag images
const FLAGS = {
  en: require('../../images/usa.png'),
  fr: require('../../images/fr.png'),
};

const Settings = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const { setIsPickingDocument } = useAppState(); // Ajout du contexte
  const [isBiometricsEnabled, setIsBiometricsEnabled] = useState(false);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState({ visible: false, type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const cardAnimations = useRef([]).current;
  const modalSlideAnim = useRef(new Animated.Value(height)).current;

  // Initialize animations
  if (cardAnimations.length === 0) {
    for (let i = 0; i < 8; i++) {
      cardAnimations.push(new Animated.Value(0));
    }
  }

  useEffect(() => {
    checkNotificationPermissions();
    checkBiometricsAvailability();
  }, []);

  useEffect(() => {
    // Animate content on mount
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate cards with stagger
    const cardAnimationsTiming = cardAnimations.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        delay: 300 + index * 80,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      })
    );

    Animated.stagger(80, cardAnimationsTiming).start();
  }, []);

  const animateModalIn = () => {
    modalSlideAnim.setValue(height);
    Animated.timing(modalSlideAnim, {
      toValue: 0,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const animateModalOut = () => {
    Animated.timing(modalSlideAnim, {
      toValue: height,
      duration: 300,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const checkNotificationPermissions = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setIsNotificationsEnabled(status === 'granted');
    } catch (error) {
      console.error(error);
    }
  };

  const checkBiometricsAvailability = async () => {
    try {
      const isAvailable = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(isAvailable && isEnrolled);
      setIsBiometricsEnabled(false);
    } catch (error) {
      console.error(error);
      setBiometricAvailable(false);
      setIsBiometricsEnabled(false);
    }
  };

  const toggleNotifications = async () => {
    setLoading(true);
    try {
      if (isNotificationsEnabled) {
        setIsNotificationsEnabled(false);
        showFeedback('success', t('notifications_disabled'));
      } else {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          showFeedback('error', t('notification_permission_denied'));
          return;
        }
        setIsNotificationsEnabled(true);
        showFeedback('success', t('notifications_enabled'));
      }
    } catch (error) {
      console.error(error);
      showFeedback('error', t('notification_error'));
    } finally {
      setLoading(false);
    }
  };

  const toggleBiometrics = async () => {
    if (!isBiometricsEnabled && !biometricAvailable) {
      showFeedback('error', t('biometric_not_available'));
      return;
    }
    
    if (isBiometricsEnabled) {
      setIsBiometricsEnabled(false);
      showFeedback('success', t('biometrics_disabled'));
      return;
    }

    setLoading(true);
    
    try {
      // 🚨 IMPORTANT: Set picking state to true BEFORE biometric authentication
      setIsPickingDocument(true);
      
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t('authenticate_to_enable_biometrics'),
        cancelLabel: t('cancel'),
        disableDeviceFallback: false,
        fallbackLabel: Platform.OS === 'ios' ? t('use_passcode') : undefined,
      });
      
      if (result.success) {
        setIsBiometricsEnabled(true);
        showFeedback('success', t('biometrics_enabled'));
      } else {
        showFeedback('error', t('authentication_failed'));
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      showFeedback('error', t('biometric_error'));
    } finally {
      // 🚨 IMPORTANT: Reset picking state after biometric operation
      setLoading(false);
      // Small delay to ensure the state is properly reset
      setTimeout(() => {
        setIsPickingDocument(false);
      }, 500);
    }
  };

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    setSelectedLanguage(lang);
    animateModalOut();
    setTimeout(() => setLanguageModalVisible(false), 300);
    showFeedback('success', `${t('account.language_changed_to')} ${lang === 'en' ? 'English' : 'Français'}`);
  };

  const showFeedback = (type, message) => {
    setFeedbackModal({ visible: true, type, message });
    setTimeout(() => setFeedbackModal(prev => ({ ...prev, visible: false })), 3000);
  };

  useEffect(() => {
    const parent = navigation.getParent();
    parent?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => parent?.setOptions({ tabBarStyle: undefined });
  }, [navigation]);

  const renderAnimatedCard = (index, children) => {
    const animatedStyle = {
      opacity: cardAnimations[index],
      transform: [
        { 
          translateY: cardAnimations[index].interpolate({
            inputRange: [0, 1],
            outputRange: [30, 0]
          })
        },
        {
          scale: cardAnimations[index].interpolate({
            inputRange: [0, 1],
            outputRange: [0.9, 1]
          })
        }
      ]
    };

    return (
      <Animated.View style={animatedStyle}>
        {children}
      </Animated.View>
    );
  };

  if (loading) return <Loader />;

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <StatusBar backgroundColor="#7ddd7d" barStyle="light-content" />

      {/* Animated Header */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim }
          ]
        }}
        className="bg-[#7ddd7d] pt-12 pb-6 px-6 rounded-b-3xl shadow-2xl"
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="w-12 h-12 bg-white/20 rounded-2xl items-center justify-center shadow-lg"
            activeOpacity={0.7}
          >
            <AntDesign name="left" size={20} color="white" />
          </TouchableOpacity>

          <Text className="text-white text-2xl font-bold text-center flex-1 mx-4">
            {t('screens.setting')}
          </Text>

          <View className="w-12 h-12" />
        </View>
      </Animated.View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Settings Section */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }}
        >
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="account-cog" size={24} color="#7ddd7d" />
              <Text style={styles.sectionTitle}>{t('account2.account_settings')}</Text>
            </View>
            
            {/* Language Selector */}
            {renderAnimatedCard(0, (
              <TouchableOpacity 
                style={styles.settingCard}
                onPress={() => {
                  setLanguageModalVisible(true);
                  animateModalIn();
                }}
                activeOpacity={0.7}
              >
                <View style={styles.settingIconContainer}>
                  <MaterialCommunityIcons name="translate" size={24} color="#7ddd7d" />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>{t('choose_language')}</Text>
                  <Text style={styles.settingSubtitle}>{t('choose_language_subtitle')}</Text>
                </View>
                <View style={styles.settingAction}>
                  <Image 
                    source={FLAGS[selectedLanguage]} 
                    style={styles.flagImage} 
                    resizeMode="contain"
                  />
                  <Text style={styles.languageText}>
                    {selectedLanguage === 'en' ? 'English' : 'Français'}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </View>
              </TouchableOpacity>
            ))}

            {/* Notifications */}
            {renderAnimatedCard(1, (
              <View style={styles.settingCard}>
                <View style={styles.settingIconContainer}>
                  <Ionicons name="notifications-outline" size={24} color="#7ddd7d" />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>{t('notifications')}</Text>
                  <Text style={styles.settingSubtitle}>{t('ensure_notifications')}</Text>
                </View>
                <Switch
                  trackColor={{ false: '#E5E7EB', true: '#7ddd7d' }}
                  thumbColor={isNotificationsEnabled ? '#ffffff' : '#f4f4f4'}
                  ios_backgroundColor="#E5E7EB"
                  onValueChange={toggleNotifications}
                  value={isNotificationsEnabled}
                  style={styles.switch}
                />
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Security Section */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }}
        >
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="shield-account" size={24} color="#7ddd7d" />
              <Text style={styles.sectionTitle}>{t('security2.security_settings')}</Text>
            </View>

            {/* Biometrics */}
            {renderAnimatedCard(2, (
              <View style={styles.settingCard}>
                <View style={styles.settingIconContainer}>
                  <MaterialCommunityIcons 
                    name={Platform.OS === 'ios' ? 'face-recognition' : 'fingerprint'} 
                    size={24} 
                    color="#7ddd7d" 
                  />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>{t('biometrics')}</Text>
                  <Text style={styles.settingSubtitle}>
                    {biometricAvailable 
                      ? t('unlock_app') 
                      : t('biometric_not_available_on_device')
                    }
                  </Text>
                </View>
                <Switch
                  trackColor={{ false: '#E5E7EB', true: '#7ddd7d' }}
                  thumbColor={isBiometricsEnabled ? '#ffffff' : '#f4f4f4'}
                  ios_backgroundColor="#E5E7EB"
                  onValueChange={toggleBiometrics}
                  value={isBiometricsEnabled}
                  disabled={!biometricAvailable}
                  style={styles.switch}
                />
              </View>
            ))}

            {/* Change Password */}
            {renderAnimatedCard(3, (
              <TouchableOpacity
                style={styles.settingCard}
                onPress={() => navigation.navigate('ChangePassword')}
                activeOpacity={0.7}
              >
                <View style={styles.settingIconContainer}>
                  <MaterialIcons name="key" size={24} color="#7ddd7d" />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>{t('change_password')}</Text>
                  <Text style={styles.settingSubtitle}>{t('change_password_subtitle')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ))}

            {/* Privacy Policy */}
            {renderAnimatedCard(4, (
              <TouchableOpacity
                style={styles.settingCard}
                onPress={() => Linking.openURL('https://www.sf-e.ca/politique-de-confidentialite-sendo/')}
                activeOpacity={0.7}
              >
                <View style={styles.settingIconContainer}>
                  <FontAwesome name="shield" size={24} color="#7ddd7d" />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={styles.settingTitle}>{t('privacy_policy')}</Text>
                  <Text style={styles.settingSubtitle}>{t('privacy_policy_subtitle')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>

        {/* App Info Section */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }}
        >
         
        </Animated.View>
      </ScrollView>

      {/* Language Selection Modal */}
      <Modal 
        animationType="none"
        transparent={true}
        visible={languageModalVisible}
        onRequestClose={() => {
          animateModalOut();
          setTimeout(() => setLanguageModalVisible(false), 300);
        }}
      >
        <View style={styles.modalOverlay}>
          <Animated.View 
            style={[
              styles.modalContainer,
              { transform: [{ translateY: modalSlideAnim }] }
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('choose_language')}</Text>
              <TouchableOpacity 
                onPress={() => {
                  animateModalOut();
                  setTimeout(() => setLanguageModalVisible(false), 300);
                }}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.languageOptions}>
              <TouchableOpacity 
                style={[
                  styles.languageOption,
                  selectedLanguage === 'en' && styles.selectedLanguageOption
                ]}
                onPress={() => changeLanguage("en")}
                activeOpacity={0.7}
              >
                <Image source={FLAGS.en} style={styles.flagImage} />
                <Text style={styles.languageOptionText}>English</Text>
                {selectedLanguage === 'en' && (
                  <Ionicons name="checkmark-circle" size={24} color="#7ddd7d" />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[
                  styles.languageOption,
                  selectedLanguage === 'fr' && styles.selectedLanguageOption
                ]}
                onPress={() => changeLanguage("fr")}
                activeOpacity={0.7}
              >
                <Image source={FLAGS.fr} style={styles.flagImage} />
                <Text style={styles.languageOptionText}>Français</Text>
                {selectedLanguage === 'fr' && (
                  <Ionicons name="checkmark-circle" size={24} color="#7ddd7d" />
                )}
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Feedback Modal */}
      <Modal
        transparent={true}
        visible={feedbackModal.visible}
        animationType="fade"
      >
        <View style={styles.feedbackModalContainer}>
          <Animated.View style={[
            styles.feedbackModalContent,
            feedbackModal.type === 'success' 
              ? styles.successModal 
              : styles.errorModal
          ]}>
            <Ionicons 
              name={feedbackModal.type === 'success' ? "checkmark-circle" : "alert-circle"} 
              size={32} 
              color="white" 
            />
            <Text style={styles.feedbackModalText}>{feedbackModal.message}</Text>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  contentContainer: {
    paddingBottom: 30,
    paddingTop: 20,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: 12,
  },
  settingCard: {
    backgroundColor: '#ffffff',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f0f9f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  settingAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageText: {
    fontSize: 14,
    color: '#6b7280',
    marginHorizontal: 8,
  },
  flagImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  switch: {
    transform: Platform.OS === 'ios' ? [{ scale: 0.8 }] : [{ scale: 1 }],
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    padding: 4,
  },
  languageOptions: {
    padding: 20,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  selectedLanguageOption: {
    backgroundColor: '#f0f9f0',
    borderWidth: 1,
    borderColor: '#7ddd7d',
  },
  languageOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 12,
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    marginHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 16,
    color: '#6b7280',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  feedbackModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  feedbackModalContent: {
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  successModal: {
    backgroundColor: '#10b981',
  },
  errorModal: {
    backgroundColor: '#ef4444',
  },
  feedbackModalText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },
});

export default Settings;