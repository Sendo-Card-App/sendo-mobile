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
import { useNavigation, useRoute } from "@react-navigation/native";
import moment from "moment";
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Asset } from 'expo-asset';
import Loader from "../../components/Loader";
import { useTranslation } from 'react-i18next';

const ReceiptScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const user = route.params?.user;
  const transaction = route.params?.transaction;
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
    const getTypeLabel1 = (provider) => {
    switch(provider?.toUpperCase()) {
      case 'SYSTEM': return t('history1.system');
       case 'WALLET_PAYMENT': return t('history1.walletPayment');
      case 'TONTINE_PAYMENT': return t('history1.tontine');
      case 'PAYMENT': return t('history1.payment');
      default: return provider;
    }
  };

    const getMethodIcon = () => {
  switch (transaction.method?.toUpperCase()) {
    case 'MOBILE_MONEY':
      if (transaction.provider === 'CMORANGEOM') {
        return require('../../images/om.png');
      } else if (transaction.provider === 'MTNMOMO') {
        return require('../../images/mtn.png');
      } else {
        return require('../../images/transaction.png'); // fallback générique
      }
    case 'BANK_TRANSFER':
      return require('../../images/RoyalBank.png');
    default:
      return require('../../images/transaction.png');
  }
};

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
      const [asset] = await Asset.loadAsync(require('../../images/LogoSendo.png'));
      const base64Logo = await FileSystem.readAsStringAsync(asset.localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const logoDataUri = `data:image/png;base64,${base64Logo}`;

      const html = generateReceiptHTML(transaction, user, logoDataUri, getTypeLabel);

      const file = await Print.printToFileAsync({
        html,
        base64: false
      });

      const fileUri = `${FileSystem.documentDirectory}Reçu transaction Sendo.pdf`;
      await FileSystem.moveAsync({
        from: file.uri,
        to: fileUri
      });

      await Sharing.shareAsync(fileUri);
    } catch (error) {
      Alert.alert("Erreur", "Échec de génération du reçu. Veuillez réessayer.");
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateReceiptHTML = (transaction, user, logoUri, getTypeLabel) => {
    return `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; }
            .logo { width: 100px; margin: 0 auto; }
            .title { font-size: 18px; font-weight: bold; margin: 10px 0; }
            .section { margin-bottom: 15px; }
            .section-title { font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            .row { display: flex; justify-content: space-between; margin: 5px 0; }
            .footer { margin-top: 30px; font-size: 12px; text-align: center; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="${logoUri}" alt="Logo Sendo" class="logo" />
            <div class="title">Reçu de transfert Sendo</div>
            <div>Référence de transaction: ${transaction.transactionId}</div>
          </div>

          <div class="section">
            <div class="section-title">Détails de la transaction</div>
            <div class="row">
              <span>Date:</span>
              <span>${transaction.createdAt ? moment(transaction.createdAt).format('DD/MM/YYYY HH:mm') : 'N/A'}</span>
            </div>
            <div class="row">
              <span>Statut:</span>
              <span>${transaction.status}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Bénéficiaire</div>
            <div class="row">
              <span>Nom:</span>
              <span>${user?.firstname} ${user?.lastname}</span>
            </div>
            <div class="row">
              <span>Numéro:</span>
              <span>${user?.phone}</span>
            </div>
            <div class="row">
              <span>Méthode:</span>
              <span>${transaction.provider || 'N/A'}</span>
            </div>
            <div class="row">
              <span>Type:</span>
              <span>${getTypeLabel(transaction.type) || 'N/A'}</span>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Montant</div>
            <div class="row">
              <span>Montant envoyé:</span>
              <span>${transaction.amount} ${transaction.currency}</span>
            </div>
            <div class="row">
              <span>Frais:</span>
              <span>${transaction.partnerFees || 0} FCFA</span>
            </div>
            <div class="row">
              <span>Total:</span>
              <span>${transaction.totalAmount} ${transaction.currency}</span>
            </div>
          </div>

          <div class="footer">
            Ce reçu est généré automatiquement et peut être utilisé comme justificatif.
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
        status: transaction.status === 'COMPLETED' ? "Terminé" : "Échec",
        description: transaction.status === 'COMPLETED'
          ? "Le transfert a réussi"
          : "Le transfert a échoué",
        completed: transaction.status === 'COMPLETED',
        time: transaction.updatedAt ? formatDate(transaction.updatedAt) : 'N/A',
        icon: transaction.status === 'COMPLETED' ? "checkmark-done" : "close-circle"
      }
    ];
  };

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

          <Text className="text-gray-800 font-semibold text-sm mb-2">
            {transaction.recipient_name || 'Le bénéficiaire'} a reçu votre transfert.
          </Text>

          <Text className="text-gray-600 text-sm">
            Bénéficiaire :{" "}
            <Text className="font-semibold">{user?.firstname} {user?.lastname}</Text>
          </Text>
          <Text className="text-gray-600 text-sm">Methode de Paiement : {getTypeLabel1(transaction.provider) || 'N/A'}</Text>
          <Text className="text-gray-600 text-sm">Type de Paiement : {getTypeLabel(transaction.type) || 'N/A'}</Text>
          <Text className="text-gray-600 text-sm mb-2">Numéro : {user?.phone}</Text>

          <Text className="text-green-600 font-semibold my-1">Reçu</Text>
          <Text className="text-gray-600 text-sm">Montant du transfert: {transaction.amount} {transaction.currency}</Text>
          <Text className="text-gray-600 text-sm">Frais de transfert: {transaction.sendoFees || 0} XAF</Text>
          <Text className="text-gray-600 text-sm mb-2">Total: {transaction.totalAmount} {transaction.currency}</Text>

          <Text className="text-green-600 font-semibold mt-2">Détails du transfert</Text>
          <Text className="text-gray-600 text-sm">Envoyé : {transaction.createdAt ? moment(transaction.createdAt).format('DD/MM/YYYY HH:mm') : 'N/A'}</Text>
          <Text className="text-gray-600 text-sm">Reference du transfert : {transaction.transactionId}</Text>

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
