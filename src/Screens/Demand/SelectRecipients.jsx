import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import TopLogo from "../../images/TopLogo.png";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";
import Loader from "../../components/Loader";
import { useGetUserProfileQuery } from "../../services/Auth/authAPI";
import { useGetSynchronizedContactsQuery } from "../../services/Contact/contactsApi";

const SelectRecipients = ({ navigation, route }) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [includeSelf, setIncludeSelf] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch user profile
  const { data: userProfile, isLoading: loadingProfile } = useGetUserProfileQuery();
  const userId = userProfile?.data?.id;
  const userWalletId = userProfile?.data?.wallet?.matricule;
  const userFullName = `${userProfile?.data?.firstname || ""} ${userProfile?.data?.lastname || ""}`.trim();

  // Fetch synchronized contacts
  const {
    data: contactsData,
    isLoading: isLoadingContacts,
  } = useGetSynchronizedContactsQuery(userId, { skip: !userId });

  const synchronizedContacts = contactsData?.data ?? [];

const filteredContacts = useMemo(() => {
  if (!synchronizedContacts) return [];

  return synchronizedContacts.filter((friend) => {
    const friendName = friend?.name?.toLowerCase() || '';
    const contactUserId = friend?.contactUser?.id;

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
        text1: t("selectRecipient.no_recipients_selected"),
        text2: t("selectRecipient.select_at_least_one"),
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const recipients = [];
      selectedFriends.forEach((id) => {
        const friend = synchronizedContacts.find((f) => f.id === id);
        if (friend) {
          recipients.push({
            id: friend.id,
            matriculeWallet: friend.contactUser?.wallet?.matricule,
            name: friend.name,
          });
        }
      });

      navigation.navigate("ConfirmInformation", {
        ...route.params,
        recipients,
      });
    } catch (error) {
      console.error(error);
      Toast.show({
        type: "error",
        text1: t("selectRecipient.error"),
        text2: t("selectRecipient.something_went_wrong"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderItem = ({ item }) => {
    const isSelected = selectedFriends.includes(item.id);

    return (
      <TouchableOpacity
        onPress={() => toggleFriend(item.id)}
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: "#2B2F38",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View
            style={{
              backgroundColor: "#7ddd7d",
              width: 36,
              height: 36,
              borderRadius: 18,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#000", fontWeight: "bold" }}>
              {item.name
                ?.split(" ")
                .map((p) => p[0])
                .join("")
                .toUpperCase()}
            </Text>
          </View>
          <Text style={{ color: "#fff", marginLeft: 10 }}>{item.name}</Text>
        </View>

        {isSelected && <Ionicons name="checkmark" size={18} color="#7ddd7d" />}
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#181e25" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style="light" />

      {/* Header */}
      <View
        style={{
          height: 100,
          paddingHorizontal: 20,
          paddingTop: 48,
          backgroundColor: "#151c1f",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
        }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Logo */}
      <View
        style={{
          position: "absolute",
          top: -48,
          left: 0,
          right: 0,
          alignItems: "center",
        }}
      >
        <Image
          source={TopLogo}
          style={{ height: 140, width: 160 }}
          resizeMode="contain"
        />
      </View>
       <View className="border border-dashed border-gray-300" />
      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        <Text
          style={{
            color: "#7ddd7d",
            fontSize: 18,
            fontWeight: "bold",
            marginTop: 20,
            marginBottom: 10,
          }}
        >
          {t("selectRecipient.choose_recipients")}
        </Text>

        {/* Manual Add Button */}
        <TouchableOpacity
          onPress={() => navigation.navigate("AddRecipients")}
          style={{
            alignSelf: "flex-end",
            marginBottom: 10,
            paddingHorizontal: 16,
            paddingVertical: 8,
            backgroundColor: "#2B2F38",
            borderRadius: 8,
          }}
        >
          <Text style={{ color: "#7ddd7d", fontWeight: "bold" }}>
            + {t("selectRecipient.add_manually")}
          </Text>
        </TouchableOpacity>

        {/* Search */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "#fff",
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 10,
            marginBottom: 10,
          }}
        >
          <Ionicons name="search" size={20} color="#888" />
          <TextInput
            style={{ marginLeft: 8, color: "black", flex: 1 }}
            placeholder={t("selectRecipient.search_contact")}
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Loader */}
        {loadingProfile || isLoadingContacts ? (
          <Loader />
        ) : (
          <FlatList
            data={filteredContacts}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleNext}
          disabled={isSubmitting}
          style={{
            marginTop: 50,
            marginBottom:50,
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
            {isSubmitting ? t("please_wait") : t("selectRecipient.next")}
          </Text>
        </TouchableOpacity>
      </View>

      <Toast />
    </KeyboardAvoidingView>
  );
};

export default SelectRecipients;
