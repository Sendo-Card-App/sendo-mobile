import "./global.css";
import React, { useEffect } from "react";
import { Colors } from './src/constants/colors'; // Adjust the path as needed

import { StyleSheet, View, Text, TouchableOpacity,Platform } from "react-native";
import { Provider } from "react-redux";
import { store } from "./src/store/store";
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
import Home from "./src/screens/Home/Home";
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
import ChatScreen from "./src/screens/Chat/ChatScreen";
import AddContact from "./src/screens/Solde/AddContact";
import TransfertFund from "./src/screens/Wallet/TransfertFund";
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
import MonSolde from "./src/screens/Solde/MonSolde";
import CreateVirtualCard from "./src/screens/VirtualCard/CreateVirtualCard";
import VerifyIdentity from "./src/screens/VirtualCard/VerifyIdentity";
import ManageVirtualCard from "./src/screens/VirtualCard/ManageVirtualCard";
import KycResume from "./src/screens/VirtualCard/KycResume";
import KycSelfie from "./src/screens/VirtualCard/KycSelfie";
import PersonalDetail from "./src/screens/VirtualCard/PersonalDetail";
import NIU from "./src/screens/VirtualCard/NIU";
import Addresse from "./src/screens/VirtualCard/Adresse";
import IdentityCard from "./src/screens/VirtualCard/IdentityCard";
import IdentityVerification from "./src/screens/VirtualCard/IdentityVerification";
import AddressSelect from "./src/screens/VirtualCard/AddressSelect";
import AddressConfirm from "./src/screens/VirtualCard/AddressConfirm";
import Address from "./src/screens/Transfert/Address";
import Camera from "./src/screens/VirtualCard/Camera";
import ChangePassword from "./src/screens/Setting/ChangePassword";

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
      <Stack.Screen name="TransfertFund" component={TransfertFund} options={{ headerTitle: t('screens.transferFunds') }} />
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
