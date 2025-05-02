import { View, Text } from "react-native";
import React from "react";
import { StatusBar } from "expo-status-bar";

const Support = () => {
  return (
    <View className="flex-1 pt-6">
      <Text className="text-center font-bold text-gray-400 text-sm">
        Une aide est disponible via l’un des canaux suivants:
      </Text>
      <View className="bg-gray-200 p-3 px-6 mt-3 rounded-lg">
        <Text className="text-gray-900 font-bold text-xl">FAQ</Text>
        <Text className="text-gray-600 ">Questions fréquentes</Text>
      </View>
      {/*  */}
      <View className="px-6 mt-3 rounded-lg">
        <Text className="text-gray-900 font-bold">
          E-mail supportsendo@sf-e.ca
        </Text>
        <Text className="text-gray-600 ">Pour une réponse plus rapide</Text>
      </View>
      {/*  */}
      <View className="bg-gray-200 p-3 px-6 mt-3 rounded-lg">
        <Text className="text-gray-900 font-bold">Appel 581 900 2096</Text>
        <Text className="text-gray-600 ">24/24 et 7 jours sur 7</Text>
      </View>
      <View className="p-6 gap-3">
        <Text className="text-gray-600">
          Si vous ne pouvez pas nous contacter par téléphone, veuillez nous
          envoyer un email à supportsendo@sf-e.ca
        </Text>

        <Text className="text-gray-600">
          Si vous souhaitez demander la suppression des informations relatives à
          votre compte, veuillez nous envoyer un email à supportsendo@sf-e.ca
        </Text>

      </View>
      <StatusBar  backgroundColor="#7ddd7d"/>
    </View>
  );
};

export default Support;
