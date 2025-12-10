import "./global.css";
import { ThemeProvider } from './src/constants/ThemeContext';
import React, { useEffect, useState,useRef } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";
import { Colors } from './src/constants/colors'; // Adjust the path as needed
import { useNavigation, useIsFocused  } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';



import { StyleSheet, View, Text, TouchableOpacity,Platform,Dimensions,ActivityIndicator, StatusBar   } from "react-native";
import { Provider } from "react-redux";
import { store } from "./src/store/store";
import Toast from "react-native-toast-message";
import { useTranslation } from 'react-i18next'; 
import './i18n';
import NetworkProvider from './src/services/NetworkProvider';
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";;
import { Ionicons, AntDesign,FontAwesome,FontAwesome5   } from "@expo/vector-icons";

import * as Notifications from "expo-notifications";
import { registerForPushNotificationsAsync } from "./src/services/notificationService";
 
import { useGetUserProfileQuery } from "./src/services/Auth/authAPI";
import CustomTabBar from './src/components/CustomTabBar';
import { getData } from "./src/services/storage";

// Import AppStateProvider first
import { AppStateProvider, useAppState } from './src/context/AppStateContext';



// Screens & Components
import Home from "./src/screens/Home/Home";
import ServiceScreen from "./src/screens/Home/ServiceScreen";
import WelcomeScreen from "./src/screens/Auth/WelcomeScreen";
import PinCode from "./src/screens/Auth/PinCode";
import AddBeneficiary from "./src/screens/Solde/AddBeneficiary";
import AddFavorite from "./src/screens/Favorite/AddFavorite";
import SelectMethod from "./src/screens/Wallet/SelectMethod";
import BankDepositRecharge from "./src/screens/Wallet/BankDepositRecharge";
import WalletRecharge from "./src/screens/Wallet/WalletRecharge ";
import WalletWithdrawal from "./src/screens/Wallet/WalletWithdrawal";
import WalletOk from "./src/screens/Wallet/WalletOk";
import WalletConfirm from "./src/screens/Wallet/WalletConfirm";
import AddContact from "./src/screens/Solde/AddContact";

