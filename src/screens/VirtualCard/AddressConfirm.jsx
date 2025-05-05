import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import React, { useState } from "react";
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import Toast from "react-native-toast-message";
import TopLogo from "../../images/TopLogo.png";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import KycTab from "../../components/KycTab";
import { useDispatch } from 'react-redux';
import { setAddressProof } from '../../features/Kyc/kycReducer';

const AddressConfirm = ({ navigation, route }) => {
<<<<<<< Updated upstream
  const [address, setAddress] = useState("");
=======
  const dispatch = useDispatch();
>>>>>>> Stashed changes
  const [selectedDoc, setSelectedDoc] = useState(null);

  const handleConfirm = () => {
    if (!selectedDoc) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Veuillez téléverser un document avant de confirmer.",
      });
      return;
    }
<<<<<<< Updated upstream
  
    // Vérifier que c'est bien une image ou un PDF/doc
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
  
    if (!allowedTypes.includes(selectedDoc.mimeType)) {
=======

    try {
      // Dispatch the address proof to Redux store
      dispatch(setAddressProof({
        type: 'document',
        uri: selectedDoc.uri,
        name: selectedDoc.name,
        mimeType: selectedDoc.mimeType
      }));

      // Show success message
>>>>>>> Stashed changes
      Toast.show({
        type: "error",
        text1: "Type de fichier non autorisé",
        text2: "Seules les images (.jpg, .png) ou documents (.pdf, .doc) sont acceptés.",
      });
<<<<<<< Updated upstream
      return;
    }
  
    const locationData = {
      document: {
        name: selectedDoc.name,
        uri: selectedDoc.uri,
        mimeType: selectedDoc.mimeType,
      }
    };
  
    route.params?.onConfirm?.(locationData);
    navigation.goBack();
  };
  

  const handlePickDocument = async () => {
    try {
      // Action Sheet custom fallback
      const options = Platform.select({
        ios: ["Image", "Document", "Annuler"],
        android: ["Image", "Document", "Annuler"]
      });

      const cancelIndex = 2;

      const selected = await new Promise((resolve) => {
        Toast.show({
          type: 'info',
          text1: 'Sélection de fichier',
          text2: 'Veuillez choisir le type de fichier dans la boîte de dialogue native.'
        });

        setTimeout(() => {
          resolve("Image"); // fallback if platform alert isn't available
        }, 500);
      });

      // Manuel workaround
      if (selected === "Image") {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 1,
        });

        if (!result.canceled) {
          const asset = result.assets[0];
          const fileInfo = await FileSystem.getInfoAsync(asset.uri);
          const fileSizeMB = fileInfo.size / (1024 * 1024);

          if (fileSizeMB > 5) {
            Toast.show({
              type: "error",
              text1: "Fichier trop volumineux",
              text2: "L'image ne doit pas dépasser 5 Mo.",
            });
            return;
          }

          setSelectedDoc({
            name: asset.uri.split("/").pop(),
            uri: asset.uri,
            mimeType: "image/jpeg",
          });

          Toast.show({
            type: "success",
            text1: "Image sélectionnée",
          });
        }
      } else if (selected === "Document") {
        const result = await DocumentPicker.getDocumentAsync({
          type: "*/*",
          copyToCacheDirectory: true,
          multiple: false,
        });

        if (result.type === 'success') {
          const fileInfo = await FileSystem.getInfoAsync(result.uri);
          const fileSizeMB = fileInfo.size / (1024 * 1024);

          if (fileSizeMB > 5) {
            Toast.show({
              type: "error",
              text1: "Fichier trop volumineux",
              text2: "Le document ne doit pas dépasser 5 Mo.",
            });
            return;
          }

          setSelectedDoc(result);

          Toast.show({
            type: "success",
            text1: "Document sélectionné",
          });
        }
      }
    } catch (err) {
      console.error("Erreur lors du choix du fichier:", err);
=======

      // Navigate back to KycResume
      navigation.navigate("KycResume");
      
    } catch (error) {
      console.error("Confirmation error:", error);
>>>>>>> Stashed changes
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Une erreur est survenue lors de la sélection du fichier.",
      });
    }
  };

  return (
    <View className="flex-1 bg-[#181e25] pt-0 relative">
      <StatusBar style="light" />
      
      {/* Header */}
      <View className="relative h-32">
        <View className="absolute -top-12 left-0 right-0 items-center justify-center">
          <Image source={TopLogo} className="h-36 w-40" resizeMode="contain" />
        </View>

        <View className="flex-row items-center justify-between px-5 pt-16">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <AntDesign name="arrowleft" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.openDrawer()} className="ml-auto">
            <Ionicons name="menu-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="border border-dashed border-gray-300 my-1" />
      <Text className="text-center text-white text-2xl my-3">
        Vérification de l'identité
      </Text>

      <ScrollView className="flex-1 pb-3 bg-white rounded-t-3xl">
        <View className="px-6 py-4">
          <KycTab isActive="5" />

          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-800 mb-3 text-center">
              Où résidez-vous?
            </Text>

            <View>
              <TouchableOpacity
                onPress={handlePickDocument}
                className="h-64 rounded-lg overflow-hidden border border-gray-200 bg-gray-100 items-center justify-center"
              >
                <Ionicons name="document" size={50} color="gray" />
                <Text className="text-gray-500 mt-2">
                  Cliquez ici pour téléverser un document ou une image
                </Text>
              </TouchableOpacity>

              {selectedDoc && (
                <View className="mt-2 px-4 py-2 bg-green-100 rounded-lg flex-row items-center justify-between">
                  <Ionicons name="checkmark-done-circle-outline" size={20} color="green" />
                  <Text className="text-green-700 ml-2 flex-1">{selectedDoc.name}</Text>
                </View>
              )}
            </View>

            <Text className="text-gray-500 text-sm mt-2 italic text-center">
              Vous pourriez avoir besoin de téléverser votre localisation.
            </Text>
          </View>

          <TouchableOpacity
            className="bg-[#7ddd7d] py-4 rounded-lg mt-4"
            onPress={handleConfirm}
          >
            <Text className="text-white font-bold text-center">CONFIRMER</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View className="py-4 flex-row justify-center items-center gap-2">
        <Ionicons name="shield-checkmark" size={18} color="orange" />
        <Text className="text-sm text-white">
          Ne partagez pas vos informations personnelles…
        </Text>
      </View>

      <Toast />
    </View>
  );
};

export default AddressConfirm;
