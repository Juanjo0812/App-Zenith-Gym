import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AxiosRequestConfig, AxiosRequestHeaders, AxiosResponse } from 'axios';

import { MOCK_CHAT, MOCK_PROGRESS } from '../data/mockData';

const ENABLED_KEY = 'zenith.demo.enabled';
const STATE_KEY = 'zenith.demo.state';

export const DEMO_CREDENTIALS = {
  identifier: 'Juanjo',
  password: '0812',
  email: 'juanjo@zenith.local',
};

type DemoState = {
  profile: {
    id: string;
    name: string;
    username: string;
    avatar_url: string | null;
    profile_image_url: string | null;
    phone: string | null;
    phone_number: string | null;
    address: string | null;
    email: string;
    level: number;
    total_xp: number;
    roles: string[];
    created_at: string;
    updated_at: string | null;
  };
  dashboard: {
    lastWorkout: { name: string; date: string; duration: string } | null;
    weeklyCount: number;
    todayCalories: { consumed: number; target: number };
  };
  stats: { totalWorkouts: number; streak: number; prs: number; memberSince: string };
  exercises: Array<Record<string, any>>;
  routines: Array<Record<string, any>>;
  classTypes: Array<Record<string, any>>;
  schedule: Array<Record<string, any>>;
  nutritionTargets: {
    id: string;
    target_calories: number;
    target_protein: number;
    target_carbs: number;
    target_fats: number;
    water_ml: number;
    date: string;
  };
  meals: Array<Record<string, any>>;
  waterLogs: Array<Record<string, any>>;
  weeklySummary: Array<Record<string, any>>;
  weightHistory: Array<Record<string, any>>;
  strengthGains: Array<Record<string, any>>;
  badges: Array<Record<string, any>>;
  challenges: Array<Record<string, any>>;
  leaderboard: Array<Record<string, any>>;
  nextRoutineId: number;
  nextMealId: number;
  nextWaterId: number;
  nextWeightId: number;
  nextSessionId: number;
  nextSetId: number;
  activeSession: { sessionId: string; routineId?: string } | null;
};

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const today = new Date();
const iso = (date: Date) => date.toISOString().split('T')[0];
const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const exerciseCatalog = [
  {
    id: 'ex-bench',
    name: 'Press de banca',
    primary_muscle: 'Pecho',
    secondary_muscles: ['Tríceps', 'Hombros'],
    equipment: 'Barra',
    difficulty: 'Intermedio',
    instructions: 'Baja la barra con control y empuja sin rebotar.',
    video_url: null,
  },
  {
    id: 'ex-incline',
    name: 'Press inclinado con mancuernas',
    primary_muscle: 'Pecho superior',
    secondary_muscles: ['Tríceps', 'Hombros'],
    equipment: 'Mancuernas',
    difficulty: 'Intermedio',
    instructions: 'Usa una inclinación moderada y controla la subida.',
    video_url: null,
  },
  {
    id: 'ex-row',
    name: 'Remo con barra',
    primary_muscle: 'Espalda',
    secondary_muscles: ['Bíceps', 'Core'],
    equipment: 'Barra',
    difficulty: 'Intermedio',
    instructions: 'Mantén la espalda neutra y lleva la barra al ombligo.',
    video_url: null,
  },
  {
    id: 'ex-pull',
    name: 'Dominadas',
    primary_muscle: 'Espalda',
    secondary_muscles: ['Bíceps', 'Core'],
    equipment: 'Peso corporal',
    difficulty: 'Avanzado',
    instructions: 'Sube el pecho hacia la barra y baja de forma controlada.',
    video_url: null,
  },
  {
    id: 'ex-press',
    name: 'Press militar',
    primary_muscle: 'Hombros',
    secondary_muscles: ['Tríceps', 'Core'],
    equipment: 'Barra',
    difficulty: 'Intermedio',
    instructions: 'Aprieta el abdomen y empuja en línea recta.',
    video_url: null,
  },
  {
    id: 'ex-rdl',
    name: 'Peso muerto rumano',
    primary_muscle: 'Isquiotibiales',
    secondary_muscles: ['Glúteos', 'Espalda baja'],
    equipment: 'Barra',
    difficulty: 'Intermedio',
    instructions: 'Lleva la cadera atrás y deja la barra cerca del cuerpo.',
    video_url: null,
  },
  {
    id: 'ex-legpress',
    name: 'Prensa de piernas',
    primary_muscle: 'Piernas',
    secondary_muscles: ['Glúteos', 'Cuádriceps'],
    equipment: 'Máquina',
    difficulty: 'Intermedio',
    instructions: 'Baja con control y no bloquees por completo las rodillas.',
    video_url: null,
  },
  {
    id: 'ex-curl',
    name: 'Curl con barra',
    primary_muscle: 'Bíceps',
    secondary_muscles: ['Antebrazos'],
    equipment: 'Barra',
    difficulty: 'Principiante',
    instructions: 'Mantén los codos pegados al torso y evita el impulso.',
    video_url: null,
  },
  {
    id: 'ex-triceps',
    name: 'Extensión de tríceps en polea',
    primary_muscle: 'Tríceps',
    secondary_muscles: ['Hombros'],
    equipment: 'Polea',
    difficulty: 'Principiante',
    instructions: 'Fija los codos y extiende sin cargar los hombros.',
    video_url: null,
  },
  {
    id: 'ex-squat',
    name: 'Sentadilla con barra',
    primary_muscle: 'Piernas',
    secondary_muscles: ['Glúteos', 'Core'],
    equipment: 'Barra',
    difficulty: 'Intermedio',
    instructions: 'Desciende con la espalda firme y empuja las rodillas hacia afuera.',
    video_url: null,
  },
];

