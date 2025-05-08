// src/store/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/Auth/authSlice';
import { authApi } from '../services/Auth/authAPI';
import { kycApi } from '../services/Kyc/kycApi';
import { walletApi } from '../services/WalletApi/walletApi';
import kycReducer from '../features/Kyc/kycReducer'; // Updated path (note capital K in Kyc)
import passcodeReducer from '../features/Auth/passcodeSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    passcode: passcodeReducer,
    [authApi.reducerPath]: authApi.reducer,
    kyc: kycReducer,
    [kycApi.reducerPath]: kycApi.reducer,
    [walletApi.reducerPath]: walletApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      kycApi.middleware,
      walletApi.middleware   // Don't forget to add kycApi middleware
    ),
});