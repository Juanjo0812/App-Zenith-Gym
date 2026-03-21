import React, { useState, useCallback } from 'react';
import {
  StyleSheet, View, Text, SafeAreaView, ScrollView, Image, TouchableOpacity,
  ActivityIndicator, Alert, Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { userService, UserProfile, UserStats, getXpForNextLevel, getXpProgress } from '../services/userService';

const ProfileScreen = ({ navigation }: any) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit profile modal
  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [profileData, statsData] = await Promise.all([
        userService.getProfile(),
        userService.getStats(),
      ]);
      setProfile(profileData);
      setStats(statsData);
    } catch (err) {
      console.error('Error cargando perfil:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleSignOut = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          await userService.signOut();
          navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
        },
      },
    ]);
  };

  const openEditProfile = () => {
    if (!profile) return;
    setEditName(profile.name || '');
    setEditUsername(profile.username || '');
    setEditPhone(profile.phone || '');
    setEditVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Error', 'El nombre no puede estar vacío.');
      return;
    }

    if (editUsername.trim()) {
      const usernameRegex = /^[a-zA-Z0-9._]{3,30}$/;
      if (!usernameRegex.test(editUsername.trim())) {
        Alert.alert('Error', 'El usuario debe tener entre 3 y 30 caracteres (letras, números, puntos y guiones bajos).');
        return;
      }
    }

    setSaving(true);
    const result = await userService.updateProfile({
      name: editName.trim(),
      username: editUsername.trim() || undefined,
      phone: editPhone.trim() || undefined,
    });
    setSaving(false);

    if (!result.success) {
      Alert.alert('Error', result.error || 'No se pudo actualizar el perfil.');
      return;
    }

    setEditVisible(false);
    await loadData();
  };

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso necesario', 'Se necesita acceso a la galería para cambiar la foto de perfil.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    setUploadingAvatar(true);
    const { url, error } = await userService.uploadAvatar(result.assets[0].uri);
    setUploadingAvatar(false);

    if (error) {
      Alert.alert('Error', error);
      return;
    }

    // Refresh profile to get updated avatar
    await loadData();
  };

  if (loading || !profile) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#FF4500" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  const xpNextLevel = getXpForNextLevel(profile.level);
  const xpProgressPercent = getXpProgress(profile.total_xp, profile.level);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Perfil</Text>
        <TouchableOpacity onPress={handleSignOut}>
          <MaterialIcons name="logout" size={28} color="#FF4500" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* User Info Header */}
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={handlePickAvatar} activeOpacity={0.7}>
            <View style={styles.avatarContainer}>
              {profile.avatar_url ? (
                <Image 
                  source={{ uri: profile.avatar_url }} 
                  style={styles.avatar} 
                />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <MaterialIcons name="person" size={48} color="#FF4500" />
                </View>
              )}
              {uploadingAvatar ? (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator color="#FFFFFF" />
                </View>
              ) : (
                <View style={styles.avatarEditBadge}>
                  <MaterialIcons name="camera-alt" size={16} color="#FFFFFF" />
                </View>
              )}
            </View>
          </TouchableOpacity>

          {profile.username ? (
            <Text style={styles.usernameText}>@{profile.username}</Text>
          ) : null}
          <Text style={styles.userName}>{profile.name}</Text>
          <Text style={styles.emailText}>{profile.email}</Text>
          <Text style={styles.memberSince}>
            Atleta desde {stats?.memberSince || '—'}
          </Text>

          {/* Edit Profile Button */}
          <TouchableOpacity style={styles.editButton} onPress={openEditProfile}>
            <MaterialIcons name="edit" size={16} color="#FF4500" />
            <Text style={styles.editButtonText}>Editar perfil</Text>
          </TouchableOpacity>
        </View>

        {/* Level Card */}
        <View style={styles.card}>
          <View style={styles.levelRow}>
            <View style={styles.levelBadgeBig}>
              <Text style={styles.levelNumberBig}>{profile.level}</Text>
            </View>
            <View style={styles.levelInfo}>
              <Text style={styles.levelTitle}>Nivel {profile.level}</Text>
              <Text style={styles.xpText}>{profile.total_xp} / {xpNextLevel} XP</Text>
            </View>
          </View>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${xpProgressPercent}%` }]} />
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <MaterialIcons name="fitness-center" size={24} color="#FF4500" />
            <Text style={styles.statValue}>{stats?.totalWorkouts ?? 0}</Text>
            <Text style={styles.statLabel}>Entrenos</Text>
          </View>
          <View style={styles.statBox}>
            <MaterialIcons name="local-fire-department" size={24} color="#FF4500" />
            <Text style={styles.statValue}>{stats?.streak ?? 0}</Text>
            <Text style={styles.statLabel}>Días (racha)</Text>
          </View>
          <View style={styles.statBox}>
            <MaterialIcons name="emoji-events" size={24} color="#FF4500" />
            <Text style={styles.statValue}>{stats?.prs ?? 0}</Text>
            <Text style={styles.statLabel}>Récords (PRs)</Text>
          </View>
        </View>

        {/* List Menu */}
        <View style={styles.menuList}>
          <TouchableOpacity style={styles.menuItem}>
            <MaterialIcons name="history" size={24} color="#A0A0B8" />
            <Text style={styles.menuItemText}>Historial completo</Text>
            <MaterialIcons name="chevron-right" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <MaterialIcons name="straighten" size={24} color="#A0A0B8" />
            <Text style={styles.menuItemText}>Medidas corporales</Text>
            <MaterialIcons name="chevron-right" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <MaterialIcons name="group" size={24} color="#A0A0B8" />
            <Text style={styles.menuItemText}>Mis amigos</Text>
            <MaterialIcons name="chevron-right" size={24} color="#333" />
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* ── Edit Profile Modal ── */}
      <Modal
        visible={editVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setEditVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar perfil</Text>
              <TouchableOpacity onPress={() => setEditVisible(false)}>
                <MaterialIcons name="close" size={24} color="#A0A0B8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              <View style={styles.modalInputWrapper}>
                <Text style={styles.modalLabel}>NOMBRE</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Tu nombre completo"
                  placeholderTextColor="#666"
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.modalInputWrapper}>
                <Text style={styles.modalLabel}>USUARIO</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editUsername}
                  onChangeText={setEditUsername}
                  placeholder="ej. juanjo0812"
                  placeholderTextColor="#666"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.modalInputWrapper}>
                <Text style={styles.modalLabel}>TELÉFONO</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="+123456789"
                  placeholderTextColor="#666"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.modalInputWrapper}>
                <Text style={styles.modalLabel}>CORREO ELECTRÓNICO</Text>
                <TextInput
                  style={[styles.modalInput, { opacity: 0.5 }]}
                  value={profile.email}
                  editable={false}
                />
                <Text style={styles.modalHint}>
                  El correo no se puede cambiar desde aquí
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.saveButton, saving && { opacity: 0.7 }]}
              onPress={handleSaveProfile}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>GUARDAR CAMBIOS</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#0F0F23',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A2E',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF4500',
  },
  scrollContent: {
    padding: 20,
    gap: 20,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FF4500',
  },
  avatarPlaceholder: {
    backgroundColor: '#1A1A2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 50,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF4500',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  usernameText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF4500',
    marginBottom: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  emailText: {
    fontSize: 14,
    color: '#A0A0B8',
    marginBottom: 2,
  },
  memberSince: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#FF4500',
    borderRadius: 20,
  },
  editButtonText: {
    color: '#FF4500',
    fontSize: 14,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#222222',
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelBadgeBig: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF4500',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  levelNumberBig: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  xpText: {
    fontSize: 13,
    color: '#A0A0B8',
    marginTop: 2,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#333333',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF4500',
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#222222',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#A0A0B8',
    textAlign: 'center',
  },
  menuList: {
    backgroundColor: '#111111',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222222',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  menuItemText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    marginLeft: 16,
  },
  // ── Modal Styles ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#111111',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalForm: {
    marginBottom: 16,
  },
  modalInputWrapper: {
    marginBottom: 20,
    gap: 8,
  },
  modalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF4500',
    letterSpacing: 2,
  },
  modalInput: {
    backgroundColor: '#1A1A2E',
    borderWidth: 1,
    borderColor: '#222222',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
  },
  modalHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#FF4500',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#FF4500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
});

export default ProfileScreen;
