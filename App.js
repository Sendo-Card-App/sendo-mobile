import "./global.css";
import { ThemeProvider } from './src/constants/ThemeContext';
import React, { useEffect } from "react";
import { Colors } from './src/constants/colors'; // Adjust the path as needed

import { StyleSheet, View, Text, TouchableOpacity,Platform,Dimensions  } from "react-native";
import { Provider } from "react-redux";
import { store } from "./src/Store/store";
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

// Screens & Components
import Home from "./src/Screens/Home/Home";
import ServiceScreen from "./src/Screens/Home/ServiceScreen";
import WelcomeScreen from "./src/Screens/Auth/WelcomeScreen";
import PinCode from "./src/Screens/Auth/PinCode";
import AddBeneficiary from "./src/Screens/Solde/AddBeneficiary";
import AddFavorite from "./src/Screens/Favorite/AddFavorite";
import SelectMethod from "./src/Screens/Wallet/SelectMethod";
import BankDepositRecharge from "./src/Screens/Wallet/BankDepositRecharge";
import WalletRecharge from "./src/Screens/Wallet/WalletRecharge ";
import WalletWithdrawal from "./src/Screens/Wallet/WalletWithdrawal";
import WalletOk from "./src/Screens/Wallet/WalletOk";
import WalletConfirm from "./src/Screens/Wallet/WalletConfirm";
import AddContact from "./src/Screens/Solde/AddContact";

import WalletTransfer from "./src/Screens/Wallet/WalletTransfer";
import MethodType from "./src/Screens/Wallet/MethodType";
import PaymentSimulator from "./src/Screens/Solde/PaymentSimulator";
import LogIn from "./src/Screens/Auth/LogIn";
import SignIn from "./src/Screens/Auth/SignIn";
import Signup from "./src/Screens/Auth/Signup";
import OtpVerification from "./src/Screens/Auth/OtpVerification";
import GuestLogin from "./src/Screens/Auth/GuestLogin";
import ResetPassword from "./src/Screens/Auth/ResetPassword";
import ForgetPassword from "./src/Screens/Auth/ForgetPassword";
import BeneficiarySelection from "./src/Screens/Transfert/BeneficiarySelection";
import BeneficiaryDetails from "./src/Screens/Transfert/BeneficiaryDetails";
import BankCard from "./src/Screens/VirtualCard/BankCard";
import BankCard1 from "./src/Screens/Transfert/BankCard1";
import Confirme from "./src/Screens/Transfert/Confirme";
import Success from "./src/Screens/Transfert/Success";
import NiuRequest from "./src/Screens/Profile/NiuRequest";
import AboutUs from "./src/Screens/Setting/AboutUs";
import BeneficiaryScreen from "./src/Screens/Transfert/BeneficiaryScreen";
import Curency from "./src/Screens/Transfert/Curency";
import PaymentMethod from "./src/Screens/Transfert/PaymentMethod";
import Support from "./src/Screens/Setting/Support";
import Payment from "./src/Screens/VirtualCard/Payment";
import DrawerComponent from "./src/components/DrawerComponent";
import NotificationComponent from "./src/components/NotificationComponent"
import History from "./src/Screens/Transfert/History";
import Receipt from "./src/Screens/Transfert/Receipt";
import Account from "./src/Screens/Profile/Account";
import Settings from "./src/Screens/Setting/Settings";
import CreateVirtualCard from "./src/Screens/VirtualCard/CreateVirtualCard";
import OnboardingCard from "./src/Screens/VirtualCard/OnboardingCard";
import VerifyIdentity from "./src/Screens/VirtualCard/VerifyIdentity";
import KYCValidation from "./src/Screens/VirtualCard/KYCValidation";
import ManageVirtualCard from "./src/Screens/VirtualCard/ManageVirtualCard";
import TransactionDetails from "./src/Screens/VirtualCard/TransactionDetails";
import KycResume from "./src/Screens/VirtualCard/KycResume";
import KycSelfie from "./src/Screens/VirtualCard/KycSelfie";
import PersonalDetail from "./src/Screens/VirtualCard/PersonalDetail";
import NIU from "./src/Screens/VirtualCard/NIU";
import Addresse from "./src/Screens/VirtualCard/Adresse";
import IdentityCard from "./src/Screens/VirtualCard/IdentityCard";
import CardAction from "./src/Screens/VirtualCard/CardAction";
import IdentityVerification from "./src/Screens/VirtualCard/IdentityVerification";
import AddressSelect from "./src/Screens/VirtualCard/AddressSelect";
import AddressConfirm from "./src/Screens/VirtualCard/AddressConfirm";
import Address from "./src/Screens/Transfert/Address";
import Camera from "./src/Screens/VirtualCard/Camera";
import ChangePassword from "./src/Screens/Setting/ChangePassword";
import ChatScreen from "./src/Screens/Chat/ChatScreen";

