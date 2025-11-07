import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Image,
} from 'react-native';
import { AntDesign, Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

// Import bank images
import ecobank from '../../images/ecobank.jpeg';
import bange from '../../images/bange.png';

const BankTransferDetails = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();

  const {
    contact,
    amount,
    convertedAmount,
    totalAmount,
    transferFee,
    fromCurrency,
    toCurrency,
    countryName,
    cadRealTimeValue,
  } = route.params;

  const [selectedBank, setSelectedBank] = useState('');
  const [accountName, setAccountName] = useState('');
  const [iban, setIban] = useState('');
  const [confirmIban, setConfirmIban] = useState('');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Bank options with images
  const bankOptions = [
    {
      id: 'bange',
      name: 'BANGE Bank',
      image: bange,
      description: 'Transferts rapides et sécurisés'
    },
    {
      id: 'ecobank',
      name: 'Ecobank',
      image: ecobank,
      description: 'Réseau panafricain'
    }
  ];

  const validateField = (field, value) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'selectedBank':
        if (!value) newErrors.selectedBank = 'Veuillez sélectionner une banque.';
        else delete newErrors.selectedBank;
        break;
      case 'accountName':
        if (!value.trim()) newErrors.accountName = "Veuillez saisir le nom du titulaire du compte.";
        else if (value.trim().length < 2) newErrors.accountName = "Le nom doit contenir au moins 2 caractères.";
        else delete newErrors.accountName;
        break;
      case 'iban':
        if (!value) newErrors.iban = "Veuillez saisir l'IBAN.";
        else if (value.length !== 27) newErrors.iban = "L'IBAN doit contenir exactement 27 caractères.";
        else delete newErrors.iban;
        break;
      case 'confirmIban':
        if (!value) newErrors.confirmIban = "Veuillez confirmer l'IBAN.";
        else if (value !== iban) newErrors.confirmIban = "Les IBAN ne correspondent pas.";
        else delete newErrors.confirmIban;
        break;
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    switch (field) {
      case 'selectedBank':
        validateField('selectedBank', selectedBank);
        break;
      case 'accountName':
        validateField('accountName', accountName);
        break;
      case 'iban':
        validateField('iban', iban);
        break;
      case 'confirmIban':
        validateField('confirmIban', confirmIban);
        break;
      default:
        break;
    }
  };

  const handleBankSelect = (bankId) => {
    setSelectedBank(bankId);
    if (touched.selectedBank) {
      validateField('selectedBank', bankId);
    }
  };

 // In BankTransferDetails.js, update the handleNext function:
