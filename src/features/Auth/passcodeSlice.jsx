import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  passcode: null,
  attempts: 0,
  lastUsedAt: null,
  lockedUntil: null,
  biometricEnabled: false,
  isNewUser: false,
};

const passcodeSlice = createSlice({
  name: 'passcode',
  initialState,
  reducers: {
    setPasscode: (state, action) => {
      state.passcode = action.payload;
      state.attempts = 0;
      state.lastUsedAt = new Date().toISOString();
      state.lockedUntil = null;
    },
    incrementAttempt: (state) => {
      state.attempts += 1;
      if (state.attempts >= 3) {
        state.lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      }
    },
    resetAttempts: (state) => {
      state.attempts = 0;
      state.lockedUntil = null;
    },
    toggleBiometric: (state, action) => {
      state.biometricEnabled = action.payload;
    },
    lockPasscode: (state) => {
      state.lockedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    },
    setIsNewUser: (state, action) => {
      state.isNewUser = action.payload;
    },
    clearPasscode: (state) => {
      state.passcode = null;
      state.attempts = 0;
      state.lockedUntil = null;
      state.biometricEnabled = false;
    },
  },
});

export const { 
  setPasscode, 
  setIsNewUser,
  incrementAttempt, 
  resetAttempts, 
  toggleBiometric,
  lockPasscode,
  clearPasscode,
} = passcodeSlice.actions;

export default passcodeSlice.reducer;