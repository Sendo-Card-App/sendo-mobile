import React, { useState, useEffect, useCallback, useRef } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { 
  View,
  Text,
  Image,
  Platform,
  TextInput,
  TouchableOpacity,
  StatusBar,
  Animated,
  Easing,
  ScrollView,
  Dimensions
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AntDesign, EvilIcons, Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { File } from 'expo-file-system';
import DateTimePicker from '@react-native-community/datetimepicker';
import AddSecondPhoneModal from '../../components/AddSecondPhoneModal'; 
import KeyboardAvoidinWrapper from "../../components/KeyboardAvoidinWrapper";
import {
  useGetUserProfileQuery,
  useGetProfilePictureQuery,
  useUpdateProfileMutation,
  useAddSecondPhoneMutation,
  useSendSecondPhoneOtpMutation,
  useVerifySecondPhoneOtpMutation,
  useSendProfilePictureMutation,
} from "../../services/Auth/authAPI";
import { useNavigation } from "@react-navigation/native";
import Loader from "../../components/Loader";
import Toast from "react-native-toast-message";
import { useTranslation } from 'react-i18next';
import OtpVerificationModal from "../../components/OtpVerificationModal";
import { useSendNotificationMutation } from "../../services/Notification/notificationApi";
import { TypesNotification } from "../../utils/constants";
import { useAppState } from '../../context/AppStateContext';

const { width, height } = Dimensions.get('window');
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const Account = () => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const { setIsPickingDocument } = useAppState();

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const profileImageScale = useRef(new Animated.Value(1)).current;
  const cardAnimations = useRef([]).current;

  const { data: userProfile, isLoading, error, refetch } = useGetUserProfileQuery(
    undefined,
    { pollingInterval: 1000 }
  );

  const userId = userProfile?.data?.user?.id;
  
  const { data: profilePicture, isLoading: isPictureLoading } = useGetProfilePictureQuery(
    userId,
    { pollingInterval: 1000, skip: !userId }
  );
 
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [addSecondPhone, { isLoading: isAddingPhone }] = useAddSecondPhoneMutation();
  const [sendSecondPhoneOtp, { isLoading: isSendingOtp }] = useSendSecondPhoneOtpMutation();
  const [verifySecondPhoneOtp, { isLoading: isVerifyingOtp }] = useVerifySecondPhoneOtpMutation();
  const [sendProfilePicture, { isLoading: isUploadingPicture }] = useSendProfilePictureMutation();
  
  const [showSecondPhoneModal, setShowSecondPhoneModal] = useState(false);
  const [secondPhoneNumber, setSecondPhoneNumber] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    phone: "",
    email: "",
    profession: "",
    region: "",
    city: "",
    district: "",
    address: "",
    dateOfBirth: "",
    placeOfBirth: "",
    picture: null,
  });
  const [originalData, setOriginalData] = useState({});
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpTarget, setOtpTarget] = useState(null);
  const [tempValue, setTempValue] = useState("");
  const [isSecondPhone, setIsSecondPhone] = useState(false);
  const [sendNotification] = useSendNotificationMutation();

  // Initialize animations
  if (cardAnimations.length === 0) {
    for (let i = 0; i < 15; i++) {
      cardAnimations.push(new Animated.Value(0));
    }
  }

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

