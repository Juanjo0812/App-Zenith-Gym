import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRoutines } from '../context/RoutineContext';
import ScaleTouchable from '../shared/ui/ScaleTouchable';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/theme';

type Props = {
  navigation: any;
};

const WorkoutsScreen = ({ navigation }: Props) => {
  const { routines } = useRoutines();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis entrenos</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ExerciseList')}>
          <MaterialIcons name="search" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Quick Workout Hero */}
        <ScaleTouchable
          style={styles.quickWorkoutCard}
          onPress={() => navigation.navigate('ActiveWorkout', {})}
          pressedScale={0.98}
        >
          <View style={styles.quickWorkoutContent}>
            <View style={styles.quickWorkoutIcon}>
              <MaterialIcons name="flash-on" size={28} color="#FF4500" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.quickWorkoutTitle}>Entreno rápido</Text>
              <Text style={styles.quickWorkoutSubtitle}>Sin plan, empieza ya</Text>
            </View>
            <View style={styles.quickWorkoutArrow}>
              <MaterialIcons name="arrow-forward" size={22} color="#FF4500" />
            </View>
          </View>
          <View style={styles.quickWorkoutGlow} />
        </ScaleTouchable>

        {/* Section header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mis rutinas</Text>
          <ScaleTouchable
            style={styles.createBtn}
            onPress={() => navigation.navigate('CreateRoutine')}
          >
            <MaterialIcons name="add" size={20} color="#FF4500" />
            <Text style={styles.createBtnText}>Nueva</Text>
          </ScaleTouchable>
        </View>

        {/* Routine cards */}
        {routines.map((routine) => {
          const exerciseCount = routine.exercises.length;
          const muscleText = routine.muscleGroups.length > 0
            ? routine.muscleGroups.join(' • ')
            : 'Sin ejercicios';

          return (
            <ScaleTouchable
              key={routine.id}
              style={styles.routineCard}
              onPress={() => navigation.navigate('RoutineDetail', { routineId: routine.id })}
              pressedScale={0.98}
            >
              <View style={styles.cardContent}>
                <View style={styles.cardIcon}>
                  <MaterialIcons name="fitness-center" size={22} color="#FF4500" />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{routine.name}</Text>
                  <Text style={styles.cardMuscles}>{muscleText}</Text>
                  <Text style={styles.cardExerciseCount}>
                    {exerciseCount} {exerciseCount === 1 ? 'ejercicio' : 'ejercicios'}
                  </Text>
                </View>
                <View style={styles.cardActions}>
                  <ScaleTouchable
                    style={styles.playBtn}
                    onPress={() => navigation.navigate('ActiveWorkout', { routineId: routine.id })}
                  >
                    <MaterialIcons name="play-arrow" size={22} color={colors.onAccent} />
                  </ScaleTouchable>
                  <MaterialIcons name="chevron-right" size={24} color="#444" />
                </View>
              </View>
            </ScaleTouchable>
          );
        })}

        {/* Empty state */}
        {routines.length === 0 && (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <MaterialIcons name="fitness-center" size={48} color="#333" />
            </View>
            <Text style={styles.emptyTitle}>No tienes rutinas</Text>
            <Text style={styles.emptySubtitle}>
              Crea tu primera rutina para organizar tus entrenos
            </Text>
            <ScaleTouchable
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('CreateRoutine')}
            >
              <MaterialIcons name="add" size={20} color={colors.onAccent} />
              <Text style={styles.emptyBtnText}>Crear rutina</Text>
            </ScaleTouchable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.chrome,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.accent,
  },
  scrollContent: {
    padding: 20,
    gap: 12,
    paddingBottom: 100,
  },

  // Quick workout card
  quickWorkoutCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.accentBorder,
    overflow: 'hidden',
    marginBottom: 8,
  },
  quickWorkoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
    zIndex: 1,
  },
  quickWorkoutIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickWorkoutTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  quickWorkoutSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
  },
  quickWorkoutArrow: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickWorkoutGlow: {
    position: 'absolute',
    top: -40,
    right: -20,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: colors.accentSoft,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.accentSoft,
  },
  createBtnText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '700',
  },

  // Routine cards
  routineCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 14,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  cardMuscles: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  cardExerciseCount: {
    fontSize: 12,
    color: colors.textMuted,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty state
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  emptySubtitle: {
    color: colors.textMuted,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  emptyBtnText: {
    color: colors.onAccent,
    fontWeight: '800',
    fontSize: 15,
  },
});

export default WorkoutsScreen;
