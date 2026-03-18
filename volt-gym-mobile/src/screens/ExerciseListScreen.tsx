import React, { useEffect, useState } from 'react';
import {
  StyleSheet, View, Text, SafeAreaView, FlatList,
  TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal, Image, ScrollView,
  KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { workoutApi, Exercise } from '../features/workouts/api/workoutApi';
import { useRoutines } from '../context/RoutineContext';

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
  
  // Modal state
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [routineName, setRoutineName] = useState('');
  const [setsCount, setSetsCount] = useState('3');
  const [repsCount, setRepsCount] = useState('10');
  const [weightVal, setWeightVal] = useState('0');

  const { addExerciseToRoutine } = useRoutines();

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
    setShowConfigForm(false);
    setRoutineName('');
    setSetsCount('3');
    setRepsCount('10');
    setWeightVal('0');
  };

  const addExerciseToWorkout = () => {
    // If sessionId exists, this was opened from ActiveWorkout
    if (selectedExercise && sessionId) {
      navigation.navigate('ActiveWorkout', { 
        sessionId, 
        addExercise: selectedExercise 
      });
      closeModal();
    } else {
      // Toggle form
      setShowConfigForm(true);
    }
  };

  const confirmAddToRoutine = async () => {
    if (!routineName.trim() || !selectedExercise) {
      Alert.alert('Error', 'Por favor, ingresa el nombre de la rutina.');
      return;
    }

    try {
      await addExerciseToRoutine(
        null, // No routine ID for new exercise to a potentially new routine, logic in context handles it by name
        routineName,
        selectedExercise.id,
        selectedExercise.name,
        selectedExercise.primary_muscle,
        Number(weightVal) || 0,
        Number(repsCount) || 10,
        Number(setsCount) || 3
      );
      Alert.alert('Éxito', `${selectedExercise.name} se añadió a la rutina "${routineName}".`);
      closeModal();
    } catch (e) {
      Alert.alert('Error', 'Hubo un problema al añadir el ejercicio');
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
      <MaterialIcons
        name="chevron-right"
        size={24}
        color="#555"
      />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
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
      </View>

      {/* Filter Chips - Fixed dimensions */}
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
        <ActivityIndicator size="large" color="#FF4500" style={{ marginTop: 40 }} />
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
                  Músculo: <Text style={{color: '#FFF'}}>{selectedExercise.primary_muscle}</Text>
                </Text>
                <Text style={styles.modalTagText}>
                  Equipo: <Text style={{color: '#FFF'}}>{selectedExercise.equipment}</Text>
                </Text>
              </View>

              <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
              >
                <ScrollView 
                  style={styles.modalScroll} 
                  contentContainerStyle={{ paddingBottom: 250 }}
                  showsVerticalScrollIndicator={false}
                >
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

                  {showConfigForm && (
                    <View style={styles.configForm}>
                      <Text style={styles.modalSectionTitle}>Configurar ejercicio</Text>
                      
                      <Text style={styles.inputLabel}>Nombre o enfoque de la rutina</Text>
                      <TextInput
                        style={styles.inputField}
                        placeholder="Ej. Empuje hipertrofia"
                        placeholderTextColor="#666"
                        value={routineName}
                        onChangeText={setRoutineName}
                        autoCapitalize="sentences"
                      />

                      <View style={styles.rowInputs}>
                        <View style={styles.inputWrap}>
                          <Text style={styles.inputLabel}>Series</Text>
                          <TextInput
                            style={styles.inputField}
                            keyboardType="numeric"
                            value={setsCount}
                            onChangeText={setSetsCount}
                            returnKeyType="done"
                          />
                        </View>
                        <View style={styles.inputWrap}>
                          <Text style={styles.inputLabel}>Reps</Text>
                          <TextInput
                            style={styles.inputField}
                            keyboardType="numeric"
                            value={repsCount}
                            onChangeText={setRepsCount}
                            returnKeyType="done"
                          />
                        </View>
                        <View style={styles.inputWrap}>
                          <Text style={styles.inputLabel}>kg</Text>
                          <TextInput
                            style={styles.inputField}
                            keyboardType="numeric"
                            value={weightVal}
                            onChangeText={setWeightVal}
                            returnKeyType="done"
                          />
                        </View>
                      </View>

                      <TouchableOpacity style={styles.confirmButton} onPress={confirmAddToRoutine}>
                        <Text style={styles.confirmButtonText}>Añadir a rutina</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </ScrollView>
              </KeyboardAvoidingView>

              {!showConfigForm && (
                <TouchableOpacity style={styles.addButton} onPress={addExerciseToWorkout}>
                  <MaterialIcons name="add" size={28} color="#000" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </Modal>

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, backgroundColor: '#0F0F23', borderBottomWidth: 1, borderBottomColor: '#1A1A2E',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FF4500' },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#1A1A1A',
    margin: 16, marginBottom: 8, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
  },
  searchInput: { flex: 1, color: '#FFF', marginLeft: 8, fontSize: 15 },
  
  // Fixed size chip filters
  filterWrapper: { height: 50, marginBottom: 8 },
  filterRow: { paddingHorizontal: 16, gap: 10, alignItems: 'center' },
  chip: {
    width: 100, 
    height: 36, 
    borderRadius: 18,
    backgroundColor: '#1A1A1A', 
    borderWidth: 1.5, 
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipActive: { backgroundColor: '#FF4500', borderColor: '#FF4500' },
  chipText: { color: '#AAA', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#FFF' },
  
  // List
  listContent: { padding: 16, gap: 10, paddingBottom: 40 },
  exerciseCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#111',
    borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#222',
  },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 16, fontWeight: '700', color: '#FFF', marginBottom: 8 },
  tagsRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  tag: {
    backgroundColor: 'rgba(255,69,0,0.15)', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8,
  },
  equipTag: { backgroundColor: 'rgba(0,230,118,0.12)' },
  diffTag: { backgroundColor: 'rgba(100,100,255,0.12)' },
  tagText: { color: '#CCC', fontSize: 11, fontWeight: '500' },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 40, fontSize: 15 },

  // Modal styling
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalBgTap: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#111',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 0,
    minHeight: '85%',
    maxHeight: '88%',
    borderColor: '#222',
    borderWidth: 1,
  },
  modalScroll: {
    flex: 1,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  modalTags: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  modalTagText: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  modalImage: {
    width: '100%',
    height: 200,
    marginBottom: 20,
    borderRadius: 12,
  },
  imagePlaceholder: {
    width: '100%',
    height: 150,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF4500',
    marginBottom: 10,
  },
  modalDescription: {
    fontSize: 14,
    color: '#CCC',
    lineHeight: 22,
    marginBottom: 20,
  },
  addButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF4500',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#FF4500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  configForm: {
    marginTop: 10,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  inputLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 6,
    fontWeight: 'bold',
  },
  inputField: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 12,
    color: '#FFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 16,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  inputWrap: {
    flex: 1,
  },
  confirmButton: {
    backgroundColor: '#FF4500',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  confirmButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default ExerciseListScreen;