import WalletTransfer from "./src/screens/Wallet/WalletTransfer";
import MethodType from "./src/screens/Wallet/MethodType";
import PaymentSimulator from "./src/screens/Solde/PaymentSimulator";
import LogIn from "./src/screens/Auth/LogIn";
import SignIn from "./src/screens/Auth/SignIn";
import Signup from "./src/screens/Auth/Signup";
import OtpVerification from "./src/screens/Auth/OtpVerification";
import GuestLogin from "./src/screens/Auth/GuestLogin";
import ResetPassword from "./src/screens/Auth/ResetPassword";
import ForgetPassword from "./src/screens/Auth/ForgetPassword";
import BeneficiarySelection from "./src/screens/Transfert/BeneficiarySelection";
import BeneficiaryDetails from "./src/screens/Transfert/BeneficiaryDetails";
import BankCard from "./src/screens/VirtualCard/BankCard";
import BankCard1 from "./src/screens/Transfert/BankCard1";
import Confirme from "./src/screens/Transfert/Confirme";
import Success from "./src/screens/Transfert/Success";
import NiuRequest from "./src/screens/Profile/NiuRequest";
import AboutUs from "./src/screens/Setting/AboutUs";
import BeneficiaryScreen from "./src/screens/Transfert/BeneficiaryScreen";
import Curency from "./src/screens/Transfert/Curency";
import PaymentMethod from "./src/screens/Transfert/PaymentMethod";
import BankTransferDetails from "./src/screens/Transfert/BankTransferDetails";
import TransferSummary from "./src/screens/Transfert/TransferSummary";
import Support from "./src/screens/Setting/Support";
import Payment from "./src/screens/VirtualCard/Payment";
import DrawerComponent from "./src/components/DrawerComponent";
import NotificationComponent from "./src/components/NotificationComponent"
import History from "./src/screens/Transfert/History";
import Receipt from "./src/screens/Transfert/Receipt";
import Account from "./src/screens/Profile/Account";
import Settings from "./src/screens/Setting/Settings";
import CreateVirtualCard from "./src/screens/VirtualCard/CreateVirtualCard";
import CardSettings from "./src/screens/VirtualCard/CardSettings";
import TransactionHistory from "./src/screens/VirtualCard/TransactionHistory";
import OnboardingCard from "./src/screens/VirtualCard/OnboardingCard";
import VerifyIdentity from "./src/screens/VirtualCard/VerifyIdentity";
import KYCValidation from "./src/screens/VirtualCard/KYCValidation";
import HistoryCard from "./src/screens/VirtualCard/HistoryCard"
import ManageVirtualCard from "./src/screens/VirtualCard/ManageVirtualCard";
import TransactionDetails from "./src/screens/VirtualCard/TransactionDetails";
import KycResume from "./src/screens/VirtualCard/KycResume";
import KycSelfie from "./src/screens/VirtualCard/KycSelfie";
import PersonalDetail from "./src/screens/VirtualCard/PersonalDetail";
import NIU from "./src/screens/VirtualCard/NIU";
import Addresse from "./src/screens/VirtualCard/Adresse";
import IdentityCard from "./src/screens/VirtualCard/IdentityCard";
import CardAction from "./src/screens/VirtualCard/CardAction";
import IdentityVerification from "./src/screens/VirtualCard/IdentityVerification";
import AddressSelect from "./src/screens/VirtualCard/AddressSelect";
import AddressConfirm from "./src/screens/VirtualCard/AddressConfirm";
import Address from "./src/screens/Transfert/Address";
import Camera from "./src/screens/VirtualCard/Camera";
import ChangePassword from "./src/screens/Setting/ChangePassword";
import ChatScreen from "./src/screens/Chat/ChatScreen";
import ChatLive from "./src/screens/Chat/ChatLive";

// Partager entre amis 
import WelcomeShare from "./src/screens/Share/WelcomeShare";
import Request from "./src/screens/Share/Request";
import CreateShare from "./src/screens/Share/CreateShare";
import SuccessSharing from "./src/screens/Share/SuccessSharing";
import DistributionMethod from "./src/screens/Share/DistributionMethod";
import Destinators from "./src/screens/Share/Destinators";
import ConfirmTransfer from "./src/screens/Share/ConfirmTransfer";
import AmountDistribution from "./src/screens/Share/AmountDistribution";
import Historique from "./src/screens/Share/Historique";
import BuySharing from "./src/screens/Share/BuySharing";
import DetailScreen from "./src/screens/Share/DetailScreen";
import DemandDetailScreen from "./src/screens/Share/DemandDetailScreen";

//DEMANDE DE FONDS
import WelcomeDemand from "./src/screens/Demand/WelcomeDemand";
import CreateRequest from "./src/screens/Demand/CreateRequest";
import AddRecipient from "./src/screens/Demand/AddRecipient";
import DemandList from "./src/screens/Demand/DemandList";
import ConfirmInformation from "./src/screens/Demand/ConfirmInformation";
import RequestPay from "./src/screens/Demand/RequestPay";
import SelectRecipients from "./src/screens/Demand/SelectRecipients";
import DetailsList from "./src/screens/Demand/DetailsList";
import EditFundField from "./src/screens/Demand/EditFundField";

 // CANADA KYC SCREENS
import CanadaKycSubmission from "./src/screens/CaKyc/CanadaKycSubmission";
import CanadaKycCamera from "./src/screens/CaKyc/CanadaKycCamera";

