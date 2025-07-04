import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const KYC_ENDPOINTS = {
  SUBMIT_KYC: '/kyc/upload',
  GET_STATUS: '/kyc/status',
  UPDATE_PROFILE: '/kyc/update-profil',
  SEND_SELFIE: '/users/send-picture',
  NIU_REQUEST: '/requests/ask',
  GET_USER_REQUESTS: '/requests/users',
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
  tagTypes: ['KYC', 'Requests'],
  
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

    updateProfile: builder.mutation({
      query: (profileData) => ({
        url: KYC_ENDPOINTS.UPDATE_PROFILE,
        method: 'PUT',
        body: profileData,
        headers: {
          'Content-Type': 'application/json',
          'accept': '*/*',
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

    getUserRequests: builder.query({
      query: (userId) => `${KYC_ENDPOINTS.GET_USER_REQUESTS}/${userId}`,
      providesTags: ['Requests'],
    }),
  }),
});

export const { 
  useSubmitKYCMutation, 
  useGetKYCStatusQuery,
  useGetUserRequestsQuery,
  useSendSelfieMutation,
  useNiuResquestMutation,
  useUpdateProfileMutation 
} = kycApi;