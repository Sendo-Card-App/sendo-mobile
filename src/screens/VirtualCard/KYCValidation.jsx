import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
} from "react-native";
import Loader from "../../components/Loader";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTranslation } from "react-i18next";

const documentTypeMap = {
  ID_PROOF: "kyc.id_proof",
  ADDRESS_PROOF: "kyc.address_proof",
  NIU_PROOF: "kyc.niu_proof",
  SELFIE: "kyc.selfie", // ✅ Added SELFIE
};

const KYCValidation = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { documents } = route.params;
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [visibleImages, setVisibleImages] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const groupedDocs = documents.reduce((acc, doc) => {
    if (!acc[doc.type]) acc[doc.type] = [];
    acc[doc.type].push(doc);
    return acc;
  }, {});

  const kycItems = Object.keys(documentTypeMap).map((type) => {
    const docList = groupedDocs[type] || [];
    const firstDoc = docList[0];

    let status = null;
    let statusColor = "";
    if (firstDoc) {
      if (firstDoc.status === "APPROVED") {
        status = t("kyc.approved");
        statusColor = "text-green-500";
      } else if (firstDoc.status === "REJECTED") {
        status = t("kyc.rejected");
        statusColor = "text-red-500";
      } else {
        status = t("kyc.pending");
        statusColor = "text-yellow-500";
      }
    }

    return {
      id: type,
      title: t(documentTypeMap[type] || type),
      status,
      statusColor,
      urls: docList.map((doc) => doc.url),
      hasDoc: !!firstDoc,
    };
  });

  return (
    <View className="flex-1 bg-[#7ddd7d]">
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingTop: 50,
          paddingBottom: 15,
          paddingHorizontal: 20,
          backgroundColor: "#7ddd7d",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity onPress={() => navigation.navigate("MainTabs")}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "bold", color: "#000" }}>
          {t("kyc.my_kyc")}
        </Text>
        <TouchableOpacity onPress={() => navigation.openDrawer()}>
          <Ionicons name="menu-outline" size={24} color="black" />
        </TouchableOpacity>
      </View>

      <View className="h-3 mt-3 bg-white" />

      {/* KYC Items */}
      <ScrollView className="px-4 bg-white">
        {kycItems.map((item) => (
          <View
            key={item.id}
            className="bg-gray-100 rounded-xl p-4 mb-4 shadow-sm"
          >
            <View className="flex-row justify-between items-center">
              <View className="flex-1">
                <View className="flex-row items-center mb-1">
                  <Feather name="file-text" size={16} color="black" />
                  <Text className="ml-2 font-semibold text-sm text-black">
                    {item.title}
                  </Text>
                </View>

                {item.status && (
                  <Text
                    className={`${item.statusColor} text-sm font-medium text-center`}
                  >
                    {item.status}
                  </Text>
                )}
              </View>

              {/* Eye icon */}
              <View className="flex-row gap-2">
                {item.urls.length > 0 && (
                  <TouchableOpacity
                    onPress={() => {
                      setVisibleImages(item.urls);
                      setCurrentIndex(0);
                    }}
                    className="p-2 bg-green-500 rounded-full"
                  >
                    <Feather name="eye" size={16} color="white" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Image Viewer Modal */}
      <Modal
        visible={!!visibleImages}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setVisibleImages(null);
          setCurrentIndex(0);
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.85)",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 20,
          }}
        >
          {visibleImages && visibleImages[currentIndex] && (
            <>
              {loading && (
                <View
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 10,
                    backgroundColor: "rgba(0,0,0,0.6)",
                  }}
                >
                  <Loader size="large" color="#fff" />
                </View>
              )}

              <Image
                source={{ uri: visibleImages[currentIndex] }}
                style={{
                  width: "100%",
                  height: "70%",
                  resizeMode: "contain",
                  borderRadius: 10,
                  opacity: loading ? 0 : 1,
                }}
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
              />
            </>
          )}

          {/* Controls */}
          <View className="flex-row justify-between items-center mt-4 w-full px-10">
            <TouchableOpacity
              onPress={() =>
                setCurrentIndex((prev) =>
                  prev > 0 ? prev - 1 : visibleImages.length - 1
                )
              }
              className="p-2 bg-white rounded-full"
            >
              <Feather name="chevron-left" size={24} color="#000" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setVisibleImages(null);
                setCurrentIndex(0);
              }}
              className="p-2 bg-red-600 rounded-full"
            >
              <Feather name="x" size={24} color="white" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                setCurrentIndex((prev) =>
                  prev < visibleImages.length - 1 ? prev + 1 : 0
                )
              }
              className="p-2 bg-white rounded-full"
            >
              <Feather name="chevron-right" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default KYCValidation;
