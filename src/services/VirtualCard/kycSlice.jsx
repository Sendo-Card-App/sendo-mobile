import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Constants for endpoints
const KYC_ENDPOINTS = {
  SUBMIT_KYC: '/kyc/send',
  GET_KYC_STATUS: '/kyc/status',
};

// Cache tags
const TAG_TYPES = {
  KYC: 'KYC',
};

export const kycApi = createApi({
  reducerPath: 'kycApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: process.env.REACT_APP_API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.accessToken;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: Object.values(TAG_TYPES),
  endpoints: (builder) => ({
    // Submit KYC endpoint
    submitKYC: builder.mutation({
      query: (kycData) => {
        const formData = new FormData();

        // Append personal details
        formData.append('fullName', kycData.personalDetails.fullName);
        formData.append('phoneNumber', kycData.personalDetails.phoneNumber);
        formData.append('profession', kycData.personalDetails.profession);
        formData.append('region', kycData.personalDetails.region);
        formData.append('city', kycData.personalDetails.city);
        formData.append('district', kycData.personalDetails.neighborhood);
        formData.append('monthlyIncome', kycData.personalDetails.monthlyIncome);
        formData.append('affiliation', kycData.personalDetails.affiliation);

        // Append selfie
        if (kycData.selfie) {
          formData.append('selfie', {
            uri: kycData.selfie.uri,
            name: 'selfie.jpg',
            type: 'image/jpeg',
          });
        }

        // Append identity documents
        if (kycData.identityDocument.front) {
          formData.append('documentFront', {
            uri: kycData.identityDocument.front.uri,
            name: 'document_front.jpg',
            type: 'image/jpeg',
          });
        }
        if (kycData.identityDocument.back) {
          formData.append('documentBack', {
            uri: kycData.identityDocument.back.uri,
            name: 'document_back.jpg',
            type: 'image/jpeg',
          });
        }

        // Append NIU document
        if (kycData.niuDocument) {
          formData.append('niuDocument', {
            uri: kycData.niuDocument.uri,
            name: 'niu_document.jpg',
            type: 'image/jpeg',
          });
        }

        // Append address proof
        if (kycData.addressProof) {
          formData.append('addressProof', {
            uri: kycData.addressProof.uri,
            name: 'address_proof.jpg',
            type: 'image/jpeg',
          });
        }

        return {
          url: KYC_ENDPOINTS.SUBMIT_KYC,
          method: 'POST',
          body: formData,
          formData: true,
        };
      },
      invalidatesTags: [TAG_TYPES.KYC],
    }),

    // Get KYC status endpoint
    getKYCStatus: builder.query({
      query: () => KYC_ENDPOINTS.GET_KYC_STATUS,
      providesTags: [TAG_TYPES.KYC],
    }),
  }),
});

// Export constant endpoints for use elsewhere
export { KYC_ENDPOINTS };

// Export generated hooks
export const { 
  useSubmitKYCMutation,
  useGetKYCStatusQuery,
} = kycApi;