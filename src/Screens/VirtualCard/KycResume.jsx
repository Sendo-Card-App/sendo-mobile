import { View, Text, TouchableOpacity, Image, FlatList } from "react-native";
import React from "react";
import TopLogo from "../../images/TopLogo.png";
import {
  AntDesign,
  Entypo,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

const KycResume = ({ navigation }) => {
  const Data = [
    {
      id: "1",
      name: "Détails personnels",
      route: "PersonalDetail",
    },
    {
      id: "2",
      name: "Selﬁe",
      route: "KycSelfie",
    },
    {
      id: "3",
      name: "Pièce d’identité",
      route: "IdentityCard",
    },
    {
      id: "4",
      name: "NIU (Contribuable)",
      route: "NIU",
    },
    {
      id: "5",
      name: "Adresse",
      route: "Addresse",
    },
  ];
  const KycOption = (props) => {
    return (
      <TouchableOpacity
        className="bg-[#ededed] py-2 px-4 my-2 rounded-2xl flex-row items-center gap-3"
        onPress={() => navigation.navigate(props.route)}
      >
        <MaterialCommunityIcons name="progress-clock" size={24} color="black" />
        <View className="flex-1">
          <Text className="text-gray-800 font-bold">{props.name}</Text>
          <Text className="text-sm">En attente d’informations</Text>
        </View>
        <Entypo name="chevron-small-right" size={24} color="gray" />
      </TouchableOpacity>
    );
  };
  return (
    <View className="bg-[#181e25] flex-1 pt-0 relative">
      {/* The top logo in center of the screen */}
      <View className="absolute -top-12 left-0 right-0 items-center justify-center ">
        <Image source={TopLogo} className=" h-36 w-40 " resizeMode="contain" />
      </View>

      {/* the top navigation with a back arrow and a right menu button */}
      <View className="border-b border-dashed border-white flex-row justify-between py-4 mt-10 items-center mx-5 pt-5">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="arrowleft" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.openDrawer()}
          className="ml-auto"
        >
          <Ionicons name="menu-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* the middle heading */}
      <View className="border border-dashed border-gray-300 my-1" />
      <Text className="text-center text-white text-2xl my-3">
        Vériﬁcation de l’identité
      </Text>

      {/* the white formsection of the screen */}
      <View className="flex-1 gap-6 py-3 bg-white px-8 rounded-t-3xl">
        {/* Top Heading */}
        <View className="my-5">
          <Text className="text-center text-gray-800 text-lg font-bold">
            Résumé de votre KYC
          </Text>
          <Text className="text-center text-gray-400 text-sm mt-5">
            Vous pouvez démarrer votre processus de vériﬁcation à partir de
            n’importe quelle étape
          </Text>
        </View>

        {/* Card display */}
        <FlatList
          data={Data}
          renderItem={({ item }) => <KycOption {...item} />}
        />
        {/* submit button */}
        <TouchableOpacity className="mt-auto bg-[#7ddd7d] py-3 rounded-full mb-8">
          <Text className="text-xl text-center font-bold ">SOUMETTRE</Text>
        </TouchableOpacity>
      </View>

      {/* the buttom message of the screen with a small shield icon */}
      <View className="py-4 flex-row justify-center items-center gap-2">
        <Ionicons name="shield-checkmark" size={18} color="orange" />
        <Text className="text-sm text-white">
          Ne partagez pas vos informations personnelles…
        </Text>
      </View>

      <StatusBar style="light" />
    </View>
  );
};

export default KycResume;
