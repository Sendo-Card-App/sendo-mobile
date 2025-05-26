import {
  View,
  Dimensions,
  Text,
  Image,
  Pressable,
  TouchableOpacity,
  Platform,
  ScrollView,
  RefreshControl,
} from "react-native";
import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Entypo,  MaterialIcons  } from "@expo/vector-icons";
import ButtomLogo from "../../Images/ButtomLogo.png";
import CarteVirtuelle from "../../Images/CarteVirtuelle.png";
import HomeImage2 from "../../Images/HomeImage2.png";
import { useNavigation } from "@react-navigation/native";

const Home = () => {
  const { height } = Dimensions.get("window");
  const navigation = useNavigation();
  const [isClickedOne, setisClickedOne] = useState(false);
  const [isClickedTwo, setisClickedTwo] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(); // Replace with actual data

  const platformFont = Platform.OS === "ios" ? "HelveticaNeue" : "Roboto";

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#7ddd7d] relative">
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View className="flex-1 gap-2 mx-5">
          {/* Upper Section */}
          <View>
            <View className="border-b border-dashed flex-row items-center justify-between pt-2 pb-1">
              <Image
                source={ButtomLogo}
                resizeMode="contain"
                className="h-[50px] w-[150px]"
              />
              <View className="flex-row items-center gap-4">
                {/* Notification Bell with Badge */}
                <TouchableOpacity 
                  className="relative p-2"
                  onPress={() => navigation.navigate("NotificationComponent")}
                >
                  <MaterialIcons name="notifications" size={24} color="black" />
                  {unreadCount > 0 && (
                    <View className="absolute top-1 right-1 bg-red-500 rounded-full min-w-[20px] h-[20px] justify-center items-center px-1">
                      <Text className="text-white text-xs font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity onPress={() => navigation.openDrawer()}>
                  <Ionicons name="menu-outline" size={24} color="black" />
                </TouchableOpacity>
              </View>
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
                    D'argent
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
                TRANSFÉREZ DE L'ARGENT
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
                étudiants étrangers, en particulier ceux originaires d'Afrique,
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
                Vos transferts d'argent simpliﬁés avec notre application.
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
      </ScrollView>

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