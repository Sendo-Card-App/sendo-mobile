import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons, FontAwesome5, MaterialIcons,AntDesign } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSubscribeToFundMutation } from '../../services/Fund/fundSubscriptionApi';

const ConfirmSubscription = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const route = useRoute();
  const { fund, amount, currency } = route.params;
  
  const [subscribe, { isLoading }] = useSubscribeToFundMutation();

  const annualCommission = (amount * fund.annualCommission) / 100;
  
  // Format current date in French format (DD/MM/YYYY)
  const getCurrentDate = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0'); // January is 0
    const year = today.getFullYear();
    
    return `${day}/${month}/${year}`;
  };
  
  const calculateEndDate = () => {
    const currentYear = new Date().getFullYear();
    const subscriptionEnd = new Date(currentYear, 11, 31); // December 31st
    return subscriptionEnd.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

const handleConfirmSubscription = async () => {
    try {
      const result = await subscribe({
        fundId: fund.id,
        currency: currency,
      }).unwrap();

      Alert.alert(
        t('blockedFunds.subscriptionSuccess') || 'Souscription réussie',
        t('blockedFunds.subscriptionSuccessMessage') || 'Votre souscription a été effectuée avec succès',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('MySubscriptions'),
          },
        ]
      );
    } catch (error) {
      console.log("Subscription error:", JSON.stringify(error, null, 2));
      
      // Analyser la structure de l'erreur
      let errorMessage = '';
      
      // CAS 1: Erreur avec la structure spécifique que vous avez montrée
      // { status: 500, data: { status: 500, message: "Erreur de souscription", data: { errors: ["Solde insuffisant"] } } }
      if (error.data?.data?.errors && Array.isArray(error.data.data.errors)) {
        errorMessage = error.data.data.errors.join('\n');
      }
      // CAS 2: Erreur avec data.errors (tableau)
      else if (error.data?.errors && Array.isArray(error.data.errors)) {
        errorMessage = error.data.errors.join('\n');
      }
      // CAS 3: Erreur avec data.message
      else if (error.data?.message) {
        errorMessage = error.data.message;
      }
      // CAS 4: Erreur avec data.data.message (structure imbriquée)
      else if (error.data?.data?.message) {
        errorMessage = error.data.data.message;
      }
      // CAS 5: Erreur avec message direct
      else if (error.message) {
        errorMessage = error.message;
      }
      // CAS 6: Erreur avec status et message
      else if (error.status && error.error) {
        errorMessage = error.error;
      }
      // CAS 7: Fallback - On garde le message en français
      else {
        errorMessage = 'Une erreur est survenue lors de la souscription';
      }

      Alert.alert(
        'Erreur de souscription',
        errorMessage,
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <View className="flex-1 bg-[#F2F2F2]">
      <StatusBar backgroundColor="#7ddd7d" barStyle="light-content" />
      
      {/* Header */}
      <View className="bg-[#7ddd7d] pt-12 pb-6 px-6 rounded-b-3xl shadow-lg">
        <View className="flex-row items-center justify-between">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="w-12 h-12 bg-white/20 rounded-2xl items-center justify-center"
          >
            <AntDesign name="left" size={24} color="white" />
          </TouchableOpacity>
          <View className="flex-1 items-center">
            <Text className="text-white font-bold text-xl">{t('blockedFunds.confirmSubscription')}</Text>
            <Text className="text-white/90 text-sm">Étape finale</Text>
          </View>
          <View style={{ width: 48 }} />
        </View>
      </View>

      <ScrollView className="flex-1 px-6 pt-6" showsVerticalScrollIndicator={false}>
        {/* Confirmation Card */}
        <View className="bg-white rounded-2xl p-6 mb-6 shadow-lg">
          <View className="items-center mb-6">
            <View className="bg-[#7ddd7d]/20 p-5 rounded-full mb-4">
              <FontAwesome5 name="check-circle" size={40} color="#7ddd7d" />
            </View>
            <Text className="text-gray-800 font-bold text-2xl mb-2">Confirmation</Text>
            <Text className="text-gray-600 text-center text-base">
              Vérifiez les détails avant de confirmer
            </Text>
          </View>

          {/* Fund Info */}
          <View className="bg-[#F8F9FA] rounded-xl p-4 mb-6 border border-gray-100">
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <View className="bg-[#7ddd7d]/10 p-3 rounded-lg mr-3">
                  <FontAwesome5 name="coins" size={20} color="#7ddd7d" />
                </View>
                <View>
                  <Text className="text-gray-800 font-bold text-lg">{fund.name}</Text>
                </View>
              </View>
              <View className="bg-[#7ddd7d]/10 px-3 py-1 rounded-full">
                <Text className="text-[#5dc75d] font-bold">{fund.annualCommission}%</Text>
              </View>
            </View>
          </View>

          {/* Details */}
          <View className="space-y-4 mb-6">
            <Text className="text-gray-800 font-bold text-lg">Détails de l'investissement</Text>
            
            <DetailItem 
              label="Montant investi"
              value={`${amount.toLocaleString()} ${currency}`}
              icon="cash-outline"
              color="#7ddd7d"
            />
            
            <DetailItem 
              label="Commission annuelle"
              value={`${annualCommission.toLocaleString()} ${currency}`}
              icon="trending-up-outline"
              color="#3B82F6"
            />
            
            <DetailItem 
              label="Date de début"
              value={getCurrentDate()} // Now shows current date (e.g., "13/02/2026")
              icon="calendar-outline"
              color="#F59E0B"
            />
            
            <DetailItem 
              label="Date de fin"
              value={calculateEndDate()}
              icon="lock-closed-outline"
              color="#EF4444"
            />
          </View>

          {/* Features */}
          <View className="mb-6">
            <Text className="text-gray-800 font-bold text-lg mb-3">Avantages</Text>
            <View className="space-y-3">
              <FeatureItem 
                text="Rendement garanti de 10% annuel"
                icon="checkmark-circle"
              />
              <FeatureItem 
                text="Fonds sécurisés et assurés"
                icon="shield-checkmark"
              />
              <FeatureItem 
                text="Période limitée jusqu'au 31/12"
                icon="timer-outline"
              />
            </View>
          </View>

          {/* Important Note */}
          <View className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-100">
            <View className="flex-row items-start">
              <MaterialIcons name="info" size={20} color="#3B82F6" />
              <Text className="text-blue-800 text-sm ml-2 flex-1">
                En confirmant, vous acceptez que les fonds soient bloqués jusqu'au 31/12/{new Date().getFullYear()}.
                La commission annuelle sera calculée sur cette période.
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="mb-8">
          <TouchableOpacity
            onPress={() =>
            navigation.navigate("Auth", {
              screen: "PinCode",
              params: {
                onSuccess: async () => {
                  await handleConfirmSubscription();
                },
              },
            })
          }
            disabled={isLoading}
            className={`${isLoading ? 'bg-[#5dc75d]' : 'bg-[#7ddd7d]'} rounded-xl py-4 items-center mb-4 shadow-md`}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <View className="flex-row items-center">
                <Ionicons name="checkmark-circle" size={22} color="white" />
                <Text className="text-white font-bold text-lg ml-2">
                  Confirmer l'investissement
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            disabled={isLoading}
            className="bg-gray-200 rounded-xl py-4 items-center"
          >
            <Text className="text-gray-700 font-bold">Retour</Text>
          </TouchableOpacity>
        </View>

        {/* Security Note */}
        <View className="items-center mb-10">
          <View className="flex-row items-center">
            <Ionicons name="shield-checkmark" size={16} color="#7ddd7d" />
            <Text className="text-gray-500 text-sm ml-2">
              Vos données sont sécurisées et cryptées
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const DetailItem = ({ label, value, icon, color }) => (
  <View className="flex-row justify-between items-center py-3 border-b border-gray-100">
    <View className="flex-row items-center flex-1">
      <Ionicons name={icon} size={18} color={color} />
      <Text className="text-gray-600 font-medium ml-2">{label}</Text>
    </View>
    <Text className="text-gray-800 font-bold">{value}</Text>
  </View>
);

const FeatureItem = ({ text, icon }) => (
  <View className="flex-row items-center">
    <Ionicons name={icon} size={18} color="#7ddd7d" />
    <Text className="text-gray-700 ml-3 flex-1">{text}</Text>
  </View>
);

export default ConfirmSubscription;