import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useUpdateFundRequestStatusMutation } from '../../services/Fund/fundApi';
import { useGetUserProfileQuery } from '../../services/Auth/authAPI';
import Loader from '../../components/Loader';
const TopLogo = require('../../Images/TopLogo.png');

const DetailsList = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { demand } = route.params;

  const { data: userProfile } = useGetUserProfileQuery();
  const currentUserId = userProfile?.data?.id;

  const [updateStatus, { isLoading }] = useUpdateFundRequestStatusMutation();

  const getStatusLabel = (status) => {
    switch (status) {
      case 'PENDING':
        return { label: 'En attente', colorBg: '#FFF3CD', colorText: '#856404' };
      case 'PAID':
        return { label: 'Payé', colorBg: '#D4EDDA', colorText: '#155724' };
      case 'CANCELLED':
        return { label: 'Annulé', colorBg: '#F8D7DA', colorText: '#721C24' };
      default:
        return { label: status, colorBg: '#E2E3E5', colorText: '#383D41' };
    }
  };

  const statusStyle = getStatusLabel(demand.status);

  const handleCancelRequest = async () => {
    Alert.alert(
      'Confirmation',
      'Voulez-vous vraiment annuler cette demande ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui',
          onPress: async () => {
            try {
              await updateStatus({ id: demand.id, status: 'CANCELLED' }).unwrap();
              Alert.alert('Succès', 'La demande a été annulée.');
              navigation.goBack();
            } catch (error) {
              console.error(error);
              Alert.alert('Erreur', 'Une erreur est survenue lors de l’annulation.');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: '#0A0F1F',
        paddingHorizontal: 16,
        paddingTop: 40,
      }}
    >
      {/* Header */}
      <View
        style={{
          height: 50,
          paddingHorizontal: 20,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Logo */}
      <View
        style={{
          position: 'absolute',
          top: -48,
          left: 0,
          right: 0,
          alignItems: 'center',
        }}
      >
        <Image source={TopLogo} style={{ height: 120, width: 160 }} resizeMode="contain" />
      </View>

      <View className="border border-dashed border-gray-300 mb-10" />

      <Text style={{ color: '#4ade80', fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>
        Détails de la demande
      </Text>

      <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16 }}>
        <Text style={{ textAlign: 'right', fontWeight: 'bold', fontSize: 12, marginBottom: 8 }}>
          Facture No.{demand.reference}
        </Text>

        <Text style={{ fontWeight: 'bold', color: '#000', marginBottom: 4, fontSize: 15 }}>
          Description du service
        </Text>
        <Text style={{ color: '#444', marginBottom: 12 }}>{demand.description}</Text>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 12,
            justifyContent: 'space-between',
          }}
        >
          <Text style={{ fontWeight: 'bold', color: '#000' }}>Statut</Text>
          <View
            style={{
              backgroundColor: statusStyle.colorBg,
              borderRadius: 9999,
              paddingHorizontal: 12,
              paddingVertical: 4,
              width: 96,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: statusStyle.colorText, fontWeight: '600', fontSize: 12 }}>
              {statusStyle.label}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ fontWeight: 'bold', color: '#000' }}>Montant total</Text>
          <Text style={{ color: 'green' }}>{demand.amount.toLocaleString()} XAF</Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
          <Text style={{ fontWeight: 'bold', color: '#000' }}>Délai</Text>
          <Text>{demand.deadline?.substring(0, 10)}</Text>
        </View>

        <Text
          style={{
            fontWeight: 'bold',
            color: '#000',
            marginBottom: 8,
            borderTopWidth: 1,
            borderTopColor: '#999',
            borderStyle: 'dashed',
            paddingTop: 16,
          }}
        >
          Destinataire(s)
        </Text>

        {demand.recipients?.map((r, index) => (
          <View key={index} style={{ marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontWeight: '600', color: '#000' }}>Nom</Text>
              <Text>{r.recipient?.firstname} {r.recipient?.lastname}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontWeight: '600', color: '#000' }}>Adresse email</Text>
              <Text>{r.recipient?.email}</Text>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontWeight: '600', color: '#000' }}>Numéro de téléphone</Text>
              <Text>{r.recipient?.phone}</Text>
            </View>
          </View>
        ))}

        {/* Cancel Button */}
        {demand.status === 'PENDING' && demand.userId === currentUserId && (
          <TouchableOpacity
            onPress={handleCancelRequest}
            disabled={isLoading}
            style={{
              marginTop: 20,
              backgroundColor: '#DC2626',
              padding: 12,
              borderRadius: 8,
              alignItems: 'center',
              flexDirection: 'row',
              justifyContent: 'center',
            }}
          >
            {isLoading ? (
              <Loader color="#fff" />
            ) : (
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Annuler la demande</Text>
            )}
          </TouchableOpacity>

        )}
      </View>
    </ScrollView>
  );
};

export default DetailsList;
