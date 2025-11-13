import React, { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  Platform, 
  StatusBar,
  Alert,
  ActivityIndicator
} from 'react-native';
import { CheckBox } from 'react-native-elements';
import { MaterialCommunityIcons, AntDesign, Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useGetBalanceQuery } from '../../services/WalletApi/walletApi';
import { useGetUserProfileQuery } from "../../services/Auth/authAPI"; 
import { useNiuResquestMutation, useGetUserRequestsQuery } from "../../services/Kyc/kycApi";
import { useGetConfigQuery } from '../../services/Config/configApi';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import TopLogo from '../../images/TopLogo.png';
import Loader from "../../components/Loader";
import PaymentConfirmationModal from '../../components/PaymentConfirmationModal';
import { useAppState } from '../../context/AppStateContext';

const NiuRequest = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const kycStatus = useSelector(state => state.kyc.status);
  
  // AJOUT: Utilisation du contexte AppState
  const { isAppActive, appState } = useAppState();
  
  const [completedSteps, setCompletedSteps] = useState({
    1: true,
    2: true,
    3: false,
    4: false,
  });

  const [cniImages, setCniImages] = useState({
    front: null,
    back: null
  });
  const [uploading, setUploading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [paymentAccepted, setPaymentAccepted] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const showToast = (type, title, message) => {
    Toast.show({
      type,
      text1: title,
      text2: message,
      visibilityTime: 4000,
      autoHide: true,
      topOffset: 50,
    });
  };

  const { data: userProfile, isLoading: isProfileLoading, refetch } = useGetUserProfileQuery(undefined, {
    pollingInterval: 1000,
  });
  
  const userId = userProfile?.data.id;
  const hasNiuProof = userProfile?.data?.kycDocuments?.some(doc => doc.type === "NIU_PROOF");

  // CORRECTION: Utilisation correcte de la mutation RTK Query
  const [niuRequest, { isLoading: isSubmitting }] = useNiuResquestMutation();

  const {
    data: userRequests,
    isLoading: isRequestsLoading,
    error: requestsError,
    refetch: refetchRequests,
  } = useGetUserRequestsQuery(userId, { 
    skip: !userId,
    pollingInterval: 1000,
  });

  const {
    data: configData,
    isLoading: isConfigLoading,
    error: configError,
    refetch: refetchConfig,
  } = useGetConfigQuery();
  
  const niuConfig = configData?.data?.find(item => item.name === "NIU_REQUEST_FEES");
  const feeAmount = Number(niuConfig?.value);

  const {
    data: balanceData,
    error: balanceError,
    isLoading: isBalanceLoading,
  } = useGetBalanceQuery(userId, { skip: !userId });

  const balance = balanceData?.data?.balance || 0;

  // AJOUT: Effet pour gérer les changements d'état de l'application
  useEffect(() => {
    console.log('App State changed:', appState);
    if (appState === 'active') {
      // Rafraîchir les données quand l'app devient active
      refetch();
      refetchRequests();
      refetchConfig();
    }
  }, [appState]);

  // Demander les permissions au chargement du composant
  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted') {
        console.log('Camera permission not granted');
      }
      if (libraryStatus !== 'granted') {
        console.log('Library permission not granted');
      }
    })();
  }, []);

  useFocusEffect(
    useCallback(() => {
      refetch();
      refetchRequests();
      refetchConfig();
    }, [userId])
  );

  useEffect(() => {
    if (configError) {
      console.log('Config fetch error:', configError);
    }
    if (requestsError) {
      console.log('Requests fetch error:', requestsError);
    }
  }, [configError, requestsError]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (userId && isAppActive) {
        refetchRequests();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [userId, isAppActive]); // AJOUT: Dépendance à isAppActive

  useEffect(() => {
    if (userRequests?.data?.items) {
      const niuRequests = userRequests.data.items.filter(
        request => request.type === 'NIU_REQUEST'
      );

      const processed = niuRequests.find(r => r.status === 'PROCESSED');
      const pending = niuRequests.find(r => r.status === 'UNPROCESSED' || r.status === 'PENDING');
      const rejected = niuRequests.find(r => r.status === 'REJECTED');

      if (processed) {
        setCompletedSteps(prev => ({ ...prev, 1: true, 3: true, 4: true }));
      } else if (pending) {
        setCompletedSteps(prev => ({ ...prev, 1: true, 3: false, 4: false }));
      } else if (rejected) {
        setCompletedSteps(prev => ({ ...prev, 1: false, 3: false, 4: false }));
      } else {
        setCompletedSteps(prev => ({ ...prev, 1: false, 3: false, 4: false }));
      }
    }
  }, [userRequests]);

  useEffect(() => {
    if (balanceError) {
      showToast('error', t('niu.errors.title'), t('niu.errors.balanceFetchFailed'));
    }
  }, [balanceError]);

  const pickImage = async (side) => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          t('niu.cni.permissionDenied'),
          t('niu.cni.permissionMessage')
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 2],
        quality: 0.8,
      });

      if (!result.canceled) {
        setCniImages(prev => ({
          ...prev,
          [side]: result.assets[0].uri
        }));
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showToast('error', t('niu.errors.title'), t('niu.cni.uploadError'));
    }
  };

  const takePhoto = async (side) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          t('niu.cni.cameraPermissionDenied'),
          t('niu.cni.cameraPermissionMessage')
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [3, 2],
        quality: 0.8,
      });

      if (!result.canceled) {
        setCniImages(prev => ({
          ...prev,
          [side]: result.assets[0].uri
        }));
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      showToast('error', t('niu.errors.title'), t('niu.cni.cameraError'));
    }
  };

  // CORRECTION: Fonction utilisant la mutation RTK Query
  const uploadCniImages = async () => {
    if (!cniImages.front) {
      showToast('error', t('niu.errors.title'), 'Le recto de la CNI est obligatoire');
      return null;
    }

    setUploading(true);
    
    try {
      // Préparer les FormData pour chaque image
      const uploadPromises = [];

      // Upload du recto (obligatoire)
      const formDataFront = new FormData();
      formDataFront.append('type', 'NIU_REQUEST');
      formDataFront.append('description', 'Demande de NIU - Recto CNI');
      
      const frontFile = {
        uri: cniImages.front,
        name: `cni_recto_${userId}_${Date.now()}.jpg`,
        type: 'image/jpeg'
      };
      
      formDataFront.append('request', frontFile);
      uploadPromises.push(niuRequest(formDataFront).unwrap());

      // Upload du verso (optionnel)
      if (cniImages.back) {
        const formDataBack = new FormData();
        formDataBack.append('type', 'NIU_REQUEST');
        formDataBack.append('description', 'Demande de NIU - Verso CNI');
        
        const backFile = {
          uri: cniImages.back,
          name: `cni_verso_${userId}_${Date.now()}.jpg`,
          type: 'image/jpeg'
        };
        
        formDataBack.append('request', backFile);
        uploadPromises.push(niuRequest(formDataBack).unwrap());
      }

      // Exécuter tous les uploads
      const results = await Promise.all(uploadPromises);
      console.log('Upload results:', results);

      setUploading(false);
      
      // Retourner le résultat du premier upload (recto)
      return results[0];
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploading(false);
      showToast('error', t('niu.errors.title'), t('niu.cni.uploadFailed'));
      return null;
    }
  };

  // CORRECTION: Version simplifiée utilisant directement la mutation
  const handlePaymentConfirmation = async () => {
    setShowPaymentModal(false);

    if (!cniImages.front) {
      showToast('error', t('niu.errors.title'), 'Le recto de la CNI est obligatoire');
      return;
    }

    setUploading(true);

    try {
      // Upload seulement du recto (obligatoire)
      const formData = new FormData();
      formData.append('type', 'NIU_REQUEST');
      formData.append('description', 'Demande de NIU');
      
      const frontFile = {
        uri: cniImages.front,
        name: `cni_recto_${userId}_${Date.now()}.jpg`,
        type: 'image/jpeg'
      };
      
      formData.append('request', frontFile);

      // Utilisation directe de la mutation RTK Query
      const result = await niuRequest(formData).unwrap();
      
      console.log('NIU Request successful:', result);

      // Si le verso existe, l'uploader aussi
      if (cniImages.back) {
        try {
          const formDataBack = new FormData();
          formDataBack.append('type', 'NIU_REQUEST');
          formDataBack.append('description', 'Verso CNI');
          
          const backFile = {
            uri: cniImages.back,
            name: `cni_verso_${userId}_${Date.now()}.jpg`,
            type: 'image/jpeg'
          };
          
          formDataBack.append('request', backFile);
          await niuRequest(formDataBack).unwrap();
        } catch (backError) {
          console.warn('Back upload failed, but front was successful:', backError);
        }
      }

      setUploading(false);
      setCompletedSteps(prev => ({ ...prev, 1: true }));
      
      showToast('success', t('niu.success.title'), t('niu.success.message'));
      
      // Rafraîchir les données
      setTimeout(() => {
        refetchRequests();
        refetch();
      }, 1000);
      
    } catch (error) {
      console.error('NIU Request error:', error);
      setUploading(false);
      const msg = error.data?.message || t('niu.errors.technical');
      showToast('error', t('niu.errors.title'), msg);
    }
  };

  const handlePayPress = () => {
    if (!termsAccepted || !paymentAccepted) {
      showToast('error', t('niu.errors.title'), t('niu.errors.termsNotAccepted'));
      return;
    }

    if (!cniImages.front) {
      showToast('error', t('niu.errors.title'), 'Le recto de la CNI est obligatoire');
      return;
    }

    if (balance < feeAmount) {
      showToast('error', t('niu.errors.title'), t('niu.errors.insufficientBalance'));
      return;
    }

    setShowPaymentModal(true);
  };

  const getStatusMessage = () => {
    if (!userRequests?.data?.items) return null;

    const niuRequests = userRequests.data.items.filter(req => req.type === 'NIU_REQUEST');
    const processed = niuRequests.find(req => req.status === 'PROCESSED');
    const pending = niuRequests.find(req => req.status === 'UNPROCESSED' || req.status === 'PENDING');
    const rejected = niuRequests.find(req => req.status === 'REJECTED');

    if (processed) {
      return <Text className="text-green-600 mt-2 font-bold text-lg">{t('niu.request.statusApproved')}</Text>;
    }
    if (pending) {
      return <Text className="text-green-600 mt-2 font-bold text-lg">{t('niu.request.statusPending')}</Text>;
    }
    if (rejected) {
      return (
        <Text className="text-red-600 mt-2 font-bold text-lg">
          {t('niu.request.statusRejected')}
          {t('niu.request.raison')} {rejected.reason && `: ${rejected.reason}`}
        </Text>
      );
    }
    return null;
  };

  const hasProcessedNiuRequest = userRequests?.data?.items?.some(
    req => req.type === 'NIU_REQUEST' && req.status === 'PROCESSED'
  );

  const shouldShowAlreadyHaveScreen = hasNiuProof || hasProcessedNiuRequest;

  const CniUploadSection = () => (
    <View className="mx-5 mb-6">
      <Text className="font-bold text-lg mb-4 text-gray-800">
        {t('niu.cni.uploadTitle')}
      </Text>
      
      <Text className="text-gray-600 mb-4 text-sm">
        {t('niu.cni.uploadDescription')}
      </Text>

      <View className="flex-row justify-between mb-4">
        {/* Front Side - OBLIGATOIRE */}
        <View className="flex-1 mr-2">
          <Text className="text-gray-700 mb-2 font-medium text-center">
            {t('niu.cni.frontSide')} *
          </Text>
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                t('niu.cni.uploadOption'),
                t('niu.cni.chooseMethod'),
                [
                  { text: t('niu.cni.takePhoto'), onPress: () => takePhoto('front') },
                  { text: t('niu.cni.chooseFromGallery'), onPress: () => pickImage('front') },
                  { text: t('common.cancel'), style: 'cancel' }
                ]
              );
            }}
            className="border-2 border-dashed border-green-500 rounded-xl p-4 items-center justify-center h-40 bg-green-50"
          >
            {cniImages.front ? (
              <Image 
                source={{ uri: cniImages.front }} 
                className="w-full h-full rounded-lg"
                resizeMode="cover"
              />
            ) : (
              <View className="items-center">
                <Ionicons name="camera-outline" size={40} color="#7ddd7d" />
                <Text className="text-green-600 mt-2 text-center text-sm">
                  {t('niu.cni.uploadFront')}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <Text className="text-red-500 text-xs mt-1 text-center">Obligatoire</Text>
        </View>

        {/* Back Side - RECOMMANDÉ */}
        <View className="flex-1 ml-2">
          <Text className="text-gray-700 mb-2 font-medium text-center">
            {t('niu.cni.backSide')}
          </Text>
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                t('niu.cni.uploadOption'),
                t('niu.cni.chooseMethod'),
                [
                  { text: t('niu.cni.takePhoto'), onPress: () => takePhoto('back') },
                  { text: t('niu.cni.chooseFromGallery'), onPress: () => pickImage('back') },
                  { text: t('common.cancel'), style: 'cancel' }
                ]
              );
            }}
            className="border-2 border-dashed border-blue-400 rounded-xl p-4 items-center justify-center h-40 bg-blue-50"
          >
            {cniImages.back ? (
              <Image 
                source={{ uri: cniImages.back }} 
                className="w-full h-full rounded-lg"
                resizeMode="cover"
              />
            ) : (
              <View className="items-center">
                <Ionicons name="camera-outline" size={40} color="#60a5fa" />
                <Text className="text-blue-600 mt-2 text-center text-sm">
                  {t('niu.cni.uploadBack')}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <Text className="text-blue-500 text-xs mt-1 text-center">Recommandé</Text>
        </View>
      </View>

      {/* Upload Requirements */}
      <View className="bg-blue-50 p-3 rounded-lg border border-blue-200">
        <Text className="text-blue-800 font-semibold mb-2 text-sm">
          {t('niu.cni.requirementsTitle')}
        </Text>
        <View className="flex-row items-start mb-1">
          <Ionicons name="checkmark-circle" size={16} color="#10b981" style={{ marginTop: 2, marginRight: 8 }} />
          <Text className="text-blue-700 text-xs flex-1">{t('niu.cni.requirement1')}</Text>
        </View>
        <View className="flex-row items-start mb-1">
          <Ionicons name="checkmark-circle" size={16} color="#10b981" style={{ marginTop: 2, marginRight: 8 }} />
          <Text className="text-blue-700 text-xs flex-1">{t('niu.cni.requirement2')}</Text>
        </View>
        <View className="flex-row items-start mb-1">
          <Ionicons name="alert-circle" size={16} color="#f59e0b" style={{ marginTop: 2, marginRight: 8 }} />
          <Text className="text-amber-700 text-xs flex-1 font-semibold">
            Le recto de la CNI est obligatoire
          </Text>
        </View>
        <View className="flex-row items-start">
          <Ionicons name="info-circle" size={16} color="#3b82f6" style={{ marginTop: 2, marginRight: 8 }} />
          <Text className="text-blue-700 text-xs flex-1">
            Le verso est recommandé pour un traitement plus rapide
          </Text>
        </View>
      </View>
    </View>
  );

  if (isConfigLoading || isProfileLoading || isBalanceLoading || isRequestsLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Loader size="large" />
        <Text className="mt-4 text-gray-600">{t('common.loading')}</Text>
      </View>
    );
  }

  if (shouldShowAlreadyHaveScreen) {
    return (
      <View className="bg-[#181e25] flex-1 pt-0 relative">
        {/* Header */}
        <View
          style={{
            backgroundColor: '#7ddd7d',
            paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 40,
            paddingBottom: 20,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={{ 
              position: 'absolute', 
              left: 15, 
              top: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50,
              zIndex: 10 
            }}
          >
            <AntDesign name="left" size={24} color="white" />
          </TouchableOpacity>

          <Image
            source={TopLogo}
            style={{ height: 60, width: 100, resizeMode: 'contain' }}
          />
        </View>

        {/* Body */}
        <View className="flex-1 pb-3 bg-white rounded-t-3xl justify-center items-center p-5">
          <MaterialCommunityIcons
            name="check-circle"
            size={80}
            color="#7ddd7d"
            style={{ marginBottom: 20 }}
          />

          <Text className="text-2xl font-bold text-center mb-4">
            {t('niu.alreadyHave.title')}
          </Text>

          <Text className="text-lg text-center text-gray-600 mb-8">
            {t('niu.alreadyHave.message')}
          </Text>

          <TouchableOpacity
            onPress={() => navigation.navigate('MainTabs')}
            className="bg-[#7ddd7d] rounded-lg py-4 px-8"
          >
            <Text className="text-white text-lg font-semibold">
              {t('niu.alreadyHave.backButton')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const steps = [
    { id: 1, title: t('niu.steps.fees'), completed: completedSteps[1] },
    { id: 2, title: t('niu.steps.kyc'), completed: completedSteps[2] },
    { id: 3, title: t('niu.steps.cniUpload'), completed: completedSteps[3] },
    { id: 4, title: t('niu.steps.niuNumber'), completed: completedSteps[3] },
    { id: 5, title: t('niu.steps.attestation'), completed: completedSteps[4] },
  ];

  return (
    <View className="bg-[#181e25] flex-1 pt-0 relative">
      <StatusBar backgroundColor="#7ddd7d" barStyle="light-content" />
      
      {/* Header */}
      <View
        style={{
          backgroundColor: '#7ddd7d',
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 40,
          paddingBottom: 20,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          position: 'relative',
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ 
            position: 'absolute', 
            left: 15, 
            top: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 50,
            zIndex: 10 
          }}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={{ flex: 1, alignItems: 'center', marginHorizontal: 40 }}>
          <Text
            style={{
              color: '#fff',
              fontSize: 19,
              fontWeight: 'bold',
              textAlign: 'center',
            }}
          >
            {t('screens.niuRequest')}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 pb-3 bg-white rounded-t-3xl" showsVerticalScrollIndicator={false}>
        {/* Progress Steps */}
        <View className="p-5 border-b border-gray-200">
          <Text className="font-bold text-lg mb-4 text-gray-800">{t('niu.request.processTitle')}</Text>
          {steps.map(step => (
            <View key={step.id} className="flex-row items-center mb-3">
              <MaterialCommunityIcons
                name={step.completed ? "check-circle" : "progress-clock"}
                size={24}
                color={step.completed ? "#10b981" : "#9ca3af"}
                style={{ marginRight: 12 }}
              />
              <Text className={`text-base ${step.completed ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
                {step.title}
              </Text>
            </View>
          ))}
        </View>

        {/* CNI Upload Section */}
        {!completedSteps[1] && <CniUploadSection />}

        {/* Fees info */}
        <View className="bg-gray-50 p-5 mx-5 rounded-lg border border-gray-200 mb-4">
          <Text className="font-bold text-lg mb-2 text-gray-800">{t('niu.request.feesTitle')}</Text>
          <Text className="text-gray-700 mb-1">
            {t('niu.request.feesAmount')}: <Text className="font-bold text-green-600">{feeAmount.toLocaleString()} FCFA</Text>
          </Text>
          {getStatusMessage()}
        </View>

        {/* Terms */}
        {!completedSteps[1] && (
          <View className="p-5 border-t border-gray-200">
            <CheckBox
              title={t('niu.request.termsAccept')}
              checked={termsAccepted}
              onPress={() => setTermsAccepted(!termsAccepted)}
              containerStyle={{ 
                backgroundColor: 'transparent', 
                borderWidth: 0,
                marginLeft: 0,
                marginRight: 0,
              }}
              textStyle={{ 
                color: '#374151', 
                fontSize: 14,
                fontWeight: 'normal'
              }}
              checkedColor="#7ddd7d"
              size={22}
            />
            <CheckBox
              title={`${t('niu.request.paymentAccept')} ${feeAmount.toLocaleString()} FCFA`}
              checked={paymentAccepted}
              onPress={() => setPaymentAccepted(!paymentAccepted)}
              containerStyle={{ 
                backgroundColor: 'transparent', 
                borderWidth: 0,
                marginLeft: 0,
                marginRight: 0,
              }}
              textStyle={{ 
                color: '#374151', 
                fontSize: 14,
                fontWeight: 'normal'
              }}
              checkedColor="#7ddd7d"
              size={22}
            />
          </View>
        )}

        {/* Pay Button */}
        {!completedSteps[1] && (
          <View className="px-5 mb-8">
            <TouchableOpacity
              onPress={handlePayPress}
              className="bg-green-600 rounded-xl py-4 items-center shadow-lg"
              disabled={isSubmitting || uploading}
              style={{
                opacity: (isSubmitting || uploading) ? 0.6 : 1,
                shadowColor: '#10b981',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6,
              }}
            >
              {(isSubmitting || uploading) ? (
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color="#fff" />
                  <Text className="text-white text-lg font-semibold ml-3">
                    {uploading ? t('niu.cni.uploading') : t('common.processing')}
                  </Text>
                </View>
              ) : (
                <Text className="text-white text-lg font-semibold">
                  {t('niu.request.payButton')} - {feeAmount.toLocaleString()} FCFA
                </Text>
              )}
            </TouchableOpacity>
            
            {/* Security Badge */}
            <View className="flex-row items-center justify-center mt-4">
              <Ionicons name="shield-checkmark" size={16} color="#10b981" />
              <Text className="text-gray-500 text-xs ml-2">
                {t('niu.security.message')}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Payment Confirmation Modal */}
      <PaymentConfirmationModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onConfirm={handlePaymentConfirmation}
        amount={feeAmount}
        title={t('niu.paymentModal.title')}
        description={t('niu.paymentModal.message')}
        confirmLabel={t('niu.paymentModal.confirm')}
        cancelLabel={t('niu.paymentModal.cancel', 'Annuler')}
      />

      <Toast />
    </View>
  );
};

export default NiuRequest;