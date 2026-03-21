import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet, View, Text, FlatList,
  TouchableOpacity, TextInput, ActivityIndicator, Modal, Image, ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { workoutApi, Exercise } from '../features/workouts/api/workoutApi';
import ScaleTouchable from '../shared/ui/ScaleTouchable';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, getInsetBottomPadding } from '../theme/theme';

// Static image mapping (shared with ExerciseListScreen)
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
  const { mode, routineId, existingExerciseIds = [], routineName } = route.params || {};

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [muscleFilters, setMuscleFilters] = useState<{ id: string; label: string }[]>([{ id: 'Todos', label: 'Todos' }]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeMuscle, setActiveMuscle] = useState('Todos');
  const [selected, setSelected] = useState<Map<string, Exercise>>(new Map());
  const [detailExercise, setDetailExercise] = useState<Exercise | null>(null);

  // Load muscle filters
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const muscles = await workoutApi.getMuscleGroups();
        const filters = [
          { id: 'Todos', label: 'Todos' },
          ...muscles.map((m) => ({ id: m, label: m.charAt(0).toUpperCase() + m.slice(1) }))
        ];
        setMuscleFilters(filters);
      } catch (err) {
        console.error('Error cargando filtros:', err);
      }
    };
    loadFilters();
  }, []);

  // Load exercises when muscle filter changes
  useEffect(() => {
    fetchExercises();
  }, [activeMuscle]);

  const fetchExercises = async () => {
    setLoading(true);
    try {
      const muscleFilter = activeMuscle === 'Todos' ? undefined : activeMuscle;
      const data = await workoutApi.getExercises(muscleFilter);
      setExercises(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredExercises = exercises.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
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
      // Go back to CreateRoutine with selected exercises
      navigation.navigate('CreateRoutine', { selectedExercises });
    } else if (mode === 'add-to-routine') {
      // Go back to RoutineDetail with selected exercises
      navigation.navigate('RoutineDetail', {
        routineId,
        newExercises: selectedExercises,
      });
    }
  };

  const selectedCount = selected.size;

  const renderExercise = ({ item }: { item: Exercise }) => {
    const isSelected = selected.has(item.id);
    const isDisabled = isAlreadyInRoutine(item.id);

    return (
      <TouchableOpacity
        style={[
          styles.exerciseCard,
          isSelected && styles.exerciseCardSelected,
          isDisabled && styles.exerciseCardDisabled,
        ]}
        onPress={() => !isDisabled && toggleSelect(item)}
        activeOpacity={isDisabled ? 1 : 0.7}
      >
        {/* Checkbox */}
        <View style={[
          styles.checkbox,
          isSelected && styles.checkboxSelected,
          isDisabled && styles.checkboxDisabled,
        ]}>
          {isSelected && <MaterialIcons name="check" size={16} color={colors.onAccent} />}
          {isDisabled && <MaterialIcons name="remove" size={16} color="#666" />}
        </View>

        {/* Exercise info */}
        <View style={styles.exerciseInfo}>
          <Text style={[styles.exerciseName, isDisabled && styles.textDisabled]}>{item.name}</Text>
          <View style={styles.tagsRow}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{item.primary_muscle}</Text>
            </View>
            {item.equipment && (
              <View style={[styles.tag, styles.equipTag]}>
                <Text style={styles.tagText}>{item.equipment}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Info button */}
        <TouchableOpacity
          style={styles.infoBtn}
          onPress={(e) => {
            e.stopPropagation?.();
            setDetailExercise(item);
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="info-outline" size={22} color="#666" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <MaterialIcons name="close" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Añadir ejercicios</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#888" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar ejercicio..."
          placeholderTextColor="#666"
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <MaterialIcons name="close" size={18} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Chips */}
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
              <TouchableOpacity
                style={[styles.chip, isActive && styles.chipActive]}
                onPress={() => setActiveMuscle(item.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Exercise List */}
      {loading ? (
        <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredExercises}
          keyExtractor={(item) => item.id}
          renderItem={renderExercise}
          contentContainerStyle={styles.listContent}
          initialNumToRender={12}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No se encontraron ejercicios</Text>
          }
        />
      )}

      {/* Floating confirm button */}
      {selectedCount > 0 && (
        <View style={[styles.floatingBar, { paddingBottom: getInsetBottomPadding(24, insets.bottom) }]}>
          <ScaleTouchable
            style={styles.confirmBtn}
            onPress={handleConfirm}
          >
            <Text style={styles.confirmBtnText}>
              Añadir {selectedCount} {selectedCount === 1 ? 'ejercicio' : 'ejercicios'}
            </Text>
            <MaterialIcons name="check" size={20} color={colors.onAccent} />
          </ScaleTouchable>
        </View>
      )}

      {/* Exercise Detail Modal */}
      <Modal
        visible={!!detailExercise}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailExercise(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBgTap} onPress={() => setDetailExercise(null)} activeOpacity={1} />

          {detailExercise && (
            <View style={styles.modalContent}>
              <View style={styles.modalHandle} />
              <Text style={styles.modalTitle}>{detailExercise.name}</Text>

              <View style={styles.modalTags}>
                <Text style={styles.modalTagText}>
                  Músculo: <Text style={{ color: '#FFF' }}>{detailExercise.primary_muscle}</Text>
                </Text>
                <Text style={styles.modalTagText}>
                  Equipo: <Text style={{ color: '#FFF' }}>{detailExercise.equipment}</Text>
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
                    <MaterialIcons name="image-not-supported" size={48} color="#333" />
                  </View>
                )}

                <Text style={styles.modalSectionTitle}>Instrucciones</Text>
                <Text style={styles.modalDescription}>
                  {detailExercise.instructions || 'Sin instrucciones disponibles para este ejercicio.'}
                </Text>
              </ScrollView>

              {/* Add/remove from selection */}
              <View style={styles.modalActions}>
                <ScaleTouchable
                  style={[
                    styles.modalActionBtn,
                    selected.has(detailExercise.id) ? styles.modalActionBtnRemove : styles.modalActionBtnAdd,
                  ]}
                  onPress={() => {
                    toggleSelect(detailExercise);
                    setDetailExercise(null);
                  }}
                >
                  <MaterialIcons
                    name={selected.has(detailExercise.id) ? 'remove' : 'add'}
                    size={20}
                    color={selected.has(detailExercise.id) ? colors.textPrimary : colors.onAccent}
                  />
                  <Text style={[
                    styles.modalActionBtnText,
                    selected.has(detailExercise.id) && { color: '#FFF' },
                  ]}>
                    {selected.has(detailExercise.id) ? 'Quitar selección' : 'Seleccionar'}
                  </Text>
                </ScaleTouchable>
              </View>
            </View>
          )}
        </View>
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
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceAlt,
    margin: 16, marginBottom: 8, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
  },
  searchInput: { flex: 1, color: colors.textPrimary, marginLeft: 8, fontSize: 15 },

  // Filter chips
  filterWrapper: { height: 50, marginBottom: 8 },
  filterRow: { paddingHorizontal: 16, gap: 10, alignItems: 'center' },
  chip: {
    paddingHorizontal: 16, height: 36, borderRadius: 18,
    backgroundColor: colors.surfaceAlt, borderWidth: 1.5, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: colors.textPrimary },

  // List
  listContent: { padding: 16, gap: 10, paddingBottom: 100 },
  exerciseCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: 14, padding: 14, borderWidth: 1.5, borderColor: colors.border,
  },
  exerciseCardSelected: {
    borderColor: colors.accent, backgroundColor: colors.accentSoft,
  },
  exerciseCardDisabled: { opacity: 0.4 },
  checkbox: {
    width: 28, height: 28, borderRadius: 8, borderWidth: 2, borderColor: colors.border,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  checkboxSelected: {
    backgroundColor: colors.accent, borderColor: colors.accent,
  },
  checkboxDisabled: {
    backgroundColor: colors.surfaceAlt, borderColor: colors.border,
  },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
  textDisabled: { color: colors.textMuted },
  tagsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tag: {
    backgroundColor: colors.accentSoft, paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 6,
  },
  equipTag: { backgroundColor: 'rgba(0,230,118,0.12)' },
  tagText: { color: colors.textSecondary, fontSize: 11, fontWeight: '500' },
  infoBtn: { padding: 8 },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 40, fontSize: 15 },

  // Floating bar
  floatingBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16,
    backgroundColor: colors.chrome,
    borderTopWidth: 1, borderTopColor: colors.border,
  },
  confirmBtn: {
    flexDirection: 'row', backgroundColor: colors.accent, borderRadius: 14,
    paddingVertical: 16, justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  confirmBtnText: { color: colors.onAccent, fontWeight: '900', fontSize: 16, letterSpacing: 0.5 },

  // Detail modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalBgTap: { flex: 1 },
  modalContent: {
    backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, maxHeight: '80%', borderColor: colors.border, borderWidth: 1,
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: '#333', borderRadius: 2,
    alignSelf: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 8 },
  modalTags: {
    flexDirection: 'row', gap: 16, marginBottom: 16, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  modalTagText: { fontSize: 14, color: colors.textMuted, fontWeight: '500' },
  modalScroll: { maxHeight: 360 },
  modalImage: { width: '100%', height: 200, marginBottom: 16, borderRadius: 12 },
  imagePlaceholder: {
    width: '100%', height: 150, backgroundColor: colors.surfaceAlt, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  modalSectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.accent, marginBottom: 8 },
  modalDescription: { fontSize: 14, color: colors.textSecondary, lineHeight: 22, marginBottom: 16 },
  modalActions: { paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border },
  modalActionBtn: {
    flexDirection: 'row', borderRadius: 12, paddingVertical: 14,
    justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  modalActionBtnAdd: { backgroundColor: colors.accent },
  modalActionBtnRemove: { backgroundColor: colors.surfaceAlt },
  modalActionBtnText: { fontWeight: '800', fontSize: 15, color: colors.onAccent },
});

export default ExercisePickerScreen;
