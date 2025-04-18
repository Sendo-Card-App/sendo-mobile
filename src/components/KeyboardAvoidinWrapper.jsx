import React from "react";
import {
  KeyboardAvoidingView,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from "react-native";

const KeyboardAvoidinWrapper = ({ children }) => {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : ""}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <TouchableWithoutFeedback
          onPress={() => Keyboard.dismiss()}
          style={{ flex: 1 }}
        >
          {children}
        </TouchableWithoutFeedback>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default KeyboardAvoidinWrapper;
