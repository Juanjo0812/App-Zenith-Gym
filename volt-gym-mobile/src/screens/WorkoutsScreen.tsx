import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, TouchableOpacity, Alert, Modal, TextInput, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRoutines } from '../context/RoutineContext';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = {
  navigation: any; // Using any for quick integration, ideally use BottomTabNavigationProp combined with NativeStackNavigationProp
};

const WorkoutsScreen = ({ navigation }: Props) => {
  const { routines, deleteRoutine, deleteExerciseFromRoutine, updateRoutine, updateExerciseInRoutine } = useRoutines();
  const [expandedRoutineId, setExpandedRoutineId] = useState<string | null>(routines.length > 0 ? routines[0].id : null);

  // States for editing routine name
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [editedRoutineName, setEditedRoutineName] = useState('');

  // States for editing exercise
  const [editingExercise, setEditingExercise] = useState<{
    routineId: string;
    exerciseIndex: number;
    weight: string;
    reps: string;
    setsCount: string;
  } | null>(null);

  const toggleRoutine = (id: string) => {
    setExpandedRoutineId(expandedRoutineId === id ? null : id);
  };

  const confirmDeleteRoutine = (id: string, name: string) => {
    Alert.alert('Eliminar Rutina', `¿Seguro que quieres eliminar "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteRoutine(id) }
    ]);
  };

  const confirmDeleteExercise = (routineId: string, exerciseIndex: number, name: string) => {
    Alert.alert('Eliminar Ejercicio', `¿Seguro que quieres eliminar "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteExerciseFromRoutine(routineId, exerciseIndex) }
    ]);
  };

  const saveEditedRoutine = () => {
    if (editingRoutineId && editedRoutineName.trim()) {
      updateRoutine(editingRoutineId, editedRoutineName.trim());
      setEditingRoutineId(null);
    }
  };

  const saveEditedExercise = () => {
    if (editingExercise) {
      updateExerciseInRoutine(
        editingExercise.routineId,
        editingExercise.exerciseIndex,
        Number(editingExercise.weight) || 0,
        Number(editingExercise.reps) || 0,
        Number(editingExercise.setsCount) || 1
      );
      setEditingExercise(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Rutinas</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ExerciseList')}>
          <MaterialIcons name="search" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {routines.map((routine) => {
          const isExpanded = expandedRoutineId === routine.id;

          return (
            <View key={routine.id} style={styles.routineCard}>
              <TouchableOpacity
                style={styles.cardHeader}
                activeOpacity={0.7}
                onPress={() => toggleRoutine(routine.id)}
              >
                <View style={styles.cardTitleContainer}>
                  <Text style={styles.routineName}>{routine.name}</Text>
                  <Text style={styles.muscleGroups}>{routine.muscleGroups.join(' • ')}</Text>
                </View>
                
                <View style={styles.headerActions}>
                  <TouchableOpacity 
                    style={styles.actionIconBtn}
                    onPress={() => confirmDeleteRoutine(routine.id, routine.name)}
                  >
                    <MaterialIcons name="delete-outline" size={24} color="#FF4500" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.actionIconBtn}
                    onPress={() => {
                      setEditingRoutineId(routine.id);
                      setEditedRoutineName(routine.name);
                    }}
                  >
                    <MaterialIcons name="edit" size={24} color="#AAA" />
                  </TouchableOpacity>
                  <MaterialIcons 
                    name={isExpanded ? 'expand-less' : 'expand-more'} 
                    size={28} 
                    color="#FF4500" 
                  />
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.exercisesContainer}>
                  <View style={styles.divider} />
                  
                  {routine.exercises.map((exercise, index) => (
                    <View key={index} style={styles.exerciseItem}>
                      <View style={styles.exerciseHeader}>
                        <Text style={styles.exerciseName}>{exercise.name}</Text>
                        <View style={styles.exerciseActions}>
                          <TouchableOpacity 
                            onPress={() => {
                              setEditingExercise({
                                routineId: routine.id,
                                exerciseIndex: index,
                                weight: exercise.sets[0]?.weight?.toString() || '0',
                                reps: exercise.sets[0]?.reps?.toString() || '0',
                                setsCount: exercise.sets.length.toString()
                              });
                            }}
                            style={styles.smallActionBtn}
                          >
                            <MaterialIcons name="edit" size={18} color="#AAA" />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            onPress={() => confirmDeleteExercise(routine.id, index, exercise.name)}
                            style={styles.smallActionBtn}
                          >
                            <MaterialIcons name="close" size={18} color="#FF4500" />
                          </TouchableOpacity>
                        </View>
                      </View>
                      
                      <View style={styles.setsTable}>
                        <View style={styles.tableHead}>
                          <Text style={styles.tableHeadText}>Set</Text>
                          <Text style={styles.tableHeadText}>kg</Text>
                          <Text style={styles.tableHeadText}>Reps</Text>
                          <Text style={styles.tableHeadText}>✓</Text>
                        </View>
                        
                        {exercise.sets.map((set, setIdx) => (
                          <View key={setIdx} style={styles.tableRow}>
                            <Text style={styles.tableCell}>{setIdx + 1}</Text>
                            <Text style={[styles.tableCell, styles.tableCellData]}>{set.weight}</Text>
                            <Text style={[styles.tableCell, styles.tableCellData]}>{set.reps}</Text>
                            <TouchableOpacity style={styles.checkCircle}>
                              <MaterialIcons name="check" size={14} color="#111" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}

                  <TouchableOpacity 
                    style={styles.startWorkoutButton}
                    onPress={() => navigation.navigate('ActiveWorkout')}
                  >
                    <Text style={styles.startWorkoutText}>Iniciar Entreno</Text>
                    <MaterialIcons name="play-arrow" size={20} color="#000" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
        {routines.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tienes rutinas.{"\n"}Busca ejercicios y añádelos para crear una.</Text>
          </View>
        )}
      </ScrollView>

      {/* Edit Routine Modal */}
      <Modal visible={!!editingRoutineId} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView 
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={{ width: '100%', alignItems: 'center' }}
            >
              <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>Editar nombre</Text>
                <TextInput
                  style={styles.input}
                  value={editedRoutineName}
                  onChangeText={setEditedRoutineName}
                  placeholder="Nombre de la rutina"
                  placeholderTextColor="#666"
                  autoCapitalize="sentences"
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity onPress={() => setEditingRoutineId(null)} style={styles.modalBtn}>
                    <Text style={styles.modalBtnText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={saveEditedRoutine} style={[styles.modalBtn, styles.modalBtnPrimary]}>
                    <Text style={[styles.modalBtnText, styles.modalBtnTextPrimary]}>Guardar</Text>
                  </TouchableOpacity>
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
                
                <Text style={styles.inputLabel}>Series</Text>
                <TextInput 
                  style={styles.input} 
                  keyboardType="numeric" 
                  value={editingExercise?.setsCount} 
                  onChangeText={t => setEditingExercise(prev => prev ? {...prev, setsCount: t} : null)} 
                  returnKeyType="done"
                />

                <Text style={styles.inputLabel}>Reps (por set)</Text>
                <TextInput 
                  style={styles.input} 
                  keyboardType="numeric" 
                  value={editingExercise?.reps} 
                  onChangeText={t => setEditingExercise(prev => prev ? {...prev, reps: t} : null)} 
                  returnKeyType="done"
                />

                <Text style={styles.inputLabel}>kg (por set)</Text>
                <TextInput 
                  style={styles.input} 
                  keyboardType="numeric" 
                  value={editingExercise?.weight} 
                  onChangeText={t => setEditingExercise(prev => prev ? {...prev, weight: t} : null)} 
                  returnKeyType="done"
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity onPress={() => setEditingExercise(null)} style={styles.modalBtn}>
                    <Text style={styles.modalBtnText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={saveEditedExercise} style={[styles.modalBtn, styles.modalBtnPrimary]}>
                    <Text style={[styles.modalBtnText, styles.modalBtnTextPrimary]}>Guardar</Text>
                  </TouchableOpacity>
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
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#0F0F23',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A2E',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF4500', // VOLT Orange
  },
  scrollContent: {
    padding: 20,
    gap: 16,
    paddingBottom: 100, // Space for FAB
  },
  routineCard: {
    backgroundColor: '#111111',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222222',
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  cardTitleContainer: {
    flex: 1,
  },
  routineName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  muscleGroups: {
    fontSize: 13,
    color: '#A0A0B8',
  },
  exercisesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#2A2A4A',
    marginBottom: 16,
  },
  exerciseItem: {
    marginBottom: 16,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EAEAEA',
    marginBottom: 12,
  },
  setsTable: {
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 12,
  },
  tableHead: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  tableHeadText: {
    flex: 1,
    color: '#888888',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    alignItems: 'center',
    marginBottom: 4,
  },
  tableCell: {
    flex: 1,
    color: '#A0A0B8',
    fontSize: 14,
    textAlign: 'center',
  },
  tableCellData: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  checkCircle: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#00E676', // Success color
    marginHorizontal: 'auto',
  },
  startWorkoutButton: {
    flexDirection: 'row',
    backgroundColor: '#FF4500',
    padding: 14,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  startWorkoutText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  actionIconBtn: {
    padding: 4,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  exerciseActions: {
    flexDirection: 'row',
    gap: 8,
  },
  smallActionBtn: {
    padding: 4,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#888',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#1A1A1A',
    width: '100%',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#0F0F0F',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 12,
    color: '#FFF',
    marginBottom: 16,
    fontSize: 16,
  },
  inputLabel: {
    color: '#CCC',
    fontSize: 12,
    marginBottom: 6,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  modalBtnPrimary: {
    backgroundColor: '#FF4500',
  },
  modalBtnText: {
    color: '#AAA',
    fontWeight: 'bold',
    fontSize: 14,
  },
  modalBtnTextPrimary: {
    color: '#000',
  }
});

export default WorkoutsScreen;

