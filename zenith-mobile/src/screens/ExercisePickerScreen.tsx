import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { workoutApi, Exercise } from '../features/workouts/api/workoutApi';
import { useFeedbackToast } from '../shared/ui/FeedbackToast';
import IconButton from '../shared/ui/IconButton';
import PremiumButton from '../shared/ui/PremiumButton';
import ScaleTouchable from '../shared/ui/ScaleTouchable';
import ScreenHeader from '../shared/ui/ScreenHeader';
import StateBanner from '../shared/ui/StateBanner';
import StateCard from '../shared/ui/StateCard';
import SurfaceCard from '../shared/ui/SurfaceCard';
import { colors, getInsetBottomPadding, radii, spacing } from '../theme/theme';

const EXERCISE_IMAGES: Record<string, any> = {
  'Press de banca': require('../../assets/exercises/Bench press.png'),
  'Press inclinado con mancuernas': require('../../assets/exercises/Incline Dumbbell Press.png'),
  'Aperturas en polea': require('../../assets/exercises/Cable Fly.png'),
  'Remo con barra': require('../../assets/exercises/Barbell Row.png'),
  'Dominadas': require('../../assets/exercises/Pull Up.png'),
  'Jalón al pecho': require('../../assets/exercises/Seated Lat Pulldown.png'),
  'Press militar': require('../../assets/exercises/Overhead Press.png'),
  'Elevaciones laterales': require('../../assets/exercises/Lateral Raise.png'),
  'Peso muerto rumano': require('../../assets/exercises/Romanian Deadlift.png'),
  'Prensa de piernas': require('../../assets/exercises/Leg press.png'),
  'Curl de piernas': require('../../assets/exercises/Leg curl.png'),
  'Curl con barra': require('../../assets/exercises/Barbell Curl.png'),
  'Extensión de tríceps en polea': require('../../assets/exercises/Tricep Pushdown.png'),
  'Elevaciones de piernas colgado': require('../../assets/exercises/Hanging Leg Raise.png'),
  'Crunch en polea': require('../../assets/exercises/Cable crunch.png'),
  'Sentadilla con barra': require('../../assets/exercises/Barbell Squat.png'),
};

interface Props {
  navigation: any;
  route: any;
}

