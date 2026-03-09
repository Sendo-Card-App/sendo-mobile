import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const notificationApi = createApi({
  reducerPath: 'notificationApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: process.env.EXPO_TEST_API_URL,
    prepareHeaders: (headers, { getState }) => {
      const { accessToken } = getState().auth;

      headers.set('Accept', 'application/json');
      headers.set('Content-Type', 'application/json');

      if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
      }

      return headers;
    }
  }),
  tagTypes: ['Notifications'],
  endpoints: (builder) => ({
   getNotifications: builder.query({
      query: ({ userId, page = 1, limit = 10 }) => ({
        url: `/notification/users/${userId}`,
        method: 'GET',
        params: { page, limit },
      }),
      providesTags: ['Notifications'],
    }),

    sendNotification: builder.mutation({
      query: (notificationData) => ({
        url: '/notification/send',
        method: 'POST',
        body: notificationData,
      }),
      invalidatesTags: ['Notifications'],
    }),

    markAsRead: builder.mutation({
      query: (id) => ({
        url: `/notification/${id}/read`,
        method: 'PUT',
      }),
      invalidatesTags: ['Notifications'],
    }),
  }),
});

export const { 
  useGetNotificationsQuery, 
  useSendNotificationMutation,
  useMarkAsReadMutation,
} = notificationApi;
