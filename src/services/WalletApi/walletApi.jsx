import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Constants for endpoints
const WALLET_ENDPOINTS = {
  BALANCE: '/wallet/balance',
  TRANSFER: '/wallet/transfer-funds',
  RECHARGE: '/mobile-money/neero/init/deposit',
  WITHDRAWAL: '/mobile-money/neero/init/withdrawal',
  HISTORY: '/wallet/transactions',
  REQUEST_WITHDRAWAL: '/wallet/request-withdrawal', 
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
    baseUrl: process.env.EXPO_TEST_API_URL,
    prepareHeaders: (headers, { getState, endpoint }) => {
  const { accessToken } = getState().auth;
  const { passcode } = getState().passcode;

    headers.set('Accept', 'application/json');

    if (endpoint !== 'bankrecharge') {
    headers.set('Content-Type', 'application/json');
  }


  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  // ✅ Only add passcode for getBalance or other specific endpoints
  const passcodeRequiredEndpoints = ['getBalance', 'rechargeWallet', 'transferFunds', 'withdrawalWallet', 'simulatePayment', 'initTransfer', 'bankrecharge', 'initTransferToDestinataire', 'requestWithdrawal'];

  if (passcodeRequiredEndpoints.includes(endpoint)) {
    if (passcode) {
      headers.set('X-Passcode', passcode);
    } else {
      console.warn(`Passcode required but missing for endpoint: ${endpoint}`);
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

    requestWithdrawal: builder.mutation({
      query: (payload) => ({
        url: WALLET_ENDPOINTS.REQUEST_WITHDRAWAL,
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: [TAG_TYPES.WALLET],
    }),
    bankrecharge: builder.mutation({
      query: (formData) => ({
        url: '/wallet/recharge',
        method: 'POST',
        body: formData,
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
  useBankrechargeMutation,
  useRequestWithdrawalMutation,
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