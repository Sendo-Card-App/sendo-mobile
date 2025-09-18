import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useGetUserProfileQuery } from "../../services/Auth/authAPI";
import { useGetSynchronizedContactsQuery } from "../../services/Contact/contactsApi";
import Loader from "../../components/Loader";
import TopLogo from "../../images/TopLogo.png";
import { StatusBar } from "expo-status-bar";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";
import { useAddTontineMembersMutation } from "../../services/Tontine/tontineApi";

const Participant = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { tontineId } = route.params;
 // console.log(tontineId)
  const { t } = useTranslation();

  const [selectedFriends, setSelectedFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: userProfile } = useGetUserProfileQuery();
  const userId = userProfile?.data?.id;

  const {
    data: contactsData,
    isLoading: isLoadingContacts,
  } = useGetSynchronizedContactsQuery(userId, { skip: !userId });
  //console.log("Contacts Data:", contactsData);
  const synchronizedContacts = contactsData?.data ?? [];

  const [addMembers] = useAddTontineMembersMutation();

  const filteredContacts = useMemo(() => {
    return synchronizedContacts.filter((friend) => {
      const friendName = friend?.name?.toLowerCase() || "";
      const contactUserId = friend?.ownerUser?.id;
      return contactUserId !== userId && friendName.includes(searchQuery.toLowerCase());
    });
  }, [searchQuery, synchronizedContacts, userId]);

  const toggleFriend = (id) => {
    setSelectedFriends((prev) =>
      prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id]
    );
  };

 const handleNext = async () => {
    if (selectedFriends.length === 0) {
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Veuillez sélectionner au moins un participant.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Extraire les IDs valides
      const selectedUserIds = selectedFriends
        .map((friendId) => {
          const friend = synchronizedContacts.find((f) => f.id === friendId);
          return friend?.ownerUser?.id;
        })
        .filter(id => id !== undefined);

      const addMemberPromises = selectedUserIds.map(userId => 
        addMembers({
          tontineId: tontineId,
          payload: { userId } 
        }).unwrap()
      );

      await Promise.all(addMemberPromises);
     
      Toast.show({
        type: "success",
        text1: "Succès",
        text2: `Participants ajoutés à la tontine.`,
      });

      navigation.navigate("TontineList");
    } catch (error) {
      console.log("Erreur:", error);
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: error.data?.message || "Impossible d'ajouter certains participants.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderFriendItem = ({ item }) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 10,
        borderBottomColor: "#2B2F38",
        borderBottomWidth: 1,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View
          style={{
            backgroundColor: "#7ddd7d",
            width: 36,
            height: 36,
            borderRadius: 18,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "black", fontWeight: "bold" }}>
            {item.name
              .split(" ")
              .map((part) => part[0])
              .join("")
              .toUpperCase()}
          </Text>
        </View>
        <Text style={{ color: "white", marginLeft: 10 }}>{item.name}</Text>
      </View>
      <TouchableOpacity
        onPress={() => toggleFriend(item.id)}
        style={{
          width: 20,
          height: 20,
          borderRadius: 4,
          backgroundColor: selectedFriends.includes(item.id)
            ? "#7ddd7d"
            : "#2B2F38",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {selectedFriends.includes(item.id) && (
          <Ionicons name="checkmark" size={14} color="white" />
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#181e25" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style="light" />

      <View className="absolute -top-12 left-0 right-0 items-center justify-center">
        <Image source={TopLogo} className="h-36 w-40" resizeMode="contain" />
      </View>

      <View className="border-b border-dashed border-white flex-row justify-between py-4 mt-10 items-center mx-5 pt-5">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="left" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>
      <View className="border border-dashed border-gray-300 " />

      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        <Text
          style={{
            color: "#7ddd7d",
            fontSize: 18,
            fontWeight: "bold",
            marginVertical: 10,
          }}
        >
          {t("destinators.title1")}
        </Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#fff",
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 10,
            marginVertical: 10,
          }}
        >
          <Ionicons name="search" size={20} color="#888" />
          <TextInput
            style={{ marginLeft: 8, color: "black", flex: 1 }}
            placeholder={t("destinators.searchPlaceholder")}
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <Text style={{ color: "white", marginBottom: 10 }}>
          {t("destinators.friendsLabel")}
        </Text>

        {isLoadingContacts ? (
          <Loader size="small" color="#7ddd7d" />
        ) : synchronizedContacts.length === 0 ? (
          <View style={{ marginTop: 20, alignItems: "center" }}>
            <Text style={{ color: "#888", textAlign: "center", marginBottom: 10 }}>
              {t("destinators.noFriends")}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("AddFavorite")}
              style={{
                alignSelf: "center",
                marginTop: 10,
                paddingHorizontal: 16,
                paddingVertical: 8,
                backgroundColor: "#2B2F38",
                borderRadius: 8,
              }}
            >
              <Text style={{ color: "#7ddd7d", fontWeight: "bold" }}>
                {t("selectRecipient.add_manually")}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredContacts}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderFriendItem}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          />
        )}


        <TouchableOpacity
          onPress={handleNext}
          disabled={isSubmitting}
          style={{
            marginTop: 10,
            marginBottom: 40,
            backgroundColor: isSubmitting ? "#a5e7a5" : "#7ddd7d",
            borderRadius: 30,
            paddingVertical: 14,
            alignItems: "center",
            flexDirection: "row",
            justifyContent: "center",
          }}
        >
          {isSubmitting && <Loader color="#000" style={{ marginRight: 8 }} />}
          <Text style={{ fontWeight: "bold", color: "#000" }}>
            {isSubmitting ? t("destinators.pleaseWait") : t("destinators.next")}
          </Text>
        </TouchableOpacity>
      </View>
      <Toast />
    </KeyboardAvoidingView>
  );
};

export default Participant;
