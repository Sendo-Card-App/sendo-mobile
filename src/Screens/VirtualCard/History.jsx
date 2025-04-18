import { View, Text, FlatList, Image } from "react-native";
import React from "react";
import OrangeMoney from "../../Images/om.png";
const HistoryCard = () => {
  return (
    <View className="border p-4 mx-5 my-2 rounded-3xl border-gray-500">
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
    </View>
  );
};
const History = () => {
  return (
    <FlatList
      ListHeaderComponent={() => (
        <Text className="text-center pt-4 pb-5 font-bold text-xl text-gray-500">
          Mes transactions
        </Text>
      )}
      ListFooterComponent={() => <View className="py-2" />}
      data={[1, 2, 3, 4, 5, 6]}
      renderItem={() => <HistoryCard />}
    />
  );
};

export default History;
