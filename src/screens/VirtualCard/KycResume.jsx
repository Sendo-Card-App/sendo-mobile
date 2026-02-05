// Enhanced KycResume component with NIU optional and notice banner
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

  // Calculate if all required documents are complete (excluding NIU)
  const isRequiredDocumentsComplete = () => {
    return !!personalDetails.profession && 
           !!personalDetails.region && 
           !!personalDetails.city && 
           !!personalDetails.expirationDate && 
           !!personalDetails.district &&
           !!personalDetails.cni &&
           !!selfie &&
           !!addressProof &&
           !!identityDocument.front &&
           (
             identityDocument.type === 'passport' ||
             (identityDocument.type === 'cni' && !!identityDocument.back) ||
             (identityDocument.type === 'drivers_license' && !!identityDocument.back)
           );
  };

  const hasNIU = !!niuDocument;
  const requiredDocumentsComplete = isRequiredDocumentsComplete();

  // Pulse animation for incomplete required sections
  useEffect(() => {
    if (!requiredDocumentsComplete) {
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
  }, [requiredDocumentsComplete]);

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
                !!personalDetails.expirationDate && 
                !!personalDetails.district &&
                !!personalDetails.cni,
      icon: "account-details",
      required: true
    },
    { 
      id: "2", 
      name: t('kyc_resume.selfie'), 
      route: "KycSelfie", 
      completed: !!selfie,
      icon: "camera-front-variant",
      required: true
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
      icon: "card-account-details",
      required: true
    },
    { 
      id: "4", 
      name: t('kyc_resume.niu_document'), 
      route: "NIU", 
      completed: !!niuDocument,
      icon: "file-document",
      required: false, // NIU is optional
      optional: true
    },
    { 
      id: "5", 
      name: t('kyc_resume.address_proof'), 
      route: "Addresse", 
      completed: !!addressProof,
      icon: "home-map-marker",
      required: true
    },
  ];

  const incompleteCount = Data.filter(item => !item.completed && item.required).length;
  const totalCompleted = Data.filter(item => item.completed).length;
  const totalRequired = Data.filter(item => item.required).length;
  const requiredCompleted = Data.filter(item => item.completed && item.required).length;

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
    if (isSubmitting || !requiredDocumentsComplete) {
      Toast.show({
        type: 'error',
        text1: t('kyc_resume.incomplete_title'),
        text2: t('kyc_resume.incomplete_required_message'),
      });
      return;
    }

    setIsSubmitting(true);
    dispatch(setSubmissionStatus('loading'));

    try {
      const idDocumentNumber = personalDetails.cni;
      const expirationDate = personalDetails.expirationDate;
      const taxIdNumber = niuDocument?.taxIdNumber || null;

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
          { type: 'ID_PROOF', idDocumentNumber, expirationDate, taxIdNumber },
          identityDocument.front.uri,
          fileIndex++
        );
        await addDocumentAndFile(
          { type: 'ID_PROOF', idDocumentNumber, expirationDate, taxIdNumber },
          identityDocument.front.uri,
          fileIndex++
        );
      } else if (identityDocument.front && identityDocument.back) {
        await addDocumentAndFile(
          { type: 'ID_PROOF', idDocumentNumber, expirationDate, taxIdNumber },
          identityDocument.front.uri,
          fileIndex++
        );
        await addDocumentAndFile(
          { type: 'ID_PROOF', idDocumentNumber, expirationDate, taxIdNumber },
          identityDocument.back.uri,
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

      // Adjust expected document count based on whether NIU is included
      const expectedDocumentCount =  4;
      const expectedFileCount =  4;
      
      if (documents.length !== expectedDocumentCount || files.length !== expectedFileCount) {
        throw new Error(`Expected ${expectedDocumentCount} documents and ${expectedFileCount} files. Currently: ${documents.length} doc(s), ${files.length} file(s)`);
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
          message: hasNIU 
            ? 'Votre KYC a été soumis avec succès' 
            : 'Votre KYC a été soumis. Vous pourrez faire une demande de NIU pour compléter votre vérification KYC.',
          nextScreen: 'MainTabs',
        });
      } else {
        throw new Error('Server responded but submission failed');
      }

    } catch (error) {
      console.log('KYC submission error:', JSON.stringify(error, null, 2));
    
      dispatch(setSubmissionStatus('failed'));
      
      // Enhanced error extraction
      let errorMessage = t('Error');
      
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

  const KycOption = ({ id, name, route, completed, icon, optional }) => (
    <TouchableOpacity
      className={`py-4 px-4 my-2 rounded-2xl flex-row items-center gap-4 ${completed ? 'bg-green-50 border border-green-200' : optional ? 'bg-blue-50 border border-blue-200' : 'bg-orange-50 border border-orange-200'}`}
      onPress={() => navigation.navigate(route)}
      style={{
        shadowColor: completed ? '#10b981' : optional ? '#3b82f6' : '#f59e0b',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
      }}
    >
      <View className={`p-2 rounded-full ${completed ? 'bg-green-100' : optional ? 'bg-blue-100' : 'bg-orange-100'}`}>
        <MaterialCommunityIcons 
          name={icon} 
          size={22} 
          color={completed ? "green" : optional ? "blue" : "orange"} 
        />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center">
          <Text className="text-gray-800 font-bold text-base">{name}</Text>
          {optional && (
            <View className="ml-2 px-2 py-1 bg-blue-100 rounded-full">
              <Text className="text-blue-600 text-xs font-medium">
                {t('kyc_resume.optional')}
              </Text>
            </View>
          )}
        </View>
        <Text className={`text-sm ${completed ? 'text-green-600' : optional ? 'text-blue-600' : 'text-orange-600'}`}>
          {completed ? t('kyc_resume.completed') : optional ? t('kyc_resume.optional') : t('kyc_resume.pending')}
        </Text>
      </View>
      <View className={`p-1 rounded-full ${completed ? 'bg-green-500' : optional ? 'bg-blue-500' : 'bg-orange-500'}`}>
        <MaterialCommunityIcons 
          name={completed ? "check" : optional ? "information" : "alert-circle"} 
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
              {requiredCompleted}/{totalRequired}
              {!hasNIU && (
                <Text className="text-blue-300 text-sm"> ({t('kyc_resume.niu_missing')})</Text>
              )}
            </Text>
          </View>
          
          {/* Progress Bar */}
          <View className="w-full bg-blue-700 rounded-full h-3 mb-2">
            <View 
              className="bg-green-400 h-3 rounded-full" 
              style={{ 
                width: `${(requiredCompleted / totalRequired) * 100}%` 
              }}
            />
          </View>
          
          <Text className="text-blue-200 text-sm text-center">
            {incompleteCount > 0 
              ? t('kyc_resume.steps_remaining', { count: incompleteCount })
              : hasNIU 
                ? t('kyc_resume.all_steps_complete')
                : t('kyc_resume.required_steps_complete')
            }
            {!hasNIU && incompleteCount === 0 && (
              <Text className="block mt-1 text-blue-300 font-medium">
                {t('kyc_resume.niu_optional_note')}
              </Text>
            )}
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
            {!hasNIU && (
              <Text className="text-blue-500 font-medium"> {t('kyc_resume.niu_hint')}</Text>
            )}
          </Text>
        </View>

        <FlatList
          data={Data}
          renderItem={({ item }) => <KycOption {...item} />}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
        />
        
        {/* NIU Notice Banner - ADDED HERE */}
        {!hasNIU && requiredDocumentsComplete && (
          <View className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <View className="flex-row items-start">
              <Ionicons name="information-circle" size={24} color="#3b82f6" className="mr-3" />
              <View className="flex-1">
                <Text className="text-blue-800 font-bold text-base mb-1">
                  {t('kyc_resume.niu_notice_title')}
                </Text>
                <Text className="text-blue-600 text-sm">
                  {t('kyc_resume.niu_notice_message')}
                </Text>
              </View>
            </View>
          </View>
        )}
        
        <Animated.View style={{ transform: [{ scale: requiredDocumentsComplete ? 1 : pulseAnim }] }}>
          <TouchableOpacity 
            className={`py-4 rounded-2xl mb-6 ${requiredDocumentsComplete ? 'bg-green-500' : 'bg-gray-400'} shadow-lg`}
            onPress={handleSubmit}
            disabled={!requiredDocumentsComplete || submissionStatus === 'loading'}
            style={{
              shadowColor: requiredDocumentsComplete ? '#10b981' : '#9ca3af',
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
                  {!hasNIU && requiredDocumentsComplete && (
                    <Text className="text-sm font-normal"> ({t('kyc_resume.without_niu')})</Text>
                  )}
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