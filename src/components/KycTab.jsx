import { View, Text, FlatList, Dimensions } from "react-native";
import React from "react";

const KycTab = (props) => {
  const { width } = Dimensions.get("screen");
  const Data = [
    {
      id: "1",
      name: "Détails personnels",
    },
    {
      id: "2",
      name: "Selﬁe",
    },
    {
      id: "3",
      name: "Pièce d’identité",
      route: "",
    },
    {
      id: "4",
      name: "NIU (Contribuable)",
    },
    {
      id: "5",
      name: "Adresse",
    },
  ];
  return (
    <View className="pb-2 pt-3  w-full">
      <FlatList
        horizontal
        data={Data}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <View className="mx-2">
            <Text className="text-xs text-center">{item.name}</Text>
            <View
              className={`${
                props.isActive === item.id ? "bg-[#7ddd7d]" : "bg-gray-400"
              } py-1.5 rounded-lg mt-1`}
              style={{ width: width / 3.5 }}
            ></View>
          </View>
        )}
      />
    </View>
  );
};

export default KycTab;
