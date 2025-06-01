import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import TopLogo from "../../Images/TopLogo.png";
import DateTimePicker from "@react-native-community/datetimepicker";
import Toast from "react-native-toast-message";
import { useTranslation } from "react-i18next";

const CreateRequest = ({ navigation }) => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [deadline, setDeadline] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleNext = () => {
    if (!amount || !description || !deadline) {
      Toast.show({
        type: "error",
        text1: t("createRequest.error_title"),
        text2: t("createRequest.fill_all_fields"),
      });
      return;
    }

    Toast.show({
      type: "success",
      text1: t("createRequest.success_title"),
      text2: t("createRequest.proceed_select_recipients"),
    });

    navigation.navigate("SelectRecipients", {
      amount: parseFloat(amount),
      description,
      deadline,
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <View className="flex-1 bg-[#151c1f] relative">
        <StatusBar barStyle="light-content" />

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
            justifyContent: "center",
          }}
        >
          <Image
            source={TopLogo}
            style={{ height: 140, width: 160 }}
            resizeMode="contain"
          />
        </View>
         <View className="border border-dashed border-gray-300" />
        <ScrollView
          className="mt-20 bg-white rounded-2xl p-4 mx-4"
          keyboardShouldPersistTaps="handled"
        >
          <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 30 }}>
            {t("createRequest.create_request")}
          </Text>

          {/* Amount */}
          <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>
            {t("createRequest.amount")}
          </Text>
          <TextInput
            style={{
              backgroundColor: "#f5f5f5",
              padding: 16,
              borderRadius: 8,
              marginBottom: 20,
              fontSize: 16,
              color: "#000",
            }}
            keyboardType="numeric"
            placeholder={t("createRequest.enter_amount_placeholder")}
            value={amount}
            onChangeText={setAmount}
          />

          {/* Description */}
          <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>
            {t("createRequest.description")}
          </Text>
          <TextInput
            style={{
              backgroundColor: "#f5f5f5",
              padding: 16,
              borderRadius: 8,
              marginBottom: 20,
              fontSize: 16,
              color: "#000",
              height: 100,
              textAlignVertical: "top",
            }}
            placeholder={t("createRequest.description_placeholder")}
            multiline
            value={description}
            onChangeText={setDescription}
          />

          {/* Deadline */}
          <Text style={{ fontSize: 16, fontWeight: "bold", marginBottom: 8 }}>
            {t("createRequest.deadline")}
          </Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={{
              backgroundColor: "#f5f5f5",
              padding: 16,
              borderRadius: 8,
              marginBottom: 30,
            }}
          >
            <Text style={{ fontSize: 16, color: deadline ? "#000" : "#999" }}>
              {deadline ? deadline : t("createRequest.choose_date")}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={selectedDate}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={(event, date) => {
                setShowDatePicker(false);
                if (date) {
                  const formattedDate = date.toISOString().split("T")[0]; // YYYY-MM-DD
                  setSelectedDate(date);
                  setDeadline(formattedDate);
                }
              }}
            />
          )}

          {/* Next Button */}
          <TouchableOpacity
            onPress={handleNext}
            style={{
              backgroundColor: "#7ddd7d",
              padding: 16,
              borderRadius: 8,
              alignItems: "center",
              marginBottom: 30,
            }}
          >
            <Text
              style={{ color: "white", fontSize: 16, fontWeight: "bold" }}
            >
              {t("createRequest.next")}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        <Toast />
      </View>
    </KeyboardAvoidingView>
  );
};

export default CreateRequest;
