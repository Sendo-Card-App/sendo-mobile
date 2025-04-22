import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  loading: false,
  error: null,
  isSignupSuccess: false,
  isLoggedIn: false,
  otpVerified: false,
  phone: null,
  accessToken: null,
  otpExpiration: null
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Signup actions
    signupStart(state, action) {
      state.loading = true;
      state.error = null;
      state.phone = action.payload.phone;
    },
    signupSuccess(state, action) {
      state.loading = false;
      state.isSignupSuccess = true;
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
    },
    signupFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    },

    // Login actions
    loginStart(state, action) {
      state.loading = true;
      state.error = null;
      state.phone = action.payload.phone;
    },
    loginSuccess(state, action) {
      state.loading = false;
      state.isLoggedIn = true;
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.error = null;
    },
    loginFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    },

    // OTP actions
    sendOtpStart(state) {
      state.loading = true;
      state.error = null;
    },
    sendOtpSuccess(state) {
      state.loading = false;
    },
    verifyOtpStart(state) {
      state.loading = true;
      state.error = null;
    },
    verifyOtpSuccess(state, action) {
      state.loading = false;
      state.otpVerified = true;
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.isLoggedIn = true;
    },
    verifyOtpFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    },

    // Reset actions
    resetSignupState(state) {
      state.isSignupSuccess = false;
      state.error = null;
    },
    resetAuthState(state) {
      Object.assign(state, initialState);
    },

    // Hydrate (optionnel)
    hydrateAuthState(state, action) {
      return {
        ...state,
        ...action.payload,
        loading: false,
        error: null
      };
    }
  }
});

export const { 
  signupStart, 
  signupSuccess, 
  signupFailure,
  loginStart,
  loginSuccess,
  loginFailure,
  sendOtpStart,
  sendOtpSuccess,
  verifyOtpStart,
  verifyOtpSuccess,
  verifyOtpFailure,
  resetSignupState,
  resetAuthState,
  hydrateAuthState
} = authSlice.actions;

export default authSlice.reducer;
