import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useDeleteSharedExpenseMutation, useUpdateSharedExpenseMutation } from "../../services/Shared/sharedExpenseApi";
import TopLogo from "../../Images/TopLogo.png";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";

const getStatusStyle = (status) => {
  switch (status?.toUpperCase()) {
    case "PAYÉ":
    case "COMPLETE":
      return { bg: "#d4f5d4", color: "#0a8f0a" };
    case "EN ATTENTE":
    case "PENDING":
      return { bg: "#fdeacc", color: "#e69500" };
    case "DECLINED":
      return { bg: "#ffd6d6", color: "#d32f2f" };
    default:
      return { bg: "#e0e0e0", color: "#555" };
  }
};

const DetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { t } = useTranslation();
  const transaction = route.params?.transaction;
  
  const [deleteSharedExpense, { isLoading: isDeleting }] = useDeleteSharedExpenseMutation();
  const [updateSharedExpense, { isLoading: isUpdating }] = useUpdateSharedExpenseMutation();

  const [selectedIndex, setSelectedIndex] = useState(null);
  const [editedAmount, setEditedAmount] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
 const [participantsState, setParticipantsState] = useState(
  (transaction?.participants || []).map((p) => ({
    ...p,
    part: p.part,
    user: { ...p.user },
  }))
);

  const [totalAmount, setTotalAmount] = useState(String(transaction?.totalAmount || ""));
  const [description, setDescription] = useState(transaction?.description || "");
  const [limitDate, setLimitDate] = useState(transaction?.limitDate || transaction?.createdAt);

  const openEditModal = (index) => {
    setSelectedIndex(index);
    setEditedAmount(String(participantsState[index]?.part));
    setModalVisible(true);
  };

  const confirmEdit = () => {
    const updated = [...participantsState];
    updated[selectedIndex].part = parseFloat(editedAmount);
    setParticipantsState(updated);
    setModalVisible(false);
  };

  const handleDelete = () => {
    Alert.alert(t("detail.confirm"), t("detail.deleteTransactionQuestion"), [
      { text: t("detail.cancel"), style: "cancel" },
      {
        text: t("detail.delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await deleteSharedExpense(transaction.id).unwrap();
            Toast.show({ type: "success", text1: "Transaction deleted." });
            navigation.goBack();
          } catch {
            Toast.show({ type: "error", text1: "Failed to delete transaction." });
          }
        },
      },
    ]);
  };

  const handleSaveModifications = async () => {
    try {
      const payload = {
        totalAmount: parseFloat(totalAmount),
        description,
        limitDate,
        includeMyself: false,
        methodCalculatingShare: "manual",
        participants: participantsState.map((p) => ({
          matriculeWallet: p.user?.matriculeWallet,
          amount: p.part,
        })),
      };

      await updateSharedExpense({ id: transaction.id, data: payload }).unwrap();
      console.log(payload)
      Toast.show({ type: "success", text1: "Changes saved successfully." });
    } catch(error) {
      console.log(error)
      Toast.show({ type: "error", text1: "Failed to save changes" });
    }
  };

  if (!transaction) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text>{t("detail.transactionNotFound")}</Text>
      </View>
    );
  }
  
  const {
    id,
    currency,
    participants = [],
    createdAt,
    initiator,
  } = transaction;

  return (
    <View className="flex-1 bg-[#151c1f] relative">
      <StatusBar barStyle="light-content" />

      <View className="h-[100px] px-5 pt-12 bg-[#151c1f] flex-row justify-between items-center rounded-b-2xl">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      <View className="absolute -top-12 left-0 right-0 items-center justify-center">
        <Image source={TopLogo} className="h-36 w-40" resizeMode="contain" />
      </View>
       <View className="border border-dashed border-gray-300 mt-5" />
      <ScrollView className="mt-20 bg-white rounded-2xl p-4 mx-4">
        <Text className="text-gray-800 font-bold text-base">{t("detail.totalAmount")}</Text>
        <TextInput
          keyboardType="numeric"
          value={totalAmount}
          onChangeText={setTotalAmount}
          className="border border-gray-300 rounded p-2 text-black mb-3"
        />
        
        <Text className="text-gray-800 font-bold text-base">{t("detail.description")}</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          className="border border-gray-300 rounded p-2 text-black mb-3"
        />

        <Text className="text-gray-800 font-bold text-base">{t("detail.initiator")}</Text>
        <Text className="text-black text-sm mb-3">
          {transaction.initiator?.firstname} {transaction.initiator?.lastname}
        </Text>

        <Text className="text-gray-800 font-bold text-base">{t("detail.limitDate")}</Text>
        <TextInput
          value={new Date(limitDate).toISOString().split("T")[0]}
          onChangeText={(text) => setLimitDate(new Date(text))}
          className="border border-gray-300 rounded p-2 text-black mb-3"
        />

        <Text className="text-gray-800 font-bold text-base mb-2">{t("detail.recipients")}</Text>
        {participantsState.map((p, i) => {
          const status = p.paymentStatus || "PENDING";
          const { bg, color } = getStatusStyle(status);
          const name = `${p.user?.firstname || ""} ${p.user?.lastname || ""}`.trim();

          return (
            <View key={i} className="flex-row items-center justify-between py-2">
              <Text className="text-black text-sm w-1/3">{name}</Text>
              <View className="w-1/3 flex-row items-center justify-center space-x-1">
                <Text className="text-black text-sm">{p.part?.toLocaleString()} {p.currency}</Text>
                {!(status === "PAYÉ" || status === "COMPLETE") && (
                  <TouchableOpacity onPress={() => openEditModal(i)}>
                    <Ionicons name="create-outline" size={16} color="gray" />
                  </TouchableOpacity>
                )}
              </View>
              <View className="w-1/3 items-end">
                <View style={{ backgroundColor: bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 }}>
                  <Text style={{ color, fontSize: 12 }}>{status}</Text>
                </View>
              </View>
            </View>
          );
        })}

        <TouchableOpacity
          disabled={isUpdating}
          onPress={handleSaveModifications}
          className="bg-green-500 rounded-full py-3 mt-6 items-center flex-row justify-center space-x-2"
        >
          <Ionicons name="save-outline" size={20} color="white" />
          <Text className="text-white font-semibold text-base">
            {isUpdating ? t("saving") : t("save")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDelete}
          disabled={isDeleting}
          className={`bg-red-600 rounded-full py-3 mt-5 items-center flex-row justify-center space-x-2 ${
            isDeleting ? "opacity-50" : ""
          }`}
        >
          <Ionicons name="trash-outline" size={20} color="white" />
          <Text className="text-white font-semibold text-base">
            {isDeleting ? t("deleting") : t("delete")}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal */}
      <Modal transparent animationType="slide" visible={modalVisible}>
        <View className="flex-1 bg-black/40 justify-center items-center px-6">
          <View className="bg-white p-6 rounded-2xl w-full">
            <Text className="text-lg font-semibold mb-3">{t("detail.editAmount")}</Text>
            <TextInput
              keyboardType="numeric"
              value={editedAmount}
              onChangeText={setEditedAmount}
              className="border border-gray-300 rounded p-2 mb-4"
            />
            <View className="flex-row justify-end space-x-3">
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text className="text-red-500 space-x-4">{t("detail.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmEdit}>
                <Text className="text-green-600 font-semibold">{t("detail.confirm")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Toast />
    </View>
  );
};

export default DetailScreen;
