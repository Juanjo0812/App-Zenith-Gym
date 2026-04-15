import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { RootStackParamList } from '../navigation/AppNavigator';
import { classesApi, ScheduledClass } from '../features/classes/api/classesApi';
import PremiumButton from '../shared/ui/PremiumButton';
import ScreenHeader from '../shared/ui/ScreenHeader';
import StateBanner from '../shared/ui/StateBanner';
import StateCard from '../shared/ui/StateCard';
import SurfaceCard from '../shared/ui/SurfaceCard';
import {
  getXpForNextLevel,
  getXpProgress,
  userService,
  UserDashboard,
  UserProfile,
} from '../services/userService';
import { colors, radii, spacing } from '../theme/theme';

type Props = BottomTabScreenProps<any, 'Home'>;

const HomeScreen = ({ navigation }: Props) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dashboard, setDashboard] = useState<UserDashboard | null>(null);
  const [upcomingClasses, setUpcomingClasses] = useState<ScheduledClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [classNotice, setClassNotice] = useState('');

  const stackNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const loadData = useCallback(async () => {
    setErrorMessage('');
    setClassNotice('');

    try {
      const [profileData, dashboardData] = await Promise.all([
        userService.getProfile(),
        userService.getDashboard(),
      ]);
      setProfile(profileData);
      setDashboard(dashboardData);

      try {
        const today = new Date();
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + 2);
        const from = today.toISOString().split('T')[0];
        const to = endDate.toISOString().split('T')[0];
        const classes = await classesApi.getSchedule(from, to);
        setUpcomingClasses(classes.filter((classItem) => !classItem.is_cancelled).slice(0, 3));
      } catch {
        setClassNotice('No pudimos cargar las clases por ahora. Puedes abrir el calendario para reintentar.');
      }
    } catch (err) {
      console.error('Error cargando datos del inicio:', err);
      setErrorMessage('No pudimos cargar tu resumen. Reintenta para recuperar tu panel.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const xpNextLevel = profile ? getXpForNextLevel(profile.level) : 0;
  const xpProgressPercent = profile ? getXpProgress(profile.total_xp, profile.level) : 0;

  if (loading && !profile) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <ScreenHeader title="Inicio" subtitle="Tu resumen de hoy" />
        <View style={styles.centeredState}>
          <SurfaceCard style={styles.loadingCard}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={styles.loadingTitle}>Preparando tu panel</Text>
            <Text style={styles.loadingText}>Estamos organizando tus métricas, clases y atajos del día.</Text>
          </SurfaceCard>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <ScreenHeader title="Inicio" subtitle="Tu resumen de hoy" />
        <View style={styles.centeredState}>
          <StateCard
            icon="dashboard"
            title="Tu panel no está disponible"
            description={errorMessage || 'No pudimos cargar tu información en este momento.'}
            actionLabel="Reintentar"
            onActionPress={loadData}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScreenHeader title="Inicio" subtitle="Tu resumen de hoy" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <SurfaceCard variant="secondary" style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroGreeting}>Hola,</Text>
              <Text style={styles.heroName}>{profile.username || profile.name}</Text>
            </View>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeLabel}>Nivel</Text>
              <Text style={styles.levelBadgeValue}>{profile.level}</Text>
            </View>
          </View>

          <Text style={styles.heroHint}>
            {dashboard?.lastWorkout
              ? `Último entreno: ${dashboard.lastWorkout.name}. Mantén el ritmo y suma otra sesión hoy.`
              : 'Todavía no registras entrenos. Empieza hoy para activar tu progreso.'}
          </Text>
        </SurfaceCard>

        {errorMessage ? (
          <StateBanner message={errorMessage} variant="error" actionLabel="Reintentar" onActionPress={loadData} />
        ) : null}

        {classNotice ? (
          <StateBanner
            message={classNotice}
            variant="info"
            actionLabel="Ver clases"
            onActionPress={() => stackNavigation.navigate('Classes')}
          />
        ) : null}

        <SurfaceCard style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Progreso de nivel</Text>
            <Text style={styles.cardValue}>{profile.total_xp} / {xpNextLevel} XP</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${xpProgressPercent}%` }]} />
          </View>
        </SurfaceCard>

        <TouchableOpacity
          style={styles.touchableCard}
          onPress={() => navigation.navigate('Nutrition')}
          activeOpacity={0.85}
        >
          <SurfaceCard variant="secondary" style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.inlineHeader}>
                <MaterialIcons name="restaurant" size={20} color={colors.success} />
                <Text style={styles.cardTitle}>Nutrición de hoy</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color={colors.textSecondary} />
            </View>
            <Text style={styles.cardBodyText}>
              {dashboard?.todayCalories.target
                ? `${dashboard.todayCalories.consumed} kcal registradas de ${dashboard.todayCalories.target} kcal.`
                : 'Activa tu meta diaria para empezar a registrar tu alimentación.'}
            </Text>
          </SurfaceCard>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.touchableCard}
          onPress={() => stackNavigation.navigate('Classes')}
          activeOpacity={0.85}
        >
          <SurfaceCard style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.inlineHeader}>
                <MaterialIcons name="event" size={20} color={colors.accent} />
                <Text style={styles.cardTitle}>Clases grupales</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color={colors.textSecondary} />
            </View>

            {upcomingClasses.length > 0 ? (
              <View style={styles.classList}>
                {upcomingClasses.map((classItem) => (
                  <View key={classItem.id} style={styles.classItem}>
                    <View
                      style={[
                        styles.classDot,
                        {
                          backgroundColor: classItem.class_type.color,
                        },
                      ]}
                    />
                    <View style={styles.classInfo}>
                      <Text style={styles.className}>{classItem.class_type.name}</Text>
                      <Text style={styles.classMeta}>
                        {classItem.scheduled_date} · {classItem.start_time} - {classItem.end_time}
                      </Text>
                    </View>
                    <Text style={styles.classCount}>
                      {classItem.enrolled_count}/{classItem.max_capacity}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.cardBodyText}>
                Aún no hay clases visibles en este rango. Abre el calendario para consultar toda la agenda.
              </Text>
            )}
          </SurfaceCard>
        </TouchableOpacity>

        <View style={styles.grid}>
          <SurfaceCard variant="secondary" style={styles.gridCard}>
            <MaterialIcons name="history" size={22} color={colors.textSecondary} />
            <Text style={styles.gridValue}>{dashboard?.lastWorkout?.date ?? 'Sin datos'}</Text>
            <Text style={styles.gridLabel}>{dashboard?.lastWorkout?.name ?? 'Sin entrenos aún'}</Text>
          </SurfaceCard>

          <SurfaceCard variant="secondary" style={styles.gridCard}>
            <MaterialIcons name="bolt" size={22} color={colors.accent} />
            <Text style={styles.gridValue}>{dashboard?.weeklyCount ?? 0}</Text>
            <Text style={styles.gridLabel}>Entrenos esta semana</Text>
          </SurfaceCard>
        </View>

        <SurfaceCard style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.inlineHeader}>
              <MaterialIcons name="auto-awesome" size={20} color={colors.accent} />
              <Text style={styles.cardTitle}>Entrenador Zenith</Text>
            </View>
          </View>
          <Text style={styles.cardBodyText}>
            {dashboard?.lastWorkout
              ? `Tu último entreno fue ${dashboard.lastWorkout.date.toLowerCase()}. Sigue con esa constancia y pide una recomendación a tu entrenador.`
              : 'Empieza tu primera sesión y luego usa el entrenador para afinar técnica, progresión y recuperación.'}
          </Text>
          <PremiumButton
            label="Abrir entrenador"
            icon="arrow-forward"
            variant="secondary"
            size="sm"
            onPress={() => navigation.navigate('AICoach')}
            style={styles.coachButton}
          />
        </SurfaceCard>
      </ScrollView>
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
  heroCard: {
    borderColor: colors.accentBorder,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  heroGreeting: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  heroName: {
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: '800',
    marginTop: 2,
  },
  heroHint: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing.md,
  },
  levelBadge: {
    minWidth: 76,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    backgroundColor: colors.accent,
    alignItems: 'center',
  },
  levelBadgeLabel: {
    color: colors.onAccent,
    fontSize: 11,
    fontWeight: '700',
  },
  levelBadgeValue: {
    color: colors.onAccent,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 26,
  },
  touchableCard: {
    borderRadius: radii.lg,
  },
  card: {
    gap: spacing.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  inlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  cardValue: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  cardBodyText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  progressTrack: {
    height: 10,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: radii.pill,
  },
  classList: {
    gap: spacing.sm,
  },
  classItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  classDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  classInfo: {
    flex: 1,
  },
  className: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  classMeta: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  classCount: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  gridCard: {
    flex: 1,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  gridValue: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
  },
  gridLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  coachButton: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
  },
});

export default HomeScreen;
