import 'react-native-get-random-values';
import React, { useState, useEffect } from "react";
import { AntDesign } from "@expo/vector-icons";
import Icon from 'react-native-vector-icons/Ionicons';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Modal,
  FlatList,
  ActivityIndicator,
  StyleSheet
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import KeyboardAvoidinWrapper from "../../components/KeyboardAvoidinWrapper";
import OtpVerification from "./OtpVerification";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import {
  useResendOtpMutation,
  useVerifyOtpMutation
} from "../../services/Auth/authAPI";
import { loginSuccess } from "../../features/Auth/authSlice";
import Loader from "../../components/Loader";
import { storeData } from "../../services/storage"; // Import local storage helper
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

const Log = () => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const [verifyOtp] = useVerifyOtpMutation();
  const [resendOtp] = useResendOtpMutation();

  const [phone, setPhone] = useState("");
  const [isModalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  const [countries, setCountries] = useState([]);
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState({
    name: 'Cameroon',
    code: '+237',
    flag: 'https://flagcdn.com/w40/cm.png'
  });

  const fetchCountries = async () => {
    try {
      const res = await fetch('https://restcountries.com/v3.1/all');
      const data = await res.json();
      const sorted = data.map(c => ({
        name: c.name.common,
        code: `+${c.idd.root?.replace('+', '') || ''}${c.idd.suffixes ? c.idd.suffixes[0] : ''}`,
        flag: c.flags?.png
      })).filter(c => c.code).sort((a, b) => a.name.localeCompare(b.name));
      setCountries(sorted);
    } catch (e) {
      Toast.show({ type: 'error', text1: 'Failed to load countries' });
    }
  };

  useEffect(() => {
    fetchCountries();
  }, []);

  const storeAuthData = async (authData) => {
    try {
      await AsyncStorage.setItem('@authData', JSON.stringify(authData));
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error saving login data' });
    }
  };

  const handleNext = async () => {
    if (!phone) {
      Toast.show({ type: 'error', text1: 'Enter a valid phone number' });
      return;
    }

    try {
      setIsLoading(true);
      await resendOtp(`${selectedCountry.code}${phone}`).unwrap();
      setModalVisible(true);
      Toast.show({ type: 'success', text1: 'OTP sent successfully' });
    } catch (err) {
      Toast.show({ type: 'error', text1: err.data?.message || 'Failed to send OTP' });
    } finally {
      setIsLoading(false);
    }
  };

const handleVerifyOtp = async (code) => {
  try {
    setIsLoading(true);

    const response = await verifyOtp({ 
      phone: `${selectedCountry.code}${phone}`, 
      code 
    });

    const status = response?.status;

    if (status === 200) {
      const authData = {
        user: response.data.user,
        accessToken: response.data.accessToken,
        isGuest: false
      };

      // Store data in local storage
      await storeData('@authData', authData);

      // Update Redux store
      dispatch(loginSuccess(authData));

      // Hide OTP modal
      setModalVisible(false);

      // Show success message
      Toast.show({ type: 'success', text1: 'Login successful' });

      // Navigate to main screen
      navigation.navigate("Main");
    } else if (status === 404) {
      Toast.show({
        type: 'error',
        text1: 'Invalid or Expired Code',
        text2: 'The OTP code is incorrect or expired. Please request a new one.',
      });
    } else if (status === 500) {
      Toast.show({
        type: 'error',
        text1: 'Server Error',
        text2: 'An error occurred while verifying OTP. Please try again.',
      });
    } else {
      Toast.show({
        type: 'error',
        text1: response?.data?.message || 'OTP verification failed',
      });
    }
  } catch (err) {
    Toast.show({
      type: 'error',
      text1: err?.data?.message || 'Something went wrong during OTP verification.',
    });
  } finally {
    setIsLoading(false);
  }
};


  const handleResendOtp = async () => {
    try {
      setIsLoading(true);
      await resendOtp(`${selectedCountry.code}${phone}`).unwrap();
      Toast.show({ type: 'success', text1: 'OTP resent successfully' });
    } catch (err) {
      Toast.show({ type: 'error', text1: err.data?.message || 'Resend failed' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestLogin = () => {
    navigation.navigate("GuestLogin", { isGuest: true });
  };

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    setLanguageModalVisible(false);
    Toast.show({ type: 'success', text1: `Language changed to ${lang}` });
  };

  const renderCountry = ({ item }) => (
    <TouchableOpacity
      onPress={() => {
        setSelectedCountry(item);
        setCountryModalVisible(false);
      }}
      style={styles.countryItem}
    >
      <Image source={{ uri: item.flag }} style={styles.flag} />
      <Text>{`${item.name} (${item.code})`}</Text>
    </TouchableOpacity>
  );

  return (
    <>
      <KeyboardAvoidinWrapper>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="light-content" backgroundColor="#181e25" />

          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <AntDesign name="arrowleft" size={24} color="white" />
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setLanguageModalVisible(true)}>
              <Icon name="language" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Language Modal */}
          <Modal animationType="slide" transparent={true} visible={languageModalVisible}>
            <View style={styles.modalContainer}>
              <View style={styles.languageModal}>
                <Text style={styles.languageTitle}>Select your language</Text>
                <TouchableOpacity onPress={() => changeLanguage("en")}><Text style={styles.languageOption}>English</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => changeLanguage("fr")}><Text style={styles.languageOption}>Français</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => setLanguageModalVisible(false)}><Text style={styles.languageClose}>Close</Text></TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Logo */}
          <Image source={require("../../images/LogoSendo.png")} style={styles.logo} />

          <View style={styles.form}>
            <Text style={styles.title}>{t("log.title")}</Text>

            <TouchableOpacity style={styles.countrySelector} onPress={() => setCountryModalVisible(true)}>
              <Image source={{ uri: selectedCountry.flag }} style={styles.flag} />
              <Text style={styles.countryCode}>{selectedCountry.code}</Text>
            </TouchableOpacity>

            <TextInput
              placeholder={t("signup.phone")}
              onChangeText={setPhone}
              value={phone}
              keyboardType="phone-pad"
              style={styles.phoneInput}
              maxLength={10}
            />

            <TouchableOpacity disabled={isLoading} onPress={handleNext} style={styles.nextButton}>
              {isLoading ? <Loader /> : <Text style={styles.nextText}>{t("log.next")}</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('ForgetPassword')}>
              <Text style={styles.forgotText}>{t("log.forgetPassword")}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.otherText}>{t("signIn.dontHaveAccount")}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.signupBtn}>{t("signIn.signUp")}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleGuestLogin}>
            <Text style={styles.guestBtn}>{t("signIn.guestUser")}</Text>
          </TouchableOpacity>

          <Modal visible={countryModalVisible} animationType="slide">
            <SafeAreaView style={styles.countryModal}>
              {countries.length === 0 ? (
                <ActivityIndicator style={styles.loader} />
              ) : (
                <FlatList
                  data={countries}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={renderCountry}
                  contentContainerStyle={styles.countryList}
                />
              )}
            </SafeAreaView>
          </Modal>

          <Modal animationType="slide" transparent={true} visible={isModalVisible}>
            <OtpVerification
              phone={`${selectedCountry.code}${phone}`}
              onVerify={handleVerifyOtp}
              onResend={handleResendOtp}
              onClose={() => setModalVisible(false)}
            />
          </Modal>
        </SafeAreaView>
      </KeyboardAvoidinWrapper>
      <Toast />
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#181e25",
    alignItems: 'center',
    justifyContent: 'center'
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20
  },
  header: {
    position: 'absolute',
    top: 50,
    width: '100%',
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  languageModal: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20
  },
  languageTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  languageOption: { fontSize: 16, textAlign: 'center', marginVertical: 5 },
  languageClose: { textAlign: 'center', color: 'red', marginTop: 15 },
  form: {
    width: '80%',
    backgroundColor: '#f1f1f1',
    borderRadius: 30,
    padding: 20,
    alignItems: 'center'
  },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginBottom: 10
  },
  flag: { width: 30, height: 20, marginRight: 10 },
  countryCode: { fontWeight: 'bold' , borderRadius: 30,
    paddingVertical: 3,
    paddingHorizontal: 10,
    textAlign: 'center',
    fontSize: 16,
    // Shadow for iOS
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 10,
    shadowRadius: 1,},
  phoneInput: {
    backgroundColor: '#fff',
    width: '100%',
    borderRadius: 30,
    textAlign: 'center',
    paddingVertical: 12,
    marginBottom: 20,
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 20,
    textAlign: 'center',
    fontSize: 16,
    // Shadow for iOS
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 10,
    shadowRadius: 1,
  },
  nextButton: {
    backgroundColor: '#7ddd7d',
    borderRadius: 30,
    width: '100%',
    padding: 15,
    alignItems: 'center',
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 20,
    textAlign: 'center',
    fontSize: 16,
    // Shadow for iOS
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 10,
    shadowRadius: 1,
  },
  nextText: { fontWeight: 'bold', fontSize: 16 },
  forgotText: { color: 'black', marginTop: 10, alignSelf: 'flex-end' },
  otherText: { color: '#fff', marginTop: 20 },
  signupBtn: {
    borderColor: '#7ddd7d',
    borderWidth: 2,
    borderRadius: 30,
    color: '#7ddd7d',
    paddingVertical: 10,
    paddingHorizontal: 30,
    marginTop: 10,
    textAlign: 'center'
  },
  guestBtn: {
    color: '#7ddd7d',
    textDecorationLine: 'underline',
    marginTop: 10,
    textAlign: 'center'
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12
  },
  countryModal: {
    flex: 1
  },
  loader: {
    marginTop: 100
  },
  countryList: {
    padding: 20
  }
});

export default Log;
