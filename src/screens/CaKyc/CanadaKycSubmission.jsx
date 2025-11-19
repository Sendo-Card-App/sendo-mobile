import { View, Text, Image, TouchableOpacity, ScrollView, TextInput, Alert, ActionSheetIOS,Platform } from "react-native";
import React, { useState, useEffect } from "react";
import TopLogo from "../../images/TopLogo.png";
import { AntDesign, Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import KycTab from "../../components/KycTab";
import { useDispatch, useSelector } from 'react-redux';
import { 
  setIdentityDocumentType, 
  setIdentityDocumentFront, 
  setIdentityDocumentBack, 
  setSelfie,
  setPassportDocument,
  setPersonalInfo,
  IDENTITY_TYPES,
  CANADA_IDENTITY_TYPES,
  resetFailedSubmission
} from '../../features/Kyc/kycReducer';
import { useTranslation } from 'react-i18next';
import { useUpdateProfileMutation, useSendSelfieMutation, useSubmitKYCMutation } from '../../services/Kyc/kycApi';
import { useAppState } from '../../context/AppStateContext';
import * as ImageManipulator from 'expo-image-manipulator';
import DateTimePicker from '@react-native-community/datetimepicker';

const CanadaKycSubmission = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const kycData = useSelector(state => state.kyc);
  const { openImagePicker } = useAppState();
  
  // RTK Query mutations
  const [updateProfile, { isLoading: isUpdatingProfile, error: updateProfileError }] = useUpdateProfileMutation();
  const [sendSelfie, { isLoading: isSendingSelfie, error: sendSelfieError }] = useSendSelfieMutation();
  const [submitKYC, { isLoading: isSubmittingKYC, error: submitKYCError }] = useSubmitKYCMutation();

  const [personalInfo, setPersonalInfoState] = useState({
    profession: '',
    identityType: '',
    identityNumber: '',
    expirationDate: ''
  });

  const [selectedIdentityType, setSelectedIdentityType] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

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

  // Get any error from the mutations
  const error = updateProfileError || sendSelfieError || submitKYCError;

  useEffect(() => {
    if (error) {
      Alert.alert(
        t('canadaKyc.error'),
        error?.data?.message || error?.message || t('canadaKyc.generalError')
      );
      // Reset errors after showing
      dispatch(resetFailedSubmission());
    }
  }, [error]);

  // Date Picker Functions
  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    
    if (event.type === 'set' && date) {
      setSelectedDate(date);
      // Format date as YYYY-MM-DD
      const formattedDate = date.toISOString().split('T')[0];
      setPersonalInfoState(prev => ({ ...prev, expirationDate: formattedDate }));
    }
  };

  const showDatePickerModal = () => {
    setShowDatePicker(true);
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-CA'); // YYYY-MM-DD format
  };

  const getMinDate = () => {
    return new Date(); // Today's date
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + 10); // 10 years from now
    return maxDate;
  };

  // Image compression function
  const compressImage = async (uri) => {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      console.log('Image compressed successfully');
      return result.uri;
    } catch (error) {
      console.error(' Image compression failed:', error);
      return uri;
    }
  };

  // Helper function to add documents and files
  const addDocumentAndFile = async (documents, files, doc, uri, index) => {
    documents.push(doc);
    const compressedUri = await compressImage(uri);
    const name = `file_${index}.jpg`;

    files.push({
      uri: compressedUri,
      name,
      type: 'image/jpeg',
    });
  };

  const handleIdentityTypeSelect = (type) => {
    setSelectedIdentityType(type);
    setPersonalInfoState(prev => ({ ...prev, identityType: type }));
  };

  const showImageSourceOptions = (type) => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: [t('common.cancel'), t('common.takePhoto'), t('common.chooseFromGallery')],
        cancelButtonIndex: 0,
      },
      async (buttonIndex) => {
        if (buttonIndex === 0) {
          return;
        } else if (buttonIndex === 1) {
          handleCameraCapture(type);
        } else if (buttonIndex === 2) {
          handleImagePicker(type);
        }
      }
    );
  };

  const handleCameraCapture = (type) => {
    navigation.navigate("CanadaKycCamera", {
      purpose: type,
      selectedIdentityType: selectedIdentityType,
      onCapture: (image) => {
        handleImageCapture(type, image);
      }
    });
  };

  const handleImagePicker = async (type) => {
    try {
      const image = await openImagePicker();
      if (image) {
        handleImageCapture(type, image);
      }
    } catch (error) {
      console.error(' Error picking image:', error);
      Alert.alert(t('common.error'), t('common.imagePickerError'));
    }
  };

  const handleImageCapture = (type, image) => {
    
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
  };

  const handleCapture = (type) => {
    const requiresPassportTypes = ['permis_etude_plus_passport', 'permis_travail_plus_passport', 'document_aveile_plus_passport'];
    
    if (requiresPassportTypes.includes(selectedIdentityType) && 
        (type === 'id_front' || type === 'passport')) {
      showImageSourceOptions(type);
    } else {
      handleCameraCapture(type);
    }
  };

  const getCapturedDocuments = () => {
    const selectedType = identityTypes.find(type => type.id === selectedIdentityType);
    const capturedDocs = {
      selfie: !!kycData.selfie,
      idFront: !!kycData.identityDocument?.front,
      idBack: !!kycData.identityDocument?.back,
      passport: !!kycData.passportDocument
    };

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

const handleFinalSubmission = async () => {
  console.log(' Starting Canada KYC submission process...');
  
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
  } else if (!requiresPassport && (selectedIdentityType === 'permis_conduire' || selectedIdentityType === 'carte_resident_permanent') && !kycData.identityDocument?.back) {
    errorMessage = t('canadaKyc.identityBackRequired');
  }

  if (errorMessage) {
    console.log('❌ Document validation failed:', errorMessage);
    Alert.alert(t('canadaKyc.error'), errorMessage);
    return;
  }

  try {
    console.log(' Step 1: Sending profile data...');
    const formData = {
      profession: personalInfo.profession
    };
    console.log('Profile data:', formData);
    const profileResponse = await updateProfile(formData).unwrap();
    dispatch(setPersonalInfo(personalInfo));

    // 2. Prepare documents and files
    console.log(' Step 2: Preparing KYC documents...');
    
    const documents = [];
    const files = [];
    let fileIndex = 0;

    const idDocumentNumber = personalInfo.identityNumber;
    const expirationDate = personalInfo.expirationDate;
    const selectedIdentityDoc = identityTypes.find(type => type.id === selectedIdentityType);

    // Helper function to add document and file
    const addDocumentAndFile = async (doc, uri, index) => {
      documents.push(doc);
      const compressedUri = await compressImage(uri);
      const name = `file_${index}.jpg`;

      files.push({
        uri: compressedUri,
        name,
        type: 'image/jpeg',
      });
    };

    // ADD ID_PROOF DOCUMENTS 
    if (selectedIdentityDoc?.requiresPassport) {
      // Main document (front) - ID_PROOF
      if (kycData.identityDocument?.front) {
        await addDocumentAndFile(
          {
            type: 'ID_PROOF',
            idDocumentNumber: idDocumentNumber,
            expirationDate: expirationDate
          },
          kycData.identityDocument.front.uri,
          fileIndex++
        );
      }

      // Passport document - Also as ID_PROOF
      if (kycData.passportDocument) {
        await addDocumentAndFile(
          {
            type: 'ID_PROOF', 
            idDocumentNumber: idDocumentNumber,
            expirationDate: expirationDate
          },
          kycData.passportDocument.uri,
          fileIndex++
        );
      }
    } else {
      // Front of ID document - ID_PROOF
      if (kycData.identityDocument?.front) {
        await addDocumentAndFile(
          {
            type: 'ID_PROOF',
            idDocumentNumber: idDocumentNumber,
            expirationDate: expirationDate
          },
          kycData.identityDocument.front.uri,
          fileIndex++
        );
      }

      // Back of ID document - ID_PROOF 
      if (kycData.identityDocument?.back && 
          (selectedIdentityType === 'permis_conduire' || selectedIdentityType === 'carte_resident_permanent')) {
        await addDocumentAndFile(
          {
            type: 'ID_PROOF',
            idDocumentNumber: idDocumentNumber,
            expirationDate: expirationDate
          },
          kycData.identityDocument.back.uri,
          fileIndex++
        );
      }
    }

    // ADD SELFIE
    if (kycData.selfie) {
      await addDocumentAndFile(
        { type: 'SELFIE' },
        kycData.selfie.uri,
        fileIndex++
      );
    }

    console.log('📑 Final documents array:', JSON.stringify(documents, null, 2));
    console.log('📁 Total files to upload:', files.length);

    // Log each file for debugging
    files.forEach((file, index) => {
      console.log(`   File ${index}: ${file.name} - ${file.uri.substring(0, 50)}...`);
    });

    // VALIDATE EXACTLY 3 DOCUMENTS AND 3 FILES
    const REQUIRED_DOCUMENT_COUNT = 3;
    const REQUIRED_FILE_COUNT = 3;
    
    if (documents.length !== REQUIRED_DOCUMENT_COUNT || files.length !== REQUIRED_FILE_COUNT) {
      console.log(`❌ Expected exactly ${REQUIRED_DOCUMENT_COUNT} documents and ${REQUIRED_FILE_COUNT} files but got ${documents.length} documents and ${files.length} files`);
      
      // Determine what's missing for better error message
      const missingItems = [];
      
      if (documents.length < REQUIRED_DOCUMENT_COUNT) {
        const missingDocs = REQUIRED_DOCUMENT_COUNT - documents.length;
        missingItems.push(`${missingDocs} document(s)`);
      }
      
      if (files.length < REQUIRED_FILE_COUNT) {
        const missingFiles = REQUIRED_FILE_COUNT - files.length;
        missingItems.push(`${missingFiles} file(s)`);
      }
      
      const errorDetails = `Required: ${REQUIRED_DOCUMENT_COUNT} documents and ${REQUIRED_FILE_COUNT} files\nCurrent: ${documents.length} documents and ${files.length} files\n\nMissing: ${missingItems.join(' and ')}`;
      
      console.log('❌ Validation failed:', errorDetails);
      throw new Error(`Please upload all required documents. ${errorDetails}`);
    }

    // VALIDATE DOCUMENT STRUCTURE
    const idProofCount = documents.filter(doc => doc.type === 'ID_PROOF').length;
    const selfieCount = documents.filter(doc => doc.type === 'SELFIE').length;

    if (idProofCount !== 2 || selfieCount !== 1) {
      const structureError = `Invalid document structure. Expected: 2 ID_PROOF documents and 1 SELFIE document. Got: ${idProofCount} ID_PROOF and ${selfieCount} SELFIE`;
      console.log('❌', structureError);
      throw new Error(structureError);
    }

    // 3. Create FormData
    const kycFormData = new FormData();
    kycFormData.append('documents', JSON.stringify(documents));
    
    files.forEach((file, index) => {
      console.log(`📦 Appending file ${index}:`, file.name);
      kycFormData.append('files', file);
    });

    // Verify final structure
    console.log('✅ FINAL VALIDATION PASSED:');
    console.log('   Documents array (3 objects):', documents.map(doc => ({
      type: doc.type,
      idDocumentNumber: doc.idDocumentNumber || 'N/A',
      expirationDate: doc.expirationDate || 'N/A'
    })));
    console.log('   Files array (3 objects):', files.map(file => ({
      name: file.name,
      type: file.type,
      uri: file.uri.substring(0, 50) + '...'
    })));

    // 4. Submit KYC
    const startTime = Date.now();
    const response = await submitKYC(kycFormData).unwrap();
   
    console.log('📨 API Response:', JSON.stringify(response, null, 2));
    
    // Check response
    if (response?.status === 201) {
      console.log('🎉 Canada KYC submission completed successfully');
      navigation.navigate('Success', {
        message: 'Votre KYC a été soumis avec succès',
        nextScreen: 'MainTabs',
      });
    } else {
      console.log('⚠️ Server responded but submission may have failed');
      throw new Error(response?.message || 'Server responded but submission failed');
    }
  } catch (error) {
    console.log('❌ Canada KYC submission failed with error:');
    console.log('   - Error:', error);
    console.log('   - Error status:', error?.status);
    console.log('   - Error message:', error?.message);
    console.log('   - Error data:', JSON.stringify(error?.data, null, 2));
    
    let errorMsg = t('canadaKyc.generalError');
    
    if (error?.status === 'FETCH_ERROR') {
      errorMsg = t('canadaKyc.networkError');
    } else if (error?.data?.message) {
      errorMsg = error.data.message;
    } else if (error?.data?.data?.errors?.[0]) {
      errorMsg = error.data.data.errors[0];
    } else if (error?.message) {
      // Show the specific validation error message to user
      errorMsg = error.message;
    }
    
    Alert.alert(t('canadaKyc.error'), errorMsg);
  }
};

  // ... rest of your component code (DocumentCard, IdentityTypeCard, etc.) remains the same
  const DocumentCard = ({ title, subtitle, icon, type, isRequired = true, iconLibrary = "FontAwesome5" }) => {
    const IconComponent = iconLibrary === "FontAwesome5" ? FontAwesome5 : MaterialIcons;
    const { captured, required } = getCapturedDocuments();
    
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

            {/* Expiration Date with Date Picker */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2 text-sm">
                {t('canadaKyc.expirationDate')} *
              </Text>
              
              <TouchableOpacity
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3"
                onPress={showDatePickerModal}
              >
                <View className="flex-row justify-between items-center">
                  <Text className={`text-gray-800 text-sm ${personalInfo.expirationDate ? '' : 'text-gray-400'}`}>
                    {personalInfo.expirationDate ? formatDateDisplay(personalInfo.expirationDate) : 'YYYY-MM-DD'}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                </View>
              </TouchableOpacity>
              
              <Text className="text-gray-500 text-xs mt-1">
                {t('canadaKyc.expirationDateHint')}
              </Text>

              {/* Date Picker Modal */}
              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  minimumDate={getMinDate()}
                  maximumDate={getMaxDate()}
                  style={Platform.OS === 'ios' ? { height: 200 } : {}}
                />
              )}
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