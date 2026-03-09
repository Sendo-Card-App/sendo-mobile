// services/configApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const configApi = createApi({
  reducerPath: 'configApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: process.env.EXPO_TEST_API_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = getState()?.auth?.accessToken;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      headers.set('accept', '*/*');
      return headers;
    },
  }),
  endpoints: (builder) => ({
    convertCurrency: builder.mutation({
      query: ({ from, to, amount }) => ({
        url: '/configs/convert-devise',
        method: 'GET',
        params: { from, to, amount },
      }),
    }),

   
    getConfig: builder.query({
      query: () => `/configs`,
    }),
  
  }),
});

export const { 
  useConvertCurrencyMutation, 
  useGetConfigQuery,
} = configApi;