import { createSlice } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper functions for AsyncStorage operations
const persistAuthState = async (state) => {
  try {
    const authData = {
      user: state.user,
      accessToken: state.accessToken,
      isLoggedIn: state.isLoggedIn
    };
    await AsyncStorage.setItem('@authState', JSON.stringify(authData));
  } catch (error) {
    console.error('Failed to persist auth state:', error);
  }
};

const clearAuthState = async () => {
  try {
    await AsyncStorage.removeItem('@authState');
  } catch (error) {
    console.error('Failed to clear auth state:', error);
  }
};

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
      persistAuthState(state);
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
      persistAuthState(state);
    },
    loginFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    },

    // OTP actions
    sendOtpStart(state) {
      state.loading = true;
      state.error = null;
      state.otpExpiration = new Date(Date.now() + 5 * 60 * 1000).toISOString();
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
      persistAuthState(state);
    },
    verifyOtpFailure(state, action) {
      state.loading = false;
      state.error = action.payload;
    },

    // Session management
    logout(state) {
      clearAuthState();
      Object.assign(state, initialState);
    },
    logoutAll(state) {
      clearAuthState();
      Object.assign(state, initialState);
    },

    // Reset actions
    resetSignupState(state) {
      state.isSignupSuccess = false;
      state.error = null;
    },
    resetAuthState(state) {
      clearAuthState();
      Object.assign(state, initialState);
    },

    // Hydrate state from storage
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

// Load persisted state from AsyncStorage
export const loadPersistedAuthState = () => async (dispatch) => {
  try {
    const authState = await AsyncStorage.getItem('@authState');
    if (authState) {
      const parsedState = JSON.parse(authState);
      dispatch(authSlice.actions.hydrateAuthState(parsedState));
    }
  } catch (error) {
    console.error('Failed to load persisted auth state:', error);
  }
};

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
  logout,
  logoutAll,
  resetSignupState,
  resetAuthState
} = authSlice.actions;

export default authSlice.reducer;
