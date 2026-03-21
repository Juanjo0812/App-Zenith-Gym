import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../shared/api/apiClient';
import { colors } from '../theme/theme';

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
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <MaterialIcons name="auto-awesome" size={24} color={colors.accent} />
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
                <ActivityIndicator size="small" color={colors.accent} />
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
    backgroundColor: colors.background,
  },
  header: {
    padding: 16,
    backgroundColor: colors.chrome,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
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
    backgroundColor: colors.accent,
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
    backgroundColor: colors.accent,
    borderBottomRightRadius: 4,
  },
  messageBubbleAI: {
    backgroundColor: colors.surfaceAlt,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageText: {
    fontSize: 15,
    color: colors.textPrimary,
    lineHeight: 22,
  },
  messageTextUser: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  messageTime: {
    fontSize: 10,
    color: colors.textMuted,
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
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.chrome,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 15,
    color: colors.textPrimary,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonActive: {
    backgroundColor: colors.accent,
  },
});

export default AICoachScreen;
