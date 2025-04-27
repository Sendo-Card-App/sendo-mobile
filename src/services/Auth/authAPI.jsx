import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Constantes pour les endpoints
const AUTH_ENDPOINTS = {
  REGISTER: '/auth/register',
  VERIFY_OTP: '/auth/otp/verify',
  SEND_OTP: '/auth/otp/send',  // Ensure this endpoint is defined
  REFRESH_TOKEN: '/auth/refresh-token',
  LOGIN: '/auth/login',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  MY_PROFILE: '/users/me', // For getting current user
  USER_PROFILE: '/users', // For getting/updating specific users
  LOGOUT: '/auth/logout',
};

// Tags pour le cache
const TAG_TYPES = {
  AUTH: 'Auth',
  SESSIONS: 'Sessions',
  PROFILE: 'Profile',
};

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: 'http://217.65.146.204:3000/api',
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
    // Endpoint d'enregistrement
    register: builder.mutation({
      query: (userData) => ({
        url: AUTH_ENDPOINTS.REGISTER,
        method: 'POST',
        body: userData, // Assuming userData includes all necessary fields
      }),
      invalidatesTags: [TAG_TYPES.AUTH],
    }),

    // Endpoints OTP
    verifyOtp: builder.mutation({
      query: ({ phone, code }) => ({
        url: AUTH_ENDPOINTS.VERIFY_OTP,
        method: 'POST',
        body: { phone, code },
      }),
      invalidatesTags: [TAG_TYPES.AUTH],
    }),

    sendOtp: builder.mutation({ // Add this mutation to send OTP
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

    // Endpoints de connexion
    loginWithPhone: builder.mutation({
      query: ({ phone}) => ({
        url: AUTH_ENDPOINTS.REFRESH_TOKEN,
        method: 'POST',
        body: { phone},
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

    // Récupération de mot de passe
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

    // Gestion du profil
    getMyProfile: builder.query({
      query: () => AUTH_ENDPOINTS.MY_PROFILE,
      providesTags: [TAG_TYPES.PROFILE],
      // ... logging
    }),

    getUserProfile: builder.query({
      query: () => AUTH_ENDPOINTS.MY_PROFILE,
      providesTags: [TAG_TYPES.PROFILE],
      // ... logging
    }),
    
    updateProfile: builder.mutation({
      query: (formData) => ({
        url: `${AUTH_ENDPOINTS.USER_PROFILE}/me`,
        method: 'PATCH',
        body: formData,
        formData: true, // Important pour FormData
      }),
      invalidatesTags: [TAG_TYPES.PROFILE],
    }),

    // Déconnexion
    logout: builder.mutation({
      query: ({deviceId}) => ({
        url: AUTH_ENDPOINTS.LOGOUT,
        method: 'POST',
        body: { deviceId },
      }),
      invalidatesTags: [TAG_TYPES.AUTH, TAG_TYPES.PROFILE],
    }),
  }),
});

// Export des endpoints constants pour une utilisation ailleurs
export { AUTH_ENDPOINTS, TAG_TYPES };

// Export des hooks générés
export const { 
  useRegisterMutation,
  useVerifyOtpMutation,
  useSendOtpMutation,  // Ensure you export it here
  useResendOtpMutation,
  useLoginWithPhoneMutation,
  useLoginWithEmailMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useGetUserProfileQuery,
  useUpdateProfileMutation,
  useLogoutMutation,
} = authApi;
