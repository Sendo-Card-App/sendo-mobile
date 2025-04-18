import { View, Text, Image, TouchableOpacity, ScrollView, Alert } from "react-native";
import React, { useState } from "react";
import KycTab from "../../components/KycTab";
import TopLogo from "../../images/TopLogo.png";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

const IdentityCard = ({ navigation }) => {
  const [selectedDocument, setSelectedDocument] = useState(null);

  const documentOptions = [
    { id: 'cni', name: 'CNI (Carte Nationale d\'Identité)', requiredCaptures: 2 },
    { id: 'recepisse', name: 'Récépissé', requiredCaptures: 1 },
    { id: 'passport', name: 'Passeport', requiredCaptures: 1 },
    { id: 'residence', name: 'Permis de résidence', requiredCaptures: 2 }
  ];

  const handleDocumentSelect = (docId, requiredCaptures) => {
    setSelectedDocument(docId);
    // Navigate to Camera page with the required number of captures as a parameter
    navigation.navigate("Camera", { documentType: docId, captures: requiredCaptures });
  };

  return (
    <View className="flex-1 bg-[#181e25] pt-0 relative">
      <StatusBar style="light" />
      
      {/* Header with Logo and Navigation */}
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

      {/* Title Section */}
      <View className="border border-dashed border-gray-300 my-1" />
      <Text className="text-center text-white text-2xl my-3">
        Vérification de l'identité
      </Text>

      {/* Main Content */}
      <ScrollView className="flex-1 pb-3 bg-white rounded-t-3xl">
        <View className="px-6 py-4">
           {/* Top Tab */}
           <KycTab isActive="3" />

          {/* Document Selection Section */}
          <View className="mb-8">
            <Text className="text-lg font-bold text-gray-800 mb-4 text-center">
              Pièce d'identité
            </Text>
            <Text className="text-gray-600 mb-4 text-center">
              Sélectionnez un type de document pour vérification d'identité
            </Text>
            
            <View>
              {documentOptions.map((doc) => (
                <TouchableOpacity
                  key={doc.id}
                  className={`flex-row items-center justify-between border rounded-lg p-4 mb-4 ${selectedDocument === doc.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`} 
                  onPress={() => handleDocumentSelect(doc.id, doc.requiredCaptures)}  // Pass number of captures
                >
                  <View className="flex-row items-center">
                    {/* Icons for each document type */}
                    {doc.id === 'cni' && (
                      <Ionicons name="card" size={30} color={selectedDocument === doc.id ? '#2563eb' : '#374151'} className="mr-3" />
                    )}
                    {doc.id === 'recepisse' && (
                      <Ionicons name="document-text" size={30} color={selectedDocument === doc.id ? '#2563eb' : '#374151'} className="mr-3" />
                    )}
                    {doc.id === 'passport' && (
                      <Ionicons name="document" size={30} color={selectedDocument === doc.id ? '#2563eb' : '#374151'} className="mr-3" /> 
                    )}
                    {doc.id === 'residence' && (
                      <Ionicons name="home" size={30} color={selectedDocument === doc.id ? '#2563eb' : '#374151'} className="mr-3" />
                    )}
                    
                    <Text className={`font-medium ${selectedDocument === doc.id ? 'text-blue-600' : 'text-gray-700'}`}>
                      {doc.name}
                    </Text>
                  </View>
                  
                  {/* Chevron icon on the right */}
                  <AntDesign 
                    name="right" 
                    size={16} 
                    color={selectedDocument === doc.id ? '#2563eb' : '#9ca3af'} 
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View className="py-4 flex-row justify-center items-center gap-2">
        <Ionicons name="shield-checkmark" size={18} color="orange" />
        <Text className="text-sm text-white">
          Ne partagez pas vos informations personnelles…
        </Text>
      </View>
    </View>
  );
};

export default IdentityCard;
