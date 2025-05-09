import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const paymentSimulatorAPI = createApi({
  reducerPath: 'paymentSimulatorAPI',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://api.sf-e.ca/api' }),
  endpoints: (builder) => ({
    getExchangeRates: builder.query({
      query: () => '/exchange-rates',
    }),
    getExchangeRate: builder.query({
        query: ({ from, to }) => `/configs/get-one-value?from=${from}&to=${to}`,
      }),

    simulatePayment: builder.mutation({
      query: ({ amount, currency }) => ({
        url: 'users/try-simulation-payment',
        method: 'POST',
        body: { amount, currency },
      }),
    }),
  }),
});

export const { 
  useGetExchangeRatesQuery, 
  useGetExchangeRateQuery,
  useSimulatePaymentMutation 
} = paymentSimulatorAPI;