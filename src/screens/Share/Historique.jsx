import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useTranslation } from "react-i18next";
import { useGetUserProfileQuery } from "../../services/Auth/authAPI";
import { useGetSharedExpensesQuery } from "../../services/Shared/sharedExpenseApi";
import DateTimePicker from "@react-native-community/datetimepicker";

const getStatusStyle = (status) => {
  switch (status?.toUpperCase()) {
    case "COMPLETE":
      return "bg-green-100 text-green-600";
    case "PENDING":
      return "bg-orange-100 text-orange-600";
    case "DECLINED":
      return "bg-red-100 text-red-600";
    default:
      return "bg-gray-200 text-gray-600";
  }
};

const HistoryScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { data: userProfile, isLoading: profileLoading } = useGetUserProfileQuery();
  const userId = userProfile?.data?.id;

  const {
    data: sharedData,
    isLoading,
    isError,
  } = useGetSharedExpensesQuery({ userId, page: 1, limit: 100 });

  const transactions = sharedData?.data || [];

  const handleTransactionPress = (transaction) => {
    navigation.navigate("DetailScreen", { transaction });
  };

  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((item) => {
      const matchesStatus = selectedStatus ? item.status === selectedStatus : true;
      const createdAt = new Date(item.createdAt);
      const matchesStart = startDate ? createdAt >= startDate : true;
      const matchesEnd = endDate ? createdAt <= endDate : true;
      return matchesStatus && matchesStart && matchesEnd;
    });
  }, [transactions, selectedStatus, startDate, endDate]);

  const renderTransaction = ({ item }) => {
    const statusStyle = getStatusStyle(item.status);

    return (
      <TouchableOpacity
        onPress={() => handleTransactionPress(item)}
        className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-200"
      >
        <View className="flex-row justify-between items-start">
          <Text className="font-bold text-base text-black flex-1">
            {item.description || t("noTitle")}
          </Text>
          <View className="items-center">
            <Text className="font-bold text-sm text-black">
              {item.totalAmount} XAF
            </Text>
            <Text className="text-gray-500 text-xs font-bold mt-1">
              {item.participants?.map((p) => p.initials).join(" ")} {item.initiator?.firstname}
            </Text>
          </View>
        </View>

        <Text className="text-gray-600 text-sm mt-1">
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>

        <View className="mt-2">
          <Text className={`self-end px-3 py-1 rounded-full text-xs font-medium ${statusStyle}`}>
            {item.status}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-[#e8f5e9]">
      <View className="flex-row items-center justify-between px-5 pt-14 pb-4 bg-[#7ddd7d]">
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-black">{t("historique.history")}</Text>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>

      {/* Filter Button */}
      <View className="flex-row justify-end px-4 py-2">
        <TouchableOpacity className="flex-row items-center space-x-1" onPress={() => setFilterVisible(true)}>
          <Text className="text-gray-700 font-medium">{t("historique.filter")}</Text>
          <Ionicons name="filter" size={18} color="gray" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading || profileLoading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      ) : isError ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-red-600">{t("historique.errorLoading")}</Text>
        </View>
      ) : filteredTransactions.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray-500">{t("historique.noHistoryFound")}</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item.id?.toString() ?? Math.random().toString()}
          renderItem={renderTransaction}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Filter Modal */}
      <Modal visible={filterVisible} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/30">
          <View className="bg-white rounded-t-2xl p-5">
            <Text className="text-lg font-bold mb-3">{t("historique.filterTransactions")}</Text>

           <View className="mb-4">
              <Text className="text-sm mb-1 text-gray-700">{t("historique.status")}</Text>
              {["", "PENDING", "COMPLETE", "DECLINED"].map((status) => (
                <Pressable
                  key={status}
                  onPress={() => setSelectedStatus(status)}
                  className={`p-2 rounded ${selectedStatus === status ? "bg-green-200" : ""}`}
                >
                  <Text>
                    {status === ""
                      ? t("historique.all")
                      : t(`historique.statuses.${status.toLowerCase()}`)}
                  </Text>
                </Pressable>
              ))}
            </View>


            <View className="mb-4">
              <Text className="text-sm text-gray-700">{t("historique.startDate")}</Text>
              <TouchableOpacity onPress={() => setShowStartDatePicker(true)}>
                <Text className="p-2 border rounded mt-1">
                  {startDate ? startDate.toLocaleDateString() : t("historique.select")}
                </Text>
              </TouchableOpacity>
              {showStartDatePicker && (
                <DateTimePicker
                  value={startDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setShowStartDatePicker(false);
                    if (date) setStartDate(date);
                  }}
                />
              )}
            </View>

            <View className="mb-4">
              <Text className="text-sm text-gray-700">{t("historique.endDate")}</Text>
              <TouchableOpacity onPress={() => setShowEndDatePicker(true)}>
                <Text className="p-2 border rounded mt-1">
                  {endDate ? endDate.toLocaleDateString() : t("historique.select")}
                </Text>
              </TouchableOpacity>
              {showEndDatePicker && (
                <DateTimePicker
                  value={endDate || new Date()}
                  mode="date"
                  display="default"
                  onChange={(event, date) => {
                    setShowEndDatePicker(false);
                    if (date) setEndDate(date);
                  }}
                />
              )}
            </View>

            <View className="flex-row justify-between mt-5">
              <TouchableOpacity
                onPress={() => {
                  setSelectedStatus("");
                  setStartDate(null);
                  setEndDate(null);
                }}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                <Text>{t("historique.reset")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setFilterVisible(false)}
                className="bg-green-500 px-4 py-2 rounded"
              >
                <Text className="text-white">{t("historique.apply")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default HistoryScreen;
