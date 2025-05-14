import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const notificationApi = createApi({
  reducerPath: 'notificationApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: 'https://api.sf-e.ca/api/notification/',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    }
  }),
  tagTypes: ['Notifications'], // Add this line to specify your tag types
  endpoints: (builder) => ({
     getNotifications: builder.query({
      query: (userId) => `users/${userId}`,
      providesTags: ['Notifications']
    }),
    markAsRead: builder.mutation({
      query: (notificationId) => ({
        url: `read/${notificationId}`,
        method: 'PATCH'
      }),
      invalidatesTags: ['Notifications'] // This now references a defined tag type
    })
  })
});

export const { 
  useGetNotificationsQuery, 
  useMarkAsReadMutation 
} = notificationApi;