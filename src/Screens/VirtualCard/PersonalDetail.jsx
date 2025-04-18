import { View, Text, TouchableOpacity,Image, ScrollView, CheckBox , TextInput, StatusBar, Modal } from "react-native";
import React, { useState } from "react";
import TopLogo from "../../Images/TopLogo.png";
import { AntDesign, Ionicons } from "@expo/vector-icons";

const PersonalDetail = ({ navigation }) => {
  // State for managing selections
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);
  const [selectedProfession, setSelectedProfession] = useState(null);
  const [selectedIncome, setSelectedIncome] = useState(null);
  const [selectedAffilliation, setSelectedAffilliation] = useState(null);

  // State for dropdown visibility
  const [toggleDropdown, setToggleDropdown] = useState(false);
  const [currentSelection, setCurrentSelection] = useState([]);
  const [currentCategory, setCurrentCategory] = useState("");

  // Options
  const regions = ['Île-de-France', 'Provence-Alpes-Côte d\'Azur', 'Nouvelle-Aquitaine', 'Auvergne-Rhône-Alpes'];
  const cities = ['Paris', 'Marseille', 'Lyon', 'Nice'];
  const neighborhoods = ['Le Marais', 'Montmartre', 'Vieux Port', 'Corderie'];
  const professions = ['Ingénieur', 'Médecin', 'Artiste', 'Enseignant'];
  const monthlyIncome = ['Moins de 1000 €', '1000 € à 2000 €', '2000 € à 3000 €', 'Plus de 3000 €'];
  const Affilliation = ['Politique', 'Société', 'Association', 'Autre'];

  const handleSelect = (option) => {
    switch (currentCategory) {
      case "region":
        setSelectedRegion(option);
        break;
      case "city":
        setSelectedCity(option);
        break;
      case "neighborhood":
        setSelectedNeighborhood(option);
        break;
      case "profession":
        setSelectedProfession(option);
        break;
      case "income":
        setSelectedIncome(option);
        break;
        case "affilliation":
        setSelectedAffilliation(option);
        break;
    }
    setToggleDropdown(false);
  };

  const openModal = (category, options) => {
    setCurrentSelection(options);
    setCurrentCategory(category);
    setToggleDropdown(true);
  };

  return (
    <View className="flex-1 bg-[#181e25]">
      {/* Navigation Header */}
      <View className="border-b border-dashed border-white flex-row justify-between py-4 mt-10 mx-5">
         <View className="absolute -top-12 left-0 right-0 items-center justify-center">
                <Image source={TopLogo} className=" h-36 w-40 " resizeMode="contain" />
              </View>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="arrowleft" size={24} color="white" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.openDrawer()} className="ml-auto">
          <Ionicons name="menu-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>
      {/* the middle heading */}
      <View className="border border-dashed border-gray-300 my-1" />
      <Text className="text-center text-white text-2xl my-3">
        Vérification de l’identité
      </Text>

      {/* Main Content */}
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Personal Details Section */}
        <View className="bg-white rounded-t-3xl p-4 mx-5 mb-4">
          <Text className="font-bold text-gray-800 mb-2 text-center">Détails personnels</Text>
          <Text className="text-xs text-gray-600 mb-3 text-center">Indiquez votre nom tel qu'il figure sur votre acte de naissance.</Text>
          <Text className="font-bold text-gray-600 mt-4 mb-2">Nom, Prénom * </Text>
          <TextInput className="border border-gray-300 rounded-lg p-2 mb-4" placeholder="Nom, Prénom *"/>
          <View className="border border-dashed border-gray-300 my-2" />
          <Text className="font-bold text-gray-600 mt-4 mb-2">Téléphone</Text>
          <TextInput className="border border-gray-300 rounded-lg p-2 mb-4" placeholder="Téléphone" keyboardType="phone-pad"/>
          <View className="border border-dashed border-gray-300 my-2" />

          {/* Region Selection */}
          <Text className="font-bold text-gray-600 mt-4 mb-2 text-xs">Où habitez-vous?</Text>
          <TouchableOpacity 
            style={{
              borderWidth: 1,
              borderColor: 'gray',
              padding: 15,
              borderRadius: 8,
              backgroundColor: 'white',
              marginTop: 5,
            }}
            className="py-3"
            onPress={() => openModal("region", regions)}>
            <Text className="text-gray-800">{selectedRegion || 'Sélectionnez votre région'}</Text>
          </TouchableOpacity>

          {/* City Selection */}
          <TouchableOpacity
            style={{
              borderWidth: 1,
              borderColor: 'gray',
              padding: 15,
              borderRadius: 8,
              backgroundColor: 'white',
              marginTop: 10,
            }}
            className="py-3" onPress={() => openModal("city", cities)}>
            <Text className="text-gray-800">{selectedCity || 'Sélectionnez une ville'}</Text>
          </TouchableOpacity>
          {/* Neighborhood Selection */}
          <TouchableOpacity
            style={{
              borderWidth: 1,
              borderColor: 'gray',
              padding: 15,
              borderRadius: 8,
              backgroundColor: 'white',
              marginTop: 10,
            }}
            className="py-3" onPress={() => openModal("neighborhood", neighborhoods)}>
            <Text className="text-gray-800">{selectedNeighborhood || 'Sélectionnez un quartier'}</Text>
          </TouchableOpacity>

          {/* Profession Selection */}
          <Text className="font-bold sm text-gray-600 mt-4 text-xs ">Sélectionnez l'option qui vous correspond le mieux</Text>
          <TouchableOpacity
            style={{
              borderWidth: 1,
              borderColor: 'gray',
              padding: 15,
              borderRadius: 8,
              backgroundColor: 'white',
              marginTop: 10,
            }}
            className="py-3" onPress={() => openModal("profession", professions)}>
            <Text className="text-gray-800">{selectedProfession || 'Sélectionnez votre profession'}</Text>
          </TouchableOpacity>
          <View className="border border-dashed border-gray-300 my-2" />

          {/* Monthly Income Question */}
          <Text className="font-bold text-gray-600 mt-4 text-xs">Combien d'argent gagnez-vous chaque mois?</Text>
          <TouchableOpacity
            style={{
              borderWidth: 1,
              borderColor: 'gray',
              padding: 15,
              borderRadius: 8,
              backgroundColor: 'white',
              marginTop: 10,
            }}
            className="py-3" onPress={() => openModal("income", monthlyIncome)}>
            <Text className="text-gray-800">{selectedIncome || 'Sélectionnez un montant'}</Text>
          </TouchableOpacity>
          <View className="border border-dashed border-gray-300 my-2" />

          {/* Monthly Income Question */}
          <Text className="font-bold text-gray-600 mt-4 text-xs">Affiliation</Text>
          <TouchableOpacity
            style={{
              borderWidth: 1,
              borderColor: 'gray',
              padding: 15,
              borderRadius: 8,
              backgroundColor: 'white',
              marginTop: 10,
            }}
            className="py-3" onPress={() => openModal("affilliation", Affilliation)}>
            <Text className="text-gray-800">{selectedAffilliation || 'Sélectionnez une affiliation'}</Text>
          </TouchableOpacity>
          <Text className="font-bold mt-4 text-center">Pourquoi cette question ?</Text>
          <Text className="text-gray-600 mb-4 text-center">Il s'agit d'une exigence réglementaire. La réglementation nationale et sous-régionale exige que toutes les institutions financières identifient convenablement tous les clients.</Text>

          <TouchableOpacity 
          style={styles.nextButton}
          onPress={() => navigation.navigate("KycResume")}>
            <Text style={styles.nextButtonText}>SUIVANT</Text>
          </TouchableOpacity>
        </View>

        {/* Modal for Options */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={toggleDropdown}
          onRequestClose={() => setToggleDropdown(false)}
        >
          <View className="flex-1 justify-center items-center  bg-opacity-50">
            <View className="bg-white rounded-lg w-72">
              {currentSelection.map((option, index) => (
                <TouchableOpacity key={index} onPress={() => handleSelect(option)} className="py-3 px-4 border-b border-gray-300">
                  <Text className="text-gray-800">{option}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => setToggleDropdown(false)} className="py-3 px-4">
                <Text className="text-red-500 text-center">Fermer</Text>
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
          Ne partagez pas vos informations personnelles…
        </Text>
      </View>
    </View>
  );
};

const styles = {
  nextButton: {
    backgroundColor: 'green',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  nextButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
};

export default PersonalDetail;
