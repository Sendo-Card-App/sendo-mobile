import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import Ionicons from "@expo/vector-icons/Ionicons";
import { MaterialIcons } from "@expo/vector-icons";
import HomeImage from "../../images/HomeImage2.png";
import button from "../../images/ButtomLogo.png";
import Cameroon from "../../images/Cameroon.png";
import Canada from "../../images/Canada.png";
import { StatusBar } from "expo-status-bar";
import { useNavigation } from "@react-navigation/native";
import { useGetConfigQuery } from '../../services/Config/configApi';
import { useTranslation } from 'react-i18next';
import { useGetUserProfileQuery } from "../../services/Auth/authAPI";

const BeneficiaryScreen = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { 
    data: configData, 
    isLoading: isConfigLoading,
    error: configError
  } = useGetConfigQuery();
    const [showVerifiedMessage, setShowVerifiedMessage] = useState(false);
   const { data: userProfile, isLoading: isProfileLoading } = useGetUserProfileQuery();
  
  const getConfigValue = (name) => {
    const configItem = configData?.data?.find(item => item.name === name);
    return configItem ? configItem.value : null;
  };

  const CAD_REAL_TIME_VALUE = getConfigValue('CAD_REAL_TIME_VALUE');
   

    useEffect(() => {
      if (userProfile?.data?.isVerifiedKYC) {
        setShowVerifiedMessage(false);
        const timer = setTimeout(() => {
          setShowVerifiedMessage(false);
        }, 10000); // 20 seconds
        return () => clearTimeout(timer);
      }
    }, [userProfile]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0D0D0D" }}>
      <StatusBar backgroundColor="#0D0D0D" />
      <View style={{ padding: 20, flex: 1 }}>
        {/* Header */}
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 20,
        }}>
          <TouchableOpacity>
            <AntDesign name="arrowleft" size={24} color="white" onPress={() => navigation.goBack()} />
          </TouchableOpacity>

          <Image
            source={button}
            resizeMode="contain"
            style={{ width: 100, height: 80, marginLeft: 50 }}
          />
          <Image
            source={HomeImage}
            resizeMode="contain"
            style={{ width: 70, height: 70, marginTop: -15, marginLeft: 10 }}
          />
          <MaterialIcons
            name="menu"
            size={24}
            color="white"
            style={{ marginLeft: "auto" }}
            onPress={() => navigation.openDrawer()}
          />
        </View>
        {showVerifiedMessage && (
          <View className="bg-green-100 p-3 rounded-md mb-4">
            <Text className="text-green-800 text-center font-bold text-lg">
              {t('verifyIdentity.kycRequiredMessage')}
            </Text>
          </View>
        )}

        <Text style={{
          color: "white",
          fontSize: 30,
          marginBottom: 10,
          fontWeight: "bold",
        }}>
          {t('welcome')}
        </Text>
        <Text style={{ color: "white", fontSize: 16, marginBottom: 20 }}>
          {t('chooseCountry')}
        </Text>

        {/* Search Input */}
        <TextInput
          style={{
            height: 50,
            borderColor: "gray",
            borderWidth: 1,
            borderRadius: 8,
            paddingHorizontal: 10,
            color: "black",
            backgroundColor: "white",
          }}
          placeholder={t('searchPlaceholder')}
          placeholderTextColor="#aaa"
        />

        {/* Country List */}
        <ScrollView style={{ marginTop: 20 }}>
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 15,
            }}
            onPress={() => navigation.navigate("Curency", {
              countryName: "Cameroon",
              conversionRate: t('conversionRateCAD', { value: CAD_REAL_TIME_VALUE }),
              cadRealTimeValue: CAD_REAL_TIME_VALUE,
              flagImage: Cameroon
            })}
          >
            <Image
              source={Cameroon}
              resizeMode="contain"
              style={{ width: 50, height: 50 }}
            />
            <Text style={{ color: "white", marginLeft: 10 }}>{t('cameroon')}</Text>
            <Text style={{ color: "white", marginLeft: "auto" }}>
              {t('conversionRateCAD', { value: CAD_REAL_TIME_VALUE })}
            </Text>
          </TouchableOpacity>
          {/* <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 15,
            }}
            onPress={() => navigation.navigate("Curency", {
              countryName: "Canada",
              conversionRate: t('conversionRateXAF', { value: CAD_REAL_TIME_VALUE }),
              cadRealTimeValue: CAD_REAL_TIME_VALUE,
              flagImage: Canada
            })}
          >
            <Image
              source={Canada}
              resizeMode="contain"
              style={{ width: 50, height: 50 }}
            />
            <Text style={{ color: "white", marginLeft: 10 }}>{t('canada')}</Text>
            <Text style={{ color: "white", marginLeft: "auto" }}>
              {t('conversionRateXAF', { value: CAD_REAL_TIME_VALUE })}
            </Text>
          </TouchableOpacity> */}
        </ScrollView>
      </View>

      {/* Footer */}
      <View style={{ paddingVertical: 12, backgroundColor: '#0D0D0D' }}>
        <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
          <Ionicons name="shield-checkmark" size={18} color="orange" />
          <Text style={{ color: "white", fontSize: 12, marginLeft: 5 }}>
            {t('securityWarning')}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default BeneficiaryScreen;