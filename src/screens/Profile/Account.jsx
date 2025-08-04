import React, { useState, useEffect,useCallback  } from "react";
import { useFocusEffect } from '@react-navigation/native';
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
import { AntDesign, EvilIcons, Ionicons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import Avatar from "../../images/Avatar.png";
import AddSecondPhoneModal from '../../components/AddSecondPhoneModal'; 
import KeyboardAvoidinWrapper from "../../components/KeyboardAvoidinWrapper";
import { 
  sendPushNotification,
  sendPushTokenToBackend,
  registerForPushNotificationsAsync
} from '../../services/notificationService';
import {
  useGetUserProfileQuery,
  useUpdateProfileMutation,
  useSendOtpMutation,
  useVerifyOtpMutation,
  useAddSecondPhoneMutation,
  useSendSecondPhoneOtpMutation,
  useVerifySecondPhoneOtpMutation,
  useSendProfilePictureMutation ,
} from "../../services/Auth/authAPI";
import { useNavigation } from "@react-navigation/native";
import Loader from "../../components/Loader";
import Toast from "react-native-toast-message";
import { useTranslation } from 'react-i18next';
import OtpVerificationModal from "../../components/OtpVerificationModal";
import { useSendNotificationMutation } from "../../services/Notification/notificationApi";
import { TypesNotification } from "../../utils/constants";
import { getFCMToken } from "../../services/Notification/firebaseNotifications";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const Account = () => {
  const navigation = useNavigation();
    const { t } = useTranslation();

  const { data: userProfile, isLoading, error, refetch } = useGetUserProfileQuery();
 
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [
  addSecondPhone, 
  { isLoading: isAddingPhone }
] = useAddSecondPhoneMutation();

const [
  sendSecondPhoneOtp, 
  { isLoading: isSendingOtp }
] = useSendSecondPhoneOtpMutation();

const [
  verifySecondPhoneOtp, 
  { isLoading: isVerifyingOtp }
] = useVerifySecondPhoneOtpMutation();
  const [showSecondPhoneModal, setShowSecondPhoneModal] = useState(false);
  const [secondPhoneNumber, setSecondPhoneNumber] = useState('');

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
  const [sendNotification] = useSendNotificationMutation();
  const [sendProfilePicture] = useSendProfilePictureMutation();
  const handleSendNotification = async () => {
    try {
      const notificationPayload = {
        token: await registerForPushNotificationsAsync(),
        title: 'Informations de compte modifiées',
        body: 'Les informations de votre compte ont été modifiées avec succès.',
        type: TypesNotification.SUCCESS_MODIFY_ACCOUNT_INFORMATIONS
      };
      await sendNotification(notificationPayload).unwrap();
    } catch (err) {
      console.error('Erreur lors de l’envoi:', err);
    }
  };
  useFocusEffect(
    useCallback(() => {
      refetch(); // force une requête au backend
    }, [])
  );

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
      picture: userProfile.data.picture 
        ? { uri: userProfile.data.picture } 
        : null,
    };
    setFormData(profileData);
    setOriginalData(profileData);
  }
}, [userProfile]);
    

