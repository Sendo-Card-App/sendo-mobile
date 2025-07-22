
// src/features/Kyc/kycSlice.js
import { createSlice } from '@reduxjs/toolkit';

// Document types constants
const DOCUMENT_TYPES = {
  ID_PROOF: 'ID_PROOF',
  ADDRESS_PROOF: 'ADDRESS_PROOF',
  NIU_PROOF: 'NIU_PROOF',
  SELFIE: 'SELFIE'
};

const IDENTITY_TYPES = {
  DRIVERS_LICENSE: 'drivers_license',
  PASSPORT: 'passport',
};

const initialState = {
  personalDetails: {
    profession: '',
    region: '',
    city: '',
    district: '',
  },
  selfie: null,
  identityDocument: {
    type: IDENTITY_TYPES.DRIVERS_LICENSE, // default to CNI
    front: null,
    back: null,
  },
  niuDocument: null,
  addressProof: null,
  submissionStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null
};

const kycSlice = createSlice({
  name: 'kyc',
  initialState,
  reducers: {
    updatePersonalDetails(state, action) {
      state.personalDetails = { ...state.personalDetails, ...action.payload };
    },
    setSelfie(state, action) {
      state.selfie = {
        ...action.payload,
        documentType: DOCUMENT_TYPES.SELFIE,
        uploaded: false
      };
    },
    setIdentityDocumentType(state, action) {
      if (Object.values(IDENTITY_TYPES).includes(action.payload)) {
        state.identityDocument.type = action.payload;
      }
    },
    setIdentityDocumentFront(state, action) {
      state.identityDocument.front = {
        ...action.payload,
        documentType: DOCUMENT_TYPES.ID_PROOF,
        side: 'front',
        uploaded: false
      };
    },
    setIdentityDocumentBack(state, action) {
      state.identityDocument.back = {
        ...action.payload,
        documentType: DOCUMENT_TYPES.ID_PROOF,
        side: 'back',
        uploaded: false
      };
    },
    setNiuDocument(state, action) {
      state.niuDocument = {
        ...action.payload,
        documentType: DOCUMENT_TYPES.NIU_PROOF,
        uploaded: false
      };
    },
    setAddressProof(state, action) {
      state.addressProof = {
        ...action.payload,
        documentType: DOCUMENT_TYPES.ADDRESS_PROOF,
        uploaded: false
      };
    },
    markDocumentAsUploaded(state, action) {
      const { documentType, uri } = action.payload;
      
      switch (documentType) {
        case DOCUMENT_TYPES.SELFIE:
          if (state.selfie?.uri === uri) state.selfie.uploaded = true;
          break;
        case DOCUMENT_TYPES.ID_PROOF:
          if (state.identityDocument.front?.uri === uri) {
            state.identityDocument.front.uploaded = true;
          } else if (state.identityDocument.back?.uri === uri) {
            state.identityDocument.back.uploaded = true;
          }
          break;
        case DOCUMENT_TYPES.NIU_PROOF:
          if (state.niuDocument?.uri === uri) state.niuDocument.uploaded = true;
          break;
        case DOCUMENT_TYPES.ADDRESS_PROOF:
          if (state.addressProof?.uri === uri) state.addressProof.uploaded = true;
          break;
      }
    },
    setSubmissionStatus(state, action) {
      state.submissionStatus = action.payload;
    },
    setSubmissionError(state, action) {
      state.error = action.payload;
    },
    resetKYC(state) {
      Object.assign(state, initialState);
    },
  },
});

// Helper selectors
export const selectAllDocuments = (state) => {
  const docs = [];
  
  if (state.kyc.selfie) docs.push(state.kyc.selfie);
  if (state.kyc.identityDocument.front) docs.push(state.kyc.identityDocument.front);
  if (state.kyc.identityDocument.back) docs.push(state.kyc.identityDocument.back);
  if (state.kyc.niuDocument) docs.push(state.kyc.niuDocument);
  if (state.kyc.addressProof) docs.push(state.kyc.addressProof);
  
  return docs;
};

export const selectUploadedDocuments = (state) => 
  selectAllDocuments(state).filter(doc => doc.uploaded);

export const selectPendingDocuments = (state) => 
  selectAllDocuments(state).filter(doc => !doc.uploaded);

export const selectIsKYCComplete = (state) => {
  const { identityDocument } = state.kyc;
  const { type, front, back } = identityDocument;

  const hasSelfie = !!state.kyc.selfie;
  const hasNIU = !!state.kyc.niuDocument;
  const hasAddressProof = !!state.kyc.addressProof;
  const hasIDFront = !!front;

  let hasIDBack = true; // par défaut

  if (type === IDENTITY_TYPES.CNI || type === IDENTITY_TYPES.DRIVERS_LICENSE) {
    hasIDBack = !!back;
  }

  const isIDComplete = hasIDFront && hasIDBack;

  return hasSelfie && isIDComplete && hasNIU && hasAddressProof;
};


export const {
  updatePersonalDetails,
  setSelfie,
  setIdentityDocumentType,
  setIdentityDocumentFront,
  setIdentityDocumentBack,
  setNiuDocument,
  setAddressProof,
  markDocumentAsUploaded,
  setSubmissionStatus,
  setSubmissionError,
  resetKYC,
} = kycSlice.actions;

export { DOCUMENT_TYPES, IDENTITY_TYPES };

export default kycSlice.reducer;