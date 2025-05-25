import React, { useEffect, useState } from 'react';
import { View, TextInput, TouchableOpacity, FlatList, Text, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { initSocket, getSocket } from '../../utils/socket';

const ChatScreen = ({ token, conversationId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState([]);

  useEffect(() => {
    const socket = initSocket(token);
    socket.emit('join_conversation', conversationId);

    socket.on('new_message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    return () => {
      socket.emit('leave_conversation', conversationId);
      socket.off('new_message');
    };
  }, [conversationId, token]);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
      });
      
      if (!result.canceled) {
        setAttachments([...attachments, {
          uri: result.assets[0].uri,
          name: result.assets[0].name,
          type: result.assets[0].mimeType
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
      
      if (!result.canceled) {
        setAttachments([...attachments, {
          uri: result.assets[0].uri,
          name: `image_${Date.now()}.jpg`,
          type: 'image/jpeg'
        }]);
      }
    } catch (err) {
      console.log('Image picker error:', err);
    }
  };

  const removeAttachment = (index) => {
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };

  const sendMessage = () => {
    if (input.trim() === '' && attachments.length === 0) return;

    const socket = getSocket();
    if (socket) {
      socket.emit('send_message', {
        conversationId,
        content: input,
        attachments,
      });
      setInput('');
      setAttachments([]);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8f9fa', padding: 10 }}>
      {/* Messages List */}
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 10 }}
        renderItem={({ item }) => (
          <View style={{
            alignSelf: item.senderType === 'ADMIN' ? 'flex-start' : 'flex-end',
            marginBottom: 8,
            maxWidth: '80%'
          }}>
            <View style={{
              backgroundColor: item.senderType === 'ADMIN' ? '#e9ecef' : '#007bff',
              padding: 12,
              borderRadius: 18,
              borderBottomLeftRadius: item.senderType === 'ADMIN' ? 4 : 18,
              borderBottomRightRadius: item.senderType === 'ADMIN' ? 18 : 4,
            }}>
              <Text style={{
                color: item.senderType === 'ADMIN' ? '#212529' : '#fff',
                fontSize: 16
              }}>
                {item.content}
              </Text>
            </View>
          </View>
        )}
      />

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <View style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          marginBottom: 8,
          paddingHorizontal: 5
        }}>
          {attachments.map((file, index) => (
            <View key={index} style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#e9ecef',
              borderRadius: 15,
              padding: 8,
              marginRight: 8,
              marginBottom: 8,
              maxWidth: '45%',
            }}>
              {file.type.startsWith('image/') ? (
                <Image 
                  source={{ uri: file.uri }} 
                  style={{ width: 30, height: 30, borderRadius: 4, marginRight: 8 }}
                />
              ) : (
                <Icon name="insert-drive-file" size={30} color="#555" />
              )}
              <Text style={{ flex: 1, fontSize: 12, marginRight: 8 }} numberOfLines={1}>
                {file.name}
              </Text>
              <TouchableOpacity onPress={() => removeAttachment(index)}>
                <Icon name="close" size={18} color="#ff4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Input Area */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 25,
        paddingVertical: 8,
        paddingHorizontal: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      }}>
        <TouchableOpacity onPress={pickImage} style={{ padding: 8, marginRight: 5 }}>
          <Icon name="image" size={24} color="#555" />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={pickDocument} style={{ padding: 8, marginRight: 5 }}>
          <Icon name="insert-drive-file" size={24} color="#555" />
        </TouchableOpacity>
        
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
          style={{
            flex: 1,
            minHeight: 40,
            maxHeight: 100,
            paddingHorizontal: 12,
            fontSize: 16,
          }}
          multiline
        />
        
        <TouchableOpacity 
          onPress={sendMessage}
          disabled={input.trim() === '' && attachments.length === 0}
          style={{
            backgroundColor: input.trim() === '' && attachments.length === 0 ? '#cccccc' : '#007bff',
            borderRadius: 20,
            width: 40,
            height: 40,
            justifyContent: 'center',
            alignItems: 'center',
            marginLeft: 5,
          }}
        >
          <Icon name="send" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ChatScreen;