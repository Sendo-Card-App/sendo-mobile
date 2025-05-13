const dotenv = require("dotenv");
const path = require("path");

const env = process.env.ENV || "local";
const envFilePath = path.resolve(__dirname, `.env.${env}`);
dotenv.config({ path: envFilePath });

module.exports = {
    
        expo: {
          name: "Sendo",
          slug: "sendo",
          version: "1.0.3",
          orientation: "portrait",
          icon: "./assets/icon.png",
          userInterfaceStyle: "light",
          newArchEnabled: true,
          splash: {
            "image": "./assets/splash.png",
            "resizeMode": "contain",
            "backgroundColor": "#181e25"
          },
          ios: {
            supportsTablet: true,
            infoPlist: {
             NSFaceIDUsageDescription: "Authentifiez-vous pour accéder à votre compte"
             },
           googleServicesFile: "./GoogleService-Info.plist",
           bundleIdentifier: "com.sfe.sendo"
          },
          android: {
            adaptiveIcon: {
              foregroundImage: "./assets/adaptive-icon.png",
              backgroundColor: "#181e25"
            },
            permissions: [
              "android.permission.CAMERA",
              "android.permission.RECORD_AUDIO",
              "android.permission.INTERNET"
            ],
            package: "com.sendo",
            allowCleartextTraffic: true,
            googleServicesFile: "./google-services.json"
          },
            web: {
            favicon: "./assets/favicon.png"
          },
          plugins: [
            [
              "expo-camera",
              {
                cameraPermission: "Allow $(PRODUCT_NAME) to access your camera",
                microphonePermission: "Allow $(PRODUCT_NAME) to access your microphone",
                recordAudioAndroid: true
              }
            ]
          ],
          extra: {
            eas: {
             "projectId": "3c5e2368-a9f0-420d-aebf-8265754fe6a8",
              apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL
            }
          },
          owner: "migueljunior",
        }
         
}