// components/Loader.js
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

const Loader = ({ size = "small", color = "green" }) => (
  <View style={{ justifyContent: 'center', alignItems: 'center' }}>
    <ActivityIndicator size={size} color={color} />
  </View>
);

export default Loader;
