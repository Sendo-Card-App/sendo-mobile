import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const fundSubscriptionApi = createApi({
  reducerPath: 'fundSubscriptionApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.EXPO_TEST_API_URL,
    prepareHeaders: (headers, { getState, endpoint }) => {
      const { accessToken } = getState().auth;
      const { passcode } = getState().passcode;

      headers.set('Accept', 'application/json');
      headers.set('Content-Type', 'application/json');

      if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
      }

      const passcodeRequiredEndpoints = [
        'subscribeToFund',
        'requestWithdrawal',
      ];

      if (passcodeRequiredEndpoints.includes(endpoint)) {
        if (passcode) {
          headers.set('X-Passcode', passcode);
        } else {
          console.warn(`⚠️ Missing passcode for endpoint: ${endpoint}`);
        }
      }

      return headers;
    },
  }),
  tagTypes: ['FundSubscription'],
  endpoints: (builder) => ({
    // Récupérer tous les fonds disponibles
    getFunds: builder.query({
      query: ({ page = 1, limit = 10 }) => 
        `/fund-subscriptions/funds?page=${page}&limit=${limit}`,
      providesTags: ['FundSubscription'],
    }),

    // Récupérer les souscriptions d'un utilisateur
    getMySubscriptions: builder.query({
      query: ({ userId, page = 1, limit = 10 }) => 
        `/fund-subscriptions/subscriptions?page=${page}&limit=${limit}&userId=${userId}`,
      providesTags: ['FundSubscription'],
    }),

    // Souscrire à un fond
    subscribeToFund: builder.mutation({
      query: (payload) => ({
        url: '/fund-subscriptions/subscribe',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['FundSubscription'],
    }),

    // Demande de retrait
    requestWithdrawal: builder.mutation({
      query: (payload) => ({
        url: '/fund-subscriptions/withdrawals/request',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['FundSubscription'],
    }),
  }),
});

export const {
  useGetFundsQuery,
  useGetMySubscriptionsQuery,
  useSubscribeToFundMutation,
  useRequestWithdrawalMutation,
} = fundSubscriptionApi;