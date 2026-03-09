import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Endpoints constants
const PUBS_ENDPOINTS = {
  LIST: '/admin/pubs',
};

// Tag type
const TAG_TYPES = {
  PUB: 'Pub',
};

export const pubApi = createApi({
  reducerPath: 'pubApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.EXPO_TEST_API_URL,
    prepareHeaders: (headers, { getState }) => {
      const { accessToken } = getState().auth;
      headers.set('Accept', 'application/json');
      if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
      }
      return headers;
    },
  }),
  tagTypes: [TAG_TYPES.PUB],
  endpoints: (builder) => ({

   getPubs: builder.query({
      query: () => ({
        url: '/admin/pubs',
        method: 'GET',
        params: { 
          page: 1, 
          limit: 10,
         
        }
      }),
      transformResponse: (response) => response.data, // Assuming your API wraps data in a data property
      providesTags: ['Pub'],
    }),
    
  }),
});

export const {
  useGetPubsQuery,

} = pubApi;
