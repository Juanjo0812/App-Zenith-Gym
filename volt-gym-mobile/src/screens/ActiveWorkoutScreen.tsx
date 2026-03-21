import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, SafeAreaView, ScrollView,
  TouchableOpacity, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { workoutApi, Exercise, CompleteSessionResponse } from '../features/workouts/api/workoutApi';
import ScaleTouchable from '../shared/ui/ScaleTouchable';

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

const ActiveWorkoutScreen = ({ navigation, route }: Props) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [exerciseBlocks, setExerciseBlocks] = useState<ExerciseBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);

  // Start a new session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        const res = await workoutApi.startSession();
        setSessionId(res.session_id);
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

  // Listen for exercise additions from ExerciseListScreen
  useEffect(() => {
    const addExercise: Exercise | undefined = route.params?.addExercise;
    if (addExercise) {
      // Avoid duplicates
      const alreadyAdded = exerciseBlocks.some((b) => b.exercise.id === addExercise.id);
      if (!alreadyAdded) {
        setExerciseBlocks((prev) => [
          ...prev,
          { exercise: addExercise, sets: [{ reps: '', weight: '', logged: false }] },
        ]);
      }
      // Clear the param to avoid re-adding
      navigation.setParams({ addExercise: undefined });
    }
  }, [route.params?.addExercise]);

  const addSet = (blockIdx: number) => {
    setExerciseBlocks((prev) => {
      const updated = [...prev];
      updated[blockIdx] = {
        ...updated[blockIdx],
        sets: [...updated[blockIdx].sets, { reps: '', weight: '', logged: false }],
      };
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
        rest_seconds: 60
      });
      setExerciseBlocks((prev) => {
        const updated = [...prev];
        const sets = [...updated[blockIdx].sets];
        sets[setIdx] = { ...sets[setIdx], logged: true, setId: res.set_id };
        updated[blockIdx] = { ...updated[blockIdx], sets };
        return updated;
      });
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo registrar el set.');
    }
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
    try {
      const result: CompleteSessionResponse = await workoutApi.completeSession(sessionId);
      Alert.alert(
        result.leveled_up ? '🎉 ¡LEVEL UP!' : '⚡ ¡Entrenamiento Completo!',
        `XP ganada: +${result.xp_earned}\nXP total: ${result.new_total_xp}\nNivel: ${result.new_level}`,
        [{ text: '¡Genial!', onPress: () => navigation.goBack() }],
      );
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'No se pudo completar la sesión.');
    } finally {
      setCompleting(false);
    }
  };

  const handleAddExercise = () => {
    navigation.navigate('ExerciseList', { sessionId });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#FF4500" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="close" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Entreno Activo</Text>
        <View style={styles.sessionBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.sessionText}>EN VIVO</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {exerciseBlocks.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="fitness-center" size={48} color="#333" />
            <Text style={styles.emptyTitle}>Agrega un ejercicio para comenzar</Text>
            <Text style={styles.emptySubtitle}>
              Presiona el botón de abajo para buscar en tu librería
            </Text>
          </View>
        ) : (
          exerciseBlocks.map((block, blockIdx) => (
            <View key={block.exercise.id} style={styles.exerciseCard}>
              <Text style={styles.exerciseName}>{block.exercise.name}</Text>
              <Text style={styles.muscleLabel}>{block.exercise.primary_muscle}</Text>

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
                        color={set.logged ? '#000' : '#FFF'}
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
          ))
        )}
      </ScrollView>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
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
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <>
              <Text style={styles.completeBtnText}>Completar</Text>
              <MaterialIcons name="check-circle" size={20} color="#000" />
            </>
          )}
        </ScaleTouchable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: '#0F0F23', borderBottomWidth: 1, borderBottomColor: '#1A1A2E',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  sessionBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,69,0,0.15)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, gap: 6,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF4500' },
  sessionText: { color: '#FF4500', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  scrollContent: { padding: 16, gap: 16, paddingBottom: 120 },
  emptyState: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { color: '#AAA', fontSize: 17, fontWeight: '600' },
  emptySubtitle: { color: '#666', fontSize: 14, textAlign: 'center', paddingHorizontal: 40 },
  exerciseCard: {
    backgroundColor: '#111', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: '#222',
  },
  exerciseName: { fontSize: 18, fontWeight: 'bold', color: '#FFF', marginBottom: 4 },
  muscleLabel: { fontSize: 13, color: '#FF4500', marginBottom: 16, fontWeight: '600' },
  setsTable: { backgroundColor: '#1A1A1A', borderRadius: 10, padding: 12 },
  tableHead: {
    flexDirection: 'row', paddingBottom: 8, marginBottom: 8,
    borderBottomWidth: 1, borderBottomColor: '#333',
  },
  thText: { flex: 1, color: '#888', fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
  tableRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 4 },
  cellText: { flex: 1, color: '#AAA', fontSize: 14, textAlign: 'center' },
  cellInput: {
    flex: 1, backgroundColor: '#222', color: '#FFF', textAlign: 'center',
    borderRadius: 8, paddingVertical: 8, fontSize: 15, fontWeight: '600',
  },
  cellInputLogged: { backgroundColor: '#1A2D1A', color: '#00E676' },
  checkBtn: {
    flex: 0.6, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#333', borderRadius: 8, paddingVertical: 8,
  },
  checkBtnDone: { backgroundColor: '#00E676' },
  addSetBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, marginTop: 12,
    borderWidth: 1, borderColor: '#333', borderRadius: 10, borderStyle: 'dashed',
  },
  addSetText: { color: '#FF4500', fontSize: 13, fontWeight: '600' },
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', padding: 16, gap: 12,
    backgroundColor: '#0F0F23', borderTopWidth: 1, borderTopColor: '#1A1A2E',
  },
  addExerciseBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 14, borderRadius: 12,
    borderWidth: 1, borderColor: '#FF4500',
  },
  addExerciseBtnText: { color: '#FF4500', fontWeight: '700', fontSize: 14 },
  completeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 14, borderRadius: 12, backgroundColor: '#00E676',
  },
  completeBtnText: { color: '#000', fontWeight: '900', fontSize: 14 },
});

export default ActiveWorkoutScreen;
