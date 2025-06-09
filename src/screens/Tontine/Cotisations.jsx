import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import Loader from "../../components/Loader";
import {
  useGetCotisationsQuery,
  useSetTontineOrderMutation,
  useChangeTontineStatusMutation,
  useGetValidatedCotisationsQuery,
  useRelanceCotisationMutation,
  useDistributeMutation,
} from "../../services/Tontine/tontineApi";
import { 
  sendPushNotification,
  sendPushTokenToBackend,
  registerForPushNotificationsAsync,
  getStoredPushToken
} from '../../services/notificationService';
import { useNavigation, useRoute } from "@react-navigation/native";
import DraggableFlatList, {
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { useTranslation } from 'react-i18next';

const TopLogo = require("../../images/TopLogo.png");

const Cotisations = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { tontineId, tontine } = route.params;
  const [activeTab, setActiveTab] = useState("contributions");
  const [loading, setLoading] = useState(false);

  const memberId = tontine?.membres[0]?.id;
  const [setTontineOrder] = useSetTontineOrderMutation();
  const [changeTontineStatus] = useChangeTontineStatusMutation();
  const [relanceCotisation] = useRelanceCotisationMutation();
  const {
    data: cotisations,
    isLoading,
    isError,
  } = useGetCotisationsQuery({ tontineId, memberId });
  const [loadingDistribute, setLoadingDistribute] = useState(false);
  const [distributeMutation] = useDistributeMutation();

  const {
    data: cotisation,
    isLoading: isLoadingValidated,
    isError: isErrorValidated,
  } = useGetValidatedCotisationsQuery({ tontineId, memberId });

  const initialOrdreList = tontine?.membres?.map((membre, i) => ({
    key: membre.id.toString(),
    label: `${membre.user.firstname} ${membre.user.lastname}`,
    order: i + 1,
  }));

  const [ordreList, setOrdreList] = useState(initialOrdreList);

  const formatFrequence = (f) => {
    switch (f) {
      case "DAILY":
        return t('frequency1.daily');
      case "WEEKLY":
        return t('frequency1.weekly');
      case "MONTHLY":
        return t('frequency1.monthly');
      default:
        return f;
    }
  };

  const handleSaveOrdreRotation = async () => {
    setLoading(true);
    try {
      const ordreRotation = ordreList.map((item) => parseInt(item.key));
      await setTontineOrder({ tontineId, ordreRotation }).unwrap();

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Rotation order updated successfully",
      });
    } catch (error) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: error?.data?.message || "An error occurred",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleDistribute = async () => {
    try {
      setLoadingDistribute(true);
      const response = await distributeMutation({ tontineId }).unwrap();

      const notificationContent = {
        title: "Distribution Successful",
        body: `Distribution of ${response.data.montantDistribue.toLocaleString()} FCFA completed successfully`,
        type: "DISTRIBUTION_SUCCESS",
      };

      try {
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
              tontineId,
              montantDistribue: response.data.montantDistribue,
              dateDistribution: response.data.dateDistribution,
              timestamp: new Date().toISOString(),
            }
          );
        }
      } catch (notificationError) {
        await sendPushNotification(
          notificationContent.title,
          notificationContent.body,
          {
            data: {
              type: notificationContent.type,
              tontineId,
              montantDistribue: response.data.montantDistribue,
              dateDistribution: response.data.dateDistribution,
            },
          }
        );
      }

      navigation.navigate("FundRelease", { response });
    } catch (error) {
      Toast.show({ 
        type: "error", 
        text1: "Error",
        text2: "Distribution failed" 
      });
    } finally {
      setLoadingDistribute(false);
    }
  };

  return (
    <View className="flex-1 bg-[#0E1111] pt-12">
      <Toast position="top" />
      {loading && <Loader />}

      {/* Header */}
      <View className="flex-row mb-2 items-center justify-between px-4">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Logo */}
      <View className="absolute top-[-48px] left-0 right-0 items-center">
        <Image source={TopLogo} className="h-[130px] w-[160px]" resizeMode="contain" />
      </View>

      <View className="border border-dashed border-gray-500 mb-6 mx-4" />

      {/* Stats Card */}
      <View className="mx-4 mb-4 bg-white border border-gray-300 rounded-xl p-4">
        <View className="flex-row justify-between">
          <View className="bg-green-400 rounded-lg p-3 flex-1 mr-2 items-center">
            <Ionicons name="cash-outline" size={28} color="#fff" />
            <Text className="text-white text-xs mt-1">{t('cotisations.total')}</Text>
            <Text className="text-white font-bold text-lg mt-1">
              {tontine?.compteSequestre?.soldeActuel} xaf
            </Text>
          </View>
          <View className="bg-green-400 rounded-lg p-3 flex-1 ml-2 items-center">
            <Ionicons name="people-outline" size={28} color="#fff" />
            <Text className="text-white text-xs mt-1">{t('cotisations.members')}</Text>
            <Text className="text-white font-bold text-lg mt-1">
              {tontine?.nombreMembres}
            </Text>
          </View>
        </View>

        <View className="mt-4">
          <View className="flex-row justify-between mb-1">
            <Text className="text-black">{formatFrequence(tontine.frequence)}</Text>
            <Text className="text-black font-semibold">{tontine.montant}</Text>
          </View>

          <TouchableOpacity
            className="bg-yellow-500 py-2 px-4 rounded-full items-center mt-2"
            onPress={async () => {
              try {
                setLoading(true);
                const newStatus = tontine.etat === "EN_COURS" ? "TERMINEE" : "EN_COURS";
                await changeTontineStatus({ tontineId, status: newStatus }).unwrap();
                Toast.show({
                  type: "success",
                  text1: "Success",
                  text2: `Status changed to ${newStatus}`,
                });
              } catch (error) {
                Toast.show({
                  type: "error",
                  text1: "Error",
                  text2: error?.data?.message || "Failed to change status",
                });
              } finally {
                setLoading(false);
              }
            }}
          >
            <Text className="text-black font-bold">
              {t('cotisations.changeStatus')} ({tontine.etat})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDistribute}
            disabled={loadingDistribute}
            className="bg-[#34D399] mt-4 py-3 rounded-full items-center flex-row justify-center space-x-2"
          >
            {loadingDistribute ? (
              <Loader size="small" color="#000" />
            ) : (
              <>
                <Text className="text-black font-semibold">
                  {t('cotisations.distributeToNext')}
                </Text>
                <Ionicons name="lock-closed-outline" size={18} color="#000" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View className="bg-white rounded-t-xl px-4 pt-3 pb-1 mx-4 flex-1">
        <View className="flex-row justify-around mb-2">
          {["contributions", "rotationOrder", "history"].map((tab) => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)}>
              <Text
                className={`text-sm font-medium pb-1 ${
                  activeTab === tab
                    ? "text-green-500 border-b-2 border-green-500"
                    : "text-gray-400"
                }`}
              >
                {t(`tabs1.${tab}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Contributions Tab */}
        {activeTab === "contributions" && (
          <>
            {isLoadingValidated ? (
              <Text className="text-center text-gray-500 mt-4">{t('loading')}</Text>
            ) : isErrorValidated ? (
              <Text className="text-center text-red-500 mt-4">
                {t('errors5.loadingContributions')}
              </Text>
            ) : cotisation?.data?.length === 0 ? (
              <Text className="text-center text-gray-400 mt-4">
                {t('cotisations.noContributions')}
              </Text>
            ) : (
              <ScrollView className="mt-4">
                {cotisation.data.map((item, idx) => (
                  <View
                    key={idx}
                    className="flex-row items-center justify-between bg-white rounded-xl px-4 py-3 mb-2 shadow-sm"
                  >
                    <View className="flex-1">
                      <Text className="text-black font-medium">
                        {item.membre?.user?.firstname} {item.membre?.user?.lastname}
                      </Text>
                      <Text className="text-gray-500 text-xs mt-1">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : "—"}
                      </Text>
                    </View>

                    {item.statutPaiement === "VALIDATED" ? (
                      <Text className="text-green-600 font-semibold text-sm">
                        {item.montant} xaf
                      </Text>
                    ) : (
                      <View className="flex-row items-center space-x-2">
                        <Text className="text-orange-500 font-medium text-sm">
                          {item.statutPaiement}
                        </Text>
                        <TouchableOpacity
                          className="bg-blue-400 rounded-full px-3 py-1"
                          onPress={() => {
                            relanceCotisation(item.id)
                              .unwrap()
                              .then(() => {
                                Toast.show({
                                  type: "success",
                                  text1: "Success",
                                  text2: "Reminder sent successfully",
                                });
                              })
                              .catch((error) => {
                                Toast.show({
                                  type: "error",
                                  text1: "Error",
                                  text2: error?.data?.message || "Failed to send reminder",
                                });
                              });
                          }}
                        >
                          <Text className="text-white text-xs font-semibold">{t('actions.remind')}</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            )}
          </>
        )}

        {/* Rotation Order Tab */}
        {activeTab === "rotationOrder" && (
          <>
            <Text className="text-black mt-2 mb-2 text-sm">
              {t('cotisations.dragToReorder')}
            </Text>
            <DraggableFlatList
              data={ordreList}
              onDragEnd={({ data }) => setOrdreList(data)}
              keyExtractor={(item) => item.key}
              renderItem={({ item, drag, isActive }) => (
                <ScaleDecorator>
                  <TouchableOpacity
                    onLongPress={drag}
                    disabled={isActive}
                    className={`flex-row items-center justify-between bg-gray-100 rounded-lg px-4 py-4 mb-2 ${
                      isActive ? "opacity-50" : ""
                    }`}
                  >
                    <View className="flex-row items-center space-x-3">
                      <Ionicons name="reorder-three" size={24} color="#888" />
                      <Text className="text-black font-semibold text-base">
                        {item.label}
                      </Text>
                    </View>
                    <View className="bg-gray-200 rounded-full px-4 py-1">
                      <Text className="text-black font-bold text-sm">
                        {item.order}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </ScaleDecorator>
              )}
            />
            <TouchableOpacity
              className="bg-green-500 py-3 mt-4 rounded-full items-center flex-row justify-center"
              onPress={handleSaveOrdreRotation}
              disabled={loading}
            >
              {loading ? (
                <Loader color="#fff" />
              ) : (
                <Text className="text-white font-semibold text-base">
                  {t('actions.saveOrder')}
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <View className="mt-4">
            <Text className="text-gray-500 text-center">{t('comingSoon')}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

export default Cotisations;