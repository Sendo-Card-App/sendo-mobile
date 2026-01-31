import React, { useState, useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  Dimensions, 
  StatusBar,
  Animated,
  Easing
} from "react-native";
import { Ionicons, AntDesign, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useGetUserProfileQuery } from "../../services/Auth/authAPI";
import { useTranslation } from "react-i18next";
import AsyncStorage from '@react-native-async-storage/async-storage';

const ServiceScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(null);
  const [screenWidth, setScreenWidth] = useState(Dimensions.get("window").width);
    const {
      data: userProfile,
      isLoading: isProfileLoading,
      refetch: refetchProfile,
    } = useGetUserProfileQuery();


    // Filter services based on country
  const country = userProfile?.data?.user?.country;



  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const itemAnimations = useRef([]).current;

// 1️⃣ Define services first (keep at top, before any filter)
const services = [
  { label: t("home.friendsShare"), icon: "people-outline", route: "WelcomeShare", color: "#7ddd7d", bgColor: "#f0f9f0" },
  { label: t("home.fundRequest"), icon: "cash-outline", route: "WelcomeDemand", color: "#ff6b6b", bgColor: "#fff0f0" },
  { label: t("home.etontine"), icon: "layers-outline", route: "TontineList", color: "#4dabf7", bgColor: "#f0f7ff" },
  { label: t("home.payBills"), icon: "calculator-outline", route: "PaymentSimulator", color: "#ff922b", bgColor: "#fff9f0" },
   { label: t("home.withdrawal"), icon: "cash-outline", route: "InteracWithdrawal", color: "#ff922b", bgColor: "#fff9f0" },
  { label: t("drawer.request1"), icon: "chatbubbles-outline", route: "NiuRequest", color: "#cc5de8", bgColor: "#f8f0fc" },
  { label: t("serviceScreen.support") || "Support", icon: "headset-outline", route: "ChatScreen", color: "#8B5CF6", bgColor: "#F5F3FF" },
];

// 2️⃣ Now safely filter based on country
let filteredServices = services;

if (country === "Canada") {
  filteredServices = services.filter(item =>
    item.route === "NiuRequest" || item.route === "ChatScreen" || item.route === "PaymentSimulator"
    || item.route === "Withdrawal"
  );
}


  // Initialize animations after services is defined
  if (itemAnimations.length === 0) {
    services.forEach(() => {
      itemAnimations.push(new Animated.Value(0));
    });
  }

  const numColumns = 2;
  const spacing = 20;
  const itemSize = (screenWidth - spacing * (numColumns + 2)) / numColumns;

  useEffect(() => {
    const onChange = ({ window }) => {
      setScreenWidth(window.width);
    };

    const subscription = Dimensions.addEventListener("change", onChange);
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    const checkTerms = async () => {
      try {
        const value = await AsyncStorage.getItem('hasAcceptedTerms');

        if (value === null) {
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

  useEffect(() => {
    // Animate header and content
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate items with stagger
    const itemAnimationsTiming = itemAnimations.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        delay: 300 + index * 100,
        easing: Easing.out(Easing.back(1.5)),
        useNativeDriver: true,
      })
    );

    Animated.stagger(100, itemAnimationsTiming).start();
  }, [fadeAnim, slideAnim, scaleAnim, itemAnimations]);

  const handlePress = (item) => {
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

  const renderItem = ({ item, index }) => {
    const animatedStyle = {
      opacity: itemAnimations[index],
      transform: [
        { 
          translateY: itemAnimations[index].interpolate({
            inputRange: [0, 1],
            outputRange: [50, 0]
          })
        },
        {
          scale: itemAnimations[index].interpolate({
            inputRange: [0, 1],
            outputRange: [0.8, 1]
          })
        }
      ]
    };

    return (
      <Animated.View style={animatedStyle}>
        <TouchableOpacity
          onPress={() => handlePress(item)}
          style={{
            width: itemSize,
            height: itemSize,
            margin: spacing / 2,
            borderRadius: 24,
            backgroundColor: item.bgColor,
            justifyContent: "center",
            alignItems: "center",
            elevation: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            borderWidth: 2,
            borderColor: 'rgba(255, 255, 255, 0.8)',
          }}
          activeOpacity={0.7}
        >
          <View className="items-center justify-center">
            <View 
              style={{ 
                width: 70, 
                height: 70, 
                borderRadius: 35, 
                backgroundColor: 'white',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 12,
                elevation: 4,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
              }}
            >
              <Ionicons 
                name={item.icon} 
                size={32} 
                color={item.color} 
              />
            </View>
            <Text 
              style={{ 
                color: "#1a1a1a", 
                fontSize: 14, 
                fontWeight: "700", 
                textAlign: "center",
                lineHeight: 18,
              }}
              numberOfLines={2}
            >
              {item.label}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar backgroundColor="#7ddd7d" barStyle="light-content" />
      
      {/* Animated Header */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim }
          ]
        }}
        className="bg-[#7ddd7d] pt-12 pb-4 px-6 rounded-b-3xl shadow-lg"
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="w-12 h-12 bg-white/20 rounded-full items-center justify-center"
            activeOpacity={0.7}
          >
            <AntDesign name="left" size={20} color="white" />
          </TouchableOpacity>
          
          <Text className="text-2xl font-bold text-white text-center flex-1 mx-4">
            {t("home.services")}
          </Text>
          
          <TouchableOpacity 
            onPress={() => navigation.openDrawer()}
            className="w-12 h-12 bg-white/20 rounded-full items-center justify-center"
            activeOpacity={0.7}
          >
            <Ionicons name="menu-outline" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Welcome Message */}
        <View className="mt-4">
          <Text className="text-white/90 text-lg font-semibold text-center">
            {t("serviceScreen.welcome") || "Choose a service to get started"}
          </Text>
          <Text className="text-white/70 text-center mt-1 text-sm">
            {t("serviceScreen.subtitle") || "All your financial needs in one place"}
          </Text>
        </View>
      </Animated.View>

      {/* Services Grid */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim }
          ]
        }}
        className="flex-1 bg-gray-50"
      >
        <FlatList
          key={`grid-${numColumns}`}
         data={filteredServices}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          numColumns={numColumns}
          contentContainerStyle={{ 
            padding: spacing,
            paddingTop: 30,
            paddingBottom: 30
          }}
          showsVerticalScrollIndicator={false}
        />
      </Animated.View>

      {/* Bottom Info */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim }
          ]
        }}
        className="bg-white py-4 px-6 border-t border-gray-100"
      >
        <View className="flex-row items-center justify-center">
          <MaterialIcons name="security" size={16} color="#7ddd7d" />
          <Text className="text-gray-600 text-sm ml-2 text-center">
          {t('disclaimer')}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
};

export default ServiceScreen;