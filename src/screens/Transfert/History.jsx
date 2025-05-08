import { View, Text, FlatList, Image, TouchableOpacity } from "react-native";
import React from "react";
import OrangeMoney from "../../images/om.png";
import { useNavigation } from "@react-navigation/native";

const HistoryCard = () => {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      onPress={() => navigation.navigate("Receipt")}
      className="border p-4 mx-5 my-2 rounded-3xl border-gray-500"
    >
      <View className="border-b border-gray-500 pb-2 flex-row gap-2">
        {/* image here */}
        <Image source={OrangeMoney} className="w-10 h-10" />
        <View>
          <Text className="text-gray-600 text-sm">De : +237 600 00 00 00</Text>
          <Text className="text-gray-600 text-sm font-bold">TRANSFERT</Text>
        </View>
      </View>
      <View className="flex-row justify-between items-center pt-2">
        <Text className="text-gray-600 text-lg font-bold">43 909,64 FCFA</Text>
        <Text className="text-gray-600 text-sm">21/12/2024 à 10:18</Text>
      </View>
    </TouchableOpacity>
  );
};

const History = () => {
  return (
    <FlatList
      ListHeaderComponent={() => (
        <Text className="text-center pt-4 pb-5 font-bold text-xl text-gray-500 ">
          Mes transactions
        </Text>
      )}
      ListFooterComponent={() => <View className="py-2" />}
      data={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
      renderItem={() => <HistoryCard />}
    />
  );
};

export default History;
