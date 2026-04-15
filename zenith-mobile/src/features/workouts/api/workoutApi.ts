import apiClient from '../../../shared/api/apiClient';

export interface Exercise {
  id: string;
  name: string;
  primary_muscle: string;
  secondary_muscles: string[];
  equipment: string | null;
  difficulty: string | null;
  instructions: string | null;
  video_url: string | null;
}

export interface RoutineExerciseRequest {
  exercise_id: string;
  order_index: number;
  target_sets?: number;
  target_reps?: number;
  target_weight_kg?: number;
}

export interface RoutineExerciseResponse {
  id: string;
  routine_id: string;
  exercise_id: string;
  order_index: number;
  target_sets: number;
  target_reps: number;
  target_weight_kg: number;
  exercise_name?: string;
  exercise_muscle?: string;
}

export interface RoutineCreateRequest {
  name: string;
  exercises: RoutineExerciseRequest[];
}

export interface RoutineResponse {
  id: string;
  name: string;
  is_ai_generated: boolean;
  exercises: RoutineExerciseResponse[];
}

export interface StartSessionResponse {
  session_id: string;
  status?: string;
}

export interface SetLogRequest {
  reps: number;
  weight_kg: number;
  rest_seconds?: number;
}

export interface SetLogResponse {
  set_id: string;
  status: string;
}

export interface CompleteSessionResponse {
  session_id: string;
  xp_earned: number;
  new_total_xp: number;
  new_level: number;
  leveled_up: boolean;
}

export const workoutApi = {
  getExercises: async (muscle?: string, equipment?: string): Promise<Exercise[]> => {
    const { data } = await apiClient.get<Exercise[]>('/exercises', {
      params: {
        muscle,
        equipment,
      },
    });
    return data ?? [];
  },

  getMuscleGroups: async (): Promise<string[]> => {
    const exercises = await workoutApi.getExercises();
    const muscles = [...new Set(exercises.map((exercise) => exercise.primary_muscle))];
    return muscles.sort();
  },

  getRoutines: async (): Promise<RoutineResponse[]> => {
    const { data } = await apiClient.get<RoutineResponse[]>('/workouts/routines');
    return data ?? [];
  },

  createRoutine: async (routineData: RoutineCreateRequest): Promise<RoutineResponse> => {
    const { data } = await apiClient.post<RoutineResponse>('/workouts/routines', routineData);
    return data;
  },

  updateRoutine: async (routineId: string, routineData: RoutineCreateRequest): Promise<RoutineResponse> => {
    const { data } = await apiClient.put<RoutineResponse>(`/workouts/routines/${routineId}`, routineData);
    return data;
  },

  deleteRoutine: async (routineId: string): Promise<void> => {
    await apiClient.delete(`/workouts/routines/${routineId}`);
  },

  startSession: async (routineId?: string): Promise<StartSessionResponse> => {
    const payload = routineId ? { routine_id: routineId } : {};
    const { data } = await apiClient.post<StartSessionResponse>('/workouts/sessions', payload);
    return data;
  },

  logSet: async (
    sessionId: string,
    exerciseId: string,
    setData: SetLogRequest
  ): Promise<SetLogResponse> => {
    const { data } = await apiClient.post<SetLogResponse>(
      `/workouts/sessions/${sessionId}/sets`,
      {
        exercise_id: exerciseId,
        reps: setData.reps,
        weight_kg: setData.weight_kg,
        rest_seconds: setData.rest_seconds ?? 0,
      }
    );
    return data;
  },

  completeSession: async (sessionId: string): Promise<CompleteSessionResponse> => {
    const { data } = await apiClient.patch<CompleteSessionResponse>(
      `/workouts/sessions/${sessionId}`,
      { status: 'completed' }
    );
    return data;
  },
};
