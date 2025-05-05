import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, ScrollView, TextInput, Modal } from "react-native";
import { useDispatch, useSelector } from 'react-redux';
import KycTab from "../../components/KycTab";
import { updatePersonalDetails } from '../../features/Kyc/kycReducer';
import TopLogo from "../../images/TopLogo.png";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

const PersonalDetail = ({ navigation }) => {
  const dispatch = useDispatch();
  const personalDetails = useSelector(state => state.kyc.personalDetails);
  
  const [formData, setFormData] = useState({
    profession: personalDetails.profession || '',
    region: personalDetails.region || '',
    city: personalDetails.city || '',
    district: personalDetails.district || '',
  });

  const [toggleDropdown, setToggleDropdown] = useState(false);
  const [currentSelection, setCurrentSelection] = useState([]);
  const [currentCategory, setCurrentCategory] = useState("");

  const regions = ['Littoral', 'Centre', 'Sud', 'Nord'];
  const cities = ['Douala', 'Yaoundé', 'Kribi', 'Garoua'];
  const districts = ['Bonanjo', 'Bastos', 'Akwa', 'Makepe'];
  const professions = ['Ingénieur', 'Médecin', 'Enseignant', 'Commerçant'];

  const handleInputChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelect = (option) => {
    handleInputChange(currentCategory, option);
    setToggleDropdown(false);
  };

  const openModal = (category, options) => {
    setCurrentSelection(options);
    setCurrentCategory(category);
    setToggleDropdown(true);
  };

  const handleSubmit = () => {
    // Basic validation
    if ( !formData.profession ||  !formData.region || !formData.city || !formData.district) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires");
      return;
    }

  

    dispatch(updatePersonalDetails(formData));
    navigation.navigate("KycResume");
  };

  return (
    <View className="flex-1 bg-[#181e25]">
      {/* Header */}
      <View className="border-b border-dashed border-white flex-row justify-between py-4 mt-10 mx-5">
        <View className="absolute -top-12 left-0 right-0 items-center justify-center">
          <Image source={TopLogo} className="h-36 w-40" resizeMode="contain" />
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="arrowleft" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.openDrawer()} className="ml-auto">
          <Ionicons name="menu-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>
      
      {/* Title */}
      <View className="border border-dashed border-gray-300 my-1" />
      <Text className="text-center text-white text-2xl my-3">
        Détails personnels
      </Text>

      {/* Main Content */}
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="bg-white rounded-t-3xl p-4 mx-5 mb-4">
          <KycTab isActive="1" />
          <Text className="font-bold text-gray-800 mb-2 text-center">Informations personnelles</Text>
          <Text className="text-xs text-gray-600 mb-3 text-center">
            Renseignez vos informations telles qu'elles apparaissent sur vos documents officiels.
          </Text>
          
          <View className="border border-dashed border-gray-300 my-2" />

          {/* Region */}
          <Text className="font-bold text-gray-600 mt-4 mb-2 text-xs">Région</Text>
          <TouchableOpacity 
            className="border border-gray-300 rounded-lg p-4 mb-2"
            onPress={() => openModal("region", regions)}>
            <Text className="text-gray-800">{formData.region || 'Sélectionnez votre région'}</Text>
          </TouchableOpacity>

          {/* City */}
          <Text className="font-bold text-gray-600 mt-4 mb-2 text-xs">Ville</Text>
          <TouchableOpacity
            className="border border-gray-300 rounded-lg p-4 mb-2"
            onPress={() => openModal("city", cities)}>
            <Text className="text-gray-800">{formData.city || 'Sélectionnez votre ville'}</Text>
          </TouchableOpacity>
          
          {/* District */}
          <Text className="font-bold text-gray-600 mt-4 mb-2 text-xs">Quartier</Text>
          <TouchableOpacity
            className="border border-gray-300 rounded-lg p-4 mb-2"
            onPress={() => openModal("district", districts)}>
            <Text className="text-gray-800">{formData.district || 'Sélectionnez votre quartier'}</Text>
          </TouchableOpacity>

          {/* Profession */}
          <Text className="font-bold text-gray-600 mt-4 mb-2 text-xs">Profession</Text>
          <TouchableOpacity
            className="border border-gray-300 rounded-lg p-4 mb-2"
            onPress={() => openModal("profession", professions)}>
            <Text className="text-gray-800">{formData.profession || 'Sélectionnez votre profession'}</Text>
          </TouchableOpacity>
          
          <View className="border border-dashed border-gray-300 my-2" />

          <Text className="text-gray-600 mb-4 text-center">
            Ces informations sont requises pour compléter votre profil et sont traitées de manière confidentielle.
          </Text>

          <TouchableOpacity 
            className="bg-[#7ddd7d] py-3 rounded-full mt-4"
            onPress={handleSubmit}>
            <Text className="text-xl text-center font-bold">ENREGISTRER</Text>
          </TouchableOpacity>
        </View>

        {/* Dropdown Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={toggleDropdown}
          onRequestClose={() => setToggleDropdown(false)}
        >
          <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
            <View className="bg-white rounded-lg w-5/6 max-w-md">
              {currentSelection.map((option, index) => (
                <TouchableOpacity 
                  key={index} 
                  onPress={() => handleSelect(option)} 
                  className="py-3 px-4 border-b border-gray-200"
                >
                  <Text className="text-gray-800">{option}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity 
                onPress={() => setToggleDropdown(false)} 
                className="py-3 px-4 bg-gray-100 rounded-b-lg"
              >
                <Text className="text-red-500 text-center font-bold">Fermer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>

      <StatusBar style="light" />
      
      {/* Footer */}
      <View className="py-4 flex-row justify-center items-center gap-2">
        <Ionicons name="shield-checkmark" size={18} color="orange" />
        <Text className="text-sm text-white">
          Ne partagez pas vos informations personnelles
        </Text>
      </View>
    </View>
  );
};

export default PersonalDetail;