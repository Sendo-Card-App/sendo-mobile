import React, { useState, useEffect } from 'react';
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
  ScrollView,
  KeyboardAvoidingView,
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
  const [feeAmount, setFeeAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

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
  
  // Fee configurations - Fixed values (not percentages)
  const SENDO_DEPOSIT_CARD_FEES = getConfigValue("SENDO_DEPOSIT_CARD_FEES");
  const SENDO_WITHDRAWAL_CARD_FEES = getConfigValue("SENDO_WITHDRAWAL_CARD_FEES");

  const depositFee = SENDO_DEPOSIT_CARD_FEES ? parseFloat(SENDO_DEPOSIT_CARD_FEES) : 0;
  const withdrawalFee = SENDO_WITHDRAWAL_CARD_FEES ? parseFloat(SENDO_WITHDRAWAL_CARD_FEES) : 0;

  // Calculate fees whenever amount or actionType changes
  useEffect(() => {
    const numericAmount = parseFloat(amount) || 0;
    
    if (actionType === 'recharge') {
      // For deposits: total = amount + fixed fee
      setFeeAmount(depositFee);
      setTotalAmount(numericAmount + depositFee);
    } else {
      // For withdrawals: net = amount + fixed fee
      setFeeAmount(withdrawalFee);
      setTotalAmount(numericAmount + withdrawalFee);
    }
  }, [amount, actionType, depositFee, withdrawalFee]);

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
    console.log('Payload:', payload);

    try {
      if (actionType === 'recharge') {
        await rechargeCard(payload).unwrap();
        showModal('success', 
          t('manageVirtualCard.rechargedSuccessfully', { 
            amount: numericAmount.toFixed(2),
            fee: depositFee.toFixed(2),
            total: (numericAmount + depositFee).toFixed(2)
          }) || `Carte rechargée avec succès\nMontant: ${numericAmount.toFixed(2)} XAF\nFrais: ${depositFee.toFixed(2)} XAF\nTotal: ${(numericAmount + depositFee).toFixed(2)} XAF`
        );
      } else {
        await withdrawFromCard(payload).unwrap();
        showModal('success', 
          t('manageVirtualCard.withdrawnSuccessfully', { 
            amount: numericAmount.toFixed(2),
            fee: withdrawalFee.toFixed(2),
            total: (numericAmount - withdrawalFee).toFixed(2)
          }) || `Retrait effectué avec succès\nMontant: ${numericAmount.toFixed(2)} XAF\nFrais: ${withdrawalFee.toFixed(2)} XAF\nNet: ${(numericAmount - withdrawalFee).toFixed(2)} XAF`
        );
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

  const numericAmount = parseFloat(amount) || 0;

  return (
    <View style={styles.container}>
      {/* StatusBar with proper configuration */}
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

      {/* KeyboardAvoidingView with ScrollView for better UX */}
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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

            {/* Fee Information Card - Only show when amount is entered */}
            {numericAmount > 0 && (
              <View style={styles.feeCard}>
                <View style={styles.feeHeader}>
                  <Ionicons 
                    name={actionType === 'recharge' ? 'arrow-up-circle' : 'arrow-down-circle'} 
                    size={24} 
                    color={actionType === 'recharge' ? '#10B981' : '#EF4444'} 
                  />
                  <Text style={styles.feeTitle}>
                    {actionType === 'recharge' 
                      ? t('manageVirtualCard.depositDetails') || 'Détails du dépôt'
                      : t('manageVirtualCard.withdrawalDetails') || 'Détails du retrait'}
                  </Text>
                </View>
                
                <View style={styles.feeRow}>
                  <Text style={styles.feeLabel}>
                    {t('manageVirtualCard.amount') || 'Montant'}:
                  </Text>
                  <Text style={styles.feeValue}>{numericAmount.toFixed(2)} XAF</Text>
                </View>
                
                <View style={styles.feeRow}>
                  <Text style={styles.feeLabel}>
                    {t('manageVirtualCard.fees') || 'Frais'}:
                  </Text>
                  <Text style={styles.feeValue}>
                    {actionType === 'recharge' ? depositFee.toFixed(2) : withdrawalFee.toFixed(2)} XAF
                  </Text>
                </View>
                
                <View style={[styles.feeRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>
                    {actionType === 'recharge' 
                      ? t('manageVirtualCard.totalToPay') || 'Total à payer'
                      : t('manageVirtualCard.netToReceive') || 'Montant à recevoir'}:
                  </Text>
                  <Text style={[
                    styles.totalValue,
                    { color: actionType === 'recharge' ? '#10B981' : '#EF4444' }
                  ]}>
                    {totalAmount.toFixed(2)} XAF
                  </Text>
                </View>

                {/* Warning for negative amount on withdrawal */}
                {actionType === 'withdraw' && numericAmount < withdrawalFee && (
                  <View style={styles.warningContainer}>
                    <Ionicons name="warning-outline" size={16} color="#EF4444" />
                    <Text style={styles.warningText}>
                      {t('manageVirtualCard.insufficientForFee') || 'Le montant doit être supérieur aux frais de retrait'}
                    </Text>
                  </View>
                )}
              </View>
            )}

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
              disabled={
                isLoading || 
                !amount || 
                isNaN(Number(amount)) || 
                Number(amount) <= 0 ||
                (actionType === 'withdraw' && Number(amount) < withdrawalFee) // Disable if amount less than withdrawal fee
              }
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
                (isLoading || 
                 !amount || 
                 isNaN(Number(amount)) || 
                 Number(amount) <= 0 ||
                 (actionType === 'withdraw' && Number(amount) < withdrawalFee)) && styles.submitButtonDisabled
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
                    {actionType === 'recharge' 
                      ? `${t('manageVirtualCard.recharge') || 'Recharger'} (${depositFee.toFixed(0)} ${t('manageVirtualCard.fees') || 'frais'})`
                      : `${t('manageVirtualCard.withdraw') || 'Retirer'} (${withdrawalFee.toFixed(0)} ${t('manageVirtualCard.fees') || 'frais'})`}
                  </Text>
                </>
              )}
            </TouchableOpacity>
            
            {/* Extra padding at bottom for better scrolling */}
            <View style={styles.bottomPadding} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
  // Fee Card Styles
  feeCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  feeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  feeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginLeft: 8,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  feeLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  feeValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    gap: 6,
  },
  warningText: {
    fontSize: 12,
    color: '#EF4444',
    flex: 1,
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
  bottomPadding: {
    height: 20,
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