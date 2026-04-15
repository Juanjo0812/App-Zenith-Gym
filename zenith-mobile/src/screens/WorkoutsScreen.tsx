import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { useRoutines } from '../context/RoutineContext';
import IconButton from '../shared/ui/IconButton';
import PremiumButton from '../shared/ui/PremiumButton';
import ScaleTouchable from '../shared/ui/ScaleTouchable';
import ScreenHeader from '../shared/ui/ScreenHeader';
import StateCard from '../shared/ui/StateCard';
import SurfaceCard from '../shared/ui/SurfaceCard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radii, spacing } from '../theme/theme';

type Props = {
  navigation: any;
};

const WorkoutsScreen = ({ navigation }: Props) => {
  const { routines, isLoading } = useRoutines();

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScreenHeader
        title="Mis entrenos"
        subtitle="Activa una rutina o empieza un entreno libre sin perder ritmo."
        right={(
          <IconButton
            icon="search"
            color={colors.textPrimary}
            onPress={() => navigation.navigate('ExerciseList')}
            accessibilityLabel="Buscar ejercicios"
          />
        )}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ScaleTouchable
          style={styles.heroTouch}
          onPress={() => navigation.navigate('ActiveWorkout', {})}
          variant="card"
        >
          <SurfaceCard variant="secondary" style={styles.heroCard}>
            <View style={styles.heroContent}>
              <View style={styles.heroIcon}>
                <MaterialIcons name="flash-on" size={28} color={colors.accent} />
              </View>

              <View style={styles.heroCopy}>
                <Text style={styles.heroEyebrow}>Acceso inmediato</Text>
                <Text style={styles.heroTitle}>Entreno rápido</Text>
                <Text style={styles.heroSubtitle}>
                  Empieza en segundos y registra tu sesión sin preparar una rutina.
                </Text>
              </View>

              <View style={styles.heroActionRail}>
                <View style={styles.heroActionGlow} />
                <View style={styles.heroMiniLabel}>
                  <Text style={styles.heroMiniLabelText}>Ahora</Text>
                </View>
                <View style={styles.heroArrow}>
                  <MaterialIcons name="arrow-forward" size={22} color={colors.onAccent} />
                </View>
              </View>
            </View>
          </SurfaceCard>
        </ScaleTouchable>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Mis rutinas</Text>
            <Text style={styles.sectionSubtitle}>Tus accesos directos para entrenar con más fluidez.</Text>
          </View>
          <PremiumButton
            label="Nueva"
            icon="add"
            variant="secondary"
            size="sm"
            onPress={() => navigation.navigate('CreateRoutine')}
          />
        </View>

        {isLoading ? (
          <SurfaceCard style={styles.loadingCard}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={styles.loadingTitle}>Cargando rutinas</Text>
            <Text style={styles.loadingText}>Estamos preparando tu biblioteca de entrenos.</Text>
          </SurfaceCard>
        ) : null}

        {!isLoading &&
          routines.map((routine) => {
            const exerciseCount = routine.exercises.length;
            const muscleText =
              routine.muscleGroups.length > 0
                ? routine.muscleGroups.join(' • ')
                : 'Lista lista para personalizar';

            return (
              <ScaleTouchable
                key={routine.id}
                style={styles.routineTouchable}
                onPress={() => navigation.navigate('RoutineDetail', { routineId: routine.id })}
                variant="card"
              >
                <SurfaceCard style={styles.routineCard}>
                  <View style={styles.routineRow}>
                    <View style={styles.routineIcon}>
                      <MaterialIcons name="fitness-center" size={20} color={colors.accent} />
                    </View>

                    <View style={styles.routineInfo}>
                      <Text style={styles.routineName}>{routine.name}</Text>
                      <Text style={styles.routineMuscles} numberOfLines={1}>
                        {muscleText}
                      </Text>
                      <Text style={styles.routineMeta}>
                        {exerciseCount} {exerciseCount === 1 ? 'ejercicio' : 'ejercicios'} · Lista para empezar
                      </Text>
                    </View>

                    <View style={styles.routineActionRail}>
                      <PremiumButton
                        label="Iniciar"
                        icon="play-arrow"
                        size="sm"
                        onPress={() => navigation.navigate('ActiveWorkout', { routineId: routine.id })}
                        style={styles.routineStartButton}
                      />
                    </View>
                  </View>
                </SurfaceCard>
              </ScaleTouchable>
            );
          })}

        {!isLoading && routines.length === 0 ? (
          <StateCard
            icon="fitness-center"
            title="Todavía no tienes rutinas"
            description="Crea tu primera rutina para entrar, tocar una sola vez y empezar a entrenar con más control."
            actionLabel="Crear rutina"
            onActionPress={() => navigation.navigate('CreateRoutine')}
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: 120,
  },
  heroTouch: {
    borderRadius: radii.xl,
  },
  heroCard: {
    overflow: 'hidden',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderColor: colors.accentBorder,
    backgroundColor: colors.surface,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  heroIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  heroCopy: {
    flex: 1,
    gap: 3,
    paddingTop: 2,
  },
  heroEyebrow: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  heroTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  heroActionRail: {
    width: 92,
    minHeight: 94,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 10,
    position: 'relative',
    paddingTop: 4,
  },
  heroActionGlow: {
    position: 'absolute',
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    top: 28,
  },
  heroMiniLabel: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    zIndex: 1,
  },
  heroMiniLabelText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  heroArrow: {
    width: 48,
    height: 48,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  loadingCard: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  routineTouchable: {
    borderRadius: radii.lg,
  },
  routineCard: {
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  routineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  routineIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routineInfo: {
    flex: 1,
    gap: 2,
  },
  routineName: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  routineMuscles: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  routineMeta: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  routineActionRail: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  routineStartButton: {
    minWidth: 110,
  },
});

export default WorkoutsScreen;
