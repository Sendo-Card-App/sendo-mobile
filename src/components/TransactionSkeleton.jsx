// components/SharedExpenseSkeleton.js
import React from 'react';
import { View } from 'react-native';
import { Skeleton } from 'moti/skeleton';

const TransactionSkeleton = () => {
  return (
    <View className="bg-white rounded-xl p-4 mb-3 border border-gray-200">
      <View className="flex-row justify-between items-center mb-2">
        <Skeleton colorMode="light" height={16} width="30%" radius="round" />
        <Skeleton colorMode="light" height={16} width="30%" radius="round" />
      </View>
      <Skeleton colorMode="light" height={16} width="50%" radius="round" />
      <View className="flex-row items-center gap-2 mt-3">
        {[...Array(4)].map((_, index) => (
          <Skeleton key={index} colorMode="light" height={24} width={24} radius="round" />
        ))}
      </View>
    </View>
  );
};

export default TransactionSkeleton;
