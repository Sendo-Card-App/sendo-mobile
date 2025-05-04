import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Constants for endpoints
const AUTH_ENDPOINTS = {
  REGISTER: '/auth/register',
  VERIFY_OTP: '/auth/otp/verify',
  SEND_OTP: '/auth/otp/send',
  REFRESH_TOKEN: '/auth/refresh-token',
  LOGIN: '/auth/login',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  MY_PROFILE: '/users/me',
  USER_PROFILE: '/users',
  LOGOUT: '/auth/logout',
};

// Cache tags
const TAG_TYPES = {
  AUTH: 'Auth',
  SESSIONS: 'Sessions',
  PROFILE: 'Profile',
};

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: process.env.REACT_APP_API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.accessToken;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: Object.values(TAG_TYPES),
  endpoints: (builder) => ({
    // Registration endpoint
    register: builder.mutation({
      query: (userData) => ({
        url: AUTH_ENDPOINTS.REGISTER,
        method: 'POST',
        body: userData,
      }),
      invalidatesTags: [TAG_TYPES.AUTH],
    }),

    // OTP endpoints
    verifyOtp: builder.mutation({
      query: ({ phone, code }) => ({
        url: AUTH_ENDPOINTS.VERIFY_OTP,
        method: 'POST',
        body: { phone, code },
      }),
      invalidatesTags: [TAG_TYPES.AUTH],
    }),

    sendOtp: builder.mutation({
      query: (phone) => ({
        url: AUTH_ENDPOINTS.SEND_OTP,
        method: 'POST',
        body: { phone },
      }),
    }),

    resendOtp: builder.mutation({
      query: ({ phone }) => ({
        url: AUTH_ENDPOINTS.SEND_OTP,
        method: 'POST',
        body: { phone },
      }),
    }),

    // In your authAPI endpoints
      addSecondPhone: builder.mutation({
        query: ({ phone }) => ({
          url: '/users/second-phone',
          method: 'POST',
          body: { phone },
        }),
        invalidatesTags: [TAG_TYPES.PROFILE],
      }),

      sendSecondPhoneOtp: builder.mutation({
        query: ({ phone }) => ({
          url: '/users/second-phone/send-otp-code',
          method: 'POST',
          body: { phone },
        }),
      }),

      verifySecondPhoneOtp: builder.mutation({
        query: ({ phone, code }) => ({
          url: '/users/second-phone/verify',
          method: 'POST',
          body: { phone, code },
        }),
      }),

    // Login endpoints
    loginWithPhone: builder.mutation({
      query: ({ phone }) => ({
        url: AUTH_ENDPOINTS.REFRESH_TOKEN,
        method: 'POST',
        body: { phone },
      }),
      invalidatesTags: [TAG_TYPES.AUTH],
    }),

    loginWithEmail: builder.mutation({
      query: ({ email, password }) => ({
        url: AUTH_ENDPOINTS.LOGIN,
        method: 'POST',
        body: { email, password },
      }),
      invalidatesTags: [TAG_TYPES.AUTH],
    }),

    // Password recovery
    forgotPassword: builder.mutation({
      query: (email) => ({
        url: AUTH_ENDPOINTS.FORGOT_PASSWORD,
        method: 'POST',
        body: { email },
      }),
    }),

    resetPassword: builder.mutation({
      query: ({ token, newPassword }) => ({
        url: AUTH_ENDPOINTS.RESET_PASSWORD,
        method: 'POST',
        body: { token, newPassword },
      }),
      invalidatesTags: [TAG_TYPES.AUTH],
    }),

    updatePassword: builder.mutation({
      query: ({ userId, oldPassword, newPassword }) => ({
        url: `/users/update-password/${userId}`,
        method: 'PUT',
        body: { oldPassword, newPassword },
      }),
      invalidatesTags: [TAG_TYPES.AUTH],
    }),

    // Profile management
    getMyProfile: builder.query({
      query: () => AUTH_ENDPOINTS.MY_PROFILE,
      providesTags: [TAG_TYPES.PROFILE],
    }),

    getUserProfile: builder.query({
      query: () => AUTH_ENDPOINTS.MY_PROFILE,
      providesTags: [TAG_TYPES.PROFILE],
      // ... logging
    }),
    
    updateProfile: builder.mutation({
      query: ({ userId, formData }) => {
        const isFormData = typeof formData.append === "function";
        return {
          url: `${AUTH_ENDPOINTS.USER_PROFILE}/${userId}`,
          method: "PUT",
          body: formData,
          ...(isFormData && { formData: true }),
        };
      },
      invalidatesTags: [TAG_TYPES.PROFILE],
    }),
    

    // Logout
    logout: builder.mutation({
      query: ({ deviceId }) => ({
        url: AUTH_ENDPOINTS.LOGOUT,
        method: 'POST',
        body: { deviceId },
      }),
      invalidatesTags: [TAG_TYPES.AUTH, TAG_TYPES.PROFILE],
    }),
  }),
});

// Export constant endpoints for use elsewhere
export { AUTH_ENDPOINTS, TAG_TYPES };

// Export generated hooks
export const { 
  useRegisterMutation,
  useVerifyOtpMutation,
  useSendOtpMutation,
  useResendOtpMutation,
  useAddSecondPhoneMutation,
  useSendSecondPhoneOtpMutation,
  useVerifySecondPhoneOtpMutation,
  useLoginWithPhoneMutation,
  useLoginWithEmailMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useUpdatePasswordMutation,
  useGetMyProfileQuery,
  useGetUserProfileQuery,
  useUpdateProfileMutation,
  useLogoutMutation,
} = authApi;