const handleSave = async () => {
  try {
    const requiredFields = ['firstname', 'lastname', 'phone', 'email'];
    const missingFields = requiredFields.filter(field => !formData[field]);

    if (missingFields.length > 0) {
      Toast.show({
        type: "error",
        text1: "Missing information",
        text2: `Please fill in: ${missingFields.join(', ')}`,
      });
      return;
    }

    // Step 1: Send profile fields (text only)
    const profileResponse = await updateProfile({
      userId: userProfile.data.id,
      firstname: formData.firstname,
      lastname: formData.lastname,
      phone: formData.phone,
      email: formData.email,
      profession: formData.profession || '',
      region: formData.region || '',
      city: formData.city || '',
      district: formData.district || '',
    }).unwrap();

    // Step 2: If a new picture is selected, send it separately
    if (
      formData.picture &&
      formData.picture.uri &&
      formData.picture.uri !== originalData.picture?.uri
    ) {
      const imageData = new FormData();
      imageData.append('picture', {
        uri: formData.picture.uri,
        name: formData.picture.name || `profile_${Date.now()}.png`,
        type: formData.picture.type || 'image/png',
      });

      await sendProfilePicture(imageData).unwrap();
    }

    // Success Toast
    Toast.show({
      type: "success",
      text1: "Profile updated",
      text2: "Your changes have been saved",
    });

    await handleSendNotification();
    await refetch();
    setIsEditing(false);

  } catch (error) {
    console.error("Update error:", error);
    Toast.show({
      type: "error",
      text1: "Update failed",
      text2: error?.message || error?.data?.message || "Please try again",
    });
  }
};

  
  const pickImage = async () => {
  try {
    // Request permissions
    const [libraryPermission, cameraPermission] = await Promise.all([
      ImagePicker.requestMediaLibraryPermissionsAsync(),
      ImagePicker.requestCameraPermissionsAsync()
    ]);

    if (!libraryPermission.granted || !cameraPermission.granted) {
      Toast.show({
        type: "error",
        text1: "Permission required",
        text2: "Please enable camera and gallery access in settings",
      });
      return;
    }

    // Launch image picker (using compatible mediaTypes syntax)
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // Use the correct property
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    const selectedImage = result.assets[0];
    
    // Check file size using FileSystem
    const fileInfo = await FileSystem.getInfoAsync(selectedImage.uri, { size: true });
    if (fileInfo.size > MAX_FILE_SIZE) {
      Toast.show({
        type: "error",
        text1: "File too large",
        text2: "Please select an image smaller than 5MB",
      });
      return;
    }

    // Generate unique filename
    const filename = selectedImage.uri.split('/').pop();
    const fileExtension = filename?.split('.').pop() || 'jpg'; // Fallback extension
    const uniqueFilename = `${Date.now()}.${fileExtension}`;

    // Prepare image data for upload
    const imageData = {
      uri: selectedImage.uri,
      name: uniqueFilename,
      type: `image/${fileExtension}`,
    };

    // Update form data with new image
    setFormData(prev => ({
      ...prev,
      picture: imageData
    }));

    Toast.show({
      type: "success",
      text1: "Image selected",
      text2: "Don't forget to save your changes",
    });

  } catch (error) {
    console.error("Image picker error:", error);
    Toast.show({
      type: "error",
      text1: "Error",
      text2: "Failed to select image",
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
    setShowSecondPhoneModal(true);
  };

  const handleSendSecondPhoneOtp = async (phone) => {
  try {
    // First check if the phone can be added
    await addSecondPhone({ phone }).unwrap();
    
    // Then send OTP to the phone
    await sendSecondPhoneOtp({ phone }).unwrap();
    
    setSecondPhoneNumber(phone);
    Toast.show({
      type: 'success',
      text1: 'OTP Sent',
      text2: `OTP sent to ${phone}`,
    });
  } catch (err) {
    console.error('OTP send error:', err);
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: err?.data?.message || 'Failed to send OTP',
    });
    throw err;
  }
};

const handleVerifySecondPhoneOtp = async ({ phone, code }) => {
  try {
    // Verify the OTP
    const response = await verifySecondPhoneOtp({ phone, code }).unwrap();
    
    // Determine which success notification to show based on the response
    const isNewAddition = response?.isNewAddition || false;
    
    // Prepare success notification
    const notificationContent = {
      title: isNewAddition 
        ? "Second Phone Number Added" 
        : "Phone Verification Successful",
      body: isNewAddition
        ? `Your second phone number ${phone} has been successfully added to your account`
        : `Your second phone number ${phone} has been verified`,
      type: isNewAddition 
        ? "SUCCESS_ADD_SECOND_NUMBER" 
        : "SUCCESS_VERIFY_SECOND_NUMBER"
    };

    try {
      // Try remote notification first
      let pushToken = await getStoredPushToken();
      if (!pushToken) {
        pushToken = await registerForPushNotificationsAsync();
      }
      
      if (pushToken) {
        await sendPushTokenToBackend(
          pushToken,
          notificationContent.title,
          notificationContent.body,
          notificationContent.type,
          { 
            phoneNumber: phone,
            timestamp: new Date().toISOString() 
          }
        );
      }
    } catch (notificationError) {
      console.warn("Remote notification failed:", notificationError);
      // Fallback to local notification
      await sendPushNotification(
        notificationContent.title,
        notificationContent.body,
        {
          data: {
            type: notificationContent.type,
            phoneNumber: phone
          }
        }
      );
    }

    // Show toast with appropriate message
    Toast.show({
      type: 'success',
      text1: 'Success',
      text2: isNewAddition
        ? 'Second phone number added successfully'
        : 'Second phone number verified successfully',
    });
    
    // Refresh user data
    await refetch();
    
  } catch (err) {
    // Error notification
    const errorNotification = {
      title: "Verification Failed",
      body: err?.data?.message || 'Failed to verify phone number',
      type: "VERIFICATION_ERROR",
      data: {
        phoneNumber: phone,
        errorCode: err?.data?.code || 'UNKNOWN_ERROR'
      }
    };
    
    try {
      await sendPushNotification(
        errorNotification.title,
        errorNotification.body,
        {
          data: errorNotification.data
        }
      );
    } catch (pushError) {
      console.error('Failed to send error notification:', pushError);
    }
    
    console.error('Verification error:', err);
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: err?.data?.message || 'Failed to verify OTP',
    });
    throw err;
  }
};

  return (
    <SafeAreaView className="flex-1 bg-[#181e25]">
      <StatusBar style="light" backgroundColor="#fffff" />
       {/* Floating Home Button */}
        <TouchableOpacity 
          onPress={() => navigation.navigate('MainTabs')}
          style={styles.floatingHomeButton}
        >
          <Ionicons name="home" size={44} color="#7ddd7d" />
        </TouchableOpacity>

      <KeyboardAvoidinWrapper>
        <View className="flex-1 p-6">
          <View className="flex-row justify-between items-center mb-6">
             <Text className="text-white text-2xl font-bold">{t('account.title')}</Text>
            <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
              <AntDesign name={isEditing ? "close" : "edit"} size={24} color="white" />
            </TouchableOpacity>
          </View>

          <View className="items-center mb-8">
            <Image
                source={
                    formData.picture?.uri 
                      ? { uri: formData.picture.uri }
                      : userProfile?.data?.picture
                        ? { uri: userProfile.data.picture }
                        : require('../../images/Avatar.png')
                  }
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
              <Text className="text-gray-700 font-bold mb-2">{t('account.fullName')}</Text>
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

              {/* Phone Number Section */}
            <View className="mb-6">
              <Text className="text-gray-700 font-bold mb-2">{t('account.phoneNumber')}</Text>
              {isEditing ? (
                <>
                  <TextInput
                    value={formData.phone}
                    onChangeText={(text) => handleFieldChange("phone", text)}
                    keyboardType="phone-pad"
                    placeholder="Phone Number"
                    className="bg-white rounded-xl p-3 mb-2"
                  />
                  {userProfile?.data?.secondPhoneNumber ? (
                    <View className="mt-2">
                      <Text className="text-gray-700 font-bold mb-2">{t('account.secondPhone')}</Text>
                      <View className="flex-row items-center">
                        <Text className="flex-1 text-lg bg-white rounded-xl p-3">
                          {userProfile.data.secondPhoneNumber.phone}
                        </Text>
                        <TouchableOpacity 
                          className="ml-2 p-2 bg-red-500 rounded-lg"
                          onPress={() => {/* Add remove functionality here */}}
                        >
                          <Text className="text-white">{t('account.remove')}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={handleAddSecondPhone}
                      className="bg-green-500 p-2 rounded-lg items-center"
                    >
                      <Text className="text-white">{t('account.addSecondPhone')}</Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <>
                  <Text className="text-lg bg-white rounded-xl p-3">
                    {userProfile?.data?.phone || "Loading..."}
                  </Text>
                  {userProfile?.data?.secondPhoneNumber && (
                    <>
                      <Text className="text-gray-700 font-bold mb-2 mt-2">{t('account.secondPhone')}</Text>
                      <Text className="text-lg bg-white rounded-xl p-3">
                        {userProfile.data.secondPhoneNumber.phone}
                      </Text>
                    </>
                  )}
                </>
              )}
            </View>

            {/* Email */}
            <View className="mb-6">
              <Text className="text-gray-700 font-bold mb-2">{t('account.email')}</Text>
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
                  <Text className="text-gray-700 font-bold mb-2">{t('account.profession')}</Text>
                  <Text className="text-lg bg-white rounded-xl p-3">
                    {userProfile?.data?.profession || "Not set"}
                  </Text>
                </View>

                <View className="mb-6">
                  <Text className="text-gray-700 font-bold mb-2">{t('account.region')}</Text>
                  <Text className="text-lg bg-white rounded-xl p-3">
                    {userProfile?.data?.region || "Not set"}
                  </Text>
                </View>

                <View className="mb-6">
                  <Text className="text-gray-700 font-bold mb-2">{t('account.city')}</Text>
                  <Text className="text-lg bg-white rounded-xl p-3">
                    {userProfile?.data?.city || "Not set"}
                  </Text>
                </View>

                <View className="mb-6">
                  <Text className="text-gray-700 font-bold mb-2">{t('account.district')}</Text>
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
                  <Text className="text-white font-bold text-lg">{t('account.saveChanges')}</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidinWrapper>

      {/* Second Phone Modal */}
      <AddSecondPhoneModal
        visible={showSecondPhoneModal}
        onClose={() => {
          setShowSecondPhoneModal(false);
          setSecondPhoneNumber('');
        }}
        onSendOtp={handleSendSecondPhoneOtp}
        onVerifyOtp={handleVerifySecondPhoneOtp}
        isLoading={isAddingPhone || isSendingOtp || isVerifyingOtp}
      />
    </SafeAreaView>
  );
};
const styles = {
  floatingHomeButton: {
    position: "absolute",
    bottom: 24,
    right: 24,
    backgroundColor: "#1A1A1A",
    padding: 10,
    borderRadius: 50,
    elevation: 10,
  },
 
};
export default Account;
