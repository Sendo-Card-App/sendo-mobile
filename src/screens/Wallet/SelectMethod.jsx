import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  SafeAreaView,
  StatusBar,
  Pressable,
  Dimensions,
  Platform,
  StyleSheet
} from 'react-native';
import { AntDesign, Entypo, MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import om from '../../images/om.png';
import mtn from '../../images/mtn.png';
import HomeImage2 from '../../images/HomeImage2.png';
import TopLogo from '../../images/TopLogo.png';

const { height, width } = Dimensions.get('window');

const SelectMethod = ({ navigation }) => {
  const { t } = useTranslation();
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);

  const methods = [
    {
      id: 'transfer',
      title: t('select_method.sendo_transfer'),
      subtitle: t('select_method.transfer'),
      icon: <Image source={TopLogo} style={styles.methodIcon} />,
      action: () => navigation.navigate("WalletTransfer"),
      color: '#7ddd7d'
    },
    {
      id: 'ca_cm',
      title: 'Transfert CA-CM',
      subtitle: "D'argent",
      icon: <Image source={HomeImage2} style={styles.methodIconLarge} />,
      action: () => navigation.navigate("BeneficiaryScreen"),
      color: '#7ddd7d'
    },
    {
      id: 'mobile',
      title: t('select_method.transfer_to_mobile'),
      subtitle: t('select_method.transfer_fee'),
      icon: <AntDesign name="mobile1" size={40} color="#0D1C6A" />,
      action: () => setShowServiceModal(true),
      color: '#0D1C6A'
    }
  ];

  const services = [
    { id: 'OM', name: t('service_om'), icon: om },
    { id: 'MTN', name: t('service_mtn'), icon: mtn }
  ];

  const handleMethodSelect = (method) => {
    setSelectedMethod(method.id);
    method.action();
  };

  const handleServiceSelect = (service) => {
    setShowServiceModal(false);
    navigation.navigate('WalletWithdrawal', { service });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.methodsGrid}>
          {methods.map((method) => (
            <Pressable
              key={method.id}
              style={[
                styles.methodCard,
                selectedMethod === method.id && styles.selectedMethodCard
              ]}
              onPress={() => handleMethodSelect(method)}
            >
              <View style={styles.methodHeader}>
                <View style={[
                  styles.radioButton,
                  selectedMethod === method.id && styles.radioButtonSelected
                ]}>
                  {selectedMethod === method.id && (
                    <Entypo name="check" size={16} color="white" />
                  )}
                </View>
              </View>
              
              <View style={styles.methodContent}>
                {method.icon}
                <Text style={[styles.methodTitle, { color: method.color }]}>
                  {method.title}
                </Text>
                <Text style={styles.methodSubtitle}>{method.subtitle}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Service Selection Modal */}
      <Modal
        visible={showServiceModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowServiceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('select_service')}</Text>
              <TouchableOpacity onPress={() => setShowServiceModal(false)}>
                <MaterialIcons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.servicesContainer}>
              {services.map((service) => (
                <TouchableOpacity
                  key={service.id}
                  style={styles.serviceCard}
                  onPress={() => handleServiceSelect(service.id)}
                >
                  <Image 
                    source={service.icon} 
                    style={styles.serviceIcon} 
                    resizeMode="contain"
                  />
                  <Text style={styles.serviceName}>{service.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: StatusBar.currentHeight || 0,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#181e25',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  methodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  methodCard: {
    width: width > 500 ? '30%' : '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedMethodCard: {
    borderColor: '#0D1C6A',
    shadowColor: '#0D1C6A',
    shadowOpacity: 0.2,
  },
  methodHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    backgroundColor: '#0D1C6A',
    borderColor: '#0D1C6A',
  },
  methodContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  methodIcon: {
    width: 60,
    height: 60,
    marginBottom: 12,
  },
  methodIconLarge: {
    width: '100%',
    height: height / 8,
    resizeMode: 'contain',
    marginBottom: 12,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  methodSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#181e25',
  },
  servicesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  serviceCard: {
    width: '45%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceIcon: {
    width: 50,
    height: 50,
    marginBottom: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default SelectMethod;