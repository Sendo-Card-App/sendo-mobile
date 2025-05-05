import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  Platform,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { AntDesign, EvilIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import Avatar from "../../images/Avatar.png";
import KeyboardAvoidinWrapper from "../../components/KeyboardAvoidinWrapper";
import {
  useGetUserProfileQuery,
  useUpdateProfileMutation,
  useSendOtpMutation,
  useVerifyOtpMutation,
  useAddSecondPhoneMutation,
  useSendSecondPhoneOtpMutation,
  useVerifySecondPhoneOtpMutation,
} from "../../services/Auth/authAPI";
import { useNavigation } from "@react-navigation/native";
import Loader from "../../components/Loader";
import Toast from "react-native-toast-message";
import OtpVerificationModal from "../../components/OtpVerificationModal";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const Account = () => {
  const navigation = useNavigation();

  const { data: userProfile, isLoading, error, refetch } = useGetUserProfileQuery();

  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [sendOtp] = useSendOtpMutation();
  const [verifyOtp] = useVerifyOtpMutation();
  const [addSecondPhone] = useAddSecondPhoneMutation();
  const [sendSecondPhoneOtp] = useSendSecondPhoneOtpMutation();
  const [verifySecondPhoneOtp] = useVerifySecondPhoneOtpMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    phone: "",
    email: "",
    profession: "",
    region: "",
    city: "",
    district: "",
    picture: null,
  });
  const [originalData, setOriginalData] = useState({});
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpTarget, setOtpTarget] = useState(null); // 'email', 'phone', or 'secondPhone'
  const [tempValue, setTempValue] = useState("");
  const [isSecondPhone, setIsSecondPhone] = useState(false);

  useEffect(() => {
    if (userProfile) {
      const profileData = {
        firstname: userProfile.data.firstname || "",
        lastname: userProfile.data.lastname || "",
        phone: userProfile.data.phone || "",
        email: userProfile.data.email || "",
        profession: userProfile.data.profession || "",
        region: userProfile.data.region || "",
        city: userProfile.data.city || "",
        district: userProfile.data.district || "",
        picture: userProfile.data.picture || null,
      };
      setFormData(profileData);
      setOriginalData(profileData);
    }
  }, [userProfile]);
    

  
  const handleVerifyOtp = async (code) => {
    try {
      if (isSecondPhone) {
        await verifySecondPhoneOtp({ phone: tempValue, code }).unwrap();
        await addSecondPhone({ phone: tempValue }).unwrap();
        Toast.show({
          type: "success",
          text1: "Success",
          text2: "Second phone number added successfully",
        });
      } else {
        await verifyOtp({ [otpTarget]: tempValue, code }).unwrap();
        setFormData((prev) => ({
          ...prev,
          [otpTarget]: tempValue,
        }));
      }

      setShowOtpModal(false);
      setIsSecondPhone(false);
    } catch (err) {
      console.error("OTP Verification Error:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err?.data?.message || "Invalid OTP code",
      });
    }
  };

  const handleSave = async () => {
    const {
      firstname,
      lastname,
      phone,
      email,
      profession,
      region,
      city,
      district,
      picture,
    } = formData;
  
    if (!firstname || !lastname || !phone || !email || !profession || !region || !city || !district) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "All fields are required",
      });
      return;
    }
  
    try {
      const formDataToSend = new FormData();
      
      // Append all fields to FormData
      formDataToSend.append("firstname", firstname);
      formDataToSend.append("lastname", lastname);
      formDataToSend.append("phone", phone);
      formDataToSend.append("email", email);
      formDataToSend.append("profession", profession);
      formDataToSend.append("region", region);
      formDataToSend.append("city", city);
      formDataToSend.append("district", district);
  
      // Only append picture if it exists and has changed
      if (picture && picture.uri) {
        // Extract file extension from URI
        const fileExtension = picture.uri.split('.').pop();
        const fileName = `profile_${Date.now()}.${fileExtension}`;
        
        formDataToSend.append("picture", {
          uri: picture.uri,
          name: fileName,
          type: `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`,
        });
      } else if (originalData.picture === null && picture === null) {
        // Handle case where picture was removed
        formDataToSend.append("picture", null);
      }
  
      // Prepare headers
      const headers = {
        'Content-Type': 'multipart/form-data',
      };
  
      // Make the API call
      await updateProfile({
        userId: userProfile.data.id,
        formData: formDataToSend,
        headers,
      }).unwrap();
  
      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Profile updated successfully",
      });
  
      setIsEditing(false);
      refetch();
    } catch (err) {
      console.error("Profile update error:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err?.data?.message || "Failed to update profile",
      });
    }
  };
  

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      const cameraPermissionResult = await ImagePicker.requestCameraPermissionsAsync();
  
      if (permissionResult.status !== "granted" || cameraPermissionResult.status !== "granted") {
        Toast.show({
          type: "error",
          text1: "Permission denied",
          text2: "Please grant camera and media library permissions.",
        });
        return;
      }
  
      const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,  // Slightly reduced quality for smaller file size
        allowsEditing: true,
        aspect: [1, 1],  // Square aspect ratio
      });
  
      if (pickerResult.canceled) return;
  
      const selectedAsset = pickerResult.assets?.[0];
      if (!selectedAsset) return;
  
      // Get file info
      const fileInfo = await fetch(selectedAsset.uri);
      const blob = await fileInfo.blob();
      
      if (blob.size > MAX_FILE_SIZE) {
        Toast.show({
          type: "error",
          text1: "File too large",
          text2: "Image must be less than 5MB.",
        });
        return;
      }
  
      // Extract file extension
      const uriParts = selectedAsset.uri.split('.');
      const fileExtension = uriParts[uriParts.length - 1].toLowerCase();
  
      setFormData((prev) => ({
        ...prev,
        picture: {
          uri: selectedAsset.uri,
          name: `profile_${Date.now()}.${fileExtension}`,
          type: `image/${fileExtension === 'jpg' ? 'jpeg' : fileExtension}`,
        },
      }));
    } catch (err) {
      console.error("Image Picker Error:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Failed to pick image",
      });
    }
  };

  const handleFieldChange = (field, value) => {
    if (field === "phone" && value !== originalData.phone) {
      setOtpTarget("phone");
      setTempValue(value);
      sendOtp({ phone: value })
        .unwrap()
        .then(() => setShowOtpModal(true))
        .catch((err) => {
          console.error("OTP send error:", err);
          Toast.show({
            type: "error",
            text1: "Error",
            text2: `Failed to send OTP to new phone number`,
          });
        });
    } else if (field === "email" && value !== originalData.email) {
      setOtpTarget("email");
      setTempValue(value);
      sendOtp({ email: value })
        .unwrap()
        .then(() => setShowOtpModal(true))
        .catch((err) => {
          console.error("OTP send error:", err);
          Toast.show({
            type: "error",
            text1: "Error",
            text2: `Failed to send OTP to new email`,
          });
        });
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const handleAddSecondPhone = () => {
    setIsSecondPhone(true);
    setOtpTarget("phone");
    setTempValue("");
    setShowOtpModal(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#181e25]">
      <StatusBar style="light" backgroundColor="#181e25" />
      <KeyboardAvoidinWrapper>
        <View className="flex-1 p-6">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-white text-2xl font-bold">My Account</Text>
            <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
              <AntDesign name={isEditing ? "close" : "edit"} size={24} color="white" />
            </TouchableOpacity>
          </View>

          <View className="items-center mb-8">
            <Image
              source={formData.picture ? { uri: formData.picture.uri } : Avatar}
              className="w-32 h-32 rounded-full border-4 border-[#7ddd7d]"
            />
            {isEditing && (
              <TouchableOpacity
                className="absolute bottom-0 right-0 bg-[#7ddd7d] rounded-full p-2"
                onPress={pickImage}
              >
                <EvilIcons name="camera" size={24} color="white" />
              </TouchableOpacity>
            )}
          </View>

          <View className="bg-[#f1f1f1] rounded-2xl p-6">
            {/* Full Name */}
            <View className="mb-6">
              <Text className="text-gray-700 font-bold mb-2">Full Name</Text>
              {isEditing ? (
                <View className="flex-row space-x-2">
                  <TextInput
                    value={formData.firstname}
                    onChangeText={(text) => handleFieldChange("firstname", text)}
                    placeholder="First Name"
                    className="flex-1 bg-white rounded-xl p-3"
                  />
                  <TextInput
                    value={formData.lastname}
                    onChangeText={(text) => handleFieldChange("lastname", text)}
                    placeholder="Last Name"
                    className="flex-1 bg-white rounded-xl p-3"
                  />
                </View>
              ) : (
                <Text className="text-lg bg-white rounded-xl p-3">
                  {userProfile ? `${userProfile.data.firstname} ${userProfile.data.lastname}` : "Data not available"}
                </Text>
              )}
            </View>

            {/* Phone Number */}
            <View className="mb-6">
              <Text className="text-gray-700 font-bold mb-2">Phone Number</Text>
              {isEditing ? (
                <>
                  <TextInput
                    value={formData.phone}
                    onChangeText={(text) => handleFieldChange("phone", text)}
                    keyboardType="phone-pad"
                    placeholder="Phone Number"
                    className="bg-white rounded-xl p-3 mb-2"
                  />
                  <TouchableOpacity
                    onPress={handleAddSecondPhone}
                    className="bg-blue-500 p-2 rounded-lg items-center"
                  >
                    <Text className="text-white">Add Second Phone</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Text className="text-lg bg-white rounded-xl p-3">
                  {userProfile?.data?.phone || "Loading..."}
                </Text>
              )}
            </View>

            {/* Email */}
            <View className="mb-6">
              <Text className="text-gray-700 font-bold mb-2">Email</Text>
              {isEditing ? (
                <TextInput
                  value={formData.email}
                  onChangeText={(text) => handleFieldChange("email", text)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="Email"
                  className="bg-white rounded-xl p-3"
                />
              ) : (
                <Text className="text-lg bg-white rounded-xl p-3">
                  {userProfile?.data?.email || "Loading..."}
                </Text>
              )}
            </View>

            {/* Other Fields */}
            {isEditing ? (
              <>
                <TextInput
                  placeholder="Profession"
                  value={formData.profession}
                  onChangeText={(text) => handleFieldChange("profession", text)}
                  className="bg-white rounded-xl p-3 mb-3"
                />
                <TextInput
                  placeholder="Region"
                  value={formData.region}
                  onChangeText={(text) => handleFieldChange("region", text)}
                  className="bg-white rounded-xl p-3 mb-3"
                />
                <TextInput
                  placeholder="City"
                  value={formData.city}
                  onChangeText={(text) => handleFieldChange("city", text)}
                  className="bg-white rounded-xl p-3 mb-3"
                />
                <TextInput
                  placeholder="District"
                  value={formData.district}
                  onChangeText={(text) => handleFieldChange("district", text)}
                  className="bg-white rounded-xl p-3 mb-3"
                />
              </>
            ) : (
              <>
                <View className="mb-6">
                  <Text className="text-gray-700 font-bold mb-2">Profession</Text>
                  <Text className="text-lg bg-white rounded-xl p-3">
                    {userProfile?.data?.profession || "Not set"}
                  </Text>
                </View>

                <View className="mb-6">
                  <Text className="text-gray-700 font-bold mb-2">Region</Text>
                  <Text className="text-lg bg-white rounded-xl p-3">
                    {userProfile?.data?.region || "Not set"}
                  </Text>
                </View>

                <View className="mb-6">
                  <Text className="text-gray-700 font-bold mb-2">City</Text>
                  <Text className="text-lg bg-white rounded-xl p-3">
                    {userProfile?.data?.city || "Not set"}
                  </Text>
                </View>

                <View className="mb-6">
                  <Text className="text-gray-700 font-bold mb-2">District</Text>
                  <Text className="text-lg bg-white rounded-xl p-3">
                    {userProfile?.data?.district || "Not set"}
                  </Text>
                </View>
              </>
            )}


            {/* Save Button */}
            {isEditing && (
              <TouchableOpacity
                className="bg-[#7ddd7d] p-4 rounded-xl items-center mt-4"
                onPress={handleSave}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <Loader small white />
                ) : (
                  <Text className="text-white font-bold text-lg">Save Changes</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidinWrapper>

      {/* OTP Verification Modal */}
      <OtpVerificationModal
        visible={showOtpModal}
        onClose={() => {
          setShowOtpModal(false);
          setIsSecondPhone(false);
        }}
        onVerify={handleVerifyOtp}
        target={otpTarget === "email" ? tempValue : `+${tempValue}`}
      />
    </SafeAreaView>
  );
};

export default Account;
