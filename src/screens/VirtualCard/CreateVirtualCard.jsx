import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import Card from "../../images/VirtualCard.png";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useGetConfigQuery } from '../../services/Config/configApi';
import { useCreateVirtualCardMutation } from "../../services/Card/cardApi";

const CreateVirtualCard = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const [name, setName] = useState("");

  const [createVirtualCard, { isLoading, isError, error }] = useCreateVirtualCardMutation();

  const {
    data: configData,
    isLoading: isConfigLoading,
    error: configError
  } = useGetConfigQuery();

  const getConfigValue = (key) => {
    const item = configData?.data?.find((c) => c.name === key);
    return item?.value ?? null;
  };

  const cardFees = getConfigValue("SENDO_CREATING_CARD_FEES");
  const isFirstCardFree = getConfigValue("IS_FREE_FIRST_CREATING_CARD") === "1";

  const displayedFees = isFirstCardFree ? "0 XAF" : `${cardFees} XAF`;
  const total = displayedFees;

  const handleCreateCard = async () => {
    if (!name.trim()) {
      alert(t('virtual_card.missing_name') || "Please enter your name");
      return;
    }
    try {
      await createVirtualCard({ name: name.trim() }).unwrap();
      alert(t('virtual_card.request_success') || "Request successful");
      navigation.navigate("VerifyIdentity");
    } catch (e) {
      alert(t('virtual_card.request_failed') || "Request failed");
      console.error(e);
    }
  };

  return (
    <SafeAreaView className="flex-1 pt-4 pb-5">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <Image
            source={Card}
            className="w-full h-[400px] rotate-90 mt-14"
            resizeMode="contain"
          />

          <View className="border-t border-dashed border-gray-400 flex-1 mt-4 mx-6 px-2 pt-4">

            {/* Input nom */}
            <TextInput
              placeholder={t('virtual_card.enter_name') || "Enter your full name"}
              value={name}
              onChangeText={setName}
              className="border border-gray-300 rounded-md px-3 py-4 mb-4 text-black"
              autoCapitalize="words"
              autoCorrect={false}
              editable={!isLoading}
            />

            {/* Frais de création */}
            <View className="flex-row justify-between items-center">
              <Text className="text-gray-400">{t('virtual_card.card_price')}</Text>
              <Text className="font-bold text-gray-700">
                {isConfigLoading ? "..." : displayedFees}
              </Text>
            </View>

            {/* Total */}
            <View className="flex-row justify-between items-center mt-2">
              <Text className="font-bold text-gray-700">{t('virtual_card.total')}</Text>
              <Text className="font-bold text-gray-700">
                {isConfigLoading ? "..." : total}
              </Text>
            </View>

            {/* Bouton créer carte */}
            <TouchableOpacity
              className="my-auto bg-[#7ddd7d] py-3 rounded-full"
              onPress={handleCreateCard}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text className="text-xl text-center font-bold">
                  {t('virtual_card.create_now')}
                </Text>
              )}
            </TouchableOpacity>

            {/* Erreur de requête */}
            {isError && (
              <Text className="text-red-600 mt-2 text-center">
                {error?.data?.message || t('virtual_card.error_message')}
              </Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default CreateVirtualCard;
