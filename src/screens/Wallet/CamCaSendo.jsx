import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  StyleSheet,
  Modal,
  Linking,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useGetBalanceQuery,
  useTransferFundsMutation,
  useGetWalletDetailsQuery,
  useGetTransferFeesMutation,
} from '../../services/WalletApi/walletApi';
import { useGetConfigQuery } from '../../services/Config/configApi';
import { useGetUserProfileQuery } from '../../services/Auth/authAPI';
import Toast from 'react-native-toast-message';
import { useTranslation } from 'react-i18next';
import { Ionicons, AntDesign, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import { showErrorToast } from '../../utils/errorHandler';
import Loader from '../../components/Loader';

const formatCurrency = (amount, currency = 'XAF') => {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `0 ${currency}`;
  }
  
  const numAmount = parseFloat(amount);
  
  if (currency === 'XAF' || currency === 'FCFA') {
    const formatted = numAmount.toLocaleString('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return `${formatted} FCFA`;
  } else if (currency === 'CAD') {
    const formatted = numAmount.toLocaleString('en-CA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `$${formatted} CAD`;
  } 
  
  return `${numAmount.toFixed(2)} ${currency}`;
};

const CamCaSendo = ({ navigation }) => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState('');
  const [walletId, setWalletId] = useState('');
  const [description, setDescription] = useState('');
  const [userWalletId, setUserWalletId] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [debouncedWalletId, setDebouncedWalletId] = useState('');
  const [transferFeesXAF, setTransferFeesXAF] = useState(0);
  const [transferFeesCAD, setTransferFeesCAD] = useState(0);
  const [feeError, setFeeError] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showSFEConnectModal, setShowSFEConnectModal] = useState(false);
  const [showUnavailableModal, setShowUnavailableModal] = useState(false);

  // Configuration
  const {
    data: configData,
    isLoading: isConfigLoading,
  } = useGetConfigQuery(undefined, {
    pollingInterval: 1000,
  });

  const getConfigValue = (name) => {
    const configItem = configData?.data?.find(item => item.name === name);
    return configItem ? configItem.value : null;
  };

  const SENDO_VALUE_CAD_CA_CAM = getConfigValue('SENDO_VALUE_CAD_CA_CAM');
  const exchangeRate = SENDO_VALUE_CAD_CA_CAM || 482; 
  const TRANSFER_CAM_CA_AVAILABILITY = getConfigValue("TRANSFER_CAM_CA_AVAILABILITY");

  // Debounce walletId input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedWalletId(walletId);
    }, 500);
    return () => clearTimeout(timer);
  }, [walletId]);

  // Use the API mutation for fees
  const [getTransferFees, { isLoading: isCalculatingFees }] = useGetTransferFeesMutation();

  const { data: userProfile, isLoading: isProfileLoading } = useGetUserProfileQuery();
  const userId = userProfile?.data?.user?.id;
  const userCountry = userProfile?.data?.user?.country;
  const isCanada = userCountry === "Canada";
  const isCameroon = userCountry === "Cameroon" || !isCanada;

  // Monthly limit check for Cameroon users
  const MONTHLY_LIMIT_XAF = 1000000; // 1 million XAF
  const isOverMonthlyLimit = isCameroon && parseFloat(amount) > MONTHLY_LIMIT_XAF;

  const {
    data: balanceData,
    isLoading: isBalanceLoading,
    error: balanceError,
    isError: isBalanceError,
  } = useGetBalanceQuery(userId, {
    skip: !userId,
    pollingInterval: 10000,
  });

  const {
    data: recipientData,
    isLoading: isRecipientLoading,
    isError: isRecipientError,
  } = useGetWalletDetailsQuery(debouncedWalletId, { skip: !debouncedWalletId });

  useEffect(() => {
    if (recipientData?.data?.user) {
      const { firstname, lastname } = recipientData.data.user;
      setRecipientName(`${firstname} ${lastname}`);
    } else if (isRecipientError) {
      setRecipientName(t('wallet_transfer.recipient_not_found'));
    } else if (!debouncedWalletId) {
      setRecipientName('');
    }
  }, [recipientData, isRecipientError, debouncedWalletId, t]);

  useEffect(() => {
    const walletId = userProfile?.data?.user?.wallet?.matricule || userProfile?.data?.user?.walletId;
    if (walletId) setUserWalletId(walletId);
  }, [userProfile]);

  const [transferFunds, { isLoading: isTransferring }] = useTransferFundsMutation();

  // Calculate conversion and totals
  const calculateConversion = useCallback(() => {
    const transferAmount = parseFloat(amount) || 0;
    
    if (transferAmount <= 0) {
      return {
        amountXAF: 0,
        amountCAD: 0,
        totalXAF: 0,
        totalCAD: 0,
        feesXAF: 0,
        feesCAD: 0,
      };
    }

    let amountXAF, amountCAD;
    
    if (isCameroon) {
      amountXAF = transferAmount;
      amountCAD = exchangeRate ? transferAmount / exchangeRate : 0;
    } else {
      amountCAD = transferAmount;
      amountXAF = exchangeRate ? transferAmount * exchangeRate : 0;
    }
    
    return {
      amountXAF,
      amountCAD,
      totalXAF: amountXAF + transferFeesXAF,
      totalCAD: amountCAD + transferFeesCAD,
      feesXAF: transferFeesXAF,
      feesCAD: transferFeesCAD,
    };
  }, [amount, exchangeRate, transferFeesXAF, transferFeesCAD, isCameroon]);

  // Fetch transfer fees when amount changes
  useEffect(() => {
    const fetchTransferFees = async () => {
      const transferAmount = parseFloat(amount);
      
      if (!amount || isNaN(transferAmount) || transferAmount <= 0) {
        setTransferFeesXAF(0);
        setTransferFeesCAD(0);
        setFeeError(null);
        return;
      }

      if (transferAmount < 100) {
        setTransferFeesXAF(0);
        setTransferFeesCAD(0);
        setFeeError(t('wallet_transfer.amount_too_small_for_fees'));
        return;
      }

      try {
        setFeeError(null);
        
        const response = await getTransferFees(transferAmount).unwrap();
        
        if (response.status === 200 && response.data) {
          setTransferFeesXAF(response.data.feesXAF || 0);
          setTransferFeesCAD(response.data.feesCAD || 0);
        } else {
          throw new Error(response.message || 'Failed to fetch transfer fees');
        }
      } catch (error) {
        console.log("Error fetching transfer fees:", JSON.stringify(error, null, 2));
        
        const backendError = error?.data?.data?.errors;
        if (backendError && Array.isArray(backendError) && backendError[0]?.includes("Aucun palier trouvé")) {
          setFeeError(t('wallet_transfer.no_fee_tier_found'));
        } else {
          const errorMessage = error?.data?.message || error?.message || 'Error calculating fees';
          setFeeError(typeof errorMessage === 'string' ? errorMessage : 'Error calculating fees');
        }
        
        setTransferFeesXAF(0);
        setTransferFeesCAD(0);
      }
    };

    const timer = setTimeout(() => {
      fetchTransferFees();
    }, 800);

    return () => clearTimeout(timer);
  }, [amount, getTransferFees, t]);

  const calculateTotalAmount = useCallback(() => {
    const transferAmount = parseFloat(amount) || 0;
    if (isCanada) {
      return transferAmount + transferFeesCAD;
    }
    return transferAmount + transferFeesXAF;
  }, [amount, transferFeesCAD, transferFeesXAF, isCanada]);

  // --- Service availability check ---
  const checkServiceAvailability = () => {
    if (isConfigLoading || !configData) {
      return true;
    }
    return TRANSFER_CAM_CA_AVAILABILITY === "1";
  };

  // --- Check if sender is trying to send to themselves ---
  const checkSelfTransfer = () => {
    if (!userWalletId || !walletId) {
      return false;
    }
    return userWalletId.trim() === walletId.trim();
  };

  const handlePreview = () => {
    if (!checkServiceAvailability()) {
      setShowUnavailableModal(true);
      return;
    }

    if (checkSelfTransfer()) {
      showErrorToast('ACTION_FAILED', 'Vous ne pouvez pas transférer des fonds vers votre propre compte.');
      return;
    }

    if (!validateForm()) return;
    
    if (isOverMonthlyLimit) {
      setShowSFEConnectModal(true);
      return;
    }
    
    setShowSummary(true);
  };

  const validateForm = () => {
    if (!walletId) {
      showErrorToast('ACTION_FAILED', t('wallet_transfer.recipient_required'));
      return false;
    }

    if (!amount || parseFloat(amount) <= 0) {
      showErrorToast('ACTION_FAILED', t('wallet_transfer.amount_required'));
      return false;
    }

    if (!description.trim()) {
      showErrorToast('ACTION_FAILED', t('wallet_transfer.description_required'));
      return false;
    }

    if (isRecipientError || !recipientData?.data?.user) {
      showErrorToast('ACTION_FAILED', t('wallet_transfer.invalid_recipient'));
      return false;
    }

    return true;
  };

  const handleConfirmTransfer = async () => {
    const transferAmount = parseFloat(amount);
    const totalAmount = calculateTotalAmount();
    
    const currentBalance = balanceData?.data?.balance || 0;
    if (totalAmount > currentBalance) {
      showErrorToast(
        'INSUFFICIENT_FUNDS', 
        t('wallet_transfer.insufficient_balance', {
          balance: currentBalance.toFixed(2),
          currency: isCameroon ? 'FCFA' : 'CAD',
          total: totalAmount.toFixed(isCameroon ? 0 : 2)
        })
      );
      return;
    }

    try {
      await transferFunds({
        fromWallet: userWalletId,
        toWallet: walletId,
        amount: transferAmount,
        transfer_description: description,
      }).unwrap();

      navigation.navigate('Success', {
        message: t('wallet_transfer.success_message'),
        nextScreen: 'MainTabs',
      });
    } catch (error) {
      console.log("Transfer error:", JSON.stringify(error, null, 2));
     
      const status = error?.status;
      if (status === 503) showErrorToast('SERVICE_UNAVAILABLE');
      else if (status === 500) showErrorToast('ACTION_FAILED', t('wallet_transfer.server_error'));
      else if (status === 400) showErrorToast('ACTION_FAILED', t('wallet_transfer.invalid_data'));
      else if (status === 403) showErrorToast('KYC_ERROR', t('wallet_transfer.kyc_required'));
      else if (status === 404) showErrorToast('ACTION_FAILED', t('wallet_transfer.wallet_not_found'));
      else showErrorToast('ACTION_FAILED', error?.data?.message || t('wallet_transfer.general_error'));
    }
  };

  const handleConfirmButtonClick = () => {
    setShowSummary(false);
    setTimeout(() => {
      navigation.navigate("Auth", {
        screen: "PinCode",
        params: {
          onSuccess: async () => {
            await handleConfirmTransfer();
          },
        },
      });
    }, 300);
  };

  const openSFEConnect = (platform) => {
    const urls = {
      android: 'https://play.google.com/store/apps/details?id=com.sfesendo.connect&pcampaignid=web_share',
      ios: 'https://apps.apple.com/tr/app/sfe-connect/id6749484116'
    };
    
    Linking.openURL(urls[platform]).catch(err => {
      console.error('Failed to open URL:', err);
      Alert.alert('Erreur', 'Impossible d\'ouvrir le lien');
    });
  };

  const conversion = calculateConversion();
  const isLoading = isProfileLoading || isBalanceLoading || isConfigLoading;

  return (
    <View style={styles.container}>
      {/* FIXED: StatusBar with correct background color */}
      <StatusBar 
        backgroundColor="#7ddd7d" 
        barStyle="light-content"
        translucent={false}
      />

      {/* Header - Now with proper StatusBar integration */}
      <View style={[
        styles.header,
        {
          paddingTop: Platform.OS === 'android' 
            ? (StatusBar.currentHeight || 25) 
            : 50
        }
      ]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <AntDesign name="left" size={24} color="white" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {isCameroon ? 'Envoyer au Canada' : t('screens.walletTransfer')}
          </Text>
          <Text style={styles.headerSubtitle}>
            {isCameroon ? 'Transfert Cameroun - Canada' : 'Transfert Sendo'}
          </Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Recipient Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="person-outline" size={18} color="#666" /> Bénéficiaire
          </Text>
          
          <TextInput
            style={[styles.input, !walletId && styles.inputEmpty]}
            placeholder="Numéro de matricule du bénéficiaire"
            placeholderTextColor="#999"
            value={walletId}
            onChangeText={setWalletId}
            autoCapitalize="none"
          />
          
          {walletId && (
            <View style={styles.recipientInfo}>
              {isRecipientLoading ? (
                <View style={styles.loadingContainer}>
                  <Loader size="small" color="#0D1C6A" />
                  <Text style={styles.loadingText}>Recherche du bénéficiaire...</Text>
                </View>
              ) : recipientName ? (
                <View style={styles.recipientFound}>
                  <Ionicons name="checkmark-circle" size={20} color="#28a745" />
                  <Text style={styles.recipientName}>{recipientName}</Text>
                </View>
              ) : (
                <View style={styles.recipientNotFound}>
                  <Ionicons name="alert-circle" size={20} color="#dc3545" />
                  <Text style={styles.recipientError}>Bénéficiaire non trouvé</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Amount Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="cash-outline" size={18} color="#666" /> Montant du transfert
          </Text>
          
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencyLabel}>
              {isCameroon ? 'FCFA' : 'CAD'}
            </Text>
            <TextInput
              style={styles.amountInput}
              keyboardType="numeric"
              placeholder={isCameroon ? "Montant en FCFA" : "Montant en CAD"}
              placeholderTextColor="#999"
              value={amount}
              onChangeText={setAmount}
            />
          </View>

          {/* Fees Display */}
          {amount && parseFloat(amount) > 0 && (
            <View style={styles.feesCard}>
              <View style={styles.feesRow}>
                <Text style={styles.feesLabel}>Montant du transfert:</Text>
                <Text style={styles.feesValue}>
                  {isCameroon ? 
                    formatCurrency(parseFloat(amount), 'FCFA') : 
                    formatCurrency(parseFloat(amount), 'CAD')
                  }
                </Text>
              </View>
              
              <View style={styles.feesRow}>
                <Text style={styles.feesLabel}>Frais de transfert:</Text>
                {isCalculatingFees ? (
                  <Loader size="small" color="#0D1C6A" />
                ) : feeError ? (
                  <View style={styles.feesValueContainer}>
                    <Text style={styles.errorText}>
                      {feeError === t('wallet_transfer.amount_too_small_for_fees') 
                        ? t('wallet_transfer.amount_too_small_for_fees')
                        : feeError === t('wallet_transfer.no_fee_tier_found')
                        ? t('wallet_transfer.no_fee_tier_found')
                        : t('wallet_transfer.fee_error')}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.feesValueContainer}>
                    <Text style={[styles.feesValue, styles.feesHighlight]}>
                      {isCameroon ? 
                        formatCurrency(transferFeesXAF, 'FCFA') : 
                        formatCurrency(transferFeesCAD, 'CAD')
                      }
                    </Text>
                    <Text style={styles.feesConverted}>
                      ({isCameroon ? 
                        formatCurrency(transferFeesCAD, 'CAD') : 
                        formatCurrency(transferFeesXAF, 'FCFA')
                      })
                    </Text>
                  </View>
                )}
              </View>
              
              <View style={styles.separator} />
              
              <View style={styles.feesRow}>
                <View style={styles.totalContainer}>
                  <Text style={styles.totalLabel}>Total à débiter:</Text>
                  <Text style={styles.totalValue}>
                    {isCameroon ? 
                      formatCurrency(conversion.totalXAF, 'FCFA') : 
                      formatCurrency(conversion.totalCAD, 'CAD')
                    }
                  </Text>
                  <Text style={styles.convertedTotal}>
                    {isCameroon ? 
                      formatCurrency(conversion.amountCAD, 'CAD') : 
                      formatCurrency(conversion.amountXAF, 'FCFA')
                    }
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Motif de Transfert */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="document-text-outline" size={18} color="#666" /> Motif du transfert
          </Text>
          
          <TextInput
            style={[styles.input, styles.textArea, !description && styles.inputEmpty]}
            placeholder="Raison du transfert (obligatoire)"
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
            maxLength={255}
          />
          
          <Text style={styles.charCount}>
            {description.length}/255 caractères
          </Text>
        </View>    

        {/* Preview Button */}
        <TouchableOpacity
          style={[
            styles.previewButton,
            (isLoading || !walletId || isCalculatingFees || feeError) ? styles.buttonDisabled : null
          ]}
          onPress={handlePreview}
          disabled={isLoading || !walletId || isCalculatingFees || feeError}
        >
          <Text style={styles.previewButtonText}>Aperçu du transfert</Text>
        </TouchableOpacity>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color="#0D1C6A" />
          <Text style={styles.infoText}>
            Les transferts sont traités sous 30 minutes à 24 heures. Vérifiez bien les informations avant validation.
          </Text>
        </View>
      </ScrollView>

      {/* Service Unavailable Modal */}
      <Modal
        visible={showUnavailableModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowUnavailableModal(false)}
      >
        <View style={styles.unavailableModalOverlay}>
          <View style={styles.unavailableModalContainer}>
            <View style={styles.unavailableModalIconContainer}>
              <Ionicons name="warning-outline" size={48} color="#ff6b6b" />
            </View>
            
            <Text style={styles.unavailableModalTitle}>
              Service Temporarily Unavailable
            </Text>
            
            <Text style={styles.unavailableModalMessage}>
              The Cameroun-Canada transfer service is currently unavailable. Please try again later or contact support for assistance.
            </Text>
            
            <View style={styles.unavailableModalButtonContainer}>
              <TouchableOpacity
                style={styles.unavailableModalButton}
                onPress={() => setShowUnavailableModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.unavailableModalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Summary Modal */}
      <Modal
        visible={showSummary}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSummary(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Récapitulatif du transfert</Text>
              <TouchableOpacity 
                onPress={() => setShowSummary(false)}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Summary Card */}
              <View style={styles.summaryCard}>
                <View style={styles.summarySection}>
                  <Text style={styles.summarySectionTitle}>Détails du bénéficiaire</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Nom:</Text>
                    <Text style={styles.summaryValue}>{recipientName}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Matricule:</Text>
                    <Text style={styles.summaryValue}>{walletId}</Text>
                  </View>
                </View>

                <View style={styles.summarySection}>
                  <Text style={styles.summarySectionTitle}>Montants</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Montant envoyé:</Text>
                    <Text style={styles.summaryValue}>
                      {isCameroon ? 
                        formatCurrency(parseFloat(amount), 'FCFA') : 
                        formatCurrency(parseFloat(amount), 'CAD')
                      }
                    </Text>
                  </View>
                  
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Montant reçu:</Text>
                    <Text style={styles.summaryValue}>
                      {isCameroon ? 
                        formatCurrency(conversion.amountCAD, 'CAD') : 
                        formatCurrency(conversion.amountXAF, 'FCFA')
                      }
                    </Text>
                  </View>
                  
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Frais de transfert:</Text>
                    <View style={styles.summaryFeesContainer}>
                      <Text style={[styles.summaryValue, styles.feeText]}>
                        {isCameroon ? 
                          formatCurrency(transferFeesXAF, 'FCFA') : 
                          formatCurrency(transferFeesCAD, 'CAD')
                        }
                      </Text>
                      <Text style={styles.feesConvertedSmall}>
                        ({isCameroon ? 
                          formatCurrency(transferFeesCAD, 'CAD') : 
                          formatCurrency(transferFeesXAF, 'FCFA')
                        })
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.summarySeparator} />
                  
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Total débité:</Text>
                    <Text style={[styles.summaryValue, styles.totalText]}>
                      {isCameroon ? 
                        formatCurrency(conversion.totalXAF, 'FCFA') : 
                        formatCurrency(conversion.totalCAD, 'CAD')
                      }
                    </Text>
                  </View>
                </View>
              </View>

              {/* Important Notice */}
              <View style={styles.noticeBox}>
                <MaterialIcons name="warning" size={20} color="#f39c12" />
                <Text style={styles.noticeText}>
                  Vérifiez toutes les informations avant de confirmer. Le transfert ne pourra pas être annulé après validation.
                </Text>
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowSummary(false)}
              >
                <Text style={styles.cancelButtonText}>Modifier</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleConfirmButtonClick}
                disabled={isTransferring}
              >
                {isTransferring ? (
                  <Loader color="white" size="small" />
                ) : (
                  <Text style={styles.confirmButtonText}>Confirmer le transfert</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* SFE Connect Modal */}
      <Modal
        visible={showSFEConnectModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSFEConnectModal(false)}
      >
        <View style={styles.sfeModalOverlay}>
          <View style={styles.sfeModalContent}>
            <View style={styles.sfeModalHeader}>
              <FontAwesome name="exchange" size={40} color="#0D1C6A" />
              <Text style={styles.sfeModalTitle}>Transfert important détecté</Text>
            </View>
            
            <View style={styles.sfeModalBody}>
              <Text style={styles.sfeModalText}>
                Vous souhaitez envoyer {formatCurrency(parseFloat(amount), 'FCFA')}.
                La limite mensuelle Sendo est de 1 million FCFA.
              </Text>
              
              <Text style={styles.sfeModalText}>
                Utilisez l'application <Text style={styles.sfeHighlight}>SFE Connect</Text> pour envoyer jusqu'à 10 millions FCFA.
              </Text>
              
              <View style={styles.sfeFeatures}>
                <View style={styles.sfeFeature}>
                  <Ionicons name="checkmark-circle" size={20} color="#28a745" />
                  <Text style={styles.sfeFeatureText}>Limite jusqu'à 10 millions FCFA</Text>
                </View>
                <View style={styles.sfeFeature}>
                  <Ionicons name="checkmark-circle" size={20} color="#28a745" />
                  <Text style={styles.sfeFeatureText}>Transferts instantanés</Text>
                </View>
                <View style={styles.sfeFeature}>
                  <Ionicons name="checkmark-circle" size={20} color="#28a745" />
                  <Text style={styles.sfeFeatureText}>Taux compétitifs</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.sfeModalFooter}>
              <TouchableOpacity
                style={[styles.sfeModalButton, styles.sfeCancelButton]}
                onPress={() => setShowSFEConnectModal(false)}
              >
                <Text style={styles.sfeCancelButtonText}>Rester sur Sendo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.sfeModalButton, styles.sfeDownloadButton]}
                onPress={() => openSFEConnect('android')}
              >
                <Ionicons name="logo-google-playstore" size={20} color="white" />
                <Text style={styles.sfeDownloadButtonText}>Google Play</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.sfeModalButton, styles.sfeDownloadButton]}
                onPress={() => openSFEConnect('ios')}
              >
                <Ionicons name="logo-apple" size={20} color="white" />
                <Text style={styles.sfeDownloadButtonText}>App Store</Text>
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
    paddingBottom: 15,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  inputEmpty: {
    borderColor: '#ff6b6b',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  currencyLabel: {
    paddingHorizontal: 15,
    paddingVertical: 15,
    fontSize: 16,
    fontWeight: '600',
    color: '#7ddd7d',
    backgroundColor: '#f8f9fa',
  },
  amountInput: {
    flex: 1,
    padding: 15,
    fontSize: 16,
  },
  feesCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  feesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    alignItems: 'center',
  },
  feesLabel: {
    fontSize: 15,
    color: '#666',
    flex: 1,
  },
  feesValueContainer: {
    alignItems: 'flex-end',
    flex: 1,
  },
  feesValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  feesHighlight: {
    color: '#dc3545',
  },
  feesConverted: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#dee2e6',
    marginVertical: 10,
  },
  totalContainer: {
    alignItems: 'flex-end',
    flex: 1,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 2,
  },
  convertedTotal: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 5,
  },
  recipientInfo: {
    marginTop: 10,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: 10,
    color: '#666',
    fontSize: 14,
  },
  recipientFound: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e7f7e7',
    padding: 10,
    borderRadius: 8,
  },
  recipientName: {
    marginLeft: 10,
    color: '#28a745',
    fontWeight: '500',
    fontSize: 14,
  },
  recipientNotFound: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffe6e6',
    padding: 10,
    borderRadius: 8,
  },
  recipientError: {
    marginLeft: 10,
    color: '#dc3545',
    fontSize: 14,
  },
  errorText: {
    color: '#dc3545',
    fontSize: 14,
  },
  previewButton: {
    backgroundColor: '#7ddd7d',
    padding: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  previewButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#e8f4ff',
    borderRadius: 8,
    padding: 12,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#0D1C6A',
    marginLeft: 10,
    lineHeight: 18,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 20,
  },
  summaryCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  summarySection: {
    marginBottom: 20,
  },
  summarySectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  summaryFeesContainer: {
    alignItems: 'flex-end',
    flex: 1,
  },
  feeText: {
    color: '#dc3545',
  },
  feesConvertedSmall: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
  },
  summarySeparator: {
    height: 1,
    backgroundColor: '#dee2e6',
    marginVertical: 10,
  },
  noticeBox: {
    flexDirection: 'row',
    backgroundColor: '#fff9e6',
    borderRadius: 8,
    padding: 12,
    alignItems: 'flex-start',
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    color: '#856404',
    marginLeft: 10,
    lineHeight: 18,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 6,
  },
  cancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  confirmButton: {
    backgroundColor: '#7ddd7d',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Service Unavailable Modal Styles
  unavailableModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  unavailableModalContainer: {
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
  unavailableModalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  unavailableModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  unavailableModalMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  unavailableModalButtonContainer: {
    width: '100%',
  },
  unavailableModalButton: {
    backgroundColor: '#ff6b6b',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  unavailableModalButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  // SFE Connect Modal Styles
  sfeModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sfeModalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  sfeModalHeader: {
    backgroundColor: '#f5f9ff',
    padding: 30,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e7ff',
  },
  sfeModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0D1C6A',
    marginTop: 15,
    textAlign: 'center',
  },
  sfeModalBody: {
    padding: 25,
  },
  sfeModalText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 15,
    textAlign: 'center',
  },
  sfeHighlight: {
    color: '#0D1C6A',
    fontWeight: 'bold',
  },
  sfeFeatures: {
    marginTop: 20,
  },
  sfeFeature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sfeFeatureText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
  },
  sfeModalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  sfeModalButton: {
    flex: 1,
    minWidth: 120,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  sfeCancelButton: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  sfeDownloadButton: {
    backgroundColor: '#0D1C6A',
  },
  sfeCancelButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  sfeDownloadButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default CamCaSendo;