import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const KYC_ENDPOINTS = {
  SUBMIT_KYC: '/kyc/send',
  GET_STATUS: '/kyc/status',
  SEND_SELFIE: '/users/send-picture',
  NIU_REQUEST: '/requests/ask',
};

export const kycApi = createApi({
  reducerPath: 'kycApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: process.env.EXPO_PUBLIC_API_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.accessToken;
      if (token) headers.set('Authorization', `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ['KYC'],
  
  endpoints: (builder) => ({
    submitKYC: builder.mutation({
      query: (formData) => ({
        url: KYC_ENDPOINTS.SUBMIT_KYC,
        method: 'POST',
        body: formData,
        formData: true,
      }),
      invalidatesTags: ['KYC'],
    }),
    
    sendSelfie: builder.mutation({
      query: (formData) => ({
        url: KYC_ENDPOINTS.SEND_SELFIE,
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }),
    }),
     
    NiuResquest: builder.mutation({
      query: (requestData) => ({
        url: KYC_ENDPOINTS.NIU_REQUEST,
        method: 'POST',
        body: requestData,
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    }),
    
    getKYCStatus: builder.query({
      query: () => KYC_ENDPOINTS.GET_STATUS,
      providesTags: ['KYC'],
    }),
  }),
});

export const { 
  useSubmitKYCMutation, 
  useGetKYCStatusQuery,
  useSendSelfieMutation,
  useNiuResquestMutation,
} = kycApi;