//MODULE TONTINE
import TontineList from "./src/screens/Tontine/TontineList";
import CreateTontine from "./src/screens/Tontine/CreateTontine";
import FrequencyScreen from "./src/screens/Tontine/FrequencyScreen";
import OrderSelection from "./src/screens/Tontine/OrderSelection";
import Method from "./src/screens/Tontine/Methode";
import MonthlyContribution from "./src/screens/Tontine/MonthlyContribution";
import Participant from "./src/screens/Tontine/Participant";
import PenaltyScreen from "./src/screens/Tontine/PenaltyScreen";
import AddPenalty from "./src/screens/Tontine/AddPenalty";
import Penalty from "./src/screens/Tontine/Penalty"
import TontineDetail from "./src/screens/Tontine/TontineDetail";
import MemberAddPenalty from "./src/screens/Tontine/MemberAddPenalty";
import MemberHistory from "./src/screens/Tontine/MemberHistory";
import MemberPenalty from "./src/screens/Tontine/MemberPenalty";
import Members from "./src/screens/Tontine/Members";
import Cotisations from "./src/screens/Tontine/Cotisations";  
import MemberDetail from "./src/screens/Tontine/MemberDetail";
import MemberContribution from "./src/screens/Tontine/MemberContribution";
import TontineSetting from "./src/screens/Tontine/TontineSetting";
import FundRelease from "./src/screens/Tontine/FundRelease";
import TermsAndConditions from "./src/screens/Tontine/TermsAndConditions";

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();
const navigationRef = React.createRef();

const AUTH_STATE_KEY = 'user_auth_state';

const headerHeight = Platform.select({
  ios: 60,
  android: 56, // Standard Android header height
});
const screenWidth = Dimensions.get('window').width;

// Tab Navigator
// Tab Navigator
  function MainTabs() {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const { data: userProfile, isLoading: isProfileLoading } = useGetUserProfileQuery(
      undefined,
      {
        pollingInterval: 1000, // refresh every 1s
      }
    );
    

    return (
      <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarButton: (props) => <TouchableOpacity {...props} />,
        })}
      >
        <Tab.Screen
          name="HomeTab"
          component={Home}
          options={{
            title: t('tabs.home'),
            unmountOnBlur: true,
          }}
        />

        <Tab.Screen
          name="TransferTab"
          component={History}
          options={{
            title: t('tabs.history'),
            unmountOnBlur: true,
          }}
        />

        {/*  Only show BeneficiaryTab if user is from Canada */}
        {(userProfile?.data?.user?.country === "Canada")  && (
            <Tab.Screen
              name="BeneficiaryTab"
              component={BeneficiaryScreen}
              options={{
                title: t('tabs.transfer'),
                unmountOnBlur: true,
              }}
            />
          )}

          {(userProfile?.data?.user?.country === "Cameroon")  && (
            <Tab.Screen
              name="ManageVirtualCardTab"
              component={ManageVirtualCardWrapper}
              options={{
                title: t('tabs.cards'),
                unmountOnBlur: true,
              }}
            />
          )}


        <Tab.Screen
          name="SettingsTab"
          component={Settings}
          options={{
            title: t('tabs.settings'),
            unmountOnBlur: true,
          }}
        />
      </Tab.Navigator>
    );
  }


function ManageVirtualCardWrapper() {
  const { t } = useTranslation();
  const { data: userProfile, isLoading: isProfileLoading, refetch } = useGetUserProfileQuery();

 useFocusEffect(
    useCallback(() => {
      refetch();
    }, [])
  );

  if (isProfileLoading) {
    return <ActivityIndicator size="large" color={Colors.primary} />;
  }

  const virtualCard = userProfile?.data?.user?.virtualCard;
  const isCardMissingOrEmpty =
    !virtualCard || (typeof virtualCard === 'object' && Object.keys(virtualCard).length === 0);
  const status = virtualCard?.status;

  // Render OnboardingCard conditionally instead of navigating
  if (isCardMissingOrEmpty || (status !== 'ACTIVE' && status !== 'PRE_ACTIVE' && status !== 'FROZEN' && status !== 'BLOCKED' && status !== 'SUPENDED')) {
    return <OnboardingCard />;
  }

  return <ManageVirtualCard />;

}



