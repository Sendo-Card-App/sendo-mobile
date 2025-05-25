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
    baseUrl: process.env.EXPO_PUBLIC_API_URL,
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
      query: (messageData) => ({
        url: CHAT_ENDPOINTS.MESSAGES,
        method: 'POST',
        body: messageData,
      }),
      invalidatesTags: [TAG_TYPES.MESSAGE],
    }),

    // Upload attachment
    uploadAttachment: builder.mutation({
      query: (fileData) => {
        const formData = new FormData();
        formData.append('file', fileData);
        
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

    // Get single message
    getMessage: builder.query({
      query: (messageId) => ({
        url: `${CHAT_ENDPOINTS.MESSAGES}/${messageId}`,
        method: 'GET',
      }),
      providesTags: [TAG_TYPES.MESSAGE],
    }),
  }),
});

export const {
  useCreateConversationMutation,
  useGetConversationsQuery,
  useGetConversationMessagesQuery,
  useSendMessageMutation,
  useUploadAttachmentMutation,
  useGetMessageQuery,
  useLazyGetConversationMessagesQuery,
} = chatApi;