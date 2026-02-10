import React from 'react';
import { View } from 'react-native';

const FundSkeleton = () => {
  return (
    <View className="bg-white rounded-xl p-4 mb-4">
      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-1">
          <View className="h-6 bg-gray-200 rounded mb-2 w-3/4" />
          <View className="h-8 bg-gray-300 rounded mb-3 w-1/2" />
        </View>
        <View className="w-16 h-6 bg-gray-200 rounded" />
      </View>
      
      <View className="space-y-2 mb-4">
        <View className="h-4 bg-gray-100 rounded w-full" />
        <View className="h-4 bg-gray-100 rounded w-4/5" />
        <View className="h-4 bg-gray-100 rounded w-3/4" />
      </View>
      
      <View className="h-12 bg-gray-200 rounded" />
    </View>
  );
};

export default FundSkeleton;