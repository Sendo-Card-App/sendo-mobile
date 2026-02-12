import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  StyleSheet,
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
 //console.log('DEPOSIT_CARD_AVAILABILITY:', DEPOSIT_CARD_AVAILABILITY);
  const WITHDRAWAL_CARD_AVAILABILITY = getConfigValue("WITHDRAWAL_CARD_AVAILABILITY");

  // --- Service availability check ---
  const checkServiceAvailability = (type) => {
    // If config is not loaded yet, assume service is available
    if (isConfigLoading || !configData) {
      return true;
    }
    
    if (type === 'recharge') {
      // Check if DEPOSIT_CARD_AVAILABILITY is set to "1" (available)
      return DEPOSIT_CARD_AVAILABILITY === "1";
    } else if (type === 'withdraw') {
      // Check if WITHDRAWAL_CARD_AVAILABILITY is set to "1" (available)
      return WITHDRAWAL_CARD_AVAILABILITY === "1";
    }
    
    return true; // Default to available if type not recognized
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

    if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
      showModal('error', t('manageVirtualCard.invalidAmount'));
      return;
    }

    // New validation for backend limits
    if (numericAmount < 500 || numericAmount > 500000) {
      showModal('error', t('manageVirtualCard.amountOutOfRange'));
      return;
    }

    if (!matriculeWallet) {
      showModal('error', t('manageVirtualCard.missingMatricule'));
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
        showModal('success', t('manageVirtualCard.rechargedSuccessfully'));
      } else {
        await withdrawFromCard(payload).unwrap();
        showModal('success', t('manageVirtualCard.withdrawnSuccessfully'));
      }
      } catch (err) {
      console.log('Réponse du backend :', JSON.stringify(err, null, 2));

      const backendMessage =
        err?.data?.message ||
        err?.data?.data?.message ||
        err?.error ||
        t('manageVirtualCard.actionFailed');

      showModal('error', backendMessage);
    }


  };

  const clearAmount = () => setAmount('');

  return (
    <View className="flex-1 bg-white p-4">
      {/* Header with Back Button */}
      <View className="flex-row items-center mt-10 mb-6">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="p-2 rounded-full bg-gray-100"
          accessibilityLabel={t('back')}
        >
          <AntDesign name="left" size={24} color="black" />
        </TouchableOpacity>
        <Text className="ml-4 text-xl font-bold">
          {t(`manageVirtualCard.${actionType}Card`)}
        </Text>
      </View>

      {/* Amount Input */}
      <View className="mb-6">
        <Text className="text-gray-600 mb-2">{t('manageVirtualCard.amount')}</Text>
        <View className="flex-row items-center border border-gray-300 rounded-lg p-3">
          <Text className="text-gray-500 mr-2">XAF</Text>
          <TextInput
            placeholder={t('manageVirtualCard.enterAmount')}
            placeholderTextColor="#9CA3AF"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            className="flex-1 text-gray-800"
            accessibilityLabel={t('manageVirtualCard.amountInput')}
          />
          {amount ? (
            <TouchableOpacity onPress={clearAmount}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>
        {(amount && (isNaN(amount) || Number(amount) <= 0)) && (
          <Text className="text-red-500 mt-1 text-sm">
            {t('manageVirtualCard.invalidAmount')}
          </Text>
        )}
      </View>

      {/* Action Toggle */}
      <View className="flex-row justify-between mb-6 bg-gray-100 rounded-lg p-1">
        <TouchableOpacity
          className={`flex-1 items-center py-3 rounded-lg ${actionType === 'recharge' ? 'bg-white shadow-sm' : ''}`}
          onPress={() => setActionType('recharge')}
          accessibilityLabel={t('manageVirtualCard.selectRecharge')}
        >
          <View className="flex-row items-center">
            <Ionicons
              name="add-circle"
              size={20}
              color={actionType === 'recharge' ? '#10B981' : '#9CA3AF'}
              className="mr-2"
            />
            <Text
              className={`font-medium ${actionType === 'recharge' ? 'text-green-600' : 'text-gray-500'}`}
            >
              {t('manageVirtualCard.recharge')}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          className={`flex-1 items-center py-3 rounded-lg ${actionType === 'withdraw' ? 'bg-white shadow-sm' : ''}`}
          onPress={() => setActionType('withdraw')}
          accessibilityLabel={t('manageVirtualCard.selectWithdraw')}
        >
          <View className="flex-row items-center">
            <Ionicons
              name="remove-circle"
              size={20}
              color={actionType === 'withdraw' ? '#EF4444' : '#9CA3AF'}
              className="mr-2"
            />
            <Text
              className={`font-medium ${actionType === 'withdraw' ? 'text-red-600' : 'text-gray-500'}`}
            >
              {t('manageVirtualCard.withdraw')}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        disabled={isLoading || !amount || isNaN(amount) || Number(amount) <= 0}
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
        className={`p-4 rounded-lg flex-row justify-center items-center ${isLoading || !amount || isNaN(amount) || Number(amount) <= 0 ? 'bg-green-300' : 'bg-green-600'}`}
        accessibilityLabel={t('manageVirtualCard.submitAction')}
      >
        {isLoading ? (
          <>
            <ActivityIndicator color="#fff" className="mr-2" />
            <Text className="text-green-500 font-bold">
              {t('manageVirtualCard.processing')}
            </Text>
          </>
        ) : (
          <>
            <Ionicons
              name={actionType === 'recharge' ? 'arrow-up-circle' : 'arrow-down-circle'}
              size={20}
              color="white"
              className="mr-2"
            />
            <Text className="text-white font-bold">
              {t(`manageVirtualCard.${actionType}Action`)}
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Service Unavailable Modal */}
      <Modal
        visible={showUnavailableModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowUnavailableModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalIconContainer}>
              <Ionicons name="warning-outline" size={48} color="#ff6b6b" />
            </View>
            
            <Text style={styles.modalTitle}>
              {actionType === 'recharge' 
                ? 'Card Recharge Service Temporarily Unavailable' 
                : 'Card Withdrawal Service Temporarily Unavailable'}
            </Text>
            
            <Text style={styles.modalMessage}>
              {actionType === 'recharge'
                ? 'The card recharge service is currently unavailable. Please try again later or contact support for assistance.'
                : 'The card withdrawal service is currently unavailable. Please try again later or contact support for assistance.'}
            </Text>
            
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowUnavailableModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Feedback Modal */}
      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-transparent bg-opacity-50 p-4">
          <View className="bg-white p-6 rounded-xl w-full max-w-md">
            <View className="items-center mb-4">
              <Ionicons
                name={modalType === 'success' ? 'checkmark-circle' : 'close-circle'}
                size={48}
                color={modalType === 'success' ? '#10B981' : '#EF4444'}
              />
            </View>
            <Text
              className={`text-xl font-bold text-center mb-2 ${
                modalType === 'success' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {modalType === 'success' ? t('success') : t('error')}
            </Text>
            <Text className="text-gray-800 text-center mb-6">{modalMessage}</Text>
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false);
                if (modalType === 'success') navigation.goBack();
              }}
              className={`p-3 rounded-lg ${modalType === 'success' ? 'bg-green-600' : 'bg-red-600'}`}
              accessibilityLabel={t('ok')}
            >
              <Text className="text-white font-bold text-center">{t('ok')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  modalButtonContainer: {
    width: '100%',
  },
  modalButton: {
    backgroundColor: '#ff6b6b',
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