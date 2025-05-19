import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  KeyboardAvoidingView, 
  Platform, 
  StyleSheet, 
  TouchableOpacity,
  Modal,
  FlatList,
  Dimensions,
  Alert
} from 'react-native';
import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import Toast from 'react-native-toast-message';
import Loader from "../../components/Loader";
import { useSimulatePaymentMutation } from '../../services/WalletApi/walletApi'; // Adjust path as needed



const { width } = Dimensions.get('window');
const isSmallScreen = width < 375;

const PaymentSimulator = () => {
  const [amount, setAmount] = useState('100');
  const [currency, setCurrency] = useState('USD');
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  
  // API mutation hook
  const [simulatePayment, { isLoading }] = useSimulatePaymentMutation();
  
  // Supported currencies and their rates
  const currencies = [
    { code: 'USD', name: 'US Dollar', rate: 656.0 },
    { code: 'EUR', name: 'Euro', rate: 655.0 },
    { code: 'CAD', name: 'Canadian Dollar', rate: 480.0 }
  ];
  
  const visaFee = 350.0;
  const paysikaFeeRate = 0.0182; // 1.82%
  
  // Get current currency details
  const currentCurrency = currencies.find(c => c.code === currency) || currencies[0];
  
  // Calculate amounts
  const convertedAmount = parseFloat(amount) * currentCurrency.rate;
  const paysikaFee = convertedAmount * paysikaFeeRate;
  const totalAmount = convertedAmount + visaFee + paysikaFee;

  const handleCurrencySelect = (selectedCurrency) => {
    setCurrency(selectedCurrency);
    setShowCurrencyDropdown(false);
  };

  const handleSimulatePayment = async () => {
    if (!amount || isNaN(parseFloat(amount))) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Amount',
        text2: 'Please enter a valid payment amount',
      });
      return;
    }

    try {
      console.log("Sending payment data to backend:", {
        amount: parseFloat(amount),
        currency
      });
      
      const response = await simulatePayment({
        amount: parseFloat(amount),
        currency
      }).unwrap();
      
      Toast.show({
        type: 'success',
        text1: 'Simulation Successful',
        text2: `${amount} ${currency} payment simulated successfully`,
      });
    } catch (error) {
        console.log(error)
      Toast.show({
        type: 'error',
        text1: 'Simulation Failed',
        text2: error.data?.message || 'Failed to simulate payment',
      });
    }
  };
  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.instructionText}>
          Entrez le montant que vous souhaitez payer
        </Text>
        
        {/* Amount Input */}
        <View style={styles.amountInputContainer}>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            style={styles.amountInput}
            placeholder="100"
          />
          <TouchableOpacity 
            style={styles.currencySelector}
            onPress={() => setShowCurrencyDropdown(true)}
          >
            <Text style={styles.currencyText}>{currency}</Text>
            <AntDesign name="down" size={16} color="#666" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.exchangeRateText}>
          Taux (avec frais internationaux): 1{currency} ~ {currentCurrency.rate} FCFA
        </Text>

        {/* Currency Dropdown Modal */}
        <Modal
          visible={showCurrencyDropdown}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowCurrencyDropdown(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <FlatList
                data={currencies}
                keyExtractor={(item) => item.code}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.currencyItem}
                    onPress={() => handleCurrencySelect(item.code)}
                  >
                    <Text style={[
                      styles.currencyItemText,
                      currency === item.code && styles.selectedCurrency
                    ]}>
                      {item.code} - {item.name}
                    </Text>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCurrencyDropdown(false)}
              >
                <Text style={styles.closeButtonText}>Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Conversion Results */}
        <View style={styles.resultsContainer}>
        <View style={styles.feeRow}>
          <Text style={styles.sectionTitle}>Montant converti</Text>
          <Text style={styles.convertedAmount}>
            {convertedAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} FCFA
          </Text>
          </View>

          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Frais du partenaire (VISA)</Text>
            <Text style={styles.feeValue}>{visaFee.toFixed(1)} XAF</Text>
          </View>

          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Frais de Sendo (TTC)</Text>
            <Text style={styles.feeValue}>
              {paysikaFee.toFixed(2)} XAF ({(paysikaFeeRate * 100).toFixed(2)}%)
            </Text>
          </View>
          <View style={styles.feeRow}>
          <Text style={styles.totalLabel}>Montant total débité</Text>
            <Text style={styles.totalAmount}>
              {totalAmount.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} XAF
            </Text>
          </View>
        </View>

        <View style={styles.disclaimerContainer}>
            <View style={styles.disclaimerContent}>
                <Text style={styles.disclaimerText}>
                Les frais de change sont mis à jour chaque semaine et différent de ceux des sites de conversion,
                car ils incluent le coût d'achat de la devise étrangère auprès des banques.
                </Text>
            </View>
            </View>
             {/* Add the simulate payment button */}
             <TouchableOpacity 
            style={styles.simulateButton}
            onPress={handleSimulatePayment}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader color="#fff" />
            ) : (
              <Text style={styles.simulateButtonText}>Estimateur de paiement</Text>
            )}
          </TouchableOpacity>
        </View>
      
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  simulateButton: {
    backgroundColor: '#7ddd7d',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  simulateButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  content: {
    padding: 20,
  },
  instructionText: {
    fontSize: 15,
    color: 'black',
    textAlign:'center',
    fontWeight: 'bold',
    marginBottom: 30,
    marginTop:12,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingBottom: 5,
    marginBottom: 10,
  },
  amountInput: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  disclaimerContainer: {
    borderWidth: 1,
    borderStyle: 'dotted',
    borderColor: '#999',
    borderRadius: 8,
    padding: 12,
    marginTop: 30,
  },
  disclaimerContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  helpIcon: {
    marginRight: 8,
    marginTop: 5,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 10,
  },
  currencyText: {
    fontSize: 18,
    marginRight: 8,
  },
  exchangeRateText: {
    fontSize: 12,
    color: 'black',
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom:15,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 10,
    maxHeight: '60%',
  },
  currencyItem: {
    padding: 15,
  },
  currencyItemText: {
    fontSize: 18,
    textAlign: 'center',
  },
  selectedCurrency: {
    color: '#7ddd7d',
    fontWeight: 'bold',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
  },
  closeButton: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  closeButtonText: {
    color: '#7ddd7d',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  resultsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 20,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#666',
  },
  convertedAmount: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  feeLabel: {
    fontSize: 16,
    color: '#666',
  },
  feeValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  totalContainer: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 15,
    marginTop: 10,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 10,
  },
  totalAmount: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#d35400',
  },
  disclaimerText: {
    fontSize: 12,
    color: '#999',
    marginTop: 30,
    fontStyle: 'italic',
  },
});

export default PaymentSimulator;