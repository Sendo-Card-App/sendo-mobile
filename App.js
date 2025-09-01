import "./global.css";
import { ThemeProvider } from './src/constants/ThemeContext';
import React, { useEffect, useState } from "react";
import { Colors } from './src/constants/colors'; // Adjust the path as needed
import { useNavigation, useIsFocused  } from "@react-navigation/native";

import { StyleSheet, View, Text, TouchableOpacity,Platform,Dimensions,ActivityIndicator  } from "react-native";
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
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons, AntDesign,FontAwesome,FontAwesome5   } from "@expo/vector-icons";

import * as Notifications from "expo-notifications";
import { registerForPushNotificationsAsync } from "./src/services/notificationService";
import app from "./src/configs/firebaseConfig";
 
import { useGetUserProfileQuery } from "./src/services/Auth/authAPI";
import CustomTabBar from './src/components/CustomTabBar';
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

const headerHeight = Platform.select({
  ios: 60,
  android: 56, // Standard Android header height
});
const screenWidth = Dimensions.get('window').width;

// Tab Navigator
function MainTabs() {
  const { t } = useTranslation();
  const navigation = useNavigation();
 const { data: userProfile, isLoading: isProfileLoading, refetch } = useGetUserProfileQuery(
  undefined, 
  {
    pollingInterval: 1000, // rafraîchit toutes les 1000ms = 1s
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
      <Tab.Screen
        name="BeneficiaryTab"
        component={BeneficiaryScreen}
        options={{
          title: '',
          unmountOnBlur: true,
        }}
      />
      <Tab.Screen 
        name="ManageVirtualCardTab" 
        component={ManageVirtualCardWrapper} 
        options={{ 
          title: t('tabs.cards'),
          unmountOnBlur: true 
        }}
      />
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
  const { data: userProfile, isLoading: isProfileLoading } = useGetUserProfileQuery();
  const navigation = useNavigation();

  useEffect(() => {
    if (!isProfileLoading) {
      const virtualCard = userProfile?.data?.virtualCard;
      const isCardMissingOrEmpty =
        !virtualCard || (typeof virtualCard === 'object' && Object.keys(virtualCard).length === 0);
      const status = virtualCard?.status;

      if (isCardMissingOrEmpty || (status !== 'ACTIVE' && status !== 'PRE_ACTIVE')) {
        navigation.navigate('OnboardingCard');
      }
    }
  }, [userProfile, isProfileLoading, navigation]);

  // If checks pass, render the actual ManageVirtualCard component
  return <ManageVirtualCard />;
}



// Stack Navigator for auth screens
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="SignIn" component={SignIn} />
      <Stack.Screen name="PinCode" component={PinCode} />
      <Stack.Screen name="LogIn" component={LogIn} />
      <Stack.Screen name="Signup" component={Signup} />
      <Stack.Screen name="GuestLogin" component={GuestLogin} />
      <Stack.Screen name="OtpVerification" component={OtpVerification} />
      <Stack.Screen name="ForgetPassword" component={ForgetPassword} />
      <Stack.Screen name="ResetPassword" component={ResetPassword} />
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
            height: Platform.select({ ios: 60, android: 80 }), 
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
                : <AntDesign name="arrowleft" size={20} color={Colors.text} />}
            </TouchableOpacity>
          ),
        })}
      >
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen 
        name="Account" 
        component={Account} 
        options={{ headerTitle: t('screens.account') }} 
      />
      <Stack.Screen 
        name="NiuRequest" 
        component={NiuRequest} 
        options={{ headerTitle: t('screens.niuRequest') }} 
      />
      <Stack.Screen name="BeneficiaryScreen" component={BeneficiaryScreen} options={{ headerShown: false }} />
      <Stack.Screen name="BeneficiarySelection" component={BeneficiarySelection} options={{ headerShown: false }} />
      <Stack.Screen 
        name="AboutUs" 
        component={AboutUs} 
        options={{ headerTitle: t('screens.aboutUs') }} 
      />
      <Stack.Screen 
        name="ChangePassword" 
        component={ChangePassword} 
        options={{ headerTitle: t('screens.changePassword') }} 
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
        options={{ headerTitle: t('screens.selectMethod') }} 
      />
      <Stack.Screen name="BankDepositRecharge" component={BankDepositRecharge} options={{ headerTitle: t('screens.bankDeposit') }}/>
      <Stack.Screen name="PaymentSimulator" component={PaymentSimulator} options={{ headerTitle: t('screens.paymentSimulator') }} />
      <Stack.Screen name="MethodType" component={MethodType} options={{ headerTitle: t('screens.selectMethod') }} />
      <Stack.Screen name="WalletTransfer" component={WalletTransfer} options={{ headerTitle: t('screens.walletTransfer') }} />
      <Stack.Screen name="AddContact" component={AddContact} options={{ headerTitle: t('screens.addContact') }} />
      <Stack.Screen name="AddFavorite" component={AddFavorite} options={{ headerTitle: t('screens.addFavorite') }} />
      <Stack.Screen name="WalletRecharge" component={WalletRecharge} options={{ headerShown: false }} />
      <Stack.Screen name="WalletWithdrawal" component={WalletWithdrawal} options={{ headerShown: false }} />
      <Stack.Screen name="WalletConfirm" component={WalletConfirm} options={{ headerShown: false }} />
      <Stack.Screen name="WalletOk" component={WalletOk} options={{ headerShown: false }} />
       <Stack.Screen name="ServiceScreen" component={ServiceScreen} options={{ headerShown: false }} />
       <Stack.Screen name="OnboardingCard" component={OnboardingCard} options={{ headerShown: false }} />
      <Stack.Screen name="Confirme" component={Confirme} options={{ headerShown: false }} />
      <Stack.Screen name="TransactionHistory" component={TransactionHistory} options={{ headerShown: false }} />
      <Stack.Screen name="Success" component={Success} options={{ headerShown: false }} />
      <Stack.Screen name="Support" component={Support} options={{ headerTitle: t('screens.support') }}/>
      <Stack.Screen name="ChatScreen" component={ChatScreen} options={{ headerTitle: t('screens.chat') }} />
      <Stack.Screen name="Settings" component={Settings} options={{ headerTitle: t('screens.setting') }}/>
      <Stack.Screen name="Payment" component={Payment} options={{ headerTitle: t('screens.payment') }} />
      <Stack.Screen name="History" component={History} options={{ headerTitle: t('screens.history') }} />
      <Stack.Screen name="Receipt" component={Receipt} options={{ headerTitle: t('screens.receipt') }}/>
      <Stack.Screen name="NotificationComponent" component={NotificationComponent} options={{ headerTitle: t('screens.notification') }} />
      <Stack.Screen name="CreateVirtualCard" component={CreateVirtualCard}options={{ headerTitle: t('screens.createCard') }} />
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
      <Stack.Screen name="DetailScreen" component={DetailScreen } options={{ headerShown: false }} />
      <Stack.Screen name="DemandDetailScreen" component={DemandDetailScreen } options={{ headerShown: false }} />
      
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




      
    </Stack.Navigator>
     </SafeAreaProvider>
  );
}

// Root Navigator to switch between Auth and Main stacks
function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Auth" component={AuthStack} /> 
      <Stack.Screen name="Main" component={MainStack} />
    </Stack.Navigator>
  );
}

// Drawer Navigator
function DrawerNavigator() {
  return (
    <>
      <Drawer.Navigator drawerContent={(props) => <DrawerComponent {...props} />}>
        <Drawer.Screen 
          name="MainStack" 
          component={RootNavigator} 
          options={{ headerShown: false }} 
        />
      </Drawer.Navigator>
    </>
  );
}

export default function App() {
  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      console.log("Expo Push Token:", token);
    });
  }, []);

  return (
    <Provider store={store}>
      <NetworkProvider>
        <ThemeProvider>
          <>
            <NavigationContainer>
              <DrawerNavigator />
            </NavigationContainer>
            <Toast /> 
          </>
        </ThemeProvider>
      </NetworkProvider>
    </Provider>
  );
}


