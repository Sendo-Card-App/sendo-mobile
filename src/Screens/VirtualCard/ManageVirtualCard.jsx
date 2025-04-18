import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
} from "react-native";
import React from "react";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import ButtomLogo from "../../images/ButtomLogo.png";
import Card from "../../images/VirtualCard.png";
import { StatusBar } from "expo-status-bar";

const ManageVirtualCard = ({ navigation }) => {
  const { width } = Dimensions.get("screen");

  const TransactionCard = () => {
    return (
      <View className="p-2 my-2 flex-row items-center gap-4">
        <AntDesign
          name="checkcircle"
          size={30}
          color="#7ddd7d"
          className="mt-3"
        />
        <View className="flex-1">
          <View className="flex-row justify-between border-b border-gray-400 py-2">
            <Text className="font-bold text-gray-600">André Djoumdjeu</Text>
            <Text className="text-gray-800 font-extrabold">0,00 FCFA</Text>
          </View>
          <View className="flex-row justify-between px-2">
            <Text className="text-sm font-light">Eﬀectué</Text>
            <Text className="text-sm font-light">21/12/2024 à 10:18</Text>
          </View>
        </View>
      </View>
    );
  };
  return (
    <View className="bg-[#181e25] flex-1 pt-0 relative">
      {/* the top navigation with a back arrow and a right menu button */}
      <View className="border-b border-dashed border-white flex-row justify-between py-4 mt-10 items-center mx-5 pt-5">
        <Image source={ButtomLogo} className="h-11 w-40" />
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* the middle heading */}
      <Text className="text-center text-white text-2xl my-3">
        Gérer ma carte virtuelle
      </Text>

      {/* the white formsection of the screen */}
      <View className="flex-1 gap-3 py-3 bg-white px-4 rounded-t-3xl">
        <View className="w-4 h-4 bg-[#7ddd7d] rounded-full ml-auto"></View>
        {/* Card */}
        <View className="relative">
          <Image
            source={Card}
            className="w-full"
            style={{ height: width / 1.66 }}
            resizeMode="contain"
          />
          <View className="absolute top-0 bottom-0 left-0 right-[50%] px-4 py-6">
            {/* part 1 */}
            <View className="flex-1 justify-center">
              {/* section 1 */}

              <Text className="text-white font-extralight">Solde</Text>
              <Text className="text-[#7ddd7d] bg-white text-center mt-2">
                786 000 XAF
              </Text>
              {/* section 2 */}
              <View className="mt-2">
                <Text className="text-white font-extralight text-sm">
                  0000 0000 0000 0000
                </Text>
                <Text className="text-white font-extralight text-xs">
                  CVV: 000
                </Text>
              </View>
            </View>
            {/* part 2 */}
            <View>
              <Text className="text-white font-extralight text-xs">
                CARD HOLDER
              </Text>
              <Text className="text-white font-bold text-sm">
                ANDRE DJOUMDJEU
              </Text>
              <Text className="font-extralight text-xs text-yellow-400 mt-3">
                Expires : 00/00/00
              </Text>
            </View>
          </View>
        </View>
        {/* recharge button */}
        <TouchableOpacity
          className="bg-[#7ddd7d] py-3 rounded-lg shadow-sm shadow-black w-[80%] mx-auto"
          // onPress={() => navigation.navigate("CreateVirtualCard")}
        >
          <Text className="text-center text-lg font-bold">Recharger</Text>
        </TouchableOpacity>
        {/* history section */}
        <View className="border-t border-dashed flex-1">
          <Text className="font-bold text-gray-600 py-3 px-2">
            Historique des transactions
          </Text>

          <FlatList
            data={[1, 2, 3, 4, 5, 6, 7, 8, 9]}
            renderItem={({ item }) => <TransactionCard />}
            ListHeaderComponent={() => (
              <Text className="text-right text-[#7ddd7d]">Cacher</Text>
            )}
          />
          <Text className="text-center my-3 text-[#7ddd7d] text-lg">
            AFFICHER TOUS LES TRANSFERTS
          </Text>
        </View>
      </View>

      {/* the buttom message of the screen with a small shield icon */}
      <View className="py-4 flex-row justify-center items-center gap-2">
        <Ionicons name="shield-checkmark" size={18} color="orange" />
        <Text className="text-sm text-white">
          Ne partagez pas vos informations personnelles…
        </Text>
      </View>

      <StatusBar style="light" />
    </View>
  );
};

export default ManageVirtualCard;
