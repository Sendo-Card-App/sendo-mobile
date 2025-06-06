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
    1: true,
    2: true,
    3: false,
    4: false,
  });

  const showToast = (type, title, message) => {
    Toast.show({
      type,
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

  const {
    data: userRequests,
    isLoading: isRequestsLoading,
    error: requestsError,
  } = useGetUserRequestsQuery(userId, { skip: !userId });

  const {
    data: configData,
    isLoading: isConfigLoading,
    error: configError,
  } = useGetConfigQuery();

  const niuConfig = configData?.data?.find(item => item.id === 12);
  const feeAmount = niuConfig?.value || 3000;

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [])
  );

  useEffect(() => {
    if (configError) {
      showToast('error', t('niu.errors.title'), t('niu.errors.configFetchFailed'));
    }
    if (requestsError) {
      showToast('error', t('niu.errors.title'), t('niu.errors.requestsFetchFailed'));
    }
  }, [configError, requestsError]);

  useEffect(() => {
    if (userRequests?.data?.items) {
      const niuRequests = userRequests.data.items.filter(
        request => request.type === 'NIU_REQUEST'
      );

      const approved = niuRequests.find(r => r.status === 'APPROVED');
      const pending = niuRequests.find(r => r.status === 'UNPROCESSED' || r.status === 'PENDING');
      const rejected = niuRequests.find(r => r.status === 'REJECTED');

      if (approved) {
        setCompletedSteps(prev => ({ ...prev, 1: true, 3: true, 4: true }));
      } else if (pending) {
        setCompletedSteps(prev => ({ ...prev, 1: true, 3: false, 4: false }));
      } else if (rejected) {
        setCompletedSteps(prev => ({ ...prev, 1: false, 3: false, 4: false }));
      } else {
        setCompletedSteps(prev => ({ ...prev, 1: false, 3: false, 4: false }));
      }
    }
  }, [userRequests]);

  const {
    data: balanceData,
    error: balanceError,
    isLoading: isBalanceLoading,
  } = useGetBalanceQuery(userId, { skip: !userId });

  const balance = balanceData?.data?.balance || 0;

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [paymentAccepted, setPaymentAccepted] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    if (balanceError) {
      showToast('error', t('niu.errors.title'), t('niu.errors.balanceFetchFailed'));
    }
  }, [balanceError]);

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
        setCompletedSteps(prev => ({ ...prev, 1: true }));
        showToast('success', t('niu.success.title'), t('niu.success.message'));
        setTimeout(() => navigation.navigate('NiuRequest'), 500);
      } else {
        showToast('error', t('niu.errors.title'), response.message || t('niu.errors.unexpectedSuccess'));
      }
    } catch (error) {
      const msg = error.data?.message || t('niu.errors.technical');
      showToast('error', t('niu.errors.title'), msg);
    }
  };

  const handlePayPress = () => {
    if (!termsAccepted || !paymentAccepted) {
      showToast('error', t('niu.errors.title'), t('niu.errors.termsNotAccepted'));
      return;
    }

    if (balance < feeAmount) {
      showToast('error', t('niu.errors.title'), t('niu.errors.insufficientBalance'));
      return;
    }

    setShowPaymentModal(true);
  };

  const getStatusMessage = () => {
    if (!userRequests?.data?.items) return null;

    const niuRequests = userRequests.data.items.filter(req => req.type === 'NIU_REQUEST');
    const approved = niuRequests.find(req => req.status === 'APPROVED');
    const pending = niuRequests.find(req => req.status === 'UNPROCESSED' || req.status === 'PENDING');
    const rejected = niuRequests.find(req => req.status === 'REJECTED');

    if (approved) {
      return <Text className="text-green-600 mt-2 font-bold text-lg">{t('niu.request.statusApproved')}</Text>;
    }
    if (pending) {
      return <Text className="text-green-600 mt-2 font-bold text-lg">{t('niu.request.statusPending')}</Text>;
    }
    if (rejected) {
      return (
        <Text className="text-red-600 mt-2 font-bold text-lg">
          {t('niu.request.statusRejected')}
          {rejected.reason && `: ${rejected.reason}`}
        </Text>
      );
    }
    return null;
  };

  if (isConfigLoading || isProfileLoading || isBalanceLoading || isRequestsLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Loader size="large" />
      </View>
    );
  }

  return (
    <View className="bg-[#181e25] flex-1 pt-0 relative">
      {/* Header */}
      <View className="border-b border-dashed border-white flex-row justify-between py-4 mt-10 items-center mx-5 pt-5">
        <View className="absolute -top-12 left-0 right-0 items-center justify-center">
          <Image source={TopLogo} className="h-36 w-40" resizeMode="contain" />
        </View>
      </View>

      <View className="border border-dashed border-gray-300 my-1" />
      <Text className="text-center text-white text-2xl my-3">{t('niu.request.title')}</Text>

      <ScrollView className="flex-1 pb-3 bg-white rounded-t-3xl">
        <View className="p-5">
          <Text className="font-bold text-lg mb-4">{t('niu.request.processTitle')}</Text>
          {steps.map(step => (
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

        {/* Fees info */}
        <View className="bg-gray-100 p-5 mx-5 rounded-lg">
          <Text className="font-bold text-lg mb-2">{t('niu.request.feesTitle')}</Text>
          <Text className="text-gray-700 mb-1">
            {t('niu.request.feesAmount')}: <Text className="font-bold">{feeAmount.toLocaleString()} FCFA</Text>
          </Text>
          {getStatusMessage()}
        </View>

        {/* Terms */}
        <View className="p-5">
          <CheckBox
            title={t('niu.request.termsAccept')}
            checked={termsAccepted}
            onPress={() => setTermsAccepted(!termsAccepted)}
            containerStyle={{ backgroundColor: 'transparent', borderWidth: 0 }}
            textStyle={{ color: 'black' }}
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
        {!completedSteps[1] && (
          <TouchableOpacity
            onPress={handlePayPress}
            className="bg-blue-600 mx-5 mb-5 rounded-lg py-4 items-center"
            disabled={isSubmitting}
          >
            <Text className="text-white text-lg font-semibold">{t('niu.request.payNow')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Modal */}
      <PaymentConfirmationModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onConfirm={handlePaymentConfirmation}
        amount={feeAmount}
        title={t('niu.modal.title')}
        description={t('niu.modal.description')}
        confirmLabel={t('niu.modal.confirm')}
      />
    </View>
  );
};

export default NiuRequest;