const makeRoutineExercise = (routineId: string, exerciseId: string, index: number, sets: number, reps: number, weight: number) => {
  const exercise = exerciseCatalog.find((item) => item.id === exerciseId);
  return {
    id: `${routineId}-${exerciseId}`,
    routine_id: routineId,
    exercise_id: exerciseId,
    order_index: index,
    target_sets: sets,
    target_reps: reps,
    target_weight_kg: weight,
    exercise_name: exercise?.name,
    exercise_muscle: exercise?.primary_muscle,
  };
};

const buildState = (): DemoState => {
  const classTypes = [
    { id: 'strength', name: 'Fuerza Zenith', description: 'Trabajo de carga y técnica.', color: '#00E5FF', icon: 'fitness-center' },
    { id: 'mobility', name: 'Movilidad Zenith', description: 'Preparación y recuperación.', color: '#33B5FF', icon: 'self-improvement' },
    { id: 'cardio', name: 'Cardio Zenith', description: 'Resistencia y ritmo sostenido.', color: '#2D7DFF', icon: 'directions-run' },
  ];

  const schedule = [
    { id: 'class-1', class_type: classTypes[0], instructor_name: 'Coach Andrea', scheduled_date: iso(today), start_time: '06:30', end_time: '07:20', max_capacity: 18, enrolled_count: 14, location: 'Sala principal', notes: 'Sesión demo local.', is_cancelled: false, is_enrolled: true },
    { id: 'class-2', class_type: classTypes[1], instructor_name: 'Coach Andrea', scheduled_date: iso(addDays(today, 1)), start_time: '18:00', end_time: '18:45', max_capacity: 16, enrolled_count: 10, location: 'Estudio 2', notes: null, is_cancelled: false, is_enrolled: false },
    { id: 'class-3', class_type: classTypes[2], instructor_name: 'Coach Andrea', scheduled_date: iso(addDays(today, 2)), start_time: '07:00', end_time: '07:45', max_capacity: 20, enrolled_count: 16, location: 'Zona cardio', notes: null, is_cancelled: false, is_enrolled: false },
  ];

  const nutritionTargets = {
    id: 'nutrition-demo',
    target_calories: 2400,
    target_protein: 170,
    target_carbs: 260,
    target_fats: 75,
    water_ml: 2800,
    date: iso(today),
  };

  const meals = [
    { id: 'meal-1', food_name: 'Avena con proteína y banano', calories: 520, protein: 34, carbs: 62, fats: 13, meal_type: 'desayuno', serving_size: '1 plato', notes: 'Buen arranque para energía sostenida.', logged_at: `${iso(today)}T07:15:00.000Z` },
    { id: 'meal-2', food_name: 'Pollo con arroz y vegetales', calories: 780, protein: 55, carbs: 74, fats: 22, meal_type: 'almuerzo', serving_size: '1 porción', notes: null, logged_at: `${iso(today)}T13:10:00.000Z` },
    { id: 'meal-3', food_name: 'Yogur griego con nueces', calories: 310, protein: 20, carbs: 18, fats: 18, meal_type: 'snack', serving_size: '1 taza', notes: 'Antes del entreno.', logged_at: `${iso(today)}T16:45:00.000Z` },
  ];

  const waterLogs = [
    { id: 'water-1', amount_ml: 500, logged_at: `${iso(today)}T08:00:00.000Z` },
    { id: 'water-2', amount_ml: 750, logged_at: `${iso(today)}T11:30:00.000Z` },
    { id: 'water-3', amount_ml: 500, logged_at: `${iso(today)}T15:30:00.000Z` },
  ];

  const weeklySummary = Array.from({ length: 7 }, (_, index) => {
    const day = addDays(today, index - 6);
    return { date: iso(day), calories_consumed: 2100 - index * 35, calories_target: 2400, protein: 140 - index * 2, carbs: 220 + index * 4, fats: 68 - index, meal_count: 3 + (index % 2) };
  });

  return {
    profile: { id: 'demo-user', name: 'Juanjo', username: 'juanjo', avatar_url: 'https://i.pravatar.cc/150?u=juanjo-zenith', profile_image_url: 'https://i.pravatar.cc/150?u=juanjo-zenith', phone: '0812', phone_number: '0812', address: 'Modo demo local', email: DEMO_CREDENTIALS.email, level: 5, total_xp: 2180, roles: ['athlete'], created_at: iso(addDays(today, -120)), updated_at: iso(today) },
    dashboard: { lastWorkout: { name: 'Empuje Zenith', date: 'Hoy', duration: '1h 05m' }, weeklyCount: 4, todayCalories: { consumed: 1610, target: 2400 } },
    stats: { totalWorkouts: 42, streak: 7, prs: 11, memberSince: iso(addDays(today, -120)) },
    exercises: exerciseCatalog,
    routines: [
      { id: 'routine-push', name: 'Empuje Zenith', is_ai_generated: false, exercises: [makeRoutineExercise('routine-push', 'ex-bench', 0, 4, 8, 75), makeRoutineExercise('routine-push', 'ex-incline', 1, 3, 10, 28), makeRoutineExercise('routine-push', 'ex-triceps', 2, 3, 12, 20)] },
      { id: 'routine-pull', name: 'Tracción Zenith', is_ai_generated: true, exercises: [makeRoutineExercise('routine-pull', 'ex-pull', 0, 4, 6, 0), makeRoutineExercise('routine-pull', 'ex-row', 1, 4, 8, 70), makeRoutineExercise('routine-pull', 'ex-curl', 2, 3, 10, 30)] },
      { id: 'routine-legs', name: 'Piernas Zenith', is_ai_generated: false, exercises: [makeRoutineExercise('routine-legs', 'ex-squat', 0, 4, 8, 100), makeRoutineExercise('routine-legs', 'ex-legpress', 1, 4, 12, 200), makeRoutineExercise('routine-legs', 'ex-rdl', 2, 3, 10, 80)] },
    ],
    classTypes,
    schedule,
    nutritionTargets,
    meals,
    waterLogs,
    weeklySummary,
    weightHistory: [
      { id: 'weight-1', weight_kg: 76.1, date: iso(addDays(today, -21)), notes: 'Inicio del bloque de fuerza.', logged_at: `${iso(addDays(today, -21))}T07:00:00.000Z` },
      { id: 'weight-2', weight_kg: 76.4, date: iso(addDays(today, -14)), notes: null, logged_at: `${iso(addDays(today, -14))}T07:00:00.000Z` },
      { id: 'weight-3', weight_kg: 76.8, date: iso(addDays(today, -7)), notes: 'Buena recuperación.', logged_at: `${iso(addDays(today, -7))}T07:00:00.000Z` },
    ],
    strengthGains: [
      { exercise_name: 'Press de banca', first_max_kg: 70, current_max_kg: 85, improvement_kg: 15, improvement_pct: 21.4 },
      { exercise_name: 'Sentadilla con barra', first_max_kg: 100, current_max_kg: 120, improvement_kg: 20, improvement_pct: 20 },
      { exercise_name: 'Peso muerto rumano', first_max_kg: 90, current_max_kg: 110, improvement_kg: 20, improvement_pct: 22.2 },
    ],
    badges: (MOCK_PROGRESS.badges as Array<Record<string, any>>).map((badge, index) => ({
      id: badge.id || `badge-${index + 1}`,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      condition_type: 'workouts',
      condition_value: index + 1,
      xp_reward: 50 + index * 25,
      unlocked: true,
      unlocked_at: `${iso(addDays(today, -(30 - index * 5)))}T10:00:00.000Z`,
    })),
    challenges: [
      { id: 'challenge-1', name: 'Marzo constante', description: 'Completa 12 sesiones en el mes.', goal_type: 'workouts', goal_value: 12, current_value: 8, xp_reward: 180, start_date: iso(addDays(today, -12)), end_date: iso(addDays(today, 18)), days_left: 18, completed: false, joined: true },
      { id: 'challenge-2', name: 'Hidratación Zen', description: 'Mantén 2.8 L diarios.', goal_type: 'water', goal_value: 2800, current_value: 2100, xp_reward: 90, start_date: iso(addDays(today, -4)), end_date: iso(addDays(today, 3)), days_left: 3, completed: false, joined: true },
    ],
    leaderboard: (MOCK_PROGRESS.leaderboard as Array<Record<string, any>>).map((entry) => ({
      rank: entry.rank,
      name: entry.name === 'Juanjo08' ? 'Juanjo' : entry.name,
      xp: entry.xp,
      is_current_user: entry.name === 'Juanjo08',
    })),
    nextRoutineId: 100,
    nextMealId: 10,
    nextWaterId: 10,
    nextWeightId: 10,
    nextSessionId: 1,
    nextSetId: 1,
    activeSession: null,
  };
};

