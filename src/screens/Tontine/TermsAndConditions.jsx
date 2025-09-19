import React from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import ButtomLogo from "../../images/ButtomLogo1.png";
import { useTranslation } from "react-i18next";

const TermsAndConditions = ({ route, navigation }) => {
  const { t } = useTranslation();
  const { onAccept } = route.params || {};

  // Vos nouvelles Conditions Générales de Vente
  const termsContent = [
    "Conditions Générales de Vente (CGV) – eTontine Sendo",
    "",
    "1. Objet du service",
    "La Tontine Digitale Sendo est un service numérique permettant à un groupe d’utilisateurs de constituer un fonds commun par cotisations périodiques, redistribué selon un ordre défini. Sendo agit uniquement comme plateforme technique et transactionnelle.",
    "",
    "2. Souscription et engagement",
    "Toute participation à une tontine via Sendo nécessite un compte Sendo vérifié (KYC).",
    "L’utilisateur peut créer ou rejoindre une tontine via l’application.",
    "En signant ces CGV, le membre s’engage à cotiser régulièrement selon le calendrier établi et à respecter les règles de fonctionnement du groupe.",
    "L’acceptation de ces CGV est obligatoire pour participer à la tontine.",
    "",
    "3. Rôles et responsabilités",
    "Président de la tontine :",
    "• Définit les règles internes (montant, ordre, fréquence, pénalités).",
    "• Peut suspendre ou clore une tontine si nécessaire.",
    "Membres :",
    "• Doivent cotiser dans les délais.",
    "• Recevront leur tour selon l’ordre défini.",
    "Sendo :",
    "• Fournit l’interface technique pour gérer les paiements, notifications et historiques.",
    "",
    "4. Fonctionnement du service",
    "• Cotisations via portefeuille Sendo ou Mobile Money.",
    "• Notifications automatiques à chaque tour.",
    "• Redistribution automatique selon les règles choisies.",
    "• Historique des opérations accessible à tous les membres.",
    "",
    "5. Frais et commissions",
    "Des frais de service sont appliqués par Sendo sur chaque cotisation (fixe ou pourcentage).",
    "Aucun frais supplémentaire ne peut être ajouté sans accord collectif.",
    "",
    "6. Retards et pénalités",
    "En cas de retard ou d’absence de cotisation :",
    "• Application d’une pénalité.",
    "• Suspension automatique ou manuelle du membre.",
    "• Avertissement transmis au président.",
    "",
    "7. Résiliation ou annulation d’une tontine",
    "Une tontine peut être clôturée à tout moment par le président.",
    "Les fonds non encore redistribués sont remboursés (moins les frais).",
    "L’historique reste visible pendant 6 mois.",
    "",
    "8. Clause d’exonération de responsabilité",
    "Sendo n’est pas responsable des conflits internes.",
    "Sendo fournit uniquement une interface de gestion digitale.",
    "En cas de non-paiement, litige, fraude ou abandon d’un membre, Sendo ne peut être tenu responsable.",
    "Aucune réclamation ne sera recevable en dehors d’un dysfonctionnement technique de la plateforme.",
    "",
    "9. Confidentialité et sécurité",
    "• Données chiffrées et protégées.",
    "• Connexion sécurisée par authentification.",
    "• Conformité avec les normes RGPD/LOPD.",
    "",
    "10. Suspension de service",
    "Sendo peut suspendre temporairement le service pour :",
    "• Maintenance technique,",
    "• Sécurité,",
    "• Non‑conformité d’un utilisateur.",
    "",
    "✅ En acceptant ces CGV :",
    "Le membre reconnaît avoir lu et compris les règles.",
    "Il s’engage à participer activement, à cotiser à chaque tour, et à respecter les autres membres du groupe.",
    "Il comprend que toute mauvaise foi ou manquement relève de sa responsabilité personnelle, non de Sendo.",
  ];

  const handleAccept = async () => {
    try {
      await AsyncStorage.setItem("hasAcceptedTerms", "true");
      if (typeof onAccept === "function") {
        onAccept();
      }
      navigation.replace("TontineList");
    } catch (error) {
      console.error("Error saving acceptance:", error);
    }
  };

  return (
    <View className="flex-1 bg-white">
       <StatusBar backgroundColor="#7ddd7d" barStyle="light-content" />
      {/* Header */}
      <View className="bg-[#7ddd7d] pt-12 pb-4 px-4 flex-row justify-between items-center z-10">
        <Image
          source={ButtomLogo}
          resizeMode="contain"
          className="h-[50px] w-[150px]"
        />
        <TouchableOpacity onPress={() => navigation.goBack()}>
           <AntDesign name="left" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Divider */}
      <View className="border border-dashed border-black mx-4 my-2" />

      {/* Content */}
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} className="px-6">
        {termsContent.map((line, idx) => (
          <Text
            key={idx}
            className={`${
              line.startsWith("✅") ? "text-green-600 font-bold" : "text-gray-700"
            } text-base mb-2`}
          >
            {line}
          </Text>
        ))}

        {/* Accept Button */}
        <View className="mt-10 mb-10">
          <TouchableOpacity
            onPress={handleAccept}
            className="bg-[#7ddd7d] py-5 rounded-full items-center shadow-md"
          >
            <Text className="text-black font-bold text-[16px]">
              {t("terms.accept")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default TermsAndConditions;
