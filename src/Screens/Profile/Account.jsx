import {
  View,
  Text,
  Image,
  Platform,
  TextInput,
  TouchableOpacity,
} from "react-native";
import React, { useEffect, useState } from "react";
import { AntDesign, EvilIcons } from "@expo/vector-icons";
import Avatar from "../../images/Avatar.png";
import KeyboardAvoidinWrapper from "../../components/KeyboardAvoidinWrapper";
import { useGetUserProfileQuery, useUpdateProfileMutation } from "../../services/Auth/authAPI";
import { useNavigation } from "@react-navigation/native";
import Loader from "../../components/Loader";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";

const Account = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  
  // Fetch user profile data
  const { 
    data: userProfile, 
    isLoading, 
    error, 
    refetch 
  } = useGetUserProfileQuery();
  
  // Update profile mutation
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    phone: "",
    email: "",
  });

  // Update form data when userProfile changes
  useEffect(() => {
    if (userProfile) {
      setFormData({
        firstname: userProfile.firstname || "",
        lastname: userProfile.lastname || "",
        phone: userProfile.phone || "",
        email: userProfile.email || "",
      });
    }
  }, [userProfile]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    // Validate required fields
    if (!formData.firstname || !formData.lastname || !formData.phone || !formData.email) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "All fields are required.",
      });
      return;
    }

    try {
      // Send update request
      const response = await updateProfile({
        firstname: formData.firstname,
        lastname: formData.lastname,
        phone: formData.phone,
        email: formData.email,
      }).unwrap();

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Profile updated successfully",
      });
      
      setIsEditing(false);
      refetch(); // Refresh the profile data
    } catch (err) {
      console.error("Profile update error:", err);
      let errorMessage = "Failed to update profile. Please try again.";
      
      if (err.data?.message) {
        errorMessage = err.data.message;
      } else if (err.status === 401) {
        errorMessage = "Session expired. Please login again.";
      }

      Toast.show({
        type: "error",
        text1: "Error",
        text2: errorMessage,
      });
    }
  };

  // Loading state
  if (isLoading) {
    return <Loader />;
  }

  // Error state
  if (error) {
    let errorMessage = "Failed to load profile";
    
    if (error.status === 401) {
      errorMessage = "Session expired. Please login again.";
    } else if (error.data?.message) {
      errorMessage = error.data.message;
    }

    return (
      <View className="flex-1 justify-center items-center">
        <Text className="text-red-500">{errorMessage}</Text>
        <TouchableOpacity 
          onPress={refetch} 
          className="mt-4 bg-[#7ddd7d] px-6 py-2 rounded-full"
        >
          <Text className="text-white">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidinWrapper>
      <View className="flex-1 p-8 items-center">
        {/* Header with edit button */}
        <View className="flex-row justify-between items-center w-full">
          <Text className="text-gray-500 font-bold text-xl">
            {t("signup.title1")}
          </Text>
          <TouchableOpacity onPress={isEditing ? handleSave : handleEditToggle}>
            <AntDesign 
              name={isEditing ? "check" : "edit"} 
              size={24} 
              color={isEditing ? "#7ddd7d" : "gray"} 
            />
          </TouchableOpacity>
        </View>

        {/* Profile picture */}
        <View className="my-5 relative">
          <Image
            source={userProfile?.avatar ? { uri: userProfile.avatar } : Avatar}
            className="w-[200px] h-[200px] rounded-full"
          />
          {isEditing && (
            <TouchableOpacity className="absolute right-1 bottom-1 bg-white rounded-full p-2">
              <EvilIcons name="camera" size={30} color="gray" />
            </TouchableOpacity>
          )}
        </View>

        {/* Profile form */}
        <View className="w-full gap-2">
          {/* First and Last Name */}
          <View className={`w-full border-b pb-2 border-gray-400 ${Platform.OS === "android" ? "border-dashed" : "border-solid pb-3"}`}>
            <Text className="text-[#181e25] font-extrabold text-base">
              {t("signup.name")} <Text className="text-red-600 text-lg">*</Text>
            </Text>
            {isEditing ? (
              <View className="flex-row space-x-2">
                <TextInput
                  value={formData.firstname}
                  onChangeText={(text) => setFormData({ ...formData, firstname: text })}
                  className="flex-1 border rounded-2xl border-gray-400 py-3 pl-4"
                  placeholder={t("signup.firstName")}
                />
                <TextInput
                  value={formData.lastname}
                  onChangeText={(text) => setFormData({ ...formData, lastname: text })}
                  className="flex-1 border rounded-2xl border-gray-400 py-3 pl-4"
                  placeholder={t("signup.lastName")}
                />
              </View>
            ) : (
              <Text className="text-lg py-3">
                {userProfile?.firstname} {userProfile?.lastname}
              </Text>
            )}
          </View>

          {/* Phone Number */}
          <View className={`w-full border-b pb-2 border-gray-400 ${Platform.OS === "android" ? "border-dashed" : "border-solid pb-3"}`}>
            <Text className="text-[#181e25] font-extrabold text-base">
              {t("signup.phone")} <Text className="text-red-600 text-lg">*</Text>
            </Text>
            {isEditing ? (
              <TextInput
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                className="border rounded-2xl border-gray-400 py-3 pl-4"
                keyboardType="phone-pad"
              />
            ) : (
              <Text className="text-lg py-3">{userProfile?.phone}</Text>
            )}
          </View>

          {/* Email */}
          <View className={`w-full border-b pb-2 border-gray-400 ${Platform.OS === "android" ? "border-dashed" : "border-solid pb-3"}`}>
            <Text className="text-[#181e25] font-extrabold text-base">
              {t("signup.email")} <Text className="text-red-600 text-lg">*</Text>
            </Text>
            {isEditing ? (
              <TextInput
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                className="border rounded-2xl border-gray-400 py-3 pl-4"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            ) : (
              <Text className="text-lg py-3">{userProfile?.email}</Text>
            )}
          </View>

          {/* Save Button (only shown in edit mode) */}
          {isEditing && (
            <TouchableOpacity
              className="mt-16 bg-[#7ddd7d] px-24 py-4 rounded-full"
              onPress={handleSave}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <Loader small />
              ) : (
                <Text className="text-xl font-bold text-center text-white">
                  {t("signup.save")}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidinWrapper>
  );
};

export default Account;