import React from 'react';
import { View, Text, TouchableOpacity, Image, FlatList, Alert } from "react-native";
import { useSelector, useDispatch } from 'react-redux';
import { useSubmitKYCMutation, useSendSelfieMutation, useUpdateProfileMutation } from '../../services/Kyc/kycApi';
import { useGetUserProfileQuery } from "../../services/Auth/authAPI";
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { StatusBar } from "expo-status-bar";
import Loader from "../../components/Loader";
import TopLogo from "../../images/TopLogo.png";
import { AntDesign, Entypo, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { selectIsKYCComplete, selectAllDocuments, setSubmissionStatus } from '../../features/Kyc/kycReducer';
import * as ImageManipulator from 'expo-image-manipulator';
import { useTranslation } from 'react-i18next';

const KycResume = ({ navigation }) => {
  const dispatch = useDispatch();
  const [submitKYC] = useSubmitKYCMutation();
  const [sendSelfie] = useSendSelfieMutation(); 
  const [updateProfile] = useUpdateProfileMutation();

  const { personalDetails, selfie, identityDocument, niuDocument, addressProof, submissionStatus } = useSelector(state => state.kyc);
  const isKYCComplete = useSelector(selectIsKYCComplete);
  const { t } = useTranslation();
  const { data: userProfile, isLoading: isProfileLoading, error: profileError } = useGetUserProfileQuery();

  //console.log("Tontine List:", JSON.stringify(userProfile, null, 2));

  const Data = [
    { id: "1", name: t('kyc_resume.personal_details'), route: "PersonalDetail", 
      completed: !!personalDetails.profession && !!personalDetails.region && !!personalDetails.city && !!personalDetails.district },
    { id: "2", name: t('kyc_resume.selfie'), route: "KycSelfie", completed: !!selfie },
    {
      id: "3",
      name: t('kyc_resume.id_document'),
      route: "IdentityCard",
      completed:
        !!identityDocument.front &&
        (
          identityDocument.type === 'passport' ||
          (identityDocument.type === 'cni' && !!identityDocument.back) ||
          (identityDocument.type === 'drivers_license' && !!identityDocument.back)
        )
    },

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
  if (!isKYCComplete) {
    Toast.show({
      type: 'error',
      text1: 'Incomplet',
      text2: 'Veuillez compléter toutes les étapes avant de soumettre',
    });
    return;
  }

  dispatch(setSubmissionStatus('loading'));

  try {
    const idDocumentNumber = personalDetails.cni;

    const profilePayload = {
      profession: personalDetails.profession,
      region: personalDetails.region,
      city: personalDetails.city,
      district: personalDetails.district,
    };

    // 1. Update profile
    await updateProfile(profilePayload).unwrap();

    const documents = [];
    const files = [];

    const addDocumentAndFile = async (doc, uri, index) => {
      documents.push(doc);
      const compressedUri = await compressImage(uri);
      const name = `file_${index + 1}.jpg`;

      files.push({
        uri: compressedUri,
        name,
        type: 'image/jpeg',
      });
    };

    let fileIndex = 0;

    // 2. ID_PROOF
    if (identityDocument.type === 'passport' && identityDocument.front) {
      // Duplicate the single passport file
      await addDocumentAndFile(
        { type: 'ID_PROOF', idDocumentNumber },
        identityDocument.front.uri,
        fileIndex++
      );
      await addDocumentAndFile(
        { type: 'ID_PROOF', idDocumentNumber },
        identityDocument.front.uri,
        fileIndex++
      );
    }

    if (identityDocument.type === 'cni' && identityDocument.front && identityDocument.back) {
      await addDocumentAndFile(
        { type: 'ID_PROOF', idDocumentNumber },
        identityDocument.front.uri,
        fileIndex++
      );
      await addDocumentAndFile(
        { type: 'ID_PROOF', idDocumentNumber },
        identityDocument.back.uri,
        fileIndex++
      );
    }

    if (identityDocument.type === 'drivers_license' && identityDocument.front && identityDocument.back) {
      await addDocumentAndFile(
        { type: 'ID_PROOF', idDocumentNumber },
        identityDocument.front.uri,
        fileIndex++
      );
      await addDocumentAndFile(
        { type: 'ID_PROOF', idDocumentNumber },
        identityDocument.back.uri,
        fileIndex++
      );
    }

    // 3. NIU_PROOF
    if (niuDocument?.document) {
      await addDocumentAndFile(
        { type: 'NIU_PROOF', taxIdNumber: niuDocument.taxIdNumber },
        niuDocument.document.uri,
        fileIndex++
      );
    }

    // 4. ADDRESS_PROOF
    if (addressProof) {
      await addDocumentAndFile(
        { type: 'ADDRESS_PROOF' },
        addressProof.uri,
        fileIndex++
      );
    }

    // 5. SELFIE
    if (selfie) {
      await addDocumentAndFile(
        { type: 'SELFIE' },
        selfie.uri,
        fileIndex++
      );
    }

    console.log('Documents to submit:', JSON.stringify(documents, null, 2));
    console.log('Files to upload:', files);

    if (documents.length !== 5 || files.length !== 5) {
      Toast.show({
        type: 'error',
        text1: 'Erreur de validation',
        text2: `5 documents et 5 fichiers sont requis. Actuellement: ${documents.length} doc(s), ${files.length} fichier(s)`,
        visibilityTime: 5000,
      });
      dispatch(setSubmissionStatus('idle'));
      return;
    }

    const formData = new FormData();
    formData.append('documents', JSON.stringify(documents));
    files.forEach(file => {
      formData.append('files', file);
    });

    console.log('FormData ready with 5 files and documents');

    const response = await submitKYC(formData).unwrap();

    console.log('KYC submission response:', JSON.stringify(response, null, 2));

    if (response?.status === 201) {
      navigation.navigate('Success', {
        message: 'Votre KYC a été soumis avec succès',
        nextScreen: 'MainTabs',
      });
    } else {
      Toast.show({
        type: 'error',
        text1: 'Échec',
        text2: 'Le serveur a répondu, mais la soumission a échoué.',
        visibilityTime: 5000,
      });
    }

  } catch (error) {
    console.error('KYC submission error:', JSON.stringify(error ?? {}, null, 2));
   Toast.show({
      type: 'error',
      text1: 'Erreur réseau ou serveur',
      text2: 
        error?.data?.data?.errors?.[0] ||  // detailed KYC message
        error?.data?.message ||             // fallback to general message
        'Une erreur est survenue',          // fallback generic message
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
       <TouchableOpacity onPress={() => navigation.navigate("MainTabs")}>
          <Ionicons name="arrow-back" size={24} color="white" />
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