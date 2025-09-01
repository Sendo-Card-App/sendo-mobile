import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { Asset } from 'expo-asset';
import { useNavigation, useRoute } from "@react-navigation/native";
import moment from "moment";
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Loader from "../../components/Loader";
import { useTranslation } from 'react-i18next';

const ReceiptScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const transaction = route.params?.transaction;
  console.log(transaction)
  const user = transaction?.destinataire; 
  console.log(user)
  const [isGenerating, setIsGenerating] = React.useState(false);
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

  const getTypeLabel = (type) => {
    switch(type?.toUpperCase()) {
      case 'DEPOSIT': return t('history1.deposit');
      case 'WITHDRAWAL': return t('history1.withdraw');
      case 'TRANSFER': return t('history1.transfer');
      case 'SHARED_PAYMENT': return t('history1.share');
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

const getLocalImageBase64 = async () => {
  try {
    // Chemin vers votre logo dans l'application
    const logoPath = require('../../images/LogoSendo.png');
    // Pour Expo, vous pouvez utiliser Asset.fromModule pour obtenir l'URI
    const asset = Asset.fromModule(logoPath);
    await asset.downloadAsync();
    
    // Lire le fichier et le convertir en base64
    const base64 = await FileSystem.readAsStringAsync(asset.localUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    
    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.error('Error loading local image:', error);
    return null;
  }
};

// Modifiez handleDownloadReceipt pour inclure le logo local
const handleDownloadReceipt = async () => {
  if (transaction.status !== 'COMPLETED') {
    Alert.alert(
      "Reçu indisponible",
      "Le reçu est uniquement disponible pour les transactions réussies"
    );
    return;
  }

  setIsGenerating(true);
  try {
    // Obtenez l'image en base64
    const logoBase64 = await getLocalImageBase64();
    
    // Passez logoBase64 comme paramètre à generateReceiptHTML
    const html = generateReceiptHTML(transaction, user, getTypeLabel, logoBase64);
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
  } finally {
    setIsGenerating(false);
  }
};

// Modifiez la signature de la fonction pour accepter logoBase64
const generateReceiptHTML = (transaction, user, getTypeLabel, logoBase64) => {
  const displayType = getTransactionDisplayType(transaction);
  const logoUrl = logoBase64 || "https://res.cloudinary.com/dviktmefh/image/upload/v1735143153/sendo-logo_aej8vq.png";
  
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
        <span class="status-completed">${transaction.status}</span>
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
        <span class="value">${transaction.partnerFees || 0} XAF</span>
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

  const getStatusSteps = () => {
    const formatDate = (date) => date ? moment(date).format('DD/MM/YYYY HH:mm') : 'N/A';

    return [
      {
        status: "Transmis",
        description: "Transfert initié avec succès",
        completed: true,
        time: formatDate(transaction.createdAt),
        icon: "checkmark-circle"
      },
      {
        status: "En traitement",
        description: "Vérification en cours",
        completed: transaction.status !== 'PENDING' && transaction.status !== 'FAILED',
        time: transaction.processedAt ? formatDate(transaction.processedAt) : 'En attente',
        icon: "time"
      },
      {
        status: transaction.status === 'COMPLETED' ? "Terminé" : "En attente",
        description: transaction.status === 'COMPLETED'
          ? "Le transfert a réussi"
          : "Le transfert a échoué",
        completed: transaction.status === 'COMPLETED',
        time: transaction.updatedAt ? formatDate(transaction.updatedAt) : 'N/A',
        icon: transaction.status === 'COMPLETED' ? "checkmark-done" : "close-circle"
      }
    ];
  };

  const displayType = getTransactionDisplayType(transaction);

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="items-center my-4 px-4">
          <Text className="text-lg font-semibold text-gray-700">
            Transferts récents
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
              <View key={index} className="flex-row items-start mb-2">
                <AntDesign 
                  name="checkcircle" 
                  size={20} 
                  color={step.completed ? "#7ddd7d" : "#d1d5db"} 
                />
                <View className="ml-2">
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
                Recharge de carte virtuelle effectuée
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
              <Text className="text-gray-600 text-sm">
                Type d'opération : Recharge de carte Sendo
              </Text>
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
          ) : displayType === 'BANK_TRANSFER' ? (
            <>
              <Text className="text-gray-800 font-semibold text-sm mb-2">
                Transfert bancaire effectué
              </Text>
              <Text className="text-gray-600 text-sm">
                Bénéficiaire : {transaction.receiver?.firstname || user?.firstname} {transaction.receiver?.lastname || user?.lastname}
              </Text>
              <Text className="text-gray-600 text-sm">
                Méthode de Paiement : Transfert Bancaire
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
               {transaction.status === 'COMPLETED' && (
                  <Text className="text-gray-800 font-semibold text-sm mb-2">
                    {(transaction.receiver?.firstname || user?.firstname) || 'Le bénéficiaire'} a reçu votre transfert.
                  </Text>
                )}
              <Text className="text-gray-600 text-sm">
                  Bénéficiaire :{" "}
                <Text className="font-semibold">
                  {transaction.type === 'WALLET_TO_WALLET' ||
                  transaction.type === 'TRANSFER' ||
                  transaction.type === 'FUND_REQUEST_PAYMENT' ||
                  transaction.type === 'SHARED_PAYMENT'
                    ? `${transaction.receiver?.firstname ?? ''} ${transaction.receiver?.lastname ?? ''}`
                    : `${user?.firstname ?? ''} ${user?.lastname ?? ''}`}
                </Text>


                </Text>
                <Text className="text-gray-600 text-sm">
                  Méthode de Paiement : {getTypeLabel1(transaction.provider, transaction.type, transaction.method) || 'N/A'}
                </Text>
                {displayType !== 'NIU_PAYMENT' && (
                  <Text className="text-gray-600 text-sm mb-2">
                    Numéro :{" "}
                  {transaction.type === 'WALLET_TO_WALLET' || transaction.type === 'TRANSFER' ||
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
          <Text className="text-gray-600 text-sm">Montant du transfert: {transaction.amount} {transaction.currency}</Text>
          <Text className="text-gray-600 text-sm">Frais de transfert: {transaction.sendoFees || 0} XAF</Text>
          <Text className="text-gray-600 text-sm mb-2">Total: {transaction.totalAmount} {transaction.currency}</Text>

          <Text className="text-green-600 font-semibold mt-2">Détails du transfert</Text>
          <Text className="text-gray-600 text-sm">Envoyé : {moment(transaction.createdAt).format('DD/MM/YYYY HH:mm')}</Text>
          <Text className="text-gray-600 text-sm">Référence du transfert : {transaction.transactionId}</Text>

          <TouchableOpacity
            onPress={handleDownloadReceipt}
            disabled={isGenerating || transaction.status !== 'COMPLETED'}
            className={`py-3 mt-4 rounded-lg items-center ${transaction.status !== 'COMPLETED' ? 'bg-gray-300' : 'bg-[#7ddd7d]'}`}
          >
            {isGenerating ? (
              <Loader color="white" />
            ) : (
              <Text className="text-white font-bold">
                {transaction.status === 'COMPLETED' ? 'TÉLÉCHARGER LE REÇU' : 'REÇU INDISPONIBLE'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate("History")}
          className="items-center mt-6"
        >
          <Text className="text-green-500 font-semibold">
            AFFICHER TOUS LES TRANSFERTS
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ReceiptScreen;