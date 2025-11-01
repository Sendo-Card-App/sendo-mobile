import { View, Text, Image, TouchableOpacity, ScrollView, TextInput, Alert } from "react-native";
import React, { useState } from "react";
import TopLogo from "../../images/TopLogo.png";
import { AntDesign, Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import KycTab from "../../components/KycTab";
import { useDispatch, useSelector } from 'react-redux';
import { 
  setIdentityDocumentFront, 
  setIdentityDocumentBack, 
  setSelfie, 
  setPersonalInfo,
  setPassportDocument
} from '../../features/Kyc/kycReducer';
import { useTranslation } from 'react-i18next';
import { useUpdateProfileMutation, useSendSelfieMutation, useSubmitKYCMutation } from '../../services/Kyc/kycApi';

const CanadaKycSubmission = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const kycData = useSelector(state => state.kyc);
  
  // RTK Query mutations
  const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateProfileMutation();
  const [sendSelfie, { isLoading: isSendingSelfie }] = useSendSelfieMutation();
  const [submitKYC, { isLoading: isSubmittingKYC }] = useSubmitKYCMutation();

  const [personalInfo, setPersonalInfoState] = useState({
    profession: '',
    identityType: '',
    identityNumber: '',
    expirationDate: ''
  });

  const [selectedIdentityType, setSelectedIdentityType] = useState('');

  const identityTypes = [
    { 
      id: 'carte_resident_permanent', 
      label: t('canadaKyc.carteResidentPermanent'), 
      icon: 'id-card',
      iconLibrary: 'FontAwesome5',
      requiresPassport: false,
      documentType: 'ID_PROOF'
    },
    { 
      id: 'passeport_canadien', 
      label: t('canadaKyc.passeportCanadien'), 
      icon: 'passport',
      iconLibrary: 'FontAwesome5',
      requiresPassport: false,
      documentType: 'ID_PROOF'
    },
    { 
      id: 'permis_conduire', 
      label: t('canadaKyc.permisConduire'), 
      icon: 'car',
      iconLibrary: 'FontAwesome5',
      requiresPassport: false,
      documentType: 'ID_PROOF'
    },
    { 
      id: 'permis_etude_plus_passport', 
      label: t('canadaKyc.permisEtudePlusPassport'), 
      icon: 'graduation-cap',
      iconLibrary: 'FontAwesome5',
      requiresPassport: true,
      documentType: 'ID_PROOF'
    },
    { 
      id: 'permis_travail_plus_passport', 
      label: t('canadaKyc.permisTravailPlusPassport'), 
      icon: 'briefcase',
      iconLibrary: 'FontAwesome5',
      requiresPassport: true,
      documentType: 'ID_PROOF'
    },
    { 
      id: 'document_aveile_plus_passport', 
      label: t('canadaKyc.documentAveilePlusPassport'), 
      icon: 'id-card',
      iconLibrary: 'FontAwesome5',
      requiresPassport: true,
      documentType: 'ID_PROOF'
    },
  ];

  const handleIdentityTypeSelect = (type) => {
    setSelectedIdentityType(type);
    setPersonalInfoState(prev => ({ ...prev, identityType: type }));
  };

  const handleCapture = (type) => {
  navigation.navigate("CanadaKycCamera", { // Changed from "Camera" to "CanadaKycCamera"
    purpose: type,
    selectedIdentityType: selectedIdentityType,
    onCapture: (image) => {
      const file = {
        uri: image.uri,
        type: 'image/jpeg',
        name: `${type}_${new Date().toISOString()}.jpg`
      };

      switch (type) {
        case 'selfie':
          dispatch(setSelfie(file));
          break;
        case 'id_front':
          dispatch(setIdentityDocumentFront(file));
          break;
        case 'id_back':
          dispatch(setIdentityDocumentBack(file));
          break;
        case 'passport':
          dispatch(setPassportDocument(file));
          break;
      }
    }
  });
};

  const getCapturedDocuments = () => {
    const selectedType = identityTypes.find(type => type.id === selectedIdentityType);
    const capturedDocs = {
      selfie: !!kycData.selfie,
      idFront: !!kycData.identityDocument?.front,
      idBack: !!kycData.identityDocument?.back,
      passport: !!kycData.passportDocument
    };

    // Determine which documents should be shown based on selected identity type
    const requiredDocs = {
      selfie: true,
      idFront: true,
      idBack: selectedIdentityType === 'permis_conduire' || selectedIdentityType === 'carte_resident_permanent',
      passport: selectedType?.requiresPassport || false
    };

    return {
      captured: capturedDocs,
      required: requiredDocs,
      allRequiredCaptured: 
        capturedDocs.selfie && 
        capturedDocs.idFront && 
        (!requiredDocs.idBack || capturedDocs.idBack) && 
        (!requiredDocs.passport || capturedDocs.passport)
    };
  };

  const createDocumentsArray = () => {
    const selectedType = identityTypes.find(type => type.id === selectedIdentityType);
    const documents = [];
    let fileIndex = 0;

    // For documents that require passport (permis_etude, permis_travail, document_aveile)
    if (selectedType?.requiresPassport) {
      // Add the main document (permis_etude, permis_travail, or document_aveile) as front
      if (kycData.identityDocument?.front) {
        documents.push({
          type: 'ID_PROOF',
          idDocumentNumber: personalInfo.identityNumber,
          expirationDate: personalInfo.expirationDate,
          fileIndex: fileIndex++
        });
      }

      // Add passport as the second document (back)
      if (kycData.passportDocument) {
        documents.push({
          type: 'ID_PROOF',
          idDocumentNumber: personalInfo.identityNumber,
          expirationDate: personalInfo.expirationDate,
          fileIndex: fileIndex++
        });
      }
    } 
    // For documents that don't require passport
    else {
      // Add identity document front
      if (kycData.identityDocument?.front) {
        documents.push({
          type: 'ID_PROOF',
          idDocumentNumber: personalInfo.identityNumber,
          expirationDate: personalInfo.expirationDate,
          fileIndex: fileIndex++
        });
      }

      // Add identity document back if exists and needed
      if (kycData.identityDocument?.back && 
          (selectedIdentityType === 'permis_conduire' || selectedIdentityType === 'carte_resident_permanent')) {
        documents.push({
          type: 'ID_PROOF', 
          idDocumentNumber: personalInfo.identityNumber,
          expirationDate: personalInfo.expirationDate,
          fileIndex: fileIndex++
        });
      }
    }

    return documents;
  };

  const createFormData = () => {
    const formData = new FormData();
    const selectedType = identityTypes.find(type => type.id === selectedIdentityType);
    let fileIndex = 0;

    // Add identity document front
    if (kycData.identityDocument?.front) {
      formData.append('files', {
        uri: kycData.identityDocument.front.uri,
        type: 'image/jpeg',
        name: `id_front_${fileIndex}.jpg`
      });
      fileIndex++;
    }

    // Add identity document back if exists and needed
    if (kycData.identityDocument?.back && 
        (selectedIdentityType === 'permis_conduire' || selectedIdentityType === 'carte_resident_permanent')) {
      formData.append('files', {
        uri: kycData.identityDocument.back.uri,
        type: 'image/jpeg',
        name: `id_back_${fileIndex}.jpg`
      });
      fileIndex++;
    }

    // Add passport if required and exists
    if (selectedType?.requiresPassport && kycData.passportDocument) {
      // Add passport twice as per your requirement
      formData.append('files', {
        uri: kycData.passportDocument.uri,
        type: 'image/jpeg',
        name: `passport_${fileIndex}.jpg`
      });
      fileIndex++;
      
      formData.append('files', {
        uri: kycData.passportDocument.uri, // Using same image twice as per your requirement
        type: 'image/jpeg',
        name: `passport_${fileIndex}.jpg`
      });
      fileIndex++;
    }

    // Add documents metadata
    const documents = createDocumentsArray();
    formData.append('documents', JSON.stringify(documents));

    // Add personal info
    formData.append('expirationDate', personalInfo.expirationDate);
    formData.append('identityNumber', personalInfo.identityNumber);
    formData.append('identityType', personalInfo.identityType);

    return formData;
  };

  const handleFinalSubmission = async () => {
    // Validate personal info
    if (!personalInfo.profession || !personalInfo.identityType || !personalInfo.identityNumber || !personalInfo.expirationDate) {
      Alert.alert(t('canadaKyc.error'), t('canadaKyc.fillAllFields'));
      return;
    }

    // Validate documents
    const selectedType = identityTypes.find(type => type.id === selectedIdentityType);
    const requiresPassport = selectedType?.requiresPassport;
    
    let errorMessage = '';
    
    if (!kycData.selfie) {
      errorMessage = t('canadaKyc.selfieRequired');
    } else if (!kycData.identityDocument?.front) {
      errorMessage = t('canadaKyc.identityFrontRequired');
    } else if (requiresPassport && !kycData.passportDocument) {
      errorMessage = t('canadaKyc.passportRequired');
    }

    if (errorMessage) {
      Alert.alert(t('canadaKyc.error'), errorMessage);
      return;
    }

    try {
      // 1. Send profession to updateProfile endpoint
      const profileData = {
        profession: personalInfo.profession
      };
      await updateProfile(profileData).unwrap();
      dispatch(setPersonalInfo(personalInfo));

      // 2. Send selfie to sendSelfie endpoint
      const selfieFormData = new FormData();
      selfieFormData.append('selfie', {
        uri: kycData.selfie.uri,
        type: 'image/jpeg',
        name: 'selfie.jpg'
      });
      await sendSelfie(selfieFormData).unwrap();

      // 3. Send identity documents and info to submitKYC endpoint
      const kycFormData = createFormData();
      const response = await submitKYC(kycFormData).unwrap();
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
    
    }
  };

  const DocumentCard = ({ title, subtitle, icon, type, isRequired = true, iconLibrary = "FontAwesome5" }) => {
    const IconComponent = iconLibrary === "FontAwesome5" ? FontAwesome5 : MaterialIcons;
    const { captured, required } = getCapturedDocuments();
    
    // Determine if document is captured based on type
    const isDocumentCaptured = () => {
      switch (type) {
        case 'selfie':
          return captured.selfie;
        case 'id_front':
          return captured.idFront;
        case 'id_back':
          return captured.idBack;
        case 'passport':
          return captured.passport;
        default:
          return false;
      }
    };

    const documentCaptured = isDocumentCaptured();
    
    return (
      <View className="bg-white rounded-2xl p-4 mb-4 shadow-lg border border-gray-100">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center">
            <IconComponent name={icon} size={20} color="#7ddd7d" />
            <Text className="text-lg font-bold text-gray-800 ml-3">{title}</Text>
          </View>
          {documentCaptured ? (
            <View className="flex-row items-center bg-green-100 px-2 py-1 rounded-full">
              <Ionicons name="checkmark-circle" size={14} color="#059669" />
              <Text className="text-green-800 text-xs font-medium ml-1">
                {t('canadaKyc.uploaded')}
              </Text>
            </View>
          ) : (
            <Text className="text-red-500 text-xs font-medium">
              {isRequired ? t('canadaKyc.required') : t('canadaKyc.optional')}
            </Text>
          )}
        </View>
        
        <Text className="text-gray-600 text-sm mb-4">{subtitle}</Text>
        
        <TouchableOpacity
          className={`flex-row items-center justify-center py-3 rounded-xl ${
            documentCaptured ? 'bg-gray-100' : 'bg-[#7ddd7d]/10 border-2 border-dashed border-[#7ddd7d]/30'
          }`}
          onPress={() => handleCapture(type)}
        >
          <Ionicons 
            name={documentCaptured ? "checkmark-circle" : "camera-outline"} 
            size={18} 
            color={documentCaptured ? "#059669" : "#7ddd7d"} 
          />
          <Text className={`ml-2 font-medium ${
            documentCaptured ? 'text-green-700' : 'text-[#7ddd7d]'
          }`}>
            {documentCaptured ? t('canadaKyc.reupload') : t('canadaKyc.capture')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const IdentityTypeCard = ({ type, isSelected, onSelect }) => {
    const IconComponent = type.iconLibrary === "FontAwesome5" ? FontAwesome5 : MaterialIcons;
    
    return (
      <TouchableOpacity
        className={`mb-2 flex-row items-center border-2 rounded-xl p-3 ${
          isSelected 
            ? 'border-[#7ddd7d] bg-[#7ddd7d]/10' 
            : 'border-gray-200 bg-white'
        }`}
        onPress={() => onSelect(type.id)}
      >
        <View className={`w-10 h-10 rounded-full items-center justify-center ${
          isSelected ? 'bg-[#7ddd7d]' : 'bg-gray-100'
        }`}>
          <IconComponent 
            name={type.icon} 
            size={16} 
            color={isSelected ? 'white' : '#6B7280'} 
          />
        </View>
        <View className="ml-3 flex-1">
          <Text 
            className={`font-semibold text-sm ${
              isSelected ? 'text-[#7ddd7d]' : 'text-gray-800'
            }`}
          >
            {type.label}
          </Text>
          {type.requiresPassport && (
            <Text className="text-orange-600 text-xs font-medium mt-1">
              {t('canadaKyc.requiresPassport')}
            </Text>
          )}
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={20} color="#7ddd7d" />
        )}
      </TouchableOpacity>
    );
  };

  const getSelectedType = () => identityTypes.find(type => type.id === selectedIdentityType);

  const isSubmitDisabled = isSubmittingKYC || isUpdatingProfile || isSendingSelfie;

  return (
    <View className="bg-[#181e25] flex-1 pt-0 relative">
      {/* Header */}
      <View className="absolute -top-12 left-0 right-0 items-center justify-center">
        <Image source={TopLogo} className="h-36 w-40" resizeMode="contain" />
      </View>

      <View className="border-b border-dashed border-white flex-row justify-between py-4 mt-10 items-center mx-5 pt-5">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="left" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-lg font-semibold">
          {t('canadaKyc.title')}
        </Text>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 bg-white rounded-t-3xl mt-4" showsVerticalScrollIndicator={false}>
        <View className="p-5"> 
          {/* Personal Information Section */}
          <View className="mb-6">
            <Text className="text-xl font-bold text-gray-800 mb-2">
              {t('canadaKyc.personalInfo')}
            </Text>
            <Text className="text-gray-600 text-sm mb-4">
              {t('canadaKyc.personalInfoDesc')}
            </Text>

            {/* Profession Input */}
            <View className="mb-3">
              <Text className="text-gray-700 font-medium mb-2 text-sm">
                {t('canadaKyc.profession')} *
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm"
                placeholder={t('canadaKyc.professionPlaceholder')}
                value={personalInfo.profession}
                onChangeText={(text) => setPersonalInfoState(prev => ({ ...prev, profession: text }))}
              />
            </View>

            {/* Identity Type Selection */}
            <View className="mb-3">
              <Text className="text-gray-700 font-medium mb-2 text-sm">
                {t('canadaKyc.identityType')} *
              </Text>
              <Text className="text-gray-500 text-xs mb-3">
                {t('canadaKyc.identityTypeDesc')}
              </Text>
              
              <View className="space-y-2">
                {identityTypes.map((type) => (
                  <IdentityTypeCard
                    key={type.id}
                    type={type}
                    isSelected={selectedIdentityType === type.id}
                    onSelect={handleIdentityTypeSelect}
                  />
                ))}
              </View>
            </View>

            {/* Identity Number */}
            <View className="mb-3">
              <Text className="text-gray-700 font-medium mb-2 text-sm">
                {t('canadaKyc.identityNumber')} *
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm"
                placeholder={t('canadaKyc.identityNumberPlaceholder')}
                value={personalInfo.identityNumber}
                onChangeText={(text) => setPersonalInfoState(prev => ({ ...prev, identityNumber: text }))}
              />
            </View>

            {/* Expiration Date */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2 text-sm">
                {t('canadaKyc.expirationDate')} *
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-800 text-sm"
                placeholder="YYYY-MM-DD"
                value={personalInfo.expirationDate}
                onChangeText={(text) => setPersonalInfoState(prev => ({ ...prev, expirationDate: text }))}
              />
              <Text className="text-gray-500 text-xs mt-1">
                {t('canadaKyc.expirationDateHint')}
              </Text>
            </View>
          </View>

          {/* Documents Section */}
          <View className="mb-6">
            <Text className="text-xl font-bold text-gray-800 mb-2">
              {t('canadaKyc.documents')}
            </Text>
            <Text className="text-gray-600 text-sm mb-4">
              {t('canadaKyc.documentsDesc')}
            </Text>

            {/* Selfie Document */}
            <DocumentCard
              title={t('canadaKyc.selfie')}
              subtitle={t('canadaKyc.selfieDesc')}
              icon="user"
              type="selfie"
            />

            {/* Primary Identity Document */}
            <DocumentCard
              title={
                getSelectedType()?.requiresPassport 
                  ? t('canadaKyc.mainDocument')
                  : t('canadaKyc.identityFront')
              }
              subtitle={
                getSelectedType()?.requiresPassport
                  ? t('canadaKyc.mainDocumentDesc')
                  : t('canadaKyc.identityFrontDesc')
              }
              icon={
                getSelectedType()?.requiresPassport
                  ? getSelectedType()?.icon || 'id-card'
                  : 'id-card'
              }
              type="id_front"
            />

            {/* For documents that require passport - show passport as second document */}
            {getSelectedType()?.requiresPassport && (
              <DocumentCard
                title={t('canadaKyc.passeport')}
                subtitle={t('canadaKyc.passeportDesc')}
                icon="passport"
                type="passport"
              />
            )}

            {/* For documents that don't require passport but have back side */}
            {!getSelectedType()?.requiresPassport && 
             (selectedIdentityType === 'permis_conduire' || selectedIdentityType === 'carte_resident_permanent') && (
              <DocumentCard
                title={t('canadaKyc.identityBack')}
                subtitle={t('canadaKyc.identityBackDesc')}
                icon="id-card"
                type="id_back"
                isRequired={false}
              />
            )}
          </View>

          {/* Single Submission Button */}
          <TouchableOpacity
            className="bg-[#7ddd7d] py-4 rounded-xl items-center mb-6 shadow-lg"
            onPress={handleFinalSubmission}
            disabled={isSubmitDisabled}
          >
            <View className="flex-row items-center">
              {isSubmitDisabled && (
                <Ionicons name="refresh" size={20} color="white" className="mr-2" />
              )}
              <Text className="text-white font-bold text-lg">
                {isSubmitDisabled ? t('canadaKyc.submitting') : t('canadaKyc.submitKYC')}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Security Notice */}
          <View className="bg-[#7ddd7d]/10 rounded-xl p-4 mb-4 border border-[#7ddd7d]/30">
            <View className="flex-row items-start">
              <Ionicons name="shield-checkmark" size={18} color="#7ddd7d" />
              <Text className="text-gray-700 text-sm ml-2 flex-1">
                {t('canadaKyc.securityNotice')}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <StatusBar style="light" />
    </View>
  );
};

export default CanadaKycSubmission;