import React, { useEffect, useState } from "react";
import { useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Modal,
  Pressable,
  Alert,
  ScrollView,
} from "react-native";
import { Feather } from '@expo/vector-icons';
import { Ionicons, FontAwesome5,MaterialIcons, Entypo, AntDesign } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useNavigation } from "@react-navigation/native";
import CardImg from "../../images/virtual.png";
import { useTranslation } from "react-i18next";
import { useGetConfigQuery } from "../../services/Config/configApi";
import {
  useGetVirtualCardsQuery,
  useGetVirtualCardDetailsQuery,
  useFreezeCardMutation,
  useUnfreezeCardMutation,
  useGetCardTransactionsQuery,
  useGetCardBalanceQuery,
  useLazyGetVirtualCardDetailsHideQuery,
  useGetCardDebtsQuery,
  useGetUnlockStatusQuery,
} from "../../services/Card/cardApi";
import { useGetUserProfileQuery } from "../../services/Auth/authAPI"; 
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from 'react-native-webview';
import * as ScreenCapture from 'expo-screen-capture';

const ManageVirtualCard = () => {
  const { t } = useTranslation();
  const { width } = Dimensions.get("screen");
  const navigation = useNavigation();
  const [checking, setChecking] = useState(false);
  const {
    data: cards,
    isLoading: isCardsLoading,
  } = useGetVirtualCardsQuery(undefined,
      {
        pollingInterval: 60000, // refresh every 60s
      });
   //console.log("cards Status:", JSON.stringify(cards, null, 2));
    const { data: userProfile, isLoading: isProfileLoading, refetch } = useGetUserProfileQuery();
    //console.log('User Profile:', JSON.stringify(userProfile, null, 2));

  const [selectedCardId, setSelectedCardId] = useState(null);
  const [readOnlyMode, setReadOnlyMode] = useState(false);
  const [iframeModalVisible, setIframeModalVisible] = useState(false);
  const [iframeUrl, setIframeUrl] = useState('');
  const [isPreventingScreenshot, setIsPreventingScreenshot] = useState(false);
  const [isLoadingIframe, setIsLoadingIframe] = useState(false);
  const [isLoadingFreeze, setIsLoadingFreeze] = useState(false);
  const [webViewLoading, setWebViewLoading] = useState(true);

  const {
    data: cardDetails,
    isLoading: isDetailsLoading,
    refetch: refetchCardDetails,
  } = useGetVirtualCardDetailsQuery(selectedCardId, {
    skip: !selectedCardId,
      pollingInterval: 1000, // Refetch every 30 seconds
  });
  // console.log("cardDetails Status:", JSON.stringify(cardDetails, null, 2));

  const { data: unlockStatus, isLoading: isUnlockStatusLoading } = useGetUnlockStatusQuery(selectedCardId, {
    skip: !selectedCardId,
     pollingInterval: 1000,  // Refetch every 30 seconds
  });
    //console.log("Unlock Status:", JSON.stringify(unlockStatus, null, 2));

 const [getVirtualCardDetailsHide, { data: hideData, isLoading: isHideLoading, error: hideError }] = useLazyGetVirtualCardDetailsHideQuery();
    //console.log("cardDetailsHide:", JSON.stringify(cardDetailsHide, null, 2));

  const [freezeCard] = useFreezeCardMutation();
  const [unfreezeCard] = useUnfreezeCardMutation();
  const [showBalance, setShowBalance] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState("success");
  const [modalMessage, setModalMessage] = useState("");
  const [showDebts, setShowDebts] = useState(false);
  const [preActiveModalVisible, setPreActiveModalVisible] = useState(false);
  const [isProcessingFreeze, setIsProcessingFreeze] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isProcessingSetting, setIsProcessingSetting] = useState(false);


  const cardData = cardDetails?.data;
  //console.log(cardData)
  const cardStatus = cardData?.status;
  const isCardFrozen = cardStatus === "FROZEN";
  const rejectionAttempts = cardData?.paymentRejectNumber ?? 0;
  const limit = 3; // or wherever you get the limit from

  const {
    data: cardTransactions,
    isLoading: isTransactionsLoading,
    refetch: refetchTransactions,
  } = useGetCardTransactionsQuery(cardData?.id, {
    skip: !cardData?.id,
     pollingInterval: 1000, 
  });
 //console.log("Full response:", JSON.stringify(cardTransactions, null, 2));
  const {
  data: balanceData,
  isLoading: isBalanceLoading,
  refetch: refetchBalance,
} = useGetCardBalanceQuery({ idCard: cardData?.id }, {
  skip: !cardData?.id, 
});
//console.log("balanceData Data:", JSON.stringify(balanceData, null, 2));
const {
  data: debtsData,
  isLoading: isDebtsLoading,
  refetch: refetchDebts,
} = useGetCardDebtsQuery(cardData?.id, {
  skip: !cardData?.id,
   pollingInterval: 1000, 
});
 //console.log("Debts Data:", JSON.stringify(debtsData, null, 2));

 //console.log(balanceData)
 useEffect(() => {
  if (cards?.data && selectedCardId !== cards.data.cardId) {
    setSelectedCardId(cards.data.cardId);
  }
}, [cards, selectedCardId]);


 const {
    data: configData,
    isLoading: isConfigLoading,
    error: configError,
  } = useGetConfigQuery();

  const getConfigValue = (name) => {
    const configItem = configData?.data?.find((item) => item.name === name);
    return configItem ? configItem.value : null;
  };

  const SENDO_VIEW_DETAILS_CARD_FEES = getConfigValue("SENDO_VIEW_DETAILS_CARD_FEES");

