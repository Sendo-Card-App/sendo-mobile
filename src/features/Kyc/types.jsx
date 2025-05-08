// features/kyc/types.ts
export interface Document {
    uri: string;
    type: string;
    name?: string;
  }
  
  export interface PersonalDetails {
    fullName: string;
    phoneNumber: string;
    profession: string;
    region: string;
    city: string;
    neighborhood: string;
    monthlyIncome: string;
    affiliation: string;
  }
  
  export interface KYCState {
    personalDetails: PersonalDetails;
    selfie: Document | null;
    identityDocument: {
      type: string;
      front: Document | null;
      back: Document | null;
    };
    niuDocument: Document | null;
    addressProof: Document | null;
  }
  
  export interface KYCStatus {
    status: 'pending' | 'approved' | 'rejected';
    lastUpdated: string;
    message?: string;
  }