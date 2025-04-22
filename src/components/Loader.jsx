// components/Loader.js
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

const Loader = ({ size = "large", color = "green" }) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size={size} color={color} />
  </View>
);

export default Loader;