// Partager entre amis 
import WelcomeShare from "./src/Screens/Share/WelcomeShare";
import Request from "./src/Screens/Share/Request";
import CreateShare from "./src/Screens/Share/CreateShare";
import SuccessSharing from "./src/Screens/Share/SuccessSharing";
import DistributionMethod from "./src/Screens/Share/DistributionMethod";
import Destinators from "./src/Screens/Share/Destinators";
import ConfirmTransfer from "./src/Screens/Share/ConfirmTransfer";
import AmountDistribution from "./src/Screens/Share/AmountDistribution";
import Historique from "./src/Screens/Share/Historique";
import BuySharing from "./src/Screens/Share/BuySharing";
import DetailScreen from "./src/Screens/Share/DetailScreen";
import DemandDetailScreen from "./src/Screens/Share/DemandDetailScreen";

//DEMANDE DE FONDS
import WelcomeDemand from "./src/Screens/Demand/WelcomeDemand";
import CreateRequest from "./src/Screens/Demand/CreateRequest";
import AddRecipient from "./src/Screens/Demand/AddRecipient";
import DemandList from "./src/Screens/Demand/DemandList";
import ConfirmInformation from "./src/Screens/Demand/ConfirmInformation";
import RequestPay from "./src/Screens/Demand/RequestPay";
import SelectRecipients from "./src/Screens/Demand/SelectRecipients";
import DetailsList from "./src/Screens/Demand/DetailsList";
import EditFundField from "./src/Screens/Demand/EditFundField";

//MODULE TONTINE
import TontineList from "./src/Screens/Tontine/TontineList";
import CreateTontine from "./src/Screens/Tontine/CreateTontine";
import FrequencyScreen from "./src/Screens/Tontine/FrequencyScreen";
import OrderSelection from "./src/Screens/Tontine/OrderSelection";
import Method from "./src/Screens/Tontine/Methode";
import MonthlyContribution from "./src/Screens/Tontine/MonthlyContribution";
import Participant from "./src/Screens/Tontine/Participant";
import PenaltyScreen from "./src/Screens/Tontine/PenaltyScreen";
import AddPenalty from "./src/Screens/Tontine/AddPenalty";
import Penalty from "./src/Screens/Tontine/Penalty"
import TontineDetail from "./src/Screens/Tontine/TontineDetail";
import MemberAddPenalty from "./src/Screens/Tontine/MemberAddPenalty";
import MemberHistory from "./src/Screens/Tontine/MemberHistory";
import MemberPenalty from "./src/Screens/Tontine/MemberPenalty";
import Members from "./src/Screens/Tontine/Members";
import Cotisations from "./src/Screens/Tontine/Cotisations";  
import MemberDetail from "./src/Screens/Tontine/MemberDetail";
import MemberContribution from "./src/Screens/Tontine/MemberContribution";
import TontineSetting from "./src/Screens/Tontine/TontineSetting";
import FundRelease from "./src/Screens/Tontine/FundRelease";
import TermsAndConditions from "./src/Screens/Tontine/TermsAndConditions";

const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();