let enabledCache: boolean | null = null;
let stateCache: DemoState | null = null;
let loadPromise: Promise<DemoState> | null = null;

const loadState = async () => {
  if (stateCache) return stateCache;
  if (!loadPromise) {
    loadPromise = (async () => {
      const raw = await AsyncStorage.getItem(STATE_KEY);
      if (!raw) return buildState();
      try {
        return { ...buildState(), ...JSON.parse(raw) } as DemoState;
      } catch {
        return buildState();
      }
    })();
  }
  stateCache = await loadPromise;
  loadPromise = null;
  return stateCache;
};

const saveState = async (state: DemoState) => {
  stateCache = clone(state);
  await AsyncStorage.setItem(STATE_KEY, JSON.stringify(stateCache));
  return stateCache;
};

const updateState = async (mutator: (state: DemoState) => void | DemoState) => {
  const draft = clone(await loadState());
  const next = mutator(draft) ?? draft;
  return saveState(next);
};

const response = <T,>(config: AxiosRequestConfig, data: T): Promise<AxiosResponse<T>> =>
  Promise.resolve({
    data,
    status: 200,
    statusText: 'OK',
    headers: {} as AxiosResponse<T>['headers'],
    config: { ...config, headers: (config.headers ?? {}) as AxiosRequestHeaders },
    request: {},
  });

