import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform,
  Alert,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen = ({ navigation }: Props) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Error', 'Por favor ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        let message = 'Error al iniciar sesión.';
        if (error.message.includes('Invalid login credentials')) {
          message = 'Correo o contraseña incorrectos.';
        } else if (error.message.includes('Email not confirmed')) {
          message = 'Debes confirmar tu correo electrónico antes de iniciar sesión.';
        } else {
          message = error.message;
        }
        Alert.alert('Error', message);
        return;
      }

      navigation.replace('Main');
    } catch (err) {
      Alert.alert('Error', 'Ocurrió un error inesperado. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {/* Top Branding Section */}
          <View style={styles.logoContainer}>
            <Text style={styles.voltText}>VOLT</Text>
            <View style={styles.lineSeparator} />
            <Text style={styles.gymClubText}>GYM CLUB</Text>
          </View>

          {/* Welcome Text */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeTitle}>Bienvenido de nuevo</Text>
            <Text style={styles.welcomeSubtitle}>Inicia sesión para continuar tu evolución</Text>
          </View>

          {/* Form Section */}
          <View style={styles.form}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>CORREO ELECTRÓNICO</Text>
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
              <Text style={styles.inputLabel}>CONTRASEÑA</Text>
              <TextInput 
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#666"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.loginButton, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.loginButtonText}>INICIAR SESIÓN</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Social / Register Footnote */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>¿No tienes una cuenta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.signUpText}>Únete al club</Text>
            </TouchableOpacity>
          </View>
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
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  voltText: {
    fontSize: 70,
    fontWeight: '900',
    color: '#FF4500',
    letterSpacing: -2,
    lineHeight: 70,
  },
  lineSeparator: {
    width: width * 0.6,
    height: 1,
    backgroundColor: '#FF4500',
    marginVertical: 10,
    opacity: 0.5,
  },
  gymClubText: {
    fontSize: 20,
    color: '#FFFFFF',
    letterSpacing: 8,
    fontWeight: '300',
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
  forgotPassword: {
    alignSelf: 'flex-end',
  },
  forgotPasswordText: {
    color: '#FF4500',
    fontSize: 14,
  },
  loginButton: {
    backgroundColor: '#FF4500',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#FF4500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
  },
  footerText: {
    color: '#888',
    fontSize: 14,
  },
  signUpText: {
    color: '#FF4500',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default LoginScreen;
