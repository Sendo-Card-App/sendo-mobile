import React from 'react';
import { View, Text, TouchableOpacity, Image, FlatList, Alert } from "react-native";
import { useSelector, useDispatch } from 'react-redux';
import { useSubmitKYCMutation } from '../../services/Kyc/kycApi';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { StatusBar } from "expo-status-bar";
import Loader from "../../components/Loader";
import TopLogo from "../../images/TopLogo.png";
import { AntDesign, Entypo, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { selectIsKYCComplete, selectAllDocuments, setSubmissionStatus } from '../../features/Kyc/kycReducer';

const KycResume = ({ navigation }) => {
  const dispatch = useDispatch();
  const [submitKYC] = useSubmitKYCMutation();
  const { personalDetails, selfie, identityDocument, niuDocument, addressProof, submissionStatus } = useSelector(state => state.kyc);
  const isKYCComplete = useSelector(selectIsKYCComplete);
  const allDocuments = useSelector(selectAllDocuments);
  
  const Data = [
    { id: "1", name: "Détails personnels", route: "PersonalDetail", completed: !!personalDetails.profession && !!personalDetails.region },
    { id: "2", name: "Selfie", route: "KycSelfie", completed: !!selfie },
    { id: "3", name: "Pièce d'identité", route: "IdentityCard", completed: !!identityDocument.front && (identityDocument.type !== 'cni' || !!identityDocument.back) },
    { id: "4", name: "NIU (Contribuable)", route: "NIU", completed: !!niuDocument },
    { id: "5", name: "Adresse", route: "Addresse", completed: !!addressProof },
  ];

  const handleSubmit = async () => {
    if (!isKYCComplete) {
      Toast.show({
        type: 'error',
        text1: 'Incomplet',
        text2: 'Veuillez compléter toutes les étapes avant de soumettre'
      });
      return;
    }

    dispatch(setSubmissionStatus('loading'));
    
    try {
      const formData = new FormData();
      
      // Add personal details
      formData.append('profession', personalDetails.profession);
      formData.append('region', personalDetails.region);
      formData.append('city', personalDetails.city);
      formData.append('district', personalDetails.district);

      // Add all documents
      allDocuments.forEach(doc => {
        formData.append(doc.documentType.toLowerCase(), {
          uri: doc.uri,
          name: doc.name || `document_${Date.now()}.jpg`,
          type: doc.type || 'image/jpeg'
        });
      });

      const response = await submitKYC(formData).unwrap();
      
      if (response.status === 201) {
        Toast.show({
          type: 'success',
          text1: 'Succès',
          text2: response.message || 'KYC soumis avec succès'
        });
        navigation.navigate('Success', {
          message: 'Votre KYC a été soumis avec succès',
          nextScreen: 'Home'
        });
      }
    } catch (error) {
      console.error('KYC submission error:', error);
      let errorMessage = 'Échec de la soumission du KYC';
      
      if (error.data?.errors) {
        errorMessage = error.data.errors.map(err => err.msg).join('\n');
      } else if (error.data?.message) {
        errorMessage = error.data.message;
      }
      
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: errorMessage,
        visibilityTime: 5000
      });
    } finally {
      dispatch(setSubmissionStatus('idle'));
    }
  };

  const KycOption = ({ id, name, route, completed }) => (
    <TouchableOpacity
      className={`py-2 px-4 my-2 rounded-2xl flex-row items-center gap-3 ${completed ? 'bg-green-100' : 'bg-[#ededed]'}`}
      onPress={() => navigation.navigate(route)}
    >
      <MaterialCommunityIcons 
        name={completed ? "check-circle" : "progress-clock"} 
        size={24} 
        color={completed ? "green" : "black"} 
      />
      <View className="flex-1">
        <Text className="text-gray-800 font-bold">{name}</Text>
        <Text className="text-sm">
          {completed ? 'Complété' : 'En attente'}
        </Text>
      </View>
      <Entypo name="chevron-small-right" size={24} color="gray" />
    </TouchableOpacity>
  );

  return (
    <View className="bg-[#181e25] flex-1 pt-0 relative">
      {/* Header */}
      <View className="absolute -top-12 left-0 right-0 items-center justify-center">
        <Image source={TopLogo} className="h-36 w-40" resizeMode="contain" />
      </View>

      <View className="border-b border-dashed border-white flex-row justify-between py-4 mt-10 items-center mx-5 pt-5">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="arrowleft" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.openDrawer()} className="ml-auto">
          <Ionicons name="menu-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View className="border border-dashed border-gray-300 my-1" />
      <Text className="text-center text-white text-2xl my-3">Vérification de l'identité</Text>

      <View className="flex-1 gap-6 py-3 bg-white px-8 rounded-t-3xl">
        <View className="my-5">
          <Text className="text-center text-gray-800 text-lg font-bold">Résumé de votre KYC</Text>
          <Text className="text-center text-gray-400 text-sm mt-5">
            Complétez toutes les étapes pour finaliser votre vérification
          </Text>
        </View>

        <FlatList
          data={Data}
          renderItem={({ item }) => <KycOption {...item} />}
          keyExtractor={item => item.id}
        />
        
        <TouchableOpacity 
          className={`mt-auto py-3 rounded-full mb-8 ${isKYCComplete ? 'bg-[#7ddd7d]' : 'bg-gray-400'}`}
          onPress={handleSubmit}
          disabled={!isKYCComplete || submissionStatus === 'loading'}
        >
          {submissionStatus === 'loading' ? (
            <View className="flex-row justify-center items-center">
              <Loader size="small" color="white" />
            </View>
          ) : (
            <Text className="text-xl text-center font-bold">SOUMETTRE</Text>
          )}
        </TouchableOpacity>
      </View>

      <View className="py-4 flex-row justify-center items-center gap-2">
        <Ionicons name="shield-checkmark" size={18} color="orange" />
        <Text className="text-sm text-white">Ne partagez pas vos informations personnelles</Text>
      </View>

      <StatusBar style="light" />
      <Toast />
    </View>
  );
};

export default KycResume;