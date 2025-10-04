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
  CNI: 'cni' // Added missing CNI type
};

const initialState = {
  personalDetails: {
    profession: '',
    region: '',
    city: '',
    district: '',
    cni: '', // Added missing CNI field
  },
  selfie: null,
  identityDocument: {
    type: IDENTITY_TYPES.DRIVERS_LICENSE,
    front: null,
    back: null,
  },
  niuDocument: null,
  addressProof: null,
  submissionStatus: 'idle',
  error: null,
  lastSubmissionError: null // Track submission errors
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
        // Reset documents when type changes
        state.identityDocument.front = null;
        state.identityDocument.back = null;
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
      if (action.payload === 'failed') {
        state.lastSubmissionError = state.error;
      } else if (action.payload === 'idle') {
        state.lastSubmissionError = null;
      }
    },
    setSubmissionError(state, action) {
      state.error = action.payload;
    },
    // Enhanced reset for failed submissions
    resetFailedSubmission(state) {
      // Only reset uploaded status to allow re-upload
      if (state.selfie) state.selfie.uploaded = false;
      if (state.identityDocument.front) state.identityDocument.front.uploaded = false;
      if (state.identityDocument.back) state.identityDocument.back.uploaded = false;
      if (state.niuDocument) state.niuDocument.uploaded = false;
      if (state.addressProof) state.addressProof.uploaded = false;
      
      state.submissionStatus = 'idle';
      state.error = null;
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
  const { personalDetails, selfie, identityDocument, niuDocument, addressProof } = state.kyc;
  const { type, front, back } = identityDocument;

  // Check personal details
  const hasPersonalDetails = !!personalDetails.profession && 
                            !!personalDetails.region && 
                            !!personalDetails.city && 
                            !!personalDetails.district &&
                            !!personalDetails.cni;

  const hasSelfie = !!selfie;
  const hasNIU = !!niuDocument;
  const hasAddressProof = !!addressProof;
  const hasIDFront = !!front;

  let hasIDBack = true;
  if (type === IDENTITY_TYPES.CNI || type === IDENTITY_TYPES.DRIVERS_LICENSE) {
    hasIDBack = !!back;
  }

  const isIDComplete = hasIDFront && hasIDBack;

  return hasPersonalDetails && hasSelfie && isIDComplete && hasNIU && hasAddressProof;
};

export const selectSubmissionError = (state) => state.kyc.lastSubmissionError;

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
  resetFailedSubmission,
  resetKYC,
} = kycSlice.actions;

export { DOCUMENT_TYPES, IDENTITY_TYPES };

export default kycSlice.reducer;