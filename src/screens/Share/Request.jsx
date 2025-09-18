import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Image,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { AntDesign, Ionicons, Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";

import Loader from "../../components/Loader";
import TopLogo from "../../images/TopLogo.png";

const Request = ({ navigation }) => {
  const { t } = useTranslation();
  const navigation2 = useNavigation();

  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [date, setDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) {
      setSelectedDate(selectedDate);
      const formattedDate = selectedDate.toISOString().split("T")[0];
      setDate(formattedDate);
    }
  };

  const handleNext = () => {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      Toast.show({
        type: "error",
        text1: "Montant invalide",
        text2: "Veuillez entrer un montant valide",
      });
      return;
    }

    if (!reason) {
      Toast.show({
        type: "error",
        text1: "Motif requis",
        text2: "Veuillez entrer un motif",
      });
      return;
    }

    if (!date) {
      Toast.show({
        type: "error",
        text1: "Date manquante",
        text2: "Veuillez sélectionner une date limite",
      });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation2.navigate("Destinators", {
        totalAmount: parseFloat(amount),
        description: reason,
        limitDate: date,
      });
    }, 1000);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#181e25" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
    >
      <StatusBar style="light" />

      {/* Logo */}
      <View className="absolute -top-12 left-0 right-0 items-center justify-center">
        <Image source={TopLogo} className="h-36 w-40" resizeMode="contain" />
      </View>

      {/* Header */}
      <View className="border-b border-dashed border-white flex-row justify-between py-4 mt-10 items-center mx-5 pt-5">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="left" size={24} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>
       <View className="border border-dashed border-gray-300 " />
      {/* Stepper */}
      <View className="flex-row items-center justify-center px-4 my-4 space-x-2">
        <Text className="w-6 h-6 text-white text-center rounded-full bg-[#7ddd7d] leading-6">
          {t("request.step.one")}
        </Text>
        <View className="flex-1 h-[1px] bg-gray-400" />
        <Text className="w-6 h-6 text-white text-center rounded-full bg-[#2B2F38] leading-6">
          {t("request.step.two")}
        </Text>
        <View className="flex-1 h-[1px] bg-gray-400" />
        <Text className="w-6 h-6 text-white text-center rounded-full bg-[#2B2F38] leading-6">
          {t("request.step.three")}
        </Text>
      </View>

      {/* Title */}
      <Text
        style={{
          color: "#7ddd7d",
          fontSize: 18,
          fontWeight: "bold",
          marginHorizontal: 20,
          marginVertical: 10,
        }}
      >
        {t("request.createRequest")}
      </Text>

      {/* Form */}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 20,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={{
            backgroundColor: "#F0F4F3",
            borderRadius: 10,
            padding: 16,
          }}
        >
          {/* Amount */}
          <Text style={{ fontWeight: "bold", marginBottom: 6 }}>
            {t("request.totalAmount")}
          </Text>
          <TextInput
            placeholder={t("request.amountPlaceholder")}
            placeholderTextColor="#aaa"
            keyboardType="numeric"
            style={{
              backgroundColor: "white",
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: Platform.OS === "ios" ? 12 : 8,
              marginBottom: 12,
            }}
            value={amount}
            onChangeText={setAmount}
          />

          {/* Reason */}
          <Text style={{ fontWeight: "bold", marginBottom: 6 }}>
            {t("request.reason")}
          </Text>
          <TextInput
            placeholder={t("request.reasonPlaceholder")}
            placeholderTextColor="#aaa"
            style={{
              backgroundColor: "white",
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: Platform.OS === "ios" ? 12 : 8,
              marginBottom: 12,
            }}
            value={reason}
            onChangeText={setReason}
          />

          {/* Date */}
          <Text style={{ fontWeight: "bold", marginBottom: 6 }}>
            {t("request.deadline")}
          </Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "white",
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: Platform.OS === "ios" ? 12 : 8,
              justifyContent: "space-between",
            }}
          >
            <Text style={{ color: date ? "black" : "#aaa" }}>
              {date || t("request.defaultDatePlaceholder")}
            </Text>
            <Feather name="calendar" size={20} color="gray" />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              mode="date"
              display="default"
              value={selectedDate}
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          )}

          {/* Button */}
          <TouchableOpacity
            onPress={handleNext}
            disabled={loading}
            style={{
              marginTop: 20,
              backgroundColor: "#7ddd7d",
              borderRadius: 30,
              paddingVertical: 14,
              alignItems: "center",
              opacity: loading ? 0.6 : 1,
              flexDirection: "row",
              justifyContent: "center",
            }}
          >
            {loading && <Loader size="small" style={{ marginRight: 8 }} />}
            <Text style={{ fontWeight: "bold", color: "#000" }}>
              {t("request.next")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default Request;
