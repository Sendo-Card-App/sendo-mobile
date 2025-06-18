import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import Toast from 'react-native-toast-message';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import ButtomLogo1 from "../../images/ButtomLogo1.png";
import Loader from "../../components/Loader";
import { useTranslation } from "react-i18next";
import { useGetUserProfileQuery } from "../../services/Auth/authAPI";
import {
  useGetTontinesQuery,
  useAccessOrRejectTontineMutation,
} from "../../services/Tontine/tontineApi";

export default function TontineListScreen({ navigation }) {
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState("mesTontines");
  const [expandedInvitations, setExpandedInvitations] = useState({});
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);
   const [acceptLoading, setAcceptLoading] = useState(false);
  const [invitationCode, setInvitationCode] = useState("");
  const [currentItem, setCurrentItem] = useState(null);
  const user = useSelector((state) => state.auth.user);

  const { data: userProfile, isLoading: profileLoading, refetch: refetchProfile } = useGetUserProfileQuery();
  const userId = userProfile?.data?.id;

  const { data, isLoading, isError, refetch: refetchTontines } = useGetTontinesQuery(userId, {
    skip: !userId,
  });

  const [accessOrRejectTontine] = useAccessOrRejectTontineMutation();

  useFocusEffect(
    useCallback(() => {
      if (userId) {
        refetchProfile();
        refetchTontines();
      }
    }, [userId])
  );

  const tontines = data?.data?.items || [];
   //console.log("Full response:", JSON.stringify(tontines, null, 2));
  const myTontines = tontines.filter((t) =>
    t.membres.some((m) => m.user?.id === userId && m.etat !== "PENDING")
  );

  const invitationTontines = tontines.filter((t) =>
    t.membres.some((m) => m.user?.id === userId && m.etat === "PENDING")
  );

  const ROLE_LABELS = {
    ADMIN: t("role_ADMIN"),
    MEMBRE: t("role_MEMBRE"),
    TRESORIER: t("role_TRESORIER"),
    PRESIDENT: t("role_PRESIDENT"),
  };

const handleJoin = async (item) => {
  const hasAcceptedTerms = await AsyncStorage.getItem('hasAcceptedTontineTerms');

  if (!hasAcceptedTerms) {
   
    navigation.navigate("TermsAndConditions", {
      onAccept: async () => {
        await AsyncStorage.setItem('hasAcceptedTontineTerms', 'true');
        setCurrentItem(item);
        setShowCodeModal(true);
      }
    });
    return;
  }

 
  setCurrentItem(item);
  setShowCodeModal(true);
};

 const submitJoin = async () => {
  if (!currentItem) return;
  
  setAcceptLoading(true); 
  
  const membre = currentItem.membres.find((m) => m.user?.id === userId);
  const membreId = membre?.id;
  console.log(membreId)

  if (!membreId) {
    Toast.show({
      type: 'error',
      text1: 'Erreur',
      text2: 'Impossible de trouver votre identifiant de membre.',
      position: 'bottom',
    });
    setAcceptLoading(false);
    return;
  }

  if (!invitationCode) {
    Toast.show({
      type: 'error',
      text1: 'Erreur',
      text2: 'Veuillez entrer un code d\'invitation.',
      position: 'bottom',
    });
    setAcceptLoading(false);
    return;
  }

    const payload = {
    invitationCode: invitationCode,
    membreId,
    type: "JOIN",
  };
  try {
    await accessOrRejectTontine(payload).unwrap();
    Toast.show({
      type: 'success',
      text1: 'Succès',
      text2: 'Vous avez rejoint la tontine.',
      position: 'top',
    });
    setShowCodeModal(false);
    setInvitationCode("");
  } catch (error) {
    console.log("API Error:", error);
    Toast.show({
      type: 'error',
      text1: 'Erreur',
      text2: error.data?.message || 'Échec de l\'opération. Vérifiez le code.',
      position: 'top',
    });
  } finally {
    setAcceptLoading(false);
  }
};

