import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { workoutApi, Exercise, CompleteSessionResponse } from '../features/workouts/api/workoutApi';
import { useRoutines } from '../context/RoutineContext';
import { useFeedbackToast } from '../shared/ui/FeedbackToast';
import IconButton from '../shared/ui/IconButton';
import PremiumButton from '../shared/ui/PremiumButton';
import ScaleTouchable from '../shared/ui/ScaleTouchable';
import StateCard from '../shared/ui/StateCard';
import SurfaceCard from '../shared/ui/SurfaceCard';
import { triggerHaptic } from '../shared/lib/haptics';
import RestTimerOverlay from '../shared/ui/RestTimerOverlay';
import WorkoutTimer from '../shared/ui/WorkoutTimer';
import { colors, getInsetBottomPadding, radii, spacing } from '../theme/theme';

interface SetEntry {
  reps: string;
  weight: string;
  logged: boolean;
  setId?: string;
}

interface ExerciseBlock {
  exercise: Exercise;
  sets: SetEntry[];
}

interface Props {
  navigation: any;
  route: any;
}

const DEFAULT_REST_SECONDS = 90;

const ActiveWorkoutScreen = ({ navigation, route }: Props) => {
  const insets = useSafeAreaInsets();
  const routineId: string | undefined = route.params?.routineId;
  const { getRoutineById } = useRoutines();
  const { showToast } = useFeedbackToast();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [exerciseBlocks, setExerciseBlocks] = useState<ExerciseBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restDuration, setRestDuration] = useState(DEFAULT_REST_SECONDS);
  const [errorMessage, setErrorMessage] = useState('');

  const isQuickWorkout = !routineId;

  const initSession = async () => {
    setLoading(true);
    setErrorMessage('');

    try {
      const res = await workoutApi.startSession(routineId);
      setSessionId(res.session_id);

      if (routineId) {
        const routine = getRoutineById(routineId);
        if (routine && routine.exercises.length > 0) {
          const blocks: ExerciseBlock[] = routine.exercises.map((routineExercise) => ({
            exercise: {
              id: routineExercise.exerciseId,
              name: routineExercise.name,
              primary_muscle: '',
              secondary_muscles: [],
              equipment: null,
              difficulty: null,
              instructions: null,
              video_url: null,
            },
            sets: routineExercise.sets.map((set) => ({
              reps: set.reps.toString(),
              weight: set.weight.toString(),
              logged: false,
            })),
          }));
          setExerciseBlocks(blocks);
        }
      }

      setTimerRunning(true);
    } catch (err) {
      console.error(err);
      setErrorMessage('No pudimos iniciar la sesión. Revisa tu conexión y vuelve a intentarlo.');
      triggerHaptic('error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initSession();
  }, []);

  useEffect(() => {
    const addExercise: Exercise | undefined = route.params?.addExercise;
    if (addExercise) {
      const alreadyAdded = exerciseBlocks.some((block) => block.exercise.id === addExercise.id);
      if (!alreadyAdded) {
        setExerciseBlocks((prev) => [
          ...prev,
          { exercise: addExercise, sets: [{ reps: '', weight: '', logged: false }] },
        ]);
        showToast({
          title: 'Ejercicio añadido',
          message: `${addExercise.name} ya está listo para registrar series.`,
          variant: 'success',
        });
      }
      navigation.setParams({ addExercise: undefined });
    }
  }, [exerciseBlocks, navigation, route.params?.addExercise, showToast]);

  const addSet = (blockIdx: number) => {
    setExerciseBlocks((prev) => {
      const updated = [...prev];
      const lastSet = updated[blockIdx].sets[updated[blockIdx].sets.length - 1];
      updated[blockIdx] = {
        ...updated[blockIdx],
        sets: [
          ...updated[blockIdx].sets,
          {
            reps: lastSet?.reps || '',
            weight: lastSet?.weight || '',
            logged: false,
          },
        ],
      };
      return updated;
    });
    triggerHaptic('selection');
  };

  const removeSet = (blockIdx: number, setIdx: number) => {
    setExerciseBlocks((prev) => {
      const updated = [...prev];
      const sets = updated[blockIdx].sets.filter((_, index) => index !== setIdx);
      if (sets.length === 0) return prev;
      updated[blockIdx] = { ...updated[blockIdx], sets };
      return updated;
    });
  };

  const updateSet = (blockIdx: number, setIdx: number, field: 'reps' | 'weight', value: string) => {
    setExerciseBlocks((prev) => {
      const updated = [...prev];
      const sets = [...updated[blockIdx].sets];
      sets[setIdx] = { ...sets[setIdx], [field]: value };
      updated[blockIdx] = { ...updated[blockIdx], sets };
      return updated;
    });
  };

  const logSet = async (blockIdx: number, setIdx: number) => {
    if (!sessionId) return;

    const block = exerciseBlocks[blockIdx];
    const set = block.sets[setIdx];
    const reps = parseInt(set.reps, 10);
    const weight = parseFloat(set.weight);

    if (Number.isNaN(reps) || Number.isNaN(weight) || reps <= 0 || weight < 0) {
      showToast({
        title: 'Serie incompleta',
        message: 'Ingresa repeticiones válidas y un peso igual o mayor que cero.',
        variant: 'error',
      });
      return;
    }

    try {
      const res = await workoutApi.logSet(sessionId, block.exercise.id, {
        reps,
        weight_kg: weight,
        rest_seconds: restDuration,
      });

      setExerciseBlocks((prev) => {
        const updated = [...prev];
        const sets = [...updated[blockIdx].sets];
        sets[setIdx] = { ...sets[setIdx], logged: true, setId: res.set_id };
        updated[blockIdx] = { ...updated[blockIdx], sets };
        return updated;
      });

      setShowRestTimer(true);
      showToast({
        title: 'Serie guardada',
        message: `${block.exercise.name} quedó registrada y el descanso empezó.`,
        variant: 'success',
      });
    } catch (err) {
      console.error(err);
      showToast({
        title: 'No pudimos guardar la serie',
        message: 'Reintenta en unos segundos.',
        variant: 'error',
      });
    }
  };

  const removeExercise = (blockIdx: number) => {
    const block = exerciseBlocks[blockIdx];
    Alert.alert(
      'Eliminar ejercicio',
      `¿Quitar "${block.exercise.name}" del entreno actual?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setExerciseBlocks((prev) => prev.filter((_, index) => index !== blockIdx));
          },
        },
      ]
    );
  };

  const handleComplete = async () => {
    if (!sessionId) return;

    const totalSetsLogged = exerciseBlocks.reduce(
      (sum, block) => sum + block.sets.filter((set) => set.logged).length,
      0
    );

    if (totalSetsLogged === 0) {
      showToast({
        title: 'Falta registrar una serie',
        message: 'Guarda al menos una serie antes de completar el entreno.',
        variant: 'error',
      });
      return;
    }

    setCompleting(true);
    setTimerRunning(false);
    try {
      const result: CompleteSessionResponse = await workoutApi.completeSession(sessionId);
      showToast({
        title: result.leveled_up ? 'Subiste de nivel' : 'Entreno completado',
        message: `+${result.xp_earned} XP · Nivel ${result.new_level}`,
        variant: 'success',
      });
      await triggerHaptic('success');
      setTimeout(() => navigation.goBack(), 900);
    } catch (err) {
      console.error(err);
      showToast({
        title: 'No pudimos completar la sesión',
        message: 'Tu entreno sigue abierto. Reintenta sin cerrar la pantalla.',
        variant: 'error',
      });
      setTimerRunning(true);
    } finally {
      setCompleting(false);
    }
  };

  const handleAddExercise = () => {
    navigation.navigate('ExerciseList', { sessionId });
  };

  const handleCloseWorkout = () => {
    const totalSetsLogged = exerciseBlocks.reduce(
      (sum, block) => sum + block.sets.filter((set) => set.logged).length,
      0
    );

    if (totalSetsLogged > 0) {
      Alert.alert(
        'Descartar entreno',
        'Si sales ahora perderás los cambios que aún no se hayan completado.',
        [
          { text: 'Seguir entrenando', style: 'cancel' },
          { text: 'Descartar', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  const totalSetsLogged = exerciseBlocks.reduce(
    (sum, block) => sum + block.sets.filter((set) => set.logged).length,
    0
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <IconButton icon="close" onPress={handleCloseWorkout} />
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{isQuickWorkout ? 'Entreno rápido' : 'Entreno activo'}</Text>
            <Text style={styles.headerSubtitle}>Preparando tu sesión</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centeredState}>
          <SurfaceCard style={styles.loadingCard}>
            <ActivityIndicator size="small" color={colors.accent} />
            <Text style={styles.loadingTitle}>Iniciando la sesión</Text>
            <Text style={styles.loadingText}>Estamos conectando tu entreno para que puedas registrar series.</Text>
          </SurfaceCard>
        </View>
      </SafeAreaView>
    );
  }

  if (errorMessage) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <IconButton icon="close" onPress={() => navigation.goBack()} />
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{isQuickWorkout ? 'Entreno rápido' : 'Entreno activo'}</Text>
            <Text style={styles.headerSubtitle}>No pudimos iniciar la sesión</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.centeredState}>
          <StateCard
            icon="error-outline"
            title="No pudimos abrir el entreno"
            description={errorMessage}
            actionLabel="Reintentar"
            onActionPress={initSession}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <IconButton icon="close" onPress={handleCloseWorkout} accessibilityLabel="Cerrar entreno" />
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{isQuickWorkout ? 'Entreno rápido' : 'Entreno activo'}</Text>
          <WorkoutTimer running={timerRunning} />
        </View>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>En curso</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {showRestTimer ? (
          <RestTimerOverlay
            durationSeconds={restDuration}
            onComplete={() => {
              setShowRestTimer(false);
              showToast({
                title: 'Descanso terminado',
                message: 'Ya puedes continuar con la siguiente serie.',
                variant: 'info',
              });
            }}
            onSkip={() => setShowRestTimer(false)}
            onAdjust={(duration) => setRestDuration(duration)}
          />
        ) : null}

        {exerciseBlocks.length === 0 ? (
          <StateCard
            icon="fitness-center"
            title="Agrega un ejercicio para empezar"
            description="Usa el acceso inferior para buscar un ejercicio y registrar tu primera serie."
            actionLabel="Buscar ejercicio"
            onActionPress={handleAddExercise}
          />
        ) : (
          exerciseBlocks.map((block, blockIdx) => {
            const completedSets = block.sets.filter((set) => set.logged).length;
            const totalSets = block.sets.length;

            return (
              <SurfaceCard key={`${block.exercise.id}-${blockIdx}`} style={styles.exerciseCard}>
                <View style={styles.exerciseHeader}>
                  <View style={styles.exerciseHeaderCopy}>
                    <Text style={styles.exerciseName}>{block.exercise.name}</Text>
                    {block.exercise.primary_muscle ? (
                      <Text style={styles.exerciseMuscle}>{block.exercise.primary_muscle}</Text>
                    ) : null}
                  </View>

                  <View style={styles.exerciseHeaderActions}>
                    <View style={styles.progressPill}>
                      <Text style={styles.progressPillText}>{completedSets}/{totalSets}</Text>
                    </View>
                    <IconButton
                      icon="close"
                      color={colors.accent}
                      onPress={() => removeExercise(blockIdx)}
                      accessibilityLabel={`Eliminar ${block.exercise.name}`}
                    />
                  </View>
                </View>

                <View style={styles.tableHead}>
                  <Text style={[styles.tableHeadText, styles.indexColumn]}>Serie</Text>
                  <Text style={styles.tableHeadText}>kg</Text>
                  <Text style={styles.tableHeadText}>Reps</Text>
                  <Text style={[styles.tableHeadText, styles.saveColumn]}>Guardar</Text>
                </View>

                {block.sets.map((set, setIdx) => (
                  <View key={setIdx} style={[styles.tableRow, set.logged && styles.tableRowLogged]}>
                    <View style={[styles.indexPill, styles.indexColumn]}>
                      <Text style={styles.indexText}>{setIdx + 1}</Text>
                    </View>

                    <TextInput
                      style={[styles.cellInput, set.logged && styles.cellInputLogged]}
                      value={set.weight}
                      onChangeText={(value) => updateSet(blockIdx, setIdx, 'weight', value)}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={colors.textMuted}
                      editable={!set.logged}
                    />

                    <TextInput
                      style={[styles.cellInput, set.logged && styles.cellInputLogged]}
                      value={set.reps}
                      onChangeText={(value) => updateSet(blockIdx, setIdx, 'reps', value)}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={colors.textMuted}
                      editable={!set.logged}
                    />

                    <View style={styles.saveColumn}>
                      <ScaleTouchable
                        style={[styles.saveSetButton, set.logged && styles.saveSetButtonDone]}
                        onPress={() => !set.logged && logSet(blockIdx, setIdx)}
                        disabled={set.logged}
                        variant="button"
                      >
                        <MaterialIcons
                          name={set.logged ? 'check' : 'save'}
                          size={16}
                          color={set.logged ? colors.onAccent : colors.textPrimary}
                        />
                      </ScaleTouchable>
                    </View>

                    {!set.logged && block.sets.length > 1 ? (
                      <ScaleTouchable
                        style={styles.removeSetButton}
                        onPress={() => removeSet(blockIdx, setIdx)}
                        variant="icon"
                      >
                        <MaterialIcons name="remove" size={14} color={colors.textSecondary} />
                      </ScaleTouchable>
                    ) : null}
                  </View>
                ))}

                <PremiumButton
                  label="Añadir serie"
                  icon="add"
                  variant="ghost"
                  size="sm"
                  onPress={() => addSet(blockIdx)}
                  style={styles.addSetButton}
                />
              </SurfaceCard>
            );
          })
        )}
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: getInsetBottomPadding(16, insets.bottom) }]}>
        <PremiumButton
          label="Ejercicio"
          icon="add-circle-outline"
          variant="secondary"
          onPress={handleAddExercise}
          style={styles.bottomButton}
        />
        <PremiumButton
          label={completing ? 'Completando...' : 'Completar'}
          icon="check-circle"
          onPress={handleComplete}
          disabled={completing}
          loading={completing}
          style={styles.bottomButton}
        />
      </View>
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.chrome,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 2,
    paddingTop: 2,
  },
  headerTitle: {
    color: colors.accent,
    fontSize: 20,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  headerSpacer: {
    width: 44,
  },
  livePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    borderRadius: radii.pill,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    marginTop: 2,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  liveText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
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
    lineHeight: 22,
    textAlign: 'center',
  },
  scrollContent: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: 120,
  },
  exerciseCard: {
    gap: 14,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  exerciseHeaderCopy: {
    flex: 1,
    gap: 4,
  },
  exerciseName: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
  },
  exerciseMuscle: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  exerciseHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  progressPillText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '800',
  },
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: 6,
  },
  tableHeadText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  indexColumn: {
    flex: 0.7,
  },
  saveColumn: {
    flex: 0.9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  tableRowLogged: {
    backgroundColor: 'rgba(0,230,118,0.06)',
    borderColor: 'rgba(0,230,118,0.22)',
  },
  indexPill: {
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  cellInput: {
    flex: 1,
    minHeight: 42,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    textAlign: 'center',
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    paddingHorizontal: spacing.xs,
  },
  cellInputLogged: {
    backgroundColor: 'rgba(0,230,118,0.12)',
    borderColor: 'rgba(0,230,118,0.42)',
    color: colors.textPrimary,
  },
  saveSetButton: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.accentSoft,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveSetButtonDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  removeSetButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addSetButton: {
    marginTop: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    backgroundColor: colors.chrome,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bottomButton: {
    flex: 1,
  },
});

export default ActiveWorkoutScreen;