// Stack Navigator for auth screens
function AuthStack() {
  return (
    <Stack.Navigator 
      screenOptions={{ headerShown: false }}
      initialRouteName="Welcome" // Explicitly set initial route
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="SignIn" component={SignIn} />
      <Stack.Screen name="PinCode" component={PinCode} />
      <Stack.Screen name="LogIn" component={LogIn} />
      <Stack.Screen name="Signup" component={Signup} />
      <Stack.Screen name="GuestLogin" component={GuestLogin} />
      <Stack.Screen name="OtpVerification" component={OtpVerification} />
      <Stack.Screen name="ForgetPassword" component={ForgetPassword} />
      <Stack.Screen name="ResetPassword" component={ResetPassword} />
      <Stack.Screen name="ChatLive" component={ChatLive} />
    </Stack.Navigator>
  );
}

// Main Stack Navigator
function MainStack() {
  const { t } = useTranslation();
  return (
      <SafeAreaProvider>
      <Stack.Navigator
        screenOptions={({ navigation }) => ({
          headerShown: true,
          statusBarTranslucent: true,              // ← obligatoire
          headerStyle: {
            backgroundColor: Colors.primary,
            height: Platform.OS === "ios" ? 60 : 80,
            paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTitleAlign: 'center',
          headerTitleStyle: {
            fontSize: 18,
            fontWeight: 'bold',
            color: Colors.text,
          },
          headerBackTitleVisible: false,
          headerLeft: () => (
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 12 }}>
              {Platform.OS === 'ios'
                ? <Text style={{ fontSize: 24, color: Colors.text }}>{'< '}</Text>
                : <AntDesign name="left" size={20} color={Colors.text} />}
            </TouchableOpacity>
          ),
        })}
      >
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen 
        name="Account" 
        component={Account} 
       options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="NiuRequest" 
        component={NiuRequest} 
         options={{ headerShown: false }}
      />
      <Stack.Screen name="BeneficiaryScreen" component={BeneficiaryScreen} options={{ headerShown: false }} />
      <Stack.Screen name="BeneficiarySelection" component={BeneficiarySelection} options={{ headerShown: false }} />
      <Stack.Screen 
        name="AboutUs" 
        component={AboutUs} 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="ChangePassword" 
        component={ChangePassword} 
        options={{ headerShown: false }}
      />
      <Stack.Screen name="BeneficiaryDetails" component={BeneficiaryDetails} options={{ headerShown: false }} />
      <Stack.Screen name="PaymentMethod" component={PaymentMethod} options={{ headerShown: false }} />
      <Stack.Screen name="Curency" component={Curency} options={{ headerShown: false }} />
      <Stack.Screen name="BankCard" component={BankCard} options={{ headerShown: false }} />
      <Stack.Screen name="BankCard1" component={BankCard1} options={{ headerShown: false }} />
     <Stack.Screen 
        name="AddBeneficiary" 
        component={AddBeneficiary} 
        options={{ headerTitle: t('screens.addBeneficiary') }} 
      />
      <Stack.Screen 
        name="SelectMethod" 
        component={SelectMethod} 
       options={{ headerShown: false }}
      />
      <Stack.Screen name="BankDepositRecharge" component={BankDepositRecharge} options={{ headerShown: false }} />
      <Stack.Screen name="PaymentSimulator" component={PaymentSimulator}options={{ headerShown: false }} />
      <Stack.Screen name="MethodType" component={MethodType} options={{ headerShown: false }} />
      <Stack.Screen name="WalletTransfer" component={WalletTransfer} options={{ headerShown: false }} />
      <Stack.Screen name="AddContact" component={AddContact} options={{ headerShown: false }} />
      <Stack.Screen name="AddFavorite" component={AddFavorite} options={{ headerShown: false }}/>
      <Stack.Screen name="WalletRecharge" component={WalletRecharge} options={{ headerShown: false }} />
      <Stack.Screen name="WalletWithdrawal" component={WalletWithdrawal} options={{ headerShown: false }} />
      <Stack.Screen name="WalletConfirm" component={WalletConfirm} options={{ headerShown: false }} />
      <Stack.Screen name="WalletOk" component={WalletOk} options={{ headerShown: false }} />
       <Stack.Screen name="ServiceScreen" component={ServiceScreen} options={{ headerShown: false }} />
       <Stack.Screen name="OnboardingCard" component={OnboardingCard} options={{ headerShown: false }} />
      <Stack.Screen name="Confirme" component={Confirme} options={{ headerShown: false }} />
      <Stack.Screen name="TransactionHistory" component={TransactionHistory} options={{ headerShown: false }} />
      <Stack.Screen name="Success" component={Success} options={{ headerShown: false }} />
      <Stack.Screen name="Support" component={Support}  options={{ headerShown: false }}/>
      <Stack.Screen name="ChatScreen" component={ChatScreen} options={{ headerShown: false }}/>
      <Stack.Screen name="Settings" component={Settings} options={{ headerShown: false }}/>
      <Stack.Screen name="Payment" component={Payment} options={{ headerTitle: t('screens.payment') }} />
      <Stack.Screen name="History" component={History} options={{ headerShown: false }} />
      <Stack.Screen name="Receipt" component={Receipt} options={{ headerShown: false }} />
      <Stack.Screen name="NotificationComponent" component={NotificationComponent} options={{ headerShown: false }} />
      <Stack.Screen name="CreateVirtualCard" component={CreateVirtualCard}  options={{ headerShown: false }} />
      <Stack.Screen name="VerifyIdentity" component={VerifyIdentity} options={{ headerShown: false }} />
      <Stack.Screen name="ManageVirtualCard" component={ManageVirtualCard} options={{ headerShown: false }} />
      <Stack.Screen name="TransactionDetails" component={TransactionDetails} options={{ headerShown: false }} />
      <Stack.Screen name="KycResume" component={KycResume} options={{ headerShown: false }} />
      <Stack.Screen name="KycSelfie" component={KycSelfie} options={{ headerShown: false }} />
       <Stack.Screen name="CardSettings" component={CardSettings} options={{ headerShown: false }} />
      <Stack.Screen name="PersonalDetail" component={PersonalDetail} options={{ headerShown: false }} />
      <Stack.Screen name="NIU" component={NIU} options={{ headerShown: false }} />
      <Stack.Screen name="Addresse" component={Addresse} options={{ headerShown: false }} />
      <Stack.Screen name="IdentityCard" component={IdentityCard} options={{ headerShown: false }} />
      <Stack.Screen name="IdentityVerification" component={IdentityVerification} options={{ headerShown: false }} />
      <Stack.Screen name="AddressSelect" component={AddressSelect} options={{ headerShown: false }} />
      <Stack.Screen name="AddressConfirm" component={AddressConfirm} options={{ headerShown: false }} />
       <Stack.Screen name="KYCValidation" component={KYCValidation} options={{ headerShown: false }} />
      <Stack.Screen name="Address" component={Address} options={{ headerShown: false }} />
      <Stack.Screen name="Camera" component={Camera} options={{ headerShown: false }} />

      <Stack.Screen name="WelcomeShare" component={WelcomeShare} options={{ headerShown: false }} />
      <Stack.Screen name="Destinators" component={Destinators} options={{ headerShown: false }} />
      <Stack.Screen name="Request" component={Request} options={{ headerShown: false }} />
      <Stack.Screen name="CardAction" component={CardAction} options={{headerShown:false}} />
      <Stack.Screen name="SuccessSharing" component={SuccessSharing} options={{ headerShown: false }} />
      <Stack.Screen name="CreateShare" component={CreateShare} options={{ headerShown: false }} />
      <Stack.Screen name="DistributionMethod" component={DistributionMethod} options={{ headerShown: false }} />
      <Stack.Screen name="AmountDistribution" component={AmountDistribution} options={{ headerShown: false }} />
      <Stack.Screen name="ConfirmTransfer" component={ConfirmTransfer} options={{ headerShown: false }} />
      <Stack.Screen name="Historique" component={Historique} options={{ headerShown: false }} />
      <Stack.Screen name="BuySharing" component={BuySharing} options={{ headerShown: false }} />
      <Stack.Screen name="DetailScreen" component={DetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="DemandDetailScreen" component={DemandDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="HistoryCard" component={HistoryCard} options={{ headerShown: false }} />
      
      <Stack.Screen name="AddRecipient" component={AddRecipient } options={{ headerShown: false }} />
      <Stack.Screen name="CreateRequest" component={CreateRequest } options={{ headerShown: false }} />
      <Stack.Screen name="DetailsList" component={DetailsList } options={{ headerShown: false }} />
      <Stack.Screen name="RequestPay" component={RequestPay } options={{ headerShown: false }} />
      <Stack.Screen name="SelectRecipients" component={SelectRecipients } options={{ headerShown: false }} />
      <Stack.Screen name="WelcomeDemand" component={WelcomeDemand } options={{ headerShown: false }} />
      <Stack.Screen name="DemandList" component={DemandList } options={{ headerShown: false }} />
      <Stack.Screen name="ConfirmInformation" component={ConfirmInformation } options={{ headerShown: false }} />
      <Stack.Screen name="EditFundField" component={EditFundField } options={{ headerShown: false }} />

      <Stack.Screen name="TontineList" component={TontineList } options={{ headerShown: false }} />
      <Stack.Screen name="CreateTontine" component={CreateTontine } options={{ headerShown: false }} />
      <Stack.Screen name="AddPenalty" component={AddPenalty } options={{ headerShown: false }} />
      <Stack.Screen name="OrderSelection" component={OrderSelection } options={{ headerShown: false }} />
      <Stack.Screen name="Participant" component={Participant } options={{ headerShown: false }} />
      <Stack.Screen name="PenaltyScreen" component={PenaltyScreen } options={{ headerShown: false }} />
      <Stack.Screen name="MonthlyContribution" component={MonthlyContribution } options={{ headerShown: false }} />
      <Stack.Screen name="FrequencyScreen" component={FrequencyScreen } options={{ headerShown: false }} />
      <Stack.Screen name="Method" component={Method } options={{ headerShown: false }} />
      <Stack.Screen name="Penalty" component={Penalty } options={{ headerShown: false }} />
      <Stack.Screen name="Cotisations" component={Cotisations } options={{ headerShown: false }} />
      <Stack.Screen name="TontineDetail" component={TontineDetail } options={{ headerShown: false }} />
      <Stack.Screen name="Members" component={Members } options={{ headerShown: false }} />
      <Stack.Screen name="MemberPenalty" component={MemberPenalty } options={{ headerShown: false }} />
      <Stack.Screen name="MemberHistory" component={MemberHistory } options={{ headerShown: false }} />
      <Stack.Screen name="MemberAddPenalty" component={MemberAddPenalty } options={{ headerShown: false }} />
      <Stack.Screen name="MemberDetail" component={MemberDetail } options={{ headerShown: false }} />
      <Stack.Screen name="MemberContribution" component={MemberContribution } options={{ headerShown: false }} />
      <Stack.Screen name="TontineSetting" component={TontineSetting } options={{ headerShown: false }} />
      <Stack.Screen name="FundRelease" component={FundRelease } options={{ headerShown: false }} />
       <Stack.Screen name="TermsAndConditions" component={TermsAndConditions} options={{ headerShown: false }} />
      <Stack.Screen name="CanadaKycSubmission" component={CanadaKycSubmission} options={{ headerShown: false }} />
      <Stack.Screen name="CanadaKycCamera" component={CanadaKycCamera} options={{ headerShown: false }} />
      <Stack.Screen name="BankTransferDetails" component={BankTransferDetails} options={{ headerShown: false }} />
      <Stack.Screen name="TransferSummary" component={TransferSummary} options={{ headerShown: false }} />
      






      
    </Stack.Navigator>
     </SafeAreaProvider>
  );
}

// Root Navigator to switch between Auth and Main stacks
function RootNavigator() {
  return (
    <Stack.Navigator 
      screenOptions={{ headerShown: false }}
      initialRouteName="Auth" // Set Auth as initial route
    >
      <Stack.Screen name="Auth" component={AuthStack} /> 
      <Stack.Screen name="Main" component={MainStack} />
    </Stack.Navigator>
  );
}

// Drawer Navigator
  function DrawerNavigator() {
    return (
      <Drawer.Navigator 
        drawerContent={(props) => <DrawerComponent {...props} />}
        screenOptions={{ headerShown: false }}
      >
        <Drawer.Screen 
          name="RootNavigator" 
          component={RootNavigator} 
          options={{ headerShown: false }} 
        />
      </Drawer.Navigator>
    );
  }

 function SplashRedirector() {
  const navigation = useNavigation();

  useEffect(() => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Auth', params: { screen: 'Welcome' } }],
    });
  }, [navigation]);
}