const pathOf = (config: AxiosRequestConfig) => {
  const raw = config.url ?? '';
  const pathname = raw.startsWith('http') ? new URL(raw).pathname : raw;
  return pathname.replace(/^\/api\/v1/, '') || '/';
};

export const isDemoModeEnabled = async () => {
  if (enabledCache !== null) {
    return enabledCache;
  }

  const stored = await AsyncStorage.getItem(ENABLED_KEY);
  enabledCache = stored === 'true';
  return enabledCache;
};

export const enableDemoMode = async () => {
  enabledCache = true;
  await AsyncStorage.setItem(ENABLED_KEY, 'true');
  await saveState(buildState());
};

export const disableDemoMode = async () => {
  enabledCache = false;
  stateCache = null;
  loadPromise = null;
  await AsyncStorage.multiRemove([ENABLED_KEY, STATE_KEY]);
};

export const matchesDemoCredentials = (identifier: string, password: string) => {
  const normalized = identifier.trim().toLowerCase();
  return password === DEMO_CREDENTIALS.password && ['juanjo', 'juanjo@zenith.local', 'juanjo@zenith.app'].includes(normalized);
};

export const getDemoProfile = async () => (await loadState()).profile;

export const updateDemoProfile = async (updates: Partial<DemoState['profile']>) =>
  updateState((state) => {
    state.profile = {
      ...state.profile,
      ...updates,
      profile_image_url: updates.avatar_url ?? state.profile.profile_image_url,
      phone_number: updates.phone ?? state.profile.phone_number,
      updated_at: new Date().toISOString(),
    };
  });

