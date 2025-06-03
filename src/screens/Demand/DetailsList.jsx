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
import { useTranslation } from 'react-i18next';
import {
  useUpdateFundRequestStatusMutation,
  useDeleteFundRequestMutation,
} from '../../services/Fund/fundApi';
import { useGetUserProfileQuery } from '../../services/Auth/authAPI';
import Loader from '../../components/Loader';
const TopLogo = require('../../images/TopLogo.png');

const DetailsList = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { demand } = route.params;
  const { t } = useTranslation();
  const { data: userProfile } = useGetUserProfileQuery();
  const currentUserId = userProfile?.data?.id;

  const [updateStatus, { isLoading }] = useUpdateFundRequestStatusMutation();
  const [deleteRequest, { isLoading: isDeleting }] =
    useDeleteFundRequestMutation();

  const getStatusLabel = (status) => {
    switch (status) {
      case 'PENDING':
        return {
          label: t('detailsList.status.pending'),
          colorBg: '#FFF3CD',
          colorText: '#856404',
        };
      case 'PAID':
        return {
          label: t('detailsList.status.paid'),
          colorBg: '#D4EDDA',
          colorText: '#155724',
        };
      case 'CANCELLED':
        return {
          label: t('detailsList.status.cancelled'),
          colorBg: '#F8D7DA',
          colorText: '#721C24',
        };
      default:
        return {
          label: status,
          colorBg: '#E2E3E5',
          colorText: '#383D41',
        };
    }
  };

  const statusStyle = getStatusLabel(demand.status);

  const handleCancelRequest = () => {
    Alert.alert(
      t('detailsList.cancel.confirmTitle'),
      t('detailsList.cancel.confirmMessage'),
      [
        { text: t('detailsList.cancel.no'), style: 'cancel' },
        {
          text: t('detailsList.cancel.yes'),
          onPress: async () => {
            try {
              await updateStatus({
                fundRequestId: demand.id,
                status: 'CANCELLED',
              }).unwrap();
              Alert.alert('Succès', 'La demande a été annulée.');
              navigation.goBack();
            } catch (error) {
              console.error(error);
              Alert.alert(
                'Erreur',
                'Une erreur est survenue lors de l’annulation.'
              );
            }
          },
        },
      ]
    );
  };

const handleDeleteRequest = () => {
  Alert.alert(
    t('detailsList.delete.confirmTitle'),
    t('detailsList.delete.confirmMessage'),
    [
      { text: t('detailsList.delete.cancel'), style: 'cancel' },
      {
        text: t('detailsList.delete.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteRequest(demand.id).unwrap(); 

            Alert.alert('Succès', 'La demande a été supprimée.');
            navigation.goBack();
          } catch (error) {
            console.error('Error deleting request:', error);
            Alert.alert(
              'Erreur',
              "Une erreur s'est produite lors de la suppression."
            );
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

      <View
        style={{
          position: 'absolute',
          top: -48,
          left: 0,
          right: 0,
          alignItems: 'center',
        }}
      >
        <Image
          source={TopLogo}
          style={{ height: 100, width: 120 }}
          resizeMode="contain"
        />
      </View>

      <View className="border border-dashed border-gray-300 mb-10" />

      <Text
        style={{
          color: '#4ade80',
          fontSize: 20,
          fontWeight: 'bold',
          marginBottom: 16,
        }}
      >
        {t('detailsList.details.title')}
      </Text>

      <View style={{ backgroundColor: 'white', borderRadius: 16, padding: 16 }}>
        <Text
          style={{
            textAlign: 'right',
            fontWeight: 'bold',
            fontSize: 12,
            marginBottom: 8,
          }}
        >
          {t('detailsList.details.invoice')} {demand.reference}
        </Text>

        <Text
          style={{
            fontWeight: 'bold',
            color: '#000',
            marginBottom: 4,
            fontSize: 15,
          }}
        >
          {t('detailsList.details.descriptionTitle')}
        </Text>
        <Text style={{ color: '#444', marginBottom: 12 }}>
          {demand.description}
        </Text>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 12,
            justifyContent: 'space-between',
          }}
        >
          <Text style={{ fontWeight: 'bold', color: '#000' }}>
            {t('detailsList.details.status')}
          </Text>
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
            <Text
              style={{
                color: statusStyle.colorText,
                fontWeight: '600',
                fontSize: 12,
              }}
            >
              {statusStyle.label}
            </Text>
          </View>
        </View>

        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}
        >
          <Text style={{ fontWeight: 'bold', color: '#000' }}>
            {t('detailsList.details.amount')}
          </Text>
          <Text style={{ color: 'green' }}>
            {demand.amount.toLocaleString()} XAF
          </Text>
        </View>

        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}
        >
          <Text style={{ fontWeight: 'bold', color: '#000' }}>
            {t('detailsList.details.deadline')}
          </Text>
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
          {t('detailsList.details.recipients')}
        </Text>

        {demand.recipients?.map((r, index) => (
          <View key={index} style={{ marginBottom: 16 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 4,
              }}
            >
              <Text style={{ fontWeight: '600', color: '#000' }}>
                {t('detailsList.details.name')}
              </Text>
              <Text>{r.recipient?.firstname} {r.recipient?.lastname}</Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 4,
              }}
            >
              <Text style={{ fontWeight: '600', color: '#000' }}>
                {t('detailsList.details.email')}
              </Text>
              <Text>{r.recipient?.email}</Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 4,
              }}
            >
              <Text style={{ fontWeight: '600', color: '#000' }}>
                {t('detailsList.details.phone')}
              </Text>
              <Text>{r.recipient?.phone}</Text>
            </View>
          </View>
        ))}

        {demand.status === 'PENDING' && demand.userId === currentUserId && (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: 20,
            }}
          >
            {/* Cancel Button */}
            <TouchableOpacity
              onPress={handleCancelRequest}
              disabled={isLoading}
              style={{
                backgroundColor: '#7f1d1d',
                padding: 12,
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                marginRight: 8,
              }}
            >
              {isLoading ? (
                <Loader color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>
                  {t('detailsList.actions.cancel')}
                </Text>
              )}
            </TouchableOpacity>

            {/* Delete Button */}
            <TouchableOpacity
              onPress={handleDeleteRequest}
              disabled={isDeleting}
              style={{
                backgroundColor: '#DC2626',
                padding: 12,
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                marginLeft: 8,
              }}
            >
              {isDeleting ? (
                <Loader color="#fff" />
              ) : (
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>
                  {t('detailsList.actions.delete')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default DetailsList;
