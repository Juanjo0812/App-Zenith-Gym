import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { supabase } from '../lib/supabase';
import { RootStackParamList } from '../navigation/AppNavigator';
import { userService } from '../services/userService';

type Props = NativeStackScreenProps<RootStackParamList, 'Register'>;

const RegisterScreen = ({ navigation }: Props) => {
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
      Alert.alert('Error', 'Todos los campos excepto dirección son obligatorios.');
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9._]{3,30}$/;
    if (!usernameRegex.test(username.trim())) {
      Alert.alert('Error', 'El usuario debe tener entre 3 y 30 caracteres y solo puede contener letras, números, puntos y guiones bajos.');
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert('Error', 'Por favor ingresa un correo electrónico válido.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
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
        Alert.alert('Error', authError.message || 'Error al registrar el usuario.');
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
            Alert.alert(
              'Aviso',
              profileResult.error || 'La cuenta fue creada, pero faltó sincronizar algunos datos del perfil.'
            );
          }

          Alert.alert(
            '¡Bienvenido a VOLT!',
            'Tu cuenta se creó satisfactoriamente.',
            [{ text: 'OK', onPress: () => navigation.navigate('Main') }]
          );
        } else {
          Alert.alert(
            '¡Cuenta creada!',
            'Revisa tu correo electrónico para confirmar tu cuenta antes de iniciar sesión.',
            [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
          );
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error inesperado. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backButtonText}>← Volver</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Únete al club</Text>
            <Text style={styles.welcomeSubtitle}>Completa tu información para empezar tu evolución</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>NOMBRE *</Text>
              <TextInput
                style={styles.input}
                placeholder="Juan Pérez"
                placeholderTextColor="#666"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>USUARIO *</Text>
              <TextInput
                style={styles.input}
                placeholder="ej. juanjo0812"
                placeholderTextColor="#666"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>CORREO ELECTRÓNICO *</Text>
              <TextInput
                style={styles.input}
                placeholder="atleta@volt.com"
                placeholderTextColor="#666"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>TELÉFONO *</Text>
              <TextInput
                style={styles.input}
                placeholder="+123456789"
                placeholderTextColor="#666"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>DIRECCIÓN</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Calle Principal 123"
                placeholderTextColor="#666"
                value={address}
                onChangeText={setAddress}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>CONTRASEÑA *</Text>
              <TextInput
                style={styles.input}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor="#666"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>CONFIRMAR CONTRASEÑA *</Text>
              <TextInput
                style={styles.input}
                placeholder="Repite tu contraseña"
                placeholderTextColor="#666"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity
              style={[styles.registerButton, loading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.registerButtonText}>CREAR CUENTA</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingBottom: 40,
    paddingTop: 20,
  },
  header: {
    marginBottom: 30,
  },
  backButtonText: {
    color: '#FF4500',
    fontSize: 16,
    fontWeight: 'bold',
  },
  welcomeSection: {
    marginBottom: 40,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#888',
  },
  form: {
    gap: 20,
  },
  inputWrapper: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF4500',
    letterSpacing: 2,
  },
  input: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
  },
  registerButton: {
    backgroundColor: '#FF4500',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#FF4500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  },
});

export default RegisterScreen;
