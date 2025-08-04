// src/Screens/ChatScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
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
  Linking ,
  Modal
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { 
  useSendMessageMutation, 
  useGetConversationMessagesQuery, 
  useCreateConversationMutation,
  useGetConversationsQuery 
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
  const [attachments, setAttachments] = useState([]);
  const flatListRef = useRef(null);
  const [userToken, setUserToken] = useState(null);
  const [sending, setSending] = useState(false);
   const [messages, setMessages] = useState([]);
  const [typingStatus, setTypingStatus] = useState(false);
  const [selectedConversationIndex, setSelectedConversationIndex] = useState(0);
  const [showConversationPicker, setShowConversationPicker] = useState(false);

  const { data: userProfile } = useGetUserProfileQuery();
  const userId = userProfile?.data?.id;
  
  const { data: conversationsResponse, isLoading: isLoadingConversations, refetch: refetchConversations } = useGetConversationsQuery(userId, {
    skip: !userId
  });
  
  const conversations = conversationsResponse?.data || [];
  const openConversations = conversations.filter(conv => conv.status === 'OPEN');
  const selectedConversation = openConversations[selectedConversationIndex];
  
  const { data: messagesResponse, isLoading: isLoadingMessages, refetch } = useGetConversationMessagesQuery(selectedConversation?.id, {
    skip: !selectedConversation
  });

  // const messages = [...(messagesResponse?.data || [])].sort(
  //   (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  // );

  const [sendMessage] = useSendMessageMutation();
  const [createConversation] = useCreateConversationMutation();
  useEffect(() => {
    const fetchToken = async () => {
      const accessToken = await getData('@authData');
      //console.log('Fetched accessToken:', accessToken);
      setUserToken(accessToken);
    };
    fetchToken();
  }, []);
   // Initialize socket
  useEffect(() => {
    if (userToken) initSocket(userToken);
  }, [userToken]);

  // Join/leave conversation
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !selectedConversation?.id) return;

    socket.emit('join_conversation', { conversationId: selectedConversation.id });

    return () => {
      socket.emit('leave_conversation', { conversationId: selectedConversation.id });
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
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewMessage = (message) => {
      if (message.conversationId === selectedConversation?.id) {
        setMessages(prev => [...prev, message]);
      }
    };

    const handleTyping = ({ conversationId }) => {
      if (conversationId === selectedConversation?.id) {
        setTypingStatus(true);
      }
    };

    const handleStopTyping = ({ conversationId }) => {
      if (conversationId === selectedConversation?.id) {
        setTypingStatus(false);
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('typing', handleTyping);
    socket.on('stop_typing', handleStopTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('typing', handleTyping);
      socket.off('stop_typing', handleStopTyping);
    };
  }, [selectedConversation?.id]);

  const handleTyping = () => {
    const socket = getSocket();
    if (!socket || !selectedConversation?.id) return;

    socket.emit('typing', { conversationId: selectedConversation.id });
    clearTimeout(typingTimeout);

    typingTimeout = setTimeout(() => {
      socket.emit('stop_typing', { conversationId: selectedConversation.id });
    }, 2000);
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

      if (!currentConversationId || openConversations.length === 0) {
        const newConv = await createConversation().unwrap();
        currentConversationId = newConv.data.id;
        await refetchConversations();
        setSelectedConversationIndex(0);
        setSending(false);
        return;
      }

      const socket = getSocket();
      if (!socket) throw new Error("Socket not connected");

      socket.emit('send_message', {
        conversationId: currentConversationId,
        senderType: 'CUSTOMER',
        content: input.trim() !== '' ? input : '[Attachment]',
        attachments,
      });

      setInput('');
      setAttachments([]);
    } catch (err) {
      console.error('Send error:', err);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to send message',
      });
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.senderType === 'ADMIN' ? styles.receivedMessage : styles.sentMessage
    ]}>
      {item.senderType === 'ADMIN' && (
        <Text style={styles.senderName}>
          {item.user?.firstname || 'Admin'}
        </Text>
      )}
      <Text style={[
        styles.messageText,
        item.senderType === 'ADMIN' ? styles.receivedText : styles.sentText
      ]}>
        {item.content}
      </Text>
      
      {item.attachments?.map((attachment, index) => (
        <View key={index} style={styles.attachmentContainer}>
          {attachment.includes('/Images/') ? (
            <Image 
              source={{ uri: attachment }} 
              style={styles.imageAttachment}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.fileAttachment}>
              <Icon name="insert-drive-file" size={24} color="#555" />
              <Text style={styles.fileName} numberOfLines={1}>
                {attachment.split('/').pop()}
              </Text>
            </View>
          )}
        </View>
      ))}
      
      <Text style={[
        styles.messageTime,
        item.senderType === 'ADMIN' ? styles.receivedTime : styles.sentTime
      ]}>
        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
    </View>
  );

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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Conversation Selector */}
      {/* <TouchableOpacity 
        style={styles.conversationSelector}
        onPress={() => setShowConversationPicker(true)}
      >
        <Text style={styles.conversationSelectorText}>
          {selectedConversation 
            ? `Conversation ${openConversations.findIndex(c => c.id === selectedConversation.id) + 1} (${new Date(selectedConversation.createdAt).toLocaleDateString()})`
            : openConversations.length === 0 
              ? 'No open conversations - new one will be created'
              : 'Select a conversation'}
        </Text>
        <Icon name="arrow-drop-down" size={24} color="#555" />
      </TouchableOpacity> */}

      {/* Conversation Picker Modal */}
      {/* <Modal
        visible={showConversationPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowConversationPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Conversation</Text>
             <FlatList
                data={openConversations}
                keyExtractor={item => item.id}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    style={styles.conversationItem}
                    onPress={() => {
                      setSelectedConversationIndex(index);
                      setShowConversationPicker(false);
                    }}
                  >
                    <Text style={styles.conversationItemText}>
                      Conversation {index + 1} ({new Date(item.createdAt).toLocaleDateString()})
                    </Text>
                    {index === selectedConversationIndex && (
                      <Icon name="check" size={20} color="#7ddd7d" />
                    )}
                  </TouchableOpacity>
                )}
              />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowConversationPicker(false)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal> */}

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
      />

      {attachments.length > 0 && renderAttachmentPreview()}

      <View style={styles.inputContainer}>
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
            handleTyping();
          }}
          placeholder="Type a message..."
          style={styles.textInput}
          multiline
        />
        
        <TouchableOpacity 
          onPress={handleSend}
          disabled={(input.trim() === '' && attachments.length === 0) || sending}
          style={[
            styles.sendButton,
            (input.trim() === '' && attachments.length === 0) || sending ? styles.disabledButton : null
          ]}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Icon name="send" size={24} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  conversationSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  conversationSelectorText: {
    fontSize: 16,
    color: '#333',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 10,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    textAlign: 'center',
  },
  conversationItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  conversationItemText: {
    fontSize: 16,
  },
  closeButton: {
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#7ddd7d',
    fontSize: 16,
    fontWeight: 'bold',
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
    width: 200,
    height: 200,
    borderRadius: 8,
  },
  fileAttachment: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 8,
  },
  fileName: {
    color: '#fff',
    marginLeft: 8,
    flexShrink: 1,
  },
  attachmentsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  attachmentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e9ecef',
    borderRadius: 15,
    padding: 8,
    marginRight: 8,
    marginBottom: 8,
    maxWidth: '45%',
  },
  previewImage: {
    width: 30,
    height: 30,
    borderRadius: 4,
    marginRight: 8,
  },
  previewText: {
    flex: 1,
    fontSize: 12,
    marginRight: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingVertical: 8,
    paddingHorizontal: 12,
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
});

export default ChatScreen;