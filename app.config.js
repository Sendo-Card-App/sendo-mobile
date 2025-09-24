const dotenv = require("dotenv");
const path = require("path");

const env = process.env.ENV || "local";
const envFilePath = path.resolve(__dirname, `.env.${env}`);
dotenv.config({ path: envFilePath });

module.exports = {
  expo: {
    name: "Sendo",
    slug: "sendo",
    version: "1.0.5",
    owner: "sfesendo",
    orientation: "portrait",
    icon: "./assets/icon-sendo.png", 
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/icon-sendo.png",
      resizeMode: "contain",
      backgroundColor: "#181e25"
    },
    ios: {
      supportsTablet: true,

      bundleIdentifier: "www.sendo.com",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
         NSNotificationsUsageDescription: "This app uses notifications to inform you about updates."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/logo.png", 
        backgroundColor: "#181e25"
      },
      permissions: [
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO",
        "android.permission.INTERNET",
        "android.permission.READ_CONTACTS",
        "android.permission.WRITE_CONTACTS"
      ],


      package: "www.sendo.com"


    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
       "expo-notifications",
      [
        "expo-camera",
        {
          cameraPermission: "Allow $(PRODUCT_NAME) to access your camera",
          microphonePermission: "Allow $(PRODUCT_NAME) to access your microphone",
          recordAudioAndroid: true
        }
      ],
      [
        "expo-contacts",
        {
          contactsPermission: "Allow $(PRODUCT_NAME) to access your contacts"
        }
      ]
    ],
    extra: {
      eas: {
        apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
       "projectId": "08a59933-10e3-45bc-b064-54b97ea7eca9"
      }
    },
    
  }
};
