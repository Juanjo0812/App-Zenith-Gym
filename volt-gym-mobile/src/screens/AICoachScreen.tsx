import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { MOCK_CHAT } from '../data/mockData';

const AICoachScreen = () => {
  const [message, setMessage] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <MaterialIcons name="auto-awesome" size={24} color="#FF4500" />
          <Text style={styles.headerTitle}>VOLT Coach</Text>
        </View>
        <Text style={styles.headerSubtitle}>Entrenador Personal IA</Text>
      </View>

      {/* Chat Area */}
      <KeyboardAvoidingView 
        style={styles.chatContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView 
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {MOCK_CHAT.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <View 
                key={msg.id} 
                style={[
                  styles.messageWrapper, 
                  isUser ? styles.messageWrapperUser : styles.messageWrapperAI
                ]}
              >
                {!isUser && (
                  <View style={styles.aiAvatar}>
                    <MaterialIcons name="smart-toy" size={16} color="#FFFFFF" />
                  </View>
                )}
                
                <View style={[
                  styles.messageBubble,
                  isUser ? styles.messageBubbleUser : styles.messageBubbleAI
                ]}>
                  <Text style={[styles.messageText, isUser && styles.messageTextUser]}>
                    {msg.text}
                  </Text>
                  <Text style={[styles.messageTime, isUser && styles.messageTimeUser]}>
                    {msg.time}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton}>
            <MaterialIcons name="add" size={24} color="#A0A0B8" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Pregúntale a tu Coach..."
            placeholderTextColor="#888888"
            value={message}
            onChangeText={setMessage}
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendButton, message.trim().length > 0 && styles.sendButtonActive]}
          >
            <MaterialIcons 
              name="send" 
              size={20} 
              color={message.trim().length > 0 ? '#FFFFFF' : '#888888'} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    padding: 16,
    backgroundColor: '#0F0F23',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A2E',
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#A0A0B8',
    marginTop: 2,
  },
  chatContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
    gap: 16,
  },
  messageWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
    maxWidth: '85%',
  },
  messageWrapperUser: {
    alignSelf: 'flex-end',
  },
  messageWrapperAI: {
    alignSelf: 'flex-start',
  },
  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF4500',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageBubble: {
    padding: 14,
    borderRadius: 18,
  },
  messageBubbleUser: {
    backgroundColor: '#FF4500',
    borderBottomRightRadius: 4,
  },
  messageBubbleAI: {
    backgroundColor: '#1A1A2E',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#2A2A4A',
  },
  messageText: {
    fontSize: 15,
    color: '#EAEAEA',
    lineHeight: 22,
  },
  messageTextUser: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  messageTime: {
    fontSize: 10,
    color: '#888888',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  messageTimeUser: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    backgroundColor: '#0F0F23',
    borderTopWidth: 1,
    borderTopColor: '#1A1A2E',
  },
  attachButton: {
    padding: 8,
    marginRight: 4,
  },
  input: {
    flex: 1,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#222222',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    color: '#FFFFFF',
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#222222',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonActive: {
    backgroundColor: '#FF4500',
  }
});

export default AICoachScreen;

