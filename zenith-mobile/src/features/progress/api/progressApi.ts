import apiClient from '../../../shared/api/apiClient';

// ─── Types ───────────────────────────────────────────────────────

export interface Badge {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  condition_type: string;
  condition_value: number;
  xp_reward: number;
  unlocked: boolean;
  unlocked_at: string | null;
}

export interface Challenge {
  id: string;
  name: string;
  description: string | null;
  goal_type: string;
  goal_value: number;
  current_value: number;
  xp_reward: number;
  start_date: string;
  end_date: string;
  days_left: number;
  completed: boolean;
  joined: boolean;
}

export interface ProgressOverview {
  level: number;
  total_xp: number;
  xp_next_level: number;
  total_workouts: number;
  streak: number;
  prs: number;
  member_since: string;
  badges: Badge[];
  challenges: Challenge[];
}

export interface WeightLog {
  id: string;
  weight_kg: number;
  date: string;
  notes: string | null;
  logged_at: string;
}

export interface StrengthGain {
  exercise_name: string;
  first_max_kg: number;
  current_max_kg: number;
  improvement_kg: number;
  improvement_pct: number;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  xp: number;
  is_current_user: boolean;
}

// ─── API ─────────────────────────────────────────────────────────

export const progressApi = {
  /** Resumen completo: nivel, XP, medallas, retos */
  getOverview: async (): Promise<ProgressOverview> => {
    const { data } = await apiClient.get('/progress/overview');
    return data;
  },

  /** Historial de peso */
  getWeightHistory: async (limit = 20): Promise<WeightLog[]> => {
    const { data } = await apiClient.get('/progress/weight', { params: { limit } });
    return data;
  },

  /** Registrar peso */
  logWeight: async (weight_kg: number, dateStr?: string, notes?: string): Promise<WeightLog> => {
    const payload: Record<string, unknown> = { weight_kg };
    if (dateStr) payload.date = dateStr;
    if (notes) payload.notes = notes;
    const { data } = await apiClient.post('/progress/weight', payload);
    return data;
  },

  /** Eliminar registro de peso */
  deleteWeight: async (logId: string): Promise<void> => {
    await apiClient.delete(`/progress/weight/${logId}`);
  },

  /** Ganancias de fuerza */
  getStrengthGains: async (): Promise<StrengthGain[]> => {
    const { data } = await apiClient.get('/progress/strength');
    return data;
  },

  /** Leaderboard */
  getLeaderboard: async (limit = 10): Promise<LeaderboardEntry[]> => {
    const { data } = await apiClient.get('/progress/leaderboard', { params: { limit } });
    return data;
  },
};