export const getDemoDashboard = async () => (await loadState()).dashboard;

export const getDemoStats = async () => (await loadState()).stats;

export const updateDemoStats = async (updates: Partial<DemoState['stats']>) =>
  updateState((state) => {
    state.stats = { ...state.stats, ...updates };
  });

export const getDemoExercises = async () => (await loadState()).exercises;
export const getDemoRoutines = async () => (await loadState()).routines;
export const updateDemoRoutines = async (updater: (items: DemoState['routines']) => DemoState['routines']) =>
  updateState((state) => {
    state.routines = updater(clone(state.routines));
  });

export const getDemoClassTypes = async () => (await loadState()).classTypes;
export const getDemoSchedule = async () => (await loadState()).schedule;
export const updateDemoSchedule = async (updater: (items: DemoState['schedule']) => DemoState['schedule']) =>
  updateState((state) => {
    state.schedule = updater(clone(state.schedule));
  });

export const getDemoNutritionTargets = async () => (await loadState()).nutritionTargets;
export const updateDemoNutritionTargets = async (updates: Partial<DemoState['nutritionTargets']>) =>
  updateState((state) => {
    state.nutritionTargets = { ...state.nutritionTargets, ...updates };
  });

export const getDemoMeals = async () => (await loadState()).meals;
export const updateDemoMeals = async (updater: (items: DemoState['meals']) => DemoState['meals']) =>
  updateState((state) => {
    state.meals = updater(clone(state.meals));
  });

export const getDemoWaterLogs = async () => (await loadState()).waterLogs;
export const updateDemoWaterLogs = async (updater: (items: DemoState['waterLogs']) => DemoState['waterLogs']) =>
  updateState((state) => {
    state.waterLogs = updater(clone(state.waterLogs));
  });

export const getDemoWeeklySummary = async () => (await loadState()).weeklySummary;
export const getDemoWeightHistory = async () => (await loadState()).weightHistory;
export const updateDemoWeightHistory = async (updater: (items: DemoState['weightHistory']) => DemoState['weightHistory']) =>
  updateState((state) => {
    state.weightHistory = updater(clone(state.weightHistory));
  });

export const getDemoStrengthGains = async () => (await loadState()).strengthGains;
export const getDemoLeaderboard = async () => (await loadState()).leaderboard;
export const getDemoBadges = async () => (await loadState()).badges;
export const getDemoChallenges = async () => (await loadState()).challenges;

const buildOverview = async () => {
  const state = await loadState();
  return {
    level: state.profile.level,
    total_xp: state.profile.total_xp,
    xp_next_level: (state.profile.level + 1) * 500,
    total_workouts: state.stats.totalWorkouts,
    streak: state.stats.streak,
    prs: state.stats.prs,
    member_since: state.stats.memberSince,
    badges: clone(state.badges),
    challenges: clone(state.challenges),
  };
};

