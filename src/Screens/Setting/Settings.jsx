import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  ScrollView,
  Modal,
  Image,
  StyleSheet
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDispatch } from 'react-redux';
import { AntDesign, Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Notifications from 'expo-notifications';
import Loader from '../../components/Loader';

// Flag images (you'll need to add these to your assets)
const FLAGS = {
  en: require('../../Images/usa.png'),
  fr: require('../../Images/fr.png'),
};

const Settings = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const [isBiometricsEnabled, setIsBiometricsEnabled] = useState(false);
  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [feedbackModal, setFeedbackModal] = useState({
    visible: false,
    type: '', // 'success' or 'error'
    message: ''
  });
  const [loading, setLoading] = useState(false);

  // Check notification permissions on mount
  useEffect(() => {
    checkNotificationPermissions();
    checkBiometricsAvailability();
  }, []);

  const checkNotificationPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setIsNotificationsEnabled(status === 'granted');
  };

  const checkBiometricsAvailability = async () => {
    const isAvailable = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    setIsBiometricsEnabled(isAvailable && isEnrolled);
  };

  const toggleNotifications = async () => {
    setLoading(true);
    try {
      if (isNotificationsEnabled) {
        await Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowAlert: false,
            shouldPlaySound: false,
            shouldSetBadge: false,
          }),
        });
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
      showFeedback('error', t('notification_error'));
    } finally {
      setLoading(false);
    }
  };

  const toggleBiometrics = async () => {
    setLoading(true);
    try {
      const isHardwareSupported = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();

      if (!isHardwareSupported || !isEnrolled) {
        showFeedback('error', t('biometric_not_available'));
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: t('authenticate_to_toggle_biometrics'),
      });

      if (result.success) {
        setIsBiometricsEnabled(!isBiometricsEnabled);
        showFeedback('success', 
          isBiometricsEnabled 
            ? t('biometrics_disabled') 
            : t('biometrics_enabled')
        );
      }
    } catch (error) {
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
    setFeedbackModal({
      visible: true,
      type,
      message
    });
    setTimeout(() => {
      setFeedbackModal(prev => ({ ...prev, visible: false }));
    }, 3000);
  };

  // Hide bottom tab bar
  useEffect(() => {
    const parent = navigation.getParent();
    parent?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => parent?.setOptions({ tabBarStyle: undefined });
  }, [navigation]);

  if (loading) return <Loader />;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Text style={styles.sectionTitle}>{t('security')}</Text>

      {/* Biometrics */}
      <View style={styles.settingCard}>
        <AntDesign name="lock" size={24} color="black" />
        <View style={styles.settingTextContainer}>
          <Text style={styles.settingTitle}>{t('biometrics')}</Text>
          <Text style={styles.settingSubtitle}>{t('unlock_app')}</Text>
        </View>
        <Switch
          trackColor={{ true: "#7ddd7d", false: "#f1f1f1" }}
          thumbColor={isBiometricsEnabled ? "#ffffff" : "#f8f8f8"}
          onValueChange={toggleBiometrics}
          value={isBiometricsEnabled}
        />
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

      {/* Change Password */}
      <TouchableOpacity
        style={styles.settingCard}
        onPress={() => navigation.navigate('ChangePassword')}
      >
        <MaterialIcons name="key" size={24} color="black" />
        <View style={styles.settingTextContainer}>
          <Text style={styles.settingTitle}>{t('change_password')}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="gray" />
      </TouchableOpacity>

      {/* Language Selector */}
      <View style={styles.languageContainer}>
        <TouchableOpacity
          style={styles.languageButton}
          onPress={() => setLanguageModalVisible(true)}
        >
          <Icon name="language" size={24} color="black" />
          <Text style={styles.languageButtonText}>{t('choose_language')}</Text>
          <View style={styles.languageSelection}>
            <Image 
              source={FLAGS[selectedLanguage]} 
              style={styles.flagImage} 
              resizeMode="contain"
            />
            <Text style={styles.languageText}>
              {selectedLanguage === 'en' ? 'English' : 'Français'}
            </Text>
          </View>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  contentContainer: {
    paddingBottom: 30,
  },
  sectionTitle: {
    padding: 20,
    marginLeft: 5,
    marginTop: 10,
    fontSize: 20,
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
    fontSize: 18,
    fontWeight: '600',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  languageContainer: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
  },
  languageButtonText: {
    marginLeft: 12,
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  languageSelection: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  languageText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
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