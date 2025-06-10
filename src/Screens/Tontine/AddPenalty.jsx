import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useRoute } from "@react-navigation/native";
import { useAddPenaltyMutation, useGetCotisationsQuery } from '../../services/Tontine/tontineApi';
import Toast from 'react-native-toast-message';
import Loader from '../../components/Loader';
const TopLogo = require('../../Images/TopLogo.png');

const AddPenalty = () => {
  const navigation = useNavigation();
    const route = useRoute();
    const {member,tontineId, tontine } = route.params || {};
   //console.log(tontineId)
  const [motif, setMotif] = useState('Retard');
  const [action, setAction] = useState('Amende');
  const [somme, setSomme] = useState('5000 xaf');
  const [note, setNote] = useState('Amende');
  const [deadline, setDeadline] = useState('');
    const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [addPenalty, { isLoading }] = useAddPenaltyMutation();
  
  const membreId = member?.id;
    const { data: cotisations } = useGetCotisationsQuery({
      tontineId,
      memberId: membreId,
    });
  

    const cotisationId = cotisations?.data?.[0]?.id;
  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const formatted = selectedDate.toLocaleDateString();
      setDeadline(formatted);
    }
  };

  const confirmForm = async () => {
    if (!deadline || !somme || !action || !motif) {
      Toast.show({
        type: 'error',
        text1: 'Veuillez remplir tous les champs',
      });
      return;
    }

    try {
      setLoading(true);

      const payload = {
        membreId,
        montant: parseInt(somme),
        type: motif,
        cotisationId,
        description: note,
      };

      console.log(payload);

      await addPenalty({ tontineId, payload }).unwrap();

      Toast.show({
        type: 'success',
        text1: 'Amende enregistrée avec succès',
      });

      navigation.goBack();
    } catch (error) {
      console.error('AddPenalty error:', JSON.stringify(error, null, 2));
      Toast.show({
        type: 'error',
        text1: "Échec de l'enregistrement",
        text2: error?.data?.message || 'Veuillez réessayer.',
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-[#0C121D]"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <Toast position="top" />

      <ScrollView
        contentContainerStyle={{ paddingTop: 40, paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="flex-row mb-4 items-center justify-between px-4">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <Ionicons name="menu-outline" size={26} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Logo */}
        <View className="absolute top-[-48] left-0 right-0 items-center">
          <Image source={TopLogo} className="h-[130px] w-[160px]" resizeMode="contain" />
        </View>

        <View className="border border-dashed border-gray-500 mb-6 mx-4" />

        {/* Form */}
        <View className="bg-white mx-4 px-4 py-6 rounded-2xl shadow border">
          {/* Motif */}
          <Text className="text-black font-semibold mb-1">Motif</Text>
          <View className="border border-gray-300 rounded-md mb-1">
            <Picker selectedValue={motif} onValueChange={setMotif}>
              <Picker.Item label="Retard" value="RETARD" />
              <Picker.Item label="Absence" value="ABSENCE" />
               <Picker.Item label="Autre" value="AUTRE" />
            </Picker>
          </View>
          {/* Somme */}
          <Text className="text-black font-semibold mb-1">Somme</Text>
          <TextInput
            className="border border-gray-300 rounded-md px-4 py-3 mb-4 text-black"
            value={somme}
            onChangeText={setSomme}
            keyboardType="numeric"
          />

          {/* Note */}
          <Text className="text-black font-semibold mb-1">Note</Text>
          <TextInput
            className="border border-gray-300 rounded-md px-4 py-3 mb-4 text-black"
            value={note}
            onChangeText={setNote}
          />

          {/* Deadline */}
          <Text className="text-black font-semibold mb-1">Délai</Text>
          <TouchableOpacity
            className="border border-gray-300 rounded-md px-4 py-3 flex-row items-center justify-between mb-6"
            onPress={() => setShowDatePicker(true)}
          >
            <Text className="text-gray-700">{deadline || 'Sélectionner une date'}</Text>
            <Ionicons name="calendar-outline" size={20} color="gray" />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
            />
          )}

          {/* Buttons */}
         <View className="flex-row justify-between space-x-5 mt-4">
           <TouchableOpacity
              className="flex-1 border border-red-500 rounded-full py-3"
              onPress={() => navigation.goBack()}
            >
              <Text className="text-red-500 text-center font-semibold">Annuler</Text>
            </TouchableOpacity>
           <TouchableOpacity
              className="flex-1 bg-green-500 rounded-full py-3 items-center justify-center"
              onPress={confirmForm}
              disabled={loading}
            >
              {loading ? (
                <Loader size="small" color="#fff" />
              ) : (
                <Text className="text-white text-center font-semibold">Confirmer</Text>
              )}
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default AddPenalty;
