import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { supabase } from '../lib/supabase';
import { RootStackParamList } from '../navigation/AppNavigator';
import { userService } from '../services/userService';
import { useFeedbackToast } from '../shared/ui/FeedbackToast';
import PremiumButton from '../shared/ui/PremiumButton';
import ScaleTouchable from '../shared/ui/ScaleTouchable';
import SurfaceCard from '../shared/ui/SurfaceCard';
import { colors, radii, spacing } from '../theme/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

const RegisterScreen = ({ navigation }: Props) => {
  const { showToast } = useFeedbackToast();
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const isValidEmail = (value: string) => /\S+@\S+\.\S+/.test(value);

  const handleRegister = async () => {
    if (!name.trim() || !username.trim() || !email.trim() || !phone.trim() || !password || !confirmPassword) {
      showToast({
        title: 'Completa tu registro',
        message: 'Todos los campos excepto dirección son obligatorios.',
        variant: 'error',
      });
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9._]{3,30}$/;
    if (!usernameRegex.test(username.trim())) {
      showToast({
        title: 'Usuario inválido',
        message: 'Usa entre 3 y 30 caracteres con letras, números, puntos o guiones bajos.',
        variant: 'error',
      });
      return;
    }

    if (!isValidEmail(email)) {
      showToast({
        title: 'Correo inválido',
        message: 'Ingresa un correo electrónico válido.',
        variant: 'error',
      });
      return;
    }

    if (password.length < 6) {
      showToast({
        title: 'Contraseña muy corta',
        message: 'Debe tener al menos 6 caracteres.',
        variant: 'error',
      });
      return;
    }

    if (password !== confirmPassword) {
      showToast({
        title: 'Las contraseñas no coinciden',
        message: 'Revisa ambos campos antes de continuar.',
        variant: 'error',
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            full_name: name.trim(),
            username: username.trim(),
            phone: phone.trim(),
          },
        },
      });

      if (authError) {
        showToast({
          title: 'No pudimos crear la cuenta',
          message: 'No pudimos crear la cuenta en este momento.',
          variant: 'error',
        });
        setLoading(false);
        return;
      }

      if (data?.user) {
        if (data.session) {
          const profileResult = await userService.updateProfile({
            name: name.trim(),
            username: username.trim(),
            phone: phone.trim(),
            address: address.trim() || undefined,
          });

          if (!profileResult.success) {
            showToast({
              title: 'Cuenta creada con observaciones',
              message: profileResult.error || 'La cuenta ya existe, pero faltó sincronizar algunos datos del perfil.',
              variant: 'info',
            });
          } else {
            showToast({
              title: 'Bienvenido a Zenith',
              message: 'Tu cuenta ya está lista para empezar.',
              variant: 'success',
            });
          }

          navigation.navigate('Main');
        } else {
          showToast({
            title: 'Cuenta creada',
            message: 'Revisa tu correo para confirmar la cuenta antes de iniciar sesión.',
            variant: 'success',
          });
          navigation.navigate('Login');
        }
      }
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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <ScaleTouchable onPress={() => navigation.goBack()} style={styles.backTouch} variant="ghost">
            <Text style={styles.backText}>Volver</Text>
          </ScaleTouchable>

          <View style={styles.copyBlock}>
            <Text style={styles.title}>Únete al club</Text>
            <Text style={styles.subtitle}>
              Completa tu información y empieza a construir una experiencia de entrenamiento más premium.
            </Text>
          </View>

          <SurfaceCard style={styles.formCard}>
            <View style={styles.inputBlock}>
              <Text style={styles.inputLabel}>Nombre</Text>
              <TextInput
                style={styles.input}
                placeholder="Juan Pérez"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputBlock}>
              <Text style={styles.inputLabel}>Usuario</Text>
              <TextInput
                style={styles.input}
                placeholder="juan.entrena"
                placeholderTextColor={colors.textMuted}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputBlock}>
              <Text style={styles.inputLabel}>Correo electrónico</Text>
              <TextInput
                style={styles.input}
                placeholder="atleta@zenith.app"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputBlock}>
              <Text style={styles.inputLabel}>Teléfono</Text>
              <TextInput
                style={styles.input}
                placeholder="+57 300 000 0000"
                placeholderTextColor={colors.textMuted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputBlock}>
              <Text style={styles.inputLabel}>Dirección</Text>
              <TextInput
                style={styles.input}
                placeholder="Opcional"
                placeholderTextColor={colors.textMuted}
                value={address}
                onChangeText={setAddress}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputBlock}>
              <Text style={styles.inputLabel}>Contraseña</Text>
              <TextInput
                style={styles.input}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.inputBlock}>
              <Text style={styles.inputLabel}>Confirmar contraseña</Text>
              <TextInput
                style={styles.input}
                placeholder="Repite tu contraseña"
                placeholderTextColor={colors.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            <PremiumButton
              label={loading ? 'Creando cuenta...' : 'Crear cuenta'}
              onPress={handleRegister}
              loading={loading}
              disabled={loading}
              style={styles.registerButton}
            />
          </SurfaceCard>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.lg,
  },
  backTouch: {
    alignSelf: 'flex-start',
  },
  backText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '800',
  },
  copyBlock: {
    gap: 8,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
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
  registerButton: {
    marginTop: 4,
  },
});

export default RegisterScreen;
