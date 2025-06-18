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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { 
  useSendMessageMutation, 
  useGetConversationMessagesQuery, 
  useCreateConversationMutation,
  useGetConversationsQuery 
} from '../../services/Chat/ChatApi';
import Toast from 'react-native-toast-message';
import { useGetUserProfileQuery } from "../../services/Auth/authAPI";
import TransactionSkeleton from '../../components/TransactionSkeleton';

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

const ChatScreen = ({ route, navigation }) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState([]);
  const flatListRef = useRef(null);
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState(null);

  const { data: userProfile } = useGetUserProfileQuery();
  const userId = userProfile?.data?.id;
  const { data: conversations } = useGetConversationsQuery(userId, {
    skip: !userId
  });

  const { data: messagesResponse, isLoading, refetch } = useGetConversationMessagesQuery(conversationId, {
    skip: !conversationId
  });
  const messages = messagesResponse?.data || [];

  const [sendMessage] = useSendMessageMutation();
  const [createConversation] = useCreateConversationMutation();

  useEffect(() => {
    if (messages.length > 0) {
    }
  }, [messages]);

  useEffect(() => {
    if (conversations?.length > 0) {
      setConversationId(conversations[0].id);
    }
  }, [conversations]);

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
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });
      
      if (!result.canceled && result.assets[0]) {
        setAttachments(prev => [...prev, {
          uri: result.assets[0].uri,
          name: `image_${Date.now()}.jpg`,
          type: result.assets[0].mimeType || 'image/jpeg'
        }]);
      }
    } catch (err) {
      console.log('Image picker error:', err);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

const handleSend = async () => {
  if ((input.trim() === '' && attachments.length === 0) || sending) return;

  try {
    setSending(true);

    let currentConversationId = conversationId;

    if (!currentConversationId) {
      const newConversation = await createConversation().unwrap();
      currentConversationId = newConversation.data.id; // Use .data.id here
      setConversationId(currentConversationId);

      //console.log('[💬] New conversation created:', newConversation);
    } else {
      //console.log('[💬] Using existing conversation ID:', currentConversationId);
    }

    const messageData = {
      conversationId: currentConversationId,
      content: input.trim() !== "" ? input : attachments.length > 0 ? "[Pièce jointe]" : "", // fallback
      senderType: "CUSTOMER",
      attachments: attachments.map((a) => a.uri),
    };

    await sendMessage(messageData).unwrap();

    setInput('');
    setAttachments([]);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    refetch();
  } catch (error) {
    console.error('Failed to send message:', error);
  } finally {
    setSending(false);
  }
};

  const renderMessage = ({ item }) => (
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
      {attachments.map((file, index) => (
        <View key={index} style={styles.attachmentPreview}>
          {file.type.startsWith('image/') ? (
            <Image 
              source={{ uri: file.uri }} 
              style={styles.previewImage}
            />
          ) : (
            <Icon name="insert-drive-file" size={30} color="#555" />
          )}
          <Text style={styles.previewText} numberOfLines={1}>
            {file.name}
          </Text>
          <TouchableOpacity onPress={() => removeAttachment(index)}>
            <Icon name="close" size={18} color="#ff4444" />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  if (isLoading) {
    return (
      <View className="bg-transparent flex-1 items-center justify-center">
      <Loader size="large" color="green" />
    </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        inverted={false}
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
          onChangeText={setInput}
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
  messagesList: {
    padding: 10,
    paddingBottom: 70, // Extra space for input container
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
    marginTop:10,
    marginButton:10,
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