import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Constants for endpoints
const WALLET_ENDPOINTS = {
  BALANCE: '/wallet/balance/',
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
  '/wallet/balance/',
  '/wallet/transfer-funds',
  '/wallet/recharge'
];

export const walletApi = createApi({
  reducerPath: 'walletApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.EXPO_PUBLIC_API_URL,
    prepareHeaders: (headers, { getState }) => {
      const { accessToken, passcode } = getState().auth;
      
      headers.set('accept', '*/*');
      headers.set('Content-Type', 'application/json');
      
      if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
      }
     // Add passcode for sensitive endpoints
      const requiresPasscode = PASSCODE_REQUIRED_ENDPOINTS.some(requiredEndpoint => 
        endpoint.includes(requiredEndpoint)
      );
      
      if (requiresPasscode && passcode) {
        headers.set('X-Passcode', passcode);
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
  useTransferFundsMutation,
  useRechargeWalletMutation,
  useGetTransactionHistoryQuery,
} = walletApi;