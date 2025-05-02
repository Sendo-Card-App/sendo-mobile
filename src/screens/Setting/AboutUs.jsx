import React, { View, Text, ScrollView } from "react-native";

const AboutUs = () => {
  return (
    <View className="flex-1">
      <ScrollView>
        {/*  */}
        <View className="px-4">
          <Text className="font-extrabold p-4 text-gray-600 mt-2">
            À propos de Sendo
          </Text>
          <Text className="text-gray-400 text-sm ml-4 mt-3">
            Bienvenue sur Sendo, votre solution de transfert d’argent {"\n"}
            rapide, sécurisé et ﬁable entre l’Afrique et le reste du monde.{" "}
            {"\n"}
            Notre mission est de faciliter les transactions ﬁnancières {"\n"}
            pour connecter les familles, soutenir les étudiants et accompagner
            les entrepreneurs, en toute simplicité.
          </Text>
        </View>

        {/*  */}
        <View className="px-4">
          <Text className="font-extrabold p-4 text-gray-600 mt-2">
            Mentions légales
          </Text>
          <Text className="text-gray-400 text-sm ml-4 mt-3">
            Sendo App est une plateforme opérée par Services {"\n"}
            Transfert D'argent Inc., une entreprise de services monétaires
            basée au Québec, Canada. Nous sommes autorisés à exercer nos
            activités sous le permis {"\n"}
            numéro 19525 délivré par Revenu Québec et sommes inscrits {"\n"}
            au Centre d’analyse des opérations et déclarations ﬁnancières du
            Canada (CANAFE).
          </Text>
        </View>

        {/*  */}
        <View className="mt-3 px-4">
          <Text className="text-gray-400 text-sm ml-4 mt-3">
            Siège social : 2001 Boulevard Robert-Bourassa, Montréal, Québec,
            Canada, H3A 2A6. {"\n"}
            Courriel de contact : supportsendo@sf-e.ca. {"\n"}
            Numéro de téléphone du service client : 581 907 2096. Numéro
            d’entreprise du Québec (NEQ) : 1180279300.
          </Text>
        </View>

        {/*  */}
        <View className="mt-3 px-4">
          <Text className="text-gray-400 text-sm ml-4 mt-3">
            Toutes les transactions effectuées sur notre plateforme sont régies
            par les lois en vigueur au Canada et dans les {"\n"}
            juridictions où nous opérons. Nous adhérons strictement {"\n"}
            aux normes de sécurité ﬁnancière, y compris la lutte {"\n"}
            contre le blanchiment d’argent (AML) et la vériﬁcation des clients
            (KYC).
          </Text>
        </View>

        {/*  */}
        <View className="px-4">
          <Text className="font-extrabold p-4 text-gray-600 mt-2">
            Conditions d’utilisation
          </Text>
          <Text className="font-extrabold p-4 text-gray-600">
            1 - Accès et utilisation :
          </Text>
          <Text className="text-gray-400 text-sm ml-4 -mt-3">
            En utilisant l’application Sendo, vous acceptez les{"\n"}
            termes etconditions présentés ici. Vous vous engagez à fournir des
            informations exactes lors de l’inscription et à protéger vos
            identiﬁants de connexion.
          </Text>
        </View>

        {/*  */}
        <View className="px-4">
          <Text className="font-extrabold p-4 text-gray-600 mt-3">
            2 - Transactions :
          </Text>
          <Text className="text-gray-400 text-sm ml-4 -mt-3">
            - Les transferts effectués via Sendo sont soumis à des limites
            déﬁnies en fonction de votre proﬁl et de la réglementation locale. -
            Les frais de transfert et les taux de change sont transparents et
            aﬃchés avant chaque transaction.
          </Text>
        </View>

        {/*  */}
        <View className="px-4">
          <Text className="font-extrabold p-4 text-gray-600 mt-3">
            3 - Sécurité :
          </Text>
          <Text className="text-gray-400 text-sm ml-4 -mt-3">
            Toutes les transactions sont sécurisées grâce au chiffrement de bout
            en bout (SSL/TLS). Nous ne partageons pas vos informations
            personnelles avec des tiers sans votre consentement, sauf si requis
            par la loi.
          </Text>
        </View>

        {/*  */}
        <View className="px-4">
          <Text className="font-extrabold p-4 text-gray-600 mt-3">
            4 - Conﬁdentialité :
          </Text>
          <Text className="text-gray-400 text-sm ml-4 -mt-3">
            Vos données sont collectées et utilisées conformément à notre
            politique de conﬁdentialité, disponible dans l’application ou sur
            notre site web.
          </Text>
        </View>

        {/*  */}
        <View className="px-4">
          <Text className="font-extrabold p-4 text-gray-600 mt-3">
            5 - Support client :
          </Text>
          <Text className="text-gray-400 text-sm ml-4 -mt-3">
            Pour toute question ou assistance, vous pouvez nous contacter via le
            service client intégré ou par courriel à supportsendo@sf-e.ca ou au
            581 907 2096.
          </Text>
        </View>

        {/*  */}
        <View className="px-4">
          <Text className="font-extrabold p-4 text-gray-600 mt-3">
            6- Responsabilités :
          </Text>
          <Text className="text-gray-400 text-sm ml-4 -mt-3">
            Sendo n’est pas responsable des retards ou des échecs de transfert
            dus à des erreurs bancaires, des restrictions locales ou des
            événements indépendants de notre volonté.
          </Text>
        </View>

        {/*  */}
        <View className="px-4">
          <Text className="text-gray-400 text-sm ml-4 mt-6">
            Merci de choisir Sendo! {"\n"}
            Nous nous engageons à vous offrir une expérience ﬂuide, rapide et
            conforme à vos attentes.
          </Text>
        </View>
        {/*  */}
        <View className="py-4" />
      </ScrollView>
    </View>
  );
};

export default AboutUs;
