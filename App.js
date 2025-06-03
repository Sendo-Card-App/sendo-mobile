import "./global.css";
import React, { useEffect } from "react";
import { Colors } from './src/constants/colors'; // Adjust the path as needed

import { StyleSheet, View, Text, TouchableOpacity,Platform } from "react-native";
import { Provider } from "react-redux";
import { store } from "./src/Store/store";
import Toast from "react-native-toast-message";
import { useTranslation } from 'react-i18next'; 
import './i18n';
import NetworkProvider from './src/services/NetworkProvider';
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, AntDesign } from "@expo/vector-icons";

import * as Notifications from "expo-notifications";
import { registerForPushNotificationsAsync } from "./src/services/notificationService";
import app from "./src/configs/firebaseConfig";

// Screens & Components
import Home from "./src/Screens/Home/Home";
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
import MonSolde from "./src/Screens/Solde/MonSolde";
import CreateVirtualCard from "./src/Screens/VirtualCard/CreateVirtualCard";
import VerifyIdentity from "./src/Screens/VirtualCard/VerifyIdentity";
import ManageVirtualCard from "./src/Screens/VirtualCard/ManageVirtualCard";
import KycResume from "./src/Screens/VirtualCard/KycResume";
import KycSelfie from "./src/Screens/VirtualCard/KycSelfie";
import PersonalDetail from "./src/Screens/VirtualCard/PersonalDetail";
import NIU from "./src/Screens/VirtualCard/NIU";
import Addresse from "./src/Screens/VirtualCard/Adresse";
import IdentityCard from "./src/Screens/VirtualCard/IdentityCard";
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


const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();
const Tab = createBottomTabNavigator();

