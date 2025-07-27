import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import TopLogo from '../../images/TopLogo.png';
import Toast from 'react-native-toast-message';

import {
  useUpdateRecipientStatusMutation,
  usePayFundRequestMutation,
} from '../../services/Fund/fundApi';
import { useGetBalanceQuery } from '../../services/WalletApi/walletApi';
import { useGetUserProfileQuery } from '../../services/Auth/authAPI';

const RequestPay = ({ navigation, route }) => {
  const { demand } = route.params;

  const requestFund = demand?.requestFund ?? demand ?? {};
  const recipients = requestFund?.recipients ?? [];
  const initiator = requestFund?.requesterFund ?? null;

  const [updateRecipientStatus, { isLoading: isUpdating }] = useUpdateRecipientStatusMutation();
  const [payFundRequest, { isLoading: isPaying }] = usePayFundRequestMutation();
  const { data: userProfile } = useGetUserProfileQuery();
  const userId = userProfile?.data?.id;

  const { data: balanceData } = useGetBalanceQuery(userId, { skip: !userId });
  const balance = balanceData?.data?.balance ?? 0;

  const [modalVisible, setModalVisible] = useState(false);
  const [amountToPay, setAmountToPay] = useState('');
  const [currentRecipientId, setCurrentRecipientId] = useState(null);

  const totalPaid = recipients.reduce((sum, r) => sum + (r.amountPaid || 0), 0);
  const remaining = (requestFund.amount ?? 0) - totalPaid;

  const handleStatusUpdate = async (recipientId, status) => {
    try {
      await updateRecipientStatus({ requestRecipientId: recipientId, status }).unwrap();
      Toast.show({
        type: 'success',
        text1: `Statut mis à jour : ${status}`,
      });
      navigation.goBack();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: 'Impossible de mettre à jour le statut.',
      });
    }
  };

  const openPaymentModal = (recipientId) => {
    setCurrentRecipientId(recipientId);
    setAmountToPay('');
    setModalVisible(true);
  };

  const handlePay = async () => {
    const amount = parseFloat(amountToPay);
    if (!amount || amount <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer un montant valide.');
      return;
    }

    if (balance < amount) {
      Alert.alert('Erreur', 'Solde insuffisant pour effectuer ce paiement.');
      return;
    }

    const payloadToSend = {
      amount,
      fundRequestId: requestFund.id,
      description: requestFund.description,
    };
    console.log(payloadToSend)
    try {
      await payFundRequest({
        requestRecipientId: currentRecipientId,
        payload: payloadToSend,
      }).unwrap();

      Toast.show({
        type: 'success',
        text1: 'Paiement effectué avec succès.',
        visibilityTime: 1000,
        onHide: () => navigation.goBack(),
      });

      setModalVisible(false);
    } catch (error) {
      console.log("Full response:", JSON.stringify(error, null, 2));
      Toast.show({
        type: 'error',
        text1: 'Erreur de paiement',
        text2: error?.data?.message || 'Une erreur est survenue',
      });
    }
  };

  if (!requestFund?.id) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0F1F' }}>
        <Text style={{ color: '#fff' }}>Chargement des détails...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <View style={{
        height: 100,
        paddingHorizontal: 20,
        paddingTop: 48,
        backgroundColor: '#0A0F1F',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={{
        position: 'absolute',
        top: -48,
        left: 0,
        right: 0,
        alignItems: 'center',
      }}>
        <Image source={TopLogo} style={{ height: 120, width: 160 }} resizeMode="contain" />
      </View>

      <ScrollView style={{ padding: 20, backgroundColor: '#0A0F1F' }}>
        <Text style={{ color: '#4ade80', fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>
          Détails de la demande
        </Text>

        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16 }}>
          <Text style={{ textAlign: 'right', fontWeight: 'bold', fontSize: 12, marginBottom: 8 }}>
            Facture No.{requestFund.reference}
          </Text>

          <Text style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 4, color: '#000' }}>Description</Text>
          <Text style={{ color: '#444', marginBottom: 12 }}>{requestFund.description}</Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontWeight: 'bold', color: '#000' }}>Montant total</Text>
            <Text style={{ color: 'green' }}>{(requestFund.amount || 0).toLocaleString()} XAF</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontWeight: 'bold', color: '#000' }}>Payé</Text>
            <Text>{totalPaid.toLocaleString()} XAF</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
            <Text style={{ fontWeight: 'bold', color: '#000' }}>Reste</Text>
            <Text>{remaining.toLocaleString()} XAF</Text>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontWeight: 'bold', color: '#000' }}>Créé le</Text>
            <Text>{requestFund.createdAt?.split('T')[0]}</Text>
          </View>

          {requestFund.deadline && (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
              <Text style={{ fontWeight: 'bold', color: '#000' }}>Délai</Text>
              <Text>{requestFund.deadline.split('T')[0]}</Text>
            </View>
          )}

          {initiator && (
            <View style={{
              backgroundColor: '#F5F6FA',
              padding: 12,
              borderRadius: 12,
              marginBottom: 12,
              borderLeftWidth: 4,
              borderLeftColor: 'green',
            }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#4ade80', marginBottom: 4 }}>
                Initiateur
              </Text>
              <Text style={{ fontSize: 14, color: '#333' }}>
                {initiator.firstname} {initiator.lastname}
              </Text>
            </View>
          )}

          <Text style={{
            fontWeight: 'bold',
            color: '#000',
            marginBottom: 8,
            borderTopWidth: 1,
            borderTopColor: '#999',
            borderStyle: 'dashed',
            paddingTop: 16,
          }}>
            Destinataire(s)
          </Text>

          {recipients.filter(r => r.recipientId === userId).map((r, index) => (
            <View key={index} style={{ marginBottom: 24 }}>
              <Text style={{ fontWeight: '600', color: '#000' }}>Nom: {r.recipient?.firstname} {r.recipient?.lastname}</Text>
              <Text style={{ fontWeight: '600', color: '#000' }}>Email: {r.recipient?.email}</Text>
              <Text style={{ fontWeight: '600', color: '#000' }}>Téléphone: {r.recipient?.phone}</Text>

              <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 }}>
                {['ACCEPTED', 'REJECTED', 'PAID'].map(status => (
                  <TouchableOpacity
                    key={status}
                    style={{
                      backgroundColor:
                        status === 'ACCEPTED' ? '#4ade80' :
                          status === 'REJECTED' ? '#f87171' : '#60a5fa',
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                    }}
                    onPress={() => handleStatusUpdate(r.id, status)}
                    disabled={isUpdating}
                  >
                    <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>{status}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={{
                  marginTop: 10,
                  backgroundColor: '#16a34a',
                  paddingVertical: 8,
                  borderRadius: 8,
                  alignItems: 'center',
                }}
                onPress={() => openPaymentModal(r.id)}
                disabled={isPaying}
              >
                <Text style={{ color: '#fff', fontWeight: '600' }}>Payer</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Modal Paiement */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.5)',
        }}>
          <View style={{
            width: '90%',
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 20,
          }}>
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 12 }}>Montant à payer</Text>
            <TextInput
              keyboardType="numeric"
              placeholder="Montant"
              value={amountToPay}
              onChangeText={setAmountToPay}
              style={{
                borderWidth: 1,
                borderColor: '#ccc',
                borderRadius: 8,
                padding: 12,
                marginBottom: 16,
              }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={{
                  backgroundColor: '#f87171',
                  padding: 10,
                  borderRadius: 8,
                  flex: 1,
                  marginRight: 10,
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handlePay}
                style={{
                  backgroundColor: '#4ade80',
                  padding: 10,
                  borderRadius: 8,
                  flex: 1,
                  alignItems: 'center',
                }}
                disabled={isPaying}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                  {isPaying ? 'Paiement...' : 'Payer'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

export default RequestPay;
