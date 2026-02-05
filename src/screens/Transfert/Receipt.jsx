import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  StatusBar
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Asset } from 'expo-asset';
import { useNavigation, useRoute } from "@react-navigation/native";
import moment from "moment";
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import Loader from "../../components/Loader";
import { useTranslation } from 'react-i18next';
import { useGetConfigQuery } from '../../services/Config/configApi';
import { useGetUserByIdQuery } from '../../services/Auth/authAPI'; 

const ReceiptScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const transaction = route.params?.transaction;
  const userData = route.params?.user;
  const user = transaction?.receiver; 

  const idToFetch = transaction?.userId;
  const currentUserId = userData?.id;
  const isSender = currentUserId === transaction.userId;
  const isReceiver = currentUserId === transaction.receiverId;

  // Fetch user info from API
  const { data: userInfos, isLoading: isUserLoading, error: userError } = useGetUserByIdQuery(idToFetch, {
    skip: !idToFetch,
  });

  const [isGenerating, setIsGenerating] = React.useState(false);
  const { t } = useTranslation();
  
  const {
    data: configData,
    isLoading: isConfigLoading,
    error: configError
  } = useGetConfigQuery(undefined, {
    pollingInterval: 1000,
  });

  const getConfigValue = (name) => {
    const configItem = configData?.data?.find(item => item.name === name);
    return configItem ? parseFloat(configItem.value) : null;
  };

  const SENDO_VALUE_CAD_CA_CAM = getConfigValue('SENDO_VALUE_CAD_CA_CAM');
  const exchangeRate = SENDO_VALUE_CAD_CA_CAM || 482; 

  // Check if this is a CAM-CA transfer
  const isCAMCATransfer = transaction?.description === "Transfert CAM-CA";

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

  const getStatusLabel = (status) => {
    switch(status?.toUpperCase()) {
      case 'COMPLETED': return 'Terminé';
      case 'PENDING': return 'En attente';
      case 'FAILED': return 'Échoué';
      case 'BLOCKED': return 'Bloqué';
      default: return status || 'Non spécifié';
    }
  };

  const getStatusClass = (status) => {
    switch(status?.toUpperCase()) {
      case 'COMPLETED': return 'status-completed';
      case 'PENDING': return 'status-pending';
      case 'FAILED': return 'status-failed';
      case 'BLOCKED': return 'status-blocked';
      default: return '';
    }
  };

  const getTypeLabel = (type) => {
    switch(type?.toUpperCase()) {
      case 'DEPOSIT': return t('history1.deposit');
      case 'WITHDRAWAL': return t('history1.withdraw');
      case 'TRANSFER': return t('history1.transfer');
      case 'SHARED_PAYMENT': return t('history1.share');
      case 'VIEW_CARD_DETAILS': return t('history1.cardView');
      case 'WALLET_TO_WALLET': return t('history1.wallet');
      case 'WALLET_PAYMENT': return t('history1.walletPayment');
      case 'TONTINE_PAYMENT': return t('history1.tontine');
      case 'PAYMENT': return t('history1.payment');
      default: return type;
    }
  };

  const getTypeLabel1 = (provider, type, method) => {
    switch(provider?.toUpperCase()) {
      case 'SYSTEM': return t('history1.system');
      case 'MTN': return t('history1.mtn');
      case 'ORANGE': return t('history1.orange');
      case 'WALLET_PAYMENT': return t('history1.walletPayment');
      case 'TONTINE_PAYMENT': return t('history1.tontine');
      case 'PAYMENT': return t('history1.payment');
      case 'VIRTUAL_CARD': return 'Carte Virtuelle Sendo';
      case 'NIU_PAYMENT': return 'Paiement NIU';
      default: {
        if (method === 'BANK_TRANSFER') return 'Transfert Bancaire';
        if (type === 'DEPOSIT') return 'Dépôt';
        if (type === 'WITHDRAWAL') return 'Retrait';
        return provider || 'Non spécifié';
      }
    }
  };

  const getTransactionDisplayType = (transaction) => {
    if (transaction.description?.includes('National Identification Number') || 
        transaction.description?.includes('NIU')) {
      return 'NIU_PAYMENT';
    }
    if (transaction.method === 'VIRTUAL_CARD' && transaction.type === 'DEPOSIT') {
      return 'VIRTUAL_CARD_RECHARGE';
    }
    if (transaction.method === 'BANK_TRANSFER') {
      return 'BANK_TRANSFER';
    }
    if (transaction.type === 'WALLET_TO_WALLET' || transaction.type === 'TRANSFER') {
      return 'WALLET_TRANSFER';
    }
    return transaction.type;
  };

  const handleDownloadReceipt = async () => {
    if (transaction.status !== 'COMPLETED' && transaction.status !== 'FAILED') {
      Alert.alert(
        "Reçu indisponible",
        "Le reçu est uniquement disponible pour les transactions réussies ou échouées"
      );
      return;
    }

    setIsGenerating(true);
    try {
      // Use Cloudinary hosted logo
      const logoUrl = "https://res.cloudinary.com/dviktmefh/image/upload/v1758140850/WhatsApp_Image_2025-09-17_at_21.26.01_hjgtfa.jpg";
      
      // Generate HTML with the hosted logo - use special template for CAM-CA transfers
      const html = isCAMCATransfer 
        ? generateCAMCAReceiptHTML(transaction, userData, userInfos)
        : generateReceiptHTML(transaction, user, getTypeLabel, logoUrl);
      
      // Convert HTML to PDF
      const { uri } = await Print.printToFileAsync({ html });
      
      // Move to permanent location
      const newUri = `${FileSystem.documentDirectory}Reçu_Sendo_${transaction.transactionId}.pdf`;
      await FileSystem.moveAsync({ from: uri, to: newUri });

      // Share the PDF
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(newUri);
      } else {
        Alert.alert("Succès", "Reçu généré avec succès");
      }
    } catch (error) {
      console.error("Error generating receipt:", error);
      Alert.alert("Erreur", "Échec de génération du reçu. Veuillez réessayer.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Special receipt template for CAM-CA transfers
  const generateCAMCAReceiptHTML = (transaction, senderData, receiverInfo, logoBase64) => {
     const logoUrl = logoBase64;
    const senderInfo = senderData;
    const receiverData = transaction.receiver;
    const isSender = currentUserId === transaction.userId;
    
    // Get counterpart names
    let counterpartLabel = isSender ? "Bénéficiaire" : "Expéditeur";
    let counterpartName = "";
    
    if (isSender) {
      counterpartName = `${receiverData?.firstname || ''} ${receiverData?.lastname || ''}`;
    } else {
      counterpartName = `${receiverInfo?.data?.firstname || ''} ${receiverInfo?.data?.lastname || ''}`;
    }

    // For CAM-CA transfers, we need to show amount in XAF and CAD
    const cadAmount = (transaction.amount / exchangeRate).toFixed(2);
    const cadFees = (transaction.sendoFees / exchangeRate).toFixed(2);
    const cadTotal = (transaction.totalAmount / exchangeRate).toFixed(2);

    // Format dates
    const operationDate = moment(transaction.createdAt).format('DD/MM/YYYY HH:mm A');
    const emissionDate = moment().format('DD/MM/YYYY');

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Sendo CAM-CA Receipt</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .receipt {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
          border-bottom: 2px solid #7ddd7d;
          padding-bottom: 15px;
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          color: #7ddd7d;
        }
        .header .right {
          text-align: right;
          font-size: 12px;
        }
        .header .right p {
          margin: 2px 0;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          font-size: 14px;
        }
        .section {
          margin-bottom: 25px;
        }
        .section h3 {
          background-color: #7ddd7d;
          color: white;
          padding: 8px 12px;
          margin: 0 -20px 15px -20px;
          font-size: 16px;
        }
        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          font-size: 14px;
        }
        .grid p {
          margin: 5px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }
        table tr {
          border-bottom: 1px solid #eee;
        }
        table td {
          padding: 8px 0;
        }
        table tr.total {
          font-weight: bold;
          background-color: #f9f9f9;
        }
        table tr:last-child {
          border-bottom: 2px solid #7ddd7d;
        }
        .signature {
          display: flex;
          justify-content: space-between;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px dashed #ccc;
          font-size: 14px;
        }
        .signature div {
          text-align: center;
          width: 45%;
        }
        .signature div:first-child {
          text-align: left;
        }
        .signature div:last-child {
          text-align: right;
        }
        .amount-details {
          background-color: #f8f9fa;
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
        }
        .amount-details h4 {
          margin-top: 0;
          color: #333;
          font-size: 16px;
        }
        .note {
          font-size: 12px;
          color: #666;
          text-align: center;
          margin-top: 30px;
          padding-top: 15px;
          border-top: 1px solid #eee;
        }
        .exchange-rate {
          background-color: #e8f5e8;
          padding: 10px;
          border-radius: 5px;
          margin: 10px 0;
          text-align: center;
          font-size: 13px;
        }
      </style>
    </head>
    <body>

    <div class="receipt">
      <!-- HEADER -->
      <div class="header">
        <div class="logo"> <img class="logo" src="${logoUrl}" alt="Sendo Logo"></div>
        <div class="right">
          <p><strong>Émission:</strong> Reçu Client</p>
          <p><strong>Destination:</strong> CANADA</p>
          <p><strong>Date:</strong> ${emissionDate}</p>
        </div>
      </div>

      <!-- TRANSACTION INFO -->
      <div class="info-row">
        <p><strong>N° Transfert:</strong> ${transaction.transactionId}</p>
        <p><strong>Date Opération:</strong> ${operationDate}</p>
        <p><strong>Option livraison:</strong> Transfert Sendo</p>
      </div>

      <!-- EXCHANGE RATE INFO -->
      <div class="exchange-rate">
        <strong>Taux de change appliqué:</strong> 1 CAD = ${exchangeRate} XAF
      </div>

      <!-- SENDER -->
      <div class="section">
        <h3>EXPÉDITEUR</h3>
        <div class="grid">
          <p><strong>Nom:</strong> ${senderInfo?.lastname || ''}</p>
          <p><strong>Prénom:</strong> ${senderInfo?.firstname || ''}</p>
          <p><strong>Téléphone:</strong> ${senderInfo?.phone || ''}</p>
          <p><strong>Email:</strong> ${senderInfo?.email || ''}</p>
          <p><strong>Pays:</strong> ${senderInfo?.country || 'Cameroun'}</p>
        </div>
      </div>

      <!-- BENEFICIARY -->
      <div class="section">
        <h3>BÉNÉFICIAIRE</h3>
        <div class="grid">
          <p><strong>Nom:</strong> ${receiverData?.lastname || ''}</p>
          <p><strong>Prénom:</strong> ${receiverData?.firstname || ''}</p>
          <p><strong>Téléphone:</strong> ${receiverData?.phone || ''}</p>
          <p><strong>Email:</strong> ${receiverData?.email || ''}</p>
          <p><strong>Pays:</strong> Canada</p>
          <p><strong>Type de compte:</strong> Wallet Sendo</p>
        </div>
      </div>

      <!-- TRANSFER DETAILS -->
      <div class="section">
        <h3>DÉTAIL TRANSFERT</h3>
        <table>
          <tr><td>Montant envoyé</td><td>${transaction.amount.toLocaleString()} XAF</td></tr>
          <tr><td>Frais de transfert</td><td>${transaction.sendoFees.toLocaleString()} XAF</td></tr>
          <tr class="total"><td>Total débité</td><td>${transaction.totalAmount.toLocaleString()} XAF</td></tr>
          <tr><td>Montant envoyé (CAD)</td><td>${cadAmount} CAD</td></tr>
          <tr><td>Frais (CAD)</td><td>${cadFees} CAD</td></tr>
          <tr class="total"><td>Total à recevoir</td><td>${cadTotal} CAD</td></tr>
        </table>
      </div>
      <div class="note">
        Ce reçu a été généré automatiquement par le système Sendo.<br>
        Pour toute réclamation, contactez le support avec la référence: ${transaction.transactionId}
      </div>
    </div>

    </body>
    </html>
    `;
  };

  const generateReceiptHTML = (transaction, user, getTypeLabel, logoBase64) => {
    const displayType = getTransactionDisplayType(transaction);
    const logoUrl = logoBase64;

    const isSender = currentUserId === transaction.userId;
    const isReceiver = currentUserId === transaction.receiverId;

    let counterpartLabel = isSender ? "Bénéficiaire :" : "Expéditeur :";
    let counterpartName = "";

    if (
      transaction.type === 'WALLET_TO_WALLET' ||
      transaction.type === 'TRANSFER' ||
      transaction.type === 'FUND_REQUEST_PAYMENT' ||
      transaction.type === 'SHARED_PAYMENT'
    ) {
      counterpartName = isSender
        ? `${transaction.receiver?.firstname ?? ''} ${transaction.receiver?.lastname ?? ''}`
        : `${userInfos?.data?.firstname ?? ''} ${userInfos?.data?.lastname ?? ''}`;
    } else {
      counterpartName = `${transaction.receiver?.firstname ?? ''} ${transaction.receiver?.lastname ?? ''}`;
    }
    
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
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #7ddd7d;
          padding-bottom: 10px;
        }
        .logo-container {
          margin-bottom: 15px;
        }
        .logo {
          width: 120px;
          height: 120px;
          object-fit: contain;
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
        }
        .row {
          display: flex;
          justify-content: space-between;
          margin: 8px 0;
        }
        .label {
          font-weight: bold;
          color: #0b0c0cff;
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
        <div class="subtitle">Reçu de transaction</div>
        <div class="reference">Référence: ${transaction.transactionId}</div>
      </div>

      <div class="section">
        <div class="section-title">Informations de transaction</div>
        <div class="row">
          <span class="label">Date:</span>
          <span class="value">${moment(transaction.createdAt).format('DD/MM/YYYY HH:mm')}</span>
        </div>
        <div class="row">
          <span class="label">Statut:</span>
          <span class="${getStatusClass(transaction.status)}">${getStatusLabel(transaction.status)}</span>
        </div>

        <div class="row">
          <span class="label">Type:</span>
          <span class="value">${getTypeLabel(transaction.type)}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Montants</div>
        <div class="row">
          <span class="label">Montant envoyé:</span>
          <span class="amount">${transaction.amount} ${transaction.currency}</span>
        </div>
        <div class="row">
          <span class="label">Frais:</span>
          <span class="value">
            ${(transaction.sendoFees || 0)} ${transaction.currency}
          </span>
        </div>

        <div class="row">
          <span class="label">Total:</span>
          <span class="amount">${transaction.totalAmount} ${transaction.currency}</span>
        </div>
      </div>

      ${displayType === 'NIU_PAYMENT' ? `
      <div class="section">
        <div class="section-title">Détails NIU</div>
        <div class="row">
          <span class="label">Type de paiement:</span>
          <span class="value">Frais NIU</span>
        </div>
        <div class="row">
          <span class="label">Méthode:</span>
          <span class="value">Wallet Sendo</span>
        </div>
        <div class="row">
          <span class="label">Centre des impôts:</span>
          <span class="value">DGI – Centre régional</span>
        </div>
      </div>
      ` : transaction.receiver || user ? `
      <div class="section">
        <div class="section-title">${displayType === 'VIRTUAL_CARD_RECHARGE' ? 'Carte Virtuelle' : 'Bénéficiaire'}</div>
        ${displayType === 'VIRTUAL_CARD_RECHARGE' && transaction.card ? `
        <div class="row">
          <span class="label">Nom sur la carte:</span>
          <span class="value">${transaction.card.cardName}</span>
        </div>
        <div class="row">
          <span class="label">Numéro:</span>
          <span class="value">**** **** **** ${transaction.card.last4Digits}</span>
        </div>
        <div class="row">
          <span class="label">Expiration:</span>
          <span class="value">${transaction.card.expirationDate}</span>
        </div>
        ` : `
        <div class="row">
          <span class="label">Nom:</span>
          <span class="value">${transaction.receiver?.firstname || user?.firstname} ${transaction.receiver?.lastname || user?.lastname}</span>
        </div>
        <div class="section">
        ${transaction.type === 'WALLET_TO_WALLET' ? `
          <div class="section">
            <div class="row">
              <span class="label">${counterpartLabel}</span>
              <span class="value">${counterpartName}</span>
            </div>
          </div>
        ` : ''}

      </div>
        ${displayType !== 'NIU_PAYMENT' && (transaction.receiver?.phone || user?.phone) ? `
        <div class="row">
          <span class="label">Téléphone:</span>
          <span class="value">${transaction.receiver?.phone || user?.phone}</span>
        </div>
        ` : ''}
        `}
      </div>
      ` : ''}

      <div class="footer">
        Ce reçu a été généré automatiquement le ${moment().format('DD/MM/YYYY HH:mm')}<br>
        et peut être utilisé comme justificatif de transaction.
      </div>
    </body>
    </html>
    `;
  };

  // Rest of your component (getStatusSteps, render JSX) remains the same...
  const getStatusSteps = () => {
    const formatDate = (date) => date ? moment(date).format('DD/MM/YYYY HH:mm') : 'N/A';

    if (transaction.status === 'COMPLETED') {
      return [
        {
          status: "Terminé",
          description: "Le transfert a réussi",
          completed: true,
          time: transaction.updatedAt ? formatDate(transaction.updatedAt) : formatDate(transaction.createdAt),
          icon: "check-circle",
          color: "#27ae60"
        }
      ];
    }

    if (transaction.status === 'FAILED') {
      return [
        {
          status: "Échec",
          description: "Le transfert a échoué",
          completed: false,
          time: transaction.updatedAt ? formatDate(transaction.updatedAt) : formatDate(transaction.createdAt),
          icon: "clock-circle",
          color: "#e74c3c"
        }
      ];
    }

    // Pending / in progress
    return [
      {
        status: "Transmis",
        description: "Transaction initié avec succès",
        completed: true,
        time: formatDate(transaction.createdAt),
        icon: "check-circle",
        color: "#27ae60"
      },
      {
        status: "En traitement",
        description: "Vérification en cours",
        completed: transaction.status !== 'PENDING',
        time: transaction.processedAt ? formatDate(transaction.processedAt) : 'En attente',
        icon: "clock-circle",
        color: "#f39c12"
      },
      {
        status: transaction.status === 'COMPLETED' ? "Terminé" : "En attente",
        description: transaction.status === 'COMPLETED'
          ? "La transaction a réussi"
          : "La transaction a échoué",
        completed: transaction.status === 'COMPLETED',
        time: transaction.updatedAt ? formatDate(transaction.updatedAt) : 'N/A',
        icon: transaction.status === 'COMPLETED' ? "check-circle" : "close-circle",
        color: transaction.status === 'COMPLETED' ? "#27ae60" : "#e74c3c"
      }
    ];
  };

  const displayType = getTransactionDisplayType(transaction);

  return (
    <View className="flex-1 bg-white">
      <StatusBar backgroundColor="#7ddd7d" barStyle="light-content" />
      
      <View className="bg-[#7ddd7d] pt-0">
        <SafeAreaView style={{ paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
          <View
            className="flex-row items-center justify-between py-4 px-3"
          >
            <TouchableOpacity onPress={() => navigation.goBack()} className="w-10 items-start">
              <AntDesign name="left" size={24} color="white" />
            </TouchableOpacity>

            <Text className="flex-1 text-center text-lg font-bold text-white">
              {t('screens.receipt')}
            </Text>

            <View className="w-10" />
          </View>
        </SafeAreaView>
      </View>
      
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="items-center my-4 px-4">
          <Text className="text-lg font-semibold text-gray-700">
            {isCAMCATransfer ? "Transfert International CAM-CA" : "Transaction récents"}
          </Text>
        </View>

        <View className="bg-white mx-4 mt-5 p-4 rounded-xl shadow-md border border-gray-100">
          <View className="items-center mb-4">
            <View className="bg-[#7ddd7d] w-20 h-20 rounded-full justify-center items-center">
              <Text className="text-white text-5xl font-bold">i</Text>
            </View>
          </View>

          <View className="mb-4">
            {getStatusSteps().map((step, index) => (
              <View key={index} className="flex-row items-center mb-2">
                <AntDesign 
                  name={step.icon} 
                  size={20} 
                  color={step.color || (step.completed ? "#7ddd7d" : "#d1d5db")} 
                />
                <View className="ml-3 flex-1">
                  <Text className="text-gray-800 font-semibold">{step.status}</Text>
                  {step.time && (
                    <Text className="text-xs text-gray-600">{step.time}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>

          {displayType === 'VIRTUAL_CARD_RECHARGE' ? (
            <>
              <Text className="text-gray-800 font-semibold text-sm mb-2">
                Transaction de carte virtuelle réussie 
              </Text>
              {transaction.card && (
                <>
                  <Text className="text-gray-600 text-sm">
                    Nom sur la carte : {transaction.card.cardName}
                  </Text>
                  <Text className="text-gray-600 text-sm">
                    Numéro : **** **** **** {transaction.card.last4Digits}
                  </Text>
                  <Text className="text-gray-600 text-sm mb-2">
                    Date d'expiration : {transaction.card.expirationDate}
                  </Text>
                </>
              )}
            </>
          ) : displayType === 'NIU_PAYMENT' ? (
            <>
              <Text className="text-gray-800 font-semibold text-sm mb-2">
                Demande d'Immatriculation Unique
              </Text>
              <Text className="text-gray-600 text-sm">
                Paiement reçu - Demande en cours de traitement
              </Text>
              <Text className="text-gray-600 text-sm">
                Référence : {transaction.transactionId}
              </Text>
              <Text className="text-gray-600 text-sm">
                Type de paiement : Frais NIU
              </Text>
              <Text className="text-gray-600 text-sm">
                Méthode : Wallet Sendo
              </Text>
              <Text className="text-gray-600 text-sm mb-2">
                Centre des impôts : DGI – Centre régional
              </Text>
            </>
          ) : isCAMCATransfer ? (
            <>
              <Text className="text-gray-800 font-semibold text-sm mb-2">
                Transfert  Cameroun - Canada
              </Text>
              <Text className="text-gray-600 text-sm">
                {isSender ? "Destinataire :" : "Expéditeur :"}{" "}
                <Text className="font-semibold">
                  {isSender
                    ? `${transaction.receiver?.firstname || ''} ${transaction.receiver?.lastname || ''}`
                    : `${userInfos?.data?.firstname || ''} ${userInfos?.data?.lastname || ''}`
                  }
                </Text>
              </Text>
              <Text className="text-gray-600 text-sm">
                Montant en XAF : {transaction.amount.toLocaleString()} XAF
              </Text>
              <Text className="text-gray-600 text-sm">
                Montant en CAD : {((transaction.amount / exchangeRate).toFixed(2))} CAD
              </Text>
              <Text className="text-gray-600 text-sm">
                Taux de change : 1 CAD = {exchangeRate} XAF
              </Text>
              <Text className="text-gray-600 text-sm mb-2">
                Référence : {transaction.transactionId}
              </Text>
            </>
          ) : displayType === 'BANK_TRANSFER' ? (
            <>
              <Text className="text-gray-800 font-semibold text-sm mb-2">
                Transaction bancaire effectué
              </Text>
              <Text className="text-gray-600 text-sm">
                Bénéficiaire : {transaction.receiver?.firstname || user?.firstname} {transaction.receiver?.lastname || user?.lastname}
              </Text>
              <Text className="text-gray-600 text-sm">
                Méthode de Paiement : Transaction Bancaire
              </Text>
              <Text className="text-gray-600 text-sm mb-2">
                Référence : {transaction.transactionId}
              </Text>
            </>
          ) : (
            (transaction.method !== 'BANK_TRANSFER' && (
              transaction.type === 'WALLET_TO_WALLET' ||
              transaction.type === 'TRANSFER' ||
              (
                transaction.method !== 'VIRTUAL_CARD' &&
                transaction.description !== 'National Identification Number request'
              )
            )) && (
              <>
                {transaction.type === 'WALLET_TO_WALLET' && (
                  <Text className="text-gray-800 font-semibold text-sm mb-2">
                    {isSender
                      ? `${transaction.receiver?.firstname || userInfos?.data?.firstname || ''} ${transaction.receiver?.lastname || userInfos?.data?.lastname || ''} a reçu votre transaction.`
                      : `${userInfos?.data?.firstname || ''} ${userInfos?.data?.lastname || ''} vous a envoyé une transaction.`
                    }
                  </Text>
                )}

                <Text className="text-gray-600 text-sm">
                  {isSender ? "Bénéficiaire :" : "Expéditeur :"}{" "}
                  <Text className="font-semibold">
                    {transaction.type === 'WALLET_TO_WALLET' ||
                    transaction.type === 'TRANSFER' ||
                    transaction.type === 'FUND_REQUEST_PAYMENT' ||
                    transaction.type === 'SHARED_PAYMENT'
                      ? (
                          isSender
                            ? `${transaction.receiver?.firstname ?? ''} ${transaction.receiver?.lastname ?? ''}`
                            : `${userInfos?.data?.firstname ?? ''} ${userInfos?.data?.lastname ?? ''}`
                        )
                      : (
                          `${transaction.receiver?.firstname ?? ''} ${transaction.receiver?.lastname ?? ''}`
                        )
                    }
                  </Text>
                </Text>

                <Text className="text-gray-600 text-sm">
                  Méthode de Paiement : {getTypeLabel1(transaction.provider, transaction.type, transaction.method) || 'N/A'}
                </Text>

                {displayType !== 'NIU_PAYMENT' && (
                  <Text className="text-gray-600 text-sm mb-2">
                    {transaction.type === 'WALLET_TO_WALLET' ? 'Numéro de compte:' : 'Numéro:'}{" "}
                    {transaction.type === 'WALLET_TO_WALLET'
                      ? transaction.wallet?.matricule
                      : transaction.type === 'TRANSFER' ||
                        transaction.type === 'FUND_REQUEST_PAYMENT' ||
                        transaction.type === 'SHARED_PAYMENT'
                      ? transaction.receiver?.phone
                      : user?.phone}
                  </Text>
                )}
              </>
            )
          )}

          <Text className="text-green-600 font-semibold my-1">Reçu</Text>
          <Text className="text-gray-600 text-sm">Montant de la transaction: {transaction.amount} {transaction.currency}</Text>
          <Text className="text-gray-600 text-sm">
            Frais de transaction: ${(transaction.sendoFees || 0)} ${transaction.currency}
          </Text>

          <Text className="text-gray-600 text-sm mb-2">Total: {transaction.totalAmount} {transaction.currency}</Text>

          <Text className="text-green-600 font-semibold mt-2">Détails de la transaction</Text>
          <Text className="text-gray-600 text-sm">
            {transaction.method === "VIRTUAL_CARD" 
              ? `Payée le : ${moment(transaction.createdAt).format("DD/MM/YYYY HH:mm")}` 
              : `Envoyé : ${moment(transaction.createdAt).format("DD/MM/YYYY HH:mm")}`
            }
          </Text>
          <Text className="text-gray-600 text-sm">Référence de la transaction : {transaction.transactionId}</Text>

          <TouchableOpacity
            onPress={handleDownloadReceipt}
            disabled={isGenerating || (transaction.status !== 'COMPLETED' && transaction.status !== 'FAILED')}
            className={`py-3 mt-4 rounded-lg items-center ${
              transaction.status === 'COMPLETED' || transaction.status === 'FAILED'
                ? 'bg-[#7ddd7d]'
                : 'bg-gray-300'
            }`}
          >
            {isGenerating ? (
              <Loader color="white" />
            ) : (
              <Text className="text-white font-bold">
                {isCAMCATransfer 
                  ? 'TÉLÉCHARGER LE REÇU CAM-CA'
                  : transaction.status === 'COMPLETED'
                  ? 'TÉLÉCHARGER LE REÇU'
                  : transaction.status === 'FAILED'
                  ? 'TÉLÉCHARGER LE REÇU (ÉCHEC)'
                  : 'REÇU INDISPONIBLE'}
              </Text>
            )}
          </TouchableOpacity>

        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate("History")}
          className="items-center mt-6"
        >
          <Text className="text-green-500 font-semibold">
            AFFICHER TOUS LES TRANSACTIONS
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default ReceiptScreen;