//  useFocusEffect(
//   useCallback(() => {
//     setChecking(true); // show loader before checking

//     if (!isProfileLoading) {
//       const virtualCard = userProfile?.data?.virtualCard;
//       const isCardMissingOrEmpty =
//         !virtualCard || (typeof virtualCard === "object" && Object.keys(virtualCard).length === 0);
//       const status = virtualCard?.status;

//       // Allow these statuses to stay on the ManageVirtualCard screen
//       const allowedStatuses = ["ACTIVE", "PRE_ACTIVE", "FROZEN",  "BLOCKED", "SUPENDED"];
      
//       // Only redirect if the card is missing OR if the status is not in allowed list
//       if (isCardMissingOrEmpty || !allowedStatuses.includes(status)) {
//         navigation.navigate("OnboardingCard");
//       }
//     }

//     setChecking(false); // hide loader after check
//   }, [userProfile, isProfileLoading, navigation])
// );

  if (checking || isProfileLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#7ddd7d" />
      </View>
    );
  }

  useEffect(() => {
    if (cardStatus === "TERMINATED") {
      setModalType("terminated");
      setModalMessage("Votre carte a été supprimée. Voulez-vous en créer une nouvelle ?");
      setModalVisible(true);
    } else if (cardStatus === "IN_TERMINATION") {
      Alert.alert(
        "Suppression en cours",
        "Votre carte est en cours de suppression. Certaines fonctionnalités peuvent être limitées."
      );
    } else if (cardStatus === "SUSPENDED") {
      Alert.alert(
        "Carte suspendue",
        "Votre carte a été suspendue en raison d'une activité suspecte."
      );
    }
  }, [cardStatus]);

 const debouncedHandleFreezeUnfreeze = async () => {
  if (isProcessingFreeze) return; // prevent multiple simultaneous calls

  try {
    setIsProcessingFreeze(true); // start processing
    await handleFreezeUnfreeze(); // call your API
  } catch (err) {
    console.error(err);
  } finally {
    setIsProcessingFreeze(false); // always reset flag
  }
};
 
  // Prevent screenshots when modal is visible
  useEffect(() => {
    const preventScreenshot = async () => {
      try {
        await ScreenCapture.preventScreenCaptureAsync();
        setIsPreventingScreenshot(true);
      } catch (error) {
        console.error('Could not prevent screenshots:', error);
      }
    };

    const allowScreenshot = async () => {
      try {
        await ScreenCapture.allowScreenCaptureAsync();
        setIsPreventingScreenshot(false);
      } catch (error) {
        console.error('Could not re-enable screenshots:', error);
      }
    };

    if (iframeModalVisible) {
      preventScreenshot();
    } else {
      allowScreenshot();
    }

    return () => {
      allowScreenshot();
    };
  }, [iframeModalVisible]);

  const showModal = (type, title, message = "") => {
  setModalType(type);
  setModalMessage(message ? `${title}: ${message}` : title);
  setModalVisible(true);
};


