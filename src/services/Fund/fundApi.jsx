import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const FUND_REQUEST_ENDPOINTS = {
  CREATE: '/fund-requests/create',
  MY_REQUESTS: '/fund-requests/my-requests',
};

const TAG_TYPES = {
  FUND_REQUEST: 'FundRequest',
};

export const fundRequestApi = createApi({
  reducerPath: 'fundRequestApi',
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
  } else {
    console.warn('⚠️ Aucun passcode détecté dans le store');
  }

      return headers;
    },
  }),
  tagTypes: Object.values(TAG_TYPES),
  endpoints: (builder) => ({
    createFundRequest: builder.mutation({
      query: (payload) => ({
        url: FUND_REQUEST_ENDPOINTS.CREATE,
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: [TAG_TYPES.FUND_REQUEST],
    }),
    getMyFundRequests: builder.query({
      query: (userId) => `${FUND_REQUEST_ENDPOINTS.MY_REQUESTS}/${userId}`,
      providesTags: [TAG_TYPES.FUND_REQUEST],
    }),

    updateFundRequestStatus: builder.mutation({
  query: ({ fundRequestId, status }) => ({
      url: `/fund-requests/${fundRequestId}/status`,
      method: 'PATCH',
      body: { status }, // status: 'CANCELLED'
    }),
    invalidatesTags: [TAG_TYPES.FUND_REQUEST],
  }),
 getFundRequestList: builder.query({
  query: ({ page = 1, limit = 10 }) =>
    `/fund-requests/users/list?page=${page}&limit=${limit}`,
  providesTags: [TAG_TYPES.FUND_REQUEST],
}),
 deleteFundRequest: builder.mutation({
  query: (fundRequestId) => ({
    url: `/fund-requests/${fundRequestId}`,
    method: 'DELETE',
  }),
  invalidatesTags: [TAG_TYPES.FUND_REQUEST],
}),
 updateRecipientStatus: builder.mutation({
  query: ({ requestRecipientId, status }) => ({
    url: `/fund-requests/recipients/${requestRecipientId}/status`,
    method: 'PATCH',
    body: { status },
  }),
  invalidatesTags: [TAG_TYPES.FUND_REQUEST],
}),
payFundRequest: builder.mutation({
  query: ({ requestRecipientId, payload }) => ({
    url: `/fund-requests/recipients/${requestRecipientId}/pay`,
    method: 'POST',
    body: payload,
     providesTags: [TAG_TYPES.FUND_REQUEST],
  }),
  invalidatesTags: [TAG_TYPES.FUND_REQUEST],
}),




  }),
});

export const {
  useCreateFundRequestMutation,
  useGetMyFundRequestsQuery,
   useUpdateFundRequestStatusMutation,
    useGetFundRequestListQuery,
    useDeleteFundRequestMutation,
    useUpdateRecipientStatusMutation,
     usePayFundRequestMutation ,
} = fundRequestApi;
