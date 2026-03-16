import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { MOCK_ROUTINES } from '../data/mockData';

const WorkoutsScreen = () => {
  const [expandedRoutineId, setExpandedRoutineId] = useState<string | null>(MOCK_ROUTINES[0].id);

  const toggleRoutine = (id: string) => {
    setExpandedRoutineId(expandedRoutineId === id ? null : id);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mis Rutinas</Text>
        <MaterialIcons name="search" size={28} color="#FFFFFF" />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {MOCK_ROUTINES.map((routine) => {
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
                <MaterialIcons 
                  name={isExpanded ? 'expand-less' : 'expand-more'} 
                  size={28} 
                  color="#FF4500" 
                />
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.exercisesContainer}>
                  <View style={styles.divider} />
                  
                  {routine.exercises.map((exercise, index) => (
                    <View key={index} style={styles.exerciseItem}>
                      <Text style={styles.exerciseName}>{exercise.name}</Text>
                      
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

                  <TouchableOpacity style={styles.startWorkoutButton}>
                    <Text style={styles.startWorkoutText}>Iniciar Entreno</Text>
                    <MaterialIcons name="play-arrow" size={20} color="#000" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
        <MaterialIcons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>
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
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF4500',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF4500',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  }
});

export default WorkoutsScreen;

