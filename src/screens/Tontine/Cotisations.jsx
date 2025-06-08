import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import Loader from "../../components/Loader";
import { useGetCotisationsQuery,
  useSetTontineOrderMutation
 } from '../../services/Tontine/tontineApi';
import { useNavigation, useRoute } from "@react-navigation/native";
import DraggableFlatList from "react-native-draggable-flatlist";

const TopLogo = require("../../images/TopLogo.png");

const Cotisations = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const route = useRoute();
  const { tontineId, tontine } = route.params;
  const [setTontineOrder] = useSetTontineOrderMutation();

  const [activeTab, setActiveTab] = useState("Cotisations");
  const memberId = tontine.membres[0]?.id; 

  const {
    data: cotisations,
    isLoading,
    isError,
  } = useGetCotisationsQuery({
    tontineId,
    memberId,
  });
//console.log("Tontine List:", JSON.stringify(cotisations, null, 2));
  
const handleSaveOrdreRotation = async () => {
  setLoading(true);
  try {
    const ordreRotation = ordreList.map((item) => parseInt(item.key));

    console.log('Sending to backend:', {
      tontineId,
      ordreRotation,
    });

    await setTontineOrder({ tontineId, ordreRotation }).unwrap();

    Toast.show({
      type: 'success',
      text1: 'Succès',
      text2: "L’ordre de rotation a été mis à jour.",
    });
  } catch (error) {
    Toast.show({
      type: 'error',
      text1: 'Erreur',
      text2: error?.data?.message || error.message || 'Une erreur est survenue.',
    });
  } finally {
    setLoading(false);
  }
};


