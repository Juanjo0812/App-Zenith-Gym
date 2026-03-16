export const MOCK_USER = {
  name: 'Juanjo08',
  level: 12,
  xp: 2450,
  xpNextLevel: 3000,
  avatar: 'https://i.pravatar.cc/150?u=juanjo08',
  stats: {
    totalWorkouts: 142,
    streak: 12,
    prs: 24,
    memberSince: '2025-01-15'
  }
};

export const MOCK_DASHBOARD = {
  lastWorkout: {
    name: 'Potencia de tren superior',
    date: 'Ayer',
    duration: '1h 15m'
  },
  weeklyCount: 4,
  calories: {
    consumed: 2150,
    target: 2800
  },
  recommendation: 'Día de recuperación activa. Sugerimos movilidad ligera y cardio suave.'
};

export const MOCK_ROUTINES = [
  {
    id: '1',
    name: 'Empuje hipertrofia',
    muscleGroups: ['Pecho', 'Hombros', 'Tríceps'],
    exercises: [
      { name: 'Press de banca', sets: [{ reps: 8, weight: 80 }, { reps: 8, weight: 80 }, { reps: 7, weight: 80 }] },
      { name: 'Press militar', sets: [{ reps: 10, weight: 50 }, { reps: 9, weight: 50 }, { reps: 8, weight: 50 }] },
      { name: 'Extensiones de tríceps', sets: [{ reps: 12, weight: 25 }, { reps: 12, weight: 25 }, { reps: 10, weight: 25 }] }
    ]
  },
  {
    id: '2',
    name: 'Tracción fuerza',
    muscleGroups: ['Espalda', 'Bíceps'],
    exercises: [
      { name: 'Dominadas lastradas', sets: [{ reps: 5, weight: 20 }, { reps: 5, weight: 20 }, { reps: 4, weight: 20 }] },
      { name: 'Remo con barra', sets: [{ reps: 8, weight: 70 }, { reps: 8, weight: 70 }, { reps: 7, weight: 70 }] },
      { name: 'Curl de bíceps', sets: [{ reps: 10, weight: 35 }, { reps: 10, weight: 35 }, { reps: 8, weight: 35 }] }
    ]
  },
  {
    id: '3',
    name: 'Piernas volumen',
    muscleGroups: ['Piernas', 'Pantorrillas'],
    exercises: [
      { name: 'Sentadilla libre', sets: [{ reps: 10, weight: 100 }, { reps: 10, weight: 100 }, { reps: 8, weight: 100 }] },
      { name: 'Prensa', sets: [{ reps: 15, weight: 200 }, { reps: 12, weight: 200 }, { reps: 12, weight: 200 }] },
      { name: 'Elevación de pantorrillas', sets: [{ reps: 20, weight: 60 }, { reps: 20, weight: 60 }, { reps: 15, weight: 60 }] }
    ]
  }
];

export const MOCK_NUTRITION = {
  macros: {
    calories: { current: 1850, target: 2800 },
    protein: { current: 140, target: 180 },
    carbs: { current: 190, target: 300 },
    fats: { current: 60, target: 85 }
  },
  meals: [
    {
      id: 'm1',
      name: 'Desayuno',
      time: '08:00',
      calories: 550,
      items: ['Avena con whey protein', 'Plátano', 'Café negro']
    },
    {
      id: 'm2',
      name: 'Almuerzo',
      time: '13:30',
      calories: 850,
      items: ['Pollo a la plancha (200g)', 'Arroz integral', 'Brócoli']
    },
    {
      id: 'm3',
      name: 'Snack Pre-entreno',
      time: '17:00',
      calories: 450,
      items: ['Yogur griego', 'Frutos secos', 'Miel']
    }
  ]
};

export const MOCK_PROGRESS = {
  weightHistory: [
    { date: '1 Feb', weight: 75.2 },
    { date: '15 Feb', weight: 76.0 },
    { date: '1 Mar', weight: 76.5 },
    { date: '15 Mar', weight: 77.1 },
  ],
  strengthGains: [
    { exercise: 'Press de banca', start: 70, current: 85 },
    { exercise: 'Sentadilla', start: 90, current: 110 },
    { exercise: 'Peso muerto', start: 100, current: 130 },
  ],
  activeChallenges: [
    { id: 'c1', name: 'Marzo de Hierro', progress: 12, total: 20, daysLeft: 10 },
    { id: 'c2', name: '30 días de Cardio', progress: 5, total: 30, daysLeft: 25 },
  ],
  badges: [
    { id: 'b1', name: 'Primera Sangre', description: 'Completaste tu primer entrenamiento', icon: 'star' },
    { id: 'b2', name: 'Racha de Titán', description: 'Entrenaste 5 días seguidos', icon: 'local-fire-department' },
    { id: 'b3', name: 'Maestro del Peso', description: 'Levantaste 2x tu peso corporal en Peso Muerto', icon: 'fitness-center' },
  ],
  leaderboard: [
    { rank: 1, name: 'AlexM', xp: 5200 },
    { rank: 2, name: 'SaraFit', xp: 4800 },
    { rank: 3, name: 'Juanjo08', xp: 2450 },
    { rank: 4, name: 'MikeGym', xp: 2100 },
  ]
};

export const MOCK_CHAT = [
  { id: '1', role: 'ai', text: '¡Hola Juanjo! ¿Listo para aplastar el entrenamiento de hoy?', time: '09:00 AM' },
  { id: '2', role: 'user', text: 'Me duele un poco el hombro derecho al hacer press de banca. ¿Qué sugieres?', time: '09:05 AM' },
  { id: '3', role: 'ai', text: 'Evita el press plano con barra por hoy. Podemos cambiarlo por press con mancuernas en banco inclinado (es más amigable con los hombros) o flexiones. ¿Te parece bien?', time: '09:06 AM' },
  { id: '4', role: 'user', text: 'Vale, hagamos press inclinado con mancuernas. ¿Cuántas series recomiendas?', time: '09:10 AM' },
  { id: '5', role: 'ai', text: 'Perfecto. Hagamos 3 series de 10 a 12 repeticiones, bajando el peso respecto a tu máximo para evitar forzar la articulación. Mantén los codos ligeramente metidos (a unos 45 grados). ¡A darle duro!', time: '09:11 AM' },
];
