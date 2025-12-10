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

const Destinators = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const [includeSelf, setIncludeSelf] = useState(true);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: userProfile } = useGetUserProfileQuery();
  const userId = userProfile?.data?.user?.id;
  const userWalletId = userProfile?.data?.user?.wallet?.matricule;
  const userFullName = `${userProfile?.data?.user?.firstname || ""} ${userProfile?.data?.user?.lastname || ""}`.trim();

  const {
    data: contactsData,
    isLoading: isLoadingContacts,
  } = useGetSynchronizedContactsQuery(userId, { skip: !userId,
      pollingInterval: 10000, // Refetch every 30 seconds
   });
 // console.log("🔍 Full response:", JSON.stringify(contactsData, null, 2));

  const synchronizedContacts = contactsData?.data ?? [];

const filteredContacts = useMemo(() => {
  if (!synchronizedContacts) return [];

  return synchronizedContacts.filter((friend) => {
    const friendName = friend?.name?.toLowerCase() || '';
    const contactUserId = friend?.ownerUser?.id;

    return contactUserId !== userId && friendName.includes(searchQuery.toLowerCase());
  });
}, [searchQuery, synchronizedContacts, userId]);




  const toggleFriend = (id) => {
    setSelectedFriends((prev) =>
      prev.includes(id) ? prev.filter((n) => n !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
   const totalParticipants = selectedFriends.length + (includeSelf ? 1 : 0);
    if (totalParticipants < 2) {
      Toast.show({
        type: "error",
        text1: "Aucun destinataire sélectionné",
        text2: "Veuillez sélectionner au moins deux participants.",
      });
      return;
    }


    setIsSubmitting(true);

    try {
    const participants = selectedFriends.map((friendId) => {
      const friend = synchronizedContacts.find((f) => f.id === friendId);
      const firstName = friend?.ownerUser?.firstname || "";
      const lastName = friend?.ownerUser?.lastname || "";
      return {
        id: friend.id,
        matriculeWallet: friend?.ownerUser?.wallet?.matricule,
        name: `${firstName} ${lastName}`.trim(),
        amount: 0,
      };
    });

    
      navigation.navigate("DistributionMethod", {
        ...route.params,
        includeSelf,
        participants,
        userWalletId,
        userFullName,
      });
    } catch (error) {
      console.error("Error selecting participants:", error);
      Toast.show({
        type: "error",
        text1: "Erreur",
        text2: "Une erreur s'est produite lors de la sélection.",
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
      <View className="flex-row items-center justify-center px-4 my-4 space-x-2">
        <Text className="w-6 h-6 text-white text-center rounded-full bg-[#2B2F38] leading-6">
          {t("destinators.step1")}
        </Text>
        <View className="flex-1 h-[1px] bg-gray-400" />
        <Text className="w-6 h-6 text-white text-center rounded-full bg-[#7ddd7d] leading-6">
          {t("destinators.step2")}
        </Text>
        <View className="flex-1 h-[1px] bg-gray-400" />
        <Text className="w-6 h-6 text-white text-center rounded-full bg-[#2B2F38] leading-6">
          {t("destinators.step3")}
        </Text>
      </View>

      <View style={{ flex: 1, paddingHorizontal: 16 }}>
        <Text
          style={{
            color: "#7ddd7d",
            fontSize: 18,
            fontWeight: "bold",
            marginVertical: 10,
          }}
        >
          {t("destinators.title")}
        </Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginVertical: 10,
          }}
        >
          <Text style={{ color: "white" }}>{t("destinators.includeSelf")}</Text>
          <TouchableOpacity
            onPress={() => setIncludeSelf(!includeSelf)}
            style={{
              width: 20,
              height: 20,
              borderRadius: 4,
              backgroundColor: includeSelf ? "#7ddd7d" : "#2B2F38",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {includeSelf && <Ionicons name="checkmark" size={14} color="white" />}
          </TouchableOpacity>
        </View>

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

export default Destinators;
