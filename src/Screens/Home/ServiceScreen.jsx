import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, FlatList, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import AsyncStorage from '@react-native-async-storage/async-storage';

const ServiceScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(null);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get("window").width);

  const numColumns = 2;
  const spacing = 20;
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
      try {
        const value = await AsyncStorage.getItem('hasAcceptedTerms');

        if (value === null) {
          // First time launch: set to false
          await AsyncStorage.setItem('hasAcceptedTerms', 'false');
          setHasAcceptedTerms(false);
        } else {
          setHasAcceptedTerms(value === 'true');
        }
      } catch (error) {
        console.error('Error checking terms acceptance:', error);
      }
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

 const renderItem = ({ item }) => {
  const handlePress = () => {
    if (item.route === "TontineList") {
      if (hasAcceptedTerms) {
        navigation.navigate("TontineList");
      } else {
        navigation.navigate("TermsAndConditions");
      }
    } else {
      navigation.navigate(item.route);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={{
        width: itemSize,
        height: itemSize,
        margin: spacing / 2,
        borderRadius: 18,
        backgroundColor: "#F2F2F2",
        justifyContent: "center",
        alignItems: "center",
        elevation: 4,
      }}
    >
      <Ionicons name={item.icon} size={48} color="#7ddd7d" style={{ marginBottom: 10 }} />
      <Text className="text-black text-l text-center font-semibold">{item.label}</Text>
    </TouchableOpacity>
  );
};


  return (
    <View className="flex-1 bg-white">
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
        key={`grid-${numColumns}`} 
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
