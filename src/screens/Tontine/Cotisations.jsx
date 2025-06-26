import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import Loader from "../../components/Loader";
import { useGetConfigQuery } from '../../services/Config/configApi';
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
  getStoredPushToken,
} from "../../services/notificationService";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import DraggableFlatList, { ScaleDecorator } from "react-native-draggable-flatlist";
import { useTranslation } from "react-i18next";

const TopLogo = require("../../images/TopLogo.png");

const Cotisations = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { tontineId, tontine } = route.params;
 //console.log(tontine)
  const [activeTab, setActiveTab] = useState("contributions");
  const [loading, setLoading] = useState(false);
  const [isLoadingRelance, setIsLoadingRelance] = useState(false);
  const [loadingDistribute, setLoadingDistribute] = useState(false);
  const [showDistributeModal, setShowDistributeModal] = useState(false);
  const [showMissingContributorsModal, setShowMissingContributorsModal] = useState(false);
  const [missingContributors, setMissingContributors] = useState("");


  const memberId = tontine?.membres?.[0]?.id;

  const [setTontineOrder] = useSetTontineOrderMutation();
  const [changeTontineStatus] = useChangeTontineStatusMutation();
  const [relanceCotisation] = useRelanceCotisationMutation();
  const [distributeMutation] = useDistributeMutation();

  const {
    data: cotisations,
    isLoading,
    isError,
    refetch: refetchCotisations,
  } = useGetCotisationsQuery({ tontineId, memberId }, { skip: !memberId });

  const {
    data: cotisation,
    isLoading: isLoadingValidated,
    isError: isErrorValidated,
    refetch: refetchValidated,
  } = useGetValidatedCotisationsQuery({ tontineId, memberId }, { skip: !memberId });
  // console.log("Erreur cotisation:", JSON.stringify(cotisation, null, 2));
  const initialOrdreList = tontine?.membres?.map((membre, i) => ({
    key: membre.id.toString(),
    label: `${membre.user.firstname} ${membre.user.lastname}`,
    order: i + 1,
  }));

  const [ordreList, setOrdreList] = useState(initialOrdreList);
  
   const {
      data: configData,
      isLoading: isConfigLoading,
      error: configError
    } = useGetConfigQuery();
  
    const getConfigValue = (name) => {
      const configItem = configData?.data?.find(item => item.name === name);
      return configItem ? configItem.value : null;
    };
     
    const TONTINE_FEES_DISTRIBUTION = parseFloat(getConfigValue('TONTINE_FEES_DISTRIBUTION'));
     //console.log('Distribution fee percentage:', TONTINE_FEES_DISTRIBUTION);

  const calculateDistributionAmount = () => {
    const currentBalance = parseFloat(tontine?.compteSequestre?.soldeActuel) || 0;
    const feesAmount = (currentBalance * TONTINE_FEES_DISTRIBUTION) / 100;
    const netAmount = currentBalance - feesAmount;
    
    return netAmount;
  };

  const distributionAmount = calculateDistributionAmount();

  useFocusEffect(
    useCallback(() => {
      if (memberId) {
        refetchCotisations();
        refetchValidated();
      }
    }, [memberId])
  );

  const formatFrequence = (f) => {
    switch (f) {
      case "DAILY":
        return t("frequency1.daily");
      case "WEEKLY":
        return t("frequency1.weekly");
      case "MONTHLY":
        return t("frequency1.monthly");
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
    console.log(response)
    // Show success toast immediately
    Toast.show({
      type: "success",
      text1: "Distribution réussie",
      text2: `La distribution de ${response.data.montantDistribue.toLocaleString()} FCFA a été effectuée avec succès`,
      position: "top",
    });

    // Try to send notification (but don't block navigation if it fails)
    const notificationContent = {
      title: "Distribution Successful",
      body: `Distribution of ${response.data.montantDistribue.toLocaleString()} FCFA completed successfully`,
      type: "DISTRIBUTION_SUCCESS",
    };

    const sendNotification = async () => {
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
        await sendPushNotification(notificationContent.title, notificationContent.body, {
          data: {
            type: notificationContent.type,
            tontineId,
            montantDistribue: response.data.montantDistribue,
            dateDistribution: response.data.dateDistribution,
          },
        });
      }
    };

    // Don't await this - we want to navigate immediately
    sendNotification().catch(console.error);

    // Navigate to success screen
    navigation.navigate("SuccessSharing", {
      transactionDetails: "La distribution a été versée avec succès.",
      amount: response.data.montantDistribue,
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

      {/* Stats */}
      <View className="mx-4 mb-4 bg-white border border-gray-300 rounded-xl p-4">
        <View className="flex-row justify-between">
          <View className="bg-green-400 rounded-lg p-3 flex-1 mr-2 items-center">
            <Ionicons name="cash-outline" size={28} color="#fff" />
            <Text className="text-white text-xs mt-1">{t("cotisations.total")}</Text>
            <Text className="text-white font-bold text-lg mt-1">
              {tontine?.compteSequestre?.soldeActuel} xaf
            </Text>
          </View>
          <View className="bg-green-400 rounded-lg p-3 flex-1 ml-2 items-center">
            <Ionicons name="people-outline" size={28} color="#fff" />
            <Text className="text-white text-xs mt-1">{t("cotisations.members")}</Text>
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
            disabled={tontine.etat === "SUSPENDED"}
            className={`py-2 px-4 rounded-full items-center mt-2 ${
              tontine.etat === "SUSPENDED" ? "bg-gray-400" : "bg-yellow-500"
            }`}
            onPress={async () => {
              if (tontine.etat === "SUSPENDED") return;
              try {
                setLoading(true);
                await changeTontineStatus({ tontineId, status: "SUSPENDED" }).unwrap();
                Toast.show({
                  type: "success",
                  text1: "Succès",
                  text2: `Le statut est passé à SUSPENDED`,
                });
              } catch (error) {
                Toast.show({
                  type: "error",
                  text1: "Erreur",
                  text2: error?.data?.message || "Échec du changement de statut",
                });
              } finally {
                setLoading(false);
              }
            }}
          >
            <Text className="text-black font-bold">
              {t("cotisations.changeStatus")} ({tontine.etat})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
             onPress={() => setShowDistributeModal(true)}
            disabled={loadingDistribute}
            className="bg-[#34D399] mt-4 py-3 rounded-full items-center flex-row justify-center space-x-2"
          >
            {loadingDistribute ? (
              <Loader size="small" color="#000" />
            ) : (
              <>
                <Text className="text-black font-semibold">
                  {t("cotisations.distributeToNext")}
                </Text>
                <Ionicons name="lock-closed-outline" size={18} color="#000" />
              </>
            )}
          </TouchableOpacity>
          
             {showDistributeModal && (
    <Modal
      transparent
      animationType="fade"
      visible={showDistributeModal}
      onRequestClose={() => setShowDistributeModal(false)}
    >
      <View className="flex-1 justify-center items-center bg-black/60 px-6">
        <View className="bg-white rounded-2xl p-6 w-full">
          <Text className="text-black text-large font-bold mb-4 text-center">
            {t("cotisations.confirmDistribution")}
          </Text>
          
          {/* Payment breakdown */}
          <View className="mb-4">
            <View className="flex-row justify-between mb-1">
              <Text className="text-gray-700">{t("cotisations.totalBalance")}:</Text>
              <Text className="text-gray-700">
                {parseFloat(tontine?.compteSequestre?.soldeActuel).toLocaleString()} xaf
              </Text>
            </View>
            <View className="flex-row justify-between mb-1">
              <Text className="text-gray-700">
                {t("cotisations.fees")} ({TONTINE_FEES_DISTRIBUTION}%):
              </Text>
              <Text className="text-gray-700">
                {((parseFloat(tontine?.compteSequestre?.soldeActuel) * TONTINE_FEES_DISTRIBUTION) / 100).toLocaleString()} xaf
              </Text>
            </View>
            <View className="border-t border-gray-300 my-2" />
            <View className="flex-row justify-between">
              <Text className="text-gray-800 font-semibold">{t("cotisations.netAmount")}:</Text>
              <Text className="text-gray-800 font-semibold">
                {distributionAmount.toLocaleString()} xaf
              </Text>
            </View>
          </View>

          <View className="flex-row justify-between mt-4 space-x-2">
            <TouchableOpacity
              onPress={() => setShowDistributeModal(false)}
              className="flex-1 bg-gray-200 px-4 py-3 rounded-lg items-center"
            >
              <Text className="text-gray-800 font-medium">
                {t("common.cancel")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={async () => {
                setShowDistributeModal(false);
                await handleDistribute();
              }}
              disabled={loadingDistribute}
              className="flex-1 bg-green-500 px-4 py-3 rounded-lg items-center"
            >
              {loadingDistribute ? (
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

        {activeTab === "contributions" && (
          <>
            {isLoadingValidated ? (
              <Text className="text-center text-gray-500 mt-4">{t("loading")}</Text>
            ) : isErrorValidated ? (
              <Text className="text-center text-red-500 mt-4">
                {t("errors5.loadingContributions")}
              </Text>
            ) : cotisation?.data?.length === 0 ? (
              <Text className="text-center text-gray-400 mt-4">
                {t("cotisations.noContributions")}
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
                     <View className="flex-row items-center justify-between">
                        <Text className="text-orange-500 font-medium text-sm mr-2">
                          {item.statutPaiement}
                        </Text>
                        <TouchableOpacity
                          className={`bg-green-400 rounded-full px-3 py-1 flex-row items-center justify-center ${isLoading ? "opacity-50" : ""}`}
                          disabled={isLoading}
                          onPress={() => {
                            setIsLoadingRelance(true);
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
                              })
                              .finally(() => setIsLoadingRelance(false));
                          }}
                        >
                          {isLoadingRelance ? ( 
                            <Loader size="small" color="#fff" /> 
                          ) : (
                            <Text className="text-white text-xs font-semibold">{t("actions.remind")}</Text>
                          )}
                        </TouchableOpacity>
                      </View>

                    )}
                  </View>
                ))}
              </ScrollView>
            )}
          </>
        )}

        {activeTab === "rotationOrder" && (
          <>
            <Text className="text-black mt-2 mb-2 text-sm">
              {Array.isArray(tontine?.toursDeDistribution) &&
              tontine.toursDeDistribution.length > 0
                ? t("cotisations.alreadyDefined")
                : t("cotisations.dragToReorder")}
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
                      <Text className="text-black font-semibold text-base">{item.label}</Text>
                    </View>
                    <View className="bg-gray-200 rounded-full px-4 py-1">
                      <Text className="text-black font-bold text-sm">{item.order}</Text>
                    </View>
                  </TouchableOpacity>
                </ScaleDecorator>
              )}
            />

            {Array.isArray(tontine?.toursDeDistribution) &&
              tontine.toursDeDistribution.length === 0 && (
                <TouchableOpacity
                  className="bg-green-500 py-3 mt-4 rounded-full items-center flex-row justify-center"
                  onPress={handleSaveOrdreRotation}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader color="#fff" />
                  ) : (
                    <Text className="text-white font-semibold text-base">
                      {t("actions.saveOrder")}
                    </Text>
                  )}
                </TouchableOpacity>
              )}
          </>
        )}

        {activeTab === "history" && (
          <>
            {isLoadingValidated ? (
              <Text className="text-center text-gray-500 mt-4">{t("loading")}</Text>
            ) : isErrorValidated ? (
              <Text className="text-center text-red-500 mt-4">
                {t("errors5.loadingContributions")}
              </Text>
            ) : cotisation?.data?.filter(item => item.statutPaiement === "VALIDATED").length === 0 ? (
              <Text className="text-center text-gray-400 mt-4">
                {t("cotisations.noValidatedContributions")}
              </Text>
            ) : (
              <ScrollView className="mt-4">
                {cotisation.data
                  .filter(item => item.statutPaiement === "VALIDATED")
                  .map((item, idx) => (
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

                      <Text className="text-green-600 font-semibold text-sm">
                        {item.montant} xaf
                      </Text>
                    </View>
                  ))}
              </ScrollView>
            )}
          </>
        )}

      </View>
      {showMissingContributorsModal && (
  <Modal
    transparent
    animationType="fade"
    visible={showMissingContributorsModal}
    onRequestClose={() => setShowMissingContributorsModal(false)}
  >
    <View className="flex-1 justify-center items-center bg-black/60 px-6">
      <View className="bg-white rounded-2xl p-6 w-full">
        <Text className="text-black text-lg font-bold mb-4 text-center">
          Distribution impossible
        </Text>
        <Text className="text-gray-700 text-sm text-center mb-6">
          Ces membres n'ont pas encore cotisé :
        </Text>
        <View className="bg-gray-100 p-3 rounded-lg mb-4">
          <Text className="text-black text-sm text-center">{missingContributors}</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowMissingContributorsModal(false)}
          className="bg-green-500 py-3 rounded-lg items-center"
        >
          <Text className="text-white font-bold">OK</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
)}

    </View>
  );
};

export default Cotisations;
