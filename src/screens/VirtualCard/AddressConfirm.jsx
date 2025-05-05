import { View, Text, TouchableOpacity, Image, ScrollView, Dimensions } from "react-native";
import React, { useState } from "react";
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import Toast from "react-native-toast-message";
import TopLogo from "../../images/TopLogo.png";
import { AntDesign, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import KycTab from "../../components/KycTab";
import { useDispatch } from 'react-redux';
import { setAddressProof } from '../../features/Kyc/kycReducer';

const AddressConfirm = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const [selectedDoc, setSelectedDoc] = useState(null);

  const handlePickDocument = async () => {
    try {
      // First try to pick from gallery
      const galleryResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!galleryResult.canceled) {
        const asset = galleryResult.assets[0];
        const fileInfo = await FileSystem.getInfoAsync(asset.uri);
        const fileSizeMB = fileInfo.size / (1024 * 1024);

        if (fileSizeMB > 5) {
          Toast.show({
            type: "error",
            text1: "Fichier trop volumineux",
            text2: "L'image ne doit pas dépasser 5 Mo",
          });
          return;
        }

        setSelectedDoc({
          name: `address_proof_${Date.now()}.jpg`,
          uri: asset.uri,
          mimeType: 'image/jpeg',
          type: 'image'
        });
        return;
      }

      // If user canceled image picker, try document picker
      const docResult = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true
      });

      if (docResult.type === 'success') {
        const fileInfo = await FileSystem.getInfoAsync(docResult.uri);
        const fileSizeMB = fileInfo.size / (1024 * 1024);

        if (fileSizeMB > 5) {
          Toast.show({
            type: "error",
            text1: "Fichier trop volumineux",
            text2: "Le document ne doit pas dépasser 5 Mo",
          });
          return;
        }

        setSelectedDoc({
          name: docResult.name,
          uri: docResult.uri,
          mimeType: docResult.mimeType || 'application/octet-stream',
          type: docResult.mimeType?.includes('image') ? 'image' : 'document'
        });
      }
    } catch (err) {
      console.error("Document selection error:", err);
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Impossible de sélectionner le document"
      });
    }
  };

  const handleConfirm = async () => {
    if (!selectedDoc) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Veuillez sélectionner un document avant de confirmer",
      });
      return;
    }

    try {
      // Dispatch the address proof to Redux store
      dispatch(setAddressProof({
        type: 'document',
        uri: selectedDoc.uri,
        name: selectedDoc.name,
        mimeType: selectedDoc.mimeType
      }));

      // Show success message
      Toast.show({
        type: "success",
        text1: "Succès",
        text2: "Document d'adresse confirmé"
      });

      // Navigate back to KycResume
      navigation.navigate("KycResume");
      
    } catch (error) {
      console.error("Confirmation error:", error);
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Échec de la confirmation du document"
      });
    }
  };

  const renderDocumentPreview = () => {
    if (!selectedDoc) return null;

    if (selectedDoc.type === 'image') {
      return (
        <View className="relative mb-4">
          <Image
            source={{ uri: selectedDoc.uri }}
            className="h-64 w-full rounded-lg"
            resizeMode="contain"
          />
          <View className="absolute top-2 right-2 bg-white rounded-full p-1">
            <TouchableOpacity onPress={() => setSelectedDoc(null)}>
              <MaterialIcons name="cancel" size={24} color="red" />
            </TouchableOpacity>
          </View>
          <Text className="text-center text-gray-600 mt-1">{selectedDoc.name}</Text>
        </View>
      );
    } else {
      return (
        <View className="bg-gray-100 p-4 rounded-lg mb-4 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Ionicons name="document" size={32} color="#3b82f6" />
            <View className="ml-3">
              <Text className="font-medium text-gray-800" numberOfLines={1}>
                {selectedDoc.name}
              </Text>
              <Text className="text-xs text-gray-500">
                {selectedDoc.mimeType}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={() => setSelectedDoc(null)}>
            <MaterialIcons name="cancel" size={24} color="red" />
          </TouchableOpacity>
        </View>
      );
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

      {/* Title */}
      <View className="border border-dashed border-gray-300 my-1" />
      <Text className="text-center text-white text-2xl my-3">
        Confirmation d'adresse
      </Text>

      {/* Main Content */}
      <ScrollView className="flex-1 pb-3 bg-white rounded-t-3xl">
        <View className="px-6 py-4">
          <KycTab isActive="5" />

          <View className="mb-6">
            <Text className="text-lg font-bold text-gray-800 mb-3 text-center">
              Justificatif de domicile
            </Text>

            {/* Document Preview */}
            {renderDocumentPreview()}

            {/* Upload Button */}
            {!selectedDoc && (
              <TouchableOpacity
                onPress={handlePickDocument}
                className="h-40 border-2 border-dashed border-gray-300 rounded-lg items-center justify-center"
              >
                <View className="items-center">
                  <Ionicons name="cloud-upload" size={48} color="#7ddd7d" />
                  <Text className="text-gray-700 font-medium mt-2">
                    Sélectionner un document
                  </Text>
                  <Text className="text-gray-500 text-sm">
                    (Image ou PDF)
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Accepted Documents Info */}
            <View className="mt-4 bg-blue-50 p-3 rounded-lg">
              <Text className="font-medium text-blue-800">Documents acceptés:</Text>
              <Text className="text-gray-600 text-sm mt-1">
                • Facture d'eau ou d'électricité (moins de 3 mois)
              </Text>
              <Text className="text-gray-600 text-sm">
                • Contrat de bail en cours de validité
              </Text>
              <Text className="text-gray-600 text-sm">
                • Avis d'imposition ou de taxe foncière
              </Text>
              <Text className="text-gray-600 text-sm">
                • Taille maximale: 5 Mo
              </Text>
            </View>
          </View>

          {/* Confirm Button */}
          <TouchableOpacity
            className={`py-4 rounded-lg mt-4 ${selectedDoc ? 'bg-[#7ddd7d]' : 'bg-gray-400'}`}
            onPress={handleConfirm}
            disabled={!selectedDoc}
          >
            <Text className="text-white font-bold text-center">CONFIRMER LE DOCUMENT</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer */}
      <View className="py-4 flex-row justify-center items-center gap-2">
        <Ionicons name="shield-checkmark" size={18} color="orange" />
        <Text className="text-sm text-white">
          Ne partagez pas vos informations personnelles
        </Text>
      </View>

      <Toast />
    </View>
  );
};

export default AddressConfirm;