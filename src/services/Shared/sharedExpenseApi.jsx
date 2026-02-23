import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Constants for endpoints
const SHARED_EXPENSE_ENDPOINTS = {
  CREATE: '/shared-expense/create',
  LIST: '/shared-expense/list',
  DETAILS: '/shared-expense',
  SETTLE: '/shared-expense/settle',
};

const TAG_TYPES = {
  SHARED_EXPENSE: 'SharedExpense',
};

export const sharedExpenseApi = createApi({
  reducerPath: 'sharedExpenseApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.EXPO_PUBLIC_API_URL,
    prepareHeaders: (headers, { getState }) => {
      const { accessToken } = getState().auth;
      const { passcode } = getState().passcode;
      
      // Set default headers
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
    createSharedExpense: builder.mutation({
      query: (payload) => ({
        url: SHARED_EXPENSE_ENDPOINTS.CREATE,
        method: 'POST',
        body: payload,
         providesTags: [TAG_TYPES.SHARED_EXPENSE],
      }),
      invalidatesTags: [TAG_TYPES.SHARED_EXPENSE],
    }),

      deleteSharedExpense: builder.mutation({
        query: (expenseId) => ({
          url: `/shared-expense/${expenseId}/close`,
          method: 'DELETE',
           providesTags: [TAG_TYPES.SHARED_EXPENSE],
        }),
        invalidatesTags: [TAG_TYPES.SHARED_EXPENSE],
      }),


    getSharedExpenses: builder.query({
      query: ({ userId, status, page = 1, limit = 10 }) => ({
        url: `/shared-expense/${userId}/list`,
        method: 'GET',
        params: {
          status,
          page,
          limit,
        },
      }),
      providesTags: [TAG_TYPES.SHARED_EXPENSE],
    }),


    getSharedExpenseDetails: builder.query({
      query: (expenseId) => ({
        url: `${SHARED_EXPENSE_ENDPOINTS.DETAILS}/${expenseId}`,
        method: 'GET',
      }),
      providesTags: [TAG_TYPES.SHARED_EXPENSE],
    }),
   updateSharedExpense: builder.mutation({
      query: ({ id, data }) => ({
        url: `/shared-expense/${id}`,
        method: 'PUT',
        body: data,   // ✅ on envoie data directement
      }),
      invalidatesTags: [TAG_TYPES.SHARED_EXPENSE],
    }),


    settleSharedExpense: builder.mutation({
      query: ({ expenseId, participantId }) => ({
        url: SHARED_EXPENSE_ENDPOINTS.SETTLE,
        method: 'POST',
        body: {
          expenseId,
          participantId,
        },
      }),
      invalidatesTags: [TAG_TYPES.SHARED_EXPENSE],
    }),

    getSharedList: builder.query({
      query: (userId) => `/shared-expense/users/${userId}`,
      providesTags: [TAG_TYPES.SHARED_EXPENSE],
    }),


    paySharedExpense: builder.mutation({
      query: ({ expenseId }) => ({
        url: `/shared-expense/${expenseId}/pay`,
        method: 'POST',
       
      }),
      invalidatesTags: [TAG_TYPES.SHARED_EXPENSE],
    }),
    
    cancelSharedExpense: builder.mutation({
      query: ({ participantId}) => ({
        url: `/shared-expense/${participantId}/refuse-payment`,
        method: 'PATCH',
      }),
      invalidatesTags: [TAG_TYPES.SHARED_EXPENSE],
    }),



    // For manual amount distribution validation
    validateAmountDistribution: builder.mutation({
      query: ({ totalAmount, amounts }) => {
        const sum = Object.values(amounts).reduce((a, b) => a + b, 0);
        return {
          url: '/shared-expense/validate-distribution',
          method: 'POST',
          body: {
            totalAmount,
            sum,
            isValid: sum === totalAmount,
          },
        };
      },
    }),
  }),
});

export const {
  useCreateSharedExpenseMutation,
  useGetSharedExpensesQuery,
  useDeleteSharedExpenseMutation,
  usePaySharedExpenseMutation,
  useCancelSharedExpenseMutation,
  useUpdateSharedExpenseMutation,
  useGetSharedExpenseDetailsQuery,
  useGetSharedListQuery,
  useSettleSharedExpenseMutation,
  useValidateAmountDistributionMutation,
} = sharedExpenseApi;