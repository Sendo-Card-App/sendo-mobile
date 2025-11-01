// src/features/Kyc/kycReducer.js
import { createSlice } from '@reduxjs/toolkit';

// Document types constants
const DOCUMENT_TYPES = {
  ID_PROOF: 'ID_PROOF',
  ADDRESS_PROOF: 'ADDRESS_PROOF',
  NIU_PROOF: 'NIU_PROOF',
  SELFIE: 'SELFIE'
};

// Canada specific identity types
const CANADA_IDENTITY_TYPES = {
  CARTE_RESIDENT_PERMANENT: 'carte_resident_permanent',
  PASSEPORT_CANADIEN: 'passeport_canadien',
  PERMIS_CONDUIRE: 'permis_conduire',
  PERMIS_ETUDE_PLUS_PASSPORT: 'permis_etude_plus_passport',
  PERMIS_TRAVAIL_PLUS_PASSPORT: 'permis_travail_plus_passport',
  DOCUMENT_AVEILE_PLUS_PASSPORT: 'document_aveile_plus_passport'
};

const initialState = {
  // Canada KYC specific state
  personalDetails: {
    profession: '',
    identityType: '',
    identityNumber: '',
    expirationDate: ''
  },
  selfie: null,
  identityDocument: {
    type: '', // Will be set based on selected identity type
    front: null,
    back: null,
  },
  passportDocument: null, // For Canadian passport and additional passport requirements
  niuDocument: null,
  addressProof: null,
  submissionStatus: 'idle',
  error: null,
  lastSubmissionError: null
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
      if (Object.values(CANADA_IDENTITY_TYPES).includes(action.payload)) {
        state.identityDocument.type = action.payload;
        // Reset documents when type changes
        state.identityDocument.front = null;
        state.identityDocument.back = null;
        state.passportDocument = null;
      }
    },
    
    setIdentityDocumentFront(state, action) {
      state.identityDocument.front = {
        ...action.payload,
        documentType: DOCUMENT_TYPES.ID_PROOF,
        side: 'front',
        uploaded: false,
        identityType: state.identityDocument.type // Track which identity type this belongs to
      };
    },
    
    setIdentityDocumentBack(state, action) {
      state.identityDocument.back = {
        ...action.payload,
        documentType: DOCUMENT_TYPES.ID_PROOF,
        side: 'back',
        uploaded: false,
        identityType: state.identityDocument.type // Track which identity type this belongs to
      };
    },
    
    setPassportDocument(state, action) {
      state.passportDocument = {
        ...action.payload,
        documentType: DOCUMENT_TYPES.ID_PROOF,
        side: 'front',
        uploaded: false,
        identityType: state.identityDocument.type // Track which identity type this belongs to
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
    
    setPersonalInfo(state, action) {
      state.personalDetails = { ...state.personalDetails, ...action.payload };
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
          } else if (state.passportDocument?.uri === uri) {
            state.passportDocument.uploaded = true;
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
    
    resetFailedSubmission(state) {
      if (state.selfie) state.selfie.uploaded = false;
      if (state.identityDocument.front) state.identityDocument.front.uploaded = false;
      if (state.identityDocument.back) state.identityDocument.back.uploaded = false;
      if (state.passportDocument) state.passportDocument.uploaded = false;
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
  if (state.kyc.passportDocument) docs.push(state.kyc.passportDocument);
  if (state.kyc.niuDocument) docs.push(state.kyc.niuDocument);
  if (state.kyc.addressProof) docs.push(state.kyc.addressProof);
  
  return docs;
};

export const selectUploadedDocuments = (state) => 
  selectAllDocuments(state).filter(doc => doc.uploaded);

export const selectPendingDocuments = (state) => 
  selectAllDocuments(state).filter(doc => !doc.uploaded);

export const selectIsKYCComplete = (state) => {
  const { personalDetails, selfie, identityDocument, passportDocument } = state.kyc;
  const { type, front, back } = identityDocument;

  // Check personal details
  const hasPersonalDetails = !!personalDetails.profession && 
                            !!personalDetails.identityType && 
                            !!personalDetails.identityNumber && 
                            !!personalDetails.expirationDate;

  const hasSelfie = !!selfie;
  const hasIDFront = !!front;

  // Check if passport is required based on identity type
  const requiresPassport = [
    CANADA_IDENTITY_TYPES.PERMIS_ETUDE_PLUS_PASSPORT,
    CANADA_IDENTITY_TYPES.PERMIS_TRAVAIL_PLUS_PASSPORT,
    CANADA_IDENTITY_TYPES.DOCUMENT_AVEILE_PLUS_PASSPORT
  ].includes(type);

  const hasPassport = requiresPassport ? !!passportDocument : true;

  let hasIDBack = true;
  if (type === CANADA_IDENTITY_TYPES.PERMIS_CONDUIRE || 
      type === CANADA_IDENTITY_TYPES.CARTE_RESIDENT_PERMANENT) {
    hasIDBack = !!back;
  }

  const isIDComplete = hasIDFront && hasIDBack && hasPassport;

  return hasPersonalDetails && hasSelfie && isIDComplete;
};

export const selectSubmissionError = (state) => state.kyc.lastSubmissionError;

export const {
  updatePersonalDetails,
  setSelfie,
  setIdentityDocumentType,
  setIdentityDocumentFront,
  setIdentityDocumentBack,
  setPassportDocument,
  setNiuDocument,
  setAddressProof,
  setPersonalInfo,
  markDocumentAsUploaded,
  setSubmissionStatus,
  setSubmissionError,
  resetFailedSubmission,
  resetKYC,
} = kycSlice.actions;

export { DOCUMENT_TYPES, CANADA_IDENTITY_TYPES };

export default kycSlice.reducer;