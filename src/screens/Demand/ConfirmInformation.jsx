import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import TopLogo from "../../images/TopLogo.png";
import { useTranslation } from "react-i18next";
import Toast from "react-native-toast-message";
import { useCreateFundRequestMutation } from "../../services/Fund/fundApi";
import { 
  sendPushNotification,
  sendPushTokenToBackend,
  registerForPushNotificationsAsync
} from '../../services/notificationService';
import { TypesNotification } from "../../utils/constants";
import Loader from "../../components/Loader";

const ConfirmInformation = ({ navigation, route }) => {
  const { t } = useTranslation();
  const initialParams = route.params || {};
 console.log(initialParams)
  const [amount, setAmount] = useState(initialParams.amount);
  const [description, setDescription] = useState(initialParams.description);
  const [deadline, setDeadline] = useState(initialParams.deadline);
  const [recipients, setRecipients] = useState(initialParams.recipients || []);

  const [createFundRequest, { isLoading }] = useCreateFundRequestMutation();

  useEffect(() => {
    if (route.params?.editedField && route.params?.value !== undefined) {
      switch (route.params.editedField) {
        case "amount":
          setAmount(route.params.value);
          break;
        case "description":
          setDescription(route.params.value);
          break;
        case "deadline":
          setDeadline(route.params.value);
          break;
        case "recipients":
          setRecipients(route.params.value);
          break;
      }
      navigation.setParams({ editedField: undefined, value: undefined });
    }
  }, [route.params]);

const handleSubmit = async () => {
  try {
    const payload = {
      amount: parseFloat(amount),
      description,
      deadline,
      recipients: recipients.map((r) => ({
        matriculeWallet: r.matriculeWallet,
      })),
    };

    console.log("Payload to backend:", JSON.stringify(payload, null, 2));
    await createFundRequest(payload).unwrap();

    const notificationContent = {
      title: "Demande de fonds créée",
      body: `Une demande de ${parseFloat(amount)} FCFA a été créée.`,
      type: "FUND_REQUEST_CREATED",
    };

    try {
      let pushToken = await getStoredPushToken();
      if (!pushToken) {
        pushToken = await registerForPushNotificationsAsync();
      }

      if (pushToken) {
        await sendPushTokenToBackend(
          pushToken,
          notificationContent.title,
          notificationContent.body,
          notificationContent.type,
          {
            amount: parseFloat(amount),
            description,
            deadline,
            timestamp: new Date().toISOString(),
          }
        );
      } else {
        throw new Error("Push token not available");
      }
    } catch (notificationError) {
      console.warn("Notification backend error:", notificationError?.message);

      await sendPushNotification(
        notificationContent.title,
        notificationContent.body,
        {
          data: {
            type: notificationContent.type,
            amount: parseFloat(amount),
            description,
          },
        }
      );
    }

    navigation.navigate("SuccessSharing", {
      transactionDetails: "Votre demande de fond a été créée avec succès.",
    });

  } catch (error) {
    console.log("Submission error full object:", JSON.stringify(error, null, 2));

    const isECONNRESET =
      error?.data?.errors?.some((e) =>
        typeof e === "string" && e.includes("ECONNRESET")
      );

    if (isECONNRESET) {
      navigation.navigate("SuccessSharing", {
        transactionDetails: "Votre demande de fond a été créée avec succès.",
      });
    } else {
      Toast.show({
        type: "error",
        text1: t("confirmDemand.error_title"),
        text2: error?.data?.message || t("confirmDemand.error_message"),
      });
    }
  }
};




  return (
    <View style={{ flex: 1, backgroundColor: "#151c1f" }}>
      <StatusBar style="light" />
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
      <Text
          style={{
            fontSize: 22,
            fontWeight: "bold",
            marginBottom: 2,
            marginTop:20,
            color: "#7ddd7d",
          }}
        >
          {t("confirmDemand.confirm_information")}
        </Text>

      <ScrollView
        contentContainerStyle={{
          padding: 20,
          marginTop: 20,
          backgroundColor: "#fff",
          borderRadius: 20,
          marginHorizontal: 20,
        }}
      >
        {/* Amount */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: "bold", marginBottom: 4 }}>
              {t("confirmDemand.total_amount")}
            </Text>
            <Text style={{ fontWeight: "bold", color: "green" }}>
              {amount ? `${amount} XAF` : "N/A"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("EditFundFieldScreen", {
                field: "amount",
                value: amount,
              })
            }
          >
            <Ionicons name="create-outline" size={20} color="gray" />
          </TouchableOpacity>
        </View>

        {/* Description */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: "bold", marginBottom: 4 }}>
              {t("confirmDemand.service_description")}
            </Text>
            <Text>{description || "N/A"}</Text>
          </View>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("EditFundField", {
                field: "description",
                value: description,
              })
            }
          >
            <Ionicons name="create-outline" size={20} color="gray" />
          </TouchableOpacity>
        </View>

        {/* Deadline */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: "bold", marginBottom: 4 }}>
              {t("confirmDemand.deadline")}
            </Text>
            <Text>{deadline || "N/A"}</Text>
          </View>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("EditFundField", {
                field: "deadline",
                value: deadline,
              })
            }
          >
            <Ionicons name="create-outline" size={20} color="gray" />
          </TouchableOpacity>
        </View>
         <Divider />

        {/* Recipients */}
        <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 16 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: "bold", marginBottom: 4 }}>
              {t("confirmDemand.recipients")}
            </Text>
            {recipients && recipients.length > 0 ? (
              recipients.map((recipient, index) => (
                <Text key={index}>
                  {recipient.name} 
                </Text>
              ))
            ) : (
              <Text>{t("confirmDemand.no_recipients")}</Text>
            )}
          </View>
          <TouchableOpacity
            onPress={() =>
              navigation.navigate("SelectRecipients", {
                fromConfirmScreen: true,
                currentRecipients: recipients,
              })
            }
          >
            <Ionicons name="create-outline" size={20} color="gray" />
          </TouchableOpacity>
        </View>

        {/* Confirm Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          style={{
            backgroundColor: "#7ddd7d",
            paddingVertical: 14,
            borderRadius: 30,
            alignItems: "center",
            marginTop: 20,
          }}
        >
          {isLoading ? (
            <Loader color="green" />
          ) : (
            <Text style={{ color: "#000", fontWeight: "bold" }}>
              {t("confirmDemand.confirm")}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      <Toast />
    </View>
  );
};


const Divider = () => (
  <View style={{ borderBottomWidth: 1, borderColor: "#ccc", marginBottom: 12 }} />
);
export default ConfirmInformation;
