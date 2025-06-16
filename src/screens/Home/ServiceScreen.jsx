import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, FlatList, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import AsyncStorage from '@react-native-async-storage/async-storage';

const ServiceScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [screenWidth, setScreenWidth] = useState(Dimensions.get("window").width);

  const numColumns = 2;
  const spacing = 30;
  const itemSize = (screenWidth - spacing * (numColumns + 1)) / numColumns;

  useEffect(() => {
    const onChange = ({ window }) => {
      setScreenWidth(window.width);
    };

    const subscription = Dimensions.addEventListener("change", onChange);
    return () => subscription.remove();
  }, []);

   useEffect(() => {
        const checkTerms = async () => {
          const value = await AsyncStorage.getItem("hasAcceptedTerms");
          setHasAcceptedTerms(value === "true");
        };
        checkTerms();
      }, []);

  const services = [
    { label: t("home.virtualCard"), icon: "card-outline", route: "Payment" },
    { label: t("home.friendsShare"), icon: "people-outline", route: "WelcomeShare" },
    { label: t("home.fundRequest"), icon: "cash-outline", route: "WelcomeDemand" },
    { label: t("home.etontine"), icon: "layers-outline", route: "TontineList" },
    { label: t("home.payBills"), icon: "calculator-outline", route: "PaymentSimulator" },
    { label: t("drawer.request1"), icon: "chatbubbles-outline", route: "NiuRequest" },
  ];

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() => item.route && navigation.navigate(item.route)}
      style={{
        width: itemSize,
        height: itemSize,
        margin: spacing / 2,
        borderRadius: 18,
        backgroundColor: "#1A1A1A",
        justifyContent: "center",
        alignItems: "center",
        elevation: 4,
      }}
    >
      <Ionicons name={item.icon} size={32} color="#7ddd7d" style={{ marginBottom: 10 }} />
      <Text className="text-white text-sm text-center font-semibold">{item.label}</Text>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-black">
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingTop: 50,
          paddingBottom: 15,
          paddingHorizontal: 20,
          backgroundColor: "#7ddd7d",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-white">{t("home.services")}</Text>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* Services Grid */}
      <FlatList
        key={`grid-${numColumns}`} // Force le re-render
        data={services}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        numColumns={numColumns}
        contentContainerStyle={{ padding: spacing }}
      />
    </View>
  );
};

export default ServiceScreen;
