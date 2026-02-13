import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons, AntDesign } from "@expo/vector-icons";
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { useGetUserProfileQuery } from '../../services/Auth/authAPI';
import {
  useRechargeCardMutation,
  useWithdrawFromCardMutation,
} from '../../services/Card/cardApi';
import { useGetConfigQuery } from '../../services/Config/configApi';

const CardActionScreen = ({ route }) => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { cardId, action } = route.params;

  const [amount, setAmount] = useState('');
  const [actionType, setActionType] = useState(action);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('success');
  const [modalMessage, setModalMessage] = useState('');
  const [showUnavailableModal, setShowUnavailableModal] = useState(false);

  const [rechargeCard, { isLoading: isRecharging }] = useRechargeCardMutation();
  const [withdrawFromCard, { isLoading: isWithdrawing }] = useWithdrawFromCardMutation();
  const { data: userProfile, isLoading: isProfileLoading } = useGetUserProfileQuery();
  
  // --- Config Query ---
  const {
    data: configData,
    isLoading: isConfigLoading,
  } = useGetConfigQuery();

  const matriculeWallet = userProfile?.data?.user?.wallet?.matricule;
  const isLoading = isRecharging || isWithdrawing || isProfileLoading;

  // --- Helper function to get config values ---
  const getConfigValue = (name) => {
    const configItem = configData?.data?.find((item) => item.name === name);
    return configItem ? configItem.value : null;
  };

  const DEPOSIT_CARD_AVAILABILITY = getConfigValue("DEPOSIT_CARD_AVAILABILITY");
  const WITHDRAWAL_CARD_AVAILABILITY = getConfigValue("WITHDRAWAL_CARD_AVAILABILITY");

  // --- Service availability check ---
  const checkServiceAvailability = (type) => {
    if (isConfigLoading || !configData) {
      return true;
    }
    
    if (type === 'recharge') {
      return DEPOSIT_CARD_AVAILABILITY === "1";
    } else if (type === 'withdraw') {
      return WITHDRAWAL_CARD_AVAILABILITY === "1";
    }
    
    return true;
  };

  const showModal = (type, message) => {
    setModalType(type);
    setModalMessage(message);
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    // First check if the service is available
    if (!checkServiceAvailability(actionType)) {
      setShowUnavailableModal(true);
      return;
    }

    const numericAmount = Number(amount);

    // Validation errors - ALL using the same modal
    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      showModal('error', t('manageVirtualCard.invalidAmount') || 'Montant invalide');
      return;
    }

    // Validation for backend limits
    if (numericAmount < 1500 || numericAmount > 500000) {
      showModal('error', t('manageVirtualCard.amountOutOfRange') || 'Le montant doit être entre 1 500 et 500 000 FCFA');
      return;
    }

    if (!matriculeWallet) {
      showModal('error', t('manageVirtualCard.missingMatricule') || 'Matricule du portefeuille manquant');
      return;
    }

    const payload = {
      amount: numericAmount,
      idCard: Number(cardId),
      matriculeWallet,
    };
    console.log(payload);

    try {
      if (actionType === 'recharge') {
        await rechargeCard(payload).unwrap();
        showModal('success', t('manageVirtualCard.rechargedSuccessfully') || 'Carte rechargée avec succès');
      } else {
        await withdrawFromCard(payload).unwrap();
        showModal('success', t('manageVirtualCard.withdrawnSuccessfully') || 'Retrait effectué avec succès');
      }
    } catch (err) {
      console.log('Réponse du backend :', JSON.stringify(err, null, 2));

      const backendMessage =
        err?.data?.message ||
        err?.data?.data?.message ||
        err?.error ||
        t('manageVirtualCard.actionFailed') ||
        'Une erreur est survenue';

      showModal('error', backendMessage);
    }
  };

  const clearAmount = () => setAmount('');

  return (
    <View style={styles.container}>
      {/* FIXED: StatusBar with proper configuration */}
      <StatusBar 
        backgroundColor="#7ddd7d" 
        barStyle="light-content"
        translucent={false}
      />

      {/* Header with proper StatusBar integration */}
      <View style={[
        styles.header,
        {
          paddingTop: Platform.OS === 'android' 
            ? (StatusBar.currentHeight || 25) 
            : 50,
        }
      ]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityLabel={t('back')}
        >
          <AntDesign name="left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {t(`manageVirtualCard.${actionType}Card`) || (actionType === 'recharge' ? 'Recharger la carte' : 'Retirer de la carte')}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.content}>
        {/* Amount Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>{t('manageVirtualCard.amount') || 'Montant'}</Text>
          <View style={styles.amountInputWrapper}>
            <Text style={styles.currencyLabel}>XAF</Text>
            <TextInput
              placeholder={t('manageVirtualCard.enterAmount') || 'Entrez le montant'}
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              style={styles.amountInput}
              accessibilityLabel={t('manageVirtualCard.amountInput')}
            />
            {amount ? (
              <TouchableOpacity onPress={clearAmount} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Action Toggle */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              actionType === 'recharge' && styles.toggleButtonActive
            ]}
            onPress={() => setActionType('recharge')}
            accessibilityLabel={t('manageVirtualCard.selectRecharge')}
          >
            <View style={styles.toggleContent}>
              <Ionicons
                name="add-circle"
                size={20}
                color={actionType === 'recharge' ? '#10B981' : '#9CA3AF'}
              />
              <Text
                style={[
                  styles.toggleText,
                  actionType === 'recharge' && styles.toggleTextActive
                ]}
              >
                {t('manageVirtualCard.recharge') || 'Recharger'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              actionType === 'withdraw' && styles.toggleButtonActiveWithdraw
            ]}
            onPress={() => setActionType('withdraw')}
            accessibilityLabel={t('manageVirtualCard.selectWithdraw')}
          >
            <View style={styles.toggleContent}>
              <Ionicons
                name="remove-circle"
                size={20}
                color={actionType === 'withdraw' ? '#EF4444' : '#9CA3AF'}
              />
              <Text
                style={[
                  styles.toggleText,
                  actionType === 'withdraw' && styles.toggleTextActiveWithdraw
                ]}
              >
                {t('manageVirtualCard.withdraw') || 'Retirer'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Info Text */}
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
          <Text style={styles.infoText}>
            {t('manageVirtualCard.amountOutOfRange') || 'Montant autorisé : 1 500 - 500 000 FCFA'}
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          disabled={isLoading || !amount || isNaN(Number(amount)) || Number(amount) <= 0}
          onPress={() =>
            navigation.navigate("Auth", {
              screen: "PinCode",
              params: {
                onSuccess: async () => {
                  await handleSubmit();
                },
              },
            })
          }
          style={[
            styles.submitButton,
            (isLoading || !amount || isNaN(Number(amount)) || Number(amount) <= 0) && styles.submitButtonDisabled
          ]}
          accessibilityLabel={t('manageVirtualCard.submitAction')}
        >
          {isLoading ? (
            <>
              <ActivityIndicator color="#fff" style={styles.buttonIcon} />
              <Text style={styles.submitButtonText}>
                {t('manageVirtualCard.processing') || 'Traitement...'}
              </Text>
            </>
          ) : (
            <>
              <Ionicons
                name={actionType === 'recharge' ? 'arrow-up-circle' : 'arrow-down-circle'}
                size={20}
                color="white"
                style={styles.buttonIcon}
              />
              <Text style={styles.submitButtonText}>
                {t(`manageVirtualCard.${actionType}Action`) || (actionType === 'recharge' ? 'Recharger' : 'Retirer')}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Service Unavailable Modal */}
      <Modal
        visible={showUnavailableModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowUnavailableModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={[styles.modalIconContainer, { backgroundColor: '#fff5f5' }]}>
              <Ionicons name="warning-outline" size={48} color="#ff6b6b" />
            </View>
            
            <Text style={styles.modalTitle}>
              {actionType === 'recharge' 
                ? (t('manageVirtualCard.rechargeUnavailable') || 'Service de recharge temporairement indisponible')
                : (t('manageVirtualCard.withdrawUnavailable') || 'Service de retrait temporairement indisponible')}
            </Text>
            
            <Text style={styles.modalMessage}>
              {actionType === 'recharge'
                ? (t('manageVirtualCard.rechargeUnavailableMessage') || 'Le service de recharge de carte est actuellement indisponible. Veuillez réessayer plus tard ou contacter le support.')
                : (t('manageVirtualCard.withdrawUnavailableMessage') || 'Le service de retrait de carte est actuellement indisponible. Veuillez réessayer plus tard ou contacter le support.')}
            </Text>
            
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowUnavailableModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalButtonText}>{t('ok') || 'OK'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Feedback Modal - For validation errors and success/error messages */}
      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={[
              styles.modalIconContainer,
              { backgroundColor: modalType === 'success' ? '#e8f5e8' : '#fff5f5' }
            ]}>
              <Ionicons
                name={modalType === 'success' ? 'checkmark-circle' : 'warning-outline'}
                size={48}
                color={modalType === 'success' ? '#10B981' : '#ff6b6b'}
              />
            </View>
            
            <Text style={[
              styles.modalTitle,
              { color: modalType === 'success' ? '#10B981' : '#ff6b6b' }
            ]}>
              {modalType === 'success' 
                ? (t('success') || 'Succès') 
                : (t('error') || 'Erreur')}
            </Text>
            
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: modalType === 'success' ? '#10B981' : '#ff6b6b' }
                ]}
                onPress={() => {
                  setModalVisible(false);
                  if (modalType === 'success') navigation.goBack();
                }}
                accessibilityLabel={t('ok')}
              >
                <Text style={styles.modalButtonText}>{t('ok') || 'OK'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#7ddd7d',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 15,
    paddingHorizontal: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
    fontWeight: '500',
  },
  amountInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    overflow: 'hidden',
  },
  currencyLabel: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    backgroundColor: '#F3F4F6',
    borderRightWidth: 1,
    borderRightColor: '#D1D5DB',
  },
  amountInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
    color: '#1F2937',
  },
  clearButton: {
    padding: 15,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleButtonActiveWithdraw: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  toggleTextActive: {
    color: '#10B981',
  },
  toggleTextActiveWithdraw: {
    color: '#EF4444',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
  submitButton: {
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButtonContainer: {
    width: '100%',
  },
  modalButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CardActionScreen;