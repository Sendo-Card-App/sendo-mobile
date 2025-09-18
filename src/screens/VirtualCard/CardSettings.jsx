import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator ,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import {
  useFreezeCardMutation,
  useUnfreezeCardMutation,
  useDeleteCardMutation,
  useGetVirtualCardDetailsQuery,
} from "../../services/Card/cardApi";
import Loader from "../../components/Loader";
import {
  useRoute,
  useNavigation,
  useFocusEffect,
} from "@react-navigation/native";
import { useTranslation } from "react-i18next";

const CardSettingsScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { cardName, cardId, balanceData } = route.params;
  //console.log("CardSettingsScreen params:", balanceData);
  const { t } = useTranslation();
    const {
      data: cardData,
      refetch: refetchCardDetails,
      isLoading,
    } = useGetVirtualCardDetailsQuery(cardId, {
      pollingInterval: 1000, // reload every 1 second
    });


  const [freezeCard] = useFreezeCardMutation();
  const [unfreezeCard] = useUnfreezeCardMutation();
  const [deleteCard] = useDeleteCardMutation();
  const [isLoadingFreeze, setIsLoadingFreeze] = useState(false);

  const [isLimitModalVisible, setIsLimitModalVisible] = useState(false);

  const isBlocked = cardData?.data?.status === "FROZEN";

  

  useFocusEffect(
    useCallback(() => {
      refetchCardDetails();
    }, [cardId])
  );

  const showModal = (type, message) => {
    Alert.alert(
      type === "success" ? t("success") : t("error"),
      message,
      [{ text: "OK" }]
    );
  };

  const handleFreezeUnfreeze = async () => {
  if (!cardId) return showModal("error", t("cardIdMissing"));
  setIsLoadingFreeze(true); // Start loading

  try {
    if (isBlocked) {
      const response = await unfreezeCard(cardId).unwrap();
      showModal("success", t("cardUnfrozen", { message: response?.message || "" }));
    } else {
      const response = await freezeCard(cardId).unwrap();
      showModal("success", t("cardFrozen", { message: response?.message || "" }));
    }

    refetchCardDetails?.();
  } catch (err) {
    let errorMessage = t("operationError");
    if (err?.data?.message) {
      errorMessage = err.data.message;
    } else if (err?.error) {
      errorMessage = err.error;
    }
    showModal("error", errorMessage);
  } finally {
    setIsLoadingFreeze(false); // End loading
  }
};

  const handleDeleteCard = () => {
  if (!cardId) return showModal("error", t("cardIdMissing"));

  Alert.alert(
    t("deleteCardTitle"),
    // Add dynamic balance info here 
    `${t("deleteCardConfirm")}\n\n${t("amountToReturn", { amount: balanceData || 0 })}`,
    [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await deleteCard(cardId).unwrap();
            showModal("success", t("cardDeleted"));
            navigation.goBack();
          } catch (err) {
            console.log("Delete card error:", JSON.stringify(err, null, 2));

            let errorMessage = t("operationError");
            if (err?.data?.message) {
              errorMessage = err.data.message;
            } else if (err?.error) {
              errorMessage = err.error;
            }
            showModal("error", errorMessage);
          }
        },
      },
    ]
  );
};


  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Loader size="large" color="#7ddd7d" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      {/* Custom Header */}
      <SafeAreaView className="bg-[#7ddd7d]   rounded-b-2xl">
        <View className="flex-row items-center justify-between px-4 py-3  border-b border-gray-200 rounded-b-2xl">
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-1">
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-800 text-center flex-1 -ml-5">
            {cardName || t("myCard")}
          </Text>
          <TouchableOpacity
            onPress={() => navigation.openDrawer()}
            className="p-1"
          >
            <Ionicons name="menu-outline" size={28} color="#333" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Card Name */}
      <View className="p-4">
        <Text className="text-xl text-gray-700 mb-1">{t("cardName")}</Text>
        <TextInput
          value={cardName}
          editable={false}
          className="border border-gray-300 rounded-md text-xl px-8 py-4 text-gray-700 bg-gray-100"
        />
      </View>

      {/* Section: Security */}
      <View className="px-4 mt-4">
        <Text className="text-lg font-semibold text-gray-800 mb-2">{t("security")}</Text>
        <View className="flex-row items-center justify-between bg-gray-100 p-4 rounded-xl">
          <View className="flex-1 pr-3">
            <Text className="text-base font-semibold text-gray-800">{t("blockCard")}</Text>
            <Text className="text-sm text-gray-600">{t("blockCardDesc")}</Text>
          </View>

          {isLoadingFreeze ? (
            <ActivityIndicator size="small" color="#16a34a" />
          ) : (
            <Switch
              value={isBlocked}
              onValueChange={handleFreezeUnfreeze}
              thumbColor={isBlocked ? "#16a34a" : "#ccc"}
            />
          )}
        </View>
      </View>


      {/* Section: Limits */}
      <View className="px-4 mt-6">
        <Text className="text-lg font-semibold text-gray-800 mb-2">{t("limits")}</Text>
        <TouchableOpacity
          className="bg-gray-100 p-4 rounded-xl flex-row items-center"
          onPress={() => setIsLimitModalVisible(true)}
        >
          <Ionicons name="wallet-outline" size={22} color="#333" />
          <View className="ml-3">
            <Text className="text-base font-semibold text-gray-800">{t("cardLimit")}</Text>
            {/* <Text className="text-sm text-gray-600">{t("cardLimitDesc")}</Text> */}
          </View>
        </TouchableOpacity>
      </View>

      {/* Section: Delete Card */}
      <View className="px-4 mt-6">
        <Text className="text-lg font-semibold text-gray-800 mb-2">{t("other")}</Text>
        <TouchableOpacity
          onPress={handleDeleteCard}
          className="bg-red-100 p-4 rounded-xl flex-row items-start"
        >
          <Ionicons name="trash-outline" size={22} color="#b91c1c" />
          <View className="ml-3 flex-1">
            <Text className="text-base font-semibold text-red-700">{t("deleteCard")}</Text>
            <Text className="text-sm text-red-600">
              {t("deleteCardConfirm")}
            </Text>
          </View>
        </TouchableOpacity>
        <Text className="text-xs text-center text-gray-500 mt-2">
          {t("deleteCardFooter")}
        </Text>
      </View>

      {/* Limits Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isLimitModalVisible}
        onRequestClose={() => setIsLimitModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-transparent bg-opacity-40">
          <View className="bg-gray-200 rounded-2xl p-6 w-11/12 shadow-lg">
            <Text className="text-lg font-bold text-gray-800 mb-2">{t("limitDetailsTitle")}</Text>
            <Text className="text-sm text-gray-700 mb-1">• {t("limitMaxTransaction")}</Text>
            <Text className="text-sm text-gray-700 mb-1">• {t("limitMaxDaily")}</Text>
            <Text className="text-sm text-gray-700 mb-1">• {t("limitMaxMonthly")}</Text>

            <TouchableOpacity
              className="mt-4 bg-green-500 px-4 py-2 rounded-lg self-end"
              onPress={() => setIsLimitModalVisible(false)}
            >
              <Text className="text-white font-semibold">{t("close")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

        <StatusBar backgroundColor="#7ddd7d" style="light" />
    </View>
  );
};

export default CardSettingsScreen;
