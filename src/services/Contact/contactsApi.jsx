// services/Contacts/contactsApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const contactsApi = createApi({
  reducerPath: 'contactsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.EXPO_PUBLIC_API_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.accessToken;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['Contacts', 'Favorites'],
  
  endpoints: (builder) => ({
    synchronizeContacts: builder.mutation({
      query: (contacts) => ({
        url: '/contacts/synchronize',
        method: 'POST',
        body: { contacts },
      }),
      invalidatesTags: ['Contacts'],
    }),
    
    getSynchronizedContacts: builder.query({
      query: (userId) => `/contacts/users/${userId}`,
      providesTags: ['Contacts'],
    }),
    
    addFavorite: builder.mutation({
      query: ({ userId, phone }) => ({
        url: `/contacts/favorites/${userId}`,
        method: 'POST',
        body: { phone },
      }),
      invalidatesTags: ['Favorites'],
    }),
    
    removeFavorite: builder.mutation({
      query: ({ userId, phone }) => ({
        url: `/contacts/favorites/${userId}`,
        method: 'DELETE',
        body: { phone },
      }),
      invalidatesTags: ['Favorites'],
    }),
    
   getFavorites: builder.query({
  query: (userId) => `/contacts/users/${userId}/favorites`,
  transformResponse: (response) => {
    // Ensure we always return an array
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (response.data && Array.isArray(response.data)) return response.data;
    return [];
  },
  providesTags: ['Favorites'],
}),
  }),
});

export const { 
  useSynchronizeContactsMutation,
  useGetSynchronizedContactsQuery,
  useAddFavoriteMutation,
  useRemoveFavoriteMutation,
  useGetFavoritesQuery,
} = contactsApi;