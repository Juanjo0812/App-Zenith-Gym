import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, View, Text, ScrollView,
  TouchableOpacity, TextInput, Alert, Modal,
  KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRoutines, NewRoutineExercise } from '../context/RoutineContext';
import { Exercise } from '../features/workouts/api/workoutApi';
import ScaleTouchable from '../shared/ui/ScaleTouchable';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, getInsetBottomPadding } from '../theme/theme';

interface Props {
  navigation: any;
  route: any;
}

const RoutineDetailScreen = ({ navigation, route }: Props) => {
  const insets = useSafeAreaInsets();
  const routineId: string = route.params?.routineId;
  const {
    getRoutineById, updateRoutineName, updateExerciseInRoutine,
    deleteExerciseFromRoutine, deleteRoutine, addExercisesToRoutine, refreshRoutines,
  } = useRoutines();

  const routine = getRoutineById(routineId);

  // Edit exercise modal state
  const [editingExercise, setEditingExercise] = useState<{
    exerciseIndex: number;
    weight: string;
    reps: string;
    setsCount: string;
  } | null>(null);

  // Edit name modal state
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(routine?.name || '');

  // Listen for new exercises from ExercisePicker
  useEffect(() => {
    const newExercises: Exercise[] | undefined = route.params?.newExercises;
    if (newExercises && newExercises.length > 0 && routineId) {
      const exercisesToAdd: NewRoutineExercise[] = newExercises.map((e) => ({
        exerciseId: e.id,
        name: e.name,
        muscle: e.primary_muscle,
        sets: 3,
        reps: 10,
        weight: 0,
      }));
      addExercisesToRoutine(routineId, exercisesToAdd).then(() => {
        refreshRoutines();
      });
      navigation.setParams({ newExercises: undefined });
    }
  }, [route.params?.newExercises]);

  const handleOpenPicker = () => {
    const existingIds = routine?.exercises.map((e) => e.exerciseId) || [];
    navigation.navigate('ExercisePicker', {
      mode: 'add-to-routine',
      routineId,
      existingExerciseIds: existingIds,
    });
  };

  const handleStartWorkout = () => {
    navigation.navigate('ActiveWorkout', { routineId });
  };

  const handleDeleteExercise = (exerciseIndex: number, name: string) => {
    Alert.alert('Eliminar ejercicio', `¿Seguro que quieres eliminar "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: () => deleteExerciseFromRoutine(routineId, exerciseIndex),
      },
    ]);
  };

  const handleDeleteRoutine = () => {
    if (!routine) return;
    Alert.alert('Eliminar rutina', `¿Seguro que quieres eliminar "${routine.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          await deleteRoutine(routineId);
          navigation.goBack();
        },
      },
    ]);
  };

  const saveEditedName = async () => {
    if (newName.trim()) {
      await updateRoutineName(routineId, newName.trim());
      setEditingName(false);
    }
  };

  const saveEditedExercise = async () => {
    if (editingExercise) {
      await updateExerciseInRoutine(
        routineId,
        editingExercise.exerciseIndex,
        Number(editingExercise.weight) || 0,
        Number(editingExercise.reps) || 0,
        Number(editingExercise.setsCount) || 1,
      );
      setEditingExercise(null);
    }
  };

  if (!routine) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rutina no encontrada</Text>
          <View style={{ width: 40 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerTitleContainer}
          onPress={() => {
            setNewName(routine.name);
            setEditingName(true);
          }}
        >
          <Text style={styles.headerTitle} numberOfLines={1}>{routine.name}</Text>
          <MaterialIcons name="edit" size={14} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDeleteRoutine} style={styles.headerBtn}>
          <MaterialIcons name="delete-outline" size={22} color="#FF4500" />
        </TouchableOpacity>
      </View>

      {/* Muscle groups summary */}
      {routine.muscleGroups.length > 0 && (
        <View style={styles.muscleSummary}>
          <Text style={styles.muscleSummaryText}>
            {routine.muscleGroups.join(' • ')}
          </Text>
          <Text style={styles.exerciseCountText}>
            {routine.exercises.length} {routine.exercises.length === 1 ? 'ejercicio' : 'ejercicios'}
          </Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Exercise list */}
        {routine.exercises.map((exercise, index) => (
          <View key={`${exercise.exerciseId}-${index}`} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <View style={styles.orderBadge}>
                <Text style={styles.orderText}>{index + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseMeta}>
                  {exercise.sets.length} × {exercise.sets[0]?.reps || 0} reps · {exercise.sets[0]?.weight || 0} kg
                </Text>
              </View>
              <View style={styles.exerciseActions}>
                <TouchableOpacity
                  onPress={() => {
                    setEditingExercise({
                      exerciseIndex: index,
                      weight: exercise.sets[0]?.weight?.toString() || '0',
                      reps: exercise.sets[0]?.reps?.toString() || '0',
                      setsCount: exercise.sets.length.toString(),
                    });
                  }}
                  style={styles.actionBtn}
                >
                  <MaterialIcons name="edit" size={18} color="#888" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDeleteExercise(index, exercise.name)}
                  style={styles.actionBtn}
                >
                  <MaterialIcons name="close" size={18} color="#FF4500" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}

        {/* Add exercises */}
        <TouchableOpacity style={styles.addBtn} onPress={handleOpenPicker} activeOpacity={0.7}>
          <MaterialIcons name="add" size={22} color="#FF4500" />
          <Text style={styles.addBtnText}>Añadir ejercicios</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Start workout button */}
      {routine.exercises.length > 0 && (
        <View style={[styles.bottomBar, { paddingBottom: getInsetBottomPadding(24, insets.bottom) }]}>
          <ScaleTouchable style={styles.startBtn} onPress={handleStartWorkout}>
            <MaterialIcons name="play-arrow" size={22} color={colors.onAccent} />
            <Text style={styles.startBtnText}>Iniciar entreno</Text>
          </ScaleTouchable>
        </View>
      )}

      {/* Edit Name Modal */}
      <Modal visible={editingName} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ width: '100%', alignItems: 'center' }}
            >
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Editar nombre</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="Nombre de la rutina"
                  placeholderTextColor="#666"
                  autoCapitalize="sentences"
                  autoFocus
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity onPress={() => setEditingName(false)} style={styles.modalBtn}>
                    <Text style={styles.modalBtnText}>Cancelar</Text>
                  </TouchableOpacity>
                  <ScaleTouchable onPress={saveEditedName} style={[styles.modalBtn, styles.modalBtnPrimary]}>
                    <Text style={[styles.modalBtnText, styles.modalBtnTextPrimary]}>Guardar</Text>
                  </ScaleTouchable>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Edit Exercise Modal */}
      <Modal visible={!!editingExercise} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ width: '100%', alignItems: 'center' }}
            >
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Editar configuración</Text>

                <Text style={styles.modalInputLabel}>Series</Text>
                <TextInput
                  style={styles.modalInput}
                  keyboardType="numeric"
                  value={editingExercise?.setsCount}
                  onChangeText={(t) => setEditingExercise((prev) => prev ? { ...prev, setsCount: t } : null)}
                  returnKeyType="done"
                />

                <Text style={styles.modalInputLabel}>Reps (por serie)</Text>
                <TextInput
                  style={styles.modalInput}
                  keyboardType="numeric"
                  value={editingExercise?.reps}
                  onChangeText={(t) => setEditingExercise((prev) => prev ? { ...prev, reps: t } : null)}
                  returnKeyType="done"
                />

                <Text style={styles.modalInputLabel}>kg (por serie)</Text>
                <TextInput
                  style={styles.modalInput}
                  keyboardType="numeric"
                  value={editingExercise?.weight}
                  onChangeText={(t) => setEditingExercise((prev) => prev ? { ...prev, weight: t } : null)}
                  returnKeyType="done"
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity onPress={() => setEditingExercise(null)} style={styles.modalBtn}>
                    <Text style={styles.modalBtnText}>Cancelar</Text>
                  </TouchableOpacity>
                  <ScaleTouchable onPress={saveEditedExercise} style={[styles.modalBtn, styles.modalBtnPrimary]}>
                    <Text style={[styles.modalBtnText, styles.modalBtnTextPrimary]}>Guardar</Text>
                  </ScaleTouchable>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: colors.chrome, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  headerBtn: { width: 40, alignItems: 'center' },
  headerTitleContainer: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },

  muscleSummary: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
    backgroundColor: colors.accentSoft, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  muscleSummaryText: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  exerciseCountText: { color: colors.textMuted, fontSize: 13 },

  scrollContent: { padding: 20, paddingBottom: 120 },

  exerciseCard: {
    backgroundColor: colors.surface, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: colors.border, marginBottom: 10,
  },
  exerciseHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  orderBadge: {
    width: 30, height: 30, borderRadius: 10, backgroundColor: colors.accentSoft,
    justifyContent: 'center', alignItems: 'center',
  },
  orderText: { color: colors.accent, fontSize: 14, fontWeight: '800' },
  exerciseName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  exerciseMeta: { fontSize: 13, color: colors.textMuted },
  exerciseActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { padding: 6 },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: 14, borderStyle: 'dashed', marginTop: 4,
  },
  addBtnText: { color: colors.accent, fontSize: 15, fontWeight: '700' },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16,
    backgroundColor: colors.chrome,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  startBtn: {
    flexDirection: 'row', backgroundColor: colors.accent, borderRadius: 14,
    paddingVertical: 16, justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  startBtnText: { color: colors.onAccent, fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },

  // Modals
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  modalCard: {
    backgroundColor: colors.surfaceAlt, width: '100%', borderRadius: 16,
    padding: 24, borderWidth: 1, borderColor: colors.border,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 20 },
  modalInputLabel: { color: colors.textSecondary, fontSize: 12, marginBottom: 6 },
  modalInput: {
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
    borderRadius: 8, padding: 12, color: colors.textPrimary, marginBottom: 16, fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8,
  },
  modalBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  modalBtnPrimary: { backgroundColor: colors.accent },
  modalBtnText: { color: colors.textSecondary, fontWeight: 'bold', fontSize: 14 },
  modalBtnTextPrimary: { color: colors.onAccent },
});

export default RoutineDetailScreen;
