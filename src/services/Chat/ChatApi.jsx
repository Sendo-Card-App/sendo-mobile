// src/services/ChatApi.jsx
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Constants for endpoints
const CHAT_ENDPOINTS = {
  CONVERSATIONS: '/chat/conversations',
  MESSAGES: '/chat/messages',
  UPLOAD: '/chat/upload',
};

const TAG_TYPES = {
  CONVERSATION: 'Conversation',
  MESSAGE: 'Message',
};

export const chatApi = createApi({
  reducerPath: 'chatApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.EXPO_TEST_API_URL,
    prepareHeaders: (headers, { getState }) => {
      const state = getState();
      const accessToken = state.auth?.accessToken;
      
      headers.set('Accept', 'application/json');
      
      if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
      }

      return headers;
    },
  }),
  tagTypes: Object.values(TAG_TYPES),
  endpoints: (builder) => ({
    // Create new conversation
    createConversation: builder.mutation({
      query: () => ({
        url: CHAT_ENDPOINTS.CONVERSATIONS,
        method: 'POST',
      }),
      invalidatesTags: [TAG_TYPES.CONVERSATION],
    }),

    // Get user conversations
    getConversations: builder.query({
      query: (userId) => `${CHAT_ENDPOINTS.CONVERSATIONS}/${userId}`,
      providesTags: [TAG_TYPES.CONVERSATION],
    }),

    // Get conversation messages
    getConversationMessages: builder.query({
      query: (conversationId) => ({
        url: `${CHAT_ENDPOINTS.CONVERSATIONS}/${conversationId}/messages`,
        method: 'GET',
      }),
      providesTags: [TAG_TYPES.MESSAGE],
    }),

    // Send message
    sendMessage: builder.mutation({
      query: (formData) => ({
        url: CHAT_ENDPOINTS.MESSAGES,
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: [TAG_TYPES.MESSAGE],
    }),

    // Get single message
    getMessage: builder.query({
      query: (messageId) => ({
        url: `${CHAT_ENDPOINTS.MESSAGES}/${messageId}`,
        method: 'GET',
      }),
      providesTags: [TAG_TYPES.MESSAGE],
    }),

    // Upload attachments - NEW ENDPOINT
    uploadAttachments: builder.mutation({
      query: (attachments) => {
        const formData = new FormData();
        
        // Append each attachment to the form data
        attachments.forEach((attachment) => {
          formData.append('attachments', {
            uri: attachment.uri,
            name: attachment.name,
            type: attachment.type,
          });
        });

        return {
          url: CHAT_ENDPOINTS.UPLOAD,
          method: 'POST',
          body: formData,
          // Set appropriate headers for file upload
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },
    }),

    // Upload single attachment - alternative endpoint
    uploadAttachment: builder.mutation({
      query: (attachment) => {
        const formData = new FormData();
        
        formData.append('attachments', {
          uri: attachment.uri,
          name: attachment.name,
          type: attachment.type,
        });

        return {
          url: CHAT_ENDPOINTS.UPLOAD,
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        };
      },
    }),
  }),
});

export const {
  useCreateConversationMutation,
  useGetConversationsQuery,
  useGetConversationMessagesQuery,
  useSendMessageMutation,
  useUploadAttachmentMutation,
  useUploadAttachmentsMutation, // NEW HOOK
  useGetMessageQuery,
  useLazyGetConversationMessagesQuery,
} = chatApi;