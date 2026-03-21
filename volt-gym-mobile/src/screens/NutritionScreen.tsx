import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { MOCK_NUTRITION } from '../data/mockData';

const NutritionScreen = () => {
  const navigation = useNavigation();

  const { target: calTarget, current: calCurrent } = MOCK_NUTRITION.macros.calories;
  const remaining = calTarget - calCurrent;
  const progressPercent = (calCurrent / calTarget) * 100;

  return (
    <SafeAreaView style={styles.container}>
      {/* Modal Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nutrición de hoy</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Calories Ring / Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Resumen de Calorías</Text>
          <View style={styles.caloriesRow}>
            <View style={styles.calorieDetails}>
              <Text style={styles.calorieLabel}>Consumidas</Text>
              <Text style={styles.calorieValue}>{calCurrent}</Text>
              <Text style={styles.calorieUnit}>kcal</Text>
            </View>

            <View style={styles.circleMock}>
              <Text style={styles.circleValue}>{remaining}</Text>
              <Text style={styles.circleLabel}>Restantes</Text>
            </View>
          </View>
          
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabelText}>0 kcal</Text>
            <Text style={styles.progressLabelText}>{calTarget} kcal</Text>
          </View>
        </View>

        {/* Macros */}
        <View style={styles.macrosRow}>
          <View style={styles.macroBox}>
            <Text style={styles.macroLabel}>Proteína</Text>
            <Text style={[styles.macroValue, { color: '#00D9FF' }]}>{MOCK_NUTRITION.macros.protein.current}g</Text>
            <Text style={styles.macroTarget}>/ {MOCK_NUTRITION.macros.protein.target}g</Text>
          </View>
          <View style={styles.macroBox}>
            <Text style={styles.macroLabel}>Carbohidratos</Text>
            <Text style={[styles.macroValue, { color: '#00E676' }]}>{MOCK_NUTRITION.macros.carbs.current}g</Text>
            <Text style={styles.macroTarget}>/ {MOCK_NUTRITION.macros.carbs.target}g</Text>
          </View>
          <View style={styles.macroBox}>
            <Text style={styles.macroLabel}>Grasas</Text>
            <Text style={[styles.macroValue, { color: '#FFB300' }]}>{MOCK_NUTRITION.macros.fats.current}g</Text>
            <Text style={styles.macroTarget}>/ {MOCK_NUTRITION.macros.fats.target}g</Text>
          </View>
        </View>

        {/* Meals List */}
        <View style={styles.mealsContainer}>
          <Text style={styles.sectionTitle}>Comidas del Día</Text>

          {MOCK_NUTRITION.meals.map((meal, idx) => (
            <View key={meal.id} style={styles.mealCard}>
              <View style={styles.mealHeader}>
                <Text style={styles.mealType}>Comida {idx + 1}</Text>
                <Text style={styles.mealCalories}>{meal.calories} kcal</Text>
              </View>
              <Text style={styles.mealName}>{meal.name}</Text>
              <Text style={styles.mealTime}>⏰ {meal.time}</Text>
              
              <View style={styles.mealMacros}>
                <Text style={styles.mealMacroText}>P: {Math.round(meal.calories * 0.05)}g</Text>
                <Text style={styles.mealMacroText}>•</Text>
                <Text style={styles.mealMacroText}>C: {Math.round(meal.calories * 0.1)}g</Text>
                <Text style={styles.mealMacroText}>•</Text>
                <Text style={styles.mealMacroText}>G: {Math.round(meal.calories * 0.03)}g</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Add Floating Button */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
        <MaterialIcons name="add" size={32} color="#000000" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#0F0F23',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A2E',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF4500',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  summaryCard: {
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#222222',
    marginBottom: 16,
  },
  summaryTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  caloriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  calorieDetails: {
    justifyContent: 'center',
  },
  calorieLabel: {
    color: '#888888',
    fontSize: 14,
    marginBottom: 4,
  },
  calorieValue: {
    color: '#FFFFFF',
    fontSize: 36,
    fontWeight: 'bold',
  },
  calorieUnit: {
    color: '#A0A0B8',
    fontSize: 14,
    marginTop: -4,
  },
  circleMock: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 8,
    borderColor: '#FF4500',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  circleLabel: {
    color: '#888888',
    fontSize: 11,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#333333',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF4500',
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressLabelText: {
    color: '#888888',
    fontSize: 12,
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  macroBox: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A2A4A',
    alignItems: 'center',
  },
  macroLabel: {
    color: '#A0A0B8',
    fontSize: 13,
    marginBottom: 4,
  },
  macroValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  macroTarget: {
    fontSize: 11,
    color: '#888888',
    marginTop: 2,
  },
  mealsContainer: {
    gap: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  mealCard: {
    backgroundColor: '#111111',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#222222',
    borderLeftWidth: 4,
    borderLeftColor: '#FF4500',
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  mealType: {
    color: '#FF4500',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  mealCalories: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  mealName: {
    color: '#EAEAEA',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  mealTime: {
    color: '#888888',
    fontSize: 13,
    marginBottom: 12,
  },
  mealMacros: {
    flexDirection: 'row',
    gap: 8,
  },
  mealMacroText: {
    color: '#A0A0B8',
    fontSize: 13,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#00E676', // Green for adding food
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#00E676',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  }
});

export default NutritionScreen;

