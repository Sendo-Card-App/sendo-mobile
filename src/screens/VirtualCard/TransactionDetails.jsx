import React from "react";
import { 
  StatusBar, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  StyleSheet
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import moment from "moment";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system/legacy";
import { useTranslation } from "react-i18next";

const VirtualCardRechargeDetails = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { transaction } = route.params;
  const { t } = useTranslation();

  if (!transaction) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <Text className="text-red-500">Détails de transaction non trouvés</Text>
        <TouchableOpacity 
          className="mt-4 px-4 py-2 bg-blue-500 rounded"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-white">Retour</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const formatDate = (dateString) => {
    return moment(dateString).format('DD MMMM YYYY [à] HH:mm');
  };

  const formatAmount = (amount) => {
    return amount?.toLocaleString('fr-FR') || '0';
  };

  const generateReceiptHTML = () => {
    const logoUrl = "https://res.cloudinary.com/dviktmefh/image/upload/v1758140850/WhatsApp_Image_2025-09-17_at_21.26.01_hjgtfa.jpg"
    
    const formatReceiptDate = (dateString) => {
      return moment(dateString).format('MMM DD, YYYY, h:mm:ss A');
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reçu Sendo</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            line-height: 1.6;
            color: #333;
            max-width: 400px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
          }
          .company-name {
            font-size: 18px;
            font-weight: bold;
            color: #000;
            margin-bottom: 5px;
          }
          .receipt-number {
            font-size: 14px;
            color: #000;
            margin-bottom: 10px;
          }
          .logo-container {
            margin-bottom: 15px;
          }
          .logo {
            width: 120px;
            height: 120px;
            object-fit: contain;
          }
          .payment-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            border: 1px solid #000;
          }
          .payment-table th {
            background-color: #f0f0f0;
            padding: 8px;
            text-align: left;
            border-bottom: 1px solid #000;
            font-weight: bold;
          }
          .payment-table td {
            padding: 8px;
            border-bottom: 1px solid #ddd;
          }
          .summary-section {
            margin: 20px 0;
          }
          .summary-title {
            font-weight: bold;
            font-size: 16px;
            margin-bottom: 10px;
            border-bottom: 1px solid #000;
            padding-bottom: 5px;
          }
          .summary-item {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
          }
          .summary-total {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            font-weight: bold;
            border-top: 1px solid #000;
            padding-top: 10px;
          }
          .currency-conversion {
            margin: 15px 0;
            padding: 10px;
            background-color: #f9f9f9;
            border-radius: 5px;
            font-size: 14px;
          }
          .contact-info {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #161414ff;
            border-top: 1px solid #ddd;
            padding-top: 10px;
          }
          .divider {
            border-top: 1px dashed #000;
            margin: 15px 0;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #000000ff;
            border-top: 1px solid #ecf0f1;
            padding-top: 10px;
          }
          .status-completed {
            color: #27ae60;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo-container">
            <img class="logo" src="${logoUrl}" alt="Sendo Logo">
          </div>
          <div class="company-name">${transaction.description}</div>
          <div class="receipt-number">Reçu #${transaction.transactionId}</div>
        </div>

        <table class="payment-table">
          <tr>
            <th>MONTANT PAYEE</th>
            <th>PAYEE LE</th>
            <th>METHODE DE PAIMENT</th>
          </tr>
          <tr>
            <td>${formatAmount(transaction.amount)} ${transaction.currency}</td>
            <td>${formatReceiptDate(transaction.createdAt)}</td>
            <td><strong>VISA</strong> - ${transaction.card.last4Digits}</td>
          </tr>
        </table>

        <div class="divider"></div>

        <div class="summary-section">
          <div class="summary-title">Resume</div>
          
          <div class="summary-item">
            <span>Montant de la transaction:</span>
            <span>${formatAmount(transaction.amount)} ${transaction.currency}</span>
          </div>
          
          <div class="summary-item">
            <span>Frais de transaction:</span>
            <span>${formatAmount(transaction.sendoFees || 0)} ${transaction.currency}</span>
          </div>
          
          <div class="summary-total">
            <span>Total</span>
            <span>${formatAmount(transaction.totalAmount)} ${transaction.currency}</span>
          </div>
        </div>
        
        <div class="footer">
          Ce reçu a été généré automatiquement le ${moment().format('DD/MM/YYYY HH:mm')}<br>
          et peut être utilisé comme justificatif de transaction.
        </div>
      </body>
      </html>
    `;
  };

  const handleDownloadReceipt = async () => {
    try {
      const html = generateReceiptHTML();
      const { uri } = await Print.printToFileAsync({ html });

      const newUri = `${FileSystem.documentDirectory}Reçu_Sendo_${transaction.transactionId}.pdf`;

      await FileSystem.moveAsync({ from: uri, to: newUri });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(newUri);
      } else {
        Alert.alert("Succès", "Reçu généré avec succès");
      }
    } catch (error) {
      console.error("Error generating receipt:", error);
      Alert.alert("Erreur", "Échec de génération du reçu. Veuillez réessayer.");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#7ddd7d" barStyle="light-content" />
      
      {/* Custom Header - Same as CardHistory */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="left" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails de la transaction</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView className="flex-1 p-4">
        <View className="items-center my-4">
          <View className="bg-[#7ddd7d] w-16 h-16 rounded-full justify-center items-center mb-2">
            <Ionicons name="card" size={30} color="#fff" />
          </View>
          <Text className="text-lg font-semibold text-gray-800">{transaction.description}</Text>
          <Text className="text-gray-500">Terminé le {formatDate(transaction.createdAt)}</Text>
        </View>

        <View className="bg-white p-4 rounded-xl shadow-md border border-gray-100 mb-4">
          <Text className="text-gray-800 font-semibold text-sm mb-2">
            Transaction de carte virtuelle réussie 
          </Text>
          
          <View className="mb-3">
            <Text className="text-gray-600 text-sm">Nom sur la carte : {transaction.user?.firstname} {transaction.user?.lastname}</Text>
          </View>
          
          <View className="mb-3">
            <Text className="text-gray-600 text-sm">Type d'opération : Dépôt sur carte Sendo</Text>
          </View>

          <View className="border-t border-gray-100 pt-3 mt-3">
            <Text className="text-green-600 font-semibold mb-2">Montant</Text>
            <View className="flex-row justify-between mb-1">
              <Text className="text-gray-600 text-sm">Frais de transaction :</Text>
              <Text className="text-gray-600 text-sm">{formatAmount(transaction.sendoFees || 0)} {transaction.currency}</Text>
            </View>
            <View className="flex-row justify-between mb-1">
              <Text className="text-gray-600 text-sm">Montant de la transaction :</Text>
              <Text className="text-gray-600 text-sm">{formatAmount(transaction.amount)} {transaction.currency}</Text>
            </View>
            <View className="flex-row justify-between mt-2 pt-2 border-t border-gray-100">
              <Text className="text-gray-800 font-semibold">Total :</Text>
              <Text className="text-gray-800 font-semibold">{formatAmount(transaction.totalAmount)} {transaction.currency}</Text>
            </View>
          </View>

          <View className="border-t border-gray-100 pt-3 mt-3">
            <Text className="text-green-600 font-semibold mb-2">Détails de la transaction</Text>
            <View className="flex-row justify-between mb-1">
              <Text className="text-gray-600 text-sm">Payée le :</Text>
              <Text className="text-gray-600 text-sm">{formatDate(transaction.createdAt)}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-gray-600 text-sm">Référence :</Text>
              <Text className="text-gray-600 text-sm">{transaction.transactionId}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleDownloadReceipt}
          className="py-3 rounded-lg items-center bg-[#7ddd7d] mb-4"
        >
          <Text className="text-white font-bold">TÉLÉCHARGER LE REÇU</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => navigation.navigate("History")}
          className="items-center py-3"
        >
          <Text className="text-green-500 font-semibold">
            AFFICHER TOUS LES TRANSACTIONS
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#fff" 
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#7ddd7d",
    paddingVertical: 12,
    paddingTop: 50, // This gives the StatusBar space
    paddingHorizontal: 16,
    justifyContent: "space-between",
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: "bold", 
    color: "#fff" 
  },
});

export default VirtualCardRechargeDetails;