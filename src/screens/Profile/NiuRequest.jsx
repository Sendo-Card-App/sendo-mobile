import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { CheckBox } from 'react-native-elements';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useGetBalanceQuery } from '../../services/WalletApi/walletApi';
import { useGetUserProfileQuery } from "../../services/Auth/authAPI"; 
import { useNiuResquestMutation, useGetUserRequestsQuery } from "../../services/Kyc/kycApi";
import { useGetConfigQuery } from '../../services/Config/configApi';
import Toast from 'react-native-toast-message';
import TopLogo from '../../images/TopLogo.png';
import Loader from "../../components/Loader";
import PaymentConfirmationModal from '../../components/PaymentConfirmationModal';

const NiuRequest = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const kycStatus = useSelector(state => state.kyc.status);
  const [completedSteps, setCompletedSteps] = useState({
    1: true, // Fees step
    2: true,  // KYC step (already completed)
    3: false, // NIU Number step
    4: false  // Attestation step
  });

  const showToast = (type, title, message) => {
    Toast.show({
      type: type,
      text1: title,
      text2: message,
      visibilityTime: 4000,
      autoHide: true,
      topOffset: 50,
    });
  };

  const { data: userProfile, isLoading: isProfileLoading, refetch } = useGetUserProfileQuery();
  const userId = userProfile?.data.id;
  const [niuRequest, { isLoading: isSubmitting }] = useNiuResquestMutation();

  // Fetch user requests
  const { 
    data: userRequests,
    isLoading: isRequestsLoading,
    error: requestsError
  } = useGetUserRequestsQuery(userId, { skip: !userId });

  const { 
    data: configData, 
    isLoading: isConfigLoading,
    error: configError
  } = useGetConfigQuery();
  const niuConfig = configData?.data?.find(item => item.id === 12);
  const feeAmount = niuConfig?.value || 3000;
     useFocusEffect(
      useCallback(() => {
        refetch(); // force une requête au backend
      }, [])
    );
  useEffect(() => {
    if (configError) {
      console.error('Config fetch error:', configError);
      showToast('error', t('niu.errors.title'), t('niu.errors.configFetchFailed'));
    }
    if (requestsError) {
      console.error('Requests fetch error:', requestsError);
      showToast('error', t('niu.errors.title'), t('niu.errors.requestsFetchFailed'));
    }
  }, [configError, requestsError]);

  // Check for existing NIU requests
  useEffect(() => {
  if (userRequests?.data?.items) {
    const niuRequests = userRequests.data.items.filter(
      request => request.type === 'NIU_REQUEST'
    );
    
    // Check if any request is approved
    const approvedRequest = niuRequests.find(
      request => request.status === 'APPROVED'
    );
    
    // Check if any request is pending
    const pendingRequest = niuRequests.find(
      request => request.status === 'UNPROCESSED' || request.status === 'PENDING'
    );
    
    // Check if any request was rejected
    const rejectedRequest = niuRequests.find(
      request => request.status === 'REJECTED'
    );

    if (approvedRequest) {
      // User already has an approved NIU request
      setCompletedSteps(prev => ({
        ...prev,
        1: true, // Fees step
        3: true, // NIU Number step
        4: true  // Attestation step
      }));
    } else if (pendingRequest) {
      // User has a pending request
      setCompletedSteps(prev => ({
        ...prev,
        1: true, // Fees step
        3: false, // NIU Number step
        4: false  // Attestation step
      }));
    } else if (rejectedRequest) {
      // User had a rejected request
      setCompletedSteps(prev => ({
        ...prev,
        1: false, // Fees step needs to be paid again
        3: false, // NIU Number step
        4: false  // Attestation step
      }));
    } else {
      // No existing requests
      setCompletedSteps(prev => ({
        ...prev,
        1: false,
        3: false,
        4: false
      }));
    }
  }
}, [userRequests]);

  // Wallet balance
  const { 
    data: balanceData, 
    error: balanceError,
    isLoading: isBalanceLoading
  } = useGetBalanceQuery(userId, { skip: !userId });
  const balance = balanceData?.balance || 0;
  
  // State
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [paymentAccepted, setPaymentAccepted] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    if (balanceError) {
      showToast('error', t('niu.errors.title'), t('niu.errors.balanceFetchFailed'));
    }
  }, [balanceError]);

 if (isConfigLoading || isProfileLoading || isBalanceLoading || isRequestsLoading) {
  return (
    <View className="flex-1 justify-center items-center">
      <Loader size="large" />
    </View>
  );
}

  // Process steps
  const steps = [
    { id: 1, title: t('niu.steps.fees'), completed: completedSteps[1] },
    { id: 2, title: t('niu.steps.kyc'), completed: completedSteps[2] },
    { id: 3, title: t('niu.steps.niuNumber'), completed: completedSteps[3] },
    { id: 4, title: t('niu.steps.attestation'), completed: completedSteps[4] },
  ];

  const handlePaymentConfirmation = async () => {
    setShowPaymentModal(false);
    
    try {
      const requestData = {
        type: "NIU_REQUEST",
        description: "National Identification Number request",
        userId: userId,
        status: "pending",
      };

      const response = await niuRequest(requestData).unwrap();
      
      if (response.status === 201 || response.success) {
        setCompletedSteps(prev => ({...prev, 1: true}));
        showToast('success', t('niu.success.title'), t('niu.success.message'));
        setTimeout(() => navigation.navigate('NiuRequest'), 500);
      } else {
        showToast('error', t('niu.errors.title'), 
          response.message || t('niu.errors.unexpectedSuccess'));
      }
    } catch (error) {
      console.error('NIU request error:', error);
      
      if (error.status === 401) {
        showToast('error', t('niu.errors.title'), t('niu.errors.unauthorized'));
      } else if (error.status === 400) {
        showToast('error', t('niu.errors.title'), 
          error.data?.message || t('niu.errors.badRequest'));
      } else {
        showToast('error', t('niu.errors.title'), 
          error.data?.message || t('niu.errors.technical'));
      }
    }
  };

  const handlePayPress = () => {
    if (!termsAccepted || !paymentAccepted) {
      showToast('error', t('niu.errors.title'), t('niu.errors.termsNotAccepted'));
      return;
    }
    
    if (balanceData?.data?.balance < feeAmount) {
      showToast('error', t('niu.errors.title'), t('niu.errors.insufficientBalance'));
      return;
    }
    
    setShowPaymentModal(true);
  };

  // Get status message based on existing requests
  const getStatusMessage = () => {
    if (!userRequests?.data?.items) return null;
    
    const niuRequests = userRequests.data.items.filter(
      request => request.type === 'NIU_REQUEST'
    );
    
    const approvedRequest = niuRequests.find(
      request => request.status === 'APPROVED'
    );
    
    const pendingRequest = niuRequests.find(
      request => request.status === 'UNPROCESSED' || request.status === 'PENDING'
    );
    
    const rejectedRequest = niuRequests.find(
      request => request.status === 'REJECTED'
    );

    if (approvedRequest) {
      return (
        <Text className="text-green-600 mt-2 font-bold text-lg">
          {t('niu.request.statusApproved')}
        </Text>
      );
    }
    
    if (pendingRequest) {
      return (
        <Text className="text-green-600 mt-2 font-bold text-lg">
          {t('niu.request.statusPending')}
        </Text>
      );
    }
    
    if (rejectedRequest) {
      return (
        <Text className="text-red-600 mt-2 font-bold text-lg">
          {t('niu.request.statusRejected')}
          {rejectedRequest.reason && `: ${rejectedRequest.reason}`}
        </Text>
      );
    }
    
    return null;
  };

  return (
    <View className="bg-[#181e25] flex-1 pt-0 relative">
      {/* Header */}
      <View className="border-b border-dashed border-white flex-row justify-between py-4 mt-10 items-center mx-5 pt-5">
        <View className="absolute -top-12 left-0 right-0 items-center justify-center">
          <Image source={TopLogo} className="h-36 w-40" resizeMode="contain" />
        </View>
      </View>

      {/* Title */}
      <View className="border border-dashed border-gray-300 my-1" />
      <Text className="text-center text-white text-2xl my-3">
        {t('niu.request.title')}
      </Text>

      {/* Main Content */}
      <ScrollView className="flex-1 pb-3 bg-white rounded-t-3xl">
        {/* Process Steps */}
        <View className="p-5">
          <Text className="font-bold text-lg mb-4">{t('niu.request.processTitle')}</Text>
          
          {steps.map((step) => (
            <View key={step.id} className="flex-row items-center mb-3">
              <MaterialCommunityIcons 
                name={step.completed ? "check-circle" : "progress-clock"} 
                size={24} 
                color={step.completed ? "green" : "gray"} 
                style={{ marginRight: 12 }}
              />
              <Text className={`text-base ${step.completed ? 'font-bold text-black' : 'text-gray-500'}`}>
                {step.title}
              </Text>
            </View>
          ))}
        </View>

        {/* Fees Information */}
        <View className="bg-gray-100 p-5 mx-5 rounded-lg">
          <Text className="font-bold text-lg mb-2">{t('niu.request.feesTitle')}</Text>
          <Text className="text-gray-700 mb-1">
            {t('niu.request.feesAmount')}: <Text className="font-bold">{feeAmount.toLocaleString()} FCFA</Text>
          </Text>
          {getStatusMessage()}
        </View>

        {/* Terms Checkboxes */}
        <View className="p-5">
          <CheckBox
            title={t('niu.request.termsAccept')}
            checked={termsAccepted}
            onPress={() => setTermsAccepted(!termsAccepted)}
            containerStyle={{ backgroundColor: 'transparent', borderWidth: 0 }}
            textStyle={{ color: '#333', fontWeight: 'normal' }}
            checkedColor="#7ddd7d"
          />
          
          <CheckBox
            title={`${t('niu.request.paymentAccept')} ${feeAmount.toLocaleString()} FCFA`}
            checked={paymentAccepted}
            onPress={() => setPaymentAccepted(!paymentAccepted)}
            containerStyle={{ backgroundColor: 'transparent', borderWidth: 0 }}
            textStyle={{ color: '#333', fontWeight: 'normal' }}
            checkedColor="#7ddd7d"
          />
        </View>

        {/* Pay Button */}
        <TouchableOpacity
          className={`mx-5 mb-8 py-3 rounded-full ${termsAccepted && paymentAccepted ? 'bg-green-500' : 'bg-gray-300'}`}
          onPress={handlePayPress}
          disabled={!termsAccepted || !paymentAccepted || isSubmitting || completedSteps[3]}
        >
          {isSubmitting ? (
            <View className="flex-row justify-center items-center">
              <Loader color="white" size="small" />
              <Text className="text-xl text-center font-bold text-white ml-2">
                {t('niu.request.processing')}
              </Text>
            </View>
          ) : (
            <Text className={`text-xl text-center font-bold ${termsAccepted && paymentAccepted ? 'text-white' : 'text-gray-500'}`}>
              {completedSteps[3] ? t('niu.request.alreadyApproved') : t('niu.request.payButton')}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Payment Confirmation Modal */}
      <PaymentConfirmationModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onConfirm={handlePaymentConfirmation}
        amount={feeAmount}
        title={t('niu.paymentModal.title')}
        message={t('niu.paymentModal.message', { amount: feeAmount.toLocaleString() })}
        confirmText={t('niu.paymentModal.confirm')}
        cancelText={t('niu.paymentModal.cancel')}
      />

      {/* Toast Component */}
      <Toast />
    </View>
  );
};

export default NiuRequest;