// Create a wrapper component that uses the hook
function AppContent() {
  const appState = useRef(AppState.currentState);
  const [showSplash, setShowSplash] = useState(false);
  const [isUserFullyAuthenticated, setIsUserFullyAuthenticated] = useState(false);
  const { isPickingDocument } = useAppState();

  useEffect(() => {
    (async () => {
      await registerForPushNotificationsAsync();
      
      // Vérifier si l'utilisateur est COMPLÈTEMENT authentifié (a passé le PinCode)
      const checkFullAuthStatus = async () => {
        try {
          const authData = await getData('@authData');
            const pinVerified = await AsyncStorage.getItem('pinVerified');
          // L'utilisateur est "complètement authentifié" seulement s'il a un token ET a passé le PinCode
           const isFullyAuthenticated = !!(authData?.accessToken && pinVerified === 'true');
          setIsUserFullyAuthenticated(isFullyAuthenticated);
          console.log('User fully authenticated:', isFullyAuthenticated);
        } catch (error) {
          console.log('Error checking auth status:', error);
        }
      };
      
      await checkFullAuthStatus();
    })();

    const handleAppStateChange = (nextAppState) => {
      console.log('App state changed:', appState.current, '->', nextAppState);
      console.log('User fully authenticated:', isUserFullyAuthenticated);
      
      // 🚫 Ignorer si document picker/autofill actif
      if (isPickingDocument) {
        console.log('Ignoring app state change - document picker/autofill active');
        appState.current = nextAppState;
        return;
      }

      // 🔐 CRITIQUE : SEULEMENT relancer l'app si l'utilisateur est COMPLÈTEMENT AUTHENTIFIÉ
      if (isUserFullyAuthenticated && appState.current === 'background' && nextAppState === 'active') {
        console.log('Fully authenticated user returned - showing security splash');
        setShowSplash(true);
        setTimeout(() => setShowSplash(false), 10);
      }
      
      // ❌ IMPORTANT : NE RIEN FAIRE pour les utilisateurs en cours de connexion/inscription/OTP
      if (!isUserFullyAuthenticated && appState.current === 'background' && nextAppState === 'active') {
        console.log('User in auth process - preserving current screen (OTP, login, etc.)');
        // Ne rien faire - laisser l'écran actuel intact
      }
      
      // Splash normal au tout premier démarrage
      if (appState.current === 'unknown' || appState.current === 'extension') {
        console.log('Fresh app start - showing initial splash');
        setShowSplash(true);
        setTimeout(() => setShowSplash(false), 10);
      }
      
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isPickingDocument, isUserFullyAuthenticated]);

  return (
    <>
      <NavigationContainer ref={navigationRef}>
        {showSplash ? (
          <SplashRedirector />
        ) : (
          <DrawerNavigator />
        )}
      </NavigationContainer>
      <Toast /> 
    </>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <NetworkProvider>
        <ThemeProvider>
          <AppStateProvider>
            <AppContent />
          </AppStateProvider>
        </ThemeProvider>
      </NetworkProvider>
    </Provider>
  );
}


