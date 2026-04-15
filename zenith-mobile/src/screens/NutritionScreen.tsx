import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import type { RootStackParamList } from '../navigation/AppNavigator';
import {
  DailySummary,
  LogMealPayload,
  MealLog,
  WeekDaySummary,
  nutritionApi,
} from '../features/nutrition/api/nutritionApi';
import { colors } from '../theme/theme';

const MEAL_TYPES = [
  { key: 'desayuno', label: 'Desayuno', icon: 'free-breakfast' as const, color: colors.accent },
  { key: 'almuerzo', label: 'Almuerzo', icon: 'restaurant' as const, color: colors.success },
  { key: 'cena', label: 'Cena', icon: 'dinner-dining' as const, color: colors.warning },
  { key: 'snack', label: 'Merienda', icon: 'icecream' as const, color: colors.error },
  { key: 'otro', label: 'Otro', icon: 'fastfood' as const, color: colors.textMuted },
];

const WATER_PRESETS = [250, 500, 750, 1000];
const DEFAULT_TARGETS = { calories: 2500, protein: 150, carbs: 300, fats: 80, water: 2500 };
const EMPTY_CONSUMED = { calories: 0, protein: 0, carbs: 0, fats: 0 };

const getProgress = (value: number, target: number) =>
  target > 0 ? Math.min((value / target) * 100, 100) : 0;

const getRemaining = (target: number, value: number) =>
  target > 0 ? Math.max(target - value, 0) : 0;

const parseInputNumber = (value: string, fallback = 0) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeOptionalText = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const formatDay = (value: string) =>
  new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }).format(
    new Date(`${value}T12:00:00`)
  );

const formatShortDay = (value: string) =>
  new Intl.DateTimeFormat('es-CO', { weekday: 'short' }).format(new Date(`${value}T12:00:00`));

const formatTime = (value: string) =>
  new Intl.DateTimeFormat('es-CO', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));

const getMealTypeInfo = (type: string) =>
  MEAL_TYPES.find((mealType) => mealType.key === type) ?? MEAL_TYPES[MEAL_TYPES.length - 1];

const getErrorMessage = (error: unknown) => {
  const response = (error as { response?: { status?: number; data?: { detail?: unknown } } })?.response;
  const detail = response?.data?.detail;

  if (response?.status === 404) {
    return 'La API de nutrición no respondió en la ruta esperada.';
  }
  if (typeof detail === 'string' && detail.trim().length > 0) {
    return detail;
  }
  if (response?.status && response.status >= 500) {
    return 'El servidor tuvo un problema al cargar tu nutrición.';
  }

  return 'No pudimos cargar tu información de nutrición.';
};

const getHeroMessage = (consumed: number, target: number) => {
  if (target <= 0) {
    return 'Configura una meta diaria para seguir tu progreso.';
  }
  if (consumed <= 0) {
    return `Empieza a registrar tus comidas para acercarte a ${target} kcal.`;
  }
  if (consumed < target) {
    return `Te faltan ${target - consumed} kcal para alcanzar tu meta.`;
  }
  if (consumed === target) {
    return 'Ya cumpliste tu meta diaria de calorías.';
  }
  return `Superaste tu meta por ${consumed - target} kcal.`;
};

const getMostFrequentMealType = (meals: MealLog[]) => {
  if (meals.length === 0) {
    return null;
  }

  const counts = meals.reduce<Record<string, number>>((accumulator, meal) => {
    accumulator[meal.meal_type] = (accumulator[meal.meal_type] ?? 0) + 1;
    return accumulator;
  }, {});

  const [type] = Object.entries(counts).sort(([, a], [, b]) => b - a)[0] ?? [];
  return type ? getMealTypeInfo(type).label : null;
};

const getWeeklyColor = (consumed: number, target: number) => {
  if (target <= 0) {
    return colors.accent;
  }

  const ratio = consumed / target;
  if (ratio >= 0.9 && ratio <= 1.1) {
    return colors.success;
  }
  if (ratio > 1.1) {
    return colors.warning;
  }

  return colors.accent;
};

const NutritionScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const hasLoadedRef = useRef(false);

  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [weeklySummary, setWeeklySummary] = useState<WeekDaySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showMealModal, setShowMealModal] = useState(false);
  const [showTargetsModal, setShowTargetsModal] = useState(false);

  const [mealName, setMealName] = useState('');
  const [mealCalories, setMealCalories] = useState('');
  const [mealProtein, setMealProtein] = useState('');
  const [mealCarbs, setMealCarbs] = useState('');
  const [mealFats, setMealFats] = useState('');
  const [mealServingSize, setMealServingSize] = useState('');
  const [mealNotes, setMealNotes] = useState('');
  const [mealType, setMealType] = useState('otro');

  const [targetCalories, setTargetCalories] = useState('');
  const [targetProtein, setTargetProtein] = useState('');
  const [targetCarbs, setTargetCarbs] = useState('');
  const [targetFats, setTargetFats] = useState('');
  const [targetWater, setTargetWater] = useState('');

  const resetMealForm = useCallback(() => {
    setMealName('');
    setMealCalories('');
    setMealProtein('');
    setMealCarbs('');
    setMealFats('');
    setMealServingSize('');
    setMealNotes('');
    setMealType('otro');
  }, []);

  const loadData = useCallback(async ({ showLoader = true }: { showLoader?: boolean } = {}) => {
    if (showLoader) {
      setLoading(true);
    }

    setErrorMessage('');

    try {
      const [dailyData, weeklyData] = await Promise.all([
        nutritionApi.getDailySummary(),
        nutritionApi.getWeeklySummary(),
      ]);
      setSummary(dailyData);
      setWeeklySummary(weeklyData);
    } catch (error) {
      console.error('Error cargando nutrición:', error);
      setErrorMessage(getErrorMessage(error));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData({ showLoader: !hasLoadedRef.current });
      hasLoadedRef.current = true;
    }, [loadData])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData({ showLoader: false });
  }, [loadData]);

  const handleLogMeal = async () => {
    if (!mealName.trim() || !mealCalories.trim()) {
      Alert.alert('Error', 'Debes indicar el nombre y las calorías.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: LogMealPayload = {
        food_name: mealName.trim(),
        calories: parseInputNumber(mealCalories),
        protein: parseInputNumber(mealProtein),
        carbs: parseInputNumber(mealCarbs),
        fats: parseInputNumber(mealFats),
        meal_type: mealType,
        serving_size: normalizeOptionalText(mealServingSize),
        notes: normalizeOptionalText(mealNotes),
      };
      await nutritionApi.logMeal(payload);
      setShowMealModal(false);
      resetMealForm();
      await loadData({ showLoader: false });
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteMeal = async (mealId: string, name: string) => {
    Alert.alert('Eliminar comida', `¿Quieres eliminar "${name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await nutritionApi.deleteMeal(mealId);
            await loadData({ showLoader: false });
          } catch (error) {
            Alert.alert('Error', getErrorMessage(error));
          }
        },
      },
    ]);
  };

  const handleLogWater = async (amount: number) => {
    try {
      await nutritionApi.logWater(amount);
      await loadData({ showLoader: false });
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
    }
  };

  const handleSetTargets = async () => {
    setSubmitting(true);
    try {
      await nutritionApi.setTargets({
        target_calories: parseInputNumber(targetCalories, DEFAULT_TARGETS.calories),
        target_protein: parseInputNumber(targetProtein, DEFAULT_TARGETS.protein),
        target_carbs: parseInputNumber(targetCarbs, DEFAULT_TARGETS.carbs),
        target_fats: parseInputNumber(targetFats, DEFAULT_TARGETS.fats),
        water_ml: parseInputNumber(targetWater, DEFAULT_TARGETS.water),
      });
      setShowTargetsModal(false);
      await loadData({ showLoader: false });
    } catch (error) {
      Alert.alert('Error', getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const caloriesTarget = summary?.targets?.target_calories ?? DEFAULT_TARGETS.calories;
  const proteinTarget = summary?.targets?.target_protein ?? DEFAULT_TARGETS.protein;
  const carbsTarget = summary?.targets?.target_carbs ?? DEFAULT_TARGETS.carbs;
  const fatsTarget = summary?.targets?.target_fats ?? DEFAULT_TARGETS.fats;
  const waterGoal = summary?.water_goal_ml || summary?.targets?.water_ml || DEFAULT_TARGETS.water;
  const consumed = summary?.consumed ?? EMPTY_CONSUMED;
  const meals = summary?.meals ?? [];

  const openTargetsModal = () => {
    setTargetCalories(String(caloriesTarget));
    setTargetProtein(String(proteinTarget));
    setTargetCarbs(String(carbsTarget));
    setTargetFats(String(fatsTarget));
    setTargetWater(String(waterGoal));
    setShowTargetsModal(true);
  };

  if (loading && !summary) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color={colors.accent} style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (!summary) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nutrición</Text>
          <View style={styles.iconSpacer} />
        </View>

        <View style={styles.centered}>
          <View style={styles.stateCard}>
            <MaterialCommunityIcons name="alert-circle-outline" size={52} color={colors.accent} />
            <Text style={styles.stateTitle}>No pudimos cargar tu nutrición</Text>
            <Text style={styles.stateText}>{errorMessage || 'Intenta de nuevo en unos segundos.'}</Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => loadData({ showLoader: true })}
            >
              <Text style={styles.primaryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const calorieProgress = getProgress(consumed.calories, caloriesTarget);
  const proteinProgress = getProgress(consumed.protein, proteinTarget);
  const carbsProgress = getProgress(consumed.carbs, carbsTarget);
  const fatsProgress = getProgress(consumed.fats, fatsTarget);
  const waterProgress = getProgress(summary.water_ml, waterGoal);

  const lastMeal = meals[meals.length - 1] ?? null;
  const averageCaloriesPerMeal = meals.length > 0 ? Math.round(consumed.calories / meals.length) : 0;
  const mostFrequentMealType = getMostFrequentMealType(meals);
  const weeklyAverageCalories = weeklySummary.length > 0
    ? Math.round(weeklySummary.reduce((total, day) => total + day.calories_consumed, 0) / weeklySummary.length)
    : 0;
  const weeklyTargetDays = weeklySummary.filter((day) => day.calories_target > 0);
  const weeklyDaysOnTarget = weeklyTargetDays.filter((day) => {
    const ratio = day.calories_consumed / day.calories_target;
    return ratio >= 0.9 && ratio <= 1.1;
  }).length;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nutrición</Text>
        <TouchableOpacity style={styles.iconButton} onPress={openTargetsModal}>
          <MaterialIcons name="tune" size={22} color={colors.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {errorMessage ? (
          <View style={styles.banner}>
            <MaterialIcons name="info-outline" size={18} color={colors.accent} />
            <Text style={styles.bannerText}>{errorMessage}</Text>
          </View>
        ) : null}

        <View style={styles.heroCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.heroEyebrow}>Nutrición diaria</Text>
            <Text style={styles.heroDate}>{formatDay(summary.date)}</Text>
          </View>
          <Text style={styles.heroValue}>{consumed.calories} kcal</Text>
          <Text style={styles.heroText}>{getHeroMessage(consumed.calories, caloriesTarget)}</Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${calorieProgress}%`, backgroundColor: colors.accent }]} />
          </View>
          <View style={styles.quickStats}>
            <View style={styles.quickStat}>
              <MaterialIcons name="restaurant-menu" size={18} color={colors.accent} />
              <Text style={styles.quickStatText}>{meals.length} comidas</Text>
            </View>
            <View style={styles.quickStat}>
              <MaterialCommunityIcons name="cup-water" size={18} color={colors.accent} />
              <Text style={styles.quickStatText}>
                {(summary.water_ml / 1000).toFixed(1)} / {(waterGoal / 1000).toFixed(1)} L
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.grid}>
          <View style={[styles.card, styles.gridCard]}>
            <Text style={styles.cardTitle}>Pendiente del día</Text>
            <Text style={styles.statText}>Calorías: {getRemaining(caloriesTarget, consumed.calories)} kcal</Text>
            <Text style={styles.statText}>Proteína: {getRemaining(proteinTarget, consumed.protein)} g</Text>
            <Text style={styles.statText}>Carbohidratos: {getRemaining(carbsTarget, consumed.carbs)} g</Text>
            <Text style={styles.statText}>Grasas: {getRemaining(fatsTarget, consumed.fats)} g</Text>
            <Text style={styles.statText}>Agua: {getRemaining(waterGoal, summary.water_ml)} ml</Text>
          </View>

          <View style={[styles.card, styles.gridCard]}>
            <Text style={styles.cardTitle}>Registro de hoy</Text>
            <Text style={styles.statText}>
              Promedio: {meals.length > 0 ? `${averageCaloriesPerMeal} kcal` : 'Sin registros'}
            </Text>
            <Text style={styles.statText}>
              Último registro: {lastMeal ? formatTime(lastMeal.logged_at) : 'Aún no registras'}
            </Text>
            <Text style={styles.statText}>Tipo frecuente: {mostFrequentMealType ?? 'Sin datos'}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Macronutrientes</Text>
            <Text style={styles.sectionMeta}>
              {consumed.protein + consumed.carbs + consumed.fats} g acumulados
            </Text>
          </View>

          <Text style={styles.macroLabel}>Proteína</Text>
          <Text style={styles.macroMeta}>{consumed.protein} g de {proteinTarget} g</Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${proteinProgress}%`, backgroundColor: colors.accent }]} />
          </View>

          <Text style={styles.macroLabel}>Carbohidratos</Text>
          <Text style={styles.macroMeta}>{consumed.carbs} g de {carbsTarget} g</Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${carbsProgress}%`, backgroundColor: colors.success }]} />
          </View>

          <Text style={styles.macroLabel}>Grasas</Text>
          <Text style={styles.macroMeta}>{consumed.fats} g de {fatsTarget} g</Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${fatsProgress}%`, backgroundColor: colors.warning }]} />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Tendencia semanal</Text>
            <Text style={styles.sectionMeta}>{weeklyAverageCalories} kcal promedio</Text>
          </View>
          <Text style={styles.sectionMeta}>
            Días en meta: {weeklyDaysOnTarget}/{weeklyTargetDays.length || 0}
          </Text>
          {weeklySummary.map((day) => (
            <View key={day.date} style={styles.weekRow}>
              <View style={styles.rowBetween}>
                <Text style={styles.weekLabel}>{formatShortDay(day.date)}</Text>
                <Text style={styles.weekValue}>
                  {day.calories_consumed} kcal{day.calories_target > 0 ? ` de ${day.calories_target}` : ''}
                </Text>
              </View>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    {
                      width: `${getProgress(day.calories_consumed, day.calories_target || caloriesTarget)}%`,
                      backgroundColor: getWeeklyColor(day.calories_consumed, day.calories_target),
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={styles.row}>
              <MaterialCommunityIcons name="cup-water" size={22} color={colors.accent} />
              <Text style={styles.sectionTitle}>Hidratación</Text>
            </View>
            <Text style={styles.waterValue}>{(summary.water_ml / 1000).toFixed(1)} L</Text>
          </View>
          <Text style={styles.sectionMeta}>Meta diaria de {(waterGoal / 1000).toFixed(1)} L</Text>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${waterProgress}%`, backgroundColor: colors.accent }]} />
          </View>
          <Text style={styles.waterHelper}>
            {getRemaining(waterGoal, summary.water_ml) > 0
              ? `Te faltan ${getRemaining(waterGoal, summary.water_ml)} ml para cerrar tu meta.`
              : 'Objetivo de hidratación cumplido.'}
          </Text>
          <View style={styles.waterButtons}>
            {WATER_PRESETS.map((amount) => (
              <TouchableOpacity key={amount} style={styles.waterButton} onPress={() => handleLogWater(amount)}>
                <Text style={styles.waterButtonText}>+{amount} ml</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Comidas del día</Text>
            <Text style={styles.sectionMeta}>{meals.length} registros</Text>
          </View>
          <Text style={styles.sectionHint}>Usa la papelera para borrar un registro si te equivocaste.</Text>

          {meals.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="food-off" size={44} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Aún no registras comidas</Text>
              <Text style={styles.emptyText}>Toca el botón flotante para guardar tu primera comida del día.</Text>
            </View>
          ) : (
            meals.map((meal) => {
              const typeInfo = getMealTypeInfo(meal.meal_type);
              return (
                <View key={meal.id} style={styles.mealCard}>
                  <View style={styles.rowBetween}>
                    <View style={styles.mealInfo}>
                      <Text style={[styles.mealType, { color: typeInfo.color }]}>{typeInfo.label}</Text>
                      <Text style={styles.mealName}>{meal.food_name}</Text>
                    </View>
                    <Text style={styles.mealCalories}>{meal.calories} kcal</Text>
                  </View>
                  <Text style={styles.mealMacros}>
                    Proteína {meal.protein} g · Carbohidratos {meal.carbs} g · Grasas {meal.fats} g
                  </Text>
                  <View style={styles.rowBetween}>
                    <Text style={styles.mealMeta}>
                      {formatTime(meal.logged_at)}
                      {meal.serving_size ? ` · Porción ${meal.serving_size}` : ''}
                    </Text>
                    <TouchableOpacity onPress={() => handleDeleteMeal(meal.id, meal.food_name)}>
                      <MaterialIcons name="delete-outline" size={20} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                  {meal.notes ? <Text style={styles.mealNotes}>{meal.notes}</Text> : null}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { bottom: Math.max(insets.bottom, 20) + 12 }]}
        onPress={() => setShowMealModal(true)}
      >
        <MaterialIcons name="add" size={30} color={colors.textPrimary} />
      </TouchableOpacity>

      <Modal visible={showMealModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.rowBetween}>
              <Text style={styles.modalTitle}>Registrar comida</Text>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => {
                  setShowMealModal(false);
                  resetMealForm();
                }}
              >
                <MaterialIcons name="close" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeRow}>
                {MEAL_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.typePill,
                      mealType === type.key && { borderColor: type.color, backgroundColor: colors.surface },
                    ]}
                    onPress={() => setMealType(type.key)}
                  >
                    <MaterialIcons
                      name={type.icon}
                      size={16}
                      color={mealType === type.key ? type.color : colors.textSecondary}
                    />
                    <Text style={[styles.typePillText, mealType === type.key && { color: type.color }]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TextInput
                style={styles.input}
                placeholder="Nombre de la comida"
                placeholderTextColor={colors.textMuted}
                value={mealName}
                onChangeText={setMealName}
              />
              <View style={styles.formRow}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Calorías"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={mealCalories}
                  onChangeText={setMealCalories}
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Proteína"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={mealProtein}
                  onChangeText={setMealProtein}
                />
              </View>
              <View style={styles.formRow}>
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Carbohidratos"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={mealCarbs}
                  onChangeText={setMealCarbs}
                />
                <TextInput
                  style={[styles.input, styles.halfInput]}
                  placeholder="Grasas"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={mealFats}
                  onChangeText={setMealFats}
                />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Porción o medida, por ejemplo 200 g"
                placeholderTextColor={colors.textMuted}
                value={mealServingSize}
                onChangeText={setMealServingSize}
              />
              <TextInput
                style={[styles.input, styles.notesInput]}
                placeholder="Notas opcionales"
                placeholderTextColor={colors.textMuted}
                value={mealNotes}
                onChangeText={setMealNotes}
                multiline
                textAlignVertical="top"
              />
            </ScrollView>

            <TouchableOpacity
              style={[styles.primaryButton, submitting && styles.disabled]}
              onPress={handleLogMeal}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={colors.textPrimary} />
              ) : (
                <Text style={styles.primaryButtonText}>Guardar comida</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={showTargetsModal} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.rowBetween}>
              <Text style={styles.modalTitle}>Metas diarias</Text>
              <TouchableOpacity style={styles.iconButton} onPress={() => setShowTargetsModal(false)}>
                <MaterialIcons name="close" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Calorías"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={targetCalories}
              onChangeText={setTargetCalories}
            />
            <TextInput
              style={styles.input}
              placeholder="Proteína"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={targetProtein}
              onChangeText={setTargetProtein}
            />
            <TextInput
              style={styles.input}
              placeholder="Carbohidratos"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={targetCarbs}
              onChangeText={setTargetCarbs}
            />
            <TextInput
              style={styles.input}
              placeholder="Grasas"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={targetFats}
              onChangeText={setTargetFats}
            />
            <TextInput
              style={styles.input}
              placeholder="Agua en ml"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={targetWater}
              onChangeText={setTargetWater}
            />

            <TouchableOpacity
              style={[styles.primaryButton, submitting && styles.disabled]}
              onPress={handleSetTargets}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={colors.textPrimary} />
              ) : (
                <Text style={styles.primaryButtonText}>Guardar metas</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loader: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconSpacer: { width: 40 },
  centered: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  headerTitle: { fontSize: 24, fontWeight: '700', color: colors.accent },
  content: { paddingHorizontal: 20, paddingBottom: 150, gap: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    backgroundColor: colors.accentSoft,
  },
  bannerText: { flex: 1, fontSize: 13, color: colors.textPrimary, lineHeight: 18 },
  heroCard: {
    padding: 22,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    backgroundColor: colors.surface,
  },
  heroEyebrow: { fontSize: 12, fontWeight: '700', color: colors.accent },
  heroDate: { flex: 1, textAlign: 'right', fontSize: 12, color: colors.textSecondary },
  heroValue: { marginTop: 16, fontSize: 40, fontWeight: '800', color: colors.textPrimary },
  heroText: { marginTop: 8, fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
  quickStats: { flexDirection: 'row', gap: 12, marginTop: 18 },
  quickStat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  quickStatText: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  grid: { flexDirection: 'row', gap: 12 },
  gridCard: { flex: 1 },
  card: {
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
  statText: { fontSize: 13, color: colors.textSecondary, lineHeight: 21 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  sectionMeta: { fontSize: 13, color: colors.textSecondary, marginBottom: 10 },
  sectionHint: { fontSize: 12, color: colors.textSecondary, marginBottom: 12 },
  macroLabel: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginTop: 8 },
  macroMeta: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  track: {
    height: 8,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 8,
  },
  fill: { height: '100%', borderRadius: 999 },
  weekRow: { marginTop: 8 },
  weekLabel: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  weekValue: { fontSize: 12, color: colors.textSecondary },
  waterValue: { fontSize: 18, fontWeight: '700', color: colors.accent },
  waterHelper: { fontSize: 13, color: colors.textSecondary, marginTop: 8, marginBottom: 12, lineHeight: 20 },
  waterButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  waterButton: {
    minWidth: 84,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    backgroundColor: colors.surfaceAlt,
  },
  waterButtonText: { textAlign: 'center', fontSize: 13, fontWeight: '700', color: colors.accent },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  emptyTitle: { marginTop: 12, fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  emptyText: { marginTop: 8, textAlign: 'center', fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
  mealCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: 12,
  },
  mealInfo: { flex: 1 },
  mealType: { fontSize: 12, fontWeight: '700' },
  mealName: { marginTop: 6, fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  mealCalories: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  mealMacros: { marginTop: 10, fontSize: 12, color: colors.textSecondary, lineHeight: 18 },
  mealMeta: { marginTop: 12, fontSize: 12, color: colors.textSecondary, flex: 1, marginRight: 12 },
  mealNotes: { marginTop: 10, fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  fab: {
    position: 'absolute',
    right: 24,
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    elevation: 8,
  },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalCard: {
    maxHeight: '88%',
    padding: 20,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  modalTitle: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginBottom: 16 },
  typeRow: { gap: 10, paddingBottom: 12 },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  typePillText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  input: {
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
    color: colors.textPrimary,
    fontSize: 15,
  },
  formRow: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  notesInput: { minHeight: 92 },
  stateCard: {
    alignItems: 'center',
    paddingVertical: 34,
    paddingHorizontal: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  stateTitle: { marginTop: 14, fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  stateText: { marginTop: 10, fontSize: 14, textAlign: 'center', color: colors.textSecondary, lineHeight: 22 },
  primaryButton: {
    marginTop: 18,
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  primaryButtonText: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  disabled: { opacity: 0.7 },
});

export default NutritionScreen;
