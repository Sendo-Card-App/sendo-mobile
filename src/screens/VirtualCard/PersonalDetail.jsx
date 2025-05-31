import React, { useState } from "react";
import { View, Text, TouchableOpacity, Image, ScrollView, Modal, Alert } from "react-native";
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import KycTab from "../../components/KycTab";
import { updatePersonalDetails } from '../../features/Kyc/kycReducer';
import TopLogo from "../../images/TopLogo.png";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";

const dataByCountry = {
  Cameroun: {
    regions: ['Littoral', 'Centre', 'Sud', 'Nord'],
    cities: {
      Littoral: ['Douala', 'Bonabéri', 'Nkongsamba'],
      Centre: ['Yaoundé', 'Mbalmayo'],
      Sud: ['Ebolowa', 'Kribi'],
      Nord: ['Garoua', 'Maroua'],
    },
    districts: {
      Douala: ['Bonanjo', 'Bastos', 'Akwa', 'Makepe'],
      Yaoundé: ['Melen', 'Bastos', 'Nzeng-Ayong'],
      // ... autres villes et leurs districts
    },
    professions: ['Ingénieur', 'Médecin', 'Enseignant', 'Commerçant'],
  },
  Canada: {
    regions: ['Ontario', 'Québec', 'Colombie-Britannique'],
    cities: {
      Ontario: ['Toronto', 'Ottawa', 'Hamilton'],
      Québec: ['Montréal', 'Québec', 'Laval'],
      'Colombie-Britannique': ['Vancouver', 'Victoria'],
    },
    districts: {
      Toronto: ['Downtown', 'North York', 'Scarborough'],
      Montréal: ['Plateau', 'Mile End', 'Ville-Marie'],
     
    },
    professions: ['Engineer', 'Doctor', 'Teacher', 'Merchant'],
  }
};

