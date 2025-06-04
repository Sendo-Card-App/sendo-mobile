import React, { useState } from "react";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import TopLogo from "../../images/TopLogo.png";
import {
  View,
  TextInput,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useTranslation } from "react-i18next";

const EditFundField = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { field, value } = route.params;
  const [input, setInput] = useState(value);

  const handleSave = () => {
    navigation.navigate("ConfirmInformation", {
      editedField: field,
      value: input,
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#151c1f" }}>
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

      {/* Content */}
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          marginTop: 20,
          backgroundColor: "#fff",
          borderRadius: 20,
          marginHorizontal: 20,
        }}
      >
        <Text style={{ fontWeight: "bold", marginBottom: 10 }}>
          {t("edit.modify_field", { field })}
        </Text>

        <TextInput
          value={input}
          onChangeText={setInput}
          keyboardType={field === "amount" ? "numeric" : "default"}
          placeholder={t("edit.placeholder", { field })}
          style={{
            borderWidth: 1,
            borderColor: "#ccc",
            borderRadius: 10,
            padding: 12,
            marginBottom: 20,
          }}
        />

        <TouchableOpacity
          onPress={handleSave}
          style={{
            backgroundColor: "#7ddd7d",
            padding: 14,
            borderRadius: 10,
            alignItems: "center",
          }}
        >
          <Text style={{ fontWeight: "bold" }}>{t("edit.save")}</Text>
        </TouchableOpacity>
      </ScrollView>

      <StatusBar style="light" />
    </View>
  );
};

export default EditFundField;