const headerHeight = Platform.select({
  ios: 60,
  android: 56, // Standard Android header height
});
const screenWidth = Dimensions.get('window').width;
// Custom tab bar component
function CustomTabBar({ state, descriptors, navigation }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.tabContainer}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        // Custom Floating Center Tab (Send Money)
        if (route.name === 'BeneficiaryTab') {
          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.centerButton}
              activeOpacity={0.8}
            >
              <View style={styles.centerButtonInner}>
                <FontAwesome5 
                  name="money-bill-wave" 
                  size={24} 
                  color="#fff" 
                />
                {isFocused && (
                  <View style={styles.activeIndicator} />
                )}
              </View>
            </TouchableOpacity>
          );
        }

        // Default tab icon logic
        let iconName;
        let label;
        switch (route.name) {
          case 'HomeTab':
            iconName = isFocused ? 'home' : 'home-outline';
            label = t('tabs.home');
            break;
          case 'TransferTab':
            iconName = isFocused ? 'swap-horizontal' : 'swap-horizontal-outline';
            label = t('tabs.history');
            break;
          case 'ManageVirtualCardTab':
            iconName = isFocused ? 'card' : 'card-outline';
            label = t('tabs.cards');
            break;
          case 'SettingsTab':
            iconName = isFocused ? 'settings' : 'settings-outline';
            label = t('tabs.settings');
            break;
          default:
            iconName = 'home-outline';
            label = '';
        }

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            style={styles.tabButton}
            activeOpacity={0.7}
          >
            <View style={styles.tabButtonContent}>
              <Ionicons 
                name={iconName} 
                size={24} 
                color={isFocused ? Colors.primary : Colors.text} 
              />
              <Text 
                style={[
                  styles.tabLabel, 
                  { 
                    color: isFocused ? Colors.primary : Colors.text,
                    fontFamily: isFocused ? 'Font-Bold' : 'Font-Regular'
                  }
                ]}
                numberOfLines={1}
              >
                {label}
              </Text>
              {isFocused && (
                <View style={styles.activeIndicator} />
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// Tab Navigator
function MainTabs() {
  const { t } = useTranslation();
  
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="HomeTab" 
        component={Home} 
        options={{ 
          title: t('tabs.home'),
          unmountOnBlur: true 
        }}
      />
      
      <Tab.Screen 
        name="TransferTab"
        component={History} 
        options={{ 
          title: t('tabs.history'),
          unmountOnBlur: true 
        }}
      />
      
      {/* Center Action Button */}
      <Tab.Screen 
        name="BeneficiaryTab" 
        component={BeneficiaryScreen} 
        options={{ 
          title: '',
          unmountOnBlur: true 
        }}
      />

      <Tab.Screen 
        name="ManageVirtualCardTab" 
        component={OnboardingCard} 
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
          unmountOnBlur: true 
        }}
      />
    </Tab.Navigator>
  );
}

