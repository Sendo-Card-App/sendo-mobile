import {
  View,
  Text,
  Image,
  Platform,
  TextInput,
  TouchableOpacity,
} from "react-native";
import React from "react";
import { AntDesign, EvilIcons } from "@expo/vector-icons";
import Avatar from "../../images/Avatar.png";
import KeyboardAvoidinWrapper from "../../components/KeyboardAvoidinWrapper";

const Account = () => {
  return (
    <KeyboardAvoidinWrapper>
      <View className="flex-1 p-8 items-center">
        <View className="flex-row justify-between items-center w-full">
          <Text className="text-gray-500 font-bold text-xl">Proﬁl</Text>
          <AntDesign name="edit" size={24} color="gray" />
        </View>
        <View className=" my-5 relative">
          <Image
            source={Avatar}
            className="w-[200px] h-[200px] rounded-full items-center justify-center"
          />

          <EvilIcons
            name="camera"
            size={30}
            color="gray"
            className="absolute right-1 bottom-1"
          />
        </View>

        <View className="w-full gap-2">
          {/*  */}
          <View
            className={`w-full border-b pb-2 border-gray-400 ${
              Platform.OS === "android" ? "border-dashed" : "border-solid pb-3"
            }`}
          >
            <Text className="text-[#181e25] font-extrabold text-base">
              Nom, Prénom <Text className="text-red-600 text-lg">*</Text>
            </Text>
            <TextInput className="border rounded-2xl border-gray-400 py-3 pl-4" />
          </View>

          {/*  */}
          <View
            className={`w-full border-b pb-2 border-gray-400 ${
              Platform.OS === "android" ? "border-dashed" : "border-solid pb-3"
            }`}
          >
            <Text className="text-[#181e25] font-extrabold text-base">
              Téléphone <Text className="text-red-600 text-lg">*</Text>
            </Text>
            <TextInput className="border rounded-2xl border-gray-400 py-3 pl-4" />
          </View>

          {/*  */}
          <View
            className={`w-full border-b pb-2 border-gray-400 ${
              Platform.OS === "android" ? "border-dashed" : "border-solid pb-3"
            }`}
          >
            <Text className="text-[#181e25] font-extrabold text-base">
              Adresse mail <Text className="text-red-600 text-lg">*</Text>
            </Text>
            <TextInput className="border rounded-2xl border-gray-400 py-3 pl-4" />
          </View>

          <TouchableOpacity
            className="mt-16 bg-[#7ddd7d] px-24 py-4 rounded-full"
            onPress={() => navigation.navigate("InformationsOfDemand")}
          >
            <Text className="text-xl font-bold text-center">Enregistrez</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidinWrapper>
  );
};

export default Account;
