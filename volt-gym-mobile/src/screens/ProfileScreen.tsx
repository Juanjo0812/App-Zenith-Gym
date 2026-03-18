import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, SafeAreaView, TouchableOpacity,
  Image, ScrollView, TextInput, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { userService, UserProfile, UserStats } from '../services/userService';
import { supabase } from '../lib/supabase';

const ProfileScreen = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Edit Form State
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAddress, setEditAddress] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [profileData, statsData] = await Promise.all([
        userService.getProfile(),
        userService.getStats(),
      ]);
      setProfile(profileData);
      setStats(statsData);
      
      // Initialize edit fields
      setEditName(profileData.name || '');
      setEditPhone(profileData.phone || '');
      setEditAddress(profileData.address || '');
    } catch (err) {
      console.error('Error cargando perfil:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (!result.canceled && result.assets[0].uri) {
        setSaving(true);
        const publicUrl = await userService.uploadAvatar(result.assets[0].uri);
        setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
        Alert.alert('Éxito', 'Foto de perfil actualizada.');
      }
    } catch (err) {
      console.error('Error subiendo imagen:', err);
      Alert.alert('Error', 'No se pudo subir la imagen.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updated = await userService.updateProfile({
        name: editName,
        phone: editPhone,
        address: editAddress,
      });
      setProfile(updated);
      setEditing(false);
      Alert.alert('Éxito', 'Perfil actualizado correctamente.');
    } catch (err) {
      Alert.alert('Error', 'No se pudo actualizar el perfil.');
    } finally {
      setSaving(false);
    }
  }

  const handleSignOut = async () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que deseas salir?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Salir', 
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
          }
        }
      ]
    );
  };

  if (loading || !profile) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#FF4500" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          {/* Header & Avatar */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.avatarContainer} 
              onPress={handlePickImage}
              disabled={saving}
            >
              {profile.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <MaterialIcons name="person" size={50} color="#333" />
                </View>
              )}
              {saving && (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator color="#FF4500" />
                </View>
              )}
              <View style={styles.editBadge}>
                <MaterialIcons name="camera-alt" size={16} color="#FFF" />
              </View>
            </TouchableOpacity>

            <Text style={styles.nameText}>{profile.name || 'Atleta Volt'}</Text>
            <Text style={styles.usernameText}>@{profile.username}</Text>

            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>NIVEL {profile.level}</Text>
            </View>
          </View>

          {/* Stats Summary */}
          <View style={styles.statsSummary}>
            <View style={styles.statPoint}>
              <Text style={styles.statValue}>{stats?.totalSessions || 0}</Text>
              <Text style={styles.statLabel}>Sesiones</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statPoint}>
              <Text style={styles.statValue}>{stats?.totalReps.toLocaleString() || 0}</Text>
              <Text style={styles.statLabel}>Reps Totales</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statPoint}>
              <Text style={styles.statValue}>{stats?.topWeight || 0} kg</Text>
              <Text style={styles.statLabel}>Máx Levantado</Text>
            </View>
          </View>

          {/* Profile Form */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Información Personal</Text>
              {!editing ? (
                <TouchableOpacity onPress={() => setEditing(true)}>
                  <MaterialIcons name="edit" size={20} color="#FF4500" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => setEditing(false)}>
                  <Text style={{color: '#888', fontWeight: 'bold'}}>Cancelar</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.formCard}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nombre</Text>
                {editing ? (
                  <TextInput 
                    style={styles.input} 
                    value={editName}
                    onChangeText={setEditName}
                    placeholder="Tu nombre completo"
                    placeholderTextColor="#555"
                  />
                ) : (
                  <Text style={styles.valueText}>{profile.name || 'Sin nombre'}</Text>
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Correo (Suscripción)</Text>
                <Text style={[styles.valueText, { color: '#666' }]}>{profile.email}</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Teléfono</Text>
                {editing ? (
                  <TextInput 
                    style={styles.input} 
                    value={editPhone}
                    onChangeText={setEditPhone}
                    placeholder="+123 456 7890"
                    placeholderTextColor="#555"
                    keyboardType="phone-pad"
                  />
                ) : (
                  <Text style={styles.valueText}>{profile.phone || 'No configurado'}</Text>
                )}
              </View>

              <View style={styles.lastInputGroup}>
                <Text style={styles.label}>Dirección</Text>
                {editing ? (
                  <TextInput 
                    style={styles.input} 
                    value={editAddress}
                    onChangeText={setEditAddress}
                    placeholder="Ciudad, País"
                    placeholderTextColor="#555"
                  />
                ) : (
                  <Text style={styles.valueText}>{profile.address || 'No configurada'}</Text>
                )}
              </View>
            </View>

            {editing && (
              <TouchableOpacity 
                style={[styles.saveButton, saving && { opacity: 0.7 }]}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Settings / Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ajustes</Text>
            <View style={styles.settingsGroup}>
              <TouchableOpacity style={styles.settingItem}>
                <MaterialIcons name="notifications-none" size={24} color="#AAA" />
                <Text style={styles.settingText}>Notificaciones</Text>
                <MaterialIcons name="chevron-right" size={24} color="#333" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingItem}>
                <MaterialIcons name="security" size={24} color="#AAA" />
                <Text style={styles.settingText}>Privacidad y Seguridad</Text>
                <MaterialIcons name="chevron-right" size={24} color="#333" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingItem}>
                <MaterialIcons name="help-outline" size={24} color="#AAA" />
                <Text style={styles.settingText}>Soporte</Text>
                <MaterialIcons name="chevron-right" size={24} color="#333" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign Out */}
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <MaterialIcons name="logout" size={20} color="#FF4500" />
            <Text style={styles.signOutText}>Cerrar Sesión</Text>
          </TouchableOpacity>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  scrollContent: { padding: 20, paddingBottom: 60 },
  header: { alignItems: 'center', marginBottom: 30 },
  avatarContainer: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: '#111', borderWidth: 3, borderColor: '#FF4500',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
    overflow: 'hidden'
  },
  avatar: { width: '100%', height: '100%' },
  avatarPlaceholder: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  avatarOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  editBadge: {
    position: 'absolute', bottom: 5, right: 5,
    backgroundColor: '#FF4500', padding: 6, borderRadius: 15,
  },
  nameText: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
  usernameText: { fontSize: 16, color: '#888', marginTop: 4 },
  levelBadge: {
    backgroundColor: '#1A0F0A', paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 20, marginTop: 16, borderWidth: 1, borderColor: '#FF4500',
  },
  levelText: { color: '#FF4500', fontWeight: 'bold', fontSize: 12 },
  statsSummary: {
    flexDirection: 'row', backgroundColor: '#111',
    borderRadius: 16, padding: 20, marginBottom: 30,
    borderWidth: 1, borderColor: '#222',
  },
  statPoint: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#FFF' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  statDivider: { width: 1, height: '100%', backgroundColor: '#222' },
  section: { marginBottom: 30 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '900', color: '#FF4500', letterSpacing: 1 },
  formCard: { backgroundColor: '#111', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#222' },
  inputGroup: { marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#222', paddingBottom: 16 },
  lastInputGroup: { marginBottom: 0 },
  label: { fontSize: 12, color: '#888', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 8 },
  valueText: { fontSize: 16, color: '#FFF' },
  input: { backgroundColor: '#1A1A1A', padding: 12, borderRadius: 8, color: '#FFF', fontSize: 15 },
  saveButton: { backgroundColor: '#FF4500', padding: 16, borderRadius: 12, marginTop: 16, alignItems: 'center' },
  saveButtonText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  settingsGroup: { backgroundColor: '#111', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#222' },
  settingItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#222' },
  settingText: { flex: 1, marginLeft: 16, color: '#DDD', fontSize: 16 },
  signOutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#333',
    gap: 10, marginTop: 10
  },
  signOutText: { color: '#FF4500', fontWeight: 'bold', fontSize: 16 },
});

export default ProfileScreen;
