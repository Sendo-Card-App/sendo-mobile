import React from 'react';
<<<<<<< Updated upstream
import { View, Text, TouchableOpacity, Image, FlatList } from "react-native";
import { useSelector } from 'react-redux';
=======
import { View, Text, TouchableOpacity, Image, FlatList, Alert } from "react-native";
import { useSelector, useDispatch } from 'react-redux';
>>>>>>> Stashed changes
import { useSubmitKYCMutation, useSendSelfieMutation } from '../../services/Kyc/kycApi';
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { StatusBar } from "expo-status-bar";
import Loader from "../../components/Loader";
import TopLogo from "../../images/TopLogo.png";
import { AntDesign, Entypo, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
<<<<<<< Updated upstream

const KycResume = ({ navigation }) => {
  const [submitKYC, { isLoading: isSubmittingKYC }] = useSubmitKYCMutation();
  const [sendSelfie, { isLoading: isSendingSelfie }] = useSendSelfieMutation();
  const { personalDetails, selfie, identityDocument, niuDocument, addressProof } = useSelector(state => state.kyc);
  
  const Data = [
    { id: "1", name: "Détails personnels", route: "PersonalDetail", completed: !!personalDetails.profession && !!personalDetails.region },
    { id: "2", name: "Selﬁe", route: "KycSelfie", completed: !!selfie },
    { id: "3", name: "Pièce d'identité", route: "IdentityCard", completed: !!identityDocument.front && (identityDocument.type !== 'cni' || !!identityDocument.back) },
=======
import { selectIsKYCComplete, selectAllDocuments, setSubmissionStatus } from '../../features/Kyc/kycReducer';
import * as ImageManipulator from 'expo-image-manipulator';

const KycResume = ({ navigation }) => {
  const dispatch = useDispatch();
  const [submitKYC] = useSubmitKYCMutation();
  const [sendSelfie] = useSendSelfieMutation(); 
  const { personalDetails, selfie, identityDocument, niuDocument, addressProof, submissionStatus } = useSelector(state => state.kyc);
  const isKYCComplete = useSelector(selectIsKYCComplete);
  
  const Data = [
    { id: "1", name: "Détails personnels", route: "PersonalDetail", 
      completed: !!personalDetails.profession && !!personalDetails.region && !!personalDetails.city && !!personalDetails.district },
    { id: "2", name: "Selfie", route: "KycSelfie", completed: !!selfie },
    { id: "3", name: "Pièce d'identité", route: "IdentityCard", 
      completed: !!identityDocument.front && (identityDocument.type !== 'cni' || !!identityDocument.back) },
>>>>>>> Stashed changes
    { id: "4", name: "NIU (Contribuable)", route: "NIU", completed: !!niuDocument },
    { id: "5", name: "Justificatif de domicile", route: "Addresse", completed: !!addressProof },
  ];

<<<<<<< Updated upstream
  const allStepsCompleted = Data.every(item => item.completed);
  const isLoading = isSubmittingKYC || isSendingSelfie;
=======
  console.log(submissionStatus)
 
  const compressImage = async (uri) => {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      return result.uri;
    } catch (error) {
      console.error('Image compression failed:', error);
      return uri; // Fallback to original if compression fails
    }
  };
>>>>>>> Stashed changes

  const handleSubmit = async () => {
    if (!allStepsCompleted) {
      Toast.show({
        type: 'error',
        text1: 'Incomplet',
        text2: 'Veuillez compléter toutes les étapes avant de soumettre'
      });
      return;
    }
  
<<<<<<< Updated upstream
    try {
      // First send the selfie to the specific endpoint
      if (selfie?.uri) {
        const selfieFormData = new FormData();
        
        // Match exactly what the backend expects
        selfieFormData.append('picture', {
          uri: selfie.uri,
          name: `selfie_${Date.now()}.jpg`, 
          type: 'image/jpeg'
        });
  
        // Send selfie with proper error handling
        const selfieResponse = await sendSelfie(selfieFormData).unwrap();
        
        if (!selfieResponse || selfieResponse.status !== 201) {
          throw new Error(selfieResponse?.message || 'Échec de l\'envoi du selfie');
        }
      } else {
        throw new Error('Aucun selfie fourni');
      }
  
      // Then submit the rest of KYC documents
      const kycFormData = new FormData();
      
      // Add personal details
      kycFormData.append('profession', personalDetails.profession || '');
      kycFormData.append('region', personalDetails.region || '');
      kycFormData.append('city', personalDetails.city || '');
      kycFormData.append('district', personalDetails.district || '');
  
      // Add other documents (excluding selfie)
      const processDocument = (doc, fieldName) => {
        if (doc?.uri) {
          kycFormData.append('documents', {
            uri: doc.uri,
            name: `${fieldName}.jpg`,
            type: 'image/jpeg'
          });
        }
      };
  
      processDocument(identityDocument.front, 'identity_front');
      if (identityDocument.type === 'cni') {
        processDocument(identityDocument.back, 'identity_back');
=======
    dispatch(setSubmissionStatus('loading'));
  
    try {
      // Create form data
      const formData = new FormData();
      
      // Add personal details
      formData.append('profession', personalDetails.profession);
      formData.append('region', personalDetails.region);
      formData.append('city', personalDetails.city);
      formData.append('district', personalDetails.district);
  
      // Upload selfie separately if it exists
      if (selfie) {
        const compressedSelfieUri = await compressImage(selfie.uri);
        const selfieFormData = new FormData();
        selfieFormData.append('picture', {
          uri: compressedSelfieUri,
          name: `picture_${Date.now()}.jpg`,
          type: 'image/jpeg'
        });
        await sendSelfie(selfieFormData).unwrap();
      }
  
      // Helper function to add compressed documents with type
      const addDocumentWithType = async (doc, type) => {
        if (!doc) return;
        const compressedUri = await compressImage(doc.uri);
        formData.append('documents', {
          uri: compressedUri,
          name: `${type.toLowerCase()}_${Date.now()}.jpg`,
          type: 'image/jpeg'
        });
        formData.append('types', type);
      };
  
      // Add mandatory documents with their types
      await Promise.all([
        addDocumentWithType(identityDocument.front, 'ID_PROOF'),
        identityDocument.type === 'cni' && addDocumentWithType(identityDocument.back, 'ID_PROOF'),
        addDocumentWithType(niuDocument, 'NIU_PROOF'),
        addDocumentWithType(addressProof, 'ADDRESS_PROOF')
      ]);
  
      // Submit KYC with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 30000) // 30s timeout
      );
  
      const response = await Promise.race([
        submitKYC(formData).unwrap(),
        timeoutPromise
      ]);
  
      if (response.status === 201) {
        navigation.navigate('Success', {
          message: 'Votre KYC a été soumis avec succès',
          nextScreen: 'Main'
        });
>>>>>>> Stashed changes
      }
      processDocument(niuDocument, 'niu_document');
      processDocument(addressProof, 'address_proof');
  
      // Submit KYC
      const kycResponse = await submitKYC(kycFormData).unwrap();
  
      // Handle success
      Toast.show({
        type: 'success',
        text1: 'KYC complet',
        text2: kycResponse.message || 'Votre KYC a été soumis avec succès'
      });
      
      navigation.navigate('Success', { 
        message: 'Votre KYC a été soumis avec succès',
        nextScreen: 'Home' 
      });
  
    } catch (error) {
      console.error('KYC submission error:', error);
<<<<<<< Updated upstream
      
      let errorMessage = 'Échec de la soumission du KYC';
      if (error.status === 400) {
        errorMessage = error.data?.message || 'Données manquantes ou invalides';
      } else if (error.status === 500) {
        errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
      } else if (error.message) {
        errorMessage = error.message;
=======
      let errorMessage = 'Échec de la soumission du KYC';
  
      if (error.message === 'Request timeout') {
        errorMessage = "La requête a pris trop de temps. Veuillez vérifier votre connexion et réessayer.";
      } else if (error?.data?.message?.includes('Aucun fichier fourni')) {
        errorMessage = `Documents requis: ${error.data.data.required.mandatoryTypes.join(', ')}`;
      } else if (error?.data?.code) {
        const errorCodes = {
          'ERR_MISSING': 'Veuillez remplir tous les champs obligatoires',
          'ERR_FORMAT': 'Le format de certaines données est incorrect',
          'ERR_UPLOAD': 'Échec du téléchargement des documents',
          'ERR_TECH': 'Une erreur technique est survenue'
        };
        errorMessage = errorCodes[error.data.code] || errorMessage;
>>>>>>> Stashed changes
      }
  
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: errorMessage
      });
    }
  };
  

  // ... rest of your component remains the same ...
  const KycOption = (props) => (
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

  return (
    <View className="bg-[#181e25] flex-1 pt-0 relative">
      {/* Header and logo */}
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
      <Text className="text-center text-white text-2xl my-3">Vériﬁcation de l'identité</Text>

      <View className="flex-1 gap-6 py-3 bg-white px-8 rounded-t-3xl">
        <View className="my-5">
          <Text className="text-center text-gray-800 text-lg font-bold">Résumé de votre KYC</Text>
          <Text className="text-center text-gray-400 text-sm mt-5">
            Vous pouvez démarrer votre processus de vériﬁcation à partir de n'importe quelle étape
          </Text>
        </View>

        <FlatList
          data={Data}
          renderItem={({ item }) => <KycOption {...item} />}
          keyExtractor={item => item.id}
        />
        
        <TouchableOpacity 
          className={`mt-auto py-3 rounded-full mb-8 ${allStepsCompleted ? 'bg-[#7ddd7d]' : 'bg-gray-400'}`}
          onPress={handleSubmit}
          disabled={!allStepsCompleted || isLoading}
        >
          {isLoading ? (
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
        <Text className="text-sm text-white">Ne partagez pas vos informations personnelles…</Text>
      </View>

      <StatusBar style="light" />
      <Toast />
    </View>
  );
};

export default KycResume;