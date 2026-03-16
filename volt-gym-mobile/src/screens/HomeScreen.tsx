import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { MOCK_USER, MOCK_DASHBOARD } from '../data/mockData';
import { MaterialIcons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<RootStackParamList, 'Main'>;

const HomeScreen = ({ navigation }: Props) => {
  const xpProgress = (MOCK_USER.xp / MOCK_USER.xpNextLevel) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola,</Text>
            <Text style={styles.userName}>{MOCK_USER.name}</Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>LVL {MOCK_USER.level}</Text>
          </View>
        </View>

        {/* Level & XP Progress Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Progreso de Nivel</Text>
            <Text style={styles.xpText}>{MOCK_USER.xp} / {MOCK_USER.xpNextLevel} XP</Text>
          </View>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${xpProgress}%` }]} />
          </View>
        </View>

        {/* Daily Recommendation */}
        <View style={[styles.card, styles.highlightCard]}>
          <View style={styles.cardHeaderRow}>
            <MaterialIcons name="auto-awesome" size={20} color="#FF4500" />
            <Text style={styles.highlightTitle}>Coach AI</Text>
          </View>
          <Text style={styles.recommendationText}>{MOCK_DASHBOARD.recommendation}</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.grid}>
          {/* Last Workout */}
          <View style={[styles.card, styles.gridItem]}>
            <MaterialIcons name="history" size={24} color="#A0A0B8" />
            <Text style={styles.gridValue}>{MOCK_DASHBOARD.lastWorkout.date}</Text>
            <Text style={styles.gridLabel}>{MOCK_DASHBOARD.lastWorkout.name}</Text>
          </View>

          {/* Weekly Workouts */}
          <View style={[styles.card, styles.gridItem]}>
            <MaterialIcons name="event-available" size={24} color="#A0A0B8" />
            <Text style={styles.gridValue}>{MOCK_DASHBOARD.weeklyCount}</Text>
            <Text style={styles.gridLabel}>Entrenos esta sem.</Text>
          </View>
        </View>

        {/* Nutrition Trigger Card */}
        <TouchableOpacity 
          style={styles.card}
          onPress={() => navigation.navigate('Nutrition')}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialIcons name="restaurant" size={24} color="#00E676" />
              <Text style={styles.cardTitle}>Nutrición de Hoy</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#A0A0B8" />
          </View>
          <Text style={styles.macroText}>
            {MOCK_DASHBOARD.calories.consumed} kcal consumidas de {MOCK_DASHBOARD.calories.target} kcal
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  greeting: {
    fontSize: 16,
    color: '#A0A0B8',
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  levelBadge: {
    backgroundColor: '#FF4500',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  levelText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#222222',
  },
  highlightCard: {
    borderColor: 'rgba(255, 69, 0, 0.3)',
    backgroundColor: '#1A0F0A',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  highlightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF4500',
    marginLeft: 8,
    flex: 1,
  },
  xpText: {
    fontSize: 14,
    color: '#FF4500',
    fontWeight: 'bold',
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
  recommendationText: {
    fontSize: 15,
    color: '#D0D0D0',
    lineHeight: 22,
  },
  grid: {
    flexDirection: 'row',
    gap: 16,
  },
  gridItem: {
    flex: 1,
    alignItems: 'flex-start',
  },
  gridValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 4,
  },
  gridLabel: {
    fontSize: 13,
    color: '#A0A0B8',
  },
  macroText: {
    fontSize: 14,
    color: '#A0A0B8',
    marginTop: 8,
  }
});

export default HomeScreen;

