import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Constants for endpoints
const WALLET_ENDPOINTS = {
  BALANCE: '/wallet/balance/',
  TRANSFER: '/wallet/transfer-funds',
  HISTORY: '/wallet/transactions',
};

const TAG_TYPES = {
  WALLET: 'Wallet',
  TRANSACTIONS: 'Transactions',
};

export const walletApi = createApi({
  reducerPath: 'walletApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.accessToken;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: Object.values(TAG_TYPES),
  endpoints: (builder) => ({
    getBalance: builder.query({
      query: (userId) => `/wallet/balance/${userId}`,
      transformResponse: (response) => {
       // console.log('Raw API Response:', response);
        return response;
      },
      providesTags: [TAG_TYPES.WALLET],
    }),
    
    
    transferFunds: builder.mutation({
      query: (transferData) => ({
        url: WALLET_ENDPOINTS.TRANSFER,
        method: 'POST',
        body: transferData,
      }),
      invalidatesTags: [TAG_TYPES.WALLET, TAG_TYPES.TRANSACTIONS],
    }),
    
    getTransactionHistory: builder.query({
      query: ({ limit = 10, offset = 0 }) => ({
        url: WALLET_ENDPOINTS.HISTORY,
        params: { limit, offset },
      }),
      providesTags: [TAG_TYPES.TRANSACTIONS],
    }),
  }),
});

export const {
  useGetBalanceQuery,
  useTransferFundsMutation,
  useGetTransactionHistoryQuery,
} = walletApi;