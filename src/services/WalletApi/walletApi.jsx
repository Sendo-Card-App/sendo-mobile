import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Constants for endpoints
const WALLET_ENDPOINTS = {
  BALANCE: '/wallet/balance',
  TRANSFER: '/wallet/transfer-funds',
  RECHARGE: '/wallet/recharge',
  HISTORY: '/wallet/transactions',
};

const TAG_TYPES = {
  WALLET: 'Wallet',
  TRANSACTIONS: 'Transactions',
};

// Endpoints requiring passcode
const PASSCODE_REQUIRED_ENDPOINTS = [
  WALLET_ENDPOINTS.BALANCE,
  WALLET_ENDPOINTS.TRANSFER,
  WALLET_ENDPOINTS.RECHARGE
];

export const walletApi = createApi({
  reducerPath: 'walletApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.EXPO_PUBLIC_API_URL,
    prepareHeaders: (headers, { getState, endpoint }) => {
      const { accessToken, passcode } = getState().auth;
        console.log('Current endpoint:', endpoint); // Debug which endpoint is being called
        console.log('Passcode available:', !!getState().auth.passcode);
      // Set default headers
      headers.set('Accept', 'application/json');
      headers.set('Content-Type', 'application/json');
      
      if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
      }

      // Check if endpoint requires passcode
      const requiresPasscode = PASSCODE_REQUIRED_ENDPOINTS.some(path => 
        endpoint.startsWith(path)
      );

      if (requiresPasscode) {
        if (!passcode) {
          console.error('Passcode required but not available for endpoint:', endpoint);
        } else {
          headers.set('X-Passcode', passcode);
        }
      }

      return headers;
    },
  }),
  tagTypes: Object.values(TAG_TYPES),
  endpoints: (builder) => ({
    getBalance: builder.query({
      query: (userId) => `${WALLET_ENDPOINTS.BALANCE}/${userId}`,
      providesTags: [TAG_TYPES.WALLET],
    }),

    rechargeWallet: builder.mutation({
      query: (rechargeData) => ({
        url: WALLET_ENDPOINTS.RECHARGE,
        method: 'POST',
        body: rechargeData,
      }),
      invalidatesTags: [TAG_TYPES.WALLET],
    }),

    transferFunds: builder.mutation({
      query: (transferData) => ({
        url: WALLET_ENDPOINTS.TRANSFER,
        method: 'POST',
        body: transferData,
      }),
      invalidatesTags: [TAG_TYPES.WALLET],
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
  useRechargeWalletMutation,
  useTransferFundsMutation,
  useGetTransactionHistoryQuery,
} = walletApi;