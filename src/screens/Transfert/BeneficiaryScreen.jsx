import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  StyleSheet,
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
  } = useGetConfigQuery(undefined, {
    pollingInterval: 1000,
  });

  const [showVerifiedMessage, setShowVerifiedMessage] = useState(false);
  const { 
    data: userProfile, 
    isLoading: isProfileLoading 
  } = useGetUserProfileQuery(undefined, {
    pollingInterval: 1000,
  });

  
  const getConfigValue = (name) => {
    const configItem = configData?.data?.find(item => item.name === name);
    return configItem ? configItem.value : null;
  };

  const CAD_SENDO_VALUE = getConfigValue('CAD_SENDO_VALUE');
   
  useEffect(() => {
    if (userProfile?.data?.isVerifiedKYC) {
      setShowVerifiedMessage(false);
      const timer = setTimeout(() => {
        setShowVerifiedMessage(false);
      }, 10000); // 10 seconds
      return () => clearTimeout(timer);
    }
  }, [userProfile]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#F2F2F2" />
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <AntDesign name="arrowleft" size={24} color="black" />
          </TouchableOpacity>

          <Image
            source={button}
            resizeMode="contain"
            style={styles.logo}
          />
          <Image
            source={HomeImage}
            resizeMode="contain"
            style={styles.homeImage}
          />
          <MaterialIcons
            name="menu"
            size={24}
            color="black"
            style={styles.menuIcon}
            onPress={() => navigation.openDrawer()}
          />
        </View>
        
        {showVerifiedMessage && (
          <View style={styles.verifiedMessage}>
            <Text style={styles.verifiedMessageText}>
              {t('verifyIdentity.kycRequiredMessage')}
            </Text>
          </View>
        )}

        <Text style={styles.title}>{t('welcome')}</Text>
        <Text style={styles.subtitle}>{t('chooseCountry')}</Text>

        {/* Search Input */}
        <TextInput
          style={styles.searchInput}
          placeholder={t('searchPlaceholder')}
          placeholderTextColor="#aaa"
        />

        {/* Country List */}
        <ScrollView style={styles.countryList}>
          <TouchableOpacity
            style={styles.countryItem}
            onPress={() => navigation.navigate("Curency", {
              countryName: "Cameroon",
              conversionRate: t('conversionRateCAD', { value: CAD_SENDO_VALUE }),
              cadRealTimeValue: CAD_SENDO_VALUE,
              flagImage: Cameroon
            })}
          >
            <Image
              source={Cameroon}
              resizeMode="contain"
              style={styles.flag}
            />
            <Text style={styles.countryName}>{t('cameroon')}</Text>
            <Text style={styles.conversionRate}>
              {t('conversionRateCAD', { value: CAD_SENDO_VALUE })}
            </Text>
          </TouchableOpacity>
          
          {/* Uncomment if you want to include Canada */}
          {/* <TouchableOpacity
            style={styles.countryItem}
            onPress={() => navigation.navigate("Curency", {
              countryName: "Canada",
              conversionRate: t('conversionRateXAF', { value: CAD_SENDO_VALUE }),
              cadRealTimeValue: CAD_SENDO_VALUE,
              flagImage: Canada
            })}
          >
            <Image
              source={Canada}
              resizeMode="contain"
              style={styles.flag}
            />
            <Text style={styles.countryName}>{t('canada')}</Text>
            <Text style={styles.conversionRate}>
              {t('conversionRateXAF', { value: CAD_SENDO_VALUE })}
            </Text>
          </TouchableOpacity> */}
        </ScrollView>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <Ionicons name="shield-checkmark" size={18} color="#7ddd7d" />
          <Text style={styles.footerText}>
            {t('securityWarning')}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F2",
  },
  content: {
    padding: 20,
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    marginTop: 1,
  },
  logo: {
    width: 100,
    height: 80,
    marginLeft: 50
  },
  homeImage: {
    width: 70,
    height: 70,
    marginTop: -15,
    marginLeft: 10
  },
  menuIcon: {
    marginLeft: "auto"
  },
  verifiedMessage: {
    backgroundColor: "#e6f7e6",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#7ddd7d"
  },
  verifiedMessageText: {
    color: "#2e7d32",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16
  },
  title: {
    color: "black",
    fontSize: 30,
    marginBottom: 10,
    fontWeight: "bold",
  },
  subtitle: {
    color: "black",
    fontSize: 16,
    marginBottom: 20
  },
  searchInput: {
    height: 50,
    borderColor: "#7ddd7d",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    color: "black",
    backgroundColor: "white",
    fontSize: 16
  },
  countryList: {
    marginTop: 20,
    flex: 1
  },
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0"
  },
  flag: {
    width: 50,
    height: 50,
    borderRadius: 25
  },
  countryName: {
    color: "black",
    marginLeft: 15,
    fontSize: 16,
    fontWeight: "500"
  },
  conversionRate: {
    color: "#7ddd7d",
    marginLeft: "auto",
    fontWeight: "bold",
    fontSize: 14
  },
  footer: {
    paddingVertical: 12,
    backgroundColor: "#F2F2F2",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0"
  },
  footerContent: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center"
  },
  footerText: {
    color: "black",
    fontSize: 12,
    marginLeft: 5
  }
});

export default BeneficiaryScreen;