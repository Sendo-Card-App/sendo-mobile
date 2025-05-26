// src/screens/ChatScreen.tsx
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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useSendMessageMutation, useGetConversationMessagesQuery, useCreateConversationMutation } from '../../services/Chat/ChatApi';
import { initSocket, getSocket } from '../../utils/socket';

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
  conversationId: number;
  read: boolean;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
}

const ChatScreen = ({ route, navigation }) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState([]); // Remove <Attachment[]>
  const flatListRef = useRef(null); // Remove <FlatList>
  const [sending, setSending] = useState(false);
  

  // RTK Query hooks
  const { data: messages = [], isLoading, refetch } = useGetConversationMessagesQuery();
  const [sendMessage] = useSendMessageMutation();
  const [createConversation] = useCreateConversationMutation();

  // Socket.io setup
  // useEffect(() => {
  //   const socket = getSocket();
  //   if (!socket) return;

  //   socket.emit('join_conversation', conversationId);

  //   socket.on('new_message', (newMessage: Message) => {
  //     // RTK Query will automatically refetch and update the cache
  //     refetch();
  //   });

  //   return () => {
  //     socket.emit('leave_conversation', conversationId);
  //     socket.off('new_message');
  //   };
  // }, [conversationId, refetch]);

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
      
      // Prepare message data
      const messageData = {
        conversationId,
        content: input,
        senderType: 'CUSTOMER',
        attachments: attachments.map(a => a.uri), // In real app, upload these first
      };

      // Send via RTK Query mutation
      await createConversation(messageData).unwrap();

      // Clear input
      setInput('');
      setAttachments([]);
      
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageContainer,
      item.senderType === 'ADMIN' ? styles.receivedMessage : styles.sentMessage
    ]}>
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
      
      <Text style={styles.messageTime}>
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        inverted={false}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    paddingBottom: 10,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    marginBottom: 8,
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: 'green',
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
    color: 'rgba(255,255,255,0.7)',
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
    paddingHorizontal: 5,
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
    borderRadius: 25,
    marginBottom: 30,
    paddingVertical: 8,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  },
  sendButton: {
    backgroundColor: 'green',
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