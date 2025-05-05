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
          ios: {
            supportsTablet: true
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
            allowCleartextTraffic: true
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
              projectId: "b4090b1d-5875-4a89-9500-775dcf8a4754",
              apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL
            }
          },
          owner: "yanouyehiel"
        }
         
}