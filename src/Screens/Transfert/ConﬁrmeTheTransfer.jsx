import { View, Text, TouchableOpacity, Image, TextInput } from "react-native";
import React from "react";
import { StatusBar } from "expo-status-bar";
import AntDesign from "@expo/vector-icons/AntDesign";
import Entypo from "@expo/vector-icons/Entypo";
import Ionicons from "@expo/vector-icons/Ionicons";
import TopLogo from "../../Images/TopLogo.png";
import { useNavigation } from "@react-navigation/native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import RoyalBank from "../../Images/RoyalBank.png";
import Visa from "../../Images/Visa.png";

const ConﬁrmeTheTransfer = () => {
  const navigation = useNavigation();

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
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* the middle heading */}
      <Text className="text-center text-white text-2xl my-3">
        Conﬁrmez le transfert
      </Text>

      {/* the white formsection of the screen */}
      <View className="flex-1 gap-2 py-3 bg-white px-8 rounded-t-3xl">
        <View className="border-b border-dashed py-5 border-gray-400">
          <View className="flex-row justify-between">
            <Text className="text-gray-400 text-sm">Visa ..2477</Text>
            <Text className="text-gray-400 text-sm">100,00 CAD</Text>
          </View>

          {/*  */}
          <View className="flex-row justify-between">
            <Text className="text-gray-400 text-sm">Frais de transfert</Text>
            <Text className="text-gray-400 text-sm">0,00 CAD</Text>
          </View>

          {/*  */}
          <View className="flex-row justify-between">
            <Text className="text-gray-400 text-sm">Total envoyé</Text>
            <Text className="text-gray-400 text-sm">100,00 CAD</Text>
          </View>
        </View>

        <View className="flex-row gap-3 mb-2 items-center border-b border-dashed border-gray-400 pb-2">
          <Text className="text-[#181e25] font-extrabold text-base">
            CODE PROMO <Text className="text-red-600 text-lg">*</Text>
          </Text>

          <TextInput
            className="border rounded-2xl border-gray-400 flex-1 py-3.5 pl-2"
            keyboardType="default"
          />

          <TouchableOpacity
            className="bg-[#7ddd7d] py-1 px-5 rounded-full"
            onPress={() => navigation.navigate("Success")}
          >
            <Text className="text-xl text-center font-bold ">ok</Text>
          </TouchableOpacity>
        </View>

        <View className="border-b border-dashed pb-2 border-gray-400 ">
          <View className="pl-4">
            <Text className="text-[#181e25] font-extrabold text-base">
              Bénéﬁciaire <Text className="text-red-600 text-lg">*</Text>
            </Text>

            <Text className="text-gray-400 text-sm">
              Service Financiers Étudiants
            </Text>
            <Text className="text-gray-400 text-sm">
              Numéro du compte : XXX XXX XXX XXX
            </Text>
            <Text className="text-gray-400 text-sm">
              Banque royale du Canada
            </Text>
          </View>

          <Image
            source={RoyalBank}
            className="h-20 w-[130px]"
            resizeMode="contain"
          />
        </View>

        <View className="border-b border-dashed pb-2 border-gray-400">
          <Text className="text-[#181e25] font-extrabold text-base">
            Méthode paiement <Text className="text-red-600 text-lg">*</Text>
          </Text>
          <View className="flex-row gap-2 mt-2 items-center">
            <Image
              source={Visa}
              className="w-[90px] h-[50px]"
              resizeMode="contain"
            />

            <View>
              <Text className="text-gray-400 text-sm">Visa …8787</Text>
              <Text className="text-gray-400 text-sm">Expire le juin 2025</Text>
            </View>
          </View>
        </View>
        {/* Top security message */}
        <View className="flex-row gap-2 justify-center items-center my-auto">
          <MaterialIcons name="timer" size={15} color="#acacac" />
          <Text className="text-center text-gray-400 text-sm font-bold">
            Votre transfert devrait passer d’ici quelques minutes.
          </Text>
        </View>
        {/* the button suivant */}
        <TouchableOpacity
          className="mb-5 bg-[#7ddd7d] py-3 rounded-full"
          onPress={() => navigation.navigate("Success")}
        >
          <Text className="text-xl text-center font-bold ">Envoyer</Text>
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

export default ConﬁrmeTheTransfer;
