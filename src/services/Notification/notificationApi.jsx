import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const notificationApi = createApi({
  reducerPath: 'notificationApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: `${process.env.EXPO_PUBLIC_API_URL}/notification`,
    prepareHeaders: (headers, { getState }) => {
      const { accessToken } = getState().auth;
      if (token) {
        headers.set('Authorization', `Bearer ${accessToken}`);
      }
      return headers;
    }
  }),
  tagTypes: ['Notifications'],
  endpoints: (builder) => ({
    getNotifications: builder.query({
      query: (userId) => `/users/${userId}`,
      providesTags: ['Notifications']
    }),
    markAsRead: builder.mutation({
      query: (notificationId) => ({
        url: `/read/${notificationId}`,
        method: 'PATCH'
      }),
      invalidatesTags: ['Notifications']
    }),
    sendNotification: builder.mutation({
      query: (notificationData) => ({
        url: '/send',
        method: 'POST',
        body: notificationData,
      }),
      invalidatesTags: ['Notifications'],
    }),
  })
});

export const { 
  useGetNotificationsQuery, 
  useMarkAsReadMutation,
  useSendNotificationMutation
} = notificationApi;