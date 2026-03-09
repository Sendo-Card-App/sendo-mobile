import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const TONTINE_ENDPOINTS = {
  CREATE: '/tontines',
  LIST: (userId, page = 1, limit = 25) => `/tontines/users/${userId}?page=${page}&limit=${limit}`,
};

const TAG_TYPES = {
  TONTINE: 'Tontine',
};

export const tontineApi = createApi({
  reducerPath: 'tontineApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.EXPO_TEST_API_URL,
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

    addPenalty: builder.mutation({
      query: ({ tontineId, payload }) => ({
        url: `/tontines/${tontineId}/penalites`,
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: [TAG_TYPES.TONTINE],
    }),

    contribute: builder.mutation({
      query: ({ tontineId, membreId, cotisationId, montant }) => ({
        url: `/tontines/${tontineId}/contribute`,
        method: 'POST',
        body: {
          montant,
          membreId,
          cotisationId,
        },
      }),
      invalidatesTags: [TAG_TYPES.TONTINE],
    }),

    getCotisations: builder.query({
      query: ({ tontineId, memberId }) => ({
        url: `/tontines/${tontineId}/tours?memberId=${memberId}`,
        method: 'GET',
      }),
      providesTags: [TAG_TYPES.TONTINE],
    }),
    
    getToursDistribution: builder.query({
      query: ({ tontineId }) => ({
        url: `/tontines/${tontineId}/tours-distribution`,
      }),
      providesTags: [TAG_TYPES.TONTINE],
    }),

    setTontineOrder: builder.mutation({
      query: ({ tontineId, ordreRotation }) => ({
        url: `/tontines/${tontineId}/ordre-rotation`,
        method: 'POST',
        body: { ordreRotation },
      }),
      invalidatesTags: [TAG_TYPES.TONTINE],
    }),

    accessOrRejectTontine: builder.mutation({
      query: ({ invitationCode, membreId, type }) => ({
        url: '/tontines/access-or-reject',
        method: 'POST',
        body: {
          invitationCode,
          membreId,
          type,
        },
      }),
      invalidatesTags: [TAG_TYPES.TONTINE],
    }),

    getMemberPenalties: builder.query({
      query: ({ tontineId, membreId }) => ({
        url: `/tontines/${tontineId}/membres/${membreId}/penalites`,
        method: 'GET',
      }),
    }),

    payPenalty: builder.mutation({
      query: ({ penaliteId }) => ({
        url: `/tontines/penalites/${penaliteId}/pay`,
        method: 'PUT',
      }),
      invalidatesTags: [TAG_TYPES.TONTINE],
    }),

    changeTontineStatus: builder.mutation({
      query: ({ tontineId, status }) => ({
        url: `/tontines/${tontineId}/change-status`,
        method: 'PUT',
        body: { status }, 
      }),
      invalidatesTags: [TAG_TYPES.TONTINE],
    }),

    distribute: builder.mutation({
      query: ({ tontineId }) => ({
        url: `/tontines/${tontineId}/distribute`,
        method: 'PUT',
      }),
      invalidatesTags: [TAG_TYPES.TONTINE],
    }),

    getValidatedCotisations: builder.query({
      query: ({ tontineId, membreId }) => ({
        url: `/tontines/${tontineId}/cotisations?membreId=${membreId}`,
        method: 'GET',
      }),
      providesTags: [TAG_TYPES.TONTINE],
    }),

    relanceCotisation: builder.mutation({
      query: (cotisationId) => ({
        url: `/tontines/cotisation/${cotisationId}/relance`,
        method: 'POST',
      }),
      invalidatesTags: [TAG_TYPES.TONTINE],
    }),

    getTontines: builder.query({
      query: ({ userId, page = 1, limit = 25 }) => ({
        url: TONTINE_ENDPOINTS.LIST(userId, page, limit),
        method: 'GET',
      }),
      // Proper serialization for caching
      serializeQueryArgs: ({ queryArgs }) => {
        return `tontines-${queryArgs.userId}`;
      },
      // Merge logic for infinite scroll - FIXED
      merge: (currentCache, newData, { arg }) => {
        if (!currentCache || arg.page === 1) {
          // If no cache or first page, replace completely
          return newData;
        }
        
        // Merge items for subsequent pages
        if (currentCache.data?.items && newData.data?.items) {
          // Create a map to avoid duplicates
          const existingItemsMap = new Map();
          currentCache.data.items.forEach(item => existingItemsMap.set(item.id, item));
          
          // Add new items that don't exist
          newData.data.items.forEach(item => {
            if (!existingItemsMap.has(item.id)) {
              currentCache.data.items.push(item);
            }
          });
          
          // Update pagination info
          currentCache.data.page = newData.data.page;
          currentCache.data.totalPages = newData.data.totalPages;
          currentCache.data.totalItems = newData.data.totalItems;
        }
        
        return currentCache;
      },
      // Force refetch when page changes
      forceRefetch({ currentArg, previousArg }) {
        return currentArg?.page !== previousArg?.page;
      },
      providesTags: (result) =>
        result?.data?.items
          ? [
              ...result.data.items.map(({ id }) => ({ type: 'Tontine', id })),
              { type: 'Tontine', id: 'LIST' },
            ]
          : [{ type: 'Tontine', id: 'LIST' }],
    }),
  }),
});

export const {
  useCreateTontineMutation,
  useGetMemberPenaltiesQuery,
  useGetTontinesQuery, 
  useAddTontineMembersMutation,
  useGetTontineDetailsQuery,
  useGetToursDistributionQuery,
  useAddPenaltyMutation,
  useContributeMutation,
  useGetCotisationsQuery,
  usePayPenaltyMutation,
  useSetTontineOrderMutation,
  useChangeTontineStatusMutation,
  useDistributeMutation,
  useAccessOrRejectTontineMutation,
  useGetValidatedCotisationsQuery,
  useRelanceCotisationMutation,
} = tontineApi;