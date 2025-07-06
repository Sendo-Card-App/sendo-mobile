import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const CARD_ENDPOINTS = {
  SEND_REQUEST: '/cards/onboarding/send-request',
  GET_USER_REQUEST: '/cards/onboarding/requests/user',
  CREATE_VIRTUAL_CARD: '/cards',
};

export const cardApi = createApi({
  reducerPath: 'cardApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.EXPO_PUBLIC_API_URL,
   prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.accessToken;

    if (token) {
        // console.log(' Token présent :', token); 
        headers.set('Authorization', `Bearer ${token}`);
    } else {
        // console.warn(' Aucun token trouvé dans le state'); 
    }

    return headers;
    }

  }),
  tagTypes: ['Card'],

  endpoints: (builder) => ({
    requestVirtualCard: builder.mutation({
      query: () => ({
        url: CARD_ENDPOINTS.SEND_REQUEST,
        method: 'POST',
        body: {},
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
  }),
});

export const {
  useRequestVirtualCardMutation,
  useCreateVirtualCardMutation,
  useGetVirtualCardStatusQuery,
} = cardApi;
