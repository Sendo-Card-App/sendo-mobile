import React from 'react';
import { View } from 'react-native';

const SubscriptionSkeleton = () => {
  return (
    <View className="bg-white rounded-xl p-4 mb-4">
      <View className="flex-row justify-between items-start mb-3">
        <View className="flex-1">
          <View className="h-6 bg-gray-200 rounded mb-2 w-2/3" />
          <View className="h-7 bg-gray-300 rounded w-1/2" />
        </View>
        <View className="w-20 h-6 bg-gray-200 rounded" />
      </View>
      
      <View className="space-y-3">
        <View className="flex-row justify-between">
          <View className="h-4 bg-gray-100 rounded w-1/4" />
          <View className="h-4 bg-gray-100 rounded w-1/3" />
        </View>
        <View className="flex-row justify-between">
          <View className="h-4 bg-gray-100 rounded w-1/3" />
          <View className="h-4 bg-gray-100 rounded w-1/4" />
        </View>
        <View className="flex-row justify-between">
          <View className="h-4 bg-gray-100 rounded w-1/2" />
          <View className="h-4 bg-gray-100 rounded w-1/5" />
        </View>
      </View>
      
      <View className="h-12 bg-gray-200 rounded mt-4" />
    </View>
  );
};

export default SubscriptionSkeleton;