import React from "react";
import { 
  StatusBar, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Alert
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
  //console.log(transaction)
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
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #7ddd7d;
            padding-bottom: 10px;
          }
          .title {
            font-size: 24px;
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 5px;
          }
          .subtitle {
            font-size: 16px;
            color: #7f8c8d;
            margin-bottom: 10px;
          }
          .reference {
            font-size: 14px;
            color: #7f8c8d;
          }
          .section {
            margin: 15px 0;
            padding: 10px;
            border: 1px solid #ecf0f1;
            border-radius: 5px;
          }
          .section-title {
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 10px;
            font-size: 16px;
            border-bottom: 1px solid #ecf0f1;
            padding-bottom: 5px;
          }
          .row {
            display: flex;
            justify-content: space-between;
            margin: 8px 0;
          }
          .label {
            font-weight: bold;
            color: #0b0c0c;
          }
          .value {
            color: #2c3e50;
          }
          .amount {
            font-weight: bold;
            color: #2c3e50;
            font-size: 18px;
          }
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #95a5a6;
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
          <div class="title">SENDO</div>
          <div class="subtitle">Reçu de recharge de carte</div>
          <div class="reference">Référence: ${transaction.transactionId}</div>
        </div>

        <div class="section">
          <div class="section-title">Informations de transaction</div>
          <div class="row">
            <span class="label">Date:</span>
            <span class="value">${formatDate(transaction.createdAt)}</span>
          </div>
          <div class="row">
            <span class="label">Statut:</span>
            <span class="status-completed">${transaction.status}</span>
          </div>
          <div class="row">
            <span class="label">Type:</span>
            <span class="value">Recharge de carte virtuelle</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Détails de la carte</div>
          <div class="row">
            <span class="label">Nom sur la carte:</span>
            <span class="value">${transaction.user?.firstname} ${transaction.user?.lastname}</span>
          </div>
          <div class="row">
            <span class="label">Type d'opération:</span>
            <span class="value">Dépôt sur carte Sendo</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Montants</div>
          <div class="row">
            <span class="label">Montant de la recharge:</span>
            <span class="amount">${formatAmount(transaction.amount)} ${transaction.currency}</span>
          </div>
          <div class="row">
            <span class="label">Frais de recharge:</span>
            <span class="value">${formatAmount(transaction.sendoFees || 0)} ${transaction.currency}</span>
          </div>
          <div class="row">
            <span class="label">Total:</span>
            <span class="amount">${formatAmount(transaction.totalAmount)} ${transaction.currency}</span>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Détails supplémentaires</div>
          <div class="row">
            <span class="label">Rechargé le:</span>
            <span class="value">${formatDate(transaction.createdAt)}</span>
          </div>
          <div class="row">
            <span class="label">Référence:</span>
            <span class="value">${transaction.transactionId}</span>
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
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar backgroundColor="#7ddd7d" barStyle="light-content" />
      
      <View className="flex-row items-center p-4" style={{ backgroundColor: "#7ddd7d" }}>
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-2">
         <AntDesign name="left" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-white">Détails de la transaction</Text>
      </View>

      <ScrollView className="flex-1 p-4">
        <View className="items-center my-4">
          <View className="bg-[#7ddd7d] w-16 h-16 rounded-full justify-center items-center mb-2">
            <Ionicons name="card" size={30} color="#fff" />
          </View>
          <Text className="text-lg font-semibold text-gray-800">Recharge effectuée</Text>
          <Text className="text-gray-500">Terminé le {formatDate(transaction.createdAt)}</Text>
        </View>

        <View className="bg-white p-4 rounded-xl shadow-md border border-gray-100 mb-4">
          <Text className="text-gray-800 font-semibold text-sm mb-2">
            Recharge de carte virtuelle effectuée
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
              <Text className="text-gray-600 text-sm">Frais de recharge :</Text>
              <Text className="text-gray-600 text-sm">{formatAmount(transaction.sendoFees || 0)} {transaction.currency}</Text>
            </View>
            <View className="flex-row justify-between mb-1">
              <Text className="text-gray-600 text-sm">Montant de la recharge :</Text>
              <Text className="text-gray-600 text-sm">{formatAmount(transaction.amount)} {transaction.currency}</Text>
            </View>
            <View className="flex-row justify-between mt-2 pt-2 border-t border-gray-100">
              <Text className="text-gray-800 font-semibold">Total :</Text>
              <Text className="text-gray-800 font-semibold">{formatAmount(transaction.totalAmount)} {transaction.currency}</Text>
            </View>
          </View>

          <View className="border-t border-gray-100 pt-3 mt-3">
            <Text className="text-green-600 font-semibold mb-2">Détails du transfert</Text>
            <View className="flex-row justify-between mb-1">
              <Text className="text-gray-600 text-sm">Rechargé le :</Text>
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
            AFFICHER TOUS LES TRANSFERTS
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default VirtualCardRechargeDetails;