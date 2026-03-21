import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { workoutApi, RoutineResponse, RoutineCreateRequest, RoutineExerciseRequest, RoutineExerciseResponse } from '../features/workouts/api/workoutApi';

// Type for batch exercise creation
export type NewRoutineExercise = {
  exerciseId: string;
  name: string;
  muscle: string;
  sets: number;
  reps: number;
  weight: number;
};

export type ExerciseSet = {
  reps: number;
  weight: number;
};

export type RoutineExercise = {
  id?: string;
  exerciseId: string;
  name: string;
  sets: ExerciseSet[];
  orderIndex: number;
};

export type Routine = {
  id: string;
  name: string;
  muscleGroups: string[]; // derived or empty for now
  exercises: RoutineExercise[];
};

type RoutineContextType = {
  routines: Routine[];
  isLoading: boolean;
  refreshRoutines: () => Promise<void>;
  addExerciseToRoutine: (
    routineId: string | null,
    routineName: string,
    exerciseId: string,
    exerciseName: string,
    muscleGroup: string,
    weight: number,
    reps: number,
    setsCount: number
  ) => Promise<void>;
  createRoutineWithExercises: (name: string, exercises: NewRoutineExercise[]) => Promise<void>;
  addExercisesToRoutine: (routineId: string, exercises: NewRoutineExercise[]) => Promise<void>;
  getRoutineById: (id: string) => Routine | undefined;
  updateRoutineName: (
    id: string,
    newName: string
  ) => Promise<void>;
  updateExerciseInRoutine: (
    routineId: string,
    exerciseIndex: number,
    weight: number,
    reps: number,
    setsCount: number
  ) => Promise<void>;
  deleteExerciseFromRoutine: (routineId: string, exerciseIndex: number) => Promise<void>;
  deleteRoutine: (id: string) => Promise<void>;
};

const RoutineContext = createContext<RoutineContextType | undefined>(undefined);

