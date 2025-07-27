const dotenv = require("dotenv");
const path = require("path");

const env = process.env.ENV || "local";
const envFilePath = path.resolve(__dirname, `.env.${env}`);
dotenv.config({ path: envFilePath });

module.exports = {
  expo: {
    name: "Sendo",
    slug: "sendo",
    version: "1.0.4",
    orientation: "portrait",
    icon: "./assets/logo.png", 
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/logo.png",
      resizeMode: "contain",
      backgroundColor: "#181e25"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.sfe.sendo2025",
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
      package: "com.sfe.sendo"
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
      ],
      [
        "expo-build-properties",
        {
          ios: {
            deploymentTarget: "15.1",
            useFrameworks: "static",
            modularHeaders: true
          },
          android: {
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            buildToolsVersion: "35.0.0"
          }
        }
      ]
    ],
    extra: {
      eas: {
        apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
       "projectId": "f317890d-1389-4b9e-9ce8-e1ffa7fe866e"
      }
    },
    
  }
};
