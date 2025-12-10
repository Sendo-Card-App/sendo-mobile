import React, { useState,useCallback  } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  Alert,
  Modal,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Loader from "../../components/Loader";
import { useGetConfigQuery } from '../../services/Config/configApi';
import {
  sendPushNotification,
  sendPushTokenToBackend,
  registerForPushNotificationsAsync,
  getStoredPushToken,
} from "../../services/notificationService";
import { useGetBalanceQuery, useGetTransactionHistoryQuery } from "../../services/WalletApi/walletApi";
import { useGetUserProfileQuery } from "../../services/Auth/authAPI";
import {
  useContributeMutation,
  useGetCotisationsQuery,
  useGetToursDistributionQuery,
  useGetMemberPenaltiesQuery,
  usePayPenaltyMutation,
  useGetValidatedCotisationsQuery,
  useRelanceCotisationMutation,
} from "../../services/Tontine/tontineApi";
import Toast from 'react-native-toast-message';
const TopLogo = require("../../images/TopLogo.png");

const MemberContribution = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { tontineId, tontine } = route.params;
  const [activeTab, setActiveTab] = useState("Cotisations");

  const [payPenalty, { Loading, isSuccess, isError }] = usePayPenaltyMutation();
  const [contribute, { isLoading }] = useContributeMutation();

  const [selectedCotisationId, setSelectedCotisationId] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loadingPayment, setLoadingPayment] = useState(false);


  const { data: userProfile } = useGetUserProfileQuery();
  const userId = userProfile?.data.user?.id;
 
  const { data: balanceData } = useGetBalanceQuery(userId, {
    skip: !userId,
      pollingInterval: 1000, // Refetch every 30 seconds
  });
  const balance = balanceData?.data.balance || 0;
  const { data: history, refetch } = useGetTransactionHistoryQuery({ skip: !userId,
      pollingInterval: 1000, // Refetch every 30 seconds
   });

  const { data: tours } = useGetToursDistributionQuery({ tontineId });
  const membre = tontine?.membres?.find((m) => m?.user?.id === userId);
  const membreId = membre?.id;

   const { data: validatedCotisations, refetch: refetchCotisations } = useGetValidatedCotisationsQuery({ tontineId, membreId,
      pollingInterval: 1000, // Refetch every 30 seconds
    });
    //console.log(validatedCotisations)
   const {
  data: penaltiesResponse,
  refetch: refetchPenalties,
  isLoading: loadingPenalties,
} = useGetMemberPenaltiesQuery({ tontineId, membreId,
    pollingInterval: 1000, // Refetch every 30 seconds
 });
   //console.log(penaltiesResponse)
     const {
         data: configData,
         isLoading: isConfigLoading,
         error: configError
       } = useGetConfigQuery();
     
       const getConfigValue = (name) => {
         const configItem = configData?.data?.find(item => item.name === name);
         return configItem ? configItem.value : null;
       };
        
       const TONTINE_FEES_TRANSACTION = parseFloat(getConfigValue('TONTINE_FEES_TRANSACTION'));
      // console.log('Transaction fee percentage:', TONTINE_FEES_TRANSACTION);
       const montant = tontine?.montant || 0;
 
        const calculateTotalAmount = () => {
          const Montant = Number(montant) || 0;
          const feesAmount = (Montant * TONTINE_FEES_TRANSACTION) / 100;
          const total = Montant + feesAmount;
          
          // console.log('Amount breakdown:', {
          //   baseAmount: Montant,
          //   feePercentage: TONTINE_FEES_TRANSACTION,
          //   feeAmount: feesAmount,
          //   totalAmount: total
          // });
          
          return total;
        };

        const totalAmount = calculateTotalAmount();
   
     useFocusEffect(
      useCallback(() => {
        if (userId) {
          refetch(); // transaction history
          refetchCotisations();
          refetchPenalties();
        }
      }, [userId])
    );

     
  const memberCotisations = validatedCotisations?.data?.filter(
    cotisation => cotisation.membre?.id === membreId
  ) || [];
   //console.log("Full response:", JSON.stringify(memberCotisations, null, 2));

  const { data: cotisations } = useGetCotisationsQuery({
    tontineId,
    memberId: membreId,
  });
  
  const cotisationId = validatedCotisations?.data?.[0]?.id;

  const handlePay = async (cotisationIdToPay) => {
    if (balance < montant) {
      Toast.show({
        type: 'error',
        text1: 'Solde insuffisant',
        text2: 'Veuillez recharger votre solde.',
        position: 'top',
      });
      return;
    }

    const payload = { tontineId, membreId, cotisationId: cotisationIdToPay };
    console.log("Paiement payload:", payload);

    try {
      setLoadingPayment(true);
      await contribute(payload).unwrap();

      const notificationContent = {
        title: "Cotisation Réussie",
        body: `Une cotisation de ${montant} FCFA a été effectuée.`,
        type: "TONTINE_CONTRIBUTION_SUCCESS",
      };

      let pushToken = await getStoredPushToken();
      if (!pushToken) {
        pushToken = await registerForPushNotificationsAsync();
      }

      if (pushToken) {
        await sendPushTokenToBackend(
          pushToken,
          notificationContent.title,
          notificationContent.body,
          notificationContent.type,
          {
            amount: montant,
            tontineId,
            membreId,
            cotisationId: cotisationIdToPay,
            timestamp: new Date().toISOString(),
          }
        );
      } else {
        await sendPushNotification(notificationContent.title, notificationContent.body, {
          data: {
            type: notificationContent.type,
            amount: montant,
            tontineId,
            membreId,
          },
        });
      }

      Toast.show({
        type: 'success',
        text1: 'Cotisation réussie',
        text2: `Une cotisation de ${montant} FCFA a été effectuée.`,
        position: 'top',
      });

      navigation.navigate("SuccessSharing", {
        transactionDetails: "Votre cotisation a été effectuée avec succès",
      });
    } catch (error) {
      const mainMessage = error?.data?.message || "Une erreur est survenue.";
      const detailMessage =
        error?.data?.data?.errors?.[0] || error?.error || "Veuillez réessayer.";

      Toast.show({
        type: "error",
        text1: mainMessage,
        text2: detailMessage,
        position: "top",
      });
    } finally {
      setLoadingPayment(false);
    }
  };


  const handlePayPenalty = async (penalty) => {
    console.log('penalty:', penalty);

    if (!penalty?.id) {
      console.log(" Aucune pénalité sélectionnée !");
      return;
    }

    if (penalty.statut === 'PAID') {
      console.log('Pénalité déjà payée, action ignorée.');
      return;
    }

    if (balance < penalty.montant) {
      Toast.show({
        type: 'error',
        text1: 'Solde insuffisant',
        text2: 'Veuillez recharger votre solde.',
        position: 'top',
      });
      return; 
    }

    try {
      const response = await payPenalty({ penaliteId: penalty.id }).unwrap();
      Toast.show({
        type: 'success',
        text1: 'Succès',
        text2: 'La pénalité a été payée avec succès.',
      });
      refetchPenalties();
    } catch (error) {

      const mainMessage = error?.data?.message || "Une erreur est survenue.";
      const detailMessage =
        error?.data?.data?.errors?.[0] || error?.error || "Veuillez réessayer.";

      Toast.show({
        type: "error",
        text1: mainMessage,
        text2: detailMessage,
        position: "top",
      });
    }

  };

  const adminMember = tontine?.membres?.find((m) => m.role === "ADMIN");
  const adminName = adminMember
    ? `${adminMember.user.firstname} ${adminMember.user.lastname}`
    : t('memberContribution.unknownAdmin');

  const formatFrequence = (f) => {
    switch (f) {
      case "DAILY":
        return t('memberContribution.daily');
      case "WEEKLY":
        return t('memberContribution.weekly');
      case "MONTHLY":
        return t('memberContribution.monthly');
      default:
        return f;
    }
  };

  const formatDate = (d) => {
    const date = new Date(d);
    return date.toLocaleDateString("fr-FR");
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="light-content" />
      <View className="bg-[#0E1111] p-4 rounded-b-3xl relative">
        <View className="flex-row justify-between items-center mb-4 mt-8 px-2">
          <TouchableOpacity onPress={() => navigation.goBack()}>
             <AntDesign name="left" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <Ionicons name="menu-outline" size={26} color="#fff" />
          </TouchableOpacity>
        </View>
        <View
          style={{
            position: "absolute",
            top: -48,
            left: 0,
            right: 0,
            alignItems: "center",
          }}
        >
          <Image source={TopLogo} style={{ height: 130, width: 160 }} resizeMode="contain" />
        </View>
        <View className="border border-dashed border-gray-500 mb-1 mx-4" />
      </View>

      <ScrollView className="pt-5 px-4 bg-white">
        <View className="bg-[#F3F9FF] rounded-xl p-4 border border-gray-200 mb-4">
          <Text className="text-[#1dd874] text-lg font-bold mb-2">
            {tontine?.nom || t('memberContribution.title')}
          </Text>
          <View className="space-y-1">
            <Info label={t('memberContribution.members')} value={tontine?.nombreMembres} />
            <Info label={t('memberContribution.admin')} value={adminName} />
            <Info label={t('memberContribution.frequency')} value={formatFrequence(tontine?.frequence)} />
            <Info label={t('memberContribution.contributionAmount')} value={`${montant.toLocaleString()} xaf`} />
          </View>
        </View>

        <View className="bg-[#F0FFF5] rounded-xl p-4 border border-gray-200 mb-4">
          <Text className="text-green-700 font-semibold text-base mb-3">{t('memberContribution.myContributions')}</Text>
          <Info label={t('memberContribution.currentPeriod')} value={`${montant.toLocaleString()} xaf`} />
        </View>   
         {showPaymentModal && selectedCotisationId && (
            <Modal
              transparent
              animationType="fade"
              visible={showPaymentModal}
              onRequestClose={() => {
                setShowPaymentModal(false);
                setSelectedCotisationId(null);
              }}
            >
              <View className="flex-1 justify-center items-center bg-black/60 px-6">
                <View className="bg-white rounded-2xl p-6 w-full">
                  <Text className="text-black text-large font-bold mb-4 text-center">
                    {t("cotisations.confirmPayment")}
                  </Text>

                  <View className="mb-4">
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-gray-700">{t('cotisations.baseAmount')}:</Text>
                      <Text className="text-gray-700">{montant.toLocaleString()} xaf</Text>
                    </View>
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-gray-700">
                        {t('cotisations.fees')} ({TONTINE_FEES_TRANSACTION}%):
                      </Text>
                      <Text className="text-gray-700">
                        {((montant * TONTINE_FEES_TRANSACTION) / 100).toLocaleString()} xaf
                      </Text>
                    </View>
                    <View className="border-t border-gray-300 my-2" />
                    <View className="flex-row justify-between">
                      <Text className="text-gray-800 font-semibold">{t('cotisations.total1')}:</Text>
                      <Text className="text-gray-800 font-semibold">
                        {totalAmount.toLocaleString()} xaf
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row justify-between mt-4 space-x-2">
                    <TouchableOpacity
                      onPress={() => {
                        setShowPaymentModal(false);
                        setSelectedCotisationId(null);
                      }}
                      className="flex-1 bg-gray-200 px-4 py-3 rounded-lg items-center"
                    >
                      <Text className="text-gray-800 font-medium">
                        {t("common.cancel")}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={async () => {
                        setShowPaymentModal(false);
                        await handlePay(selectedCotisationId);
                        setSelectedCotisationId(null);
                      }}
                      disabled={loadingPayment}
                      className="flex-1 bg-green-500 px-4 py-3 rounded-lg items-center"
                    >
                      {loadingPayment ? (
                        <Loader size="small" color="#fff" />
                      ) : (
                        <Text className="text-white font-bold">
                          {t("cotisations.confirm")}
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Modal>
          )}

        <View className="flex-row justify-around mb-3">
          {[
            t('memberContribution.tabs.contributions'),
            t('memberContribution.tabs.penalties'),
            t('memberContribution.tabs.history')
          ].map((tab) => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)}>
              <Text
                className={`text-base font-semibold ${
                  activeTab === tab ? "text-green-600" : "text-gray-500"
                }`}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === t('memberContribution.tabs.contributions') && (
          <View className="space-y-2 mb-6">
            {memberCotisations.length > 0 ? (
              memberCotisations.map((item, idx) => (
                <View key={idx} className="flex-row justify-between px-3 py-3 mt-3 border rounded-md">
                  <View className="flex-1">
                    <Text className="text-gray-700">
                      {item.membre?.user?.firstname} {item.membre?.user?.lastname}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {item.createdAt ? formatDate(item.createdAt) : 'Date inconnue'}
                    </Text>
                  </View>

                  <View className="flex-row items-center px-7">
                    <View className="items-end justify-center">
                      {item.statutPaiement === 'VALIDATED' ? (
                        <>
                          <Text className="text-green-600 font-semibold">
                            {item.montant.toLocaleString()} xaf
                          </Text>
                          <Text className="text-xs text-gray-500">{t('memberContribution.paid')}</Text>
                        </>
                      ) : (
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedCotisationId(item.id);
                            setShowPaymentModal(true);
                          }}
                          className="bg-green-500 px-4 py-2 rounded"
                        >
                          <Text className="text-white text-sm">{t('memberContribution.pay')}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <Text className="text-gray-500 text-center py-4">
                {t('memberContribution.noContributions')}
              </Text>
            )}
          </View>
        )}


        {activeTab === t('memberContribution.tabs.penalties') && (
          <View className="space-y-2 mb-6">
            {loadingPenalties ? (
              <Text>{t('memberContribution.loading')}</Text>
            ) : penaltiesResponse?.data?.length > 0 ? (
              penaltiesResponse.data.map((penalty, index) => (
                <View
                  key={index}
                  className="flex-row justify-between px-3 py-2 border rounded-md items-center"
                >
                  <View className="flex-1">
                    <Text className="text-red-500">{penalty?.type || t('memberContribution.penaltyType')}</Text>
                    <Text className="text-xs text-gray-500 mt-2">
                      {penalty?.createdAt
                        ? new Date(penalty.createdAt).toLocaleDateString()
                        : ''}
                    </Text>
                  </View>

                  <View className="mx-10">
                    <Text className="text-gray-700 font-bold">
                      {(penalty?.montant ?? 0).toLocaleString()} XAF
                    </Text>
                  </View>

                  <View className="items-end">
                   <TouchableOpacity
                      className="bg-green-500 px-5 py-2 rounded flex-row items-center justify-center"
                      onPress={() => handlePayPenalty(penalty)} 
                      disabled={isLoading || penalty?.statut === 'PAID'}
                    >
                      {isLoading ? (
                        <Loader color="#fff" size="small" />
                      ) : (
                        <Text className="text-white text-xs">{t('memberContribution.payPenalty')}</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <Text>{t('memberContribution.noPenalties')}</Text>
            )}
          </View>
        )}

        {activeTab === t('memberContribution.tabs.history') && (
          <View className="space-y-2 mt-3 mb-6">
            {memberCotisations.map((c, i) => (
              <View key={i} className="flex-row justify-between px-3 py-3 mt-3 border rounded-md">
                <Text className="text-gray-700">{formatDate(c.createdAt)}</Text>
                <Text className="text-green-600 font-semibold">
                  {c.montant.toLocaleString()} xaf
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const Info = ({ label, value }) => (
  <View className="flex-row justify-between">
    <Text className="text-sm text-gray-700">{label}:</Text>
    <Text className="text-sm font-semibold text-gray-900">{value}</Text>
  </View>
);

export default MemberContribution;