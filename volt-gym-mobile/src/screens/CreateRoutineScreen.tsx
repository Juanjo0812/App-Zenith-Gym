import React, { useState, useEffect } from 'react';
import {
  StyleSheet, View, Text, ScrollView,
  TouchableOpacity, TextInput, Alert, KeyboardAvoidingView,
  Platform, Keyboard, TouchableWithoutFeedback,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Exercise } from '../features/workouts/api/workoutApi';
import { useRoutines, NewRoutineExercise } from '../context/RoutineContext';
import ScaleTouchable from '../shared/ui/ScaleTouchable';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, getInsetBottomPadding } from '../theme/theme';

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
  const [routineName, setRoutineName] = useState('');
  const [exerciseConfigs, setExerciseConfigs] = useState<ExerciseConfig[]>([]);
  const [saving, setSaving] = useState(false);

  // Listen for selected exercises returned from ExercisePicker
  useEffect(() => {
    const selectedExercises: Exercise[] | undefined = route.params?.selectedExercises;
    if (selectedExercises && selectedExercises.length > 0) {
      setExerciseConfigs((prev) => {
        const existingIds = new Set(prev.map((c) => c.exercise.id));
        const newConfigs = selectedExercises
          .filter((e) => !existingIds.has(e.id))
          .map((exercise) => ({
            exercise,
            sets: '3',
            reps: '10',
            weight: '0',
          }));
        return [...prev, ...newConfigs];
      });
      // Clear the param
      navigation.setParams({ selectedExercises: undefined });
    }
  }, [route.params?.selectedExercises]);

  const handleOpenPicker = () => {
    if (!routineName.trim()) {
      Alert.alert('Nombre requerido', 'Ingresa un nombre para la rutina antes de añadir ejercicios.');
      return;
    }
    navigation.navigate('ExercisePicker', {
      mode: 'create',
      existingExerciseIds: exerciseConfigs.map((c) => c.exercise.id),
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
    setExerciseConfigs((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!routineName.trim()) {
      Alert.alert('Error', 'Ingresa un nombre para la rutina.');
      return;
    }
    if (exerciseConfigs.length === 0) {
      Alert.alert('Error', 'Añade al menos un ejercicio a la rutina.');
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
      Alert.alert('✅ Rutina creada', `"${routineName.trim()}" se guardó con ${exercises.length} ejercicios.`, [
        { text: '¡Genial!', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert('Error', 'No se pudo crear la rutina. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
              <MaterialIcons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Crear rutina</Text>
            <View style={{ width: 40 }} />
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Routine name */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Nombre de la rutina</Text>
                <TextInput
                  style={styles.nameInput}
                  placeholder="Ej. Empuje hipertrofia"
                  placeholderTextColor="#555"
                  value={routineName}
                  onChangeText={setRoutineName}
                  autoCapitalize="sentences"
                  autoFocus
                />
              </View>

              {/* Exercise configs */}
              {exerciseConfigs.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>
                    Ejercicios ({exerciseConfigs.length})
                  </Text>
                  {exerciseConfigs.map((config, index) => (
                    <View key={config.exercise.id} style={styles.configCard}>
                      <View style={styles.configHeader}>
                        <View style={styles.configOrderBadge}>
                          <Text style={styles.configOrderText}>{index + 1}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.configName}>{config.exercise.name}</Text>
                          <Text style={styles.configMuscle}>{config.exercise.primary_muscle}</Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => removeExercise(index)}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <MaterialIcons name="close" size={20} color="#FF4500" />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.configInputs}>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputGroupLabel}>Series</Text>
                          <TextInput
                            style={styles.configInput}
                            keyboardType="numeric"
                            value={config.sets}
                            onChangeText={(v) => updateConfig(index, 'sets', v)}
                            returnKeyType="done"
                            selectTextOnFocus
                          />
                        </View>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputGroupLabel}>Reps</Text>
                          <TextInput
                            style={styles.configInput}
                            keyboardType="numeric"
                            value={config.reps}
                            onChangeText={(v) => updateConfig(index, 'reps', v)}
                            returnKeyType="done"
                            selectTextOnFocus
                          />
                        </View>
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputGroupLabel}>kg</Text>
                          <TextInput
                            style={styles.configInput}
                            keyboardType="numeric"
                            value={config.weight}
                            onChangeText={(v) => updateConfig(index, 'weight', v)}
                            returnKeyType="done"
                            selectTextOnFocus
                          />
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Add exercises button */}
              <TouchableOpacity style={styles.addExercisesBtn} onPress={handleOpenPicker} activeOpacity={0.7}>
                <MaterialIcons name="add" size={22} color="#FF4500" />
                <Text style={styles.addExercisesBtnText}>Añadir ejercicios</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>

          {/* Save button */}
          {exerciseConfigs.length > 0 && (
            <View style={[styles.bottomBar, { paddingBottom: getInsetBottomPadding(24, insets.bottom) }]}>
              <ScaleTouchable
                style={[styles.saveBtn, saving && { opacity: 0.5 }]}
                onPress={handleSave}
                disabled={saving}
              >
                <MaterialIcons name="save" size={20} color={colors.onAccent} />
                <Text style={styles.saveBtnText}>
                  {saving ? 'Guardando...' : 'Guardar rutina'}
                </Text>
              </ScaleTouchable>
            </View>
          )}
        </View>
      </TouchableWithoutFeedback>
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
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },
  scrollContent: { padding: 20, paddingBottom: 120 },

  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 14, fontWeight: '700', color: colors.textMuted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },

  nameInput: {
    backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border, borderRadius: 14,
    padding: 16, color: colors.textPrimary, fontSize: 17, fontWeight: '600',
  },

  // Exercise config cards
  configCard: {
    backgroundColor: colors.surface, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: colors.border, marginBottom: 12,
  },
  configHeader: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 14, gap: 12,
  },
  configOrderBadge: {
    width: 28, height: 28, borderRadius: 8, backgroundColor: colors.accentSoft,
    justifyContent: 'center', alignItems: 'center',
  },
  configOrderText: { color: colors.accent, fontSize: 14, fontWeight: '800' },
  configName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  configMuscle: { fontSize: 13, color: colors.textMuted },

  configInputs: { flexDirection: 'row', gap: 12 },
  inputGroup: { flex: 1 },
  inputGroupLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '600', marginBottom: 6, textAlign: 'center' },
  configInput: {
    backgroundColor: colors.surfaceAlt, borderRadius: 10, padding: 12,
    color: colors.textPrimary, fontSize: 16, fontWeight: '700', textAlign: 'center',
    borderWidth: 1, borderColor: colors.border,
  },

  // Add exercises button
  addExercisesBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: 14, borderStyle: 'dashed',
  },
  addExercisesBtnText: { color: colors.accent, fontSize: 15, fontWeight: '700' },

  // Bottom bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16,
    backgroundColor: colors.chrome,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  saveBtn: {
    flexDirection: 'row', backgroundColor: colors.accent, borderRadius: 14,
    paddingVertical: 16, justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  saveBtnText: { color: colors.onAccent, fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },
});

export default CreateRoutineScreen;
