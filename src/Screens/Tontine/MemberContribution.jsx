import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import Loader from "../../components/Loader";
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
const TopLogo = require("../../Images/TopLogo.png");

const MemberContribution = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { tontineId, tontine } = route.params;

  const [activeTab, setActiveTab] = useState("Cotisations");
  const [payPenalty, { Loading, isSuccess, isError }] = usePayPenaltyMutation();
  const [contribute, { isLoading }] = useContributeMutation();
  const { data: userProfile } = useGetUserProfileQuery();
  const userId = userProfile?.data.id;

  const { data: balanceData } = useGetBalanceQuery(userId, {
    skip: !userId,
  });
  const balance = balanceData?.data.balance || 0;
  const { data: history, refetch } = useGetTransactionHistoryQuery({ skip: !userId });

  const { data: tours } = useGetToursDistributionQuery({ tontineId });
  const membre = tontine?.membres?.find((m) => m?.user?.id === userId);
  const membreId = membre?.id;
  
  const {
    data: penaltiesResponse = {},
    isLoading: loadingPenalties,
  } = useGetMemberPenaltiesQuery({ tontineId, membreId });
  const penaliteId = penaltiesResponse?.data?.[0]?.id;

  const {
    data: allCotisations,
    error: cotisationError,
  } = useGetValidatedCotisationsQuery({
    tontineId,
  });
  
  const memberCotisations = allCotisations?.data?.filter(
    cotisation => cotisation.membre?.id === membreId
  ) || [];
  
  const montant = tontine?.montant || 0;

  const { data: cotisations } = useGetCotisationsQuery({
    tontineId,
    memberId: membreId,
  });
  const cotisationId = cotisations?.data?.[0]?.id;

  const handlePay = async () => {
    if (balance < montant) {
      Alert.alert("Solde insuffisant", "Veuillez recharger votre solde.");
      return;
    }

    const payload = { tontineId, membreId, cotisationId, montant };

    try {
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

      navigation.navigate("SuccessSharing", {
        transactionDetails: "Votre cotisation a été effectuée avec succès",
      });
    } catch (error) {
      console.error("Erreur cotisation:", JSON.stringify(error, null, 2));
      Alert.alert("Échec", "Échec du paiement. Veuillez réessayer.");
    }
  };

  const handlePayPenalty = async () => {
    try {
      const response = await payPenalty({ penaliteId }).unwrap();
      console.log('Paiement réussi', response);
      Toast.show({
        type: 'success',
        text1: 'Succès',
        text2: 'La pénalité a été payée avec succès.',
      });
    } catch (error) {
      console.error('Erreur lors du paiement', error);
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error?.data?.message || 'Une erreur est survenue pendant le paiement.',
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
            <Ionicons name="arrow-back" size={24} color="#fff" />
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

        <TouchableOpacity
          disabled={isLoading}
          onPress={handlePay}
          className="bg-[#4ADE80] py-3 rounded-full flex-row justify-center items-center mb-4"
        >
          {isLoading ? (
            <>
              <Loader size="small" color="#fff" />
              <Text className="text-white font-semibold text-base ml-2">{t('memberContribution.paymentProcessing')}</Text>
            </>
          ) : (
            <>
              <Text className="text-white font-semibold text-base mr-2">{t('memberContribution.pay')}</Text>
              <Ionicons name="card-outline" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>

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
                    <Text className={`font-semibold ${
                      item.statutPaiement === 'VALIDATED' ? 'text-green-600' : 'text-orange-500'
                    }`}>
                      {item.montant.toLocaleString()} xaf
                    </Text>
                    <Text className="text-xs text-gray-500 ml-4">
                      {item.statutPaiement === 'VALIDATED' ? t('memberContribution.paid') : t('memberContribution.pending')}
                    </Text>
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
                      onPress={handlePayPenalty}
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
          <View className="space-y-2 mb-6">
            {memberCotisations.map((c, i) => (
              <View key={i} className="flex-row justify-between px-3 py-2 border rounded-md">
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