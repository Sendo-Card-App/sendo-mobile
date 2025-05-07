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
  refreshToken: null,
  otpExpiration: null,
  passcode: null,          // Stores the current session passcode
  passcodeRequired: false, // Flag to trigger passcode prompt
  passcodeAttempts: 0      // Track failed attempts
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
      state.refreshToken = action.payload.refreshToken;
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
      state.refreshToken = action.payload.refreshToken;
      state.error = null;
      state.passcode = null; // Clear any previous passcode
      state.passcodeRequired = false;
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
      state.refreshToken = action.payload.refreshToken;
      state.isLoggedIn = true;
    },
    verifyOtpFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    },

    // Passcode actions
    setPasscode(state, action) {
      state.passcode = action.payload;
      state.passcodeAttempts = 0;
    },
    clearPasscode(state) {
      state.passcode = null;
    },
    setPasscodeRequired(state, action) {
      state.passcodeRequired = action.payload;
    },
    incrementPasscodeAttempts(state) {
      state.passcodeAttempts += 1;
    },
    lockPasscode(state) {
      state.passcodeRequired = false;
      state.error = 'Too many failed attempts. Please try again later.';
    },

    // Reset actions
    resetSignupState(state) {
      state.isSignupSuccess = false;
      state.error = null;
    },
    resetAuthState(state) {
      Object.assign(state, {
        ...initialState,
        passcode: null,
        passcodeRequired: false,
        passcodeAttempts: 0
      });
    },

    // Hydrate from storage
    hydrateAuthState(state, action) {
      return {
        ...state,
        ...action.payload,
        loading: false,
        error: null,
        passcode: null, // Never hydrate passcode
        passcodeRequired: false
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
  setPasscode,
  clearPasscode,
  setPasscodeRequired,
  incrementPasscodeAttempts,
  lockPasscode,
  resetSignupState,
  resetAuthState,
  hydrateAuthState
} = authSlice.actions;

export default authSlice.reducer;