import "./global.css";
import React, { useEffect } from "react";
import { Colors } from './src/constants/colors'; // Adjust the path as needed

import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { Provider } from "react-redux";
import { store } from "./src/store/store";
import Toast from "react-native-toast-message";
import './i18n';
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, AntDesign } from "@expo/vector-icons";

import * as Notifications from "expo-notifications";
import { registerForPushNotificationsAsync } from "./src/services/notificationService";

// Screens & Components
import Home from "./src/screens/Home/Home";
import WelcomeScreen from "./src/screens/Auth/WelcomeScreen";
import PinCode from "./src/screens/Auth/PinCode";
import AddBeneficiary from "./src/screens/Solde/AddBeneficiary";
import SelectMethod from "./src/screens/Wallet/SelectMethod";
import BankDepositRecharge from "./src/screens/Wallet/BankDepositRecharge";
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
import ConﬁrmeTheTransfer from "./src/screens/Transfert/ConﬁrmeTheTransfer";
import Success from "./src/screens/Transfert/Success";
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

// Custom tab bar component
function CustomTabBar({ state, descriptors, navigation }) {
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
              {options.title || route.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// Tab Navigator
function MainTabs() {
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
        options={{ title: 'Home' }}
      />
      <Tab.Screen 
        name="ManageVirtualCardTab" 
        component={ManageVirtualCard} 
        options={{ title: 'Cards' }}
      />
      <Tab.Screen 
        name="TransferTab"
        component={History} 
        options={{ title: 'Transfer' }}
      />
      <Tab.Screen 
        name="SettingsTab" 
        component={Settings} 
        options={{ title: 'Settings' }}
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
  return (
    <Stack.Navigator
      screenOptions={({ navigation }) => ({
        headerStyle: { backgroundColor: Colors.primary },
        headerTitleStyle: { fontSize: 18, fontWeight: "bold", color: Colors.text },
        headerTitleAlign: "center",
        headerLeft: () => (
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <AntDesign name="arrowleft" size={20} color={Colors.text} style={{ padding: 12 }} />
          </TouchableOpacity>
        ),
      })}
    >
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name="Account" component={Account} options={{ headerTitle: "Compte" }} />
      <Stack.Screen name="BeneficiaryScreen" component={BeneficiaryScreen} options={{ headerShown: false }} />
      <Stack.Screen name="BeneficiarySelection" component={BeneficiarySelection} options={{ headerShown: false }} />
      <Stack.Screen name="AboutUs" component={AboutUs} options={{ headerTitle: "À propos de nous" }} />
      <Stack.Screen name="BeneficiaryDetails" component={BeneficiaryDetails} options={{ headerShown: false }} />
      <Stack.Screen name="ChangePassword" component={ChangePassword} options={{ headerTitle: "Changer le mot de passe" }} />
      <Stack.Screen name="PaymentMethod" component={PaymentMethod} options={{ headerShown: false }} />
      <Stack.Screen name="Curency" component={Curency} options={{ headerShown: false }} />
      <Stack.Screen name="BankCard" component={BankCard} options={{ headerShown: false }} />
      <Stack.Screen name="BankCard1" component={BankCard1} options={{ headerShown: false }} />
      <Stack.Screen name="AddBeneficiary" component={AddBeneficiary} options={{ headerTitle: " Envoyez Gratuitement de l'argent" }} />
      <Stack.Screen name="SelectMethod" component={SelectMethod} options={{ headerTitle: "Sélectionner une méthode" }} />
      <Stack.Screen name="BankDepositRecharge" component={BankDepositRecharge} options={{headerTitle:" Rechargement par dépôt bancaire"}} />
      <Stack.Screen name="TransfertFund" component={TransfertFund} options={{ headerTitle: "Transférer des fonds" }} />
      <Stack.Screen name="PaymentSimulator" component={PaymentSimulator} options={{ headerTitle: " Simulateur de paiement" }} />
      <Stack.Screen name="MethodType" component={MethodType} options={{headerTitle:"Sélectionner une méthode" }} />
      <Stack.Screen name="WalletTransfer" component={WalletTransfer} options={{ headerTitle: "Transfert de portefeuille" }} />
      <Stack.Screen name="AddContact" component={AddContact} options={{ headerTitle: "Ajouter un contact" }} />
      <Stack.Screen name="ConﬁrmeTheTransfer" component={ConﬁrmeTheTransfer} options={{ headerShown: false }} />
      <Stack.Screen name="Success" component={Success} options={{ headerShown: false }} />
      <Stack.Screen name="Support" component={Support} />
      <Stack.Screen name="Settings" component={Settings}/>
      <Stack.Screen name="Payment" component={Payment} />
      <Stack.Screen name="History" component={History}  />
      <Stack.Screen name="Receipt" component={Receipt} />
      <Stack.Screen name="MonSolde" component={MonSolde} options={{ headerTitle: "Mon Solde" }} />
      <Stack.Screen name="CreateVirtualCard" component={CreateVirtualCard} options={{ headerTitle: "Créer une carte virtuelle" }} />
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
      <NavigationContainer>
        <DrawerNavigator />
        <Toast />
      </NavigationContainer>
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
