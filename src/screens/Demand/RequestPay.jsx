import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import TopLogo from '../../images/TopLogo.png';

const RequestPay = ({ navigation, route }) => {
  const { demand } = route.params;

  const totalPaid = demand.recipients?.reduce((sum, r) => sum + (r.amountPaid || 0), 0);
  const remaining = demand.amount - totalPaid;

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

  return (
    <>
      <StatusBar style="light" />

      {/* Header */}
      <View
        style={{
          height: 100,
          paddingHorizontal: 20,
          paddingTop: 48,
          backgroundColor: '#151c1f',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
        }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Top Logo */}
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

      {/* Divider */}
      <View className="border border-dashed border-gray-300 mb-4" />

      <ScrollView style={{ padding: 20, backgroundColor: '#0A0F1F' }}>
        <Text style={{ color: '#4ade80', fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>
          Détails de la demande
        </Text>

        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16 }}>
          <Text style={{ textAlign: 'right', fontWeight: 'bold', fontSize: 12, marginBottom: 8 }}>
            Facture No.{demand.reference}
          </Text>

          <Text style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 4, color: '#000' }}>
            Description du service
          </Text>
          <Text style={{ color: '#444', marginBottom: 12 }}>{demand.description}</Text>

          {/* Status */}
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

          {/* Amounts */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontWeight: 'bold', color: '#000' }}>Montant total</Text>
            <Text style={{ color: 'green' }}>{demand.amount.toLocaleString()} XAF</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontWeight: 'bold', color: '#000' }}>Payé</Text>
            <Text>{totalPaid.toLocaleString()} XAF</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text style={{ fontWeight: 'bold', color: '#000' }}>Reste</Text>
            <Text>{remaining.toLocaleString()} XAF</Text>
          </View>

          {/* Dates */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontWeight: 'bold', color: '#000' }}>Créé le</Text>
            <Text>{demand.createdAt?.split('T')[0]}</Text>
          </View>
          {demand.dueDate && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
              <Text style={{ fontWeight: 'bold', color: '#000' }}>Délai</Text>
              <Text>{demand.dueDate?.split('T')[0]}</Text>
            </View>
          )}

          {/* Recipients */}
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

          {demand.recipients?.map((r, i) => (
            <View key={i} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontWeight: '600', color: '#000' }}>Nom</Text>
                <Text>{r.recipient?.firstname} {r.recipient?.lastname}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontWeight: '600', color: '#000' }}>Email</Text>
                <Text>{r.recipient?.email}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontWeight: '600', color: '#000' }}>Téléphone</Text>
                <Text>{r.recipient?.phone}</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontWeight: '600', color: '#000' }}>Payé</Text>
                <Text>{(r.amountPaid || 0).toLocaleString()} XAF</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </>
  );
};

export default RequestPay;
