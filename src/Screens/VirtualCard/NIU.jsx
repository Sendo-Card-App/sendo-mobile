import { View, Text, Image, TouchableOpacity, Dimensions } from "react-native";
import React from "react";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import TopLogo from "../../Images/TopLogo.png";

const NIU = ({ navigation }) => {
  const { width } = Dimensions.get("screen");
  
  return (
    <View className="bg-[#181e25] flex-1 pt-0 relative">
      {/* Top Navigation */}
      <View className="border-b border-dashed border-white flex-row justify-between py-4 mt-10 items-center mx-5 pt-5">
        <View className="absolute -top-12 left-0 right-0 items-center justify-center">
                <Image source={TopLogo} className=" h-36 w-40 " resizeMode="contain" />
              </View>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="arrowleft" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.openDrawer()} className="ml-auto">
          <Ionicons name="menu-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Title */}
       <View className="border border-dashed border-gray-300 my-1" />
      <Text className="text-center text-white text-2xl my-3">
        Vérification de l’identité
      </Text>

      {/* Form Section */}
      <View className="flex-1 pb-3 overflow-hidden bg-white rounded-t-3xl items-center">
        {/* Document Upload Instruction */}
        <Text className="font-bold text-gray-800 mt-3">N° Contribuable</Text>
        <Text className="text-center text-gray-400 text-sm">
          Téléchargez votre document de contribuable
        </Text>

        {/* Placeholder for Document Upload/Image */}
        <Image
          source={require("../../Images/DGI.png")} // Placeholder image
          className="w-[80%] mx-auto mt-2"
          style={{ height: width / 1.77 }}
          resizeMode="center"
        />

        {/* Instruction Text */}
        <Text className="font-bold text-gray-800 my-3 text-center mx-6">
         
        </Text>
        <View className="w-[89%] mx-auto px-8">
          <Text className="text-gray-400 my-1">Le numéro d'identification unique est une combinaison de lettres et de 
            chiffres attribuée aux contribuables. Ce numéro est essentiel pour identifier l'utilisateur en tant que contribuable.</Text>
        </View>

        {/* Next Button */}
        <TouchableOpacity
          className="mb-2 mt-auto bg-[#7ddd7d] py-3 rounded-full w-[85%] mx-auto"
          onPress={() => navigation.navigate("IdentityVerification")}
        >
          <Text className="text-xl text-center font-bold ">SUIVANT</Text>
        </TouchableOpacity>
      </View>

      {/* Privacy Reminder */}
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

export default NIU;