useEffect(() => {
  if (userProfile?.data?.user) {
    const user = userProfile.data.user;
    console.log('Raw user date from backend:', user.dateOfBirth); // Debug log
    
    const profileData = {
      firstname: user.firstname || "",
      lastname: user.lastname || "",
      phone: user.phone || "",
      email: user.email || "",
      profession: user.profession || "",
      region: user.region || "",
      city: user.city || "",
      district: user.district || "",
      address: user.address || "",
      dateOfBirth: user.dateOfBirth || "", // Keep as is from backend
      placeOfBirth: user.placeOfBirth || "",
      picture: user.picture 
        ? { uri: user.picture } 
        : null,
    };
    
    console.log('Profile data set:', profileData.dateOfBirth); // Debug log
    setFormData(profileData);
    setOriginalData(profileData);
  }
}, [userProfile]);

  useEffect(() => {
    // Animate content on mount
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Animate cards with stagger
    const cardAnimationsTiming = cardAnimations.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        delay: 400 + index * 80,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      })
    );

    Animated.stagger(80, cardAnimationsTiming).start();
  }, []);

  const animateProfileImage = () => {
    Animated.sequence([
      Animated.timing(profileImageScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(profileImageScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

    const formatDate = (date) => {
      if (!date) return "Not set";
      
      // If it's already a string, return it as is (DD/MM/YYYY)
      if (typeof date === 'string') {
        return date;
      }
      
      // If it's a Date object, format it to DD/MM/YYYY
      if (date instanceof Date) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      }
      
      return "Not set";
    };

 const handleDateChange = (event, selectedDate) => {
  setShowDatePicker(false);
  if (selectedDate) {
    // Format date as DD/MM/YYYY for backend
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const year = selectedDate.getFullYear();
    const formattedDate = `${day}/${month}/${year}`;
    
    console.log('Date changed to:', formattedDate); // Debug log
    
    setFormData(prev => ({
      ...prev,
      dateOfBirth: formattedDate
    }));
  }
};

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

    // Check each field for changes and log them
    console.log('=== Checking for changes ===');
    console.log('Original data:', originalData);
    console.log('Current form data:', formData);
    
    const hasProfileChanges = Object.keys(formData).some(key => {
      if (key === 'picture') return false;
      
      const original = originalData[key];
      const current = formData[key];
      
      // Special handling for date comparison
      if (key === 'dateOfBirth') {
        const hasChanged = original !== current;
        if (hasChanged) {
          console.log(`Date changed from "${original}" to "${current}"`);
        }
        return hasChanged;
      }
      
      const hasChanged = original !== current;
      if (hasChanged) {
        console.log(`Field "${key}" changed from "${original}" to "${current}"`);
      }
      return hasChanged;
    });

    console.log('Has profile changes:', hasProfileChanges);

    if (hasProfileChanges) {
      // Prepare profile data for update
      const profileUpdateData = {
        firstname: formData.firstname,
        lastname: formData.lastname,
        phone: formData.phone,
        email: formData.email,
        profession: formData.profession || '',
        region: formData.region || '',
        city: formData.city || '',
        district: formData.district || '',
        address: formData.address || '',
        placeOfBirth: formData.placeOfBirth || '',
        dateOfBirth: formData.dateOfBirth || '',
      };

      console.log('Sending to backend:', profileUpdateData);

      const response = await updateProfile({
        userId: userId,
        ...profileUpdateData
      }).unwrap();
      
      console.log('Update response:', response);
    } else {
      console.log('No profile changes detected');
    }

    // Then upload picture if changed
    if (formData.picture && formData.picture.uri && 
        (!originalData.picture || formData.picture.uri !== originalData.picture.uri)) {
      
      console.log('Uploading picture...');
      const imageFormData = new FormData();
      
      const uriParts = formData.picture.uri.split('.');
      const fileType = uriParts[uriParts.length - 1];
      
      imageFormData.append('picture', {
        uri: formData.picture.uri,
        name: formData.picture.name || `profile_${Date.now()}.${fileType}`,
        type: formData.picture.type || `image/${fileType}`,
      });

      await sendProfilePicture(imageFormData).unwrap();
      console.log('Picture uploaded');
    }

    Toast.show({
      type: "success",
      text1: "Profile updated",
      text2: "Your changes have been saved",
    });

    await refetch();
    setIsEditing(false);

  } catch (error) {
    console.log('Failed to update profile:', JSON.stringify(error, null, 2));
    Toast.show({
      type: "error",
      text1: "Update failed",
      text2: error?.data?.message || error?.message || "Please try again",
    });
  }
};

const pickImage = async () => {
  try {
    setIsPickingDocument(true);
    
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
      setIsPickingDocument(false);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) {
      setIsPickingDocument(false);
      return;
    }

    const selectedImage = result.assets[0];
    
    // ✅ Correct way: Create a File instance from expo-file-system
    const file = new File(selectedImage.uri);
    
    // Get file info using the File instance methods
    const fileInfo = await file.info();
    
    // Check if file exists and get its size
    if (fileInfo.exists && fileInfo.size > MAX_FILE_SIZE) {
      Toast.show({
        type: "error",
        text1: "File too large",
        text2: "Please select an image smaller than 5MB",
      });
      setIsPickingDocument(false);
      return;
    }

    const filename = selectedImage.uri.split('/').pop();
    const fileExtension = filename?.split('.').pop() || 'jpg';

    const imageData = {
      uri: selectedImage.uri,
      name: `profile_${Date.now()}.${fileExtension}`,
      type: `image/${fileExtension}`,
    };

    setFormData(prev => ({
      ...prev,
      picture: imageData
    }));

    animateProfileImage();
    setIsPickingDocument(false);

    Toast.show({
      type: "success",
      text1: "Image selected",
      text2: "Don't forget to save your changes",
    });

  } catch (error) {
    console.error("Image picker error:", error);
    setIsPickingDocument(false);
    Toast.show({
      type: "error",
      text1: "Error",
      text2: "Failed to select image",
    });
  }
};

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddSecondPhone = () => {
    setShowSecondPhoneModal(true);
  };

  const handleSendSecondPhoneOtp = async (phone) => {
    try {
      const addResponse = await addSecondPhone({ phone }).unwrap();
      const otpResponse = await sendSecondPhoneOtp({ phone }).unwrap();

      setSecondPhoneNumber(phone);
      Toast.show({
        type: 'success',
        text1: 'OTP Sent',
        text2: `OTP sent to ${phone}`,
      });
    } catch (err) {
      console.error("OTP send error:", JSON.stringify(err, null, 2));
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err?.data?.message || "Failed to send OTP",
      });
      throw err;
    }
  };

  const handleVerifySecondPhoneOtp = async ({ phone, code }) => {
    try {
      const response = await verifySecondPhoneOtp({ phone, code }).unwrap();
      const isNewAddition = response?.isNewAddition || false;

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: isNewAddition
          ? `Second phone number ${phone} added successfully`
          : `Second phone number ${phone} verified successfully`,
      });

      await refetch();

    } catch (err) {
      console.error('Verification error:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err?.data?.message || 'Failed to verify OTP',
      });
      throw err;
    }
  };

  const renderAnimatedCard = (index, children) => {
    const animatedStyle = {
      opacity: cardAnimations[index],
      transform: [
        { 
          translateY: cardAnimations[index].interpolate({
            inputRange: [0, 1],
            outputRange: [30, 0]
          })
        },
        {
          scale: cardAnimations[index].interpolate({
            inputRange: [0, 1],
            outputRange: [0.95, 1]
          })
        }
      ]
    };

    return (
      <Animated.View style={animatedStyle}>
        {children}
      </Animated.View>
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-[#181e25] justify-center items-center">
        <Loader size="large" />
        <Text className="text-white mt-4 text-lg">Loading profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#181e25]">
      <StatusBar 
        backgroundColor="transparent" 
        barStyle="light-content" 
        translucent={true}
      />
      
      {/* Animated Header */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim }
          ]
        }}
        className="bg-[#7ddd7d] pt-12 pb-6 px-6 rounded-b-3xl shadow-2xl"
      >
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="w-12 h-12 bg-white/20 rounded-2xl items-center justify-center shadow-lg"
            activeOpacity={0.7}
          >
            <AntDesign name="left" size={20} color="white" />
          </TouchableOpacity>
          
          <Text className="text-white text-2xl font-bold text-center flex-1 mx-4">
            {t('screens.account')}
          </Text>
          
          <TouchableOpacity 
            onPress={() => setIsEditing(!isEditing)}
            className="w-12 h-12 bg-white/20 rounded-2xl items-center justify-center shadow-lg"
            activeOpacity={0.7}
          >
            <AntDesign name={isEditing ? "close" : "edit"} size={20} color="white" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      <KeyboardAvoidinWrapper>
        <ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          <View className="p-6">
            {/* Profile Image Section */}
            {renderAnimatedCard(0, (
              <View className="items-center mb-8">
                <Animated.View
                  style={{
                    transform: [{ scale: profileImageScale }]
                  }}
                >
                  <Image
                    source={
                      formData.picture?.uri
                        ? { uri: formData.picture.uri }
                        : profilePicture?.data?.user?.link
                          ? { uri: `${profilePicture.data.user.link}?t=${userProfile?.data?.user?.updatedAt}` }
                          : require('../../images/Avatar.png')
                    }
                    className="w-36 h-36 rounded-full border-4 border-[#7ddd7d] shadow-2xl"
                  />
                </Animated.View>

                {isEditing && (
                  <TouchableOpacity
                    className="absolute bottom-2 right-20 bg-[#7ddd7d] rounded-full p-3 shadow-2xl"
                    onPress={pickImage}
                    disabled={isUploadingPicture}
                    activeOpacity={0.8}
                  >
                    {isUploadingPicture ? (
                      <Loader small white />
                    ) : (
                      <EvilIcons name="camera" size={28} color="white" />
                    )}
                  </TouchableOpacity>
                )}
              </View>
            ))}

            {/* Profile Form */}
            <View className="bg-white rounded-3xl p-6 shadow-2xl">
              {/* Full Name */}
              {renderAnimatedCard(1, (
                <View className="mb-6">
                  <View className="flex-row items-center mb-3">
                    <MaterialIcons name="person" size={20} color="#7ddd7d" />
                    <Text className="text-gray-800 font-bold text-lg ml-2">
                      {t('account.fullName')}
                    </Text>
                  </View>
                  {isEditing ? (
                    <View className="flex-row space-x-3">
                      <TextInput
                        value={formData.firstname}
                        onChangeText={(text) => handleFieldChange("firstname", text)}
                        placeholder="First Name"
                        className="flex-1 bg-gray-50 rounded-2xl p-4 border border-gray-200 text-gray-800"
                        placeholderTextColor="#9CA3AF"
                      />
                      <TextInput
                        value={formData.lastname}
                        onChangeText={(text) => handleFieldChange("lastname", text)}
                        placeholder="Last Name"
                        className="flex-1 bg-gray-50 rounded-2xl p-4 border border-gray-200 text-gray-800"
                        placeholderTextColor="#9CA3AF"
                      />
                    </View>
                  ) : (
                    <View className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                      <Text className="text-gray-800 text-lg">
                        {userProfile?.data?.user ? 
                          `${userProfile.data.user.firstname} ${userProfile.data.user.lastname}` : 
                          "Data not available"}
                      </Text>
                    </View>
                  )}
                </View>
              ))}

              {/* Phone Number Section */}
              {renderAnimatedCard(2, (
                <View className="mb-6">
                  <View className="flex-row items-center mb-3">
                    <MaterialIcons name="phone" size={20} color="#7ddd7d" />
                    <Text className="text-gray-800 font-bold text-lg ml-2">
                      {t('account.phoneNumber')}
                    </Text>
                  </View>
                  {isEditing ? (
                    <>
                      <TextInput
                        value={formData.phone}
                        onChangeText={(text) => handleFieldChange("phone", text)}
                        keyboardType="phone-pad"
                        placeholder="Phone Number"
                        className="bg-gray-50 rounded-2xl p-4 border border-gray-200 text-gray-800 mb-3"
                        placeholderTextColor="#9CA3AF"
                      />
                      {userProfile?.data?.user?.secondPhoneNumber ? (
                        <View className="mt-3 p-4 bg-green-50 rounded-2xl border border-green-200">
                          <Text className="text-green-800 font-semibold mb-1">
                            {t('account.secondPhone')}
                          </Text>
                          <Text className="text-green-700">
                            {userProfile.data.user.secondPhoneNumber.phone}
                          </Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          onPress={handleAddSecondPhone}
                          className="bg-[#7ddd7d] p-4 rounded-2xl flex-row items-center justify-center shadow-lg"
                          activeOpacity={0.8}
                        >
                          <Ionicons name="add-circle-outline" size={20} color="white" />
                          <Text className="text-white font-semibold text-lg ml-2">
                            {t('account.addSecondPhone')}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </>
                  ) : (
                    <>
                      <View className="bg-gray-50 rounded-2xl p-4 border border-gray-200 mb-3">
                        <Text className="text-gray-800 text-lg">
                          {userProfile?.data?.user?.phone || "Loading..."}
                        </Text>
                      </View>
                      {userProfile?.data?.user?.secondPhoneNumber && (
                        <View className="p-4 bg-green-50 rounded-2xl border border-green-200">
                          <Text className="text-green-800 font-semibold mb-1">
                            {t('account.secondPhone')}
                          </Text>
                          <Text className="text-green-700">
                            {userProfile.data.user.secondPhoneNumber.phone}
                          </Text>
                        </View>
                      )}
                    </>
                  )}
                </View>
              ))}

              {/* Email */}
              {renderAnimatedCard(3, (
                <View className="mb-6">
                  <View className="flex-row items-center mb-3">
                    <MaterialIcons name="email" size={20} color="#7ddd7d" />
                    <Text className="text-gray-800 font-bold text-lg ml-2">
                      {t('account.email')}
                    </Text>
                  </View>
                  {isEditing ? (
                    <TextInput
                      value={formData.email}
                      onChangeText={(text) => handleFieldChange("email", text)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholder="Email"
                      className="bg-gray-50 rounded-2xl p-4 border border-gray-200 text-gray-800"
                      placeholderTextColor="#9CA3AF"
                    />
                  ) : (
                    <View className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                      <Text className="text-gray-800 text-lg">
                        {userProfile?.data?.user?.email || "Loading..."}
                      </Text>
                    </View>
                  )}
                </View>
              ))}

              {/* Address */}
              {renderAnimatedCard(4, (
                <View className="mb-6">
                  <View className="flex-row items-center mb-3">
                    <MaterialIcons name="location-on" size={20} color="#7ddd7d" />
                    <Text className="text-gray-800 font-bold text-lg ml-2">
                      Address
                    </Text>
                  </View>
                  {isEditing ? (
                    <TextInput
                      value={formData.address}
                      onChangeText={(text) => handleFieldChange("address", text)}
                      placeholder="Address"
                      className="bg-gray-50 rounded-2xl p-4 border border-gray-200 text-gray-800"
                      placeholderTextColor="#9CA3AF"
                    />
                  ) : (
                    <View className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                      <Text className="text-gray-800 text-lg">
                        {userProfile?.data?.user?.address || "Not set"}
                      </Text>
                    </View>
                  )}
                </View>
              ))}

              {/* Date of Birth */}
            {renderAnimatedCard(5, (
              <View className="mb-6">
                <View className="flex-row items-center mb-3">
                  <MaterialIcons name="cake" size={20} color="#7ddd7d" />
                  <Text className="text-gray-800 font-bold text-lg ml-2">
                    {t("signup.DOB")}
                  </Text>
                </View>
                {isEditing ? (
                  <>
                    <TouchableOpacity
                      onPress={() => setShowDatePicker(true)}
                      className="bg-gray-50 rounded-2xl p-4 border border-gray-200"
                    >
                      <Text className={`text-lg ${formData.dateOfBirth ? 'text-gray-800' : 'text-gray-400'}`}>
                        {formData.dateOfBirth ? formatDate(formData.dateOfBirth) : "Select date of birth"}
                      </Text>
                    </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker
                      value={(() => {
                        // If we have a date of birth, use it
                        if (formData.dateOfBirth) {
                          // If it's a string in DD/MM/YYYY format
                          if (typeof formData.dateOfBirth === 'string' && formData.dateOfBirth.includes('/')) {
                            const [day, month, year] = formData.dateOfBirth.split('/');
                            return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                          }
                          // If it's already a Date object, use it
                          if (formData.dateOfBirth instanceof Date) {
                            return formData.dateOfBirth;
                          }
                        }
                        // If no valid date of birth, use a default date
                        return new Date(2000, 0, 1);
                      })()}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={handleDateChange}
                      maximumDate={new Date()}
                    />
                  )}
                  </>
                ) : (
                  <View className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                    <Text className="text-gray-800 text-lg">
                      {userProfile?.data?.user?.dateOfBirth || "Not set"}
                    </Text>
                  </View>
                )}
              </View>
            ))}

              {/* Place of Birth */}
              {renderAnimatedCard(6, (
                <View className="mb-6">
                  <View className="flex-row items-center mb-3">
                    <MaterialIcons name="place" size={20} color="#7ddd7d" />
                    <Text className="text-gray-800 font-bold text-lg ml-2">
                     {t("signup.pob")}
                    </Text>
                  </View>
                  {isEditing ? (
                    <TextInput
                      value={formData.placeOfBirth}
                      onChangeText={(text) => handleFieldChange("placeOfBirth", text)}
                      placeholder="Place of birth"
                      className="bg-gray-50 rounded-2xl p-4 border border-gray-200 text-gray-800"
                      placeholderTextColor="#9CA3AF"
                    />
                  ) : (
                    <View className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                      <Text className="text-gray-800 text-lg">
                        {userProfile?.data?.user?.placeOfBirth || "Not set"}
                      </Text>
                    </View>
                  )}
                </View>
              ))}

        
              {/* Additional Fields */}
                {isEditing ? (
                  <>
                    {renderAnimatedCard(7, (
                      <View className="mb-4">
                        <Text className="text-gray-700 font-semibold mb-2 ml-1">
                          {t('account.profession') || 'Profession'}
                        </Text>
                        <TextInput
                          placeholder={t('account.enterProfession') || "Enter profession"}
                          value={formData.profession}
                          onChangeText={(text) => handleFieldChange("profession", text)}
                          className="bg-gray-50 rounded-2xl p-4 border border-gray-200 text-gray-800"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                    ))}
                    
                    {renderAnimatedCard(8, (
                      <View className="mb-4">
                        <Text className="text-gray-700 font-semibold mb-2 ml-1">
                          {t('account.region') || 'Region'}
                        </Text>
                        <TextInput
                          placeholder={t('account.enterRegion') || "Enter region"}
                          value={formData.region}
                          onChangeText={(text) => handleFieldChange("region", text)}
                          className="bg-gray-50 rounded-2xl p-4 border border-gray-200 text-gray-800"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                    ))}
                    
                    {renderAnimatedCard(9, (
                      <View className="mb-4">
                        <Text className="text-gray-700 font-semibold mb-2 ml-1">
                          {t('account.city') || 'City'}
                        </Text>
                        <TextInput
                          placeholder={t('account.enterCity') || "Enter city"}
                          value={formData.city}
                          onChangeText={(text) => handleFieldChange("city", text)}
                          className="bg-gray-50 rounded-2xl p-4 border border-gray-200 text-gray-800"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                    ))}
                    
                    {renderAnimatedCard(10, (
                      <View className="mb-4">
                        <Text className="text-gray-700 font-semibold mb-2 ml-1">
                          {t('account.district') || 'District'}
                        </Text>
                        <TextInput
                          placeholder={t('account.enterDistrict') || "Enter district"}
                          value={formData.district}
                          onChangeText={(text) => handleFieldChange("district", text)}
                          className="bg-gray-50 rounded-2xl p-4 border border-gray-200 text-gray-800"
                          placeholderTextColor="#9CA3AF"
                        />
                      </View>
                    ))}
                  </>
                ) : (
                  <>
                    {['profession', 'region', 'city', 'district'].map((field, index) => (
                      <React.Fragment key={field}>
                        {renderAnimatedCard(11 + index, (
                          <View className="mb-6">
                            <Text className="text-gray-800 font-bold text-lg mb-2 capitalize">
                              {t(`account.${field}`) || field}
                            </Text>
                            <View className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
                              <Text className="text-gray-800 text-lg">
                                {userProfile?.data?.user?.[field] || "Not set"}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </React.Fragment>
                    ))}
                  </>
                )}

              {/* Save Button */}
              {isEditing && renderAnimatedCard(14, (
                <TouchableOpacity
                  className="bg-[#7ddd7d] p-5 rounded-2xl items-center shadow-2xl mt-6"
                  onPress={handleSave}
                  disabled={isUpdating || isUploadingPicture}
                  activeOpacity={0.8}
                >
                  {(isUpdating || isUploadingPicture) ? (
                    <Loader small white />
                  ) : (
                    <Text className="text-white font-bold text-xl">
                      {t('account.saveChanges')}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
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

export default Account;