const headerHeight = Platform.select({
  ios: 60,
  android: 56, // Standard Android header height
});

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

        let iconName;
        switch (route.name) {
          case 'HomeTab':
            iconName = isFocused ? 'home' : 'home-outline';
            break;
          case 'ManageVirtualCardTab':
            iconName = isFocused ? 'card' : 'card-outline';
            break;
          case 'TransferTab':
            iconName = isFocused ? 'swap-horizontal' : 'swap-horizontal-outline';
            break;
          case 'SettingsTab':
            iconName = isFocused ? 'settings' : 'settings-outline';
            break;
          default:
            iconName = 'home';
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
          >
            <Ionicons 
              name={iconName} 
              size={24} 
              color={isFocused ? Colors.primary : Colors.text} 
            />
            <Text style={[styles.tabLabel, { color: isFocused ? Colors.primary : Colors.text }]}>
              {options.title || t(`tabs.${route.name.toLowerCase().replace('tab', '')}`)}
            </Text>
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
        options={{ title: t('tabs.home') }}
      />
      <Tab.Screen 
        name="ManageVirtualCardTab" 
        component={ManageVirtualCard} 
        options={{ title: t('tabs.cards') }}
      />
      <Tab.Screen 
        name="TransferTab"
        component={History} 
        options={{ title: t('tabs.history') }}
      />
      <Tab.Screen 
        name="SettingsTab" 
        component={Settings} 
        options={{ title: t('tabs.settings') }}
      />
    </Tab.Navigator>
  );
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
   <Stack.Navigator
      screenOptions={({ navigation }) => ({
        headerStyle: { 
          backgroundColor: Colors.primary,
          height: headerHeight,
          elevation: 0, // Remove shadow on Android
          shadowOpacity: 0, // Remove shadow on iOS
        },
        headerTitleStyle: { 
          fontSize: 18, 
          fontWeight: "bold", 
          color: Colors.text,
          alignSelf: 'center',
          textAlign: 'center',
          width: '100%',
          marginLeft: -40, // Compensate for back button space
        },
        headerTitleAlign: "center",
        headerLeftContainerStyle: {
          paddingLeft: Platform.select({
            ios: 8,
            android: 16,
          }),
          paddingTop: Platform.select({
            ios: 0,
            android: 4,
          }),
        },
        headerLeft: () => (
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={{ 
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minWidth: 40, // Ensure consistent tap area
              paddingHorizontal: Platform.select({
                ios: 8,
                android: 16,
              }),
            }}
          >
            {Platform.OS === 'ios' ? (
              <Text style={{ 
                fontSize: 24, 
                color: Colors.text,
                marginTop: -2,
              }}>&lt;</Text>
            ) : (
              <View style={{ 
                justifyContent: 'center',
                height: '100%',
              }}>
                <AntDesign 
                  name="arrowleft" 
                  size={20} 
                  color={Colors.text}
                />
              </View>
            )}
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
      <Stack.Screen name="Confirme" component={Confirme} options={{ headerShown: false }} />
      <Stack.Screen name="Success" component={Success} options={{ headerShown: false }} />
      <Stack.Screen name="Support" component={Support} options={{ headerTitle: t('screens.support') }}/>
      <Stack.Screen name="ChatScreen" component={ChatScreen} options={{ headerTitle: t('screens.chat') }} />
      <Stack.Screen name="Settings" component={Settings} options={{ headerTitle: t('screens.setting') }}/>
      <Stack.Screen name="Payment" component={Payment} options={{ headerTitle: t('screens.payment') }} />
      <Stack.Screen name="History" component={History} options={{ headerTitle: t('screens.history') }} />
      <Stack.Screen name="Receipt" component={Receipt} options={{ headerTitle: t('screens.receipt') }}/>
      <Stack.Screen name="NotificationComponent" component={NotificationComponent} options={{ headerTitle: t('screens.notification') }} />
      <Stack.Screen name="MonSolde" component={MonSolde} options={{ headerTitle: t('screens.myBalance') }} />
      <Stack.Screen name="CreateVirtualCard" component={CreateVirtualCard}options={{ headerTitle: t('screens.createCard') }} />
      <Stack.Screen name="VerifyIdentity" component={VerifyIdentity} options={{ headerShown: false }} />
      <Stack.Screen name="ManageVirtualCard" component={ManageVirtualCard} options={{ headerShown: false }} />
      <Stack.Screen name="KycResume" component={KycResume} options={{ headerShown: false }} />
      <Stack.Screen name="KycSelfie" component={KycSelfie} options={{ headerShown: false }} />
      <Stack.Screen name="PersonalDetail" component={PersonalDetail} options={{ headerShown: false }} />
      <Stack.Screen name="NIU" component={NIU} options={{ headerShown: false }} />
      <Stack.Screen name="Addresse" component={Addresse} options={{ headerShown: false }} />
      <Stack.Screen name="IdentityCard" component={IdentityCard} options={{ headerShown: false }} />
      <Stack.Screen name="IdentityVerification" component={IdentityVerification} options={{ headerShown: false }} />
      <Stack.Screen name="AddressSelect" component={AddressSelect} options={{ headerShown: false }} />
      <Stack.Screen name="AddressConfirm" component={AddressConfirm} options={{ headerShown: false }} />
      <Stack.Screen name="Address" component={Address} options={{ headerShown: false }} />
      <Stack.Screen name="Camera" component={Camera} options={{ headerShown: false }} />

      <Stack.Screen name="WelcomeShare" component={WelcomeShare} options={{ headerShown: false }} />
      <Stack.Screen name="Destinators" component={Destinators} options={{ headerShown: false }} />
      <Stack.Screen name="Request" component={Request} options={{ headerShown: false }} />
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

      
    </Stack.Navigator>
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
 
  // Register for push notifications once on mount
  useEffect(() => {
    registerForPushNotificationsAsync().then((token) => {
      console.log("Expo Push Token:", token);
      // TODO: send token to your backend here if needed
    });
  }, []);
  return (
    <Provider store={store}>
      <NetworkProvider>
        <NavigationContainer>
          <DrawerNavigator />
          <Toast />
        </NavigationContainer>
      </NetworkProvider>
    </Provider>
  );
}
const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    height: 65,
    borderTopWidth: 1,
    borderTopColor: Colors.borderTop,
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: Colors.background2,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 5,
    color: Colors.text,
  },
});
