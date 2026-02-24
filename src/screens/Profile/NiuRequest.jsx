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
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  Modal
} from 'react-native';
import { MaterialCommunityIcons, AntDesign, Ionicons, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useGetBalanceQuery } from '../../services/WalletApi/walletApi';
import { useGetUserProfileQuery } from "../../services/Auth/authAPI"; 
import { useNiuResquestMutation, useGetUserRequestsQuery } from "../../services/Kyc/kycApi";
import { useGetConfigQuery } from '../../services/Config/configApi';
import Toast from 'react-native-toast-message';
import * as ImagePicker from 'expo-image-picker';
import TopLogo from '../../images/TopLogo.png';
import Loader from "../../components/Loader";
import { useAppState } from '../../context/AppStateContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Composant PaymentConfirmationModal intégré
const PaymentConfirmationModal = ({ 
  visible, 
  onClose, 
  onConfirm, 
  amount, 
  amountCAD,
  title, 
  description, 
  confirmLabel = 'Confirmer', 
  cancelLabel = 'Annuler', 
  currency = 'CAD',
  balance = 0
}) => {
  const navigation = useNavigation();
  const { t } = useTranslation();

  const handleConfirmPress = () => {
    onClose();
    // Naviguer vers l'écran de PIN
    navigation.navigate("Auth", {
      screen: "PinCode",
      params: {
        onSuccess: async () => {
          await onConfirm();
        },
        showBalance: false,
      },
    });
  };

  const hasSufficientBalance = balance >= amount;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        padding: 20,
      }}>
        <View style={{
          backgroundColor: 'white',
          borderRadius: 24,
          padding: 24,
          width: '100%',
          maxWidth: 400,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.1,
          shadowRadius: 20,
          elevation: 10,
        }}>
          {/* Header avec icône */}
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <View style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: hasSufficientBalance ? '#10b98120' : '#ef444420',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 16,
            }}>
              <Ionicons 
                name={hasSufficientBalance ? "shield-checkmark" : "alert-circle"} 
                size={48} 
                color={hasSufficientBalance ? '#10b981' : '#ef4444'} 
              />
            </View>
            <Text style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: '#1F2937',
              textAlign: 'center',
            }}>
              {title || t('niu.paymentModal.title')}
            </Text>
          </View>

          {/* Description */}
          <Text style={{
            fontSize: 16,
            color: '#4B5563',
            textAlign: 'center',
            marginBottom: 20,
            lineHeight: 24,
          }}>
            {description || t('niu.paymentModal.message', { amount: amountCAD?.toLocaleString() || amount })}
          </Text>

          {/* Détails du paiement */}
          <View style={{
            backgroundColor: '#F3F4F6',
            borderRadius: 16,
            padding: 16,
            marginBottom: 20,
          }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 14, color: '#6B7280' }}>{t('niu.paymentModal.amount')}</Text>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937' }}>
                {amountCAD?.toLocaleString()} {currency}
              </Text>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 14, color: '#6B7280' }}>{t('niu.paymentModal.balance')}</Text>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: '600', 
                color: hasSufficientBalance ? '#10b981' : '#ef4444' 
              }}>
                {balance?.toLocaleString()} {currency}
              </Text>
            </View>

            {!hasSufficientBalance && (
              <View style={{
                backgroundColor: '#ef444410',
                borderRadius: 8,
                padding: 10,
                marginTop: 8,
              }}>
                <Text style={{ color: '#ef4444', fontSize: 14, textAlign: 'center' }}>
                  {t('niu.errors.insufficientBalance')}
                </Text>
              </View>
            )}
          </View>

          {/* Boutons */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              onPress={onClose}
              style={{
                flex: 1,
                paddingVertical: 16,
                paddingHorizontal: 20,
                borderRadius: 12,
                backgroundColor: '#F3F4F6',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#4B5563', fontSize: 16, fontWeight: '600' }}>
                {cancelLabel}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={handleConfirmPress}
              disabled={!hasSufficientBalance}
              style={{
                flex: 1,
                paddingVertical: 16,
                paddingHorizontal: 20,
                borderRadius: 12,
                backgroundColor: hasSufficientBalance ? '#10b981' : '#D1D5DB',
                alignItems: 'center',
                opacity: hasSufficientBalance ? 1 : 0.5,
              }}
            >
              <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                {confirmLabel}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Message de sécurité */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 }}>
            <Ionicons name="lock-closed" size={14} color="#9CA3AF" />
            <Text style={{ color: '#9CA3AF', fontSize: 12, marginLeft: 4 }}>
              {t('niu.security.pinRequired')}
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const NiuRequest = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { isAppActive, appState } = useAppState();
  
  // State Management
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
  const [activeStep, setActiveStep] = useState(1);

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

  // API Hooks
  const { 
    data: userProfile, 
    isLoading: isProfileLoading, 
    refetch: refetchUserProfile,
    isFetching: isProfileFetching 
  } = useGetUserProfileQuery();
  
  const userId = userProfile?.data?.user?.id;
  const hasNiuProof = userProfile?.data?.user?.kycDocuments?.some(doc => doc.type === "NIU_PROOF");

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
  const feeAmount = Number(niuConfig?.value) || 0;
  const SENDO_VALUE_CAD_CA_CAM = configData?.data?.find(item => item.name === "SENDO_VALUE_CAD_CA_CAM");
  const rawFeeAmountCAD = feeAmount / (Number(SENDO_VALUE_CAD_CA_CAM?.value) || 1);
  const feeAmountCAD = Math.round(rawFeeAmountCAD);

  const {
    data: balanceData,
    error: balanceError,
    isLoading: isBalanceLoading,
    refetch: refetchBalance
  } = useGetBalanceQuery(userId, { skip: !userId });

  const balance = balanceData?.data?.balance || 0;

  const refetch = useCallback(() => {
    if (userId) {
      refetchUserProfile();
      refetchRequests();
      refetchConfig();
      refetchBalance();
    }
  }, [userId, refetchUserProfile, refetchRequests, refetchConfig, refetchBalance]);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  useEffect(() => {
    console.log('App State changed:', appState);
    if (appState === 'active') {
      refetch();
    }
  }, [appState, refetch]);

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
  }, [userId, isAppActive]);

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
        quality: 0.9,
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

  // Main Payment Handler
  const handlePaymentConfirmation = async () => {
    if (!cniImages.front) {
      showToast('error', t('niu.errors.title'), t('niu.cni.rectoMandatory'));
      return;
    }

    if (!userId) {
      showToast('error', t('niu.errors.title'), t('commonNiu.userNotFound'));
      return;
    }

    setUploading(true);

    try {
      // Upload front side
      const formData = new FormData();
      formData.append('type', 'NIU_REQUEST');
      formData.append('description', 'Demande de NIU');
      
      const frontFile = {
        uri: cniImages.front,
        name: `cni_recto_${userId}_${Date.now()}.jpg`,
        type: 'image/jpeg'
      };
      
      formData.append('request', frontFile);

      const result = await niuRequest(formData).unwrap();
      console.log('NIU Request successful:', result);

      // Upload back side if exists
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
          console.warn('Back upload failed:', backError);
        }
      }

      setUploading(false);
      setCompletedSteps(prev => ({ ...prev, 1: true }));
      setActiveStep(3);
      
      showToast('success', t('niu.success.title'), t('niu.success.message'));
      
      // Refresh data
      setTimeout(() => {
        refetchRequests();
        refetchUserProfile();
        refetchBalance();
      }, 2000);
      
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
      showToast('error', t('niu.errors.title'), t('niu.cni.rectoMandatory'));
      return;
    }

    if (!userId) {
      showToast('error', t('niu.errors.title'), t('commonNiu.userNotFound'));
      return;
    }

    // Ouvrir le modal de confirmation au lieu de naviguer directement
    setShowPaymentModal(true);
  };

  const getStatusMessage = () => {
    if (!userRequests?.data?.items) return null;

    const niuRequests = userRequests.data.items.filter(req => req.type === 'NIU_REQUEST');
    const processed = niuRequests.find(req => req.status === 'PROCESSED');
    const pending = niuRequests.find(req => req.status === 'UNPROCESSED' || req.status === 'PENDING');
    const rejected = niuRequests.find(req => req.status === 'REJECTED');

    if (processed) {
      return (
        <View className="flex-row items-center mt-2">
          <Ionicons name="checkmark-circle" size={20} color="#10b981" />
          <Text className="text-green-600 ml-2 font-bold text-lg">{t('niu.request.statusApproved')}</Text>
        </View>
      );
    }
    if (pending) {
      return (
        <View className="flex-row items-center mt-2">
          <Ionicons name="time" size={20} color="#f59e0b" />
          <Text className="text-amber-600 ml-2 font-bold text-lg">{t('niu.request.statusPending')}</Text>
        </View>
      );
    }
    if (rejected) {
      return (
        <View className="mt-2">
          <View className="flex-row items-center">
            <Ionicons name="close-circle" size={20} color="#ef4444" />
            <Text className="text-red-600 ml-2 font-bold text-lg">
              {t('niu.request.statusRejected')}
            </Text>
          </View>
          {rejected.reason && (
            <Text className="text-red-500 mt-1 text-sm">
              {t('niu.request.raison')}: {rejected.reason}
            </Text>
          )}
        </View>
      );
    }
    return null;
  };

  const CniUploadSection = () => (
    <View className="mx-5 mb-6">
      <View className="mb-6">
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          {t('niu.cni.uploadTitle')}
        </Text>
      </View>

      <View className="flex-row justify-between mb-6">
        {/* Front Side */}
        <View className="flex-1 mr-3">
          <View className="flex-row items-center mb-3">
            <Text className="text-gray-800 font-semibold text-base">
              {t('niu.cni.frontSide')}
            </Text>
            <Text className="text-red-500 ml-1">*</Text>
          </View>
          
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                t('niu.cni.uploadOption'),
                t('niu.cni.chooseMethod'),
                [
                  { text: t('niu.cni.takePhoto'), onPress: () => takePhoto('front') },
                  { text: t('niu.cni.chooseFromGallery'), onPress: () => pickImage('front') },
                  { text: t('commonNiu.cancel'), style: 'cancel' }
                ]
              );
            }}
            className="border-2 border-dashed border-green-500 rounded-2xl p-4 items-center justify-center h-48 bg-gradient-to-b from-green-50 to-white"
          >
            {cniImages.front ? (
              <View className="relative w-full h-full">
                <Image 
                  source={{ uri: cniImages.front }} 
                  className="w-full h-full rounded-xl"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => setCniImages(prev => ({ ...prev, front: null }))}
                  className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                >
                  <Ionicons name="close" size={18} color="white" />
                </TouchableOpacity>
              </View>
            ) : (
              <View className="items-center">
                <View className="w-16 h-16 rounded-full bg-green-100 items-center justify-center mb-3">
                  <Ionicons name="camera" size={32} color="#10b981" />
                </View>
                <Text className="text-green-700 font-medium text-center text-sm">
                  {t('niu.cni.uploadFront')}
                </Text>
                <Text className="text-gray-500 text-xs mt-1 text-center">
                  {t('commonNiu.tapToSelect')}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <Text className="text-red-500 text-xs mt-2 text-center font-medium">
            {t('niu.cni.rectoMandatory')}
          </Text>
        </View>

        {/* Back Side */}
        <View className="flex-1 ml-3">
          <Text className="text-gray-800 font-semibold text-base mb-3">
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
                  { text: t('commonNiu.cancel'), style: 'cancel' }
                ]
              );
            }}
            className="border-2 border-dashed border-blue-400 rounded-2xl p-4 items-center justify-center h-48 bg-gradient-to-b from-blue-50 to-white"
          >
            {cniImages.back ? (
              <View className="relative w-full h-full">
                <Image 
                  source={{ uri: cniImages.back }} 
                  className="w-full h-full rounded-xl"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => setCniImages(prev => ({ ...prev, back: null }))}
                  className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
                >
                  <Ionicons name="close" size={18} color="white" />
                </TouchableOpacity>
              </View>
            ) : (
              <View className="items-center">
                <View className="w-16 h-16 rounded-full bg-blue-100 items-center justify-center mb-3">
                  <Ionicons name="images" size={32} color="#3b82f6" />
                </View>
                <Text className="text-blue-700 font-medium text-center text-sm">
                  {t('niu.cni.uploadBack')}
                </Text>
                <Text className="text-gray-500 text-xs mt-1 text-center">
                  {t('niu.cni.versoRecommended')}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <Text className="text-blue-500 text-xs mt-2 text-center font-medium">
            {t('niu.cni.versoRecommended')}
          </Text>
        </View>
      </View>
    </View>
  );

  // Loading State
  if (isConfigLoading || isProfileLoading || isBalanceLoading || isRequestsLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gradient-to-b from-gray-50 to-white">
        <Loader size="large" />
        <Text className="mt-4 text-gray-600">{t('commonNiu.loading')}</Text>
      </View>
    );
  }

  // Already Have NIU Screen
  const hasProcessedNiuRequest = userRequests?.data?.items?.some(
    req => req.type === 'NIU_REQUEST' && req.status === 'PROCESSED'
  );

  const shouldShowAlreadyHaveScreen = hasNiuProof || hasProcessedNiuRequest;

  if (shouldShowAlreadyHaveScreen) {
    return (
      <View className="flex-1 bg-white">
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        
        <LinearGradient
          colors={['#7ddd7d', '#10b981']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{
            paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
            paddingBottom: 15,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15 }}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{ padding: 8, width: 40 }}
            >
              <AntDesign name="left" size={24} color="white" />
            </TouchableOpacity>
            
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Image
                source={TopLogo}
                style={{ height: 40, width: 80, resizeMode: 'contain' }}
              />
            </View>
            
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>

        <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
          <View className="flex-1 items-center justify-center p-8">
            <View className="items-center mb-8">
              <View className="w-32 h-32 rounded-full bg-green-100 items-center justify-center mb-6">
                <MaterialCommunityIcons
                  name="check-circle"
                  size={80}
                  color="#10b981"
                />
              </View>
              <Text className="text-3xl font-bold text-gray-900 mb-3 text-center">
                {t('niu.alreadyHave.title')}
              </Text>
              <Text className="text-lg text-gray-600 text-center leading-6">
                {t('niu.alreadyHave.message')}
              </Text>
            </View>

            <TouchableOpacity
              onPress={() => navigation.navigate('MainTabs')}
              className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl py-4 px-8 w-full shadow-lg"
              style={{
                shadowColor: '#10b981',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <Text className="text-white text-center text-lg font-semibold">
                {t('niu.alreadyHave.backButton')}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Main Component Render
  const steps = [
    { id: 1, title: t('niu.steps.fees'), icon: 'credit-card' },
    { id: 2, title: t('niu.steps.kyc'), icon: 'shield-check' },
    { id: 3, title: t('niu.steps.cniUpload'), icon: 'camera' },
    { id: 4, title: t('niu.steps.niuNumber'), icon: 'id-card' },
    { id: 5, title: t('niu.steps.attestation'), icon: 'file-document' },
  ];

  return (
    <View className="flex-1 bg-white">
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      <LinearGradient
        colors={['#7ddd7d', '#10b981']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{
          paddingTop: Platform.OS === 'ios' ? 50 : StatusBar.currentHeight + 10,
          paddingBottom: 15,
        }}
      >
        <View className="px-5">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              className="p-2"
            >
              <AntDesign name="left" size={24} color="white" />
            </TouchableOpacity>
            
            <View className="flex-1 items-center">
              <Text className="text-white text-xl font-bold">
                {t('screensNiu.niuRequest')}
              </Text>
            </View>
            
            <TouchableOpacity className="p-2">
              <Feather name="help-circle" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
        <ScrollView 
          className="flex-1 bg-gray-50"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 30 }}
        >
          {/* Progress Steps */}
          <View className="mx-5 mt-6 mb-8">
            <Text className="text-2xl font-bold text-gray-900 mb-6">
              {t('niu.request.processTitle')}
            </Text>
            
            <View className="flex-row justify-between mb-2">
              {steps.map((step, index) => (
                <View key={step.id} className="items-center">
                  <View className={`w-12 h-12 rounded-full items-center justify-center ${
                    activeStep >= step.id 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                      : 'bg-gray-200'
                  }`}>
                    <MaterialCommunityIcons
                      name={step.icon}
                      size={24}
                      color={activeStep >= step.id ? 'white' : '#9ca3af'}
                    />
                  </View>
                  {index < steps.length - 1 && (
                    <View 
                      className={`absolute top-6 left-12 w-20 h-0.5 ${
                        activeStep > step.id ? 'bg-green-500' : 'bg-gray-200'
                      }`}
                      style={{ zIndex: -1 }}
                    />
                  )}
                </View>
              ))}
            </View>
            
            <View className="flex-row justify-between">
              {steps.map(step => (
                <Text 
                  key={step.id}
                  className={`text-xs font-medium text-center w-12 mt-2 ${
                    activeStep >= step.id ? 'text-gray-900' : 'text-gray-400'
                  }`}
                  numberOfLines={2}
                >
                  {step.title}
                </Text>
              ))}
            </View>
          </View>

          {/* CNI Upload Section */}
          {!completedSteps[1] && <CniUploadSection />}

          {/* Fees Info Card */}
          <View className="mx-5 mb-6">
            <View className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-xl font-bold text-gray-900">
                  {t('niu.request.feesTitle')}
                </Text>
                <View className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-full px-3 py-1">
                  <Text className="text-green-700 font-bold">
                    {feeAmountCAD.toLocaleString()} CAD
                  </Text>
                </View>
              </View>
              
              {getStatusMessage()}
            </View>
          </View>

          {/* Terms and Conditions */}
          {!completedSteps[1] && (
            <View className="mx-5 mb-6">
              <View className="bg-white rounded-2xl p-5 shadow-lg border border-gray-100">
                <Text className="text-xl font-bold text-gray-900 mb-4">
                  {t('commonNiu.termsAndConditions')}
                </Text>
                
                <View className="space-y-4">
                  <TouchableOpacity
                    onPress={() => setTermsAccepted(!termsAccepted)}
                    className="flex-row items-start"
                  >
                    <View className={`w-6 h-6 rounded border-2 items-center justify-center mr-3 mt-1 ${
                      termsAccepted 
                        ? 'bg-green-500 border-green-500' 
                        : 'border-gray-300'
                    }`}>
                      {termsAccepted && (
                        <Ionicons name="checkmark" size={16} color="white" />
                      )}
                    </View>
                    <Text className="text-gray-700 flex-1">
                      {t('niu.request.termsAccept')}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => setPaymentAccepted(!paymentAccepted)}
                    className="flex-row items-start"
                  >
                    <View className={`w-6 h-6 rounded border-2 items-center justify-center mr-3 mt-1 ${
                      paymentAccepted 
                        ? 'bg-green-500 border-green-500' 
                        : 'border-gray-300'
                    }`}>
                      {paymentAccepted && (
                        <Ionicons name="checkmark" size={16} color="white" />
                      )}
                    </View>
                    <Text className="text-gray-700 flex-1">
                      {t('niu.request.paymentAccept')} {feeAmountCAD.toLocaleString()} CAD
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Action Button */}
          {!completedSteps[1] && (
            <View className="mx-5">
              <TouchableOpacity
                onPress={handlePayPress}
                disabled={isSubmitting || uploading || !termsAccepted || !paymentAccepted}
                className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl py-5 items-center shadow-xl"
                style={{
                  opacity: (isSubmitting || uploading || !termsAccepted || !paymentAccepted) ? 0.6 : 1,
                  shadowColor: '#10b981',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 16,
                  elevation: 12,
                }}
              >
                {(isSubmitting || uploading) ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="white" />
                    <Text className="text-white text-lg font-semibold ml-3">
                      {uploading ? t('commonNiu.uploading') : t('commonNiu.processing')}
                    </Text>
                  </View>
                ) : (
                  <View className='flex-row items-center'>
                    <Text className="text-white text-xl font-bold">
                      {t('niu.request.payButton')}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              
              {/* Security Badge */}
              <View className="flex-row items-center justify-center mt-4">
                <Ionicons name="shield-checkmark" size={20} color="#10b981" />
                <Text className="text-gray-500 text-sm ml-2">
                  {t('niu.security.message')}
                </Text>
              </View>
              
              {/* Validation Messages */}
              {(!termsAccepted || !paymentAccepted) && (
                <Text className="text-amber-600 text-center mt-4 text-sm">
                  {t('niu.errors.termsNotAccepted')}
                </Text>
              )}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Payment Confirmation Modal */}
      <PaymentConfirmationModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        onConfirm={handlePaymentConfirmation}
        amount={feeAmount}
        amountCAD={feeAmountCAD}
        title={t('niu.paymentModal.title')}
        description={t('niu.paymentModal.message', { amount: feeAmountCAD.toLocaleString() })}
        confirmLabel={t('niu.paymentModal.confirm')}
        cancelLabel={t('niu.paymentModal.cancel')}
        balance={balance}
        currency='CAD'
      />

      <Toast />
    </View>
  );
};

export default NiuRequest;