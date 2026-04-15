import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import apiClient from '../shared/api/apiClient';
import ScaleTouchable from '../shared/ui/ScaleTouchable';
import ScreenHeader from '../shared/ui/ScreenHeader';
import SurfaceCard from '../shared/ui/SurfaceCard';
import { triggerHaptic } from '../shared/lib/haptics';
import { colors, radii, spacing } from '../theme/theme';

type ChatMsg = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  time: string;
  isError?: boolean;
};

const WELCOME_MESSAGE: ChatMsg = {
  id: 'welcome',
  role: 'assistant',
  text: 'Hola. Soy Zenith Coach, tu entrenador personal con IA. Puedo ayudarte con técnica, rutinas, nutrición, recuperación y dudas sobre progreso.',
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

    triggerHaptic('selection');

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
      const history = messages
        .filter((currentMessage) => currentMessage.id !== 'welcome')
        .map((currentMessage) => ({ role: currentMessage.role, content: currentMessage.text }));

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
      const errorDetail = err?.response?.data?.detail || 'No pudimos comunicarnos con Zenith Coach en este momento.';
      const errorMsg: ChatMsg = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        text: errorDetail,
        time: formatTime(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
      triggerHaptic('error');
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScreenHeader
        title="Entrenador Zenith"
        subtitle="Tu espacio para resolver dudas y afinar tu entrenamiento."
      />

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        >
          <SurfaceCard variant="secondary" style={styles.introCard}>
            <View style={styles.introHeader}>
              <View style={styles.avatar}>
                <MaterialIcons name="auto-awesome" size={18} color={colors.onAccent} />
              </View>
              <View style={styles.introCopy}>
                <Text style={styles.introTitle}>Zenith Coach listo para ayudarte</Text>
                <Text style={styles.introSubtitle}>
                  Pregunta por técnica, progresión, nutrición, recuperación o cómo estructurar una rutina.
                </Text>
              </View>
            </View>
          </SurfaceCard>

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
                {!isUser ? (
                  <View style={[styles.chatAvatar, msg.isError && styles.chatAvatarError]}>
                    <MaterialIcons
                      name={msg.isError ? 'error-outline' : 'smart-toy'}
                      size={16}
                      color={colors.textPrimary}
                    />
                  </View>
                ) : null}

                <View
                  style={[
                    styles.messageBubble,
                    isUser ? styles.messageBubbleUser : styles.messageBubbleAI,
                    msg.isError && styles.messageBubbleError,
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

          {sending ? (
            <View style={[styles.messageWrapper, styles.messageWrapperAI]}>
              <View style={styles.chatAvatar}>
                <MaterialIcons name="smart-toy" size={16} color={colors.textPrimary} />
              </View>
              <View style={[styles.messageBubble, styles.messageBubbleAI, styles.typingBubble]}>
                <ActivityIndicator size="small" color={colors.accent} />
                <Text style={styles.typingText}>Pensando la mejor respuesta…</Text>
              </View>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.inputArea}>
          <View style={styles.inputShell}>
            <TextInput
              style={styles.input}
              placeholder="Escribe tu pregunta al entrenador"
              placeholderTextColor={colors.textMuted}
              value={message}
              onChangeText={setMessage}
              multiline
              editable={!sending}
              onSubmitEditing={sendMessage}
            />
          </View>

          <ScaleTouchable
            style={[
              styles.sendButton,
              message.trim().length > 0 && !sending && styles.sendButtonActive,
            ]}
            onPress={sendMessage}
            disabled={!message.trim() || sending}
            variant="icon"
          >
            <MaterialIcons
              name="arrow-upward"
              size={20}
              color={message.trim().length > 0 && !sending ? colors.onAccent : colors.textMuted}
            />
          </ScaleTouchable>
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
  chatContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: 28,
  },
  introCard: {
    borderColor: colors.accentBorder,
  },
  introHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  introCopy: {
    flex: 1,
    gap: 4,
  },
  introTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  introSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  messageWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    maxWidth: '88%',
  },
  messageWrapperUser: {
    alignSelf: 'flex-end',
  },
  messageWrapperAI: {
    alignSelf: 'flex-start',
  },
  chatAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatAvatarError: {
    backgroundColor: colors.errorSoft,
    borderColor: colors.error,
  },
  messageBubble: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    flexShrink: 1,
    gap: 4,
  },
  messageBubbleUser: {
    backgroundColor: colors.accent,
    borderBottomRightRadius: 6,
  },
  messageBubbleAI: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderBottomLeftRadius: 6,
  },
  messageBubbleError: {
    backgroundColor: colors.errorSoft,
    borderColor: colors.error,
  },
  messageText: {
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 22,
  },
  messageTextUser: {
    color: colors.onAccent,
    fontWeight: '600',
  },
  messageTime: {
    color: colors.textMuted,
    fontSize: 10,
    alignSelf: 'flex-end',
  },
  messageTimeUser: {
    color: 'rgba(17,17,17,0.72)',
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  typingText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.chrome,
  },
  inputShell: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: 22,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  input: {
    color: colors.textPrimary,
    fontSize: 15,
    maxHeight: 108,
    paddingTop: 10,
    paddingBottom: 10,
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
});

export default AICoachScreen;