const handleFreezeUnfreeze = async () => {
  const cardId = cardData?.cardId;
  const cardStatus = cardData?.status; //  get status
  if (!cardId) return;

  //  Handle PRE_ACTIVE and non-active cases before doing API calls
   if (cardStatus === "PRE_ACTIVE") {
    setPreActiveModalVisible(true);
    return;
  }

  setIsLoadingFreeze(true);

  try {
    if (isCardFrozen) {
      const response = await unfreezeCard(cardId).unwrap();
      showModal("success", `${response?.message || ""}`);
    } else {
      const response = await freezeCard(cardId).unwrap();
      showModal("success", `${response?.message || ""}`);
    }

    refetchCardDetails();
  } catch (err) {
    let errorMessage = "Erreur lors de l'opération.";
    if (err?.data?.message) {
      errorMessage = err.data.message;
    } else if (err?.error) {
      errorMessage = err.error;
    }
    showModal("error", errorMessage);
  } finally {
    setIsLoadingFreeze(false); // Stop loading
  }
};


const handleShowCardDetails = async () => {
    try {
      const balance = balanceData?.data?.balance ?? 0;

      if (balance < 1000) {
        Alert.alert(
          "Solde insuffisant",
          "Vous devez avoir au moins 1 000 XAF sur votre carte pour consulter les détails."
        );
        return;
      }

      if (cardStatus === "ACTIVE") {
        // Show alert and wait for user response
        Alert.alert(
          "Frais d'affichage",
          `Attention! ${SENDO_VIEW_DETAILS_CARD_FEES} XAF des frais seront déduits de **votre carte Sendo** à chaque fois que vous consulterez les détails. Souhaitez-vous continuer?`,
          [
            { 
              text: "Annuler", 
              style: "cancel",
              onPress: () => {
                setIsLoadingIframe(false); // Ensure loader stops if user cancels
              }
            },
            {
              text: "Continuer",
              onPress: async () => {
                await handleCardDetailsRequest(false); // false for not read-only
              },
            },
          ]
        );
      } else if (cardStatus === "FROZEN") {
        await handleCardDetailsRequest(true); // true for read-only
      } else if (cardStatus === "BLOCKED") {
        showModal("error", "Votre carte a été bloquée");
      } else if (cardStatus === "PRE_ACTIVE") {
        setPreActiveModalVisible(true);
      } else {
        showModal("error", "Les détails de la carte ne sont disponibles que lorsque la carte est active ou verrouillée");
      }
    } catch (err) {
      console.error("API Error:", err);
      showModal("error", "Une erreur s'est produite");
      setIsLoadingIframe(false);
    }
  };