export const RoutineProvider = ({ children }: { children: ReactNode }) => {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to map backend format to our local UI format
  const mapBackendToRoutine = (r: RoutineResponse): Routine => {
    // Derive muscle groups from exercise data
    const muscleGroups = [...new Set(
      r.exercises
        .map((e: RoutineExerciseResponse) => e.exercise_muscle)
        .filter(Boolean)
    )] as string[];

    return {
      id: r.id,
      name: r.name,
      muscleGroups,
      exercises: r.exercises.sort((a: RoutineExerciseResponse, b: RoutineExerciseResponse) => a.order_index - b.order_index).map((e: RoutineExerciseResponse) => ({
        id: e.id,
        exerciseId: e.exercise_id,
        name: e.exercise_name ?? 'Ejercicio desconocido',
        orderIndex: e.order_index,
        sets: Array.from({ length: e.target_sets || 3 }, () => ({
          reps: e.target_reps || 10,
          weight: e.target_weight_kg || 0
        }))
      }))
    };
  }

  const refreshRoutines = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await workoutApi.getRoutines();
      setRoutines(data.map(mapBackendToRoutine));
    } catch (error) {
      console.error("Failed to fetch routines", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshRoutines();
  }, [refreshRoutines]);

  const addExerciseToRoutine = async (
    routineId: string | null,
    routineName: string,
    exerciseId: string,
    exerciseName: string,
    muscleGroup: string, // currently unused in DB but kept for param signature
    weight: number,
    reps: number,
    setsCount: number
  ) => {
    try {
      // 1. If we have an existing routine, update it
      const existingRoutine = routines.find(r => r.id === routineId || r.name.toLowerCase() === routineName.trim().toLowerCase());
      
      const newExerciseRequest: RoutineExerciseRequest = {
        exercise_id: exerciseId,
        order_index: existingRoutine ? existingRoutine.exercises.length : 0,
        target_sets: setsCount,
        target_reps: reps,
        target_weight_kg: weight
      };

      if (existingRoutine) {
        // Map existing exercises to request format plus the new one
        const currentExercises: RoutineExerciseRequest[] = existingRoutine.exercises.map(e => ({
          exercise_id: e.exerciseId,
          order_index: e.orderIndex,
          target_sets: e.sets.length,
          target_reps: e.sets[0]?.reps || 10,
          target_weight_kg: e.sets[0]?.weight || 0
        }));
        
        currentExercises.push(newExerciseRequest);

        await workoutApi.updateRoutine(existingRoutine.id, {
          name: existingRoutine.name,
          exercises: currentExercises
        });
      } else {
        // 2. Create entirely new routine
        await workoutApi.createRoutine({
          name: routineName.trim(),
          exercises: [newExerciseRequest]
        });
      }
      
      await refreshRoutines();
    } catch (e) {
      console.error("Failed to add exercise to routine", e);
    }
  };

  const updateRoutineName = async (id: string, newName: string) => {
    try {
      const existing = routines.find(r => r.id === id);
      if (!existing) return;

      const exercisesReq: RoutineExerciseRequest[] = existing.exercises.map(e => ({
        exercise_id: e.exerciseId,
        order_index: e.orderIndex,
        target_sets: e.sets.length,
        target_reps: e.sets[0]?.reps || 10,
        target_weight_kg: e.sets[0]?.weight || 0
      }));

      await workoutApi.updateRoutine(id, { name: newName, exercises: exercisesReq });
      await refreshRoutines();
    } catch (e) {
      console.error("Failed to update routine name", e);
    }
  };

  const updateExerciseInRoutine = async (
    routineId: string,
    exerciseIndex: number,
    weight: number,
    reps: number,
    setsCount: number
  ) => {
    try {
      const existing = routines.find(r => r.id === routineId);
      if (!existing) return;

      const exercisesReq: RoutineExerciseRequest[] = existing.exercises.map((e, idx) => {
        if (idx === exerciseIndex) {
            return {
                exercise_id: e.exerciseId,
                order_index: e.orderIndex,
                target_sets: setsCount,
                target_reps: reps,
                target_weight_kg: weight
            };
        }
        return {
            exercise_id: e.exerciseId,
            order_index: e.orderIndex,
            target_sets: e.sets.length,
            target_reps: e.sets[0]?.reps || 10,
            target_weight_kg: e.sets[0]?.weight || 0
        };
      });

      await workoutApi.updateRoutine(routineId, { name: existing.name, exercises: exercisesReq });
      await refreshRoutines();
    } catch (e) {
      console.error("Failed to update exercise in routine", e);
    }
  };

  const deleteExerciseFromRoutine = async (routineId: string, exerciseIndex: number) => {
    try {
      const existing = routines.find(r => r.id === routineId);
      if (!existing) return;

      const exercisesReq: RoutineExerciseRequest[] = [];
      let newOrderIndex = 0;
      
      existing.exercises.forEach((e, idx) => {
        if (idx !== exerciseIndex) {
            exercisesReq.push({
                exercise_id: e.exerciseId,
                order_index: newOrderIndex++,
                target_sets: e.sets.length,
                target_reps: e.sets[0]?.reps || 10,
                target_weight_kg: e.sets[0]?.weight || 0
            });
        }
      });

      await workoutApi.updateRoutine(routineId, { name: existing.name, exercises: exercisesReq });
      await refreshRoutines();
    } catch (e) {
      console.error("Failed to delete exercise from routine", e);
    }
  };

  const deleteRoutine = async (id: string) => {
    try {
      await workoutApi.deleteRoutine(id);
      await refreshRoutines();
    } catch (e) {
      console.error("Failed to delete routine", e);
    }
  };

  // --- New batch methods ---

  const createRoutineWithExercises = async (name: string, exercises: NewRoutineExercise[]) => {
    try {
      const exercisesReq: RoutineExerciseRequest[] = exercises.map((e, idx) => ({
        exercise_id: e.exerciseId,
        order_index: idx,
        target_sets: e.sets,
        target_reps: e.reps,
        target_weight_kg: e.weight,
      }));
      await workoutApi.createRoutine({ name: name.trim(), exercises: exercisesReq });
      await refreshRoutines();
    } catch (e) {
      console.error('Failed to create routine with exercises', e);
      throw e;
    }
  };

  const addExercisesToRoutine = async (routineId: string, exercises: NewRoutineExercise[]) => {
    try {
      const existing = routines.find(r => r.id === routineId);
      if (!existing) return;

      const currentExercises: RoutineExerciseRequest[] = existing.exercises.map(e => ({
        exercise_id: e.exerciseId,
        order_index: e.orderIndex,
        target_sets: e.sets.length,
        target_reps: e.sets[0]?.reps || 10,
        target_weight_kg: e.sets[0]?.weight || 0,
      }));

      const newExercises: RoutineExerciseRequest[] = exercises.map((e, idx) => ({
        exercise_id: e.exerciseId,
        order_index: currentExercises.length + idx,
        target_sets: e.sets,
        target_reps: e.reps,
        target_weight_kg: e.weight,
      }));

      await workoutApi.updateRoutine(routineId, {
        name: existing.name,
        exercises: [...currentExercises, ...newExercises],
      });
      await refreshRoutines();
    } catch (e) {
      console.error('Failed to add exercises to routine', e);
      throw e;
    }
  };

  const getRoutineById = useCallback((id: string): Routine | undefined => {
    return routines.find(r => r.id === id);
  }, [routines]);

  return (
    <RoutineContext.Provider
      value={{
        routines,
        isLoading,
        refreshRoutines,
        addExerciseToRoutine,
        createRoutineWithExercises,
        addExercisesToRoutine,
        getRoutineById,
        updateRoutineName,
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
