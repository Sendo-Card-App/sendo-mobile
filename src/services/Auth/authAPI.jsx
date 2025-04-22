import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper functions for token management
const getAccessToken = async () => {
  try {
    return await AsyncStorage.getItem('@accessToken');
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
};

const setAccessToken = async (token) => {
  try {
    await AsyncStorage.setItem('@accessToken', token);
  } catch (error) {
    console.error('Error setting access token:', error);
  }
};

const clearAccessToken = async () => {
  try {
    await AsyncStorage.removeItem('@accessToken');
  } catch (error) {
    console.error('Error clearing access token:', error);
  }
};

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: 'http://217.65.146.204:3000/api',
    prepareHeaders: async (headers) => {
      // Add authorization header if token exists
      const token = await getAccessToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    }
  }),
  tagTypes: ['Auth', 'Sessions'],
  endpoints: (builder) => ({
    // Registration Endpoints
    register: builder.mutation({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: {
          firstname: userData.firstname,
          lastname: userData.lastname,
          email: userData.email,
          password: userData.password,
          phone: userData.phone,
          address: userData.address,
        }
      }),
      transformResponse: async (response) => {
        // Store token on successful registration
        if (response.accessToken) {
          await setAccessToken(response.accessToken);
        }
        return response;
      },
      invalidatesTags: ['Auth']
    }),

    // OTP Endpoints
    verifyOtp: builder.mutation({
      query: ({ phone, code }) => ({
        url: '/auth/otp/verify',
        method: 'POST',
        body: { phone, code}
      }),

    }),

    resendOtp: builder.mutation({
      query: (phone) => ({
        url: '/auth/otp/send',
        method: 'POST',
        body: { phone }
      })
    }),

    // Login Endpoints
    loginWithPhone: builder.mutation({
      query: ({ phone, deviceId }) => ({
        url: '/auth/refresh-token',
        method: 'POST',
        body: { phone, deviceId }
      }),
      transformResponse: async (response) => {
        if (response.accessToken) {
          await setAccessToken(response.accessToken);
        }
        return response;
      },
      invalidatesTags: ['Auth']
    }),

    loginWithEmail: builder.mutation({
      query: ({ email, password, deviceId }) => ({
        url: '/auth/login',
        method: 'POST',
        body: { email, password, deviceId }
      }),
      transformResponse: async (response) => {
        if (response.accessToken) {
          await setAccessToken(response.accessToken);
        }
        return response;
      },
      invalidatesTags: ['Auth']
    }),

    // Password Recovery
    forgotPassword: builder.mutation({
      query: (email) => ({
        url: '/auth/forgot-password',
        method: 'POST',
        body: { email }
      })
    }),

    resetPassword: builder.mutation({
      query: ({ token, newPassword }) => ({
        url: '/auth/reset-password',
        method: 'POST',
        body: { token, newPassword }
      }),
      invalidatesTags: ['Auth']
    }),

    // Session Management
    getActiveSessions: builder.query({
      query: () => '/auth/sessions',
      providesTags: ['Sessions']
    }),

    revokeSession: builder.mutation({
      query: (sessionId) => ({
        url: `/auth/sessions/${sessionId}`,
        method: 'DELETE'
      }),
      invalidatesTags: ['Sessions']
    }),

    revokeAllSessions: builder.mutation({
      query: () => ({
        url: '/auth/sessions',
        method: 'DELETE'
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          await clearAccessToken();
        } catch (error) {
          console.error('Error revoking sessions:', error);
        }
      },
      invalidatesTags: ['Auth', 'Sessions']
    }),

    // User Management
    getUserProfile: builder.query({
      query: () => '/auth/me',
      providesTags: ['Auth']
    }),

    updateProfile: builder.mutation({
      query: (userData) => ({
        url: '/auth/me',
        method: 'PUT',
        body: userData
      }),
      invalidatesTags: ['Auth']
    }),

    // Logout
    logout: builder.mutation({
      query: () => ({
        url: '/auth/logout',
        method: 'POST'
      }),
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          await clearAccessToken();
        } catch (error) {
          console.error('Error during logout:', error);
        }
      },
      invalidatesTags: ['Auth']
    })
  })
});

// Export hooks for usage in components
export const { 
  useRegisterMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
  useLoginWithPhoneMutation,
  useLoginWithEmailMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useGetActiveSessionsQuery,
  useRevokeSessionMutation,
  useRevokeAllSessionsMutation,
  useGetUserProfileQuery,
  useUpdateProfileMutation,
  useLogoutMutation
} = authApi;

// Export token management functions for use outside React components
export { getAccessToken, setAccessToken, clearAccessToken };