const buildDailySummary = async () => {
  const state = await loadState();
  const consumed = state.meals.reduce(
    (accumulator, meal) => ({
      calories: accumulator.calories + Number(meal.calories ?? 0),
      protein: accumulator.protein + Number(meal.protein ?? 0),
      carbs: accumulator.carbs + Number(meal.carbs ?? 0),
      fats: accumulator.fats + Number(meal.fats ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  return {
    date: iso(today),
    targets: clone(state.nutritionTargets),
    consumed,
    meals: clone(state.meals),
    water_ml: state.waterLogs.reduce((total, item) => total + Number(item.amount_ml ?? 0), 0),
    water_goal_ml: state.nutritionTargets.water_ml,
  };
};

const parseData = <T,>(config: AxiosRequestConfig): T | undefined => {
  if (typeof config.data === 'string') {
    try {
      return JSON.parse(config.data) as T;
    } catch {
      return undefined;
    }
  }
  if (config.data && typeof config.data === 'object') {
    return config.data as T;
  }
  return undefined;
};

const createSessionResult = async (sessionId: string) => {
  const state = await loadState();
  const session = state.activeSession;
  const routine = session?.routineId ? state.routines.find((item) => item.id === session.routineId) : null;
  const xpEarned = routine ? 140 : 80;
  const newTotalXp = state.profile.total_xp + xpEarned;
  const newLevel = Math.max(1, Math.floor(newTotalXp / 500) + 1);

  await updateState((draft) => {
    draft.profile.total_xp = newTotalXp;
    draft.profile.level = newLevel;
    draft.stats.totalWorkouts += 1;
    draft.dashboard = {
      ...draft.dashboard,
      lastWorkout: {
        name: routine?.name ?? 'Entreno rápido',
        date: 'Hoy',
        duration: routine ? '1h 05m' : '35m',
      },
      weeklyCount: draft.dashboard.weeklyCount + 1,
    };
    draft.activeSession = null;
  });

  return {
    session_id: sessionId,
    xp_earned: xpEarned,
    new_total_xp: newTotalXp,
    new_level: newLevel,
    leveled_up: newLevel > state.profile.level,
  };
};

const getExerciseMeta = (exerciseId: string, fallbackName?: string, fallbackMuscle?: string) => {
  const exercise = exerciseCatalog.find((item) => item.id === exerciseId);
  return {
    name: exercise?.name ?? fallbackName ?? 'Ejercicio',
    muscle: exercise?.primary_muscle ?? fallbackMuscle ?? 'Músculo',
  };
};

const buildRoutineExerciseFromPayload = (routineId: string, exercise: Record<string, any>, index: number) => {
  const exerciseId = String(exercise.exercise_id ?? exercise.exerciseId ?? `exercise-${index}`);
  const meta = getExerciseMeta(exerciseId, exercise.name, exercise.muscle);
  return {
    id: `${routineId}-${exerciseId}`,
    routine_id: routineId,
    exercise_id: exerciseId,
    order_index: Number(exercise.order_index ?? index) || index,
    target_sets: Number(exercise.target_sets ?? exercise.sets ?? 3) || 3,
    target_reps: Number(exercise.target_reps ?? exercise.reps ?? 10) || 10,
    target_weight_kg: Number(exercise.target_weight_kg ?? exercise.weight ?? 0) || 0,
    exercise_name: meta.name,
    exercise_muscle: meta.muscle,
  };
};

export const handleDemoRequest = async (config: AxiosRequestConfig): Promise<AxiosResponse> => {
  const path = pathOf(config);
  const method = (config.method ?? 'get').toLowerCase();

  if (path === '/users/me' && method === 'get') return response(config, await getDemoProfile());
  if (path === '/users/me/dashboard' && method === 'get') return response(config, await getDemoDashboard());
  if (path === '/users/me/stats' && method === 'get') return response(config, await getDemoStats());

  if (path === '/users/me' && method === 'patch') {
    const payload = parseData<Partial<DemoState['profile']>>(config) ?? {};
    await updateDemoProfile({
      name: payload.name,
      username: payload.username,
      phone: payload.phone ?? payload.phone_number ?? undefined,
      avatar_url: payload.avatar_url ?? payload.profile_image_url ?? undefined,
      address: payload.address ?? undefined,
    });
    return response(config, await getDemoProfile());
  }

  if (path === '/exercises' && method === 'get') {
    const state = await loadState();
    const muscle = String((config.params as { muscle?: string } | undefined)?.muscle ?? '').trim().toLowerCase();
    const equipment = String((config.params as { equipment?: string } | undefined)?.equipment ?? '').trim().toLowerCase();
    const filtered = state.exercises.filter((exercise) => {
      const matchesMuscle =
        !muscle ||
        String(exercise.primary_muscle ?? '').toLowerCase().includes(muscle) ||
        (exercise.secondary_muscles ?? []).some((item: string) => item.toLowerCase().includes(muscle));
      const matchesEquipment = !equipment || String(exercise.equipment ?? '').toLowerCase().includes(equipment);
      return matchesMuscle && matchesEquipment;
    });
    return response(config, filtered);
  }

  if (path === '/workouts/routines' && method === 'get') return response(config, await getDemoRoutines());

  if (path === '/workouts/routines' && method === 'post') {
    const payload = parseData<{ name?: string; exercises?: Array<Record<string, any>> }>(config) ?? {};
    const state = await loadState();
    const routineId = `routine-demo-${state.nextRoutineId}`;
    const routine = {
      id: routineId,
      name: payload.name ?? 'Nueva rutina',
      is_ai_generated: false,
      exercises: (payload.exercises ?? []).map((exercise, index) => buildRoutineExerciseFromPayload(routineId, exercise, index)),
    };
    await updateState((draft) => {
      draft.routines = [...draft.routines, routine];
      draft.nextRoutineId += 1;
    });
    return response(config, routine);
  }

  if (path.startsWith('/workouts/routines/') && method === 'put') {
    const routineId = path.split('/').pop() ?? '';
    const payload = parseData<{ name?: string; exercises?: Array<Record<string, any>> }>(config) ?? {};
    await updateDemoRoutines((items) =>
      items.map((routine) =>
        routine.id === routineId
          ? {
              ...routine,
              name: payload.name ?? routine.name,
              exercises: (payload.exercises ?? []).map((exercise, index) => buildRoutineExerciseFromPayload(routineId, exercise, index)),
            }
          : routine
      )
    );
    const updated = (await getDemoRoutines()).find((item) => item.id === routineId) ?? null;
    return response(config, updated);
  }

  if (path.startsWith('/workouts/routines/') && method === 'delete') {
    const routineId = path.split('/').pop() ?? '';
    await updateDemoRoutines((items) => items.filter((item) => item.id !== routineId));
    return response(config, { status: 'ok' });
  }

  if (path === '/workouts/sessions' && method === 'post') {
    const payload = parseData<{ routine_id?: string }>(config) ?? {};
    const state = await loadState();
    const sessionId = `session-demo-${state.nextSessionId}`;
    await updateState((draft) => {
      draft.nextSessionId += 1;
      draft.activeSession = { sessionId, routineId: payload.routine_id };
    });
    return response(config, { session_id: sessionId, status: 'active' });
  }

  if (path.startsWith('/workouts/sessions/') && path.endsWith('/sets') && method === 'post') {
    const state = await loadState();
    const setId = `set-demo-${state.nextSetId}`;
    await updateState((draft) => {
      draft.nextSetId += 1;
    });
    return response(config, { set_id: setId, status: 'registrada' });
  }

  if (path.startsWith('/workouts/sessions/') && method === 'patch') {
    const sessionId = path.split('/')[3] ?? '';
    return response(config, await createSessionResult(sessionId));
  }

  if (path === '/classes/types' && method === 'get') return response(config, await getDemoClassTypes());
  if (path === '/classes/schedule' && method === 'get') {
    const fromDate = String((config.params as { from_date?: string } | undefined)?.from_date ?? '').trim();
    const toDate = String((config.params as { to_date?: string } | undefined)?.to_date ?? '').trim();
    const schedule = (await getDemoSchedule()).filter((item) => (!fromDate || item.scheduled_date >= fromDate) && (!toDate || item.scheduled_date <= toDate));
    return response(config, schedule);
  }

  if (path.startsWith('/classes/') && path.endsWith('/enroll') && method === 'post') {
    const classId = path.split('/')[2] ?? '';
    await updateDemoSchedule((items) =>
      items.map((item) =>
        item.id === classId
          ? { ...item, is_enrolled: true, enrolled_count: Math.min(item.max_capacity, item.enrolled_count + 1) }
          : item
      )
    );
    return response(config, { status: 'ok', message: 'Tu inscripción quedó registrada en modo demo.' });
  }

  if (path.startsWith('/classes/') && path.endsWith('/enroll') && method === 'delete') {
    const classId = path.split('/')[2] ?? '';
    await updateDemoSchedule((items) =>
      items.map((item) =>
        item.id === classId
          ? { ...item, is_enrolled: false, enrolled_count: Math.max(0, item.enrolled_count - 1) }
          : item
      )
    );
    return response(config, { status: 'ok', message: 'Tu inscripción se quitó en modo demo.' });
  }

  if (path.startsWith('/classes/') && path.endsWith('/enrollments') && method === 'get') {
    return response(config, [
      { user_id: 'demo-user', user_name: 'Juanjo', enrolled_at: new Date().toISOString(), status: 'Confirmado' },
      { user_id: 'demo-guest', user_name: 'Laura', enrolled_at: new Date().toISOString(), status: 'Confirmado' },
    ]);
  }

  if (path === '/nutrition/summary' && method === 'get') return response(config, await buildDailySummary());
  if (path === '/nutrition/targets' && method === 'get') return response(config, await getDemoNutritionTargets());
  if (path === '/nutrition/targets' && method === 'put') {
    const payload = parseData<Partial<DemoState['nutritionTargets']>>(config) ?? {};
    await updateDemoNutritionTargets(payload);
    return response(config, await getDemoNutritionTargets());
  }

  if (path === '/nutrition/meals' && method === 'get') return response(config, await getDemoMeals());
  if (path === '/nutrition/meals' && method === 'post') {
    const payload = parseData<Record<string, any>>(config) ?? {};
    const state = await loadState();
    const meal = {
      id: `meal-demo-${state.nextMealId}`,
      food_name: String(payload.food_name ?? 'Comida demo'),
      calories: Number(payload.calories ?? 0) || 0,
      protein: Number(payload.protein ?? 0) || 0,
      carbs: Number(payload.carbs ?? 0) || 0,
      fats: Number(payload.fats ?? 0) || 0,
      meal_type: String(payload.meal_type ?? 'otro'),
      serving_size: payload.serving_size ? String(payload.serving_size) : null,
      notes: payload.notes ? String(payload.notes) : null,
      logged_at: new Date().toISOString(),
    };
    await updateState((draft) => {
      draft.nextMealId += 1;
      draft.meals = [...draft.meals, meal];
    });
    return response(config, meal);
  }

  if (path.startsWith('/nutrition/meals/') && method === 'delete') {
    const mealId = path.split('/').pop() ?? '';
    await updateDemoMeals((items) => items.filter((item) => item.id !== mealId));
    return response(config, { status: 'ok' });
  }

  if (path === '/nutrition/water' && method === 'get') return response(config, await getDemoWaterLogs());
  if (path === '/nutrition/water' && method === 'post') {
    const payload = parseData<{ amount_ml?: number }>(config) ?? {};
    const state = await loadState();
    const waterLog = { id: `water-demo-${state.nextWaterId}`, amount_ml: Number(payload.amount_ml ?? 0) || 0, logged_at: new Date().toISOString() };
    await updateState((draft) => {
      draft.nextWaterId += 1;
      draft.waterLogs = [...draft.waterLogs, waterLog];
    });
    return response(config, waterLog);
  }

  if (path === '/nutrition/weekly' && method === 'get') return response(config, await getDemoWeeklySummary());

  if (path === '/progress/overview' && method === 'get') return response(config, await buildOverview());
  if (path === '/progress/weight' && method === 'get') {
    const limit = Number((config.params as { limit?: number } | undefined)?.limit ?? 20) || 20;
    return response(config, (await getDemoWeightHistory()).slice().reverse().slice(0, limit));
  }
  if (path === '/progress/weight' && method === 'post') {
    const payload = parseData<{ weight_kg?: number; date?: string; notes?: string }>(config) ?? {};
    const state = await loadState();
    const log = { id: `weight-demo-${state.nextWeightId}`, weight_kg: Number(payload.weight_kg ?? 0) || 0, date: payload.date ?? iso(new Date()), notes: payload.notes ?? null, logged_at: new Date().toISOString() };
    await updateState((draft) => {
      draft.nextWeightId += 1;
      draft.weightHistory = [...draft.weightHistory, log];
    });
    return response(config, log);
  }
  if (path.startsWith('/progress/weight/') && method === 'delete') {
    const weightId = path.split('/').pop() ?? '';
    await updateDemoWeightHistory((items) => items.filter((item) => item.id !== weightId));
    return response(config, { status: 'ok' });
  }
  if (path === '/progress/strength' && method === 'get') return response(config, await getDemoStrengthGains());
  if (path === '/progress/leaderboard' && method === 'get') {
    const limit = Number((config.params as { limit?: number } | undefined)?.limit ?? 10) || 10;
    return response(config, (await getDemoLeaderboard()).slice(0, limit));
  }

  if (path === '/ai/chat-messages' && method === 'post') {
    const payload = parseData<{ message?: string }>(config) ?? {};
    const message = (payload.message ?? '').trim().toLowerCase();
    const reply = message.includes('hombro')
      ? 'En modo demo te sugiero bajar un poco la carga, cuidar el rango de movimiento y probar una variante con mancuernas si aparece molestia.'
      : 'En modo demo puedo ayudarte con técnica, rutinas, nutrición y progreso. Si me das más contexto, te respondo con una recomendación práctica.';
    return response(config, { reply, model: 'zenith-demo-local' });
  }

  if (path === '/chat' && method === 'get') {
    return response(config, clone(MOCK_CHAT));
  }

  throw new Error(`No hay mock demo para ${method.toUpperCase()} ${path}`);
};
