import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { triggerHaptic } from '../lib/haptics';
import { colors, elevation, motion, radii, spacing } from '../../theme/theme';

type ToastVariant = 'success' | 'error' | 'info';

type ToastPayload = {
  title: string;
  message?: string;
  variant?: ToastVariant;
  durationMs?: number;
};

type ToastState = ToastPayload & {
  visible: boolean;
};

type ToastContextValue = {
  showToast: (payload: ToastPayload) => void;
};

const iconByVariant: Record<ToastVariant, React.ComponentProps<typeof MaterialIcons>['name']> = {
  success: 'check-circle',
  error: 'error-outline',
  info: 'info-outline',
};

const backgroundByVariant: Record<ToastVariant, string> = {
  success: 'rgba(7, 22, 34, 0.96)',
  error: 'rgba(7, 20, 38, 0.96)',
  info: 'rgba(14, 14, 18, 0.96)',
};

const borderByVariant: Record<ToastVariant, string> = {
  success: 'rgba(34, 211, 238, 0.52)',
  error: 'rgba(96, 165, 250, 0.48)',
  info: 'rgba(0, 229, 255, 0.34)',
};

const iconColorByVariant: Record<ToastVariant, string> = {
  success: colors.success,
  error: colors.error,
  info: colors.accent,
};

const hapticByVariant: Record<ToastVariant, 'success' | 'error' | 'selection'> = {
  success: 'success',
  error: 'error',
  info: 'selection',
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const FeedbackToastProvider = ({ children }: PropsWithChildren) => {
  const translateY = useRef(new Animated.Value(-30)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -30,
        duration: motion.fast,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: motion.fast,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) {
        setToast((current) => (current ? { ...current, visible: false } : null));
      }
    });
  }, [opacity, translateY]);

  const showToast = useCallback(
    ({ title, message, variant = 'info', durationMs = 2400 }: ToastPayload) => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }

      setToast({ title, message, variant, durationMs, visible: true });
      opacity.setValue(0);
      translateY.setValue(-30);

      triggerHaptic(hapticByVariant[variant]);

      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: motion.normal,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: motion.normal,
          useNativeDriver: true,
        }),
      ]).start();

      hideTimerRef.current = setTimeout(() => {
        hideToast();
      }, durationMs);
    },
    [hideToast, opacity, translateY]
  );

  const value = useMemo(() => ({ showToast }), [showToast]);
  const variant = toast?.variant ?? 'info';

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast?.visible ? (
        <SafeAreaView pointerEvents="none" style={styles.safeArea}>
          <Animated.View
            style={[
              styles.toastShell,
              {
                backgroundColor: backgroundByVariant[variant],
                borderColor: borderByVariant[variant],
                opacity,
                transform: [{ translateY }],
              },
            ]}
          >
            <View style={styles.toast}>
              <View style={styles.iconWrap}>
                <MaterialIcons
                  name={iconByVariant[variant]}
                  size={20}
                  color={iconColorByVariant[variant]}
                />
              </View>
              <View style={styles.copy}>
                <Text style={styles.title}>{toast.title}</Text>
                {toast.message ? <Text style={styles.message}>{toast.message}</Text> : null}
              </View>
            </View>
          </Animated.View>
        </SafeAreaView>
      ) : null}
    </ToastContext.Provider>
  );
};

export const useFeedbackToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useFeedbackToast must be used within FeedbackToastProvider');
  }

  return context;
};

const styles = StyleSheet.create({
  safeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    zIndex: 1000,
  },
  toastShell: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.xl,
    overflow: 'hidden',
    ...elevation.soft,
  },
  toast: {
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  message: {
    color: 'rgba(255,255,255,0.86)',
    fontSize: 12,
    lineHeight: 18,
  },
});
