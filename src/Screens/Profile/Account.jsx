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
  useVerifyOtpMutation
} from "../../services/Auth/authAPI";
import { useNavigation } from "@react-navigation/native";
import Loader from "../../components/Loader";
import Toast from "react-native-toast-message";
import OtpVerificationModal from "../../components/OtpVerificationModal";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const Account = () => {
  const navigation = useNavigation();
  
  // Fetch user profile
  const { 
    data: userProfile, 
    isLoading, 
    error, 
    refetch 
  } = useGetUserProfileQuery();
  
  useEffect(() => {
    if (userProfile) {
      console.log("User Profile Data:", userProfile);
    }
    if (isLoading) {
      console.log("Loading data...");
    }
    if (error) {
      console.log("Error fetching data:", error);
    }
  }, [userProfile, isLoading, error]);
  
  // Mutations
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [sendOtp] = useSendOtpMutation();
  const [verifyOtp] = useVerifyOtpMutation();

  // States
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    phone: "",
    email: "",
    cniFront: null,
    cniBack: null,
  });
  const [originalData, setOriginalData] = useState({});
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpTarget, setOtpTarget] = useState(null); // 'email' or 'phone'
  const [tempValue, setTempValue] = useState(""); // Stores new email/phone during OTP verification
       
  // Initialize form data
  useEffect(() => {
    if (userProfile) {
      const profileData = {
        firstname: userProfile.firstname || "", // Default to empty string if undefined
        lastname: userProfile.lastname || "",   // Default to empty string if undefined
        phone: userProfile.phone || "",
        email: userProfile.email || "",
        cniFront: userProfile.cniFront || null,
        cniBack: userProfile.cniBack || null,
      };
      setFormData(profileData);
      setOriginalData(profileData);
    }
  }, [userProfile]);

  // Handle image selection for CNI
  const pickImage = async (type) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: [ImagePicker.MediaTypeImages],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      const file = result.assets[0];
      
      // Check file size
      if (file.fileSize > MAX_FILE_SIZE) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "File size exceeds 5MB limit",
        });
        return;
      }

      // Check file type
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Only JPG, JPEG, and PNG files are allowed",
        });
        return;
      }

      setFormData(prev => ({
        ...prev,
        [type]: file
      }));
    }
  };

  // Handle OTP verification for email/phone changes
  const handleVerifyOtp = async (code) => {
    try {
      const response = await verifyOtp({ 
        [otpTarget]: tempValue, 
        code 
      }).unwrap();

      // Update the form data with the verified value
      setFormData(prev => ({
        ...prev,
        [otpTarget]: tempValue
      }));

      setShowOtpModal(false);
      Toast.show({
        type: "success",
        text1: "Success",
        text2: `${otpTarget === 'email' ? 'Email' : 'Phone'} verified successfully`,
      });
    } catch (err) {
      console.error("OTP Verification Error:", err);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: err?.data?.message || "Invalid OTP code",
      });
    }
  };

  // Handle save profile
  const handleSave = async () => {
    // Validate required fields
    if (!formData.firstname || !formData.lastname || !formData.phone || !formData.email) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "All fields are required",
      });
      return;
    }

    // Check if CNI is required (not already uploaded)
    if ((!formData.cniFront || !formData.cniBack) && (!originalData.cniFront || !originalData.cniBack)) {
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Please upload both sides of your CNI",
      });
      return;
    }

    try {
      // Prepare form data (including file uploads)
      const formDataToSend = new FormData();
      formDataToSend.append('firstname', formData.firstname);
      formDataToSend.append('lastname', formData.lastname);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('email', formData.email);
      
      if (formData.cniFront?.uri) {
        formDataToSend.append('cniFront', {
          uri: formData.cniFront.uri,
          type: formData.cniFront.type,
          name: `cniFront.${formData.cniFront.type.split('/')[1]}`,
        });
      }
      
      if (formData.cniBack?.uri) {
        formDataToSend.append('cniBack', {
          uri: formData.cniBack.uri,
          type: formData.cniBack.type,
          name: `cniBack.${formData.cniBack.type.split('/')[1]}`,
        });
      }

      // Send update request
      await updateProfile(formDataToSend).unwrap();

      Toast.show({
        type: "success",
        text1: "Success",
        text2: "Profile updated successfully",
      });
      
      setIsEditing(false);
      refetch();
    } catch (err) {
      console.error("Profile update error:", err);
      let errorMessage = "Failed to update profile";
      
      if (err.data?.message?.includes("email")) {
        errorMessage = "Email already in use";
      } else if (err.data?.message?.includes("phone")) {
        errorMessage = "Phone number already in use";
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

  // Handle field changes (with OTP verification for email/phone)
  const handleFieldChange = (field, value) => {
    if ((field === 'email' || field === 'phone') && 
        value !== originalData[field]) {
      setOtpTarget(field);
      setTempValue(value);
      
      // Send OTP to the new value
      sendOtp({ [field]: value })
        .unwrap()
        .then(() => {
          setShowOtpModal(true);
        })
        .catch(err => {
          console.error("OTP send error:", err);
          Toast.show({
            type: "error",
            text1: "Error",
            text2: `Failed to send OTP to new ${field}`,
          });
        });
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#181e25]">
      <StatusBar style="light" backgroundColor="#181e25" />
      
      <KeyboardAvoidinWrapper>
        <View className="flex-1 p-6">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-white text-2xl font-bold">My Account</Text>
            <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
              <AntDesign 
                name={isEditing ? "close" : "edit"} 
                size={24} 
                color="white" 
              />
            </TouchableOpacity>
          </View>

          {/* Profile Picture */}
          <View className="items-center mb-8">
            <Image
              source={userProfile?.avatar ? { uri: userProfile.avatar } : Avatar}
              className="w-32 h-32 rounded-full border-4 border-[#7ddd7d]"
            />
            {isEditing && (
              <TouchableOpacity 
                className="absolute bottom-0 right-0 bg-[#7ddd7d] rounded-full p-2"
                onPress={() => pickImage('avatar')}
              >
                <EvilIcons name="camera" size={24} color="white" />
              </TouchableOpacity>
            )}
          </View>

          {/* Profile Form */}
          <View className="bg-[#f1f1f1] rounded-2xl p-6">
            {/* Name Fields */}
            <View className="mb-6">
              <Text className="text-gray-700 font-bold mb-2">Full Name</Text>
              {isEditing ? (
                <View className="flex-row space-x-2">
                  <TextInput
                    value={formData.firstname}
                    onChangeText={(text) => handleFieldChange('firstname', text)}
                    placeholder="First Name"
                    className="flex-1 bg-white rounded-xl p-3"
                  />
                  <TextInput
                    value={formData.lastname}
                    onChangeText={(text) => handleFieldChange('lastname', text)}
                    placeholder="Last Name"
                    className="flex-1 bg-white rounded-xl p-3"
                  />
                </View>
              ) : (
                <Text className="text-lg bg-white rounded-xl p-3">
                  {userProfile ? `${userProfile.firstname} ${userProfile.lastname}` : "Data not available"}
                </Text>

              )}
            </View>

            {/* Phone Field */}
            <View className="mb-6">
              <Text className="text-gray-700 font-bold mb-2">Phone Number</Text>
              {isEditing ? (
                <TextInput
                  value={formData.phone}
                  onChangeText={(text) => handleFieldChange('phone', text)}
                  keyboardType="phone-pad"
                  placeholder="Phone Number"
                  className="bg-white rounded-xl p-3"
                />
              ) : (
                <Text className="text-lg bg-white rounded-xl p-3">
                  {userProfile?.phone || "Loading..."}
                </Text>
              )}
            </View>

            {/* Email Field */}
            <View className="mb-6">
              <Text className="text-gray-700 font-bold mb-2">Email</Text>
              {isEditing ? (
                <TextInput
                  value={formData.email}
                  onChangeText={(text) => handleFieldChange('email', text)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholder="Email"
                  className="bg-white rounded-xl p-3"
                />
              ) : (
                <Text className="text-lg bg-white rounded-xl p-3">
                  {userProfile?.email || "Loading..."}
                </Text>
              )}
            </View>

            {/* CNI Upload */}
            <View className="mb-6">
              <Text className="text-gray-700 font-bold mb-2">CNI Document</Text>
              <View className="flex-row justify-between">
                <TouchableOpacity 
                  className={`items-center p-3 rounded-xl ${isEditing ? 'bg-[#7ddd7d]' : 'bg-gray-200'}`}
                  onPress={() => isEditing && pickImage('cniFront')}
                  disabled={!isEditing}
                >
                  <Text className={isEditing ? 'text-white' : 'text-gray-500'}>
                    {formData.cniFront ? "Front Updated" : "Upload Front"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  className={`items-center p-3 rounded-xl ${isEditing ? 'bg-[#7ddd7d]' : 'bg-gray-200'}`}
                  onPress={() => isEditing && pickImage('cniBack')}
                  disabled={!isEditing}
                >
                  <Text className={isEditing ? 'text-white' : 'text-gray-500'}>
                    {formData.cniBack ? "Back Updated" : "Upload Back"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

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
        onClose={() => setShowOtpModal(false)}
        onVerify={handleVerifyOtp}
        target={otpTarget === 'email' ? tempValue : `+${tempValue}`}
        onResend={() => sendOtp({ [otpTarget]: tempValue })}
      />
    </SafeAreaView>
  );
};

export default Account;