const PersonalDetail = ({ navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const personalDetails = useSelector(state => state.kyc.personalDetails);

  const [formData, setFormData] = useState({
    country: personalDetails.country || '',
    region: personalDetails.region || '',
    city: personalDetails.city || '',
    district: personalDetails.district || '',
    profession: personalDetails.profession || '',
  });

  const [toggleDropdown, setToggleDropdown] = useState(false);
  const [currentSelection, setCurrentSelection] = useState([]);
  const [currentCategory, setCurrentCategory] = useState("");

  const handleInputChange = (name, value) => {
    setFormData(prev => {
      // Reset dependent fields if country or region changes
      if (name === "country") {
        return { ...prev, country: value, region: '', city: '', district: '' };
      }
      if (name === "region") {
        return { ...prev, region: value, city: '', district: '' };
      }
      if (name === "city") {
        return { ...prev, city: value, district: '' };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleSelect = (option) => {
    handleInputChange(currentCategory, option);
    setToggleDropdown(false);
  };

  const openModal = (category) => {
    let options = [];
    const { country, region, city } = formData;

    switch(category) {
      case 'country':
        options = Object.keys(dataByCountry);
        break;
      case 'region':
        options = country ? dataByCountry[country]?.regions || [] : [];
        break;
      case 'city':
        options = country && region ? dataByCountry[country]?.cities?.[region] || [] : [];
        break;
      case 'district':
        options = country && region && city ? dataByCountry[country]?.districts?.[city] || [] : [];
        break;
      case 'profession':
        options = country ? dataByCountry[country]?.professions || [] : [];
        break;
      default:
        options = [];
    }

    if (options.length === 0) {
      Alert.alert(t('personalDetail.noOptions'), t('personalDetail.noOptionsMsg'));
      return;
    }

    setCurrentSelection(options);
    setCurrentCategory(category);
    setToggleDropdown(true);
  };

  const handleSubmit = () => {
    if (!formData.country || !formData.profession || !formData.region || !formData.city || !formData.district) {
      Alert.alert(t('personalDetail.errorTitle'), t('personalDetail.fillAllFields'));
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
        {t('personalDetail.title')}
      </Text>

      {/* Main Content */}
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="bg-white rounded-t-3xl p-4 mx-5 mb-4">
          <KycTab isActive="1" />
          <Text className="font-bold text-gray-800 mb-2 text-center">
            {t('personalDetail.header')}
          </Text>
          <Text className="text-xs text-gray-600 mb-3 text-center">
            {t('personalDetail.subheader')}
          </Text>
          
          <View className="border border-dashed border-gray-300 my-2" />

          {/* Country */}
          <Text className="font-bold text-gray-600 mt-4 mb-2 text-xs">
            {t('personalDetail.country')}
          </Text>
          <TouchableOpacity 
            className="border border-gray-300 rounded-lg p-4 mb-2"
            onPress={() => openModal("country")}>
            <Text className="text-gray-800">
              {formData.country || t('personalDetail.selectCountry')}
            </Text>
          </TouchableOpacity>

          {/* Region */}
          <Text className="font-bold text-gray-600 mt-4 mb-2 text-xs">
            {t('personalDetail.region')}
          </Text>
          <TouchableOpacity 
            className="border border-gray-300 rounded-lg p-4 mb-2"
            onPress={() => openModal("region")}>
            <Text className="text-gray-800">
              {formData.region || t('personalDetail.selectRegion')}
            </Text>
          </TouchableOpacity>

          {/* City */}
          <Text className="font-bold text-gray-600 mt-4 mb-2 text-xs">
            {t('personalDetail.city')}
          </Text>
          <TouchableOpacity
            className="border border-gray-300 rounded-lg p-4 mb-2"
            onPress={() => openModal("city")}>
            <Text className="text-gray-800">
              {formData.city || t('personalDetail.selectCity')}
            </Text>
          </TouchableOpacity>
          
          {/* District */}
          <Text className="font-bold text-gray-600 mt-4 mb-2 text-xs">
            {t('personalDetail.district')}
          </Text>
          <TouchableOpacity
            className="border border-gray-300 rounded-lg p-4 mb-2"
            onPress={() => openModal("district")}>
            <Text className="text-gray-800">
              {formData.district || t('personalDetail.selectDistrict')}
            </Text>
          </TouchableOpacity>

          {/* Profession */}
          <Text className="font-bold text-gray-600 mt-4 mb-2 text-xs">
            {t('personalDetail.profession')}
          </Text>
          <TouchableOpacity
            className="border border-gray-300 rounded-lg p-4 mb-2"
            onPress={() => openModal("profession")}>
            <Text className="text-gray-800">
              {formData.profession || t('personalDetail.selectProfession')}
            </Text>
          </TouchableOpacity>
          
          <View className="border border-dashed border-gray-300 my-2" />

          <Text className="text-gray-600 mb-4 text-center">
            {t('personalDetail.confidentialNotice')}
          </Text>

          <TouchableOpacity 
            className="bg-[#7ddd7d] py-3 rounded-full mt-4"
            onPress={handleSubmit}>
            <Text className="text-xl text-center font-bold">
              {t('personalDetail.saveButton')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Dropdown Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={toggleDropdown}
          onRequestClose={() => setToggleDropdown(false)}
        >
          <View className="flex-1 justify-center items-center bg-transparent bg-opacity-50">
            <View className="bg-black rounded-lg w-5/6 max-w-md">
              {currentSelection.map((option, index) => (
                <TouchableOpacity 
                  key={index} 
                  onPress={() => handleSelect(option)} 
                  className="py-3 px-4 border-b border-gray-200"
                >
                  <Text className="text-white">{option}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                onPress={() => setToggleDropdown(false)}
                className="py-3 px-4 bg-gray-200 rounded-b-lg"
              >
                <Text className="text-center text-gray-600"> {t('personalDetail.closeButton')} </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>

      <StatusBar style="light" />
    </View>
  );
};

export default PersonalDetail;
