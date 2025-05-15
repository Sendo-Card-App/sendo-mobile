// services/Config/configApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const configApi = createApi({
  reducerPath: 'configApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: process.env.EXPO_PUBLIC_API_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.accessToken;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getConfig: builder.query({
      query: () => `/configs`,
    }),
  }),
});

export const { useGetConfigQuery } = configApi;