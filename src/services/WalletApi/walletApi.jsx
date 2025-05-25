import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Constants for endpoints
const WALLET_ENDPOINTS = {
  BALANCE: '/wallet/balance',
  TRANSFER: '/wallet/transfer-funds',
  RECHARGE: '/mobile-money/init/deposit',
  WITHDRAWAL: '/mobile-money/init/withdrawal',
  HISTORY: '/wallet/transactions',
};

const TAG_TYPES = {
  WALLET: 'Wallet',
  TRANSACTIONS: 'Transactions',
  TRANSFERS: 'Transfers',
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
      const { accessToken } = getState().auth;
      const { passcode } = getState().passcode
      console.log('Current endpoint:', endpoint); // Debug which endpoint is being called
      console.log('Passcode available:', passcode);
      // Set default headers
      headers.set('Accept', 'application/json');
      headers.set('Content-Type', 'application/json');
      
      if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
      }

      if (passcode) {
        headers.set('X-Passcode', passcode);
      }

      // Check if endpoint requires passcode
      /*const requiresPasscode = PASSCODE_REQUIRED_ENDPOINTS.some(path => 
        endpoint.startsWith(path)
      );

      if (requiresPasscode) {
        if (!passcode) {
          console.error('Passcode required but not available for endpoint:', endpoint);
        } else {
          headers.set('X-Passcode', passcode);
        }
      }*/

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
      query: (payload) => ({
        url: WALLET_ENDPOINTS.RECHARGE,
        method: 'POST',
        body: payload,
         providesTags: [TAG_TYPES.WALLET],
      }),
      invalidatesTags: [TAG_TYPES.WALLET],
    }),

    withdrawalWallet: builder.mutation({
      query: (payload) => ({
        url: WALLET_ENDPOINTS.WITHDRAWAL,
        method: 'POST',
        body: payload,
         providesTags: [TAG_TYPES.WALLET],
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
      query: ({ userId, page = 1, limit = 10, type, status, method, startDate, endDate }) => {
        const params = {
          page,
          limit,
          ...(type && { type }),
          ...(status && { status }),
          ...(method && { method }),
          ...(startDate && { startDate }),
          ...(endDate && { endDate })
        };
        
        return {
          url: `/transactions/users/${userId}`,
          method: 'GET',
          params
        };
      },
      providesTags: [TAG_TYPES.TRANSACTIONS],
    }),

    getWalletDetails: builder.query({
      query: (walletId) => ({
        url: `/wallet/${walletId}`,
        method: 'GET',
      }),
      providesTags: [TAG_TYPES.WALLET],
    }),

     checkTransactionStatus: builder.query({
      query: ({ trid, type, transactionId }) => ({
        url: `/mobile-money/check?trid=${trid}&type=${type}&transactionId=${transactionId}`,
        method: 'GET',
      }),
    }),
    
    simulatePayment: builder.mutation({
      query: ({ amount, currency }) => ({
        url: '/users/try-simulation-payment',
        method: 'POST',
        body: { amount, currency },
      }),
      providesTags: [TAG_TYPES.WALLET],
    }),

     getTransfers: builder.query({
      query: () => '/transfer-money/list',
       providesTags: [TAG_TYPES.TRANSFERS],
      }),
    
    // Initialize new transfer
    initTransfer: builder.mutation({
      query: (payload) => ({
        url: '/transfer-money/init',
        method: 'POST',
        body: payload,
        providesTags: [TAG_TYPES.TRANSFERS],
      }),
      invalidatesTags: [TAG_TYPES.TRANSFERS],
    }),

    initTransferToDestinataire: builder.mutation({
      query: ({ destinataireId, amount, description = '' }) => ({
        url: '/transfer-money/init-to-know-destinataire',
        method: 'POST',
        body: { destinataireId, amount, description },
         providesTags: [TAG_TYPES.TRANSFERS],
      }),
      invalidatesTags: [TAG_TYPES.TRANSFERS],
    }),
  }),
});

export const {
  useGetBalanceQuery,
  useRechargeWalletMutation,
  useWithdrawalWalletMutation,
  useTransferFundsMutation,
  useGetTransactionHistoryQuery,
  useSimulatePaymentMutation,
  useCheckTransactionStatusQuery,
  useGetWalletDetailsQuery,
  useGetTransfersQuery,
   useInitTransferMutation,
   useInitTransferToDestinataireMutation,
} = walletApi;