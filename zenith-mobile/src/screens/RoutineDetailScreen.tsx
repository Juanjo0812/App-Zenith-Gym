import React, { useEffect, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { useRoutines, NewRoutineExercise } from '../context/RoutineContext';
import { Exercise } from '../features/workouts/api/workoutApi';
import { useFeedbackToast } from '../shared/ui/FeedbackToast';
import IconButton from '../shared/ui/IconButton';
import PremiumButton from '../shared/ui/PremiumButton';
import ScaleTouchable from '../shared/ui/ScaleTouchable';
import ScreenHeader from '../shared/ui/ScreenHeader';
import StateCard from '../shared/ui/StateCard';
import SurfaceCard from '../shared/ui/SurfaceCard';
import { colors, getInsetBottomPadding, radii, spacing } from '../theme/theme';

interface Props {
  navigation: any;
  route: any;
}

const RoutineDetailScreen = ({ navigation, route }: Props) => {
  const insets = useSafeAreaInsets();
  const { showToast } = useFeedbackToast();
  const routineId: string = route.params?.routineId;
  const {
    getRoutineById,
    updateRoutineName,
    updateExerciseInRoutine,
    deleteExerciseFromRoutine,
    deleteRoutine,
    addExercisesToRoutine,
    refreshRoutines,
  } = useRoutines();

  const routine = getRoutineById(routineId);

  const [editingExercise, setEditingExercise] = useState<{
    exerciseIndex: number;
    weight: string;
    reps: string;
    setsCount: string;
  } | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(routine?.name || '');

  useEffect(() => {
    const newExercises: Exercise[] | undefined = route.params?.newExercises;
    if (newExercises && newExercises.length > 0 && routineId) {
      const exercisesToAdd: NewRoutineExercise[] = newExercises.map((exercise) => ({
        exerciseId: exercise.id,
        name: exercise.name,
        muscle: exercise.primary_muscle,
        sets: 3,
        reps: 10,
        weight: 0,
      }));

      addExercisesToRoutine(routineId, exercisesToAdd)
        .then(() => {
          refreshRoutines();
          showToast({
            title: 'Ejercicios añadidos',
            message: `${newExercises.length} ejercicio${newExercises.length === 1 ? '' : 's'} incorporado${newExercises.length === 1 ? '' : 's'} a la rutina.`,
            variant: 'success',
          });
        })
        .catch(() => {
          showToast({
            title: 'No pudimos añadir los ejercicios',
            message: 'Intenta de nuevo en unos segundos.',
            variant: 'error',
          });
        });

      navigation.setParams({ newExercises: undefined });
    }
  }, [addExercisesToRoutine, navigation, refreshRoutines, route.params?.newExercises, routineId, showToast]);

  const handleOpenPicker = () => {
    const existingIds = routine?.exercises.map((exercise) => exercise.exerciseId) || [];
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
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await deleteExerciseFromRoutine(routineId, exerciseIndex);
          showToast({
            title: 'Ejercicio eliminado',
            message: `${name} salió de la rutina.`,
            variant: 'success',
          });
        },
      },
    ]);
  };

  const handleDeleteRoutine = () => {
    if (!routine) return;
    Alert.alert('Eliminar rutina', `¿Seguro que quieres eliminar "${routine.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await deleteRoutine(routineId);
          showToast({
            title: 'Rutina eliminada',
            message: `"${routine.name}" ya no está en tu biblioteca.`,
            variant: 'success',
          });
          navigation.goBack();
        },
      },
    ]);
  };

  const saveEditedName = async () => {
    if (!newName.trim()) {
      showToast({
        title: 'Falta el nombre',
        message: 'Escribe un nombre para guardar el cambio.',
        variant: 'error',
      });
      return;
    }

    await updateRoutineName(routineId, newName.trim());
    setEditingName(false);
    showToast({
      title: 'Nombre actualizado',
      message: 'La rutina ya muestra el nuevo nombre.',
      variant: 'success',
    });
  };

  const saveEditedExercise = async () => {
    if (!editingExercise) return;

    await updateExerciseInRoutine(
      routineId,
      editingExercise.exerciseIndex,
      Number(editingExercise.weight) || 0,
      Number(editingExercise.reps) || 0,
      Number(editingExercise.setsCount) || 1
    );
    setEditingExercise(null);
    showToast({
      title: 'Configuración actualizada',
      message: 'Los cambios del ejercicio ya quedaron guardados.',
      variant: 'success',
    });
  };

  if (!routine) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <ScreenHeader
          title="Rutina"
          subtitle="No encontramos esta rutina"
          left={<IconButton icon="arrow-back" onPress={() => navigation.goBack()} />}
        />
        <View style={styles.centeredState}>
          <StateCard
            icon="fitness-center"
            title="Rutina no encontrada"
            description="Puede que haya sido eliminada o que necesites refrescar tu biblioteca."
            actionLabel="Volver"
            onActionPress={() => navigation.goBack()}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScreenHeader
        title={routine.name}
        subtitle={`${routine.exercises.length} ${routine.exercises.length === 1 ? 'ejercicio' : 'ejercicios'} preparados`}
        left={<IconButton icon="arrow-back" onPress={() => navigation.goBack()} />}
        right={<IconButton icon="delete-outline" color={colors.accent} onPress={handleDeleteRoutine} />}
      />

      {routine.muscleGroups.length > 0 ? (
        <View style={styles.summaryBar}>
          <Text style={styles.summaryText}>{routine.muscleGroups.join(' • ')}</Text>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <ScaleTouchable
          style={styles.nameCardTouch}
          onPress={() => {
            setNewName(routine.name);
            setEditingName(true);
          }}
          variant="card"
        >
          <SurfaceCard variant="secondary" style={styles.nameCard}>
            <View style={styles.nameCardCopy}>
              <Text style={styles.nameCardLabel}>Nombre de la rutina</Text>
              <Text style={styles.nameCardTitle}>{routine.name}</Text>
            </View>
            <MaterialIcons name="edit" size={18} color={colors.textSecondary} />
          </SurfaceCard>
        </ScaleTouchable>

        {routine.exercises.map((exercise, index) => (
          <SurfaceCard key={`${exercise.exerciseId}-${index}`} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <View style={styles.orderBadge}>
                <Text style={styles.orderText}>{index + 1}</Text>
              </View>

              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseMeta}>
                  {exercise.sets.length} × {exercise.sets[0]?.reps || 0} reps · {exercise.sets[0]?.weight || 0} kg
                </Text>
              </View>

              <View style={styles.exerciseActions}>
                <IconButton
                  icon="edit"
                  color={colors.textSecondary}
                  onPress={() =>
                    setEditingExercise({
                      exerciseIndex: index,
                      weight: exercise.sets[0]?.weight?.toString() || '0',
                      reps: exercise.sets[0]?.reps?.toString() || '0',
                      setsCount: exercise.sets.length.toString(),
                    })
                  }
                  accessibilityLabel={`Editar ${exercise.name}`}
                />
                <IconButton
                  icon="close"
                  color={colors.accent}
                  onPress={() => handleDeleteExercise(index, exercise.name)}
                  accessibilityLabel={`Eliminar ${exercise.name}`}
                />
              </View>
            </View>
          </SurfaceCard>
        ))}

        <ScaleTouchable style={styles.addButtonTouch} onPress={handleOpenPicker} variant="card">
          <SurfaceCard variant="secondary" style={styles.addButtonCard}>
            <MaterialIcons name="add" size={22} color={colors.accent} />
            <View style={styles.addButtonCopy}>
              <Text style={styles.addButtonTitle}>Añadir ejercicios</Text>
              <Text style={styles.addButtonSubtitle}>Amplía esta rutina sin perder su orden actual.</Text>
            </View>
          </SurfaceCard>
        </ScaleTouchable>
      </ScrollView>

      {routine.exercises.length > 0 ? (
        <View style={[styles.bottomBar, { paddingBottom: getInsetBottomPadding(16, insets.bottom) }]}>
          <PremiumButton
            label="Iniciar entreno"
            icon="play-arrow"
            onPress={handleStartWorkout}
          />
        </View>
      ) : null}

      <Modal visible={editingName} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalKeyboard}
            >
              <SurfaceCard style={styles.modalCard}>
                <Text style={styles.modalTitle}>Editar nombre</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newName}
                  onChangeText={setNewName}
                  placeholder="Nombre de la rutina"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="sentences"
                  autoFocus
                />
                <View style={styles.modalActions}>
                  <PremiumButton
                    label="Cancelar"
                    variant="ghost"
                    size="md"
                    onPress={() => setEditingName(false)}
                    style={styles.modalActionButton}
                  />
                  <PremiumButton
                    label="Guardar"
                    size="md"
                    onPress={saveEditedName}
                    style={styles.modalActionButton}
                  />
                </View>
              </SurfaceCard>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal visible={!!editingExercise} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.modalKeyboard}
            >
              <SurfaceCard style={styles.modalCard}>
                <Text style={styles.modalTitle}>Editar configuración</Text>

                <Text style={styles.modalLabel}>Series</Text>
                <TextInput
                  style={styles.modalInput}
                  keyboardType="numeric"
                  value={editingExercise?.setsCount}
                  onChangeText={(text) => setEditingExercise((prev) => (prev ? { ...prev, setsCount: text } : null))}
                  returnKeyType="done"
                />

                <Text style={styles.modalLabel}>Repeticiones por serie</Text>
                <TextInput
                  style={styles.modalInput}
                  keyboardType="numeric"
                  value={editingExercise?.reps}
                  onChangeText={(text) => setEditingExercise((prev) => (prev ? { ...prev, reps: text } : null))}
                  returnKeyType="done"
                />

                <Text style={styles.modalLabel}>Peso por serie</Text>
                <TextInput
                  style={styles.modalInput}
                  keyboardType="numeric"
                  value={editingExercise?.weight}
                  onChangeText={(text) => setEditingExercise((prev) => (prev ? { ...prev, weight: text } : null))}
                  returnKeyType="done"
                />

                <View style={styles.modalActions}>
                  <PremiumButton
                    label="Cancelar"
                    variant="ghost"
                    size="md"
                    onPress={() => setEditingExercise(null)}
                    style={styles.modalActionButton}
                  />
                  <PremiumButton
                    label="Guardar"
                    size="md"
                    onPress={saveEditedExercise}
                    style={styles.modalActionButton}
                  />
                </View>
              </SurfaceCard>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
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
  summaryBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.accentSoft,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: 120,
  },
  nameCardTouch: {
    borderRadius: radii.lg,
  },
  nameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  nameCardCopy: {
    flex: 1,
  },
  nameCardLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  nameCardTitle: {
    color: colors.textPrimary,
    fontSize: 19,
    fontWeight: '800',
  },
  exerciseCard: {
    gap: spacing.md,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  orderBadge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '800',
  },
  exerciseInfo: {
    flex: 1,
    gap: 2,
  },
  exerciseName: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  exerciseMeta: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  exerciseActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  addButtonTouch: {
    borderRadius: radii.lg,
  },
  addButtonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  addButtonCopy: {
    flex: 1,
    gap: 4,
  },
  addButtonTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  addButtonSubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 19,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    backgroundColor: colors.chrome,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  modalKeyboard: {
    width: '100%',
  },
  modalCard: {
    width: '100%',
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
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
    paddingVertical: 14,
    color: colors.textPrimary,
    fontSize: 15,
    marginBottom: spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  modalActionButton: {
    flex: 1,
  },
});

export default RoutineDetailScreen;
