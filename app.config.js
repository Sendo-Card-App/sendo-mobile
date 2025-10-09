const dotenv = require("dotenv");
const path = require("path");

const env = process.env.ENV || "local";
const envFilePath = path.resolve(__dirname, `.env.${env}`);
dotenv.config({ path: envFilePath });

module.exports = {
  expo: {
    name: "Sendo",
    slug: "sendo",
    version: "1.1.0",
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
      bundleIdentifier: "com.sfe.ca",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSNotificationsUsageDescription: "Cette application utilise les notifications pour vous informer des mises à jour et des nouvelles importantes.",
        NSCameraUsageDescription: "Nous utilisons votre caméra pour scanner vos documents et permettre leur partage dans l'application.",
        NSPhotoLibraryUsageDescription: "Nous accédons à votre galerie pour vous permettre de sélectionner des documents à partager dans l'application."
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
      blockedPermissions: [
        "android.permission.READ_MEDIA_IMAGES",
        "android.permission.READ_MEDIA_VIDEO"
      ],
      package: "com.sfe.ca"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-notifications",
        "expo-build-properties",
      [
        "expo-camera",
        {
          cameraPermission: "Nous utilisons votre caméra pour scanner vos documents et permettre leur partage dans l'application.",
          microphonePermission: "Nous utilisons votre microphone pour enregistrer des notes audio si nécessaire.",
          recordAudioAndroid: true
        }
      ],
      [
        "expo-contacts",
        {
          contactsPermission: "Nous accédons à vos contacts pour faciliter le partage de documents avec vos collaborateurs."
        }
      ],
      [
        "expo-image-picker",
        {
          photosPermission: "Nous accédons à votre galerie pour vous permettre de sélectionner des documents à partager dans l'application.",
          cameraPermission: "Nous utilisons votre caméra pour prendre des photos de documents à partager."
        }
      ]
    ],
    extra: {
      eas: {
        apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
        projectId: "08a59933-10e3-45bc-b064-54b97ea7eca9"
      }
    }
  }
};
