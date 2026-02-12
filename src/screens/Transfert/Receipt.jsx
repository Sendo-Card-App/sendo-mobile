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
  //console.log("Transaction details on Receipt screen:", transaction);
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

  // Check if this is a CAM-CA transfer or CA-CAM transfer based on description
  const isCAMCATransfer = transaction?.description === "Transfert CAM-CAM" || transaction?.description === "Transfert CAM-CA";
  const isCACAMTransfer = transaction?.description === "Transfert CA-CAM";;

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

// Special receipt template for CAM-CA transfers (Cameroun -> Canada)

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

    // For CAM-CA transfers, amount received = amount sent (no fees deducted)
    const cadAmount = (transaction.amount / exchangeRate).toFixed(2);
    const cadFees = (transaction.sendoFees / exchangeRate).toFixed(2);
    const cadTotal = (transaction.amount / exchangeRate).toFixed(2); // Amount received = amount sent without fees

    // Format dates
    const operationDate = moment(transaction.createdAt).format('DD/MM/YYYY HH:mm');
    const emissionDate = moment().format('DD/MM/YYYY');

    return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Sendo - Reçu Transfert CAM-CA</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Helvetica', 'Arial', sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 30px 20px;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .receipt {
          max-width: 850px;
          margin: 0 auto;
          background: white;
          border-radius: 20px;
          box-shadow: 0 30px 60px rgba(0,0,0,0.1);
          overflow: hidden;
        }
        
        .receipt-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 30px 35px;
          color: white;
        }
        
        .receipt-header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .logo-container {
          background: white;
          padding: 10px;
          border-radius: 12px;
          display: inline-block;
        }
        
        .logo {
          height: 50px;
          width: auto;
          display: block;
        }
        
        .receipt-title {
          text-align: right;
        }
        
        .receipt-title h1 {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 5px;
          letter-spacing: 1px;
        }
        
        .receipt-title p {
          font-size: 14px;
          opacity: 0.9;
        }
        
        .transfer-badge {
          background: rgba(255,255,255,0.2);
          padding: 12px 20px;
          border-radius: 10px;
          margin-top: 15px;
        }
        
        .transfer-badge span {
          font-size: 16px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .receipt-body {
          padding: 35px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 30px;
        }
        
        .info-section {
          background: #f8fafc;
          padding: 20px;
          border-radius: 16px;
        }
        
        .info-section h3 {
          color: #1e293b;
          font-size: 16px;
          font-weight: 700;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 2px solid #e2e8f0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .info-row {
          display: flex;
          margin-bottom: 12px;
          font-size: 14px;
        }
        
        .info-label {
          width: 110px;
          color: #64748b;
          font-weight: 500;
        }
        
        .info-value {
          flex: 1;
          color: #0f172a;
          font-weight: 600;
        }
        
        .amounts-container {
          background: linear-gradient(135deg, #667eea08 0%, #764ba208 100%);
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 25px;
          margin: 30px 0;
        }
        
        .currency-tabs {
          display: flex;
          gap: 15px;
          margin-bottom: 20px;
        }
        
        .currency-tab {
          background: white;
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 700;
          color: #1e293b;
          border: 1px solid #e2e8f0;
        }
        
        .currency-tab.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
        }
        
        .amount-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .amount-table tr {
          border-bottom: 1px solid #e2e8f0;
        }
        
        .amount-table td {
          padding: 15px 0;
          font-size: 15px;
        }
        
        .amount-table td:last-child {
          text-align: right;
          font-weight: 600;
        }
        
        .amount-table tr:last-child {
          border-bottom: none;
        }
        
        .total-row {
          background: #f1f5f9;
          border-radius: 8px;
        }
        
        .total-row td {
          font-weight: 800;
          color: #0f172a;
        }
        
        .amount-received {
          background: #10b981;
          color: white;
          padding: 15px 20px;
          border-radius: 12px;
          margin-top: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .amount-received span {
          font-size: 18px;
          font-weight: 700;
        }
        
        .amount-received strong {
          font-size: 24px;
        }
        
        .exchange-rate-box {
          background: #f8fafc;
          border: 1px dashed #94a3b8;
          padding: 15px 20px;
          border-radius: 12px;
          margin: 25px 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .exchange-rate-box span {
          color: #475569;
          font-size: 15px;
        }
        
        .exchange-rate-box strong {
          color: #0f172a;
          font-size: 18px;
          background: white;
          padding: 5px 15px;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 30px;
          border-top: 2px dashed #cbd5e1;
          text-align: center;
        }
        
        .footer p {
          color: #64748b;
          font-size: 13px;
          line-height: 1.6;
        }
        
        .reference-number {
          background: #f1f5f9;
          padding: 12px 20px;
          border-radius: 8px;
          font-family: monospace;
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin-top: 15px;
        }
        
        @media print {
          body {
            background: white;
            padding: 0;
          }
          .receipt {
            box-shadow: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt">
        <!-- Header -->
        <div class="receipt-header">
          <div class="receipt-header-top">
            <div class="logo-container">
              <img class="logo" src="${logoUrl}" alt="Sendo Logo">
            </div>
            <div class="receipt-title">
              <h1>REÇU DE TRANSFERT</h1>
              <p>N° ${transaction.transactionId}</p>
            </div>
          </div>
          <div class="transfer-badge">
            <span>🌍 TRANSFERT INTERNATIONAL CAMEROUN → CANADA</span>
          </div>
        </div>
        
        <!-- Body -->
        <div class="receipt-body">
          <!-- Date and Reference -->
          <div style="display: flex; justify-content: space-between; margin-bottom: 25px; color: #64748b; font-size: 14px;">
            <span>📅 Date d'opération: ${operationDate}</span>
            <span>📄 Date d'émission: ${emissionDate}</span>
          </div>
          
          <!-- Sender & Beneficiary Info -->
          <div class="info-grid">
            <!-- Expéditeur -->
            <div class="info-section">
              <h3>📤 EXPÉDITEUR</h3>
              <div class="info-row">
                <span class="info-label">Nom complet:</span>
                <span class="info-value">${senderInfo?.lastname || ''} ${senderInfo?.firstname || ''}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Téléphone:</span>
                <span class="info-value">${senderInfo?.phone || ''}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value">${senderInfo?.email || ''}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Pays:</span>
                <span class="info-value">🇨🇲 Cameroun</span>
              </div>
            </div>
            
            <!-- Bénéficiaire -->
            <div class="info-section">
              <h3>📥 BÉNÉFICIAIRE</h3>
              <div class="info-row">
                <span class="info-label">Nom complet:</span>
                <span class="info-value">${receiverData?.lastname || ''} ${receiverData?.firstname || ''}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Téléphone:</span>
                <span class="info-value">${receiverData?.phone || ''}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value">${receiverData?.email || ''}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Pays:</span>
                <span class="info-value">🇨🇦 Canada</span>
              </div>
              <div class="info-row">
                <span class="info-label">Compte:</span>
                <span class="info-value">Wallet Sendo</span>
              </div>
            </div>
          </div>
          
          <!-- Exchange Rate -->
          <div class="exchange-rate-box">
            <span>💱 Taux de change appliqué</span>
            <strong>1 CAD = ${exchangeRate} XAF</strong>
          </div>
          
          <!-- Amounts in XAF -->
          <div class="amounts-container">
            <div class="currency-tabs">
              <div class="currency-tab active">XAF (Franc CFA)</div>
              <div class="currency-tab">CAD (Dollar Canadien)</div>
            </div>
            
            <table class="amount-table">
              <tr>
                <td>Montant envoyé</td>
                <td>${transaction.amount.toLocaleString()} XAF</td>
              </tr>
              <tr>
                <td>Frais de transfert</td>
                <td>${transaction.sendoFees.toLocaleString()} XAF</td>
              </tr>
              <tr style="background: #f1f5f9; font-weight: bold;">
                <td>Total débité</td>
                <td>${transaction.totalAmount.toLocaleString()} XAF</td>
              </tr>
            </table>
          </div>
          
          <!-- Amounts in CAD -->
          <div class="amounts-container" style="margin-top: 20px; background: #f0f9ff; border-color: #bae6fd;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
              <span style="font-weight: 700; color: #0369a1;">🇨🇦 CONTREVALEUR EN CAD</span>
              <span style="background: #0369a1; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px;">Taux: 1 CAD = ${exchangeRate} XAF</span>
            </div>
            
            <table class="amount-table">
              <tr>
                <td>Montant envoyé</td>
                <td>${cadAmount} CAD</td>
              </tr>
              <tr>
                <td>Frais de transfert</td>
                <td style="color: #ef4444;">- ${cadFees} CAD</td>
              </tr>
              <tr style="border-bottom: none;">
                <td style="font-weight: 700;">Total débité</td>
                <td style="font-weight: 700;">${(transaction.totalAmount / exchangeRate).toFixed(2)} CAD</td>
              </tr>
            </table>
          </div>
          
          <!-- Amount Received (IMPORTANT: amount sent without fees) -->
          <div class="amount-received">
            <span>💰 MONTANT REÇU PAR LE BÉNÉFICIAIRE</span>
            <strong>${cadTotal} CAD</strong>
          </div>
          
          <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 12px 15px; margin: 20px 0; display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 20px;">ℹ️</span>
            <span style="color: #9a3412; font-size: 13px;">
              <strong>Note importante:</strong> Le bénéficiaire reçoit exactement ${cadTotal} CAD, 
              soit l'équivalent du montant envoyé (${transaction.amount.toLocaleString()} XAF) sans déduction des frais. 
              Les frais de ${transaction.sendoFees.toLocaleString()} XAF (${cadFees} CAD) sont à la charge de l'expéditeur.
            </span>
          </div>
          
          <!-- Footer -->
        <!-- Footer with Legal Information -->
          <div class="footer">
            <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 20px; text-align: left;">
              <p style="font-size: 12px; color: #1e293b; margin: 0 0 10px 0; line-height: 1.5;">
                <strong style="color: #0f172a;">Sendo</strong> est enregistrée comme entreprise de services monétaires auprès du Centre d’analyse des opérations et déclarations financières du Canada (CANAFE) sous le numéro d’enregistrement <strong style="color: #0f172a;">C100000856</strong>. Sendo est également titulaire d’un permis délivré par Revenu Québec sous le numéro <strong style="color: #0f172a;">19525</strong>.
              </p>
              <p style="font-size: 12px; color: #1e293b; margin: 0 0 10px 0; line-height: 1.5;">
                Au Cameroun, Sendo opère en partenariat avec <strong style="color: #0f172a;">Maviance</strong>, agrégateur de paiement agréé en Afrique, ainsi qu’avec des banques partenaires pour l’émission de ses cartes Visa.
              </p>
            </div>
            
            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 10px;">
              <p style="font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: 8px;">
                CE REÇU EST UN JUSTIFICATIF OFFICIEL DE TRANSFERT
              </p>
              <p style="font-size: 12px; color: #475569; margin-bottom: 5px;">
                Ce document a été généré électroniquement par Sendo le ${emissionDate} à ${moment().format('HH:mm')}.
              </p>
              <p style="font-size: 12px; color: #475569; margin-bottom: 15px;">
                Il est valable sans signature manuscrite conformément aux conditions générales d'utilisation du service.
              </p>
              <p style="font-size: 11px; color: #64748b; margin-top: 15px;">
                Sendo - Transferts d'argent internationaux • support@sendo.com • www.sendo.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
    `;
  };

// Special receipt template for CA-CAM transfers (Canada -> Cameroun)
const generateCACAMReceiptHTML = (transaction, senderData, receiverInfo, logoBase64) => {
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

  // For CA-CAM transfers, amount received = amount sent (no fees deducted)
  const cadAmount = (transaction.amount / exchangeRate).toFixed(2);
  const cadFees = (transaction.sendoFees / exchangeRate).toFixed(2);
  const xafAmount = transaction.amount; // Amount sent in XAF (but it's actually the amount in CAD converted)
  const xafReceived = (transaction.amount * exchangeRate).toFixed(0); // Amount received in XAF = amount sent in CAD * rate
  
  // Format dates
  const operationDate = moment(transaction.createdAt).format('DD/MM/YYYY HH:mm');
  const emissionDate = moment().format('DD/MM/YYYY');

  return `
  <!DOCTYPE html>
  <html lang="fr">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sendo - Reçu Transfert CA-CAM</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Helvetica', 'Arial', sans-serif;
        background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
        padding: 30px 20px;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .receipt {
        max-width: 850px;
        margin: 0 auto;
        background: white;
        border-radius: 20px;
        box-shadow: 0 30px 60px rgba(0,0,0,0.1);
        overflow: hidden;
      }
      
      .receipt-header {
        background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
        padding: 30px 35px;
        color: white;
      }
      
      .receipt-header-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }
      
      .logo-container {
        background: white;
        padding: 10px;
        border-radius: 12px;
        display: inline-block;
      }
      
      .logo {
        height: 50px;
        width: auto;
        display: block;
      }
      
      .receipt-title {
        text-align: right;
      }
      
      .receipt-title h1 {
        font-size: 24px;
        font-weight: 700;
        margin-bottom: 5px;
        letter-spacing: 1px;
      }
      
      .receipt-title p {
        font-size: 14px;
        opacity: 0.9;
      }
      
      .transfer-badge {
        background: rgba(255,255,255,0.2);
        padding: 12px 20px;
        border-radius: 10px;
        margin-top: 15px;
      }
      
      .transfer-badge span {
        font-size: 16px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .receipt-body {
        padding: 35px;
      }
      
      .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 30px;
        margin-bottom: 30px;
      }
      
      .info-section {
        background: #f8fafc;
        padding: 20px;
        border-radius: 16px;
      }
      
      .info-section h3 {
        color: #1e293b;
        font-size: 16px;
        font-weight: 700;
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 2px solid #e2e8f0;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .info-row {
        display: flex;
        margin-bottom: 12px;
        font-size: 14px;
      }
      
      .info-label {
        width: 110px;
        color: #64748b;
        font-weight: 500;
      }
      
      .info-value {
        flex: 1;
        color: #0f172a;
        font-weight: 600;
      }
      
      .amounts-container {
        background: linear-gradient(135deg, #11998e08 0%, #38ef7d08 100%);
        border: 1px solid #e2e8f0;
        border-radius: 16px;
        padding: 25px;
        margin: 30px 0;
      }
      
      .currency-tabs {
        display: flex;
        gap: 15px;
        margin-bottom: 20px;
      }
      
      .currency-tab {
        background: white;
        padding: 10px 20px;
        border-radius: 8px;
        font-weight: 700;
        color: #1e293b;
        border: 1px solid #e2e8f0;
      }
      
      .currency-tab.active {
        background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
        color: white;
        border: none;
      }
      
      .amount-table {
        width: 100%;
        border-collapse: collapse;
      }
      
      .amount-table tr {
        border-bottom: 1px solid #e2e8f0;
      }
      
      .amount-table td {
        padding: 15px 0;
        font-size: 15px;
      }
      
      .amount-table td:last-child {
        text-align: right;
        font-weight: 600;
      }
      
      .amount-table tr:last-child {
        border-bottom: none;
      }
      
      .total-row {
        background: #f1f5f9;
        border-radius: 8px;
      }
      
      .total-row td {
        font-weight: 800;
        color: #0f172a;
      }
      
      .amount-received {
        background: #10b981;
        color: white;
        padding: 15px 20px;
        border-radius: 12px;
        margin-top: 20px;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .amount-received span {
        font-size: 18px;
        font-weight: 700;
      }
      
      .amount-received strong {
        font-size: 24px;
      }
      
      .exchange-rate-box {
        background: #f8fafc;
        border: 1px dashed #94a3b8;
        padding: 15px 20px;
        border-radius: 12px;
        margin: 25px 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .exchange-rate-box span {
        color: #475569;
        font-size: 15px;
      }
      
      .exchange-rate-box strong {
        color: #0f172a;
        font-size: 18px;
        background: white;
        padding: 5px 15px;
        border-radius: 20px;
        border: 1px solid #e2e8f0;
      }
      
      .footer {
        margin-top: 40px;
        padding-top: 30px;
        border-top: 2px dashed #cbd5e1;
        text-align: center;
      }
      
      .footer p {
        color: #64748b;
        font-size: 13px;
        line-height: 1.6;
      }
      
      .reference-number {
        background: #f1f5f9;
        padding: 12px 20px;
        border-radius: 8px;
        font-family: monospace;
        font-size: 16px;
        font-weight: 600;
        color: #1e293b;
        margin-top: 15px;
      }
      
      @media print {
        body {
          background: white;
          padding: 0;
        }
        .receipt {
          box-shadow: none;
        }
      }
    </style>
  </head>
  <body>
    <div class="receipt">
      <!-- Header -->
      <div class="receipt-header">
        <div class="receipt-header-top">
          <div class="logo-container">
            <img class="logo" src="${logoUrl}" alt="Sendo Logo">
          </div>
          <div class="receipt-title">
            <h1>REÇU DE TRANSFERT</h1>
            <p>N° ${transaction.transactionId}</p>
          </div>
        </div>
        <div class="transfer-badge">
          <span>🌍 TRANSFERT INTERNATIONAL CANADA → CAMEROUN</span>
        </div>
      </div>
      
      <!-- Body -->
      <div class="receipt-body">
        <!-- Date and Reference -->
        <div style="display: flex; justify-content: space-between; margin-bottom: 25px; color: #64748b; font-size: 14px;">
          <span>📅 Date d'opération: ${operationDate}</span>
          <span>📄 Date d'émission: ${emissionDate}</span>
        </div>
        
        <!-- Sender & Beneficiary Info -->
        <div class="info-grid">
          <!-- Expéditeur -->
          <div class="info-section">
            <h3>📤 EXPÉDITEUR</h3>
            <div class="info-row">
              <span class="info-label">Nom complet:</span>
              <span class="info-value">${senderInfo?.lastname || ''} ${senderInfo?.firstname || ''}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Téléphone:</span>
              <span class="info-value">${senderInfo?.phone || ''}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email:</span>
              <span class="info-value">${senderInfo?.email || ''}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Pays:</span>
              <span class="info-value">🇨🇦 Canada</span>
            </div>
          </div>
          
          <!-- Bénéficiaire -->
          <div class="info-section">
            <h3>📥 BÉNÉFICIAIRE</h3>
            <div class="info-row">
              <span class="info-label">Nom complet:</span>
              <span class="info-value">${receiverData?.lastname || ''} ${receiverData?.firstname || ''}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Téléphone:</span>
              <span class="info-value">${receiverData?.phone || ''}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email:</span>
              <span class="info-value">${receiverData?.email || ''}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Pays:</span>
              <span class="info-value">🇨🇲 Cameroun</span>
            </div>
            <div class="info-row">
              <span class="info-label">Compte:</span>
              <span class="info-value">Wallet Sendo</span>
            </div>
          </div>
        </div>
        
        <!-- Exchange Rate -->
        <div class="exchange-rate-box">
          <span>💱 Taux de change appliqué</span>
          <strong>1 CAD = ${exchangeRate} XAF</strong>
        </div>
        
        <!-- Amounts in CAD -->
        <div class="amounts-container">
          <div class="currency-tabs">
            <div class="currency-tab active">CAD (Dollar Canadien)</div>
            <div class="currency-tab">XAF (Franc CFA)</div>
          </div>
          
          <table class="amount-table">
            <tr>
              <td>Montant envoyé</td>
              <td>${transaction.amount.toLocaleString()} CAD</td>
            </tr>
            <tr>
              <td>Frais de transfert</td>
              <td>${transaction.sendoFees.toLocaleString()} CAD</td>
            </tr>
            <tr style="background: #f1f5f9; font-weight: bold;">
              <td>Total débité</td>
              <td>${transaction.totalAmount.toLocaleString()} CAD</td>
            </tr>
          </table>
        </div>
        
        <!-- Amounts in XAF -->
        <div class="amounts-container" style="margin-top: 20px; background: #f0fdf4; border-color: #bbf7d0;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <span style="font-weight: 700; color: #166534;">🇨🇲 CONTREVALEUR EN XAF</span>
            <span style="background: #166534; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px;">Taux: 1 CAD = ${exchangeRate} XAF</span>
          </div>
          
          <table class="amount-table">
            <tr>
              <td>Montant envoyé</td>
              <td>${(transaction.amount * exchangeRate).toLocaleString()} XAF</td>
            </tr>
            <tr>
              <td>Frais de transfert</td>
              <td style="color: #ef4444;">- ${(transaction.sendoFees * exchangeRate).toLocaleString()} XAF</td>
            </tr>
            <tr style="border-bottom: none;">
              <td style="font-weight: 700;">Total débité</td>
              <td style="font-weight: 700;">${(transaction.totalAmount * exchangeRate).toLocaleString()} XAF</td>
            </tr>
          </table>
        </div>
        
        <!-- Amount Received (IMPORTANT: amount sent without fees) -->
        <div class="amount-received">
          <span>💰 MONTANT REÇU PAR LE BÉNÉFICIAIRE</span>
          <strong>${(transaction.amount * exchangeRate).toLocaleString()} XAF</strong>
        </div>
        
        <div style="background: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 12px 15px; margin: 20px 0; display: flex; align-items: center; gap: 10px;">
          <span style="font-size: 20px;">ℹ️</span>
          <span style="color: #9a3412; font-size: 13px;">
            <strong>Note importante:</strong> Le bénéficiaire reçoit exactement ${(transaction.amount * exchangeRate).toLocaleString()} XAF, 
            soit l'équivalent du montant envoyé (${transaction.amount.toLocaleString()} CAD) sans déduction des frais. 
            Les frais de ${transaction.sendoFees.toLocaleString()} CAD (${(transaction.sendoFees * exchangeRate).toLocaleString()} XAF) sont à la charge de l'expéditeur.
          </span>
        </div>
        
        <!-- Transaction Reference -->
        <div class="reference-number">
          📋 Référence de transaction: ${transaction.transactionId}
        </div>
        
        <!-- Footer -->
        <!-- Footer with Legal Information -->
          <div class="footer">
            <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin-bottom: 20px; text-align: left; border-left: 4px solid #11998e;">
              <p style="font-size: 12px; color: #1e293b; margin: 0 0 10px 0; line-height: 1.5;">
                <strong style="color: #0f172a;">Sendo</strong> est enregistrée comme entreprise de services monétaires auprès du Centre d’analyse des opérations et déclarations financières du Canada (CANAFE) sous le numéro d'enregistrement <strong style="color: #0f172a;">C100000856</strong>. Sendo est également titulaire d'un permis délivré par Revenu Québec sous le numéro <strong style="color: #0f172a;">19525</strong>.
              </p>
              <p style="font-size: 12px; color: #1e293b; margin: 0 0 5px 0; line-height: 1.5;">
                Au Cameroun, Sendo opère en partenariat avec <strong style="color: #0f172a;">Maviance</strong>, agrégateur de paiement agréé en Afrique, ainsi qu'avec des banques partenaires pour l'émission de ses cartes Visa.
              </p>
            </div>
            
            <div style="border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 10px;">
              <p style="font-size: 14px; font-weight: 600; color: #1e293b; margin-bottom: 8px;">
                CE REÇU EST UN JUSTIFICATIF OFFICIEL DE TRANSFERT
              </p>
              <p style="font-size: 12px; color: #475569; margin-bottom: 5px;">
                Ce document a été généré électroniquement par Sendo le ${emissionDate} à ${moment().format('HH:mm')}.
              </p>
              <p style="font-size: 12px; color: #475569; margin-bottom: 15px;">
                Il est valable sans signature manuscrite conformément aux conditions générales d'utilisation du service.
              </p>
              <p style="font-size: 11px; color: #64748b; margin-top: 15px;">
                Sendo - Transferts d'argent internationaux • support@sendo.com • www.sendo.com
              </p>
            </div>
          </div>
      </div>
    </div>
  </body>
  </html>
  `;
};

// Ajoutez cette fonction pour générer un reçu de souscription de fonds
const generateFundSubscriptionReceiptHTML = (transaction, userData, logoBase64) => {
  const logoUrl = logoBase64;
  const subscriptionDate = moment(transaction.createdAt).format('DD/MM/YYYY HH:mm');
  const emissionDate = moment().format('DD/MM/YYYY');
  
  // Calcul du prorata en fonction de la date de souscription
  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const endOfYear = new Date(currentYear, 11, 31);
  const subscriptionDateTime = new Date(transaction.createdAt);
  
  // Calcul du nombre de jours restants dans l'année
  const daysInYear = 365;
  const daysPassed = Math.floor((subscriptionDateTime - startOfYear) / (1000 * 60 * 60 * 24));
  const daysRemaining = daysInYear - daysPassed;
  const prorataFactor = daysRemaining / daysInYear;
  
  // Récupérer les informations du fond depuis la description
  const fundName = transaction.description?.replace('Souscription : #', '') || 'Sdo Secure Fund';
  
  // Taux de rendement annuel (à récupérer depuis les données du fond)
  const annualReturnRate = 10; // 10% par défaut, à remplacer par la valeur réelle
  const investmentAmount = transaction.amount;
  const annualCommission = (investmentAmount * annualReturnRate) / 100;
  const prorataCommission = annualCommission * prorataFactor;
  
  // Date de fin de souscription
  const subscriptionEndDate = moment(endOfYear).format('DD/MM/YYYY');

  return `
  <!DOCTYPE html>
  <html lang="fr">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sendo - Reçu Souscription Fonds Bloqué</title>
    <style>
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: 'Helvetica', 'Arial', sans-serif;
        background: linear-gradient(135deg, #2C3E50 0%, #3498db 100%);
        padding: 30px 20px;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .receipt {
        max-width: 850px;
        margin: 0 auto;
        background: white;
        border-radius: 20px;
        box-shadow: 0 30px 60px rgba(0,0,0,0.1);
        overflow: hidden;
      }
      
      .receipt-header {
        background: linear-gradient(135deg, #2C3E50 0%, #3498db 100%);
        padding: 30px 35px;
        color: white;
      }
      
      .receipt-header-top {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }
      
      .logo-container {
        background: white;
        padding: 10px;
        border-radius: 12px;
        display: inline-block;
      }
      
      .logo {
        height: 50px;
        width: auto;
        display: block;
      }
      
      .receipt-title {
        text-align: right;
      }
      
      .receipt-title h1 {
        font-size: 24px;
        font-weight: 700;
        margin-bottom: 5px;
        letter-spacing: 1px;
      }
      
      .receipt-title p {
        font-size: 14px;
        opacity: 0.9;
      }
      
      .fund-badge {
        background: rgba(255,255,255,0.2);
        padding: 12px 20px;
        border-radius: 10px;
        margin-top: 15px;
      }
      
      .fund-badge span {
        font-size: 16px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .receipt-body {
        padding: 35px;
      }
      
      .info-section {
        background: #f8fafc;
        padding: 25px;
        border-radius: 16px;
        margin-bottom: 25px;
      }
      
      .info-section h2 {
        color: #1e293b;
        font-size: 18px;
        font-weight: 700;
        margin-bottom: 20px;
        padding-bottom: 10px;
        border-bottom: 2px solid #e2e8f0;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }
      
      .info-row {
        display: flex;
        flex-direction: column;
        margin-bottom: 15px;
      }
      
      .info-label {
        color: #64748b;
        font-size: 12px;
        font-weight: 500;
        margin-bottom: 4px;
      }
      
      .info-value {
        color: #0f172a;
        font-size: 16px;
        font-weight: 600;
      }
      
      .amount-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 25px;
        border-radius: 16px;
        margin-bottom: 25px;
      }
      
      .amount-title {
        font-size: 14px;
        opacity: 0.9;
        margin-bottom: 8px;
      }
      
      .amount-number {
        font-size: 36px;
        font-weight: 700;
        margin-bottom: 5px;
      }
      
      .amount-currency {
        font-size: 18px;
        opacity: 0.9;
      }
      
      .returns-section {
        background: #f0f9ff;
        border: 1px solid #bae6fd;
        border-radius: 16px;
        padding: 25px;
        margin-bottom: 25px;
      }
      
      .returns-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }
      
      .returns-title {
        font-size: 16px;
        font-weight: 700;
        color: #0369a1;
      }
      
      .rate-badge {
        background: #0369a1;
        color: white;
        padding: 6px 15px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: 600;
      }
      
      .returns-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
      }
      
      .return-item {
        background: white;
        padding: 15px;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
      }
      
      .return-label {
        color: #64748b;
        font-size: 12px;
        margin-bottom: 5px;
      }
      
      .return-value {
        color: #0f172a;
        font-size: 20px;
        font-weight: 700;
      }
      
      .return-sub {
        color: #64748b;
        font-size: 11px;
        margin-top: 5px;
      }
      
      .prorata-info {
        background: #fff7ed;
        border: 1px solid #fed7aa;
        border-radius: 12px;
        padding: 15px;
        margin-top: 15px;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .prorata-info span {
        color: #9a3412;
        font-size: 13px;
      }
      
      .subscription-period {
        background: #f8fafc;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 25px;
        border: 1px solid #e2e8f0;
      }
      
      .period-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 15px;
      }
      
      .period-header h3 {
        color: #1e293b;
        font-size: 16px;
        font-weight: 600;
      }
      
      .period-dates {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .date-item {
        text-align: center;
      }
      
      .date-label {
        color: #64748b;
        font-size: 11px;
        margin-bottom: 4px;
      }
      
      .date-value {
        color: #0f172a;
        font-size: 14px;
        font-weight: 600;
      }
      
      .timeline {
        flex: 1;
        margin: 0 20px;
        position: relative;
      }
      
      .timeline-bar {
        height: 4px;
        background: #e2e8f0;
        border-radius: 2px;
        position: relative;
      }
      
      .timeline-progress {
        position: absolute;
        left: 0;
        top: 0;
        height: 4px;
        background: #10b981;
        border-radius: 2px;
        width: ${prorataFactor * 100}%;
      }
      
      .footer {
        margin-top: 30px;
        padding-top: 20px;
        border-top: 2px dashed #cbd5e1;
      }
      
      .legal-info {
        background: #f8fafc;
        padding: 20px;
        border-radius: 12px;
        margin-bottom: 20px;
        text-align: left;
        border-left: 4px solid #2C3E50;
      }
      
      .legal-info p {
        font-size: 11px;
        color: #334155;
        margin-bottom: 8px;
        line-height: 1.5;
      }
      
      .certification {
        text-align: center;
      }
      
      .certification p {
        color: #475569;
        font-size: 12px;
        line-height: 1.6;
      }
      
      .reference-number {
        background: #f1f5f9;
        padding: 12px 20px;
        border-radius: 8px;
        font-family: monospace;
        font-size: 14px;
        font-weight: 600;
        color: #1e293b;
        margin-top: 15px;
        text-align: center;
      }
      
      @media print {
        body {
          background: white;
          padding: 0;
        }
        .receipt {
          box-shadow: none;
        }
      }
    </style>
  </head>
  <body>
    <div class="receipt">
      <!-- Header -->
      <div class="receipt-header">
        <div class="receipt-header-top">
          <div class="logo-container">
            <img class="logo" src="${logoUrl}" alt="Sendo Logo">
          </div>
          <div class="receipt-title">
            <h1>REÇU DE SOUSCRIPTION</h1>
            <p>FONDS BLOQUÉ</p>
          </div>
        </div>
        <div class="fund-badge">
          <span>🔒 ${fundName}</span>
        </div>
      </div>
      
      <!-- Body -->
      <div class="receipt-body">
        <!-- Montant investi -->
        <div class="amount-card">
          <div class="amount-title">Montant investi</div>
          <div class="amount-number">${investmentAmount.toLocaleString()}</div>
          <div class="amount-currency">XAF</div>
        </div>
        
        <!-- Informations souscripteur -->
        <div class="info-section">
          <h2>👤 SOUSCRIPTEUR</h2>
          <div class="info-grid">
            <div class="info-row">
              <span class="info-label">Nom complet</span>
              <span class="info-value">${userData?.lastname || ''} ${userData?.firstname || ''}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Téléphone</span>
              <span class="info-value">${userData?.phone || ''}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Email</span>
              <span class="info-value">${userData?.email || ''}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Pays</span>
              <span class="info-value">${userData?.country || 'Cameroun'}</span>
            </div>
          </div>
        </div>
        
        <!-- Rendements -->
        <div class="returns-section">
          <div class="returns-header">
            <span class="returns-title"> RENDEMENT ANNUEL</span>
            <span class="rate-badge">${annualReturnRate}%</span>
          </div>
          
          <div class="returns-grid">
            <div class="return-item">
              <div class="return-label">Commission annuelle (pleine)</div>
              <div class="return-value">${annualCommission.toLocaleString()} XAF</div>
              <div class="return-sub">Basée sur ${annualReturnRate}% de ${investmentAmount.toLocaleString()} XAF</div>
            </div>
            <div class="return-item">
              <div class="return-label">Commission au prorata</div>
              <div class="return-value">${prorataCommission.toFixed(0).toLocaleString()} XAF</div>
              <div class="return-sub">${daysRemaining} jours restants sur ${daysInYear} jours</div>
            </div>
          </div>
          
          <div class="prorata-info">
            <span style="font-size: 20px;">⏳</span>
            <span>
              <strong>Calcul au prorata temporis :</strong> Souscription le ${subscriptionDate}, 
              ${daysRemaining} jours de placement en ${currentYear} (${(prorataFactor * 100).toFixed(1)}% de l'année)
            </span>
          </div>
        </div>
        
        <!-- Période de blocage -->
        <div class="subscription-period">
          <div class="period-header">
            <span style="font-size: 20px;">📅</span>
            <h3>PÉRIODE DE BLOCAGE</h3>
          </div>
          
          <div class="period-dates">
            <div class="date-item">
              <div class="date-label">Date de souscription</div>
              <div class="date-value">${subscriptionDate}</div>
            </div>
            
            <div class="timeline">
              <div class="timeline-bar">
                <div class="timeline-progress"></div>
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 5px;">
                <span style="font-size: 10px; color: #64748b;">Début</span>
                <span style="font-size: 10px; color: #64748b;">Fin</span>
              </div>
            </div>
            
            <div class="date-item">
              <div class="date-label">Fin de blocage</div>
              <div class="date-value">${subscriptionEndDate}</div>
            </div>
          </div>
          
          <p style="color: #64748b; font-size: 11px; margin-top: 15px; text-align: center; font-style: italic;">
            * Les fonds sont bloqués jusqu'au 31 décembre ${currentYear}. 
            La commission sera versée au prorata du temps de placement.
          </p>
        </div>
        
        <!-- Transaction Reference -->
        <div class="reference-number">
          📋 Référence de transaction: ${transaction.transactionId}
        </div>
        
        <!-- Footer with Legal Information -->
        <div class="footer">
          <div class="legal-info">
            <p>
              <strong>Sendo</strong> est enregistrée comme entreprise de services monétaires auprès du Centre d'analyse des opérations et déclarations financières du Canada (CANAFE) sous le numéro d'enregistrement <strong>C100000856</strong>. Sendo est également titulaire d'un permis délivré par Revenu Québec sous le numéro <strong>19525</strong>.
            </p>
            <p>
              Au Cameroun, Sendo opère en partenariat avec <strong>Maviance</strong>, agrégateur de paiement agréé en Afrique, ainsi qu'avec des banques partenaires pour l'émission de ses cartes Visa.
            </p>
          </div>
          
          <div class="certification">
            <p style="font-size: 13px; font-weight: 600; color: #1e293b; margin-bottom: 5px;">
              CE REÇU EST UN JUSTIFICATIF OFFICIEL DE SOUSCRIPTION
            </p>
            <p>
              Ce document a été généré électroniquement par Sendo le ${emissionDate}.
            </p>
            <p style="margin-top: 10px; color: #64748b; font-size: 11px;">
              Sendo - Transferts d'argent internationaux • support@sendo.com • www.sendo.com
            </p>
          </div>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
};

// Mettez à jour la fonction handleDownloadReceipt
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
    const logoUrl = "https://res.cloudinary.com/dviktmefh/image/upload/v1758140850/WhatsApp_Image_2025-09-17_at_21.26.01_hjgtfa.jpg";
    
    // Générer le HTML en fonction du type de transaction
    let html;
    if (transaction.description === "Transfert CAM-CA") {
      html = generateCAMCAReceiptHTML(transaction, userData, userInfos, logoUrl);
    } else if (transaction.description === "Transfert CA-CAM") {
      html = generateCACAMReceiptHTML(transaction, userData, userInfos, logoUrl);
    } else if (transaction.type === 'FUND_SUBSCRIPTION') {
      html = generateFundSubscriptionReceiptHTML(transaction, userData, logoUrl);
    } else {
      html = generateReceiptHTML(transaction, user, getTypeLabel, logoUrl);
    }
    
    const { uri } = await Print.printToFileAsync({ html });
    
    // Nom du fichier adapté au type de transaction
    let fileName = 'Reçu_Sendo';
    if (transaction.type === 'FUND_SUBSCRIPTION') {
      fileName = `Souscription_Fonds_${transaction.transactionId}`;
    } else if (transaction.description === "Transfert CAM-CA") {
      fileName = `Transfert_CAM-CA_${transaction.transactionId}`;
    } else if (transaction.description === "Transfert CA-CAM") {
      fileName = `Transfert_CA-CAM_${transaction.transactionId}`;
    } else {
      fileName = `Reçu_Sendo_${transaction.transactionId}`;
    }
    
    const newUri = `${FileSystem.documentDirectory}${fileName}.pdf`;
    await FileSystem.moveAsync({ from: uri, to: newUri });

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
      <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: left; border: 1px solid #e2e8f0;">
        <p style="font-size: 11px; color: #334155; margin: 0 0 10px 0; line-height: 1.5;">
          <strong>Sendo</strong> est enregistrée comme entreprise de services monétaires auprès du Centre d’analyse des opérations et déclarations financières du Canada (CANAFE) sous le numéro d'enregistrement <strong>C100000856</strong>. Sendo est également titulaire d'un permis délivré par Revenu Québec sous le numéro <strong>19525</strong>.
        </p>
        <p style="font-size: 11px; color: #334155; margin: 0 0 5px 0; line-height: 1.5;">
          Au Cameroun, Sendo opère en partenariat avec <strong>Maviance</strong>, agrégateur de paiement agréé en Afrique, ainsi qu'avec des banques partenaires pour l'émission de ses cartes Visa.
        </p>
      </div>
      
      <div style="border-top: 1px solid #ecf0f1; padding-top: 15px;">
        <p style="font-size: 13px; font-weight: bold; color: #2c3e50; margin-bottom: 5px;">
          CE REÇU EST UN JUSTIFICATIF OFFICIEL DE TRANSFERT
        </p>
        <p style="font-size: 11px; color: #5f6b7a; margin: 5px 0;">
          Ce document a été généré électroniquement par Sendo le ${moment().format('DD/MM/YYYY HH:mm')}.
        </p>
        <p style="font-size: 11px; color: #5f6b7a; margin: 5px 0 15px 0;">
          Il est valable sans signature manuscrite conformément aux conditions générales d'utilisation du service.
        </p>
        <p style="font-size: 10px; color: #7f8c8d; margin-top: 15px;">
          Sendo - Transferts d'argent internationaux • support@sendo.com • www.sendo.com
        </p>
      </div>
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
           Frais de transaction: {(transaction.sendoFees || 0).toLocaleString()} {transaction.currency}
          </Text>

          <Text className="text-gray-600 text-sm mb-2">
            Total: {transaction.totalAmount.toLocaleString()} {transaction.currency}
          </Text>

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
                {transaction.type === 'FUND_SUBSCRIPTION' 
                  ? 'TÉLÉCHARGER LE REÇU DE SOUSCRIPTION'
                  : isCAMCATransfer 
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