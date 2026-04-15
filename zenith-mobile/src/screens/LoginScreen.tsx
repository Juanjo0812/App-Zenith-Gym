import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../navigation/AppNavigator';
import { supabase } from '../lib/supabase';
import { DEMO_CREDENTIALS, enableDemoMode, matchesDemoCredentials } from '../lib/demoMode';
import { useFeedbackToast } from '../shared/ui/FeedbackToast';
import PremiumButton from '../shared/ui/PremiumButton';
import ScaleTouchable from '../shared/ui/ScaleTouchable';
import SurfaceCard from '../shared/ui/SurfaceCard';
import { colors, radii, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen = ({ navigation }: Props) => {
  const { showToast } = useFeedbackToast();
  const [identifier, setIdentifier] = useState(DEMO_CREDENTIALS.identifier);
  const [password, setPassword] = useState(DEMO_CREDENTIALS.password);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const normalizedIdentifier = identifier.trim();

    if (!normalizedIdentifier || !password) {
      showToast({
        title: 'Completa tus datos',
        message: 'Ingresa tu usuario, correo y contraseña para continuar.',
        variant: 'error',
      });
      return;
    }

    if (matchesDemoCredentials(normalizedIdentifier, password)) {
      await enableDemoMode();
      navigation.replace('Main');
      return;
    }

    if (!normalizedIdentifier.includes('@')) {
      showToast({
        title: 'Acceso demo disponible',
        message: `Usa ${DEMO_CREDENTIALS.identifier} / ${DEMO_CREDENTIALS.password} para entrar sin conexión.`,
        variant: 'info',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedIdentifier.toLowerCase(),
        password,
      });

      if (error) {
        let message = 'No pudimos iniciar sesión.';
        if (error.message.includes('Invalid login credentials')) {
          message = 'El correo o la contraseña no coinciden.';
        } else if (error.message.includes('Email not confirmed')) {
          message = 'Debes confirmar tu correo antes de iniciar sesión.';
        } else {
          message = 'No pudimos completar el acceso en este momento.';
        }

        showToast({
          title: 'Acceso no disponible',
          message,
          variant: 'error',
        });
        return;
      }

      navigation.replace('Main');
    } catch {
      showToast({
        title: 'Ocurrió un problema',
        message: 'Intenta de nuevo en unos segundos.',
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Text style={styles.brand}>ZENITH</Text>
            <Text style={styles.brandSub}>Entrena con claridad</Text>
            <Text style={styles.demoHint}>Acceso demo: Juanjo / 0812</Text>
          </View>

          <View style={styles.copyBlock}>
            <Text style={styles.title}>Bienvenido de nuevo</Text>
            <Text style={styles.subtitle}>
              Inicia sesión para retomar tu progreso y volver a entrenar con claridad.
            </Text>
          </View>

          <SurfaceCard style={styles.formCard}>
            <View style={styles.inputBlock}>
              <Text style={styles.inputLabel}>Usuario o correo electrónico</Text>
              <TextInput
                style={styles.input}
                placeholder={DEMO_CREDENTIALS.identifier}
                placeholderTextColor={colors.textMuted}
                value={identifier}
                onChangeText={setIdentifier}
                keyboardType="default"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputBlock}>
              <Text style={styles.inputLabel}>Contraseña</Text>
              <TextInput
                style={styles.input}
                placeholder={DEMO_CREDENTIALS.password}
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <ScaleTouchable style={styles.forgotTouch} onPress={() => {}} variant="ghost">
              <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
            </ScaleTouchable>

            <PremiumButton
              label={loading ? 'Entrando...' : 'Iniciar sesión'}
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={styles.loginButton}
            />
          </SurfaceCard>

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿No tienes una cuenta?</Text>
            <ScaleTouchable onPress={() => navigation.navigate('Register')} variant="ghost">
              <Text style={styles.footerLink}>Únete al club</Text>
            </ScaleTouchable>
          </View>
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
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.xl,
  },
  logoContainer: {
    alignItems: 'center',
    gap: 4,
  },
  brand: {
    color: colors.accent,
    fontSize: 56,
    fontWeight: '900',
    letterSpacing: -1,
  },
  brandSub: {
    color: colors.textSecondary,
    fontSize: 18,
    fontWeight: '600',
  },
  demoHint: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  copyBlock: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  formCard: {
    gap: spacing.lg,
  },
  inputBlock: {
    gap: 8,
  },
  inputLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 15,
    color: colors.textPrimary,
    fontSize: 15,
  },
  forgotTouch: {
    alignSelf: 'flex-end',
  },
  forgotText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  loginButton: {
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  footerLink: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '800',
  },
});

export default LoginScreen;