const initialOrdreList = tontine.membres.map((membre, i) => ({
  key: membre.id.toString(),
  label: `${membre.user.firstname} ${membre.user.lastname}`,
  order: i + 1,
}));
const [ordreList, setOrdreList] = useState(initialOrdreList);

 const formatFrequence = (f) => {
    switch (f) {
      case "DAILY":
        return "Journalier";
      case "WEEKLY":
        return "Hebdomadaire";
      case "MONTHLY":
        return "Mensuel";
      default:
        return f;
    }
  };

  return (
    <View className="flex-1 bg-[#0E1111] pt-12">
      <Toast position="top" />

      {/* Header */}
      <View className="flex-row mb-2 items-center justify-between px-4">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Top Logo */}
      <View className="absolute top-[-48px] left-0 right-0 items-center">
        <Image
          source={TopLogo}
          className="h-[130px] w-[160px]"
          resizeMode="contain"
        />
      </View>

      <View className="border border-dashed border-gray-500 mb-6 mx-4" />

      {/* Stat Cards */}
      <View className="mx-4 mb-4 bg-white border border-gray-300 rounded-xl p-4">
        <View className="flex-row justify-between">
          <View className="bg-green-400 rounded-lg p-3 flex-1 mr-2 items-center">
            <Ionicons name="cash-outline" size={28} color="#fff" />
            <Text className="text-white text-xs mt-1">Total</Text>
            <Text className="text-white font-bold text-lg mt-1">
              {tontine.compteSequestre.soldeActuel} xaf
            </Text>
          </View>
          <View className="bg-green-400 rounded-lg p-3 flex-1 ml-2 items-center">
            <Ionicons name="people-outline" size={28} color="#fff" />
            <Text className="text-white text-xs mt-1">Membres</Text>
            <Text className="text-white font-bold text-lg mt-1">
              {tontine.nombreMembres}
            </Text>
          </View>
        </View>

        {/* Weekly Summary */}
        <View className="mt-4">
          <View className="flex-row justify-between mb-1">
            <Text className="text-black">{formatFrequence(tontine.frequence)}</Text>

            <Text className="text-black font-semibold"> {tontine.montant}</Text>
          </View>

          {/* Action Button */}
          <TouchableOpacity className="bg-[#34D399] mt-4 py-3 rounded-full items-center flex-row justify-center space-x-2">
            <Text className="text-black font-semibold">
              Verser au prochain bénéficiaire
            </Text>
            <Ionicons name="lock-closed-outline" size={18} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View className="bg-white rounded-t-xl px-4 pt-3 pb-1 mx-4 flex-1">
        <View className="flex-row justify-around mb-2">
          {["Cotisations", "Ordre de passage", "Historique"].map((tab) => (
            <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)}>
              <Text
                className={`text-sm font-medium pb-1 ${
                  activeTab === tab
                    ? "text-green-500 border-b-2 border-green-500"
                    : "text-gray-400"
                }`}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Cotisations */}
        {activeTab === "Cotisations" && (
          <>
            {isLoading ? (
              <Text className="text-center text-gray-500 mt-4">
                Chargement...
              </Text>
            ) : isError ? (
              <Text className="text-center text-red-500 mt-4">
                Erreur de chargement des cotisations.
              </Text>
            ) : cotisations?.data?.length === 0 ? (
              <Text className="text-center text-gray-400 mt-4">
                Aucune cotisation enregistrée.
              </Text>
            ) : (
              <ScrollView className="mt-4">
                {cotisations.data.map((item, idx) => (
                  <View
                    key={idx}
                    className="flex-row items-center justify-between bg-white rounded-xl px-4 py-3 mb-2 shadow-sm"
                  >
                    <Text className="text-black font-medium">
                      {item.beneficiaire?.user?.firstname}{" "}
                      {item.beneficiaire?.user?.lastname}
                    </Text>

                    {item.status === "PAID" ? (
                      <Text className="text-blue-600 font-semibold text-sm">
                        {item.montant} xaf
                      </Text>
                    ) : (
                      <View className="flex-row items-center space-x-2">
                        <Text className="text-orange-500 font-medium text-sm">
                           {item.etat} 
                        </Text>
                        <TouchableOpacity className="bg-blue-400 rounded-full px-3 py-1">
                          <Text className="text-white text-xs font-semibold">
                            Relancer
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    <Text className="text-gray-500 text-sm">
                      {item.date
                        ? new Date(item.date).toLocaleDateString()
                        : "—"}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </>
        )}

        {/* Ordre de passage */}
        {activeTab === "Ordre de passage" && (
          <View className="mt-4 flex-1">
            <Text className="text-black text-sm mb-2">
              Glisser un nom en haut ou en bas pour redéfinir l’ordre de
              passage
            </Text>

            <DraggableFlatList
              data={ordreList}
              onDragEnd={({ data }) => setOrdreList(data)}
              keyExtractor={(item) => item.key}
              renderItem={({ item, index, drag, isActive }) => (
              <TouchableOpacity
                onLongPress={drag}
                disabled={isActive}
                className={`flex-row items-center justify-between bg-gray-100 rounded-lg px-4 py-4 mb-2 ${
                  isActive ? "opacity-50" : ""
                }`}
              >
                <View className="flex-row items-center space-x-3">
                  <Ionicons name="reorder-three" size={20} color="#888" />
                  <Text className="text-black font-semibold text-base">{item.label}</Text>
                </View>
                <View className="bg-gray-200 rounded-full px-3 py-1">
                  <Text className="text-black font-bold text-sm">
                   <Text className="text-black font-bold text-sm">{item.order}</Text>
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            />
            <TouchableOpacity
              className="bg-green-500 py-3 mt-4 rounded-full items-center flex-row justify-center"
              onPress={handleSaveOrdreRotation}
              disabled={loading}
            >
              {loading ? (
                <Loader color="#fff" />
              ) : (
                <Text className="text-white font-semibold text-base">
                  Enregistrer l’ordre
                </Text>
              )}
            </TouchableOpacity>

          </View>
        )}

        {/* Historique */}
        {activeTab === "Historique" && (
          <ScrollView className="mt-4">
            <View className="bg-white rounded-lg p-4 mb-4">
              <Text className="text-black font-semibold mb-2">
                Historique des tours:
              </Text>
              {tontine.toursDeDistribution.length === 0 ? (
                <Text className="text-gray-500">
                  Aucun tour encore effectué.
                </Text>
              ) : (
                tontine.toursDeDistribution.map((tour, idx) => (
                  <Text key={idx} className="text-gray-700 mb-1">
                    Tour {idx + 1}: Bénéficiaire - {tour.beneficiaire}
                  </Text>
                ))
              )}
            </View>
          </ScrollView>
        )}
      </View>
    </View>
  );
};

export default Cotisations;
