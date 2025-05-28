// src/store/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/Auth/authSlice';
import { authApi } from '../services/Auth/authAPI';
import { kycApi } from '../services/Kyc/kycApi';
import { walletApi } from '../services/WalletApi/walletApi';
import { paymentSimulatorAPI } from '../services/Pay/paymentSimulatorAPI';
import { notificationApi } from '../services/Notification/notificationApi';
import kycReducer from '../features/Kyc/kycReducer'; // Updated path (note capital K in Kyc)
import { configApi } from '../services/Config/configApi';
import { transferApi } from '../services/Transfer/transferApi';
import { chatApi } from '../services/Chat/ChatApi';
import { sharedExpenseApi } from '../services/Shared/sharedExpenseApi';
import { contactsApi } from '../services/Contact/contactsApi';
import passcodeReducer from '../features/Auth/passcodeSlice';
import { config } from 'dotenv';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    passcode: passcodeReducer,
    [authApi.reducerPath]: authApi.reducer,
    kyc: kycReducer,
    [kycApi.reducerPath]: kycApi.reducer,
    [walletApi.reducerPath]: walletApi.reducer,
    [paymentSimulatorAPI.reducerPath]: paymentSimulatorAPI.reducer,
     [notificationApi.reducerPath]: notificationApi.reducer,
     [configApi.reducerPath]: configApi.reducer,
     [contactsApi.reducerPath]: contactsApi.reducer,
    [chatApi.reducerPath]: chatApi.reducer,
    [transferApi.reducerPath]: transferApi.reducer,
    [sharedExpenseApi.reducerPath]: sharedExpenseApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      kycApi.middleware,
      walletApi.middleware,
      paymentSimulatorAPI.middleware,
      notificationApi.middleware,
      configApi.middleware, 
      contactsApi.middleware,
      chatApi.middleware,
      transferApi.middleware,
      sharedExpenseApi.middleware,
    ),
});