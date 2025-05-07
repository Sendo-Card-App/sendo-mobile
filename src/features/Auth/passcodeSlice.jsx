import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  passcode: null,
  attempts: 0,
  lastUsedAt: null,
  lockedUntil: null,
  biometricEnabled: false,
};

const passcodeSlice = createSlice({
  name: 'passcode',
  initialState,
  reducers: {
    setPasscode: (state, action) => {
      state.passcode = action.payload;
      state.attempts = 0;
      state.lastUsedAt = new Date().toISOString();
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
  },
});

export const { 
  setPasscode, 
  incrementAttempt, 
  resetAttempts, 
  toggleBiometric,
  lockPasscode,
} = passcodeSlice.actions;

export default passcodeSlice.reducer;