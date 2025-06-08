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
import Loader from "../../components/Loader";
import {
  sendPushNotification,
  sendPushTokenToBackend,
  registerForPushNotificationsAsync,
  getStoredPushToken,
} from "../../services/notificationService";
import { useGetBalanceQuery } from "../../services/WalletApi/walletApi";
import { useGetUserProfileQuery } from "../../services/Auth/authAPI";
import {
  useContributeMutation,
  useGetCotisationsQuery,
  useGetToursDistributionQuery,
  useGetMemberPenaltiesQuery,
  usePayPenaltyMutation,
} from "../../services/Tontine/tontineApi";
import Toast from 'react-native-toast-message';
const TopLogo = require("../../images/TopLogo.png");

const MemberContribution = () => {
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

  const { data: tours } = useGetToursDistributionQuery({ tontineId });

  const membre = tontine?.membres?.find((m) => m?.user?.id === userId);
  const membreId = membre?.id;

  const {
    data: penaltiesResponse = {},
    isLoading: loadingPenalties,
  } = useGetMemberPenaltiesQuery({ tontineId, membreId });
    const penaliteId = penaltiesResponse?.data?.[0]?.id;
   


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
    : "Admin inconnu";

  const formatFrequence = (f) => {
    switch (f) {
      case "DAILY":
        return "Journalier";
      case "WEEKLY":
        return "Hebdomadaire";
      case "MONTHLY":
        return "Mensuel";
      default:
        return f;
    }
  };

  const formatDate = (d) => {
    const date = new Date(d);
    return date.toLocaleDateString("fr-FR");
  };

  const mockContributions = [{ montant: 5000, date: "2025-06-02" }];

  const expectedDates = (() => {
    const now = new Date();
    const dates = [];
    if (tontine.frequence === "DAILY") {
      for (let i = 0; i < 7; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split("T")[0]);
      }
    } else if (tontine.frequence === "WEEKLY") {
      const d = new Date(now);
      d.setDate(d.getDate() - d.getDay());
      dates.push(d.toISOString().split("T")[0]);
    } else if (tontine.frequence === "MONTHLY") {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      dates.push(d.toISOString().split("T")[0]);
    }
    return dates;
  })();

  const contributionStatusList = expectedDates.map((date) => {
    const found = mockContributions.find((c) => c.date === date);
    return {
      date: formatDate(date),
      status: found ? "Payé" : "En attente",
      color: found ? "text-green-600" : "text-orange-500",
    };
  });

  const dejaContribue = mockContributions.reduce((sum, c) => sum + c.montant, 0);
  const reste = Math.max(montant - dejaContribue, 0);

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
            {tontine?.nom || "Nom indisponible"}
          </Text>
          <View className="space-y-1">
            <Info label="Nombre de membres" value={tontine?.nombreMembres} />
            <Info label="Admin" value={adminName} />
            <Info label="Fréquence" value={formatFrequence(tontine?.frequence)} />
            <Info label="Somme à cotiser" value={`${montant.toLocaleString()} xaf`} />
          </View>
        </View>

        <View className="bg-[#F0FFF5] rounded-xl p-4 border border-gray-200 mb-4">
          <Text className="text-green-700 font-semibold text-base mb-3">Mes Cotisations</Text>
          <Info label="Période actuelle" value={`${montant.toLocaleString()} xaf`} />
          
        </View>

        <TouchableOpacity
          disabled={isLoading}
          onPress={handlePay}
          className="bg-[#4ADE80] py-3 rounded-full flex-row justify-center items-center mb-4"
        >
          {isLoading ? (
            <>
              <Loader size="small" color="#fff" />
              <Text className="text-white font-semibold text-base ml-2">Paiement...</Text>
            </>
          ) : (
            <>
              <Text className="text-white font-semibold text-base mr-2">Payer</Text>
              <Ionicons name="card-outline" size={20} color="#fff" />
            </>
          )}
        </TouchableOpacity>

        <View className="flex-row justify-around mb-3">
          {["Cotisations", "Pénalités", "Historique"].map((tab) => (
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

        {activeTab === "Cotisations" && (
          <View className="space-y-2 mb-6">
            {contributionStatusList.map((item, idx) => (
              <View key={idx} className="flex-row justify-between px-3 py-2 border rounded-md">
                <Text className="text-gray-700">{item.date}</Text>
                <Text className={`font-semibold ${item.color}`}>{item.status}</Text>
              </View>
            ))}
          </View>
        )}

        {activeTab === "Pénalités" && (
          <View className="space-y-2 mb-6">
            {loadingPenalties ? (
              <Text>Chargement...</Text>
            ) : penaltiesResponse?.data?.length > 0 ? (
              penaltiesResponse.data.map((penalty, index) => (
                <View
                  key={index}
                  className="flex-row justify-between px-3 py-2 border rounded-md items-center"
                >
                  {/* Left side: Type and Date */}
                  <View className="flex-1">
                    <Text className="text-red-500">{penalty?.type}</Text>
                    <Text className="text-xs text-gray-500 mt-2">
                      {penalty?.createdAt
                        ? new Date(penalty.createdAt).toLocaleDateString()
                        : ''}
                    </Text>
                  </View>

                  {/* Center: Montant */}
                  <View className="mx-10">
                    <Text className="text-gray-700 font-bold">
                      {(penalty?.montant ?? 0).toLocaleString()} XAF
                    </Text>
                  </View>

                  {/* Right side: Pay Button */}
                  <View className="items-end">
                    <TouchableOpacity
                      className="bg-green-500 px-5 py-2 rounded flex-row items-center justify-center"
                      onPress={handlePayPenalty}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader color="#fff" size="small" />
                      ) : (
                        <Text className="text-white text-xs">Pay</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <Text>Aucune pénalité</Text>
            )}
          </View>
        )}

        {activeTab === "Historique" && (
          <View className="space-y-2 mb-6">
            {mockContributions.map((c, i) => (
              <View key={i} className="flex-row justify-between px-3 py-2 border rounded-md">
                <Text className="text-gray-700">{formatDate(c.date)}</Text>
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
