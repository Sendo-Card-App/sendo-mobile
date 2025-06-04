import {
  View,
  Text,
  Image,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import React from "react";
import Card from "../../images/VirtualCard.png";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from 'react-i18next';

const CreateVirtualCard = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  
  return (
    <SafeAreaView className="pt-4 flex-1 pb-5 ">
      <Image
        source={Card}
        className="w-full h-[400px] rotate-90 mt-14"
        resizeMode="contain"
      />

      <View className="border-t border-dashed border-gray-400 flex-1 mt-4 mx-6 px-2 pt-4">
        <View className="flex-row justify-between items-center">
          <Text className="text-gray-400">{t('virtual_card.card_price')}</Text>
          <Text className="font-bold text-gray-700">0 XAF</Text>
        </View>
        <View className="flex-row justify-between items-center mt-2">
          <Text className="font-bold text-gray-700">{t('virtual_card.total')}</Text>
          <Text className="font-bold text-gray-700">0.00 XAF</Text>
        </View>

        <TouchableOpacity
          className="my-auto bg-[#7ddd7d] py-3 rounded-full"
          onPress={() => navigation.navigate("VerifyIdentity")}
        >
          <Text className="text-xl text-center font-bold">
            {t('virtual_card.create_now')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default CreateVirtualCard;