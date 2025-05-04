import { View, Text, Image, TouchableOpacity, Dimensions } from "react-native";
import React from "react";
import TopLogo from "../../images/TopLogo.png";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import IDShoot from "../../images/IDShoot.png";
import KycTab from "../../components/KycTab";
import { useDispatch } from 'react-redux';
import { setSelfie } from '../../features/Kyc/kycReducer';

const KycSelfie = ({ navigation }) => {
  const { width } = Dimensions.get("screen");
  const dispatch = useDispatch();
  
  const handleNext = () => {
    navigation.navigate("Camera", { 
      purpose: 'selfie',
      onCapture: (image) => {
        dispatch(setSelfie(image));
        navigation.navigate("KycResume");
      }
    });
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
      <Text className="text-center text-white text-2xl my-3">
        Vériﬁcation de l'identité
      </Text>

      {/* the white formsection of the screen */}
      <View className="flex-1 pb-3 overflow-hidden bg-white rounded-t-3xl items-center">
        {/* ========= Top tab */}
        <KycTab isActive="2" />
        
        {/*==================== Headings */}
        <Text className="font-bold text-gray-800 mt-3">Selﬁe</Text>
        <Text className="text-center text-gray-400 text-sm">
          Prenez une photo de vous et votre carte d'identité
        </Text>
        
        {/* ==========image */}
        <Image
          source={IDShoot}
          className="w-[80%] mx-auto mt-2"
          style={{ height: width / 1.77 }}
          resizeMode="center"
        />

        <Text className="font-bold text-gray-800 my-3 text-center mx-6">
          Comment prendre une photo de vous avec Votre carte d'identité ?
        </Text>
        
        {/* =========== gray text */}
        <View className="w-[89%] mx-auto px-6">
          <Text className="text-gray-400 my-1">
            • Prenez la photo dans une pièce suﬃsamment éclairée.
          </Text>
          <Text className="text-gray-400 my-1">
            • Tenez le document à côté de votre visage, comme dans l'image
            ci-dessus.
          </Text>
          <Text className="text-gray-400 my-1">
            • Assurez-vous que votre visage et votre carte d'identité sont bien
            visibles sur la photo. Rien sur la carte d'identité ne doit être
            couvert.
          </Text>
        </View>

        {/* ============ submit button */}
        <TouchableOpacity
          className="mb-2 mt-auto bg-[#7ddd7d] py-3 rounded-full w-[85%] mx-auto"
          onPress={handleNext}
        >
          <Text className="text-xl text-center font-bold ">SUIVANT</Text>
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

export default KycSelfie;