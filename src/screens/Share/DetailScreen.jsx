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
import TopLogo from "../../images/TopLogo.png";
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
  //console.log('transaction:', JSON.stringify(transaction, null, 2));
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

  // Fonction pour valider et formater les entrées numériques
  const handleAmountChange = (text, setter) => {
    // Permettre seulement les nombres et un point décimal
    const cleanedText = text.replace(/[^0-9.]/g, '');
    
    // S'assurer qu'il n'y a qu'un seul point décimal
    const decimalCount = (cleanedText.match(/\./g) || []).length;
    if (decimalCount > 1) {
      return;
    }
    
    setter(cleanedText);
  };

  const openEditModal = (index) => {
    setSelectedIndex(index);
    setEditedAmount(String(participantsState[index]?.part || "0"));
    setModalVisible(true);
  };

  const confirmEdit = () => {
    if (!editedAmount || isNaN(parseFloat(editedAmount))) {
      Toast.show({ type: "error", text1: "Montant invalide" });
      return;
    }

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
    // Validation des montants
    if (!totalAmount || isNaN(parseFloat(totalAmount)) || parseFloat(totalAmount) <= 0) {
      Toast.show({ type: "error", text1: "Montant total invalide" });
      return;
    }

    for (const participant of participantsState) {
      if (isNaN(participant.part) || participant.part <= 0) {
        Toast.show({ type: "error", text1: `Montant invalide pour ${participant.user?.firstname}` });
        return;
      }
    }

    try {
      const payload = {
        totalAmount: parseFloat(totalAmount),
        description,
        limitDate: new Date(limitDate).toISOString().split("T")[0], // format YYYY-MM-DD
        includeMyself: false,
        methodCalculatingShare: "manual",
        participants: participantsState.map((p) => ({
          matriculeWallet: p.user?.wallet?.matricule,  // ✅ correct field
          amount: parseFloat(p.part),
        })),
      };

      //console.log("Payload envoyé:", JSON.stringify(payload, null, 2));


      await updateSharedExpense({ id: transaction.id, data: payload }).unwrap();
     
      Toast.show({ type: "success", text1: "Changes saved successfully." });
    } catch(error) {
      console.log('Update shared error:', JSON.stringify(error, null, 2));
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

  const formatAmount = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return "N/A";
    }
    return parseFloat(amount).toLocaleString();
  };

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
          onChangeText={(text) => handleAmountChange(text, setTotalAmount)}
          className="border border-gray-300 rounded p-2 text-black mb-3"
          placeholder="0.00"
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
                <Text className="text-black text-sm">
                  {formatAmount(p.part)} {p.currency || transaction.currency}
                </Text>
                {!(status === "PAYED" || status === "COMPLETE") && (
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

       {/* Boutons Save & Delete : visibles seulement si aucun participant n’a payé */}
        {!participantsState.some(
          (p) => p.paymentStatus === "PAYED" || p.paymentStatus === "COMPLETE"
        ) && (
          <>
            <TouchableOpacity
              disabled={isUpdating}
              onPress={handleSaveModifications}
              className="bg-green-500 rounded-full py-3 mt-6 items-center flex-row justify-center space-x-2"
            >
              <Ionicons name="save-outline" size={20} color="white" />
              <Text className="text-white font-semibold text-base">
                {t("detail.save")}
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
                {t("detail.delete")}
              </Text>
            </TouchableOpacity>
          </>
        )}

      </ScrollView>

      {/* Modal */}
      <Modal transparent animationType="slide" visible={modalVisible}>
        <View className="flex-1 bg-black/40 justify-center items-center px-6">
          <View className="bg-white p-6 rounded-2xl w-full">
            <Text className="text-lg font-semibold mb-3">{t("detail.editAmount")}</Text>
            <TextInput
              keyboardType="numeric"
              value={editedAmount}
              onChangeText={(text) => handleAmountChange(text, setEditedAmount)}
              className="border border-gray-300 rounded p-2 mb-4"
              placeholder="0.00"
            />
            <View className="flex-row justify-end space-x-3">
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text className="text-red-500">{t("detail.cancel")}</Text>
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