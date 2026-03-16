import apiClient from '../../../shared/api/apiClient';

export interface LogSetRequest {
  exercise_id: string;
  reps: number;
  weight_kg: number;
  rest_seconds?: number;
}

export interface WorkoutSessionResponse {
  session_id: string;
  status: string;
}

export const workoutApi = {
  startSession: async (routineId?: string): Promise<WorkoutSessionResponse> => {
    const response = await apiClient.post<WorkoutSessionResponse>('/workouts/sessions', {
      routine_id: routineId,
    });
    return response.data;
  },

  logSet: async (sessionId: string, data: LogSetRequest) => {
    const response = await apiClient.post(`/workouts/sessions/${sessionId}/sets`, data);
    return response.data;
  },

  completeSession: async (sessionId: string) => {
    const response = await apiClient.patch(`/workouts/sessions/${sessionId}`, {
      status: 'completed',
    });
    return response.data;
  },
};
