import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import { AntDesign, Ionicons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Notifications from 'expo-notifications';
import Loader from '../../components/Loader';

// Flag images
const FLAGS = {
  en: require('../../images/usa.png'),
  fr: require('../../images/fr.png'),
};

const Settings = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const [isBiometricsEnabled, setIsBiometricsEnabled] = useState(false);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState({ visible: false, type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    checkNotificationPermissions();
    checkBiometricsAvailability();
  }, []);

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
      console.error(error);
      showFeedback('error', t('biometric_error'));
    } finally {
      setLoading(false);
    }
  };

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    setSelectedLanguage(lang);
    setLanguageModalVisible(false);
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

  if (loading) return <Loader />;

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <StatusBar backgroundColor="#7ddd7d" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40 }}>
           <AntDesign name="left" size={24} color="white" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{t('screens.setting')}</Text>

        <View style={{ width: 40 }} />
      </View>
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Section Paramètres du Compte */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>{t('account2.account_settings')}</Text>
        
        {/* Language Selector */}
        <View style={styles.settingCard}>
          <Icon name="language" size={24} color="black" />
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingTitle}>{t('choose_language')}</Text>
            <Text style={styles.settingSubtitle}>{t('choose_language_subtitle')}</Text>
          </View>
          <TouchableOpacity 
            style={styles.languageSelection}
            onPress={() => setLanguageModalVisible(true)}
          >
            <Image 
              source={FLAGS[selectedLanguage]} 
              style={styles.flagImage} 
              resizeMode="contain"
            />
            <Text style={styles.languageText}>
              {selectedLanguage === 'en' ? 'English' : 'Français'}
            </Text>
            <Ionicons name="chevron-forward" size={20} color="gray" />
          </TouchableOpacity>
        </View>

        {/* Notifications */}
        <View style={styles.settingCard}>
          <Ionicons name="notifications-outline" size={24} color="black" />
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingTitle}>{t('notifications')}</Text>
            <Text style={styles.settingSubtitle}>{t('ensure_notifications')}</Text>
          </View>
          <Switch
            trackColor={{ true: "#7ddd7d", false: "#f1f1f1" }}
            thumbColor={isNotificationsEnabled ? "#ffffff" : "#f8f8f8"}
            onValueChange={toggleNotifications}
            value={isNotificationsEnabled}
          />
        </View>
      </View>

      {/* Section Sécurité */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>{t('security2.security_settings')}</Text>

        {/* Biometrics */}
        <View style={styles.settingCard}>
          <AntDesign name="lock" size={24} color="black" />
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
            trackColor={{ true: "#7ddd7d", false: "#f1f1f1" }}
            thumbColor={isBiometricsEnabled ? "#ffffff" : "#f8f8f8"}
            onValueChange={toggleBiometrics}
            value={isBiometricsEnabled}
            disabled={!biometricAvailable}
          />
        </View>

        {/* Change Password */}
        <TouchableOpacity
          style={styles.settingCard}
          onPress={() => navigation.navigate('ChangePassword')}
        >
          <MaterialIcons name="key" size={24} color="black" />
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingTitle}>{t('change_password')}</Text>
            <Text style={styles.settingSubtitle}>{t('change_password_subtitle')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="gray" />
        </TouchableOpacity>

        {/* Privacy Policy */}
       <TouchableOpacity
          style={styles.settingCard}
          onPress={() => Linking.openURL('https://www.sf-e.ca/politique-de-confidentialite-sendo/')}
        >
          <FontAwesome name="shield" size={24} color="black" />

          <View style={styles.settingTextContainer}>
            <Text style={styles.settingTitle}>{t('privacy_policy')}</Text>
            <Text style={styles.settingSubtitle}>{t('privacy_policy_subtitle')}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="gray" />
        </TouchableOpacity>
      </View>

      {/* Language Modal */}
      <Modal 
        animationType="slide" 
        transparent={true} 
        visible={languageModalVisible}
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{t('choose_language')}</Text>
            
            <TouchableOpacity 
              style={styles.languageOption}
              onPress={() => changeLanguage("en")}
            >
              <Image source={FLAGS.en} style={styles.flagImage} />
              <Text style={styles.languageOptionText}>English</Text>
              {selectedLanguage === 'en' && (
                <Ionicons name="checkmark-circle" size={20} color="green" />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.languageOption}
              onPress={() => changeLanguage("fr")}
            >
              <Image source={FLAGS.fr} style={styles.flagImage} />
              <Text style={styles.languageOptionText}>Français</Text>
              {selectedLanguage === 'fr' && (
                <Ionicons name="checkmark-circle" size={20} color="green" />
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setLanguageModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>{t('account.close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Feedback Modal */}
      <Modal
        transparent={true}
        visible={feedbackModal.visible}
        animationType="fade"
      >
        <View style={styles.feedbackModalContainer}>
          <View style={[
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
          </View>
        </View>
      </Modal>
    </ScrollView>
        </View>

  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
    header: {
    backgroundColor: '#7ddd7d',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 40,
    paddingBottom: 15,
    paddingHorizontal: 15,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 30,
  },
  contentContainer: {
    paddingBottom: 30,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    padding: 20,
    paddingBottom: 10,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4b5563',
  },
  settingCard: {
    backgroundColor: '#f0fdf4',
    padding: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  settingTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  languageSelection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
    marginRight: 4,
  },
  flagImage: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    width: '75%',
    backgroundColor: '#f0fdf4',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#1f2937',
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  languageOptionText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 12,
    flex: 1,
  },
  closeButton: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 16,
  },
  feedbackModalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  feedbackModalContent: {
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
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
    marginLeft: 12,
    flex: 1,
  },
});

export default Settings;