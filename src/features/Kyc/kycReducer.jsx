// src/features/Kyc/kycSlice.js
import { createSlice } from '@reduxjs/toolkit';

// Document types constants
const DOCUMENT_TYPES = {
  ID_PROOF: 'ID_PROOF',
  ADDRESS_PROOF: 'ADDRESS_PROOF',
  NIU_PROOF: 'NIU_PROOF',
  SELFIE: 'SELFIE'
};

// Cameroon identity types
const IDENTITY_TYPES = {
  PASSPORT: 'passport',
  CNI: 'cni'
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

// Combined identity types for easy access
const ALL_IDENTITY_TYPES = {
  ...IDENTITY_TYPES,
  ...CANADA_IDENTITY_TYPES
};

const initialState = {
  personalDetails: {
    profession: '',
    identityType: '', // For Canada KYC
    identityNumber: '', // For Canada KYC
    expirationDate: '', // For Canada KYC
    region: '', // For Cameroon KYC
    city: '', // For Cameroon KYC
    district: '', // For Cameroon KYC
    cni: '', // For Cameroon KYC
  },
  selfie: null,
  identityDocument: {
    type: '',
    front: null,
    back: null,
  },
  passportDocument: null, // For Canada KYC - documents requiring passport
  niuDocument: null, // For Cameroon KYC
  addressProof: null, // For Cameroon KYC
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
      const type = action.payload;

      // Handle both Cameroon & Canada identity types
      if (Object.values(ALL_IDENTITY_TYPES).includes(type)) {
        state.identityDocument.type = type;
        // Reset documents when type changes
        state.identityDocument.front = null;
        state.identityDocument.back = null;
        state.passportDocument = null; // Reset passport document for Canada KYC
      }
    },
    
    setIdentityDocumentFront(state, action) {
      state.identityDocument.front = {
        ...action.payload,
        documentType: DOCUMENT_TYPES.ID_PROOF,
        side: 'front',
        uploaded: false,
        identityType: state.identityDocument.type
      };
    },
    
    setIdentityDocumentBack(state, action) {
      state.identityDocument.back = {
        ...action.payload,
        documentType: DOCUMENT_TYPES.ID_PROOF,
        side: 'back',
        uploaded: false,
        identityType: state.identityDocument.type
      };
    },
    
    // New action for Canada KYC passport documents
    setPassportDocument(state, action) {
      state.passportDocument = {
        ...action.payload,
        documentType: DOCUMENT_TYPES.ID_PROOF,
        side: 'front',
        uploaded: false,
        identityType: state.identityDocument.type
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
    
    // New action for Canada KYC personal info
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
      // Reset uploaded status for all documents
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

// Enhanced selector that works for both Cameroon and Canada KYC
export const selectIsKYCComplete = (state) => {
  const { personalDetails, selfie, identityDocument, passportDocument, niuDocument, addressProof } = state.kyc;
  const { type, front, back } = identityDocument;

  const hasSelfie = !!selfie;
  const hasIDFront = !!front;

  // Check if it's a Canada KYC type
  const isCanadaKYC = Object.values(CANADA_IDENTITY_TYPES).includes(type);
  
  if (isCanadaKYC) {
    // Canada KYC validation
    const hasPersonalDetails = !!personalDetails.profession && 
                              !!personalDetails.identityType && 
                              !!personalDetails.identityNumber && 
                              !!personalDetails.expirationDate;

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
  } else {
    // Cameroon KYC validation
    const hasPersonalDetails = !!personalDetails.profession && 
                              !!personalDetails.region && 
                              !!personalDetails.city && 
                              !!personalDetails.district &&
                              !!personalDetails.cni;

    const hasNIU = !!niuDocument;
    const hasAddressProof = !!addressProof;

    let hasIDBack = true;
    if (type === IDENTITY_TYPES.CNI || type === IDENTITY_TYPES.DRIVERS_LICENSE) {
      hasIDBack = !!back;
    }

    const isIDComplete = hasIDFront && hasIDBack;

    return hasPersonalDetails && hasSelfie && isIDComplete && hasNIU && hasAddressProof;
  }
};

export const selectSubmissionError = (state) => state.kyc.lastSubmissionError;

// Helper to determine if current KYC is for Canada
export const selectIsCanadaKYC = (state) => {
  const { type } = state.kyc.identityDocument;
  return Object.values(CANADA_IDENTITY_TYPES).includes(type);
};

// Helper to determine if current KYC is for Cameroon
export const selectIsCameroonKYC = (state) => {
  const { type } = state.kyc.identityDocument;
  return Object.values(IDENTITY_TYPES).includes(type);
};

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

export { 
  DOCUMENT_TYPES, 
  IDENTITY_TYPES, 
  CANADA_IDENTITY_TYPES,
  ALL_IDENTITY_TYPES 
};

export default kycSlice.reducer;