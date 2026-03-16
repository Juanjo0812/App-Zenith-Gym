import React, { createContext, useContext, useState, ReactNode } from 'react';
import { MOCK_ROUTINES } from '../data/mockData';

export type ExerciseSet = {
  reps: number;
  weight: number;
};

export type RoutineExercise = {
  name: string;
  sets: ExerciseSet[];
};

export type Routine = {
  id: string;
  name: string;
  muscleGroups: string[];
  exercises: RoutineExercise[];
};

type RoutineContextType = {
  routines: Routine[];
  addExerciseToRoutine: (
    routineName: string,
    exerciseName: string,
    muscleGroup: string,
    weight: number,
    reps: number,
    setsCount: number
  ) => void;
  updateRoutine: (
    id: string,
    newName: string
  ) => void;
  updateExerciseInRoutine: (
    routineId: string,
    exerciseIndex: number,
    weight: number,
    reps: number,
    setsCount: number
  ) => void;
  deleteExerciseFromRoutine: (routineId: string, exerciseIndex: number) => void;
  deleteRoutine: (id: string) => void;
};

const RoutineContext = createContext<RoutineContextType | undefined>(undefined);

export const RoutineProvider = ({ children }: { children: ReactNode }) => {
  const [routines, setRoutines] = useState<Routine[]>(MOCK_ROUTINES);

  const addExerciseToRoutine = (
    routineName: string,
    exerciseName: string,
    muscleGroup: string,
    weight: number,
    reps: number,
    setsCount: number
  ) => {
    setRoutines((prev) => {
      const existingRoutineIndex = prev.findIndex((r) => r.name.toLowerCase() === routineName.trim().toLowerCase());
      
      const newSets = Array.from({ length: setsCount }, () => ({ reps, weight }));
      
      if (existingRoutineIndex >= 0) {
        // Add to existing routine
        const updated = [...prev];
        const routine = updated[existingRoutineIndex];
        
        // Add muscle group if not exists
        if (!routine.muscleGroups.includes(muscleGroup)) {
          routine.muscleGroups.push(muscleGroup);
        }
        
        // Add exercise
        routine.exercises.push({
          name: exerciseName,
          sets: newSets,
        });
        
        return updated;
      } else {
        // Create new routine
        return [
          ...prev,
          {
            id: Date.now().toString(),
            name: routineName.trim(),
            muscleGroups: [muscleGroup],
            exercises: [
              {
                name: exerciseName,
                sets: newSets,
              }
            ]
          }
        ];
      }
    });
  };

  const updateRoutine = (id: string, newName: string) => {
    setRoutines((prev) => 
      prev.map((r) => (r.id === id ? { ...r, name: newName } : r))
    );
  };

  const updateExerciseInRoutine = (
    routineId: string,
    exerciseIndex: number,
    weight: number,
    reps: number,
    setsCount: number
  ) => {
    setRoutines((prev) => {
      const updated = [...prev];
      const routineIndex = updated.findIndex((r) => r.id === routineId);
      if (routineIndex >= 0) {
        const routine = updated[routineIndex];
        if (routine.exercises[exerciseIndex]) {
          routine.exercises[exerciseIndex].sets = Array.from({ length: setsCount }, () => ({
            weight,
            reps,
          }));
        }
      }
      return updated;
    });
  };

  const deleteExerciseFromRoutine = (routineId: string, exerciseIndex: number) => {
    setRoutines((prev) => {
      const updated = [...prev];
      const routineIndex = updated.findIndex((r) => r.id === routineId);
      if (routineIndex >= 0) {
        updated[routineIndex].exercises.splice(exerciseIndex, 1);
      }
      return updated;
    });
  };

  const deleteRoutine = (id: string) => {
    setRoutines((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <RoutineContext.Provider
      value={{
        routines,
        addExerciseToRoutine,
        updateRoutine,
        updateExerciseInRoutine,
        deleteExerciseFromRoutine,
        deleteRoutine,
      }}
    >
      {children}
    </RoutineContext.Provider>
  );
};

export const useRoutines = () => {
  const context = useContext(RoutineContext);
  if (context === undefined) {
    throw new Error('useRoutines must be used within a RoutineProvider');
  }
  return context;
};
