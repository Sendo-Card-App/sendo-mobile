import {
  View,
  Dimensions,
  Text,
  Image,
  Pressable,
  TouchableOpacity,
  Platform,
} from "react-native";
import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Entypo } from "@expo/vector-icons";
import ButtomLogo from "../../images/ButtomLogo.png";
import CarteVirtuelle from "../../images/CarteVirtuelle.png";
import HomeImage2 from "../../images/HomeImage2.png";
import { useNavigation } from "@react-navigation/native";

const Home = () => {
  const { height } = Dimensions.get("window");
  const navigation = useNavigation();

  const [isClickedOne, setisClickedOne] = useState(false);
  const [isClickedTwo, setisClickedTwo] = useState(false);

  const platformFont = Platform.OS === "ios" ? "HelveticaNeue" : "Roboto";

  return (
    <SafeAreaView className="flex-1 bg-[#7ddd7d] relative">
      <View className="flex-1 gap-2 mx-5">
        {/* Upper Section */}
        <View>
          <View className="border-b border-dashed flex-row items-center justify-between pt-2 pb-1">
            <Image
              source={ButtomLogo}
              resizeMode="contain"
              className="h-[50px] w-[150px]"
            />
            <TouchableOpacity onPress={() => navigation.openDrawer()}>
              <Ionicons name="menu-outline" size={24} color="black" />
            </TouchableOpacity>
          </View>

          <View className="py-5 pl-4">
            <Text
              style={{
                fontSize: Platform.OS === "ios" ? 20 : 18,
                fontFamily: platformFont,
                color: "white",
              }}
            >
              Bienvenue!
            </Text>
            <Text
              style={{
                fontSize: Platform.OS === "ios" ? 20 : 18,
                fontFamily: platformFont,
                color: "white",
              }}
            >
              your <Text style={{ color: "black" }}>Service Area</Text>
            </Text>
          </View>
        </View>

        {/* Two Options */}
        <View className="flex-row gap-2" style={{ height: height / 4.5 }}>
          {/* Box 1 */}
          <Pressable
            className="flex-1 bg-white rounded-3xl relative p-2"
            onPress={() => {
              setisClickedOne(true);
              setisClickedTwo(false);
              navigation.navigate("Payment");
            }}
          >
            <View
              className={`absolute top-2 left-2 ${
                isClickedOne ? "bg-[#181e25]" : ""
              } rounded-full`}
            >
              <Entypo name="circle" size={24} color="lightgray" />
            </View>
            <View className="flex-1 items-center justify-end">
              <Image
                source={CarteVirtuelle}
                className="w-full"
                style={{ height: height / 7 }}
                resizeMode="contain"
              />
              <View className="py-2">
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: platformFont,
                    textAlign: "center",
                    color: "#7ddd7d",
                    fontStyle: "italic",
                    fontWeight: "800",
                  }}
                >
                    Carte 
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: platformFont,
                    textAlign: "center",
                    fontStyle: "italic",
                    fontWeight: "800",
                  }}
                >
                  Virtuelle
                </Text>
              </View>
            </View>
          </Pressable>

          {/* Box 2 */}
          <Pressable
            onPress={() => {
              setisClickedTwo(true);
              setisClickedOne(false);
              navigation.navigate("BeneficiaryScreen");
            }}
            className="flex-1 bg-white rounded-3xl relative p-2"
          >
            <View
              className={`absolute top-2 left-2 ${
                isClickedTwo ? "bg-[#181e25]" : ""
              } rounded-full`}
            >
              <Entypo name="circle" size={24} color="lightgray" />
            </View>
            <View className="flex-1 items-center justify-end">
              <Image
                source={HomeImage2}
                className="w-full"
                style={{ height: height / 7 }}
                resizeMode="contain"
              />
              <View className="py-2">
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: platformFont,
                    textAlign: "center",
                    color: "#7ddd7d",
                    fontStyle: "italic",
                    fontWeight: "800",
                  }}
                >
                  Transfert
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: platformFont,
                    textAlign: "center",
                    fontStyle: "italic",
                    fontWeight: "800",
                  }}
                >
                  D’argent
                </Text>
              </View>
            </View>
          </Pressable>
        </View>

        {/* Lower Text Section */}
        <View className="flex-[2.4]">
          <View className="flex-1 justify-center">
            <Text
              style={{
                textAlign: "center",
                fontStyle: "italic",
                fontWeight: "bold",
                color: "#7ddd7d",
                fontSize: 18,
                fontFamily: platformFont,
              }}
            >
              TRANSFÉREZ DE L’ARGENT
            </Text>
            <Text
              style={{
                textAlign: "center",
                fontStyle: "italic",
                fontWeight: "bold",
                color: "#7ddd7d",
                fontSize: 18,
                fontFamily: platformFont,
              }}
            >
              EN TOUTE SÉCURITÉ
            </Text>

            <Text
              style={{
                textAlign: "center",
                marginTop: 32,
                color: "white",
                fontSize: 14,
                fontFamily: platformFont,
              }}
            >
              <Text style={{ color: "#7ddd7d" }}>Bon à savoir :</Text> Nous
              facilitons les transactions ﬁnancières internationales pour les
              étudiants étrangers, en particulier ceux originaires d’Afrique,
              qui souhaitent étudier au Canada.
            </Text>

            <Text
              style={{
                textAlign: "center",
                marginTop: 20,
                color: "#7ddd7d",
                fontSize: 14,
                fontFamily: platformFont,
              }}
            >
              Vos transferts d’argent simpliﬁés avec notre application.
              Proﬁtez de transferts rapide entre le Cameroun et le Canada.
              Suivez vos transferts en temps réel avec Sendo.
            </Text>
          </View>

          <View className="py-4 flex-row justify-center items-center gap-2">
            <Ionicons name="shield-checkmark" size={18} color="orange" />
            <Text
              style={{
                color: "white",
                fontSize: 12,
                fontFamily: platformFont,
              }}
            >
              Ne partagez pas vos informations personnelles…
            </Text>
          </View>
        </View>
      </View>

      {/* Background Overlay */}
      <View
        className="flex-1 bg-[#181e25] rounded-t-[14px] absolute left-0 right-0 bottom-0 -z-10"
        style={{ top: height / 2.4 }}
      />
      <StatusBar style="auto" backgroundColor="#7ddd7d" />
    </SafeAreaView>
  );
};

export default Home;