const handleNext = () => {
  // Mark all fields as touched
  setTouched({
    selectedBank: true,
    accountName: true,
    iban: true,
    confirmIban: true,
  });

  // Validate all fields
  const isBankValid = validateField('selectedBank', selectedBank);
  const isAccountNameValid = validateField('accountName', accountName);
  const isIbanValid = validateField('iban', iban);
  const isConfirmIbanValid = validateField('confirmIban', confirmIban);

  if (isBankValid && isAccountNameValid && isIbanValid && isConfirmIbanValid) {
    const selectedBankData = bankOptions.find(bank => bank.id === selectedBank);
    
    // Navigate to TransferSummary instead of BeneficiaryDetails
    navigation.navigate('TransferSummary', {
      contact,
      amount,
      convertedAmount,
      totalAmount,
      transferFee,
      fromCurrency,
      toCurrency,
      countryName,
      cadRealTimeValue,
      selectedBank: selectedBankData.name,
      selectedBankId: selectedBank,
      accountName: accountName.trim(),
      iban,
      bankImage: selectedBankData.image, // Pass the bank image
    });
  }
};

  const isFormValid = () => {
    return selectedBank && accountName.trim().length >= 2 && iban.length === 27 && confirmIban === iban;
  };

  const BankCard = ({ bank, isSelected, onPress }) => {
    return (
      <Pressable
        style={[
          styles.bankCard,
          isSelected && styles.bankCardSelected
        ]}
        onPress={() => onPress(bank.id)}
      >
        <View style={styles.bankCardContent}>
          <Image 
            source={bank.image} 
            style={styles.bankLogo}
            resizeMode="contain"
          />
          <View style={styles.bankInfo}>
            <Text style={[
              styles.bankName,
              isSelected && styles.bankNameSelected
            ]}>
              {bank.name}
            </Text>
            <Text style={styles.bankDescription}>
              {bank.description}
            </Text>
          </View>
          <View style={[
            styles.radioOuter,
            isSelected && styles.radioOuterSelected
          ]}>
            {isSelected && <View style={styles.radioInner} />}
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F2F2F2" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <AntDesign name="left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails sur le bénéficiaire</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <View style={styles.divider} />

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Bank Selection Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informations bancaires</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Sélectionnez une banque <Text style={styles.required}>*</Text>
            </Text>
            
            <View style={styles.bankList}>
              {bankOptions.map((bank) => (
                <BankCard
                  key={bank.id}
                  bank={bank}
                  isSelected={selectedBank === bank.id}
                  onPress={handleBankSelect}
                />
              ))}
            </View>
            
            {touched.selectedBank && errors.selectedBank && (
              <Text style={styles.errorText}>{errors.selectedBank}</Text>
            )}
          </View>

          {/* <View style={styles.noteCard}>
            <Ionicons name="information-circle-outline" size={16} color="#666" />
            <Text style={styles.noteText}>
              Le nom du destinataire doit être son nom légal, tel qu'enregistré auprès de sa banque.
            </Text>
          </View> */}
        </View>

        {/* Account Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détails du compte</Text>

          {/* Account Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Nom du titulaire du compte <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                touched.accountName && errors.accountName && styles.inputError
              ]}
              placeholder="Ex: Jean Dupont"
              value={accountName}
              onChangeText={(text) => {
                setAccountName(text);
                if (touched.accountName) validateField('accountName', text);
              }}
              onBlur={() => handleBlur('accountName')}
              autoCapitalize="words"
              returnKeyType="next"
            />
            {touched.accountName && errors.accountName && (
              <Text style={styles.errorText}>{errors.accountName}</Text>
            )}
          </View>

          {/* IBAN Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              IBAN <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                touched.iban && errors.iban && styles.inputError
              ]}
              placeholder="Entrez l'IBAN (27 caractères)"
              value={iban}
              onChangeText={(text) => {
                const formattedText = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
                setIban(formattedText);
                if (touched.iban) validateField('iban', formattedText);
                // Also validate confirm IBAN when IBAN changes
                if (touched.confirmIban) validateField('confirmIban', confirmIban);
              }}
              onBlur={() => handleBlur('iban')}
              autoCapitalize="characters"
              maxLength={27}
              returnKeyType="next"
            />
            <View style={styles.characterCount}>
              <Text style={[
                styles.characterCountText,
                iban.length === 27 && styles.characterCountValid
              ]}>
                {iban.length}/27 caractères
              </Text>
            </View>
            {touched.iban && errors.iban && (
              <Text style={styles.errorText}>{errors.iban}</Text>
            )}
          </View>

          {/* Confirm IBAN Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Confirmer l'IBAN <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                touched.confirmIban && errors.confirmIban && styles.inputError
              ]}
              placeholder="Confirmer l'IBAN"
              value={confirmIban}
              onChangeText={(text) => {
                const formattedText = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
                setConfirmIban(formattedText);
                if (touched.confirmIban) validateField('confirmIban', formattedText);
              }}
              onBlur={() => handleBlur('confirmIban')}
              autoCapitalize="characters"
              maxLength={27}
              returnKeyType="done"
            />
            {touched.confirmIban && errors.confirmIban && (
              <Text style={styles.errorText}>{errors.confirmIban}</Text>
            )}
          </View>

          {/* IBAN Helper Text */}
          <View style={styles.helperCard}>
            <Ionicons name="help-circle-outline" size={16} color="#666" />
            <Text style={styles.helperText}>
              Longueur requise : 27 caractères pour l'IBAN (exemple: CMXXBBBBBBBBBAAAAAAAAAAAAAAA)
            </Text>
          </View>
        </View>

        {/* Next Button */}
        <TouchableOpacity 
          style={[
            styles.nextButton,
            !isFormValid() && styles.nextButtonDisabled
          ]} 
          onPress={handleNext}
          disabled={!isFormValid()}
        >
          <Text style={styles.nextButtonText}>SUIVANT</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 15,
    backgroundColor: '#F2F2F2',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    textAlign: 'center',
  },
  headerPlaceholder: {
    width: 34,
  },
  divider: {
    borderColor: '#C0C0C0',
    borderWidth: 1,
    borderStyle: 'dashed',
    marginHorizontal: 20,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 15,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  required: {
    color: '#FF3B30',
  },
  // Bank Selection Styles
  bankList: {
    gap: 12,
  },
  bankCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E6E6E6',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  bankCardSelected: {
    borderColor: '#7ddd7d',
    backgroundColor: '#F8FFF8',
    shadowOpacity: 0.1,
    elevation: 4,
  },
  bankCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bankLogo: {
    width: 50,
    height: 40,
    marginRight: 12,
  },
  bankInfo: {
    flex: 1,
  },
  bankName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  bankNameSelected: {
    color: '#7ddd7d',
  },
  bankDescription: {
    fontSize: 12,
    color: '#666',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#E6E6E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#7ddd7d',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#7ddd7d',
  },
  // Input Styles
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6E6E6',
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#7ddd7d',
  },
  noteText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },
  helperCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F8FF',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  characterCount: {
    alignItems: 'flex-end',
    marginTop: 4,
  },
  characterCountText: {
    fontSize: 12,
    color: '#666',
  },
  characterCountValid: {
    color: '#7ddd7d',
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#7ddd7d',
    borderRadius: 25,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  nextButtonDisabled: {
    backgroundColor: '#C0C0C0',
    shadowOpacity: 0,
    elevation: 0,
  },
  nextButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BankTransferDetails;