const ExercisePickerScreen = ({ navigation, route }: Props) => {
  const insets = useSafeAreaInsets();
  const { showToast } = useFeedbackToast();
  const { mode, routineId, existingExerciseIds = [] } = route.params || {};

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [muscleFilters, setMuscleFilters] = useState<{ id: string; label: string }[]>([
    { id: 'Todos', label: 'Todos' },
  ]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeMuscle, setActiveMuscle] = useState('Todos');
  const [selected, setSelected] = useState<Map<string, Exercise>>(new Map());
  const [detailExercise, setDetailExercise] = useState<Exercise | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const muscles = await workoutApi.getMuscleGroups();
        const filters = [
          { id: 'Todos', label: 'Todos' },
          ...muscles.map((muscle) => ({
            id: muscle,
            label: muscle.charAt(0).toUpperCase() + muscle.slice(1),
          })),
        ];
        setMuscleFilters(filters);
      } catch (err) {
        console.error('Error cargando filtros:', err);
      }
    };
    loadFilters();
  }, []);

  useEffect(() => {
    fetchExercises();
  }, [activeMuscle]);

  const fetchExercises = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const muscleFilter = activeMuscle === 'Todos' ? undefined : activeMuscle;
      const data = await workoutApi.getExercises(muscleFilter);
      setExercises(data);
    } catch (err) {
      console.error(err);
      setErrorMessage('No pudimos cargar los ejercicios. Reintenta para seguir con tu rutina.');
    } finally {
      setLoading(false);
    }
  };

  const filteredExercises = exercises.filter((exercise) =>
    exercise.name.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelect = useCallback((exercise: Exercise) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(exercise.id)) {
        next.delete(exercise.id);
      } else {
        next.set(exercise.id, exercise);
      }
      return next;
    });
  }, []);

  const isAlreadyInRoutine = (exerciseId: string) => existingExerciseIds.includes(exerciseId);

  const handleConfirm = () => {
    const selectedExercises = Array.from(selected.values());
    if (selectedExercises.length === 0) return;

    if (mode === 'create') {
      navigation.navigate('CreateRoutine', { selectedExercises });
    } else if (mode === 'add-to-routine') {
      navigation.navigate('RoutineDetail', {
        routineId,
        newExercises: selectedExercises,
      });
    }

    showToast({
      title: 'Selección lista',
      message: `${selectedExercises.length} ejercicio${selectedExercises.length === 1 ? '' : 's'} preparado${selectedExercises.length === 1 ? '' : 's'} para continuar.`,
      variant: 'success',
    });
  };

  const selectedCount = selected.size;

  const renderExercise = ({ item }: { item: Exercise }) => {
    const isSelected = selected.has(item.id);
    const isDisabled = isAlreadyInRoutine(item.id);

    return (
      <ScaleTouchable
        style={styles.cardTouch}
        onPress={() => !isDisabled && toggleSelect(item)}
        variant="card"
        disabled={isDisabled}
      >
        <SurfaceCard
          style={[
            styles.exerciseCard,
            isSelected && styles.exerciseCardSelected,
            isDisabled && styles.exerciseCardDisabled,
          ]}
        >
          <View
            style={[
              styles.checkbox,
              isSelected && styles.checkboxSelected,
              isDisabled && styles.checkboxDisabled,
            ]}
          >
            {isSelected ? <MaterialIcons name="check" size={16} color={colors.onAccent} /> : null}
            {isDisabled ? <MaterialIcons name="remove" size={16} color={colors.textMuted} /> : null}
          </View>

          <View style={styles.exerciseInfo}>
            <Text style={[styles.exerciseName, isDisabled && styles.exerciseNameDisabled]}>{item.name}</Text>
            <View style={styles.tagsRow}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>{item.primary_muscle}</Text>
              </View>
              {item.equipment ? (
                <View style={[styles.tag, styles.tagSecondary]}>
                  <Text style={styles.tagText}>{item.equipment}</Text>
                </View>
              ) : null}
            </View>
          </View>

          <IconButton
            icon="info-outline"
            color={colors.textSecondary}
            onPress={() => setDetailExercise(item)}
            accessibilityLabel={`Ver detalle de ${item.name}`}
          />
        </SurfaceCard>
      </ScaleTouchable>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScreenHeader
        title="Añadir ejercicios"
        subtitle="Selecciona uno o varios movimientos para completar la rutina."
        left={<IconButton icon="close" onPress={() => navigation.goBack()} />}
      />

      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar ejercicio"
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialIcons name="close" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.filterWrapper}>
          <FlatList
            horizontal
            data={muscleFilters}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
            renderItem={({ item }) => {
              const isActive = activeMuscle === item.id;
              return (
                <ScaleTouchable
                  style={[styles.chip, isActive && styles.chipActive]}
                  onPress={() => setActiveMuscle(item.id)}
                  variant="ghost"
                >
                  <Text style={[styles.chipText, isActive && styles.chipTextActive]}>{item.label}</Text>
                </ScaleTouchable>
              );
            }}
          />
        </View>

        {errorMessage ? (
          <StateBanner message={errorMessage} variant="error" actionLabel="Reintentar" onActionPress={fetchExercises} />
        ) : null}

        {loading ? (
          <View style={styles.centeredState}>
            <StateCard
              icon="playlist-add"
              title="Cargando opciones"
              description="Estamos preparando el selector de ejercicios."
            />
          </View>
        ) : (
          <FlatList
            data={filteredExercises}
            keyExtractor={(item) => item.id}
            renderItem={renderExercise}
            contentContainerStyle={styles.listContent}
            initialNumToRender={12}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <StateCard
                icon="fitness-center"
                title="No encontramos ejercicios"
                description="Prueba otra búsqueda o cambia el filtro activo."
                actionLabel="Limpiar búsqueda"
                onActionPress={() => {
                  setSearch('');
                  setActiveMuscle('Todos');
                }}
              />
            }
          />
        )}
      </View>

      {selectedCount > 0 ? (
        <View style={[styles.bottomBar, { paddingBottom: getInsetBottomPadding(16, insets.bottom) }]}>
          <PremiumButton
            label={`Añadir ${selectedCount} ${selectedCount === 1 ? 'ejercicio' : 'ejercicios'}`}
            icon="check"
            onPress={handleConfirm}
          />
        </View>
      ) : null}

      <Modal visible={!!detailExercise} transparent animationType="slide" onRequestClose={() => setDetailExercise(null)}>
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} onPress={() => setDetailExercise(null)} activeOpacity={1} />

          {detailExercise ? (
            <SurfaceCard style={styles.modalContent}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>{detailExercise.name}</Text>

              <View style={styles.modalTags}>
                <Text style={styles.modalTagText}>
                  Músculo: <Text style={styles.modalTagValue}>{detailExercise.primary_muscle}</Text>
                </Text>
                <Text style={styles.modalTagText}>
                  Equipo: <Text style={styles.modalTagValue}>{detailExercise.equipment || 'Sin dato'}</Text>
                </Text>
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {EXERCISE_IMAGES[detailExercise.name] ? (
                  <Image
                    source={EXERCISE_IMAGES[detailExercise.name]}
                    style={styles.modalImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <MaterialIcons name="image-not-supported" size={48} color={colors.textMuted} />
                  </View>
                )}

                <Text style={styles.modalSectionTitle}>Instrucciones</Text>
                <Text style={styles.modalDescription}>
                  {detailExercise.instructions || 'Aún no hay instrucciones detalladas para este ejercicio.'}
                </Text>
              </ScrollView>

              <View style={styles.modalActions}>
                <PremiumButton
                  label={selected.has(detailExercise.id) ? 'Quitar selección' : 'Seleccionar'}
                  icon={selected.has(detailExercise.id) ? 'remove' : 'add'}
                  variant={selected.has(detailExercise.id) ? 'secondary' : 'primary'}
                  onPress={() => {
                    toggleSelect(detailExercise);
                    setDetailExercise(null);
                  }}
                />
              </View>
            </SurfaceCard>
          ) : null}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    gap: spacing.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.xs,
    color: colors.textPrimary,
    fontSize: 15,
  },
  filterWrapper: {
    minHeight: 46,
  },
  filterRow: {
    gap: spacing.sm,
  },
  chip: {
    minHeight: 38,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accentBorder,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  chipTextActive: {
    color: colors.accent,
  },
  centeredState: {
    paddingTop: spacing.xxl,
  },
  listContent: {
    gap: spacing.sm,
    paddingBottom: 120,
  },
  cardTouch: {
    borderRadius: radii.lg,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  exerciseCardSelected: {
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentSoft,
  },
  exerciseCardDisabled: {
    opacity: 0.5,
  },
  checkbox: {
    width: 30,
    height: 30,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkboxDisabled: {
    backgroundColor: colors.surface,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  exerciseNameDisabled: {
    color: colors.textMuted,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    backgroundColor: colors.accentSoft,
  },
  tagSecondary: {
    backgroundColor: colors.successSoft,
  },
  tagText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
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
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.72)',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: '84%',
    paddingBottom: 0,
  },
  modalHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  modalTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.md,
  },
  modalTagText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  modalTagValue: {
    color: colors.textPrimary,
    fontWeight: '700',
  },
  modalScroll: {
    flex: 1,
  },
  modalImage: {
    width: '100%',
    height: 220,
    borderRadius: radii.lg,
    marginBottom: spacing.md,
  },
  imagePlaceholder: {
    width: '100%',
    height: 180,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalSectionTitle: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  modalDescription: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: spacing.md,
  },
  modalActions: {
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});

export default ExercisePickerScreen;
