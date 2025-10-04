// Enhanced KycResume component with proper error handling
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, FlatList, Alert, Animated } from "react-native";
import { useSelector, useDispatch } from 'react-redux';
import { useSubmitKYCMutation, useSendSelfieMutation, useUpdateProfileMutation } from '../../services/Kyc/kycApi';
import { useGetUserProfileQuery } from "../../services/Auth/authAPI";
import { useNavigation } from '@react-navigation/native';
import Toast from 'react-native-toast-message';
import { StatusBar } from "expo-status-bar";
import Loader from "../../components/Loader";
import TopLogo from "../../images/TopLogo.png";
import { AntDesign, Entypo, Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { 
  selectIsKYCComplete, 
  setSubmissionStatus, 
  resetFailedSubmission,
  setSubmissionError 
} from '../../features/Kyc/kycReducer';
import * as ImageManipulator from 'expo-image-manipulator';
import { useTranslation } from 'react-i18next';

const KycResume = ({ navigation }) => {
  const dispatch = useDispatch();
  const [submitKYC] = useSubmitKYCMutation();
  const [sendSelfie] = useSendSelfieMutation(); 
  const [updateProfile] = useUpdateProfileMutation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));

  const { personalDetails, selfie, identityDocument, niuDocument, addressProof, submissionStatus, error } = useSelector(state => state.kyc);
  const isKYCComplete = useSelector(selectIsKYCComplete);
  const { t } = useTranslation();

  // Pulse animation for incomplete sections
  useEffect(() => {
    if (!isKYCComplete) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isKYCComplete]);

  // Show error message if previous submission failed
  useEffect(() => {
    if (error) {
      Toast.show({
        type: 'error',
        text1: 'Échec de la soumission',
        text2: error,
        visibilityTime: 6000,
        onPress: () => dispatch(resetFailedSubmission())
      });
    }
  }, [error]);

  const Data = [
    { 
      id: "1", 
      name: t('kyc_resume.personal_details'), 
      route: "PersonalDetail", 
      completed: !!personalDetails.profession && 
                !!personalDetails.region && 
                !!personalDetails.city && 
                !!personalDetails.district &&
                !!personalDetails.cni,
      icon: "account-details"
    },
    { 
      id: "2", 
      name: t('kyc_resume.selfie'), 
      route: "KycSelfie", 
      completed: !!selfie,
      icon: "camera-front-variant"
    },
    {
      id: "3",
      name: t('kyc_resume.id_document'),
      route: "IdentityCard",
      completed: !!identityDocument.front &&
        (
          identityDocument.type === 'passport' ||
          (identityDocument.type === 'cni' && !!identityDocument.back) ||
          (identityDocument.type === 'drivers_license' && !!identityDocument.back)
        ),
      icon: "card-account-details"
    },
    { 
      id: "4", 
      name: t('kyc_resume.niu_document'), 
      route: "NIU", 
      completed: !!niuDocument,
      icon: "file-document"
    },
    { 
      id: "5", 
      name: t('kyc_resume.address_proof'), 
      route: "Addresse", 
      completed: !!addressProof,
      icon: "home-map-marker"
    },
  ];

  const incompleteCount = Data.filter(item => !item.completed).length;

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
    if (isSubmitting || !isKYCComplete) {
      Toast.show({
        type: 'error',
        text1: t('kyc_resume.incomplete_title'),
        text2: t('kyc_resume.incomplete_message'),
      });
      return;
    }

    setIsSubmitting(true);
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
      } else if (identityDocument.front && identityDocument.back) {
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

      console.log('Documents to submit:', documents.length);
      console.log('Files to upload:', files.length);

      if (documents.length !== 5 || files.length !== 5) {
        throw new Error(`5 documents and 5 files required. Currently: ${documents.length} doc(s), ${files.length} file(s)`);
      }

      const formData = new FormData();
      formData.append('documents', JSON.stringify(documents));
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await submitKYC(formData).unwrap();
    console.log('KYC submission response:', JSON.stringify(response, null, 2));
      if (response?.status === 201) {
        navigation.navigate('Success', {
          message: 'Votre KYC a été soumis avec succès',
          nextScreen: 'MainTabs',
        });
      } else {
        throw new Error('Server responded but submission failed');
      }

    } catch (error) {
      console.log('KYC submission error:', JSON.stringify(error, null, 2));
    
      dispatch(setSubmissionStatus('failed'));
      
      // Enhanced error extraction
      let errorMessage = t('kyc_resume.general_error');
      
      if (error?.data?.data?.errors?.[0]) {
        errorMessage = error.data.data.errors[0];
      } else if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      console.log('Extracted error message:', errorMessage);
      
      dispatch(setSubmissionError(errorMessage));
      
      // Show toast immediately
      Toast.show({
        type: 'error',
        text1: 'Échec',
        text2: errorMessage,
        visibilityTime: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const KycOption = ({ id, name, route, completed, icon }) => (
    <TouchableOpacity
      className={`py-4 px-4 my-2 rounded-2xl flex-row items-center gap-4 ${completed ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'}`}
      onPress={() => navigation.navigate(route)}
      style={{
        shadowColor: completed ? '#10b981' : '#f59e0b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
      }}
    >
      <View className={`p-2 rounded-full ${completed ? 'bg-green-100' : 'bg-orange-100'}`}>
        <MaterialCommunityIcons 
          name={icon} 
          size={22} 
          color={completed ? "green" : "orange"} 
        />
      </View>
      <View className="flex-1">
        <Text className="text-gray-800 font-bold text-base">{name}</Text>
        <Text className={`text-sm ${completed ? 'text-green-600' : 'text-orange-600'}`}>
          {completed ? t('kyc_resume.completed') : t('kyc_resume.pending')}
        </Text>
      </View>
      <View className={`p-1 rounded-full ${completed ? 'bg-green-500' : 'bg-orange-500'}`}>
        <MaterialCommunityIcons 
          name={completed ? "check" : "alert-circle"} 
          size={16} 
          color="white" 
        />
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="bg-[#181e25] flex-1 pt-0 relative">
      {/* Header */}
      <View className="absolute -top-12 left-0 right-0 items-center justify-center">
        <Image source={TopLogo} className="h-36 w-40" resizeMode="contain" />
      </View>

      <View className="border-b border-dashed border-white flex-row justify-between py-4 mt-10 items-center mx-5 pt-5">
        <TouchableOpacity
          onPress={() => navigation.reset({
            index: 0,
            routes: [{ name: "MainTabs" }],
          })}
          className="p-1"
        >
          <AntDesign name="left" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.openDrawer()} className="ml-auto">
          <Ionicons name="menu-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>
      
      <View className="border border-dashed border-gray-300 my-1" />
      
      {/* Progress Header */}
      <View className="px-6 py-1">
        <Text className="text-center text-white text-2xl font-bold my-2">
          {t('kyc_resume.identity_verification')}
        </Text>
        
        <View className=" rounded-xl p-1 mt-1">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-white font-semibold text-lg">
              {t('kyc_resume.progress')}
            </Text>
            <Text className="text-white font-bold text-lg">
              {Data.filter(item => item.completed).length}/{Data.length}
            </Text>
          </View>
          
          {/* Progress Bar */}
          <View className="w-full bg-blue-700 rounded-full h-3 mb-2">
            <View 
              className="bg-green-400 h-3 rounded-full" 
              style={{ 
                width: `${(Data.filter(item => item.completed).length / Data.length) * 100}%` 
              }}
            />
          </View>
          
          <Text className="text-blue-200 text-sm text-center">
            {incompleteCount > 0 
              ? t('kyc_resume.steps_remaining', { count: incompleteCount })
              : t('kyc_resume.all_steps_complete')
            }
          </Text>
        </View>
      </View>

      <View className="flex-1 gap-6 py-3 bg-white px-6 rounded-t-3xl">
        <View className="my-4">
          <Text className="text-center text-gray-800 text-xl font-bold">
            {t('kyc_resume.kyc_summary')}
          </Text>
          <Text className="text-center text-gray-500 text-sm mt-2">
            {t('kyc_resume.completion_hint')}
          </Text>
        </View>

        <FlatList
          data={Data}
          renderItem={({ item }) => <KycOption {...item} />}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
        />
        
        <Animated.View style={{ transform: [{ scale: isKYCComplete ? 1 : pulseAnim }] }}>
          <TouchableOpacity 
            className={`py-4 rounded-2xl mb-6 ${isKYCComplete ? 'bg-green-500' : 'bg-gray-400'} shadow-lg`}
            onPress={handleSubmit}
            disabled={!isKYCComplete || submissionStatus === 'loading'}
            style={{
              shadowColor: isKYCComplete ? '#10b981' : '#9ca3af',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 5,
              elevation: 6,
            }}
          >
            {submissionStatus === 'loading' ? (
              <View className="flex-row justify-center items-center">
                <Loader size="small" color="white" />
              </View>
            ) : (
              <View className="flex-row justify-center items-center">
                <Feather name="send" size={20} color="white" />
                <Text className="text-white text-xl font-bold ml-2">
                  {t('kyc_resume.submit')}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Security Footer */}
      <View className="py-4 flex-row justify-center items-center gap-3  mx-6 rounded-t-xl">
        <Ionicons name="shield-checkmark" size={20} color="#fbbf24" />
        <Text className="text-white text-sm font-medium text-center flex-1">
          {t('kyc_resume.privacy_notice')}
        </Text>
      </View>
       
      <StatusBar style="light" />
      <Toast />
    </View>
  );
};

export default KycResume;