// Separate function to handle the API request
const handleCardDetailsRequest = async (isReadOnly) => {
  setIsLoadingIframe(true);
  
  try {
    //console.log("Sending request with cardId:", selectedCardId);
    
    // Use the lazy query hook correctly
    const response = await getVirtualCardDetailsHide(selectedCardId).unwrap();
    
    //console.log("response Data:", JSON.stringify(response, null, 2));
    
    // Handle different response structures
    if (response.error || response.status >= 400) {
      const errorMsg = response.error?.data?.message ||
                       response.error?.data?.data?.errors?.[0] ||
                       response.message ||
                       "Impossible de charger les détails de la carte";
      showModal("error", errorMsg);
      return;
    }
    
    // Check for link in different possible response structures
    const link = response.data?.data?.link || response.data?.link || response.link;
    
    if (link) {
      setIframeUrl(link);
      setIframeModalVisible(true);
      setWebViewLoading(true);
      setReadOnlyMode(isReadOnly);
    } else {
      showModal("error", "Impossible de charger les détails de la carte");
    }
  } catch (error) {
    //console.log("API call failed:", JSON.stringify(error, null, 2));
    
    // Handle different error structures
    if (error?.status === 500 && error?.data?.status === 500) {
      showModal("error", "Les détails de la carte ne sont pas disponibles pour le moment. Merci de réessayer.");
    } else {
      // Handle other error structures
      const errorMsg = error?.data?.message ||
                       error?.data?.data?.errors?.[0] ||
                       error?.message ||
                       "Erreur de connexion au serveur";
      
      showModal("error", errorMsg);
    }
  } finally {
    setIsLoadingIframe(false);
  }
};

  const ActionItem = ({ icon, label, onPress, disabled = false }) => (
  <TouchableOpacity 
    onPress={disabled ? null : onPress} 
    className="items-center flex-1" 
    disabled={disabled}
  >
    <View className={`p-3 rounded-full ${disabled ? 'bg-gray-100' : 'bg-gray-200'}`}>
      {disabled ? (
        <ActivityIndicator size="small" color="#333" />
      ) : (
        <Ionicons name={icon} size={24} color="#333" />
      )}
    </View>
    <Text className={`text-xs mt-2 text-center ${disabled ? 'text-gray-400' : 'text-black'}`}>
      {label}
    </Text>
  </TouchableOpacity>
);

  const TransactionItem = ({ item, navigation }) => {
  const isCashIn = item.type === "DEPOSIT";

  // Choose icon depending on type
  const getIcon = () => {
    switch (item.type) {
      case "DEPOSIT":
        return (
          <Ionicons
            name="arrow-down-circle-outline"
            size={20}
            color="#7ddd7d"
          />
        );
      case "PAYMENT":
        return <Entypo name="credit-card" size={20} color="#f39c12" />;
      case "VIEW_CARD_DETAILS":
        return <MaterialIcons name="visibility" size={20} color="#7ddd7d" />;
      default:
        return <Ionicons name="swap-horizontal" size={20} color="#95a5a6" />;
    }
  };

  // Format date in French
  const formattedDate = new Date(item.createdAt).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Translate status
  const getStatusLabel = () => {
    switch (item.status) {
      case "COMPLETED":
        return "Succès";
      case "PENDING":
        return "En cours de traitement";
      case "FAILED":
        return "Échec";
      default:
        return item.status;
    }
  };

  return (
    <TouchableOpacity
      className="flex-row justify-between items-center py-3 border-b border-gray-200"
      onPress={() =>
        navigation.navigate("TransactionDetails", { transaction: item })
      }
    >
      {/* Left side: icon + details */}
      <View className="flex-row items-center gap-2 flex-1">
        <View className="bg-gray-100 p-2 rounded-full">{getIcon()}</View>
        <View className="flex-1">
          <Text className="font-semibold flex-wrap">
            {item.description || "Transaction"}
          </Text>
          <Text className="text-xs text-gray-500">{formattedDate}</Text>
          <Text
            className={`text-xs ${
              item.status === "COMPLETED"
                ? "text-green-600"
                : item.status === "PENDING"
                ? "text-gray-500"
                : "text-red-600"
            }`}
          >
            {getStatusLabel()}
          </Text>
        </View>
      </View>

      {/* Right side: amount */}
      <Text
        className={`font-bold ${
          item.status === "PENDING"
            ? "text-gray-400"
            : isCashIn
            ? "text-green-600"
            : "text-red-500"
        }`}
      >
        {isCashIn ? "+" : "-"}
        {item.totalAmount.toLocaleString("fr-FR")} {item.currency || "FCFA"}
      </Text>
    </TouchableOpacity>
  );
};

  const handleRefresh = () => {
    refetchTransactions();
  };

  if (isCardsLoading || isDetailsLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#7ddd7d" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView className="bg-[#7ddd7d]  rounded-b-2xl">
         <StatusBar backgroundColor="#7ddd7d" barStyle="light-content" />
        <View className="flex-row items-center justify-between px-4 bg-[#7ddd7d]  border-b border-gray-200 rounded-b-2xl">
          <TouchableOpacity
            onPress={() =>
              navigation.reset({
                index: 0,
                routes: [{ name: "MainTabs" }],
              })
            }
            className="p-1"
          >
            <AntDesign name="left" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-800 text-center flex-1">
            {cardData?.cardName || "Ma Carte"}
          </Text>
          <TouchableOpacity onPress={() => navigation.openDrawer()} className="p-1">
            <Ionicons name="menu-outline" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="px-4 pt-1">
          {/* Card Display */}
          <View className="relative rounded-2xl overflow-hidden mt-2" style={{ height: width / 1.66 }}>
            <Image source={CardImg} className="w-full h-full absolute" resizeMode="contain" />
            {(isCardFrozen || cardStatus === "BLOCKED") && (
              <View className="absolute inset-0 bg-[#d7f0f7] bg-opacity-60 z-10 justify-center items-center">
                <FontAwesome5 
                  name={cardStatus === "BLOCKED" ? "ban" : "snowflake"} 
                  size={50} 
                  color={cardStatus === "BLOCKED" ? "#ff6b6b" : "#a0e1f5"} 
                />
                {cardStatus === "BLOCKED" && (
                  <Text className="text-white font-bold mt-2">BLOQUÉE</Text>
                )}
              </View>
            )}

            <View className="flex-1 justify-between px-5 py-4">
             <View className="mt-2">
              <Text className="text-white text-sm mb-1">{t('manageVirtualCard.currentBalance')}</Text>
               <TouchableOpacity
                onPress={() => {
                  if (showBalance) {
                    setShowBalance(false);
                  } else {
                    navigation.navigate("Auth", {
                      screen: "PinCode",
                      params: {
                        onSuccess: () => {
                          setShowBalance(true);  // Reveal balance after successful pin
                            // Automatically hide balance after 20s
                            setTimeout(() => {
                              setShowBalance(false);
                            }, 20000);
                          return Promise.resolve();
                        },
                        showBalance: true,
                      },
                    });
                  }
                }}
                className="px-3 py-1 rounded-full self-start flex-row items-center space-x-2"
              >
                <Feather
                  name={showBalance ? "eye" : "eye-off"}
                  size={20}
                  color="#fff"
                />
              </TouchableOpacity>

              </View>

              <View className="mt-3">
                <Text className="text-white text-lg tracking-widest font-semibold">
                  **** {cardData?.last4Digits}
                </Text>
              </View>

              <View className="mt-3">
                <Text className="text-white font-bold text-xl">{cardData?.cardName}</Text>
                <Text className="text-white mt-3">
                  {t("manageVirtualCard.expires")} {cardData?.expirationDate}
                </Text>
              </View>
            </View>
          </View>
          

          {/* Actions */}
          {/* Actions */}
          {cardStatus !== "TERMINATED" && (
            <View className="mb-1 mt-2">
              {rejectionAttempts > 0 && (
                <View className="mb-4">
                  {/* Progress Bar */}
                  <View className="flex-row space-x-1 mb-2">
                    {[...Array(limit)].map((_, index) => (
                      <View
                        key={index}
                        className={`h-1.5 flex-1 rounded-full ${
                          index < rejectionAttempts ? "bg-red-500" : "bg-gray-300"
                        }`}
                      />
                    ))}
                  </View>

                  {/* Failure Counter */}
                  <Text className="text-sm text-gray-800 font-medium">
                    <Text className="font-semibold text-red-600">
                      Compteur d'échecs : {rejectionAttempts}/{limit}
                    </Text>{" "}
                    tentative(s) de paiement échouées sur votre carte.
                  </Text>

                  <View
                    className={`mt-2 p-3 rounded-md border-l-4 ${
                      rejectionAttempts >= limit
                        ? "bg-red-100 border-red-500"
                        : "bg-yellow-50 border-yellow-400"
                    }`}
                  >
                    {isUnlockStatusLoading ? (
                      <ActivityIndicator size="small" color="#7ddd7d" />
                    ) : (
                      <Text
                        className={`text-sm ${
                          rejectionAttempts >= limit ? "text-red-800" : "text-yellow-800"
                        }`}
                      >
                        Cette carte sera supprimée après{" "}
                        <Text className="font-semibold text-red-600">
                          {limit} paiements échoués
                        </Text>
                        . Déposez de l'argent pour éviter la suppression et effectuez vos paiements.{" "}
                        <Text
                          className="text-blue-700 underline"
                          onPress={() =>
                            navigation.navigate("CardAction", {
                              cardId: cardData?.id,
                              action: "recharge",
                            })
                          }
                        >
                          Recharger maintenant!
                        </Text>
                      </Text>
                    )}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* 🔸 Action Buttons */}
            <View className="flex flex-row justify-between mt-1">
              {/* 👁 View Info */}
              <TouchableOpacity
                className="flex flex-1 bg-gray-100 mx-1 py-1 px-4 rounded-xl flex-col items-center justify-center"
                onPress={handleShowCardDetails}
                disabled={isProcessing || isLoadingIframe || isHideLoading}
              >
                {isProcessing || isLoadingIframe ? (
                  <ActivityIndicator size="small" color="#7ddd7d" />
                ) : (
                  <Ionicons name="eye-outline" size={24} color="#333" />
                )}
                <Text className="mt-2 text-center text-sm">
                  {t("manageVirtualCard.viewInfo")}
                </Text>
              </TouchableOpacity>

              {/* ❄️ Freeze / Unfreeze */}
              <TouchableOpacity
                className="flex flex-1 bg-gray-100 mx-1 py-1 px-4 rounded-xl flex-col items-center justify-center"
                onPress={debouncedHandleFreezeUnfreeze}
                disabled={isProcessingFreeze || isLoadingFreeze}
              >
                {isProcessingFreeze || isLoadingFreeze ? (
                  <ActivityIndicator size="small" color="#7ddd7d" />
                ) : (
                  <Ionicons name="snow-outline" size={24} color="#333" />
                )}
                <Text className="mt-2 text-center text-sm">
                  {isCardFrozen
                    ? t("manageVirtualCard.unfreeze")
                    : t("manageVirtualCard.freeze")}
                </Text>
              </TouchableOpacity>

              {/* ⚙️ Settings */}
              <TouchableOpacity
                className="flex flex-1 bg-gray-100 mx-1 py-1 px-3 rounded-xl flex-col items-center justify-center"
                onPress={() => {
                  if (!isProcessingSetting) {
                    navigation.navigate("CardSettings", {
                      cardName: cardData?.cardName,
                      cardId: cardData?.cardId,
                      balanceData: balanceData?.data?.balance,
                    });
                  }
                }}
                disabled={isProcessingSetting}
              >
                <Ionicons name="settings-outline" size={24} color="#333" />
                <Text className="mt-2 text-center text-sm">
                  {t("manageVirtualCard.settings")}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 🚫 Terminated Message */}
            {!cardData ? (
              <View className="mt-6 bg-red-100 rounded-xl p-4">
                <Text className="text-red-600 font-semibold text-center">
                  {t("manageVirtualCard.terminatedMessage")}
                </Text>
              </View>
            ) : null}



          {/* Balance + Actions */}
         {cardStatus !== "TERMINATED" ? (
            <>
              {/* Balance and Action Buttons */}
              <View className="mt-4 bg-gray-100 rounded-xl p-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-xl font-bold">
                      {showBalance
                        ? isBalanceLoading
                          ? "Chargement..."
                          : `${(balanceData?.data?.balance ?? 0).toLocaleString("fr-FR")} XAF`
                        : "**** XAF"}
                    </Text>
                    <Text className="text-sm text-gray-500">{t('manageVirtualCard.availableBalance')}</Text>
                  </View>

                  <TouchableOpacity
                    className="bg-white flex-row items-center justify-center rounded-md px-3 py-2 border border-green-300 mr-2"
                    onPress={() =>
                      navigation.navigate("CardAction", {
                        cardId: cardData?.id,
                        action: "withdraw",
                      })
                    }
                  >
                    <Text className="text-black font-semibold ml-2">{t('manageVirtualCard.withdraw')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="bg-[#7ddd7d] flex-row items-center justify-center rounded-md px-3 py-2"
                    onPress={() =>
                      navigation.navigate("CardAction", {
                        cardId: cardData?.id,
                        action: "recharge",
                      })
                    }
                  >
                    <Text className="text-white font-semibold ml-2">{t('manageVirtualCard.topUp')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
             {/*  Debts Dropdown - Only show if there are debts or loading */}
              {((debtsData?.data?.length > 0) || isDebtsLoading) && (
                <View className="mt-2 px-4">
                  <TouchableOpacity
                    onPress={() => setShowDebts(!showDebts)}
                    className="flex-row items-center justify-between py-3"
                  >
                    <Text className="font-semibold text-gray-700">
                      {t("manageVirtualCard.showDebts") || "Voir les dettes"}
                    </Text>
                    <Ionicons
                      name={showDebts ? "chevron-up" : "chevron-down"}
                      size={20}
                      color="#333"
                    />
                  </TouchableOpacity>

                  {showDebts && (
                    <View className="bg-gray-100 rounded-xl p-4">
                      {isDebtsLoading ? (
                        <ActivityIndicator size="small" color="#7ddd7d" />
                      ) : debtsData?.data?.length > 0 ? (
                        debtsData.data.map((debt) => (
                          <View
                            key={debt.id}
                            className="flex-row justify-between border-b border-gray-200 py-2"
                          >
                            <Text className="text-sm text-gray-600">
                              {debt.intitule}
                            </Text>
                            <Text className="text-sm font-semibold text-red-500">
                              {debt.amount?.toLocaleString("fr-FR")} XAF
                            </Text>
                          </View>
                        ))
                      ) : (
                        <Text className="text-sm text-gray-500 mt-2">
                          {t("manageVirtualCard.noDebts") || "Aucune dette en cours"}
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              )}
            </>
          ) : (
            <View className="mt-6 bg-red-100 rounded-xl p-4">
              <TouchableOpacity
                className="bg-green-600 py-3 px-4 rounded-md self-center"
                onPress={() => navigation.navigate("CreateVirtualCard")}
              >
                <Text className="text-white font-bold text-center">{t('manageVirtualCard.createNew')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Transactions */}
          <View className="mt-2 mb-2">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="font-bold text-gray-700">{t('manageVirtualCard.history')}</Text>
              <TouchableOpacity  onPress={() =>
                    navigation.navigate("HistoryCard")
                  }>
                <Text className="font-bold text-gray-700">voir tout</Text>
              </TouchableOpacity>
            </View>

            {isTransactionsLoading ? (
              <ActivityIndicator size="small" color="#7ddd7d" />
            ) : (
              <FlatList
                  data={cardTransactions?.data?.transactions?.items || []}
                  renderItem={({ item }) => <TransactionItem item={item} navigation={navigation} />}
                  keyExtractor={(item) => item.transactionId || item.id.toString()}
                  ListEmptyComponent={
                    <Text className="text-center py-4 text-gray-500">
                      {t('manageVirtualCard.empty')}
                    </Text>
                  }
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={false}
                  nestedScrollEnabled={true}
                />

            )}
          </View>
        </View>
      </ScrollView>

      {/* Modal for TERMINATED or error/success */}
      <Modal
        transparent
        visible={modalVisible}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-transparent bg-opacity-40">
          <View className="bg-white p-6 rounded-xl w-4/5">
            <View className="items-center mb-4">
              {modalType === "terminated" ? (
                <Ionicons name="alert-circle" size={48} color="#f39c12" />
              ) : modalType === "success" ? (
                <Ionicons name="checkmark-circle" size={48} color="#7ddd7d" />
              ) : (
                <Ionicons name="close-circle" size={48} color="#ff6b6b" />
              )}
            </View>
            <Text className="text-center mb-4">{modalMessage}</Text>
            <Pressable
              className="bg-[#7ddd7d] py-3 rounded-md mb-2"
              onPress={() => {
                setModalVisible(false);
                if (modalType === "terminated") {
                  navigation.navigate("CreateVirtualCard");
                }
              }}
            >
              <Text className="text-white text-center font-bold">
                {modalType === "terminated" ? "Créer une nouvelle carte" : "OK"}
              </Text>
            </Pressable>
            {modalType === "terminated" && (
              <Pressable
                className="py-2"
                onPress={() => setModalVisible(false)}
              >
                <Text className="text-center text-gray-500">  {t('manageVirtualCard.cancel')}</Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal for PRE_ACTIVE card */}
      <Modal
        transparent
        visible={preActiveModalVisible}
        animationType="fade"
        onRequestClose={() => setPreActiveModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-transparent bg-opacity-40">
          <View className="bg-white p-6 rounded-xl w-4/5">
            <View className="items-center mb-4">
              <Ionicons name="information-circle" size={48} color="#f39c12" />
            </View>
            <Text className="text-center mb-4">
              Votre carte est en attente d'activation. Veuillez effectuer une première recharge pour activer votre carte et voir ses détails.
            </Text>
            <Pressable
              className="bg-[#7ddd7d] py-3 rounded-md mb-2"
              onPress={() => {
                setPreActiveModalVisible(false);
                navigation.navigate("CardAction", {
                  cardId: cardData?.id,
                  action: "recharge",
                });
              }}
            >
              <Text className="text-white text-center font-bold">
                Recharger maintenant
              </Text>
            </Pressable>
            <Pressable
              className="py-2"
              onPress={() => setPreActiveModalVisible(false)}
            >
              <Text className="text-center text-gray-500">Annuler</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Iframe Modal for Card Details */}
      <Modal
        transparent={false}
        visible={iframeModalVisible}
        animationType="slide"
        onRequestClose={() => setIframeModalVisible(false)}
      >
        <View className="flex-1 bg-white">
          {/* Header with close button */}
          <View className="flex-row justify-between items-center mt-10 p-4 border-b border-gray-200">
            <Text className="text-lg font-bold">Détails de la carte</Text>
            <TouchableOpacity onPress={() => setIframeModalVisible(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          {/* WebView/Iframe container */}
          <View className="flex-1">
            {iframeUrl ? (
              <>
                {webViewLoading && (
                  <View className="flex-1 justify-center items-center absolute top-0 left-0 right-0 bottom-0 z-10 bg-white">
                    <ActivityIndicator size="large" color="#7ddd7d" />
                  </View>
                )}
                <WebView 
                  source={{ uri: iframeUrl }}
                  onLoadStart={() => setWebViewLoading(true)}
                  onLoadEnd={() => setWebViewLoading(false)}
                  onError={() => {
                    setWebViewLoading(false);
                    showModal("error", "Erreur de chargement des détails de la carte");
                  }}
                  style={{ flex: 1 }}
                />
              </>
            ) : (
              <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color="#7ddd7d" />
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ManageVirtualCard;