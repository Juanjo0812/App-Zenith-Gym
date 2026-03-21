import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, ScrollView,
  TouchableOpacity, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { workoutApi, Exercise, CompleteSessionResponse } from '../features/workouts/api/workoutApi';
import { useRoutines } from '../context/RoutineContext';
import ScaleTouchable from '../shared/ui/ScaleTouchable';
import RestTimerOverlay from '../shared/ui/RestTimerOverlay';
import WorkoutTimer from '../shared/ui/WorkoutTimer';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, getInsetBottomPadding } from '../theme/theme';

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

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [exerciseBlocks, setExerciseBlocks] = useState<ExerciseBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);

  // Rest timer state
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [restDuration, setRestDuration] = useState(DEFAULT_REST_SECONDS);

  const isQuickWorkout = !routineId;

  // Start session and pre-load routine exercises
  useEffect(() => {
    const initSession = async () => {
      try {
        const res = await workoutApi.startSession(routineId);
        setSessionId(res.session_id);

        // Pre-load exercises from routine
        if (routineId) {
          const routine = getRoutineById(routineId);
          if (routine && routine.exercises.length > 0) {
            const blocks: ExerciseBlock[] = routine.exercises.map((re) => ({
              exercise: {
                id: re.exerciseId,
                name: re.name,
                primary_muscle: '', // Not critical for active workout display
                secondary_muscles: [],
                equipment: null,
                difficulty: null,
                instructions: null,
                video_url: null,
              },
              sets: re.sets.map((s) => ({
                reps: s.reps.toString(),
                weight: s.weight.toString(),
                logged: false,
              })),
            }));
            setExerciseBlocks(blocks);
          }
        }

        setTimerRunning(true);
      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'No se pudo iniciar la sesión. Verifica tu conexión.');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    initSession();
  }, []);

  // Listen for exercise additions from ExercisePicker
  useEffect(() => {
    const addExercise: Exercise | undefined = route.params?.addExercise;
    if (addExercise) {
      const alreadyAdded = exerciseBlocks.some((b) => b.exercise.id === addExercise.id);
      if (!alreadyAdded) {
        setExerciseBlocks((prev) => [
          ...prev,
          { exercise: addExercise, sets: [{ reps: '', weight: '', logged: false }] },
        ]);
      }
      navigation.setParams({ addExercise: undefined });
    }
  }, [route.params?.addExercise]);

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
  };

  const removeSet = (blockIdx: number, setIdx: number) => {
    setExerciseBlocks((prev) => {
      const updated = [...prev];
      const sets = updated[blockIdx].sets.filter((_, i) => i !== setIdx);
      if (sets.length === 0) return prev; // Don't allow removing all sets
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

    if (isNaN(reps) || isNaN(weight) || reps <= 0 || weight < 0) {
      Alert.alert('Datos inválidos', 'Ingresa valores válidos para reps y peso.');
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

      // Show rest timer after logging a set
      setShowRestTimer(true);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo registrar el set.');
    }
  };

  const removeExercise = (blockIdx: number) => {
    const block = exerciseBlocks[blockIdx];
    Alert.alert(
      'Eliminar ejercicio',
      `¿Quitar "${block.exercise.name}" del entreno?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setExerciseBlocks((prev) => prev.filter((_, i) => i !== blockIdx));
          },
        },
      ],
    );
  };

  const handleComplete = async () => {
    if (!sessionId) return;

    const totalSetsLogged = exerciseBlocks.reduce(
      (sum, b) => sum + b.sets.filter((s) => s.logged).length,
      0,
    );
    if (totalSetsLogged === 0) {
      Alert.alert('¡Alto!', 'Registra al menos un set antes de completar el entrenamiento.');
      return;
    }

    setCompleting(true);
    setTimerRunning(false);
    try {
      const result: CompleteSessionResponse = await workoutApi.completeSession(sessionId);
      Alert.alert(
        result.leveled_up ? '🎉 ¡LEVEL UP!' : '⚡ ¡Entrenamiento completo!',
        `XP ganada: +${result.xp_earned}\nXP total: ${result.new_total_xp}\nNivel: ${result.new_level}`,
        [{ text: '¡Genial!', onPress: () => navigation.goBack() }],
      );
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo completar la sesión.');
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
      (sum, b) => sum + b.sets.filter((s) => s.logged).length,
      0,
    );
    if (totalSetsLogged > 0) {
      Alert.alert(
        'Descartar entreno',
        '¿Seguro que quieres salir? Perderás los sets no guardados.',
        [
          { text: 'Continuar entreno', style: 'cancel' },
          { text: 'Descartar', style: 'destructive', onPress: () => navigation.goBack() },
        ],
      );
    } else {
      navigation.goBack();
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color={colors.accent} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  const totalSetsLogged = exerciseBlocks.reduce(
    (sum, b) => sum + b.sets.filter((s) => s.logged).length,
    0,
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCloseWorkout}>
          <MaterialIcons name="close" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>
            {isQuickWorkout ? 'Entreno rápido' : 'Entreno activo'}
          </Text>
          <WorkoutTimer running={timerRunning} />
        </View>
        <View style={styles.sessionBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.sessionText}>EN VIVO</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Rest Timer */}
        {showRestTimer && (
          <RestTimerOverlay
            durationSeconds={restDuration}
            onComplete={() => setShowRestTimer(false)}
            onSkip={() => setShowRestTimer(false)}
            onAdjust={(d) => setRestDuration(d)}
          />
        )}

        {exerciseBlocks.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="fitness-center" size={48} color="#333" />
            <Text style={styles.emptyTitle}>Agrega un ejercicio para comenzar</Text>
            <Text style={styles.emptySubtitle}>
              Presiona el botón de abajo para buscar en tu librería
            </Text>
          </View>
        ) : (
          exerciseBlocks.map((block, blockIdx) => {
            const completedSets = block.sets.filter((s) => s.logged).length;
            const totalSets = block.sets.length;

            return (
              <View key={`${block.exercise.id}-${blockIdx}`} style={styles.exerciseCard}>
                <View style={styles.exerciseHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exerciseName}>{block.exercise.name}</Text>
                    {block.exercise.primary_muscle ? (
                      <Text style={styles.muscleLabel}>{block.exercise.primary_muscle}</Text>
                    ) : null}
                  </View>
                  <View style={styles.exerciseHeaderRight}>
                    <Text style={styles.setsProgress}>{completedSets}/{totalSets}</Text>
                    <TouchableOpacity onPress={() => removeExercise(blockIdx)} style={styles.removeBtn}>
                      <MaterialIcons name="close" size={18} color="#FF4500" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Sets Table */}
                <View style={styles.setsTable}>
                  <View style={styles.tableHead}>
                    <Text style={[styles.thText, { flex: 0.5 }]}>Set</Text>
                    <Text style={styles.thText}>kg</Text>
                    <Text style={styles.thText}>Reps</Text>
                    <Text style={[styles.thText, { flex: 0.6 }]}>✓</Text>
                  </View>

                  {block.sets.map((set, setIdx) => (
                    <View key={setIdx} style={styles.tableRow}>
                      <Text style={[styles.cellText, { flex: 0.5 }]}>{setIdx + 1}</Text>
                      <TextInput
                        style={[styles.cellInput, set.logged && styles.cellInputLogged]}
                        value={set.weight}
                        onChangeText={(v) => updateSet(blockIdx, setIdx, 'weight', v)}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor="#555"
                        editable={!set.logged}
                      />
                      <TextInput
                        style={[styles.cellInput, set.logged && styles.cellInputLogged]}
                        value={set.reps}
                        onChangeText={(v) => updateSet(blockIdx, setIdx, 'reps', v)}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor="#555"
                        editable={!set.logged}
                      />
                      <TouchableOpacity
                        style={[styles.checkBtn, set.logged && styles.checkBtnDone]}
                        onPress={() => !set.logged && logSet(blockIdx, setIdx)}
                        disabled={set.logged}
                      >
                        <MaterialIcons
                          name={set.logged ? 'check' : 'save'}
                          size={16}
                          color={set.logged ? colors.onAccent : colors.textPrimary}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>

                <TouchableOpacity style={styles.addSetBtn} onPress={() => addSet(blockIdx)}>
                  <MaterialIcons name="add" size={16} color="#FF4500" />
                  <Text style={styles.addSetText}>Añadir serie</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Bottom Bar */}
      <View style={[styles.bottomBar, { paddingBottom: getInsetBottomPadding(16, insets.bottom) }]}>
        <ScaleTouchable style={styles.addExerciseBtn} onPress={handleAddExercise}>
          <MaterialIcons name="add-circle-outline" size={20} color="#FF4500" />
          <Text style={styles.addExerciseBtnText}>Ejercicio</Text>
        </ScaleTouchable>

        <ScaleTouchable
          style={[styles.completeBtn, completing && { opacity: 0.5 }]}
          onPress={handleComplete}
          disabled={completing}
        >
          {completing ? (
            <ActivityIndicator size="small" color={colors.onAccent} />
          ) : (
            <>
              <Text style={styles.completeBtnText}>Completar</Text>
              <MaterialIcons name="check-circle" size={20} color={colors.onAccent} />
            </>
          )}
        </ScaleTouchable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: colors.chrome, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerCenter: { alignItems: 'center', gap: 2 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },
  sessionBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.accentSoft,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, gap: 6,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  sessionText: { color: colors.accent, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  scrollContent: { padding: 16, gap: 16, paddingBottom: 120 },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { color: '#AAA', fontSize: 17, fontWeight: '600' },
  emptySubtitle: { color: '#666', fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
  exerciseCard: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: colors.border,
  },
  exerciseHeader: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    marginBottom: 16,
  },
  exerciseHeaderRight: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  setsProgress: {
    fontSize: 13, fontWeight: '700', color: colors.textMuted,
    backgroundColor: colors.surfaceAlt, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
  },
  removeBtn: { padding: 4 },
  exerciseName: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 4 },
  muscleLabel: { fontSize: 13, color: colors.accent, fontWeight: '600' },
  setsTable: { backgroundColor: colors.surfaceAlt, borderRadius: 10, padding: 12 },
  tableHead: {
    flexDirection: 'row', paddingBottom: 8, marginBottom: 8,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  thText: { flex: 1, color: colors.textMuted, fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
  tableRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 4 },
  cellText: { flex: 1, color: colors.textSecondary, fontSize: 14, textAlign: 'center' },
  cellInput: {
    flex: 1, backgroundColor: colors.surface, color: colors.textPrimary, textAlign: 'center',
    borderRadius: 8, paddingVertical: 8, fontSize: 15, fontWeight: '600',
  },
  cellInputLogged: { backgroundColor: '#1A2D1A', color: colors.success },
  checkBtn: {
    flex: 0.6, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.surfaceAlt, borderRadius: 8, paddingVertical: 8,
  },
  checkBtnDone: { backgroundColor: colors.success },
  addSetBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, marginTop: 12,
    borderWidth: 1, borderColor: colors.border, borderRadius: 10, borderStyle: 'dashed',
  },
  addSetText: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', padding: 16, gap: 12,
    backgroundColor: colors.chrome, borderTopWidth: 1, borderTopColor: colors.border,
  },
  addExerciseBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1, borderColor: colors.accent,
  },
  addExerciseBtnText: { color: colors.accent, fontWeight: '700', fontSize: 14 },
  completeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 14, borderRadius: 12, backgroundColor: colors.success,
  },
  completeBtnText: { color: colors.onAccent, fontWeight: '900', fontSize: 14 },
});

export default ActiveWorkoutScreen;
