import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Constantes pour les endpoints
const AUTH_ENDPOINTS = {
  REGISTER: '/auth/register',
  VERIFY_OTP: '/auth/otp/verify',
  SEND_OTP: '/auth/otp/send',
  REFRESH_TOKEN: '/auth/refresh-token',
  LOGIN: '/auth/login',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  PROFILE: '/auth/me',
  LOGOUT: '/auth/logout'
};

// Tags pour le cache
const TAG_TYPES = {
  AUTH: 'Auth',
  SESSIONS: 'Sessions',
  PROFILE: 'Profile'
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
    }
  }),
  tagTypes: Object.values(TAG_TYPES),
  endpoints: (builder) => ({
    // Endpoint d'enregistrement
    register: builder.mutation({
      query: (userData) => ({
        url: AUTH_ENDPOINTS.REGISTER,
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
      invalidatesTags: [TAG_TYPES.AUTH]
    }),

    // Endpoints OTP
    verifyOtp: builder.mutation({
      query: ({ phone, code }) => ({
        url: AUTH_ENDPOINTS.VERIFY_OTP,
        method: 'POST',
        body: { phone, code }
      }),
      invalidatesTags: [TAG_TYPES.AUTH]
    }),

    resendOtp: builder.mutation({
      query: ({ phone, deviceId }) => ({
        url: AUTH_ENDPOINTS.SEND_OTP,
        method: 'POST',
        body: { phone, deviceId }
      })
    }),

    // Endpoints de connexion
    loginWithPhone: builder.mutation({
      query: ({ phone, deviceId }) => ({
        url: AUTH_ENDPOINTS.REFRESH_TOKEN,
        method: 'POST',
        body: { phone, deviceId }
      }),
      invalidatesTags: [TAG_TYPES.AUTH]
    }),

    loginWithEmail: builder.mutation({
      query: ({ email, password, deviceId }) => ({
        url: AUTH_ENDPOINTS.LOGIN,
        method: 'POST',
        body: { email, password, deviceId }
      }),
      invalidatesTags: [TAG_TYPES.AUTH]
    }),

    // Récupération de mot de passe
    forgotPassword: builder.mutation({
      query: (email) => ({
        url: AUTH_ENDPOINTS.FORGOT_PASSWORD,
        method: 'POST',
        body: { email }
      })
    }),

    resetPassword: builder.mutation({
      query: ({ token, newPassword }) => ({
        url: AUTH_ENDPOINTS.RESET_PASSWORD,
        method: 'POST',
        body: { token, newPassword }
      }),
      invalidatesTags: [TAG_TYPES.AUTH]
    }),

    // Gestion du profil
    getUserProfile: builder.query({
      query: () => AUTH_ENDPOINTS.PROFILE,
      providesTags: [TAG_TYPES.PROFILE]
    }),

    updateProfile: builder.mutation({
      query: (userData) => ({
        url: AUTH_ENDPOINTS.PROFILE,
        method: 'PUT',
        body: userData
      }),
      invalidatesTags: [TAG_TYPES.PROFILE]
    }),

    // Déconnexion
    logout: builder.mutation({
      query: () => ({
        url: AUTH_ENDPOINTS.LOGOUT,
        method: 'POST'
      }),
      invalidatesTags: [TAG_TYPES.AUTH, TAG_TYPES.PROFILE]
    })
  })
});

// Export des endpoints constants pour une utilisation ailleurs
export { AUTH_ENDPOINTS, TAG_TYPES };

// Export des hooks générés
export const { 
  useRegisterMutation,
  useVerifyOtpMutation,
  useResendOtpMutation,
  useLoginWithPhoneMutation,
  useLoginWithEmailMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useGetUserProfileQuery,
  useUpdateProfileMutation,
  useLogoutMutation
} = authApi;