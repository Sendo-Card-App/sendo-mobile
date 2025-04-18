import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import React from "react";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AntDesign,
  EvilIcons,
  Feather,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

const DrawerComponent = ({ navigation }) => {
  const navigation2 = useNavigation();
  return (
    <SafeAreaView className="flex-1">
      {/* The upper Green section  */}
      <View className=" bg-[#7ddd7d] pt-10 pl-10 pr-5 pb-5">
        <View className="flex-row justify-between items-center">
          <Text className="text-white font-bold text-xl">André</Text>
          <TouchableOpacity
            onPress={() => navigation.closeDrawer()}
            className="p-2"
          >
            <AntDesign name="arrowleft" size={24} color="white" />
          </TouchableOpacity>
        </View>
        <Text className="text-white">randré24cand@gmail.com</Text>
        <Text className="text-white">+237 600 00 00 00</Text>
      </View>
      {/* Lower section */}
      <View className="flex-1 mx-8">
        {/*  */}
        <View className="border-b border-gray-400 py-3">
          <Text className="font-bold text-gray-600">
            Bonus de 5,00 CAD gratuit
          </Text>
          <Text className="text-xs my-2 text-gray-500">
            Vous recevrez 5,00 CAD et votre ami recevra 5,00 CAD lors de son
            premier transfert. Des exigences d’envoi minimales peuvent
            s’appliquer. Sous réserve de conditions.
          </Text>

          <Text className="text-sm text-gray-500">
            Votre code: <Text className="font-bold">ANDRE237</Text>
          </Text>

          <View className="flex-row gap-2 items-center mt-2">
            <EvilIcons name="share-google" size={24} color="#7ddd7d" />
            <Text className="text-[#7ddd7d] font-bold">INVITER VOS AMIS</Text>
          </View>
        </View>

        {/* Part 2 */}
        <ScrollView className="py-4" showsVerticalScrollIndicator={false}>
          {/* One1 */}
          <TouchableOpacity
            className="flex-row gap-2 my-2 items-center"
            onPress={() => navigation2.navigate("MonSolde")}
          >
            <AntDesign
              name="wallet"
              size={Platform.OS === "ios" ? 32 : 24}
              color="gray"
            />
            <View>
              <Text className="font-bold text-gray-500">Mon solde</Text>
            </View>
          </TouchableOpacity>
          {/* One */}
          <TouchableOpacity
            className="flex-row gap-2 my-2"
            onPress={() => navigation2.navigate("History")}
          >
            <Ionicons
              name="document-text-outline"
              size={Platform.OS === "ios" ? 32 : 24}
              color="gray"
            />
            <View>
              <Text className="font-bold text-gray-500">Historique</Text>
              <Text className="text-sm text-gray-500">
                Listing chronologique de vos transactions
              </Text>
            </View>
          </TouchableOpacity>
          {/* Two */}
          <TouchableOpacity
            className="flex-row gap-2 my-2"
            onPress={() => navigation2.navigate("PayBill")}
          >
            <Ionicons
              name="calculator-outline"
              size={Platform.OS === "ios" ? 32 : 24}
              color="gray"
            />
            <View>
              <Text className="font-bold text-gray-500">
                Payer les factures
              </Text>
              <Text className="text-sm text-gray-500 pr-8">
                Payer des factures tels que les pass mobiles, internet et
                bouquets Tv
              </Text>
            </View>
          </TouchableOpacity>
          {/* Three */}
          <TouchableOpacity
            className="flex-row gap-2 my-2"
            onPress={() => navigation2.navigate("Account")}
          >
            <Feather
              name="user"
              size={Platform.OS === "ios" ? 32 : 24}
              color="gray"
            />
            <View>
              <Text className="font-bold text-gray-500">Compte</Text>
              <Text className="text-sm text-gray-500">
                Gérez vos informations personnelles
              </Text>
            </View>
          </TouchableOpacity>
          {/* Four */}
          <TouchableOpacity
            className="flex-row gap-2 my-2"
            onPress={() => navigation2.navigate("Payment")}
          >
            <MaterialCommunityIcons
              name="bank-outline"
              size={Platform.OS === "ios" ? 32 : 24}
              color="gray"
            />
            <View>
              <Text className="font-bold text-gray-500">Paiement</Text>
              <Text className="text-sm text-gray-500">
                Gérez vos méthodes de paiement
              </Text>
            </View>
          </TouchableOpacity>
          {/* Five */}
          <TouchableOpacity
            onPress={() => navigation2.navigate("Settings")}
            className="flex-row gap-2 my-2"
          >
            <AntDesign
              name="setting"
              size={Platform.OS === "ios" ? 32 : 24}
              color="gray"
            />
            <View>
              <Text className="font-bold text-gray-500">Paramètres</Text>
              <Text className="text-sm text-gray-500">Options & securite</Text>
            </View>
          </TouchableOpacity>
          {/* Six */}
          <TouchableOpacity
            className="flex-row gap-2 my-2"
            onPress={() => navigation2.navigate("Support")}
          >
            <EvilIcons
              name="question"
              size={Platform.OS === "ios" ? 32 : 24}
              color="gray"
            />
            <View>
              <Text className="font-bold text-gray-500">Support</Text>
              <Text className="text-sm text-gray-500">
                Service client, aide et contacts
              </Text>
            </View>
          </TouchableOpacity>
          {/* seven */}

          <TouchableOpacity
            className="flex-row gap-2 my-2"
            onPress={() => navigation2.navigate("AboutUs")}
          >
            <EvilIcons
              name="exclamation"
              size={Platform.OS === "ios" ? 32 : 24}
              color="gray"
            />
            <View>
              <Text className="font-bold text-gray-500">A propos de nous</Text>
              <Text className="text-sm text-gray-500 pr-8">
                Mentions le gales et conditions d'utilisation
              </Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>
      <Text
        className="text-center  text-gray-400 text-sm"
        style={{ paddingBottom: Platform.OS === "ios" ? 32 : 20 }}
      >
        Sendo App V1.0.1
      </Text>
    </SafeAreaView>
  );
};

export default DrawerComponent;
