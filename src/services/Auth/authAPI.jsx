import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Constants for endpoints
const AUTH_ENDPOINTS = {
  REGISTER: '/auth/register',
  VERIFY_OTP: '/auth/otp/verify',
  SEND_OTP: '/auth/otp/send',
  REFRESH_TOKEN: '/auth/refresh-token',
  PHONE_LOGIN:'/auth/login-phone',
  LOGIN: '/auth/login',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  CREATE_PASSCODE: '/users/send-passcode',
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

// Endpoints requiring passcode
const PASSCODE_REQUIRED_ENDPOINTS = [
  '/users/update-password',
  '/users/second-phone',
  '/users/' 
];

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.EXPO_PUBLIC_API_URL,
    prepareHeaders: (headers, { getState, endpoint }) => {
       const { accessToken } = getState().auth;
       const { passcode } = getState().passcode; // Now correctly accessing the nested field

          console.log('Current passcode state:', getState().passcode);

          headers.set('Accept', 'application/json');
          headers.set('Content-Type', 'application/json');

          if (accessToken) {
            headers.set('Authorization', `Bearer ${accessToken}`);
          }
          if (passcode) {  // Now checking the correct value
            headers.set('X-Passcode', passcode);
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
      query: ({ phone,password }) => ({
        url: AUTH_ENDPOINTS.PHONE_LOGIN,
        method: 'POST',
        body: { phone,password },
      }),
      invalidatesTags: [TAG_TYPES.AUTH],
    }),

     LoginWithPhone: builder.mutation({
      query: ({ refreshToken, deviceId }) => ({
        url: AUTH_ENDPOINTS.REFRESH_TOKEN,
        method: 'POST',
        body: { refreshToken, deviceId },
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

    // PIN Code Endpoints
    createPasscode: builder.mutation({
      query: ({ passcode }) => ({
        url: AUTH_ENDPOINTS.CREATE_PASSCODE,
        method: 'POST',
        body: { passcode },
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
     
    verifyPasscode: builder.mutation({
      query: (passcode) => ({
        url: '/auth/login-passcode',
        method: 'POST',
        body: { passcode: parseInt(passcode) },
      }),
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
  useVerifyPasscodeMutation,
  useCreatePasscodeMutation,
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