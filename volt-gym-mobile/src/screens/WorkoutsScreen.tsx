import React, { useState } from 'react';
import {
  StyleSheet, View, Text, SafeAreaView, ScrollView,
  TouchableOpacity, Image, FlatList, Alert
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRoutines } from '../context/RoutineContext';

const WorkoutsScreen = ({ navigation }: any) => {
  const { routines, deleteRoutine, deleteExerciseFromRoutine } = useRoutines();
  const [expandedRoutineId, setExpandedRoutineId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedRoutineId(expandedRoutineId === id ? null : id);
  };

  const handleStartWorkout = () => {
    navigation.navigate('ActiveWorkout');
  };

  const handleCreateRoutine = () => {
    navigation.navigate('ExerciseList');
  };

  const confirmDeleteRoutine = (id: string, name: string) => {
    Alert.alert(
      'Eliminar Rutina',
      `¿Estás seguro de que quieres eliminar la rutina "${name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => deleteRoutine(id) }
      ]
    );
  };

  const confirmDeleteExercise = (routineId: string, exerciseId: string, exerciseName: string) => {
    Alert.alert(
      'Quitar Ejercicio',
      `¿Quitar "${exerciseName}" de esta rutina?`,
      [
        { text: 'No', style: 'cancel' },
        { text: 'Sí, quitar', style: 'destructive', onPress: () => deleteExerciseFromRoutine(routineId, exerciseId) }
      ]
    );
  };

  const renderRoutineCard = ({ item }: { item: any }) => {
    const isExpanded = expandedRoutineId === item.id;

    return (
      <View style={styles.card}>
        <TouchableOpacity 
          style={styles.cardHeader} 
          onPress={() => toggleExpand(item.id)}
          activeOpacity={0.7}
        >
          <View style={styles.cardHeaderInfo}>
            <Text style={styles.routineName}>{item.name}</Text>
            <Text style={styles.exerciseCount}>{item.exercises.length} ejercicios</Text>
          </View>
          
          <View style={styles.cardActions}>
            <TouchableOpacity onPress={() => confirmDeleteRoutine(item.id, item.name)} style={styles.iconBtn}>
              <MaterialIcons name="delete-outline" size={20} color="#555" />
            </TouchableOpacity>
            <MaterialIcons 
              name={isExpanded ? 'expand-less' : 'expand-more'} 
              size={24} 
              color="#FF4500" 
            />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.exerciseList}>
            {item.exercises.map((ex: any) => (
              <View key={ex.id} style={styles.exerciseItem}>
                <View style={styles.exerciseDetails}>
                  <Text style={styles.exerciseNameText}>{ex.exerciseName}</Text>
                  <Text style={styles.exerciseTarget}>{ex.muscle}</Text>
                </View>
                <View style={styles.exerciseStats}>
                  <Text style={styles.statLine}>{ex.sets} x {ex.reps} reps</Text>
                  <Text style={styles.statWeight}>{ex.weight} kg</Text>
                </View>
                <TouchableOpacity onPress={() => confirmDeleteExercise(item.id, ex.id, ex.exerciseName)}>
                  <MaterialIcons name="remove-circle-outline" size={18} color="#444" />
                </TouchableOpacity>
              </View>
            ))}
            
            <TouchableOpacity 
              style={styles.addExerciseToRoutineBtn}
              onPress={() => navigation.navigate('ExerciseList')}
            >
              <MaterialIcons name="add" size={20} color="#FF4500" />
              <Text style={styles.addExerciseText}>Añadir más</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Entrenamientos</Text>
        <TouchableOpacity style={styles.historyBtn}>
          <MaterialIcons name="history" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Quick Start Card */}
        <View style={[styles.card, styles.startCard]}>
          <View style={styles.startInfo}>
            <Text style={styles.startTitle}>Entreno libre</Text>
            <Text style={styles.startSubtitle}>Empieza una sesión desde cero</Text>
          </View>
          <TouchableOpacity style={styles.startBtn} onPress={handleStartWorkout}>
            <Text style={styles.startBtnText}>INICIAR</Text>
          </TouchableOpacity>
        </View>

        {/* Section Title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tus Rutinas</Text>
          <TouchableOpacity onPress={handleCreateRoutine}>
            <Text style={styles.addBtnText}>+ Crear nueva</Text>
          </TouchableOpacity>
        </View>

        {/* Routines List */}
        {routines.length > 0 ? (
          <FlatList
            data={routines}
            keyExtractor={(item) => item.id}
            renderItem={renderRoutineCard}
            scrollEnabled={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <MaterialIcons name="fitness-center" size={60} color="#222" />
            <Text style={styles.emptyText}>No tienes rutinas todavía</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={handleCreateRoutine}>
              <Text style={styles.emptyBtnText}>Explorar ejercicios</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
    color: '#FFF',
  },
  historyBtn: {
    padding: 8,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#111',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#222',
  },
  startCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A1A2E',
    borderColor: '#2A2A4E',
    paddingVertical: 25,
  },
  startTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  startSubtitle: {
    fontSize: 14,
    color: '#A0A0B8',
    marginTop: 4,
  },
  startBtn: {
    backgroundColor: '#FF4500',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  startBtnText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF4500',
  },
  addBtnText: {
    color: '#A0A0B8',
    fontSize: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  routineName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  exerciseCount: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    padding: 4,
  },
  exerciseList: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#161616',
    padding: 12,
    borderRadius: 10,
  },
  exerciseDetails: {
    flex: 1,
  },
  exerciseNameText: {
    color: '#DDD',
    fontSize: 15,
    fontWeight: '600',
  },
  exerciseTarget: {
    color: '#666',
    fontSize: 12,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  exerciseStats: {
    alignItems: 'flex-end',
    marginRight: 10,
  },
  statLine: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  statWeight: {
    color: '#FF4500',
    fontSize: 12,
    marginTop: 2,
  },
  addExerciseToRoutineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#333',
    borderRadius: 8,
    gap: 6,
  },
  addExerciseText: {
    color: '#FF4500',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 40,
    padding: 40,
  },
  emptyText: {
    color: '#444',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  emptyBtn: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  emptyBtnText: {
    color: '#FF4500',
    fontWeight: '600',
  }
});

export default WorkoutsScreen;
