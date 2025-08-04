import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const CARD_ENDPOINTS = {
  SEND_REQUEST: '/cards/onboarding/send-request',
  GET_USER_REQUEST: '/cards/onboarding/requests/user',
  CREATE_VIRTUAL_CARD: '/cards',
  GET_VIRTUAL_CARDS: '/cards/user',
  GET_VIRTUAL_CARD_DETAILS: '/cards/', // with {cardId}
   GET_VIRTUAL_CARD_HIDE: '/cards/details/', 
  FREEZE_CARD: '/cards/freeze/',
  UNFREEZE_CARD: '/cards/unfreeze/',
  DEPOSIT: '/cards/deposit',
  WITHDRAW: '/cards/withdrawal',
};

export const cardApi = createApi({
  reducerPath: 'cardApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.EXPO_PUBLIC_API_URL,
    prepareHeaders: (headers, { getState, endpoint }) => {
      const { accessToken } = getState().auth;
      const { passcode } = getState().passcode;

      headers.set('Accept', 'application/json');
      headers.set('Content-Type', 'application/json');

      if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
      }

      const passcodeRequiredEndpoints = [
        'rechargeCard',
        'withdrawFromCard',
      ];

      if (passcodeRequiredEndpoints.includes(endpoint)) {
        if (passcode) {
          headers.set('X-Passcode', passcode);
        } else {
          console.warn(`⚠️ Missing or invalid passcode (${passcode}) for endpoint: ${endpoint}`);
        }
      }

      return headers;
    }
  }),
  tagTypes: ['Card'],
  endpoints: (builder) => ({
    requestVirtualCard: builder.mutation({
      query: ({documentType}) => ({
        url: CARD_ENDPOINTS.SEND_REQUEST,
        method: 'POST',
        body: { documentType },
      }),
      invalidatesTags: ['Card'],
    }),

    createVirtualCard: builder.mutation({
      query: (body) => ({
        url: CARD_ENDPOINTS.CREATE_VIRTUAL_CARD,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Card'],
    }),

    getVirtualCardStatus: builder.query({
      query: () => CARD_ENDPOINTS.GET_USER_REQUEST,
      providesTags: ['Card'],
    }),

    getVirtualCards: builder.query({
      query: () => CARD_ENDPOINTS.GET_VIRTUAL_CARDS,
      providesTags: ['Card'],
    }),

    getVirtualCardDetails: builder.query({
      query: (cardId) => `${CARD_ENDPOINTS.GET_VIRTUAL_CARD_DETAILS}${cardId}`,
      providesTags: ['Card'],
    }),

     getVirtualCardDetailsHide: builder.query({
      query: (cardId) => `${CARD_ENDPOINTS.GET_VIRTUAL_CARD_HIDE}${cardId}`,
      providesTags: ['Card'],
    }),

    freezeCard: builder.mutation({
      query: (cardId) => ({
        url: `${CARD_ENDPOINTS.FREEZE_CARD}${cardId}`,
        method: 'PUT',
      }),
      invalidatesTags: ['Card'],
    }),

    unfreezeCard: builder.mutation({
      query: (cardId) => ({
        url: `${CARD_ENDPOINTS.UNFREEZE_CARD}${cardId}`,
        method: 'PUT',
      }),
      invalidatesTags: ['Card'],
    }),

    rechargeCard: builder.mutation({
      query: ({ matriculeWallet, amount, idCard }) => ({
        url: CARD_ENDPOINTS.DEPOSIT,
        method: 'POST',
        body: { matriculeWallet, amount, idCard },
      }),
      invalidatesTags: ['Card'],
    }),

    withdrawFromCard: builder.mutation({
      query: ({ matriculeWallet, amount, idCard }) => ({
        url: CARD_ENDPOINTS.WITHDRAW,
        method: 'POST',
        body: { matriculeWallet, amount, idCard },
      }),
      invalidatesTags: ['Card'],
    }),

    getCardTransactions: builder.query({
      query: (cardId) => `/cards/${cardId}/transactions`,
      providesTags: ['Card'],
    }),

    getCardBalance: builder.query({
      query: ({ idCard }) => `/cards/balance?idCard=${idCard}`,
      providesTags: ['Card'],
    }),



    deleteCard: builder.mutation({
      query: (cardId) => ({
        url: `/cards/${cardId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Card'],
    }),

    getCardDebts: builder.query({
      query: (idCard) => `/cards/${idCard}/debts`,
    }),

  getUnlockStatus: builder.query({
    query: (cardId) => `/cards/${cardId}/unlock`,
  }),


  }),
});

export const {
  useRequestVirtualCardMutation,
  useCreateVirtualCardMutation,
  useGetVirtualCardStatusQuery,
  useGetVirtualCardsQuery,
  useGetVirtualCardDetailsQuery,
  useGetVirtualCardDetailsHideQuery,
  useFreezeCardMutation,
  useUnfreezeCardMutation,
  useRechargeCardMutation,
  useWithdrawFromCardMutation,
  useGetCardTransactionsQuery,
   useGetCardBalanceQuery,
  useDeleteCardMutation,
  useGetCardDebtsQuery,
  useGetUnlockStatusQuery,

} = cardApi;
