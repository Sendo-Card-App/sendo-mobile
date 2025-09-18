// src/Screens/ChatScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Keyboard } from 'react-native';
import {
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Text,
  Image,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Linking,
  Modal
} from 'react-native';
import { SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from 'react-i18next';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { 
  useSendMessageMutation, 
  useGetConversationMessagesQuery, 
  useCreateConversationMutation,
  useGetConversationsQuery,
  useUploadAttachmentsMutation 
} from '../../services/Chat/ChatApi';
import Toast from 'react-native-toast-message';
import { useGetUserProfileQuery } from "../../services/Auth/authAPI";
import Loader from '../../components/Loader';
import { getData} from "../../services/storage";
import { initSocket, getSocket } from '../../utils/socket';

let typingTimeout: NodeJS.Timeout;

interface Attachment {
  uri: string;
  name: string;
  type: string;
}

interface Message {
  id: string;
  content: string;
  senderType: 'CUSTOMER' | 'ADMIN';
  userId: number;
  conversationId: string;
  read: boolean;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    firstname: string;
    lastname: string;
  };
}

interface Conversation {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  userId: number;
  adminId: number | null;
  user: {
    id: number;
    firstname: string;
    lastname: string;
  };
}

const ChatScreen = ({ route, navigation }) => {
  const [input, setInput] = useState('');
  const { t } = useTranslation();
  const [attachments, setAttachments] = useState([]);
  const flatListRef = useRef(null);
  const [userToken, setUserToken] = useState(null);
  const [socket, setSocket] = useState(null);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([]);
  const [typingStatus, setTypingStatus] = useState(false);
  const [selectedConversationIndex, setSelectedConversationIndex] = useState(0);
  const [showConversationPicker, setShowConversationPicker] = useState(false);
  const [uploadAttachments] = useUploadAttachmentsMutation();
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const { data: userProfile, isLoading: isProfileLoading } = useGetUserProfileQuery(undefined, {
    pollingInterval: 1000,
  });
  const userId = userProfile?.data?.id;
  
  const { data: conversationsResponse, isLoading: isLoadingConversations, refetch: refetchConversations } = useGetConversationsQuery(userId, {
    skip: !userId,
    pollingInterval: 1000,
  });
  
  const conversations = conversationsResponse?.data || [];
 
  const openConversations = conversations.filter(conv => conv.status === 'OPEN');
  const selectedConversation = openConversations[selectedConversationIndex];
  
  const { data: messagesResponse, isLoading: isLoadingMessages, refetch: refetchMessages  } = useGetConversationMessagesQuery(selectedConversation?.id, {
    skip: !selectedConversation,
    pollingInterval: 1000,
  });

  const [sendMessage] = useSendMessageMutation();
  const [createConversation] = useCreateConversationMutation();

  useEffect(() => {
    const fetchTokenAndInitSocket = async () => {
      const accessToken = await getData('@authData');
      setUserToken(accessToken);
      
      if (accessToken) {
        const token = accessToken.accessToken;
        const s = initSocket(token);
        setSocket(s);

        s.io.on("open", () => {
          console.log("Socket connection opened");
        });

        // Set up event listeners once
        s.on('new_message', handleNewMessage);
        s.on('typing', handleTyping);
        s.on('stop_typing', handleStopTyping);

        return () => {
          s.off('new_message', handleNewMessage);
          s.off('typing', handleTyping);
          s.off('stop_typing', handleStopTyping);
          s.disconnect();
        };
      }
    };

    fetchTokenAndInitSocket();
  }, []);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        setIsKeyboardVisible(true);
        setKeyboardOffset(e.endCoordinates.height);
      }
    );
    
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setIsKeyboardVisible(false);
        setKeyboardOffset(0);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  
  // Separate handlers for socket events
  const handleNewMessage = (message: Message) => {
    if (message.conversationId === selectedConversation?.id) {
      setMessages(prev => [
        ...prev.filter(msg => !msg.id.startsWith('temp-')),
        message
      ]);
    }
  };

  const handleTyping = ({ conversationId }: { conversationId: string }) => {
    if (conversationId === selectedConversation?.id) {
      setTypingStatus(true);
    }
  };

  const handleStopTyping = ({ conversationId }: { conversationId: string }) => {
    if (conversationId === selectedConversation?.id) {
      setTypingStatus(false);
    }
  };

   const emitTyping = () => {
    const socket = getSocket();
    if (!socket || !selectedConversation?.id) return;

    socket.emit('typing', { conversationId: selectedConversation.id });
    clearTimeout(typingTimeout);

    typingTimeout = setTimeout(() => {
      socket.emit('stop_typing', { conversationId: selectedConversation.id });
    }, 1000);
  };

  // Join/leave conversation
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !selectedConversation?.id) return;

    socket.emit('join_conversation', { conversationId: selectedConversation.id });
    const interval = setInterval(() => {
      refetchMessages?.(); 
    }, 1000);

    return () => {
      socket.emit('leave_conversation', { conversationId: selectedConversation.id });
      clearInterval(interval); // cleanup
    };
  }, [selectedConversation?.id]);

  // Load initial messages
  useEffect(() => {
    if (messagesResponse?.data) {
      const sorted = [...messagesResponse.data].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setMessages(sorted);
    }
  }, [messagesResponse]);

  // Handle socket events
  // useEffect(() => {
  //   const socket = getSocket();
  //   if (!socket) return;

  //   const handleNewMessage = (message: Message) => {
  //     if (message.conversationId === selectedConversation?.id) {
  //       setMessages(prev => [
  //         ...prev.filter(msg => !msg.id.startsWith('temp-')),
  //         message
  //       ]);
  //     }
  //   };
  //   socket.on('new_message', handleNewMessage);

  //   const handleTyping = ({ conversationId }: { conversationId: string }) => {
  //     if (conversationId === selectedConversation?.id) {
  //       setTypingStatus(true);
  //     }
  //   };

  //   const handleStopTyping = ({ conversationId }: { conversationId: string }) => {
  //     if (conversationId === selectedConversation?.id) {
  //       setTypingStatus(false);
  //     }
  //   };

  //   socket.on('new_message', handleNewMessage);
  //   socket.on('typing', handleTyping);
  //   socket.on('stop_typing', handleStopTyping);

  //   return () => {
  //     socket.off('new_message', handleNewMessage);
  //     socket.off('typing', handleTyping);
  //     socket.off('stop_typing', handleStopTyping);
  //   };
  // }, [selectedConversation?.id]);

  // const handleTyping = () => {
  //   const socket = getSocket();
  //   if (!socket || !selectedConversation?.id) return;

  //   socket.emit('typing', { conversationId: selectedConversation.id });
  //   clearTimeout(typingTimeout);

  //   typingTimeout = setTimeout(() => {
  //     socket.emit('stop_typing', { conversationId: selectedConversation.id });
  //   }, 1000);
  // };

  // Upload attachment to server
  const handleUploadAttachments = async (attachments: Attachment[]): Promise<string[]> => {
    try {
      const formData = new FormData();
      
      attachments.forEach((attachment, index) => {
        formData.append('files', {
          uri: attachment.uri,
          name: attachment.name,
          type: attachment.type,
        });
      });

      const response = await uploadAttachments(formData).unwrap();
      
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      } else if (response.files && Array.isArray(response.files)) {
        return response.files;
      } else if (response.urls && Array.isArray(response.urls)) {
        return response.urls;
      } else {
        console.error('Unexpected response format:', response);
        throw new Error('Invalid response format from upload endpoint');
      }
    } catch (error) {
      console.error("Upload error:", error);
      throw new Error('Failed to upload attachments');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
      });
      
      if (!result.canceled && result.assets[0]) {
        setAttachments(prev => [...prev, {
          uri: result.assets[0].uri,
          name: result.assets[0].name,
          type: result.assets[0].mimeType || 'application/octet-stream'
        }]);
      }
    } catch (err) {
      console.log('Document picker error:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to pick document',
      });
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const compressed = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [],
          { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
        );

        setAttachments(prev => [...prev, {
          uri: compressed.uri,
          name: `image_${Date.now()}.jpg`,
          type: 'image/jpeg'
        }]);
      }
    } catch (err) {
      console.log('Image picker error:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to pick image',
      });
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if ((input.trim() === '' && attachments.length === 0) || sending) return;

    setSending(true);

    try {
      let currentConversationId = selectedConversation?.id;
      const tempMessageId = `temp-${Date.now()}`;
      
      // Create temporary message for immediate UI feedback
      const tempMessage: Message = {
        id: tempMessageId,
        content: input.trim() !== '' ? input : '[Attachment]',
        senderType: 'CUSTOMER',
        userId: userId,
        conversationId: currentConversationId || 'temp',
        read: false,
        attachments: attachments.map(a => a.uri), 
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        user: userProfile?.data
      };

      // Add temporary message immediately
      setMessages(prev => [...prev, tempMessage]);

      // Upload attachments first
      let uploadedAttachmentUrls: string[] = [];
      
      if (attachments.length > 0) {
        uploadedAttachmentUrls = await handleUploadAttachments(attachments);
      }

      // Create conversation if needed
      if (!currentConversationId || openConversations.length === 0) {
        const newConv = await createConversation().unwrap();
        currentConversationId = newConv.data.id;
        await refetchConversations();
        setSelectedConversationIndex(0);
      }

      const socket = getSocket();
      if (!socket) throw new Error("Socket not connected");
      const interval = setInterval(() => {
        //console.log(" Reload triggered");
      }, 1000);
      socket.on("disconnect", () => {
        clearInterval(interval);
      });

      // Send message through socket
      const payload = {
        conversationId: currentConversationId,
        senderType: 'CUSTOMER',
        userId: userId, 
        content: input.trim() !== '' ? input : '[Attachment]',
        attachments: uploadedAttachmentUrls,
      };

      console.log(" Sending socket message:", JSON.stringify(payload, null, 2));

      socket.emit('send_message', payload);

      setInput('');
      setAttachments([]);
      
    } catch (err) {
      console.error("Send error:", err);
      // Remove temporary message on error
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')));
      
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to send message',
      });
    } finally {
      setSending(false);
    }
  };

  // Helper function to get full URLs
  const getFullUrl = (url: string): string => {
    if (!url) return '';
    
    // If it's already a full URL or data URI, return as is
    if (url.startsWith('http') || url.startsWith('data:')) {
      return url;
    }
    
    // If it's a relative path, prepend your API base URL
    const baseUrl = 'https://api.sf-e.ca';
    return `${baseUrl}${url.startsWith('/') ? url : '/' + url}`;
  };

  // Format date to show date if not today, otherwise show time
  const formatMessageDate = (dateString: string) => {
    const messageDate = new Date(dateString);
    const today = new Date();
    
    // Check if message is from today
    if (
      messageDate.getDate() === today.getDate() &&
      messageDate.getMonth() === today.getMonth() &&
      messageDate.getFullYear() === today.getFullYear()
    ) {
      return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // Check if message is from yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (
      messageDate.getDate() === yesterday.getDate() &&
      messageDate.getMonth() === yesterday.getMonth() &&
      messageDate.getFullYear() === yesterday.getFullYear()
    ) {
      return `Yesterday ${messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Otherwise show full date and time
    return `${messageDate.toLocaleDateString()} ${messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isTempMessage = item.id.startsWith('temp-');
    const isCurrentUser = item.senderType === 'CUSTOMER' && item.userId === userId;
    
    return (
      <View
        style={[
          styles.messageContainer,
          isCurrentUser ? styles.sentMessage : styles.receivedMessage,
          isTempMessage && styles.tempMessage,
        ]}
      >
        {/* Afficher le nom de l'expéditeur seulement pour les messages ADMIN */}
        {!isCurrentUser && item.senderType === 'ADMIN' && (
          <Text style={styles.senderName}>
            {item.user?.firstname || 'Admin'}
          </Text>
        )}

        {/* Contenu texte */}
        {item.content !== '[Attachment]' && (
          <Text
            style={[
              styles.messageText,
              isCurrentUser ? styles.sentText : styles.receivedText,
            ]}
          >
            {item.content}
          </Text>
        )}

        {/* Attachments */}
        {item.attachments?.map((attachment, index) => {
          const isImage =
            /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(attachment) ||
            attachment.startsWith('data:image') ||
            attachment.includes('/images/') ||
            attachment.includes('/Images/');

          const isPdf = /\.pdf$/i.test(attachment) || attachment.includes('/pdf/');

          return (
            <View key={index} style={styles.attachmentContainer}>
              {isImage ? (
                <Image
                  source={{
                    uri: isTempMessage ? attachment : getFullUrl(attachment),
                  }}
                  style={styles.imageAttachment}
                  resizeMode="contain"
                />
              ) : isPdf ? (
                <TouchableOpacity
                  style={styles.pdfAttachment}
                  onPress={() => Linking.openURL(getFullUrl(attachment))}
                >
                  <Icon name="picture-as-pdf" size={32} color="#e74c3c" />
                  <Text style={styles.pdfText}>PDF Document</Text>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {attachment.split('/').pop()}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.fileAttachment}
                  onPress={() => Linking.openURL(getFullUrl(attachment))}
                >
                  <Icon name="insert-drive-file" size={32} color="#555" />
                  <Text style={styles.fileName} numberOfLines={1}>
                    {attachment.split('/').pop()}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {/* Date and time */}
        <Text
          style={[
            styles.messageTime,
            isCurrentUser ? styles.sentTime : styles.receivedTime,
          ]}
        >
          {isTempMessage
            ? 'Envoi...'
            : formatMessageDate(item.createdAt)}
        </Text>
      </View>
    );
  };

  const renderAttachmentPreview = () => (
    <View style={styles.attachmentsPreview}>
      {attachments.map((attachment, index) => (
        <View key={index} style={styles.attachmentPreview}>
          <TouchableOpacity onPress={() => Linking.openURL(attachment.uri)} style={{ flex: 1 }}>
            {attachment.type.includes('image') ? (
              <Image
                source={{ uri: attachment.uri }}
                style={styles.previewImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.fileAttachment}>
                <Icon name="insert-drive-file" size={24} color="#555" />
                <Text style={styles.previewText} numberOfLines={1}>
                  {attachment.name}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => removeAttachment(index)} style={styles.closeIcon}>
            <Icon name="close" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  if (isLoadingConversations || isLoadingMessages) {
    return (
      <View style={styles.loadingContainer}>
        <Loader size="large" color="#7ddd7d" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8f9fa' }}>
      <StatusBar backgroundColor="#7ddd7d" barStyle="light-content" />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 16,
          paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 40,
          paddingHorizontal: 12,
          backgroundColor: '#7ddd7d',
        }}
      >
        {/* Back button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ width: 40, alignItems: 'flex-start' }}
        >
          <Icon name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        {/* Centered Title */}
        <Text
          style={{
            flex: 1,
            textAlign: 'center',
            fontSize: 18,
            fontWeight: 'bold',
            color: 'white',
          }}
        >
          {t('screens.chat')}
        </Text>

        {/* Placeholder to keep title centered */}
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={[
          styles.messagesList,
          { paddingBottom: keyboardOffset > 0 ? keyboardOffset + 70 : 70 },
        ]}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
        automaticallyAdjustContentInsets={true}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      />

      {attachments.length > 0 && renderAttachmentPreview()}

      {typingStatus && (
        <View style={styles.typingIndicator}>
          <Text style={styles.typingText}>Admin is typing...</Text>
        </View>
      )}

      <View
        style={[
          styles.inputContainer,
          { marginBottom: keyboardOffset > 0 ? keyboardOffset : 0 },
        ]}
      >
        <TouchableOpacity onPress={pickImage} style={styles.attachmentButton}>
          <Icon name="image" size={24} color="#555" />
        </TouchableOpacity>

        <TouchableOpacity onPress={pickDocument} style={styles.attachmentButton}>
          <Icon name="insert-drive-file" size={24} color="#555" />
        </TouchableOpacity>

        <TextInput
          value={input}
           onChangeText={text => {
            setInput(text);
            emitTyping(); // Changed from handleTyping() to emitTyping()
          }}
          placeholder="Type a message..."
          style={styles.textInput}
          multiline
          onFocus={() => {
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }}
        />

        <TouchableOpacity
          onPress={handleSend}
          disabled={(input.trim() === '' && attachments.length === 0) || sending}
          style={[
            styles.sendButton,
            (input.trim() === '' && attachments.length === 0) || sending
              ? styles.disabledButton
              : null,
          ]}
        >
          {sending ? <ActivityIndicator size="small" color="#fff" /> : <Icon name="send" size={24} color="#fff" />}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 10,
    marginBottom: 8,
    gap: 10,
  },
  attachmentPreview: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  fileAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  previewText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    color: '#333',
  },
  closeIcon: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#00000088',
    borderRadius: 10,
    padding: 2,
    zIndex: 1,
  },
  messagesList: {
    padding: 10,
    paddingBottom: 70,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    marginBottom: 8,
    // Ensure proper alignment
    alignSelf: 'flex-start',
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#7ddd7d',
    borderBottomRightRadius: 4,
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#e9ecef',
    borderBottomLeftRadius: 4,
  },
  tempMessage: {
    opacity: 0.7,
  },
  messageText: {
    fontSize: 16,
  },
  senderName: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  sentText: {
    color: '#fff', 
  },
  receivedText: {
    color: '#212529',
  },
  messageTime: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  sentTime: {
    color: 'rgba(255,255,255,0.7)',
  },
  receivedTime: {
    color: '#666',
  },
  attachmentContainer: {
    marginTop: 8,
  },
  imageAttachment: {
    width: 250,
    height: 250,
    borderRadius: 8,
    marginVertical: 5,
  },
  pdfAttachment: {
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  pdfText: {
    marginTop: 5,
    color: '#e74c3c',
    fontWeight: 'bold',
  },
  fileName: {
    marginTop: 5,
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingVertical: 8,
    paddingHorizontal: 12,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  attachmentButton: {
    padding: 8,
    marginRight: 5,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#f1f1f1',
    borderRadius: 20,
  },
  sendButton: {
    backgroundColor: '#7ddd7d',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  typingIndicator: {
    padding: 10,
    alignItems: 'center',
  },
  typingText: {
    color: '#666',
    fontStyle: 'italic',
  },
});

export default ChatScreen;