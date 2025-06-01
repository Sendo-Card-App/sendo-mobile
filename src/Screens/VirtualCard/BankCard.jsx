import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  Platform,
} from "react-native";
import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import AntDesign from "@expo/vector-icons/AntDesign";
import Entypo from "@expo/vector-icons/Entypo";
import Ionicons from "@expo/vector-icons/Ionicons";
import TopLogo from "../../Images/TopLogo.png";
import { useNavigation } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import EvilIcons from "@expo/vector-icons/EvilIcons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useTranslation } from 'react-i18next';

const BankCard = () => {
  const { t } = useTranslation();
  const [date, setDate] = useState(new Date());
  const [showDate, setShowDate] = useState(false);
  const navigation = useNavigation();

  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDate(Platform.OS === "ios");
    setDate(currentDate);
  };

  const showDatePicker = () => {
    setShowDate(true);
  };

  return (
    <View className="bg-[#181e25] flex-1 pt-0 relative">
      {/* The top logo in center of the screen */}
      <View className="absolute -top-12 left-0 right-0 items-center justify-center">
        <Image source={TopLogo} className="h-36 w-40" resizeMode="contain" />
      </View>

      {/* the top navigation with a back arrow and a right menu button */}
      <View className="border-b border-dashed border-white flex-row justify-between py-4 mt-10 items-center mx-5 pt-5">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="arrowleft" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* the middle heading */}
      <View className="border border-dashed border-gray-300 my-1" />
      <Text className="text-center text-white text-2xl my-3">
        {t('bankCard.title')}
      </Text>

      {/* the white formsection of the screen */}
      <ScrollView className="flex-1 gap-6 py-3 bg-white px-8 rounded-t-3xl">
        {/* Top security message */}
        <View className="flex-row gap-2 justify-center items-center mb-5">
          <MaterialIcons name="lock" size={15} color="#acacac" />
          <Text className="text-center text-gray-400 text-sm font-bold">
            {t('bankCard.secureMessage')}
          </Text>
        </View>

        {/* Card Name Input */}
        <View className="w-full border-b border-dashed pb-2 border-gray-400">
          <Text className="text-[#181e25] font-extrabold text-base">
            {t('bankCard.cardName')}
            <Text className="text-red-600 text-lg">*</Text>
          </Text>
          <TextInput className="border rounded-2xl border-gray-400 py-3.5 pl-2" />
        </View>

        {/* Card Number Input */}
        <View className="flex-row items-center gap-2 mt-2 border-b border-dashed border-gray-400">
          <AntDesign name="creditcard" size={30} color="gray" className="mt-4" />
          <View className="flex-1 pb-2">
            <Text className="text-[#181e25] font-extrabold text-base">
              {t('bankCard.cardNumber')}
              <Text className="text-red-600 text-lg">*</Text>
            </Text>
            <TextInput className="border rounded-2xl border-gray-400 py-3.5 pl-2" />
          </View>
        </View>

        {/* Expiry Date and CVV */}
        <View className="flex-row justify-between gap-3 mt-2 mb-5">
          <View className="flex-1 pb-2">
            <Text className="text-[#181e25] font-extrabold text-base">
              {t('bankCard.expiryDate')} <Text className="text-red-600 text-lg">*</Text>
            </Text>
            <TouchableOpacity
              className="px-2 py-3 border border-gray-400 rounded-2xl flex-row gap-1"
              onPress={showDatePicker}
            >
              <EvilIcons name="calendar" size={24} color="black" />
              <Text className="text-black text-sm">{date.toDateString()}</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-1 pb-2">
            <Text className="text-[#181e25] font-extrabold text-base">
              {t('bankCard.cvv')} <Text className="text-red-600 text-lg">*</Text>
            </Text>
            <TextInput
              className="border rounded-2xl border-gray-400 py-3.5 pl-2"
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Date Picker */}
        {showDate && (
          <DateTimePicker
            testID="dateTimePicker"
            value={date}
            mode="date"
            display="default"
            onChange={onChange}
          />
        )}

        {/* Delivery Information */}
        {t('bankCard.deliveryInfo', { returnObjects: true }).map((item, index) => (
          <Text key={index} className="text-[#181e25] font-bold my-2">
            {item}
          </Text>
        ))}

        {/* Security Notice */}
        <View className="my-5">
          <Text className="text-center text-gray-400 text-xs">
            {t('bankCard.securityNotice')}
          </Text>
        </View>

        {/* Validate Button */}
        <TouchableOpacity
          className="my-5 bg-[#7ddd7d] py-3 rounded-full"
          onPress={() => navigation.navigate("ConﬁrmeTheTransfer")}
        >
          <Text className="text-xl text-center font-bold">
            {t('bankCard.validateButton')}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Privacy Notice */}
      <View className="py-4 flex-row justify-center items-center gap-2">
        <Ionicons name="shield-checkmark" size={18} color="orange" />
        <Text className="text-sm text-white">
          {t('bankCard.privacyNotice')}
        </Text>
      </View>

      <StatusBar style="light" />
    </View>
  );
};

export default BankCard;