// src/features/Kyc/kycSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  personalDetails: {
    profession: '',
    region: '',
    city: '',
    district: '',

  },
  selfie: null,
  identityDocument: {
    type: '',
    front: null,
    back: null,
  },
  niuDocument: null,
  addressProof: null,
};

const kycSlice = createSlice({
  name: 'kyc',
  initialState,
  reducers: {
    updatePersonalDetails(state, action) {
      state.personalDetails = { ...state.personalDetails, ...action.payload };
    },
    setSelfie(state, action) {
      state.selfie = action.payload;
    },
    setIdentityDocument(state, action) {
      state.identityDocument = { ...state.identityDocument, ...action.payload };
    },
    setNiuDocument(state, action) {
      state.niuDocument = action.payload;
    },
    setAddressProof(state, action) {
      state.addressProof = action.payload;
    },
    resetKYC(state) {
      Object.assign(state, initialState);
    },
  },
});

export const {
  updatePersonalDetails,
  setSelfie,
  setIdentityDocument,
  setNiuDocument,
  setAddressProof,
  resetKYC,
} = kycSlice.actions;

export default kycSlice.reducer;