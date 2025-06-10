import { View, Text, TouchableOpacity, Image } from "react-native";
import React from "react";
import { StatusBar } from "expo-status-bar";
import AntDesign from "@expo/vector-icons/AntDesign";
import Ionicons from "@expo/vector-icons/Ionicons";
import ButtomLogo from "../../Images/ButtomLogo.png";
import { useNavigation, useRoute } from "@react-navigation/native";

const Success = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { message = 'Transaction effectuée avec succès', nextScreen = 'MainTabs' } = route.params || {};

  return (
    <View className="bg-[#181e25] flex-1 pt-0 relative">
      {/* the top navigation with a back arrow and a right menu button */}
      <View className="border-b border-dashed border-white flex-row justify-between py-4 mt-10 items-center mx-5 pt-5">
        <Image source={ButtomLogo} className="h-11 w-40" />
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* the white formsection of the screen */}
      <View className="flex-1 gap-6 py-3 bg-white px-8 rounded-t-3xl mt-14 items-center justify-center">
        <View className="flex-1 items-center justify-center">
          <AntDesign name="checkcircleo" size={260} color={"#7ddd7d"} />
          <Text className="text-[#7ddd7d] text-2xl font-bold text-center w-[240px] mt-6">
            {message}
          </Text>
        </View>
        {/* Top security message */}

        <Text className="text-center text-gray-400 text-sm">
          Appuyez sur OK pour continuer
        </Text>

        {/* the button suivant */}
        <TouchableOpacity
          className="mb-5 bg-[#7ddd7d] py-3 rounded-full w-full"
          onPress={() => navigation.navigate(nextScreen)}
        >
          <Text className="text-xl text-center font-bold ">OK</Text>
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

export default Success;