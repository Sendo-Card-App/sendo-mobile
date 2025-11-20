import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';


const TAG_TYPES = {
  TRANSFERS: 'Transfers',
};

export const transferApi = createApi({
  reducerPath: 'transferApi',
  baseQuery: fetchBaseQuery({
   baseUrl: process.env.EXPO_PUBLIC_API_URL,

    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.accessToken;
       const passcode = getState().passcode.passcode;
      // Assuming you store passcode in auth slice
     console.log('🧠 prepareHeaders called:');
      console.log('Bearer token:', token ? '✅ exists' : '❌ missing');
      console.log('X-Passcode:', passcode ? passcode : '❌ missing');

      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      if (passcode) {
        headers.set('X-Passcode', passcode);
      }

      console.log('📤 Headers sent:', Object.fromEntries(headers.entries()));
          return headers;
    },
  }),
 tagTypes: Object.values(TAG_TYPES),
  endpoints: (builder) => ({
    // Get all transfers
    getTransfers: builder.query({
      query: () => '/transfer-money/list',

    }),
    
    // Initialize new transfer
    initTransfer: builder.mutation({
      query: (payload) => ({
        url: '/transfer-money/init',
        method: 'POST',
        body: payload,
        providesTags: [TAG_TYPES.TRANSFERS],
      }),
      invalidatesTags: [TAG_TYPES.TRANSFERS],
    }),
    
      initiateBankTransfer: builder.mutation({
      query: (transferData) => ({
        url: '/transfer-money/bank-init',
        method: 'POST',
        body: transferData,
        providesTags: [TAG_TYPES.TRANSFERS],
      }),
      
      invalidatesTags: [TAG_TYPES.TRANSFERS],
    }),

    // Initialize transfer to existing destinataire
    initTransferToDestinataire: builder.mutation({
      query: ({ destinataireId, amount, description = '' }) => ({
        url: '/transfer-money/init-to-know-destinataire',
        method: 'POST',
        body: { destinataireId, amount, description },
      }),
      invalidatesTags: [TAG_TYPES.TRANSFERS],
    }),
  }),
});

export const {
  useGetTransfersQuery,
  useInitTransferMutation,
   useInitiateBankTransferMutation,
  useInitTransferToDestinataireMutation,
} = transferApi;