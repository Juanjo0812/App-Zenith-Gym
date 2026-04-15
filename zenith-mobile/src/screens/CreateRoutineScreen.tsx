import React, { useEffect, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
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

import { Exercise } from '../features/workouts/api/workoutApi';
import { useRoutines, NewRoutineExercise } from '../context/RoutineContext';
import { useFeedbackToast } from '../shared/ui/FeedbackToast';
import IconButton from '../shared/ui/IconButton';
import PremiumButton from '../shared/ui/PremiumButton';
import ScaleTouchable from '../shared/ui/ScaleTouchable';
import ScreenHeader from '../shared/ui/ScreenHeader';
import SurfaceCard from '../shared/ui/SurfaceCard';
import { colors, getInsetBottomPadding, radii, spacing } from '../theme/theme';

interface ExerciseConfig {
  exercise: Exercise;
  sets: string;
  reps: string;
  weight: string;
}

interface Props {
  navigation: any;
  route: any;
}

const CreateRoutineScreen = ({ navigation, route }: Props) => {
  const insets = useSafeAreaInsets();
  const { createRoutineWithExercises } = useRoutines();
  const { showToast } = useFeedbackToast();

  const [routineName, setRoutineName] = useState('');
  const [exerciseConfigs, setExerciseConfigs] = useState<ExerciseConfig[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const selectedExercises: Exercise[] | undefined = route.params?.selectedExercises;
    if (selectedExercises && selectedExercises.length > 0) {
      setExerciseConfigs((prev) => {
        const existingIds = new Set(prev.map((config) => config.exercise.id));
        const newConfigs = selectedExercises
          .filter((exercise) => !existingIds.has(exercise.id))
          .map((exercise) => ({
            exercise,
            sets: '3',
            reps: '10',
            weight: '0',
          }));
        return [...prev, ...newConfigs];
      });
      navigation.setParams({ selectedExercises: undefined });
    }
  }, [navigation, route.params?.selectedExercises]);

  const handleOpenPicker = () => {
    if (!routineName.trim()) {
      showToast({
        title: 'Falta el nombre de la rutina',
        message: 'Define un nombre antes de añadir ejercicios.',
        variant: 'error',
      });
      return;
    }

    navigation.navigate('ExercisePicker', {
      mode: 'create',
      existingExerciseIds: exerciseConfigs.map((config) => config.exercise.id),
      routineName: routineName.trim(),
    });
  };

  const updateConfig = (index: number, field: 'sets' | 'reps' | 'weight', value: string) => {
    setExerciseConfigs((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeExercise = (index: number) => {
    setExerciseConfigs((prev) => prev.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleSave = async () => {
    if (!routineName.trim()) {
      showToast({
        title: 'Falta el nombre',
        message: 'Ingresa un nombre para guardar la rutina.',
        variant: 'error',
      });
      return;
    }

    if (exerciseConfigs.length === 0) {
      showToast({
        title: 'Añade al menos un ejercicio',
        message: 'La rutina necesita un primer ejercicio para poder guardarse.',
        variant: 'error',
      });
      return;
    }

    setSaving(true);
    try {
      const exercises: NewRoutineExercise[] = exerciseConfigs.map((config) => ({
        exerciseId: config.exercise.id,
        name: config.exercise.name,
        muscle: config.exercise.primary_muscle,
        sets: Number(config.sets) || 3,
        reps: Number(config.reps) || 10,
        weight: Number(config.weight) || 0,
      }));

      await createRoutineWithExercises(routineName.trim(), exercises);
      showToast({
        title: 'Rutina creada',
        message: `"${routineName.trim()}" ya está lista con ${exercises.length} ejercicios.`,
        variant: 'success',
      });
      navigation.goBack();
    } catch {
      showToast({
        title: 'No pudimos guardar la rutina',
        message: 'Intenta de nuevo en unos segundos.',
        variant: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.flex}>
          <ScreenHeader
            title="Crear rutina"
            subtitle="Configura una estructura lista para empezar con un solo toque."
            left={<IconButton icon="arrow-back" onPress={() => navigation.goBack()} />}
          />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.flex}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <SurfaceCard style={styles.sectionCard}>
                <Text style={styles.sectionLabel}>Nombre de la rutina</Text>
                <TextInput
                  style={styles.nameInput}
                  placeholder="Ej. Empuje hipertrofia"
                  placeholderTextColor={colors.textMuted}
                  value={routineName}
                  onChangeText={setRoutineName}
                  autoCapitalize="sentences"
                  autoFocus
                />
              </SurfaceCard>

              {exerciseConfigs.length > 0 ? (
                <View style={styles.exerciseSection}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Ejercicios</Text>
                    <Text style={styles.sectionMeta}>{exerciseConfigs.length} en total</Text>
                  </View>

                  {exerciseConfigs.map((config, index) => (
                    <SurfaceCard key={config.exercise.id} variant="secondary" style={styles.configCard}>
                      <View style={styles.configHeader}>
                        <View style={styles.configOrderBadge}>
                          <Text style={styles.configOrderText}>{index + 1}</Text>
                        </View>

                        <View style={styles.configInfo}>
                          <Text style={styles.configName}>{config.exercise.name}</Text>
                          <Text style={styles.configMuscle}>{config.exercise.primary_muscle}</Text>
                        </View>

                        <IconButton
                          icon="close"
                          color={colors.accent}
                          onPress={() => removeExercise(index)}
                          accessibilityLabel={`Eliminar ${config.exercise.name}`}
                        />
                      </View>

                      <View style={styles.configInputs}>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputGroupLabel}>Series</Text>
                          <TextInput
                            style={styles.configInput}
                            keyboardType="numeric"
                            value={config.sets}
                            onChangeText={(value) => updateConfig(index, 'sets', value)}
                            returnKeyType="done"
                            selectTextOnFocus
                          />
                        </View>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputGroupLabel}>Repeticiones</Text>
                          <TextInput
                            style={styles.configInput}
                            keyboardType="numeric"
                            value={config.reps}
                            onChangeText={(value) => updateConfig(index, 'reps', value)}
                            returnKeyType="done"
                            selectTextOnFocus
                          />
                        </View>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputGroupLabel}>Peso inicial</Text>
                          <TextInput
                            style={styles.configInput}
                            keyboardType="numeric"
                            value={config.weight}
                            onChangeText={(value) => updateConfig(index, 'weight', value)}
                            returnKeyType="done"
                            selectTextOnFocus
                          />
                        </View>
                      </View>
                    </SurfaceCard>
                  ))}
                </View>
              ) : null}

              <ScaleTouchable style={styles.addExercisesTouch} onPress={handleOpenPicker} variant="card">
                <SurfaceCard variant="secondary" style={styles.addExercisesCard}>
                  <MaterialIcons name="add" size={22} color={colors.accent} />
                  <View style={styles.addExercisesCopy}>
                    <Text style={styles.addExercisesTitle}>Añadir ejercicios</Text>
                    <Text style={styles.addExercisesSubtitle}>
                      Selecciona movimientos para armar la rutina y definir su base.
                    </Text>
                  </View>
                </SurfaceCard>
              </ScaleTouchable>
            </ScrollView>
          </KeyboardAvoidingView>

          {exerciseConfigs.length > 0 ? (
            <View style={[styles.bottomBar, { paddingBottom: getInsetBottomPadding(16, insets.bottom) }]}>
              <PremiumButton
                label={saving ? 'Guardando...' : 'Guardar rutina'}
                icon="save"
                onPress={handleSave}
                loading={saving}
                disabled={saving}
              />
            </View>
          ) : null}
        </View>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: 120,
  },
  sectionCard: {
    gap: spacing.sm,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  nameInput: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 16,
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  exerciseSection: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  sectionMeta: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
  },
  configCard: {
    gap: spacing.md,
  },
  configHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  configOrderBadge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  configOrderText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '800',
  },
  configInfo: {
    flex: 1,
    gap: 2,
  },
  configName: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  configMuscle: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  configInputs: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  inputGroup: {
    flex: 1,
  },
  inputGroupLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  configInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    paddingVertical: 14,
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  addExercisesTouch: {
    borderRadius: radii.lg,
  },
  addExercisesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderStyle: 'dashed',
  },
  addExercisesCopy: {
    flex: 1,
    gap: 4,
  },
  addExercisesTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '800',
  },
  addExercisesSubtitle: {
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
});

export default CreateRoutineScreen;
