import React from "react";
import { StatusBar, View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useTranslation } from "react-i18next";

const TransactionDetails = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { transaction } = route.params;
  const { t } = useTranslation();

  const isCashIn = transaction.type === "DEPOSIT" || transaction.type === "CASHIN";
  const formattedAmount = transaction.amount?.toLocaleString("fr-FR") ?? "0";
  const transactionDate = new Date(transaction.createdAt).toLocaleString("fr-FR");

  const destination = transaction.destinationPaymentMethodDetails ?? {
    shortInfo: "Virtual Card",
    type: "NEERO_CARD",
  };



  const destinationLabel = destination.shortInfo || t("unknownDestination");

  const translatedType = (() => {
    if (destination?.type === "NEERO_CARD") return t("sendoCard");
    if (destination?.type === "NEERO_MERCHANT") return t("sendMerchant");
    return destination?.type || t("unknownDestination");
  })();

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
            <div class="title">${isCashIn ? t("cardTopUp") : t("cardPayment")}</div>
            <div class="transaction-id">ID: ${transaction.transactionId}</div>
          </div>

          <div class="section">
            <div class="section-title">${t("amount")}</div>
            <div class="amount">${formattedAmount} ${transaction.currency}</div>
          </div>

          <div class="section">
            <div class="section-title">${t("status")}</div>
            <div class="${transaction.status === "SUCCESSFUL" ? "status-success" : "status-failed"}">
              ${t(transaction.status.toLowerCase())}
            </div>
          </div>

          <div class="section">
            <div class="section-title">${t("date")}</div>
            <div>${transactionDate}</div>
          </div>

          <div class="section">
            <div class="section-title">${t("destination")}</div>
            <div>${destinationLabel}</div>
            <div style="font-size: 12px; color: #666;">${translatedType}</div>
          </div>

          ${transaction.fees?.sourceFee ? `
            <div class="section">
              <div class="section-title">${t("fees")}</div>
              <div>${transaction.fees.sourceFee.amount} ${transaction.currency}</div>
            </div>
          ` : ''}

          ${statusTimeline.length ? `
            <div class="section">
              <div class="section-title">${t("statusHistory")}</div>
              ${statusTimeline.map(entry => `
                <div class="timeline-item">
                  <span>${t(entry.status.toLowerCase())}</span>
                  <span>${new Date(entry.updatedAt).toLocaleString("fr-FR")}</span>
                </div>
              `).join("")}
            </div>
          ` : ''}

          <div class="footer">
            ${t("receiptGenerated")} ${new Date().toLocaleString("fr-FR")}
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
        mimeType: "application/pdf",
        dialogTitle: t("shareReceipt"),
        UTI: "com.adobe.pdf",
      });
    } catch (error) {
      console.error("Error sharing receipt:", error);
    }
  };

  const handleDownloadReceipt = async () => {
    try {
      const html = generateReceiptHTML();
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: t("downloadReceipt"),
        UTI: "com.adobe.pdf",
      });
    } catch (error) {
      console.error("Error downloading receipt:", error);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <StatusBar backgroundColor="#7ddd7d" barStyle="light-content" />
      
      <View className="flex-row items-center mt-10 mb-4 p-4 rounded-xl" style={{ backgroundColor: "#7ddd7d" }}>
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-2">
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-white">{t("transactionDetails")}</Text>
      </View>

      <Text className="text-sm text-gray-500 mb-4">ID: {transaction.transactionId}</Text>

      <View className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
        <Text className="text-lg font-bold mb-2">
          {isCashIn ? t("cardTopUp") : t("cardPayment")}
        </Text>

        <View className="flex-row justify-between items-center mb-3">
          <Text className="font-semibold">{t("amount")}</Text>
          <Text className="text-lg text-green-700 font-bold">
            {formattedAmount} {transaction.currency}
          </Text>
        </View>

        <View className="flex-row justify-between items-center mb-3">
          <Text className="font-semibold">{t("status")}</Text>
          <Text className={`text-base font-bold ${transaction.status === "SUCCESSFUL" ? "text-green-600" : "text-red-500"}`}>
            {t(transaction.status.toLowerCase())}
          </Text>
        </View>

        <View className="flex-row justify-between items-center">
          <Text className="font-semibold">{t("date")}</Text>
          <Text>{transactionDate}</Text>
        </View>
      </View>

      <View className="mb-6">
        <View className="mb-4 p-3 bg-gray-50 rounded-lg">
          <Text className="font-semibold mb-1">{t("destination")}</Text>
          <Text className="text-gray-700">{destinationLabel}</Text>
          <Text className="text-xs text-gray-400">{translatedType}</Text>
        </View>

        {transaction.sourceFee && (
          <View className="mb-4 p-3 bg-gray-50 rounded-lg">
            <Text className="font-semibold mb-1">{t("fees")}</Text>
            <Text className="text-gray-700">
              {transaction.sourceFee} {transaction.currency}
            </Text>
          </View>
        )}

        {/* Optional status timeline display */}
        {/* {statusTimeline.length > 0 && (
          <View className="mb-4 p-3 bg-gray-50 rounded-lg">
            <Text className="font-semibold mb-2">{t("statusHistory")}</Text>
            {statusTimeline.map((entry, index) => (
              <View
                key={index}
                className="flex-row justify-between mb-2 pb-2 border-b border-gray-100 last:border-0"
              >
                <Text className="text-gray-600">{t(entry.status.toLowerCase())}</Text>
                <Text className="text-gray-400 text-xs">
                  {new Date(entry.updatedAt).toLocaleString("fr-FR")}
                </Text>
              </View>
            ))}
          </View>
        )} */}
      </View>

      <View className="flex-row justify-between mb-6">
        <TouchableOpacity onPress={handleShareReceipt} className="flex-1 bg-[#7ddd7d] p-3 rounded-md mr-2">
          <Text className="text-center text-white font-bold">{t("share")}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDownloadReceipt} className="flex-1 bg-[#7ddd7d] p-3 rounded-md ml-2">
          <Text className="text-center text-white font-bold">{t("downloadPdf")}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default TransactionDetails;
