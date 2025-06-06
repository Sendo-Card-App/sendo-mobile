// src/services/tontineApi.js

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const TONTINE_ENDPOINTS = {
  CREATE: '/tontines',
   LIST: (userId) => `/tontines/users/${userId}?page=1&limit=10`,
};

const TAG_TYPES = {
  TONTINE: 'Tontine',
};

export const tontineApi = createApi({
  reducerPath: 'tontineApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.EXPO_PUBLIC_API_URL,
    prepareHeaders: (headers, { getState }) => {
      const { accessToken } = getState().auth;
      const { passcode } = getState().passcode;

      headers.set('Accept', 'application/json');
      headers.set('Content-Type', 'application/json');

      if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
      }

      if (passcode) {
        headers.set('X-Passcode', passcode);
      }

      return headers;
    },
  }),
  tagTypes: Object.values(TAG_TYPES),
  endpoints: (builder) => ({
    createTontine: builder.mutation({
      query: (payload) => ({
        url: TONTINE_ENDPOINTS.CREATE,
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: [TAG_TYPES.TONTINE],
    }),

     addTontineMembers: builder.mutation({
      query: ({ tontineId, payload }) => ({
        url: `/tontines/${tontineId}/members`,
        method: "POST",
        body: payload,
      }),
       invalidatesTags: [TAG_TYPES.TONTINE],
    }),

    getTontineDetails: builder.query({
      query: ({ tontineId, userId }) => ({
        url: `/tontines/${tontineId}`,
        method: "POST",
        body: { userId }, 
      }),
      providesTags: [TAG_TYPES.TONTINE],
    }),



    getTontines: builder.query({
      query: (userId) => TONTINE_ENDPOINTS.LIST(userId),
      providesTags: [TAG_TYPES.TONTINE],
    }),
  }),
});

export const {
  useCreateTontineMutation,
  useGetTontinesQuery, // <--- EXPORT THIS
  useAddTontineMembersMutation,
  useGetTontineDetailsQuery,
} = tontineApi;
