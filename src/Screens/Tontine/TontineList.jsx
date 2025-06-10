import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import ButtomLogo from "../../Images/ButtomLogo.png";
import { useGetUserProfileQuery } from "../../services/Auth/authAPI";
import {
  useGetTontinesQuery,
  useAccessOrRejectTontineMutation,
} from "../../services/Tontine/tontineApi";

export default function TontineListScreen({ navigation }) {
  const [selectedTab, setSelectedTab] = useState("mesTontines");
  const [expandedInvitations, setExpandedInvitations] = useState({});
  const user = useSelector((state) => state.auth.user);
  const { data: userProfile, isLoading: profileLoading } = useGetUserProfileQuery();
  const userId = userProfile?.data?.id;
  const [accessOrRejectTontine] = useAccessOrRejectTontineMutation();

  const { data, isLoading, isError } = useGetTontinesQuery(userId, {
    skip: !userId,
  });

  const tontines = data?.data?.items || [];

  // Split into joined vs pending invitations
  const myTontines = tontines.filter((t) =>
    t.membres.some((m) => m.user?.id === userId && m.etat !== "PENDING")
  );

  const invitationTontines = tontines.filter((t) =>
    t.membres.some((m) => m.user?.id === userId && m.etat === "PENDING")
  );

  const ROLE_LABELS = {
    ADMIN: "Administrateur",
    MEMBRE: "Participant",
    TRESORIER: "Trésorier",
    PRESIDENT: "Président",
  };

  const handleJoin = (item) => {
    const membre = item.membres.find((m) => m.user?.id === userId);
    const membreId = membre?.id;

    if (!membreId) {
      Alert.alert("Erreur", "Impossible de trouver votre identifiant de membre.");
      return;
    }

    Alert.prompt(
      "Code d'invitation",
      "Veuillez entrer le code d'invitation reçu par email.",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Joindre",
          onPress: async (code) => {
            const payload = {
              invitationCode: code,
              membreId,
              type: "JOIN",
            };
            try {
              await accessOrRejectTontine(payload).unwrap();
              Alert.alert("Succès", "Vous avez rejoint la tontine.");
            } catch (error) {
              Alert.alert("Erreur", "Échec de l'opération. Vérifiez le code.");
            }
          },
        },
      ],
      "plain-text"
    );
  };

  const handleReject = async (item) => {
    const membre = item.membres.find((m) => m.user?.id === userId);
    const membreId = membre?.id;

    if (!membreId) {
      Alert.alert("Erreur", "Impossible de trouver votre identifiant de membre.");
      return;
    }

    try {
      await accessOrRejectTontine({
        invitationCode: "REJECT",
        membreId,
        type: "REJECT",
      }).unwrap();
      Alert.alert("Invitation rejetée");
    } catch (error) {
      Alert.alert("Erreur", "Impossible de rejeter l'invitation.");
    }
  };

  const renderTontineItem = ({ item }) => {
    const participants = item.membres || [];
    const currentUserMembership = participants.find(
      (member) => member.user?.id === userId
    );
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
          <Text className="text-xs text-gray-500">{item.frequence}</Text>
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
      setExpandedInvitations((prev) => ({
        ...prev,
        [item.id]: !prev[item.id],
      }));
    };

    const nombreMembres = item.membres.length;
    const admin = item.membres.find((m) => m.role === "ADMIN");
    const adminName = admin ? `${admin.user.firstname} ${admin.user.lastname}` : "Inconnu";

    return (
      <View className="bg-white rounded-lg p-4 mb-4 shadow-sm border border-gray-300">
        <TouchableOpacity
          className="flex-row justify-between items-center mb-2"
          onPress={toggleExpand}
        >
          <Text className="text-blue-500 font-bold text-base">{item.nom}</Text>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color="gray"
          />
        </TouchableOpacity>

        {isExpanded && (
          <>
            <Text className="text-sm font-bold">
              Nombre de membres: <Text className="font-normal">{nombreMembres}</Text>
            </Text>
            <Text className="text-sm font-bold">
              Admin: <Text className="font-normal">{adminName}</Text>
            </Text>
            <Text className="text-sm font-bold">
              Fréquence: <Text className="font-normal">{item.frequence}</Text>
            </Text>
            <Text className="text-sm font-bold">
              Somme à cotiser: <Text className="font-normal">{item.montant} FCFA</Text>
            </Text>

            <TouchableOpacity
              className="bg-green-400 py-3 rounded-full items-center mt-4"
              onPress={() => handleJoin(item)}
            >
              <Text className="text-white font-bold">Joindre</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="border border-red-400 py-3 rounded-full items-center mt-3"
              onPress={() => handleReject(item)}
            >
              <Text className="text-red-500 font-bold">Rejeter</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="bg-green-400 pb-4 rounded-b-2xl">
        <View className="flex-row justify-between items-center px-4 pt-12">
          <Image source={ButtomLogo} resizeMode="contain" className="h-[40px] w-[120px]" />
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <Ionicons name="menu-outline" size={28} color="white" />
          </TouchableOpacity>
        </View>
        <View className="border border-dashed border-black-300 mt-2 mx-6" />
      </View>

      {/* Create button */}
      <View className="px-4 mt-6">
        <TouchableOpacity
          onPress={() => navigation.navigate("CreateTontine")}
          className="bg-green-600 py-4 rounded-full flex-row items-center justify-center"
        >
          <Ionicons name="add-circle-outline" size={20} color="white" />
          <Text className="text-white ml-2 font-semibold">Créer une nouvelle tontine</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View className="flex-row justify-around mt-6 border-b border-gray-200">
        <TouchableOpacity
          onPress={() => setSelectedTab("mesTontines")}
          className={`pb-2 ${selectedTab === "mesTontines" ? "border-b-2 border-green-500" : ""}`}
        >
          <Text className={`text-sm font-semibold ${selectedTab === "mesTontines" ? "text-green-600" : "text-gray-500"}`}>
            Mes tontines
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setSelectedTab("invitations")}
          className={`pb-2 ${selectedTab === "invitations" ? "border-b-2 border-green-500" : ""}`}
        >
          <Text className={`text-sm font-semibold ${selectedTab === "invitations" ? "text-green-600" : "text-gray-500"}`}>
            Invitations
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      <View className="flex-1 px-4 mt-4">
        {isLoading || profileLoading ? (
          <ActivityIndicator size="large" color="green" className="mt-6" />
        ) : isError ? (
          <Text className="text-center text-red-500 mt-4">Une erreur est survenue.</Text>
        ) : selectedTab === "mesTontines" ? (
          myTontines.length === 0 ? (
            <Text className="text-center mt-4 text-gray-500">Aucune tontine disponible.</Text>
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
            <Text className="text-center mt-4 text-gray-500">Aucune invitation en attente.</Text>
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
