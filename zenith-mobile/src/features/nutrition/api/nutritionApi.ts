import apiClient from '../../../shared/api/apiClient';

export interface NutritionTargets {
  id?: string;
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fats: number;
  water_ml: number;
  date: string;
}

export interface MealLog {
  id: string;
  food_name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  meal_type: string;
  serving_size: string | null;
  notes: string | null;
  logged_at: string;
}

export interface LogMealPayload {
  food_name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  meal_type?: string;
  serving_size?: string;
  notes?: string;
}

export interface SetNutritionTargetsPayload {
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fats: number;
  water_ml: number;
}

export interface DailySummary {
  date: string;
  targets: NutritionTargets | null;
  consumed: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
  meals: MealLog[];
  water_ml: number;
  water_goal_ml: number;
}

export interface WaterLog {
  id: string;
  amount_ml: number;
  logged_at: string;
}

export interface WeekDaySummary {
  date: string;
  calories_consumed: number;
  calories_target: number;
  protein: number;
  carbs: number;
  fats: number;
  meal_count: number;
}

export const nutritionApi = {
  getDailySummary: async (date?: string): Promise<DailySummary> => {
    const params = date ? { target_date: date } : {};
    const { data } = await apiClient.get('/nutrition/summary', { params });
    return data;
  },

  getTargets: async (date?: string): Promise<NutritionTargets> => {
    const params = date ? { target_date: date } : {};
    const { data } = await apiClient.get('/nutrition/targets', { params });
    return data;
  },

  setTargets: async (
    targets: SetNutritionTargetsPayload,
    date?: string
  ): Promise<NutritionTargets> => {
    const params = date ? { target_date: date } : {};
    const { data } = await apiClient.put('/nutrition/targets', targets, { params });
    return data;
  },

  logMeal: async (meal: LogMealPayload): Promise<MealLog> => {
    const { data } = await apiClient.post('/nutrition/meals', meal);
    return data;
  },

  getMeals: async (date?: string): Promise<MealLog[]> => {
    const params = date ? { target_date: date } : {};
    const { data } = await apiClient.get('/nutrition/meals', { params });
    return data;
  },

  deleteMeal: async (mealId: string): Promise<void> => {
    await apiClient.delete(`/nutrition/meals/${mealId}`);
  },

  logWater: async (amount_ml: number): Promise<WaterLog> => {
    const { data } = await apiClient.post('/nutrition/water', { amount_ml });
    return data;
  },

  getWaterLogs: async (date?: string): Promise<WaterLog[]> => {
    const params = date ? { target_date: date } : {};
    const { data } = await apiClient.get('/nutrition/water', { params });
    return data;
  },

  getWeeklySummary: async (): Promise<WeekDaySummary[]> => {
    const { data } = await apiClient.get('/nutrition/weekly');
    return data;
  },
};
