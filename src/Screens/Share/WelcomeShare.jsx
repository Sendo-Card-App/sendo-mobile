import React from "react";
import {
  View,
  Dimensions,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

// Assets
import ButtomLogo from "../../Images/ButtomLogo.png";
import Ilustration from "../../Images/icones/Ilustration.png";

const { width, height } = Dimensions.get("window");

const WelcomeShare = ({ navigation }) => {
  const navigation2 = useNavigation();
  const { t } = useTranslation();

  return (
    <ScrollView className="flex-1 bg-[#7ddd7d]">
      {/* Top Header */}
      <View className="flex-row justify-between items-center px-4 pt-12">
        <Image
          source={ButtomLogo}
          resizeMode="contain"
          className="h-[50px] w-[150px]"
        />
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={28} color="black" />
        </TouchableOpacity>
      </View>

      <View className="border border-dashed border-black my-1" />

      {/* Text Block */}
      <View className="px-6 mt-8">
        <Text className="text-[22px] font-bold text-black leading-7">
          {t("welcomeShare.title")}
        </Text>
        <Text className="text-[18px] text-black mt-2 leading-6 font-medium">
          {t("welcomeShare.subtitle")}
        </Text>
      </View>

      {/* Image Block */}
      <View className="items-center mt-10 px-4">
        <Image
          source={Ilustration}
          resizeMode="contain"
          style={{
            width: width * 0.9,
            height: height * 0.35,
          }}
        />
      </View>

      {/* Continue Button */}
      <View className="mt-10 px-8">
        <TouchableOpacity
          className="bg-white py-5 rounded-full items-center"
          onPress={() => navigation2.navigate("CreateShare")}
        >
          <Text className="text-black font-bold text-[16px]">
            {t("welcomeShare.continue")}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default WelcomeShare;