const handleReject = async (item) => {
  setRejectLoading(true);
  const membre = item.membres.find((m) => m.user?.id === userId);
  const membreId = membre?.id;

  if (!membreId) {
    Toast.show({
      type: 'error',
      text1: 'Erreur',
      text2: 'Impossible de trouver votre identifiant de membre.',
    });
    setRejectLoading(false);
    return;
  }

   try {
      await accessOrRejectTontine({
        membreId,
        type: "REJECT",
      }).unwrap();
    
    Toast.show({
      type: 'success',
      text1: 'Succès',
      text2: 'Invitation rejetée',
    });
  } catch (error) {
    console.log("Full response:", JSON.stringify(error, null, 2));
    Toast.show({
      type: 'error',
      text1: 'Erreur',
      text2: error.data?.message || 'Impossible de rejeter l\'invitation.',
    });
  } finally {
    setRejectLoading(false);
  }
};

  const formatFrequence = (f) => {
    switch (f) {
      case "DAILY":
        return t("frequency_DAILY");
      case "WEEKLY":
        return t("frequency_WEEKLY");
      case "MONTHLY":
        return t("frequency_MONTHLY");
      default:
        return f;
    }
  };

  const renderTontineItem = ({ item }) => {
    const participants = item.membres || [];
    const currentUserMembership = participants.find((member) => member.user?.id === userId);
    const currentUserRole = currentUserMembership?.role;
    const roleLabel = ROLE_LABELS[currentUserRole] || currentUserRole || "";

    return (
      <TouchableOpacity
        key={item.id}
        className="bg-white rounded-lg p-4 mb-3 shadow-sm border border-gray-300"
        onPress={() => {
          if (currentUserRole === "ADMIN") {
            navigation.navigate("TontineDetail", { tontineId: item.id, tontine: item });
          } else {
            navigation.navigate("MemberContribution", {
              tontineId: item.id,
              tontine: item,
            });
          }
        }}
      >
        <Text className="text-black font-bold text-base mb-1">{item.nom}</Text>
        <View className="flex-row flex-wrap items-center gap-2 mt-1">
          {participants.map((member) => {
            const initials = `${member.user?.firstname?.[0] || ""}${member.user?.lastname?.[0] || ""}`;
            return (
              <View key={member.id} className="w-8 h-8 rounded-full bg-green-500 items-center justify-center">
                <Text className="text-white font-bold text-xs">{initials.toUpperCase()}</Text>
              </View>
            );
          })}
        </View>
        <View className="flex-row items-center mt-2">
          {roleLabel ? (
            <>
              <Text className="text-xs font-semibold text-black">{roleLabel}</Text>
              <Text className="text-xs text-gray-400 mx-1">•</Text>
            </>
          ) : null}
          <Text className="text-xs text-gray-500">{formatFrequence(item?.frequence)}</Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={30}
          color="black"
          style={{ position: "absolute", right: 12, top: "50%" }}
        />
      </TouchableOpacity>
    );
  };

  const renderInvitationItem = ({ item }) => {
    const isExpanded = expandedInvitations[item.id];
    const toggleExpand = () => {
      setExpandedInvitations((prev) => ({ ...prev, [item.id]: !prev[item.id] }));
    };
    const nombreMembres = item.membres.length;
    const admin = item.membres.find((m) => m.role === "ADMIN");
    const adminName = admin ? `${admin.user.firstname} ${admin.user.lastname}` : "Inconnu";

    return (
      <View className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-300">
        <TouchableOpacity className="flex-row justify-between items-center mb-2" onPress={toggleExpand}>
          <Text className="text-blue-500 font-bold text-base">{item.nom}</Text>
          <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="gray" />
        </TouchableOpacity>

        {isExpanded && (
          <>
            <Text className="text-sm font-bold">{t("tontine_members_count")}: <Text className="font-normal">{nombreMembres}</Text></Text>
            <Text className="text-sm font-bold">{t("tontine_admin")}: <Text className="font-normal">{adminName}</Text></Text>
            <Text className="text-sm font-bold">{t("tontine_frequency")}: <Text className="font-normal">{formatFrequence(item.frequence)}</Text></Text>
            <Text className="text-sm font-bold">{t("tontine_amount")}: <Text className="font-normal">{item.montant} FCFA</Text></Text>

           <TouchableOpacity
              className="bg-green-400 py-3 rounded-full items-center mt-4"
               onPress={() => handleJoin(item)}
              disabled={acceptLoading}
            >
              {acceptLoading ? (
                <Loader size="small" color="white" />
              ) : (
                <Text className="text-white">Joindre</Text>
              )}
            </TouchableOpacity>

           <TouchableOpacity 
              className={`border border-red-400 py-3 rounded-full items-center mt-3 ${rejectLoading ? 'opacity-70' : ''}`} 
              onPress={() => handleReject(item)}
              disabled={rejectLoading}
            >
              {rejectLoading ? (
                <Loader size="small" color="green" />
              ) : (
                <Text className="text-red-500 font-bold">{t("reject_button")}</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-100">
      {/* Code Modal */}
      <Modal
        visible={showCodeModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCodeModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          <TouchableOpacity 
            className="flex-1 justify-center items-center bg-black/50"
            activeOpacity={1}
            onPressOut={() => {
              setShowCodeModal(false);
              setInvitationCode("");
            }}
          >
            <TouchableOpacity 
              activeOpacity={1}
              onPress={() => {}} // Empty function to prevent click-through
            >
              <View className="bg-white p-6 rounded-lg w-80">
                <Text className="text-lg font-bold mb-4">Code d'invitation</Text>
                <Text className="mb-4">Veuillez entrer le code d'invitation reçu par email.</Text>
                
                <TextInput
                  className="border border-gray-300 rounded p-3 mb-4"
                  placeholder="Entrez le code"
                  value={invitationCode}
                  onChangeText={setInvitationCode}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus={true}
                />
                
                <View className="flex-row justify-between">
                  <TouchableOpacity
                    className="bg-gray-300 py-3 px-6 rounded items-center justify-center"
                    onPress={() => {
                      setShowCodeModal(false);
                      setInvitationCode("");
                    }}
                  >
                    <Text>Annuler</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    className="bg-green-500 py-3 px-6 rounded items-center justify-center"
                    onPress={submitJoin}
                    disabled={acceptLoading}
                  >
                    {acceptLoading ? (
                      <Loader size="small" color="white" />
                    ) : (
                      <Text className="text-white">Joindre</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      <View className="bg-green-400 pb-4 rounded-b-2xl">
        <View className="flex-row justify-between items-center px-4 pt-12">
          <Image source={ButtomLogo1} resizeMode="contain" className="h-[40px] w-[120px]" />
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <Ionicons name="menu-outline" size={28} color="white" />
          </TouchableOpacity>
        </View>
        <View className="border border-dashed border-black-300 mt-2 mx-6" />
      </View>

      <View className="px-4 mt-6">
        <TouchableOpacity
          onPress={() => navigation.navigate("CreateTontine")}
          className="bg-green-600 py-4 rounded-full flex-row items-center justify-center"
        >
          <Ionicons name="add-circle-outline" size={20} color="white" />
          <Text className="text-white ml-2 font-semibold">{t("create_button")}</Text>
        </TouchableOpacity>
      </View>

       <View className="flex-row justify-around mt-6 border-b border-gray-200">
        <TouchableOpacity
          onPress={() => setSelectedTab("mesTontines")}
          className={`pb-2 ${selectedTab === "mesTontines" ? "border-b-2 border-green-500" : ""}`}
        >
          <Text className={`text-sm font-semibold ${selectedTab === "mesTontines" ? "text-green-600" : "text-gray-500"}`}>
            {t("tab_my_tontines")} ({myTontines.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSelectedTab("invitations")}
          className={`pb-2 ${selectedTab === "invitations" ? "border-b-2 border-green-500" : ""}`}
        >
          <Text className={`text-sm font-semibold ${selectedTab === "invitations" ? "text-green-600" : "text-gray-500"}`}>
            {t("tab_invitations")} ({invitationTontines.length})
          </Text>
        </TouchableOpacity>
      </View>

      <View className="flex-1 px-4 mt-4">
        {isLoading || profileLoading ? (
          <ActivityIndicator size="large" color="green" className="mt-6" />
        ) : isError ? (
          <Text className="text-center text-red-500 mt-4">Une erreur est survenue.</Text>
        ) : selectedTab === "mesTontines" ? (
          myTontines.length === 0 ? (
            <Text className="text-center mt-4 text-gray-500">{t("no_tontine")}</Text>
          ) : (
            <FlatList
              data={myTontines}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderTontineItem}
              contentContainerStyle={{ paddingBottom: 16 }}
            />
          )
        ) : (
          invitationTontines.length === 0 ? (
            <Text className="text-center mt-4 text-gray-500">{t("no_invitation")}</Text>
          ) : (
            <FlatList
              data={invitationTontines}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderInvitationItem}
              contentContainerStyle={{ paddingBottom: 16 }}
            />
          )
        )}
      </View>
    </View>
  );
}