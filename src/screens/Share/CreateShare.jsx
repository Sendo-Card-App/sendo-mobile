import React from "react";
import {
  View,
  Dimensions,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

const { width } = Dimensions.get("window");

const CreateShare = ({ navigation }) => {
  const navigation2 = useNavigation();
  const { t } = useTranslation();

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: "#7ddd7d",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingTop: 50,
          paddingBottom: 15,
        }}
      >
        <TouchableOpacity onPress={() => navigation.navigate("MainTabs")}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: "black" }}>
          {t("createShare.title")}
        </Text>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* Options List */}
      <ScrollView
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Item 1 */}
        <TouchableOpacity
          onPress={() => navigation2.navigate("Request")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#7ddd7d",
            padding: 16,
            borderRadius: 8,
            marginTop: 50,
            marginBottom: 20,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Feather name="plus-circle" size={20} color="black" />
            <Text style={{ marginLeft: 12, fontWeight: "bold" }}>
              {t("createShare.new")}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: "#fff",
              padding: 6,
              borderRadius: 4,
            }}
          >
            <Ionicons name="chevron-forward" size={18} color="black" />
          </View>
        </TouchableOpacity>

        {/* Item 2 */}
        <TouchableOpacity
          onPress={() => navigation2.navigate("BuySharing")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderWidth: 1,
            borderColor: "#7ddd7d",
            padding: 16,
            borderRadius: 8,
            marginBottom: 20,
            backgroundColor: "#fff",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Feather name="users" size={20} color="black" />
            <Text style={{ marginLeft: 12, fontWeight: "bold" }}>
              {t("createShare.friends")}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: "#7ddd7d",
              padding: 6,
              borderRadius: 4,
            }}
          >
            <Ionicons name="chevron-forward" size={18} color="black" />
          </View>
        </TouchableOpacity>

        {/* Item 3 */}
        <TouchableOpacity
          onPress={() => navigation2.navigate("Historique")}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            borderWidth: 1,
            borderColor: "#7ED957",
            padding: 16,
            borderRadius: 8,
            backgroundColor: "#fff",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Feather name="clock" size={20} color="black" />
            <Text style={{ marginLeft: 12, fontWeight: "bold" }}>
              {t("createShare.history")}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: "#7ED957",
              padding: 6,
              borderRadius: 4,
            }}
          >
            <Ionicons name="chevron-forward" size={18} color="black" />
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

export default CreateShare;
