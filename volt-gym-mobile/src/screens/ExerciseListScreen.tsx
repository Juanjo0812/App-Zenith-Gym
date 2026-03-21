import React, { useEffect, useState } from 'react';
import {
  StyleSheet, View, Text, FlatList,
  TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal, Image, ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { workoutApi, Exercise } from '../features/workouts/api/workoutApi';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/theme';

// Static image mapping for React Native
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

const ExerciseListScreen = ({ navigation, route }: Props) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [muscleFilters, setMuscleFilters] = useState<{ id: string; label: string }[]>([{ id: 'Todos', label: 'Todos' }]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeMuscle, setActiveMuscle] = useState('Todos');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);

  const sessionId: string | undefined = route.params?.sessionId;

  // Load muscle filters from DB on mount
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
      Alert.alert('Error', 'No se pudieron cargar los ejercicios.');
    } finally {
      setLoading(false);
    }
  };

  const filteredExercises = exercises.filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (exercise: Exercise) => {
    setSelectedExercise(exercise);
  };

  const closeModal = () => {
    setSelectedExercise(null);
  };

  // If opened from ActiveWorkout, allow adding exercise to session
  const handleAddToSession = () => {
    if (selectedExercise && sessionId) {
      navigation.navigate('ActiveWorkout', {
        sessionId,
        addExercise: selectedExercise,
      });
      closeModal();
    }
  };

  const renderExercise = ({ item }: { item: Exercise }) => (
    <TouchableOpacity style={styles.exerciseCard} onPress={() => handleSelect(item)} activeOpacity={0.7}>
      <View style={styles.exerciseInfo}>
        <Text style={styles.exerciseName}>{item.name}</Text>
        <View style={styles.tagsRow}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{item.primary_muscle}</Text>
          </View>
          {item.equipment && (
            <View style={[styles.tag, styles.equipTag]}>
              <Text style={styles.tagText}>{item.equipment}</Text>
            </View>
          )}
          {item.difficulty && (
            <View style={[styles.tag, styles.diffTag]}>
              <Text style={styles.tagText}>{item.difficulty}</Text>
            </View>
          )}
        </View>
      </View>
      <MaterialIcons name="chevron-right" size={24} color="#555" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ejercicios</Text>
        <View style={{ width: 24 }} />
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
          initialNumToRender={10}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No se encontraron ejercicios</Text>
          }
        />
      )}

      {/* Exercise Detail Modal */}
      <Modal
        visible={!!selectedExercise}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBgTap} onPress={closeModal} activeOpacity={1} />

          {selectedExercise && (
            <View style={styles.modalContent}>
              <View style={styles.modalHandle} />

              <Text style={styles.modalTitle}>{selectedExercise.name}</Text>

              <View style={styles.modalTags}>
                <Text style={styles.modalTagText}>
                  Músculo: <Text style={{ color: '#FFF' }}>{selectedExercise.primary_muscle}</Text>
                </Text>
                <Text style={styles.modalTagText}>
                  Equipo: <Text style={{ color: '#FFF' }}>{selectedExercise.equipment}</Text>
                </Text>
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {EXERCISE_IMAGES[selectedExercise.name] ? (
                  <Image
                    source={EXERCISE_IMAGES[selectedExercise.name]}
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
                  {selectedExercise.instructions || 'Sin instrucciones disponibles para este ejercicio.'}
                </Text>
              </ScrollView>

              {/* Add to session button (only if opened from ActiveWorkout) */}
              {sessionId && (
                <View style={styles.modalActions}>
                  <TouchableOpacity style={styles.addToSessionBtn} onPress={handleAddToSession}>
                    <MaterialIcons name="add" size={20} color={colors.onAccent} />
                    <Text style={styles.addToSessionBtnText}>Añadir al entreno</Text>
                  </TouchableOpacity>
                </View>
              )}
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
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.accent },
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
  listContent: { padding: 16, gap: 10, paddingBottom: 40 },
  exerciseCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface,
    borderRadius: 14, padding: 16, borderWidth: 1, borderColor: colors.border,
  },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
  tagsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tag: {
    backgroundColor: colors.accentSoft, paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8,
  },
  equipTag: { backgroundColor: 'rgba(0,230,118,0.12)' },
  diffTag: { backgroundColor: 'rgba(100,100,255,0.12)' },
  tagText: { color: colors.textSecondary, fontSize: 11, fontWeight: '500' },
  emptyText: { color: colors.textMuted, textAlign: 'center', marginTop: 40, fontSize: 15 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalBgTap: { flex: 1 },
  modalContent: {
    backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 0, minHeight: '70%', maxHeight: '85%',
    borderColor: colors.border, borderWidth: 1,
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: '#333', borderRadius: 2,
    alignSelf: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 8 },
  modalTags: {
    flexDirection: 'row', gap: 16, marginBottom: 20, paddingBottom: 20,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  modalTagText: { fontSize: 14, color: colors.textMuted, fontWeight: '500' },
  modalScroll: { flex: 1 },
  modalImage: { width: '100%', height: 200, marginBottom: 20, borderRadius: 12 },
  imagePlaceholder: {
    width: '100%', height: 150, backgroundColor: colors.surfaceAlt, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  modalSectionTitle: { fontSize: 16, fontWeight: 'bold', color: colors.accent, marginBottom: 10 },
  modalDescription: { fontSize: 14, color: colors.textSecondary, lineHeight: 22, marginBottom: 20 },
  modalActions: {
    paddingVertical: 16, borderTopWidth: 1, borderTopColor: colors.border,
  },
  addToSessionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: colors.accent, borderRadius: 14, paddingVertical: 14,
  },
  addToSessionBtnText: { color: colors.onAccent, fontWeight: '800', fontSize: 16 },
});

export default ExerciseListScreen;
