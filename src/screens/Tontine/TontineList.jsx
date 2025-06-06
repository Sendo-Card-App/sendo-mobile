import React from "react";
import {
  View,
  Text,
  Image,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ButtomLogo from "../../images/ButtomLogo.png";
import { useGetUserProfileQuery } from "../../services/Auth/authAPI";
import { useGetTontinesQuery,useGetTontineDetailsQuery } from "../../services/Tontine/tontineApi";
import { useSelector } from "react-redux";

export default function TontineListScreen({ navigation }) {
  const user = useSelector((state) => state.auth.user);
 
    const { data: userProfile, isLoading: profileLoading } = useGetUserProfileQuery();
    const userId = userProfile?.data?.id;

  const { data, isLoading, isError } = useGetTontinesQuery(userId, {
  skip: !userId,
});
  const { tontine } = useGetTontineDetailsQuery(userId, {
      skip: !userId,
    });
 // console.log("Tontine List:", JSON.stringify(data, null, 2));
  const tontines = data?.data?.items || [];

 const renderTontineItem = ({ item }) => (
  <TouchableOpacity
    key={item.id}
   className="bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-300"
    onPress={() =>
      navigation.navigate("TontineDetail", { tontineId: item.id })
    }
  >
    <Text className="text-black font-bold text-base mb-1">
      {item.nom}
    </Text>
    <Text className="text-xs text-gray-600">
      {item.membres?.map((m) => m.nom).join(", ") || ""}
    </Text>
    <View className="flex-row items-center mt-1">
      <Text className="text-xs font-semibold text-black">{item.role || "Membre"}</Text>
      <Text className="text-xs text-gray-400 mx-1">•</Text>
      <Text className="text-xs text-gray-500">{item.frequence}</Text>
    </View>
    <Ionicons
      name="chevron-forward"
      size={30}
      color="black"
      style={{ position: "absolute", right: 12, top: "50%" }}
    />
  </TouchableOpacity>
);


  return (
    <View className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="bg-green-400 pb-4 rounded-b-2xl">
        <View className="flex-row justify-between items-center px-4 pt-12">
          <Image
            source={ButtomLogo}
            resizeMode="contain"
            className="h-[40px] w-[120px]"
          />
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <Ionicons name="menu-outline" size={28} color="white" />
          </TouchableOpacity>
        </View>
          <View className="border border-dashed border-black-300 mt-2 mx-6" />
         
     
      </View>
        <View className="px-4 mt-6">
          <TouchableOpacity
            onPress={() => navigation.navigate("CreateTontine")}
            className="bg-green-600 py-4 rounded-full flex-row items-center justify-center"
          >
            <Ionicons name="add-circle-outline" size={20} color="white" />
            <Text className="text-white ml-2 font-semibold">
              Créer une nouvelle tontine
            </Text>
          </TouchableOpacity>
        </View>
      {/* Tontine List */}
      <View className="flex-1 px-4 mt-4">
        {isLoading ? (
          <ActivityIndicator size="large" color="green" className="mt-6" />
        ) : isError ? (
          <Text className="text-center text-red-500 mt-4">
            Une erreur est survenue.
          </Text>
        ) : tontines.length === 0 ? (
          <Text className="text-center mt-4 text-gray-500">
            Aucune tontine disponible.
          </Text>
        ) : (
          <FlatList
            data={tontines}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderTontineItem}
            contentContainerStyle={{ paddingBottom: 16 }}
          />
        )}
      </View>
    </View>
  );
}
