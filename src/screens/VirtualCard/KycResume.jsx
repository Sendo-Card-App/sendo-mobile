import React from 'react';
import { View, Text, TouchableOpacity, Image, FlatList, Alert } from "react-native";
import { useSelector, useDispatch } from 'react-redux';
import { useSubmitKYCMutation, useSendSelfieMutation } from '../../services/Kyc/kycApi';
import { useGetUserProfileQuery } from "../../services/Auth/authAPI";
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { StatusBar } from "expo-status-bar";
import Loader from "../../components/Loader";
import TopLogo from "../../Images/TopLogo.png";
import { AntDesign, Entypo, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { selectIsKYCComplete, selectAllDocuments, setSubmissionStatus } from '../../features/Kyc/kycReducer';
import * as ImageManipulator from 'expo-image-manipulator';
import { useTranslation } from 'react-i18next';

const KycResume = ({ navigation }) => {
  const dispatch = useDispatch();
  const [submitKYC] = useSubmitKYCMutation();
  const [sendSelfie] = useSendSelfieMutation(); 
  const { personalDetails, selfie, identityDocument, niuDocument, addressProof, submissionStatus } = useSelector(state => state.kyc);
  const isKYCComplete = useSelector(selectIsKYCComplete);
  const { t } = useTranslation();
  const { data: userProfile, isLoading: isProfileLoading, error: profileError } = useGetUserProfileQuery();
    
  

  const Data = [
    { id: "1", name: t('kyc_resume.personal_details'), route: "PersonalDetail", 
      completed: !!personalDetails.profession && !!personalDetails.region && !!personalDetails.city && !!personalDetails.district },
    { id: "2", name: t('kyc_resume.selfie'), route: "KycSelfie", completed: !!selfie },
    { id: "3", name: t('kyc_resume.id_document'), route: "IdentityCard", 
      completed: !!identityDocument.front && (identityDocument.type !== 'cni' || !!identityDocument.back) },
    { id: "4", name: t('kyc_resume.niu_document'), route: "NIU", completed: !!niuDocument },
    { id: "5", name: t('kyc_resume.address_proof'), route: "Addresse", completed: !!addressProof },
  ];

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
      return uri;
    }
  };

  const handleSubmit = async () => {
    // First check if KYC is already verified
  if (userProfile?.data?.isVerifiedKYC) {
  Toast.show({
    type: 'success',
    text1: 'KYC Already Verified',
    text2: 'Your KYC documents have already been verified',
    visibilityTime: 3000,
    onHide: () => {
      Alert.alert(
        'Create Virtual Card?',
        'Would you like to create a virtual card now?',
        [
          {
            text: 'Not Now',
            style: 'cancel',
             onPress: () => navigation.navigate('MainTabs'),
          },
          {
            text: 'Create Vitual Card',
            onPress: () => navigation.navigate('CreateVirtualCard'),
          },
        ]
      );
    }
  });
  return;
}
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
      
      formData.append('profession', personalDetails.profession);
      formData.append('region', personalDetails.region);
      formData.append('city', personalDetails.city);
      formData.append('district', personalDetails.district);
  
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
  
      await Promise.all([
        addDocumentWithType(identityDocument.front, 'ID_PROOF'),
        identityDocument.type === 'cni' && addDocumentWithType(identityDocument.back, 'ID_PROOF'),
        addDocumentWithType(niuDocument, 'NIU_PROOF'),
        addDocumentWithType(addressProof, 'ADDRESS_PROOF')
      ]);
  
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 30000)
      );
  
      const response = await Promise.race([
        submitKYC(formData).unwrap(),
        timeoutPromise
      ]);
  
      if (response.status === 201) {
        navigation.navigate('Success', {
          message: 'Votre KYC a été soumis avec succès',
          nextScreen: 'MainTabs'
        });
      }
    } catch (error) {
      console.error('KYC submission error:', error);
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
          {completed ? t('kyc_resume.completed') : t('kyc_resume.pending')}
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
      <Text className="text-center text-white text-2xl my-3">
        {t('kyc_resume.identity_verification')}
      </Text>

      <View className="flex-1 gap-6 py-3 bg-white px-8 rounded-t-3xl">
        <View className="my-5">
          <Text className="text-center text-gray-800 text-lg font-bold">
            {t('kyc_resume.kyc_summary')}
          </Text>
          <Text className="text-center text-gray-400 text-sm mt-5">
            {t('kyc_resume.completion_hint')}
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
            <Text className="text-xl text-center font-bold">
              {t('kyc_resume.submit')}
            </Text>
          )}
        </TouchableOpacity>
      </View>
      

      <View className="py-4 flex-row justify-center items-center gap-2">
        <Ionicons name="shield-checkmark" size={18} color="orange" />
        <Text className="text-sm text-white">
          {t('kyc_resume.privacy_notice')}
        </Text>
      </View>
       
      <StatusBar style="light" />
      <Toast />
    </View>
  );
};
const styles = {
  floatingHomeButton: {
    position: 'absolute',
    top: StatusBar.currentHeight + 600,
    right: 20,
    zIndex: 999,
    backgroundColor: 'rgba(235, 248, 255, 0.9)',
    padding: 10,
    borderRadius: 20,
    elevation: 3,
    
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
 
};
export default KycResume;