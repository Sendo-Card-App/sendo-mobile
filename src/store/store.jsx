// src/store/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/Auth/authSlice';
import { authApi } from '../services/Auth/authAPI';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(authApi.middleware),
});
