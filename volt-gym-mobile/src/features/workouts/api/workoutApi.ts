import apiClient from '../../../shared/api/apiClient';

// ── Types ──────────────────────────────────────────────

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

export interface StartSessionResponse {
  session_id: string;
  status: string;
}

export interface LogSetResponse {
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

// ── API Calls ──────────────────────────────────────────

export const workoutApi = {
  /** Fetch exercise library with optional filters */
  getExercises: async (muscle?: string, equipment?: string): Promise<Exercise[]> => {
    const params: Record<string, string> = {};
    if (muscle) params.muscle = muscle;
    if (equipment) params.equipment = equipment;
    const { data } = await apiClient.get<Exercise[]>('/exercises', { params });
    return data;
  },

  /** Create a new workout session */
  startSession: async (routineId?: string): Promise<StartSessionResponse> => {
    const { data } = await apiClient.post<StartSessionResponse>('/workouts/sessions', {
      routine_id: routineId ?? null,
    });
    return data;
  },

  /** Log a single set into an active session */
  logSet: async (
    sessionId: string,
    exerciseId: string,
    reps: number,
    weightKg: number,
    restSeconds: number = 0,
  ): Promise<LogSetResponse> => {
    const { data } = await apiClient.post<LogSetResponse>(
      `/workouts/sessions/${sessionId}/sets`,
      {
        exercise_id: exerciseId,
        reps,
        weight_kg: weightKg,
        rest_seconds: restSeconds,
      },
    );
    return data;
  },

  /** Complete a session and get XP results */
  completeSession: async (sessionId: string): Promise<CompleteSessionResponse> => {
    const { data } = await apiClient.patch<CompleteSessionResponse>(
      `/workouts/sessions/${sessionId}`,
      { status: 'completed' },
    );
    return data;
  },
};