// Stack Navigator for auth Screens
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
          statusBarTranslucent: false,              // ← obligatoire
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
        options={{ headerTitle: t('Screens.account') }} 
      />
      <Stack.Screen 
        name="NiuRequest" 
        component={NiuRequest} 
        options={{ headerTitle: t('Screens.niuRequest') }} 
      />
      <Stack.Screen name="BeneficiaryScreen" component={BeneficiaryScreen} options={{ headerShown: false }} />
      <Stack.Screen name="BeneficiarySelection" component={BeneficiarySelection} options={{ headerShown: false }} />
      <Stack.Screen 
        name="AboutUs" 
        component={AboutUs} 
        options={{ headerTitle: t('Screens.aboutUs') }} 
      />
      <Stack.Screen 
        name="ChangePassword" 
        component={ChangePassword} 
        options={{ headerTitle: t('Screens.changePassword') }} 
      />
      <Stack.Screen name="BeneficiaryDetails" component={BeneficiaryDetails} options={{ headerShown: false }} />
      <Stack.Screen name="PaymentMethod" component={PaymentMethod} options={{ headerShown: false }} />
      <Stack.Screen name="Curency" component={Curency} options={{ headerShown: false }} />
      <Stack.Screen name="BankCard" component={BankCard} options={{ headerShown: false }} />
      <Stack.Screen name="BankCard1" component={BankCard1} options={{ headerShown: false }} />
     <Stack.Screen 
        name="AddBeneficiary" 
        component={AddBeneficiary} 
        options={{ headerTitle: t('Screens.addBeneficiary') }} 
      />
      <Stack.Screen 
        name="SelectMethod" 
        component={SelectMethod} 
        options={{ headerTitle: t('Screens.selectMethod') }} 
      />
      <Stack.Screen name="BankDepositRecharge" component={BankDepositRecharge} options={{ headerTitle: t('Screens.bankDeposit') }}/>
      <Stack.Screen name="PaymentSimulator" component={PaymentSimulator} options={{ headerTitle: t('Screens.paymentSimulator') }} />
      <Stack.Screen name="MethodType" component={MethodType} options={{ headerTitle: t('Screens.selectMethod') }} />
      <Stack.Screen name="WalletTransfer" component={WalletTransfer} options={{ headerTitle: t('Screens.walletTransfer') }} />
      <Stack.Screen name="AddContact" component={AddContact} options={{ headerTitle: t('Screens.addContact') }} />
      <Stack.Screen name="AddFavorite" component={AddFavorite} options={{ headerTitle: t('Screens.addFavorite') }} />
      <Stack.Screen name="WalletRecharge" component={WalletRecharge} options={{ headerShown: false }} />
      <Stack.Screen name="WalletWithdrawal" component={WalletWithdrawal} options={{ headerShown: false }} />
      <Stack.Screen name="WalletConfirm" component={WalletConfirm} options={{ headerShown: false }} />
      <Stack.Screen name="WalletOk" component={WalletOk} options={{ headerShown: false }} />
       <Stack.Screen name="ServiceScreen" component={ServiceScreen} options={{ headerShown: false }} />
       <Stack.Screen name="OnboardingCard" component={OnboardingCard} options={{ headerShown: false }} />
      <Stack.Screen name="Confirme" component={Confirme} options={{ headerShown: false }} />
      <Stack.Screen name="Success" component={Success} options={{ headerShown: false }} />
      <Stack.Screen name="Support" component={Support} options={{ headerTitle: t('Screens.support') }}/>
      <Stack.Screen name="ChatScreen" component={ChatScreen} options={{ headerTitle: t('Screens.chat') }} />
      <Stack.Screen name="Settings" component={Settings} options={{ headerTitle: t('Screens.setting') }}/>
      <Stack.Screen name="Payment" component={Payment} options={{ headerTitle: t('Screens.payment') }} />
      <Stack.Screen name="History" component={History} options={{ headerTitle: t('Screens.history') }} />
      <Stack.Screen name="Receipt" component={Receipt} options={{ headerTitle: t('Screens.receipt') }}/>
      <Stack.Screen name="NotificationComponent" component={NotificationComponent} options={{ headerTitle: t('Screens.notification') }} />
      <Stack.Screen name="CreateVirtualCard" component={CreateVirtualCard}options={{ headerTitle: t('Screens.createCard') }} />
      <Stack.Screen name="VerifyIdentity" component={VerifyIdentity} options={{ headerShown: false }} />
      <Stack.Screen name="ManageVirtualCard" component={ManageVirtualCard} options={{ headerShown: false }} />
      <Stack.Screen name="TransactionDetails" component={TransactionDetails} options={{ headerShown: false }} />
      <Stack.Screen name="KycResume" component={KycResume} options={{ headerShown: false }} />
      <Stack.Screen name="KycSelfie" component={KycSelfie} options={{ headerShown: false }} />
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
      {/* Floating notification (adjust positioning as needed)
      <View style={{ position: 'absolute', top: 54, right: 70 }}>
       // <NotificationComponent />
      </View> */}
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

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    height: 80,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: Colors.background2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    paddingBottom: 10,
  },
  centerButton: {
    position: 'absolute',
    bottom: 45,
    alignSelf: 'center',
    backgroundColor: Colors.primary,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 10,
    transform: [{ translateY: -10 }]
  },
  centerButtonInner: {
    width: '50',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    height: '100%',
  },
  tabButtonContent: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 6,
    maxWidth: '80%',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -12,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
});
