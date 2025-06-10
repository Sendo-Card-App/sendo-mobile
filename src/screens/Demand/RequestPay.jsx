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
import TopLogo from '../../Images/TopLogo.png';
import {
  useUpdateRecipientStatusMutation,
  usePayFundRequestMutation,
} from '../../services/Fund/fundApi';
import { useGetBalanceQuery } from '../../services/WalletApi/walletApi';
import { useGetUserProfileQuery } from "../../services/Auth/authAPI";

const RequestPay = ({ navigation, route }) => {
  const { demand } = route.params;

   // console.log(JSON.stringify(demand, null, 2));
  const [updateRecipientStatus, { isLoading: isUpdating }] = useUpdateRecipientStatusMutation();
  const [payFundRequest, { isLoading: isPaying }] = usePayFundRequestMutation();
      const { data: userProfile, isLoading: isProfileLoading } = useGetUserProfileQuery();
       const userId = userProfile?.data.id;
   
      const { 
         data: balanceData, 
         error: balanceError,
         isLoading: isBalanceLoading
       } = useGetBalanceQuery(userId, { skip: !userId });
       const balance = balanceData?.data.balance || 0;
    // console.log(balance)
     
  const [modalVisible, setModalVisible] = useState(false);
  const [amountToPay, setAmountToPay] = useState('');
  const [currentRecipientId, setCurrentRecipientId] = useState(null);

  const requestFund = demand.requestFund ?? {};
  const totalPaid = requestFund.recipients?.reduce((sum, r) => sum + (r.amountPaid || 0), 0) ?? 0;
  const remaining = (requestFund.amount ?? 0) - totalPaid;
  const initiator = requestFund.requesterFund;
  const recipientRequestId = requestFund.recipients[0]?.id;

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

  const handleStatusUpdate = async ( currentRecipientId, status) => {
    try {
      await updateRecipientStatus({  requestRecipientId: currentRecipientId, status }).unwrap();
      Alert.alert('Succès', `Le statut a été mis à jour en "${status}"`);
      navigation.goBack();
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', "Impossible de mettre à jour le statut.");
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

    // console.log('Payload sent to backend:', {
    //   requestRecipientId: currentRecipientId,
    //   payload: payloadToSend,
    // });

    try {
      const res = await payFundRequest({
        requestRecipientId: currentRecipientId,
        payload: payloadToSend,
      }).unwrap();

      Alert.alert('Succès', 'Paiement effectué avec succès.');

      setModalVisible(false);
    } catch (error) {
      console.error('Payment error:', error);
      if (error?.data?.data?.errors) {
        const messages = error.data.data.errors.map(e => e.message || JSON.stringify(e)).join('\n');
        Alert.alert('Erreur', messages);
      } else {
        Alert.alert('Erreur', error?.data?.message || 'Le paiement a échoué.');
      }
    }
  };


  const statusStyle = getStatusLabel(requestFund.status);

  return (
    <>
      <StatusBar style="light" />
      <View
        style={{
          height: 100,
          paddingHorizontal: 20,
          paddingTop: 48,
          backgroundColor: '#0A0F1F',
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

      <ScrollView style={{ padding: 20, backgroundColor: '#0A0F1F' }}>
        <Text style={{ color: '#4ade80', fontSize: 20, fontWeight: 'bold', marginBottom: 16 }}>
          Détails de la demande
        </Text>

        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16 }}>
          <Text style={{ textAlign: 'right', fontWeight: 'bold', fontSize: 12, marginBottom: 8 }}>
            Facture No.{requestFund.reference}
          </Text>

          <Text style={{ fontWeight: 'bold', fontSize: 15, marginBottom: 4, color: '#000' }}>
            Description du service
          </Text>
          <Text style={{ color: '#444', marginBottom: 12 }}>{requestFund.description}</Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ fontWeight: 'bold', color: '#000' }}>Montant total</Text>
            <Text style={{ color: 'green' }}>{(requestFund.amount ?? 0).toLocaleString()} XAF</Text>
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
              <Text>{requestFund.deadline?.split('T')[0]}</Text>
            </View>
          )}

          {initiator && (
            <View
              style={{
                backgroundColor: '#F5F6FA',
                padding: 12,
                borderRadius: 12,
                marginBottom: 12,
                alignItems: 'flex-start',
                borderLeftWidth: 4,
                borderLeftColor: 'green',
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#4ade80', marginBottom: 4 }}>
                Initiateur de la demande
              </Text>
              <Text style={{ fontSize: 14, color: '#333' }}>
                {initiator.firstname} {initiator.lastname}
              </Text>
            </View>
          )}

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

          {requestFund.recipients?.map((r, i) => (
            <View key={i} style={{ marginBottom: 24 }}>
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
                <Text>{(r.amountPaid ?? 0).toLocaleString()} XAF</Text>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginTop: 8 }}>
                {['ACCEPTED', 'REJECTED', 'PAID'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={{
                      backgroundColor:
                        status === 'ACCEPTED'
                          ? '#4ade80'
                          : status === 'REJECTED'
                          ? '#f87171'
                          : '#60a5fa',
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                      borderRadius: 8,
                    }}
                    onPress={() => handleStatusUpdate(recipientRequestId, status)}
                    disabled={isUpdating}
                  >
                    <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>
                      {status}
                    </Text>
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

      {/* Payment Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          }}
        >
          <View
            style={{
              width: '90%',
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 20,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 12 }}>
              Saisir le montant à payer
            </Text>
            <TextInput
              keyboardType="numeric"
              placeholder="Montant"
              value={amountToPay}
              onChangeText={setAmountToPay}
              style={{
                borderWidth: 1,
                borderColor: '#ccc',
                borderRadius: 8,
                width: '100%',
                padding: 12,
                marginBottom: 16,
              }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
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
