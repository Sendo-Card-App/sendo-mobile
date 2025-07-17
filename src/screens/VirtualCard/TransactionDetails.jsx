import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Share } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

const TransactionDetails = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { transaction } = route.params;

  const isCashIn = transaction.type === "CASHOUT";

  const formattedAmount = transaction.amount.toLocaleString("fr-FR");
  const transactionDate = new Date(transaction.createdAt).toLocaleString("fr-FR");

  const source = transaction.sourcePaymentMethodDetails;
  const destination = transaction.destinationPaymentMethodDetails;

  const sourceLabel = source?.shortInfo || "Source inconnue";
  const destinationLabel = destination?.shortInfo || "Destination inconnue";

  const statusTimeline = transaction.statusUpdates || [];

  const generateReceiptHTML = () => {
    return `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .title { font-size: 20px; font-weight: bold; }
            .transaction-id { font-size: 12px; color: #666; margin-bottom: 20px; }
            .section { margin-bottom: 15px; }
            .section-title { font-weight: bold; border-bottom: 1px solid #eee; padding-bottom: 5px; }
            .amount { font-size: 18px; color: #2e7d32; font-weight: bold; }
            .status-success { color: #2e7d32; }
            .status-failed { color: #c62828; }
            .timeline-item { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">${isCashIn ? "Rechargement de carte" : "Paiement par carte"}</div>
            <div class="transaction-id">ID: ${transaction.id}</div>
          </div>
          
          <div class="section">
            <div class="section-title">Montant</div>
            <div class="amount">${formattedAmount} FCFA</div>
          </div>
          
          <div class="section">
            <div class="section-title">Statut</div>
            <div class="${transaction.status === "SUCCESSFUL" ? "status-success" : "status-failed"}">
              ${transaction.status}
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">Date</div>
            <div>${transactionDate}</div>
          </div>
          
          <div class="section">
            <div class="section-title">Destination</div>
            <div>${destinationLabel}</div>
            <div style="font-size: 12px; color: #666;">${destination?.type}</div>
          </div>
          
          ${transaction.fees?.sourceFee ? `
          <div class="section">
            <div class="section-title">Frais</div>
            <div>${transaction.fees.sourceFee.amount} ${transaction.currency}</div>
          </div>
          ` : ''}
          
          <div class="section">
            <div class="section-title">Historique des statuts</div>
            ${statusTimeline.map(entry => `
              <div class="timeline-item">
                <span>${entry.status}</span>
                <span>${new Date(entry.updatedAt).toLocaleString("fr-FR")}</span>
              </div>
            `).join('')}
          </div>
          
          <div class="footer">
            Reçu généré le ${new Date().toLocaleString("fr-FR")}
          </div>
        </body>
      </html>
    `;
  };

  const handleShareReceipt = async () => {
    try {
      const html = generateReceiptHTML();
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Partager le reçu Sendo',
        UTI: 'com.adobe.pdf'
      });
    } catch (error) {
      console.error('Error sharing receipt:', error);
    }
  };

  const handleDownloadReceipt = async () => {
    try {
      const html = generateReceiptHTML();
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Télécharger le reçu Sendo', 
        UTI: 'com.adobe.pdf'
      });
    } catch (error) {
      console.error('Error downloading receipt:', error);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white p-4">
      {/* Header with back button */}
      <View className="flex-row items-center mb-4">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-2">
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold">Détails de la transaction</Text>
      </View>

      {/* Transaction ID */}
      <Text className="text-sm text-gray-500 mb-4">ID: {transaction.id}</Text>

      {/* Main transaction card */}
      <View className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
        <Text className="text-lg font-bold mb-2">
          {isCashIn ? "Rechargement de carte" : "Paiement par carte"}
        </Text>
        
        <View className="flex-row justify-between items-center mb-3">
          <Text className="font-semibold">Montant</Text>
          <Text className="text-lg text-green-700 font-bold">
            {formattedAmount} FCFA
          </Text>
        </View>

        <View className="flex-row justify-between items-center mb-3">
          <Text className="font-semibold">Statut</Text>
          <Text className={`text-base font-bold ${transaction.status === "SUCCESSFUL" ? "text-green-600" : "text-red-500"}`}>
            {transaction.status}
          </Text>
        </View>

        <View className="flex-row justify-between items-center">
          <Text className="font-semibold">Date</Text>
          <Text>{transactionDate}</Text>
        </View>
      </View>

      {/* Details sections */}
      <View className="mb-6">
        {/* Destination */}
        <View className="mb-4 p-3 bg-gray-50 rounded-lg">
          <Text className="font-semibold mb-1">Destination</Text>
          <Text className="text-gray-700">{destinationLabel}</Text>
          <Text className="text-xs text-gray-400">{destination?.type}</Text>
        </View>

        {/* Fees */}
        {transaction.fees?.sourceFee && (
          <View className="mb-4 p-3 bg-gray-50 rounded-lg">
            <Text className="font-semibold mb-1">Frais</Text>
            <Text className="text-gray-700">
              {transaction.fees.sourceFee.amount} {transaction.currency}
            </Text>
          </View>
        )}

        {/* Status Timeline */}
        <View className="mb-4 p-3 bg-gray-50 rounded-lg">
          <Text className="font-semibold mb-2">Historique des statuts</Text>
          {statusTimeline.map((entry, index) => (
            <View key={index} className="flex-row justify-between mb-2 pb-2 border-b border-gray-100 last:border-0">
              <Text className="text-gray-600">{entry.status}</Text>
              <Text className="text-gray-400 text-xs">
                {new Date(entry.updatedAt).toLocaleString("fr-FR")}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Action buttons */}
      <View className="flex-row justify-between mb-6">
        <TouchableOpacity
          onPress={handleShareReceipt}
          className="flex-1 bg-green-600 p-3 rounded-md mr-2"
        >
          <Text className="text-center text-white font-bold">Partager</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleDownloadReceipt}
          className="flex-1 bg-green-600 p-3 rounded-md ml-2"
        >
          <Text className="text-center text-white font-bold">Télécharger PDF</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default TransactionDetails;