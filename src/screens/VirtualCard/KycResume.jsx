import React from 'react';
import { View, Text, TouchableOpacity, Image, FlatList, Alert } from "react-native";
import { useSelector } from 'react-redux';
import { useSubmitKYCMutation } from '../../services/VirtualCard/kycSlice';
import TopLogo from "../../images/TopLogo.png";
import {
  AntDesign,
  Entypo,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

const KycResume = ({ navigation }) => {
  const [submitKYC, { isLoading }] = useSubmitKYCMutation();
  const { 
    personalDetails, 
    selfie, 
    identityDocument, 
    niuDocument, 
    addressProof 
  } = useSelector(state => state.kyc);
  
  const Data = [
    {
      id: "1",
      name: "Détails personnels",
      route: "PersonalDetail",
      completed: !!personalDetails.fullName && !!personalDetails.phoneNumber,
    },
    {
      id: "2",
      name: "Selﬁe",
      route: "KycSelfie",
      completed: !!selfie,
    },
    {
      id: "3",
      name: "Pièce d'identité",
      route: "IdentityCard",
      completed: !!identityDocument.front && 
               (identityDocument.type !== 'cni' || !!identityDocument.back),
    },
    {
      id: "4",
      name: "NIU (Contribuable)",
      route: "NIU",
      completed: !!niuDocument,
    },
    {
      id: "5",
      name: "Adresse",
      route: "Addresse",
      completed: !!addressProof,
    },
  ];

  const allStepsCompleted = Data.every(item => item.completed);

  const handleSubmit = async () => {
    if (!allStepsCompleted) {
      Alert.alert(
        'Incomplet',
        'Veuillez compléter toutes les étapes avant de soumettre',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      const kycData = {
        personalDetails,
        selfie,
        identityDocument,
        niuDocument,
        addressProof
      };
      
      await submitKYC(kycData).unwrap();
      navigation.navigate('Success', { 
        message: 'Votre KYC a été soumis avec succès',
        nextScreen: 'Home' 
      });
    } catch (error) {
      Alert.alert(
        'Erreur',
        error.data?.message || error.error || 'Échec de la soumission du KYC',
        [{ text: 'OK' }]
      );
    }
  };

  const KycOption = (props) => {
    return (
      <TouchableOpacity
        className={`py-2 px-4 my-2 rounded-2xl flex-row items-center gap-3 ${props.completed ? 'bg-green-100' : 'bg-[#ededed]'}`}
        onPress={() => navigation.navigate(props.route)}
      >
        <MaterialCommunityIcons 
          name={props.completed ? "check-circle" : "progress-clock"} 
          size={24} 
          color={props.completed ? "green" : "black"} 
        />
        <View className="flex-1">
          <Text className="text-gray-800 font-bold">{props.name}</Text>
          <Text className="text-sm">
            {props.completed ? 'Complété' : 'En attente d\'informations'}
          </Text>
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
        Vériﬁcation de l'identité
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
            n'importe quelle étape
          </Text>
        </View>

        {/* Card display */}
        <FlatList
          data={Data}
          renderItem={({ item }) => <KycOption {...item} />}
          keyExtractor={item => item.id}
        />
        
        {/* submit button */}
        <TouchableOpacity 
          className={`mt-auto py-3 rounded-full mb-8 ${allStepsCompleted ? 'bg-[#7ddd7d]' : 'bg-gray-400'}`}
          onPress={handleSubmit}
          disabled={!allStepsCompleted || isLoading}
        >
          <Text className="text-xl text-center font-bold ">
            {isLoading ? 'TRAITEMENT...' : 'SOUMETTRE'}
          </Text>
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