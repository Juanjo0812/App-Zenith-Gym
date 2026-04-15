import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';

import { userService, UserProfile, UserStats, getXpForNextLevel, getXpProgress } from '../services/userService';
import { useFeedbackToast } from '../shared/ui/FeedbackToast';
import IconButton from '../shared/ui/IconButton';
import PremiumButton from '../shared/ui/PremiumButton';
import ScaleTouchable from '../shared/ui/ScaleTouchable';
import ScreenHeader from '../shared/ui/ScreenHeader';
import StateBanner from '../shared/ui/StateBanner';
import StateCard from '../shared/ui/StateCard';
import SurfaceCard from '../shared/ui/SurfaceCard';
import { colors, radii, spacing } from '../theme/theme';

const ProfileScreen = ({ navigation }: any) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const { showToast } = useFeedbackToast();

  const loadData = useCallback(async () => {
    setErrorMessage('');
    try {
      const [profileData, statsData] = await Promise.all([
        userService.getProfile(),
        userService.getStats(),
      ]);
      setProfile(profileData);
      setStats(statsData);
    } catch (err) {
      console.error('Error cargando perfil:', err);
      setErrorMessage('No pudimos cargar tu perfil. Reintenta para recuperar tu información.');
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
    Alert.alert('Cerrar sesión', '¿Estás seguro de que quieres salir?', [
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
      showToast({
        title: 'Nombre requerido',
        message: 'Ingresa tu nombre antes de guardar los cambios.',
        variant: 'error',
      });
      return;
    }

    if (editUsername.trim()) {
      const usernameRegex = /^[a-zA-Z0-9._]{3,30}$/;
      if (!usernameRegex.test(editUsername.trim())) {
        showToast({
          title: 'Usuario inválido',
          message: 'Usa entre 3 y 30 caracteres con letras, números, puntos o guiones bajos.',
          variant: 'error',
        });
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
      showToast({
        title: 'No pudimos guardar tu perfil',
        message: result.error || 'Intenta de nuevo en unos segundos.',
        variant: 'error',
      });
      return;
    }

    setEditVisible(false);
    await loadData();
    showToast({
      title: 'Perfil actualizado',
      message: 'Tus cambios ya están visibles en la cuenta.',
      variant: 'success',
    });
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
    const { error } = await userService.uploadAvatar(result.assets[0].uri);
    setUploadingAvatar(false);

    if (error) {
      showToast({
        title: 'No pudimos actualizar la foto',
        message: error,
        variant: 'error',
      });
      return;
    }

    await loadData();
    showToast({
      title: 'Foto actualizada',
      message: 'Tu perfil ya muestra la nueva imagen.',
      variant: 'success',
    });
  };

  if (loading && !profile) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <ScreenHeader
          title="Perfil"
          subtitle="Tu cuenta, métricas y ajustes"
          accentTitle
          right={<IconButton icon="logout" color={colors.accent} onPress={handleSignOut} />}
        />
        <View style={styles.centeredState}>
          <SurfaceCard style={styles.loadingCard}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={styles.loadingTitle}>Cargando tu perfil</Text>
            <Text style={styles.loadingText}>Estamos preparando tu cuenta y tus estadísticas personales.</Text>
          </SurfaceCard>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <ScreenHeader
          title="Perfil"
          subtitle="Tu cuenta, métricas y ajustes"
          accentTitle
          right={<IconButton icon="logout" color={colors.accent} onPress={handleSignOut} />}
        />
        <View style={styles.centeredState}>
          <StateCard
            icon="person-outline"
            title="Tu perfil no está disponible"
            description={errorMessage || 'No pudimos cargar la información de la cuenta.'}
            actionLabel="Reintentar"
            onActionPress={loadData}
          />
        </View>
      </SafeAreaView>
    );
  }

  const xpNextLevel = getXpForNextLevel(profile.level);
  const xpProgressPercent = getXpProgress(profile.total_xp, profile.level);

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScreenHeader
        title="Perfil"
        subtitle="Tu cuenta, métricas y ajustes"
        accentTitle
        right={<IconButton icon="logout" color={colors.accent} onPress={handleSignOut} accessibilityLabel="Cerrar sesión" />}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {errorMessage ? (
          <StateBanner
            message={errorMessage}
            variant="error"
            actionLabel="Reintentar"
            onActionPress={loadData}
          />
        ) : null}

        <SurfaceCard variant="secondary" style={styles.profileHero}>
          <ScaleTouchable onPress={handlePickAvatar} style={styles.avatarTouch} variant="card">
            <View style={styles.avatarContainer}>
              {profile.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <MaterialIcons name="person" size={44} color={colors.accent} />
                </View>
              )}

              {uploadingAvatar ? (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator color={colors.textPrimary} />
                </View>
              ) : (
                <View style={styles.avatarBadge}>
                  <MaterialIcons name="photo-camera" size={16} color={colors.onAccent} />
                </View>
              )}
            </View>
          </ScaleTouchable>

          <Text style={styles.profileName}>{profile.name}</Text>
          {profile.username ? <Text style={styles.profileHandle}>@{profile.username}</Text> : null}
          <Text style={styles.profileMeta}>{profile.email}</Text>
          <Text style={styles.profileMeta}>Atleta desde {stats?.memberSince || 'sin dato'}</Text>

          <PremiumButton
            label="Editar perfil"
            icon="edit"
            variant="secondary"
            size="sm"
            onPress={openEditProfile}
            style={styles.editButton}
          />
        </SurfaceCard>

        <SurfaceCard style={styles.levelCard}>
          <View style={styles.levelRow}>
            <View style={styles.levelOrb}>
              <Text style={styles.levelNumber}>{profile.level}</Text>
            </View>
            <View style={styles.levelInfo}>
              <Text style={styles.levelTitle}>Nivel {profile.level}</Text>
              <Text style={styles.levelCopy}>{profile.total_xp} / {xpNextLevel} XP</Text>
            </View>
          </View>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${xpProgressPercent}%` }]} />
          </View>
        </SurfaceCard>

        <View style={styles.statsGrid}>
          <SurfaceCard variant="secondary" style={styles.statCard}>
            <MaterialIcons name="fitness-center" size={22} color={colors.accent} />
            <Text style={styles.statValue}>{stats?.totalWorkouts ?? 0}</Text>
            <Text style={styles.statLabel}>Entrenos</Text>
          </SurfaceCard>

          <SurfaceCard variant="secondary" style={styles.statCard}>
            <MaterialIcons name="local-fire-department" size={22} color={colors.warning} />
            <Text style={styles.statValue}>{stats?.streak ?? 0}</Text>
            <Text style={styles.statLabel}>Racha</Text>
          </SurfaceCard>

          <SurfaceCard variant="secondary" style={styles.statCard}>
            <MaterialIcons name="emoji-events" size={22} color={colors.success} />
            <Text style={styles.statValue}>{stats?.prs ?? 0}</Text>
            <Text style={styles.statLabel}>Récords</Text>
          </SurfaceCard>
        </View>

        <SurfaceCard style={styles.menuCard}>
          <Text style={styles.menuTitle}>Accesos y espacio personal</Text>

          <View style={styles.menuItem}>
            <View style={styles.menuLeading}>
              <MaterialIcons name="history" size={20} color={colors.textSecondary} />
              <View>
                <Text style={styles.menuItemTitle}>Historial completo</Text>
                <Text style={styles.menuItemSubtitle}>Tu actividad y sesiones registradas.</Text>
              </View>
            </View>
            <Text style={styles.menuBadge}>Próximamente</Text>
          </View>

          <View style={styles.menuItem}>
            <View style={styles.menuLeading}>
              <MaterialIcons name="straighten" size={20} color={colors.textSecondary} />
              <View>
                <Text style={styles.menuItemTitle}>Medidas corporales</Text>
                <Text style={styles.menuItemSubtitle}>Seguimiento visual de cambios y metas.</Text>
              </View>
            </View>
            <Text style={styles.menuBadge}>Próximamente</Text>
          </View>

          <View style={[styles.menuItem, styles.menuItemLast]}>
            <View style={styles.menuLeading}>
              <MaterialIcons name="group" size={20} color={colors.textSecondary} />
              <View>
                <Text style={styles.menuItemTitle}>Red de entrenamiento</Text>
                <Text style={styles.menuItemSubtitle}>Amigos, cuentas vinculadas y comunidad.</Text>
              </View>
            </View>
            <Text style={styles.menuBadge}>Próximamente</Text>
          </View>
        </SurfaceCard>
      </ScrollView>

      <Modal
        visible={editVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <SurfaceCard style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Editar perfil</Text>
              <IconButton icon="close" onPress={() => setEditVisible(false)} />
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              <View style={styles.modalInputBlock}>
                <Text style={styles.modalLabel}>Nombre</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editName}
                  onChangeText={setEditName}
                  placeholder="Tu nombre completo"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.modalInputBlock}>
                <Text style={styles.modalLabel}>Usuario</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editUsername}
                  onChangeText={setEditUsername}
                  placeholder="juan.entrena"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.modalInputBlock}>
                <Text style={styles.modalLabel}>Teléfono</Text>
                <TextInput
                  style={styles.modalInput}
                  value={editPhone}
                  onChangeText={setEditPhone}
                  placeholder="+57 300 000 0000"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.modalInputBlock}>
                <Text style={styles.modalLabel}>Correo electrónico</Text>
                <TextInput
                  style={[styles.modalInput, styles.modalInputDisabled]}
                  value={profile.email}
                  editable={false}
                />
                <Text style={styles.modalHint}>Este campo no se puede editar desde aquí.</Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <PremiumButton
                label="Cancelar"
                variant="ghost"
                size="md"
                onPress={() => setEditVisible(false)}
                style={styles.modalFooterButton}
              />
              <PremiumButton
                label="Guardar cambios"
                icon="check"
                size="md"
                onPress={handleSaveProfile}
                loading={saving}
                style={styles.modalFooterButton}
              />
            </View>
          </SurfaceCard>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centeredState: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  loadingCard: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: 120,
  },
  profileHero: {
    alignItems: 'center',
    borderColor: colors.accentBorder,
  },
  avatarTouch: {
    borderRadius: radii.pill,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 108,
    height: 108,
    borderRadius: 54,
    borderWidth: 3,
    borderColor: colors.accent,
  },
  avatarPlaceholder: {
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 54,
    backgroundColor: 'rgba(0,0,0,0.52)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
  },
  profileHandle: {
    color: colors.textSecondary,
    fontSize: 15,
    marginTop: 4,
  },
  profileMeta: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  editButton: {
    marginTop: spacing.lg,
  },
  levelCard: {
    gap: spacing.md,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  levelOrb: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelNumber: {
    color: colors.onAccent,
    fontSize: 24,
    fontWeight: '900',
  },
  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    color: colors.textPrimary,
    fontSize: 19,
    fontWeight: '800',
  },
  levelCopy: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  progressTrack: {
    height: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 132,
    justifyContent: 'center',
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  menuCard: {
    gap: 0,
  },
  menuTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuItemLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  menuLeading: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    flex: 1,
  },
  menuItemTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  menuItemSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 2,
  },
  menuBadge: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.72)',
    padding: spacing.md,
  },
  modalContent: {
    maxHeight: '88%',
    padding: spacing.xl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  modalForm: {
    flexGrow: 0,
  },
  modalInputBlock: {
    marginBottom: spacing.lg,
  },
  modalLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 15,
    color: colors.textPrimary,
    fontSize: 15,
  },
  modalInputDisabled: {
    opacity: 0.6,
  },
  modalHint: {
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  modalFooterButton: {
    flex: 1,
  },
});

export default ProfileScreen;
