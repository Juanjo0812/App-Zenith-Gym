import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import apiClient from '../shared/api/apiClient';

type ChatMsg = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  time: string;
};

const WELCOME_MESSAGE: ChatMsg = {
  id: 'welcome',
  role: 'assistant',
  text: '¡Hola! Soy VOLT Coach, tu entrenador personal con IA. 💪\n\nPuedes preguntarme sobre:\n• Técnica de ejercicios\n• Rutinas de entrenamiento\n• Nutrición y suplementación\n• Recuperación y descanso\n\n¿En qué puedo ayudarte hoy?',
  time: '',
};

const AICoachScreen = () => {
  const [messages, setMessages] = useState<ChatMsg[]>([WELCOME_MESSAGE]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const formatTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  const sendMessage = async () => {
    const text = message.trim();
    if (!text || sending) return;

    const userMsg: ChatMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      time: formatTime(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setMessage('');
    setSending(true);

    try {
      // Build history for context (excluding welcome message)
      const history = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, content: m.text }));

      const { data } = await apiClient.post<{ reply: string; model: string }>('/ai/chat-messages', {
        message: text,
        history,
      });

      const aiMsg: ChatMsg = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        text: data.reply,
        time: formatTime(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorDetail = err?.response?.data?.detail || 'Error al comunicarse con el entrenador';
      const errorMsg: ChatMsg = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        text: `⚠️ ${errorDetail}`,
        time: formatTime(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <MaterialIcons name="auto-awesome" size={24} color="#FF4500" />
          <Text style={styles.headerTitle}>Entrenador VOLT</Text>
        </View>
        <Text style={styles.headerSubtitle}>Entrenador personal con IA</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <View
                key={msg.id}
                style={[
                  styles.messageWrapper,
                  isUser ? styles.messageWrapperUser : styles.messageWrapperAI,
                ]}
              >
                {!isUser && (
                  <View style={styles.aiAvatar}>
                    <MaterialIcons name="smart-toy" size={16} color="#FFFFFF" />
                  </View>
                )}

                <View
                  style={[
                    styles.messageBubble,
                    isUser ? styles.messageBubbleUser : styles.messageBubbleAI,
                  ]}
                >
                  <Text style={[styles.messageText, isUser && styles.messageTextUser]}>
                    {msg.text}
                  </Text>
                  {msg.time ? (
                    <Text style={[styles.messageTime, isUser && styles.messageTimeUser]}>
                      {msg.time}
                    </Text>
                  ) : null}
                </View>
              </View>
            );
          })}

          {sending && (
            <View style={[styles.messageWrapper, styles.messageWrapperAI]}>
              <View style={styles.aiAvatar}>
                <MaterialIcons name="smart-toy" size={16} color="#FFFFFF" />
              </View>
              <View style={[styles.messageBubble, styles.messageBubbleAI, styles.typingBubble]}>
                <ActivityIndicator size="small" color="#FF4500" />
                <Text style={styles.typingText}>Escribiendo...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Pregúntale a tu entrenador..."
            placeholderTextColor="#888888"
            value={message}
            onChangeText={setMessage}
            multiline
            editable={!sending}
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            style={[styles.sendButton, message.trim().length > 0 && !sending && styles.sendButtonActive]}
            onPress={sendMessage}
            disabled={!message.trim() || sending}
          >
            <MaterialIcons
              name="send"
              size={20}
              color={message.trim().length > 0 && !sending ? '#FFFFFF' : '#888888'}
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
    flexShrink: 1,
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
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingText: {
    fontSize: 13,
    color: '#A0A0B8',
    fontStyle: 'italic',
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
  },
});

export default AICoachScreen;
