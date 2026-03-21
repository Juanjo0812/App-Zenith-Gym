import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { RootStackParamList } from '../navigation/AppNavigator';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { userService, UserProfile, UserDashboard, getXpForNextLevel, getXpProgress } from '../services/userService';
import { classesApi, ScheduledClass } from '../features/classes/api/classesApi';

type Props = BottomTabScreenProps<any, 'Home'>;

const HomeScreen = ({ navigation }: Props) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dashboard, setDashboard] = useState<UserDashboard | null>(null);
  const [upcomingClasses, setUpcomingClasses] = useState<ScheduledClass[]>([]);
  const [loading, setLoading] = useState(true);

  const stackNavigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const loadData = useCallback(async () => {
    try {
      const [profileData, dashboardData] = await Promise.all([
        userService.getProfile(),
        userService.getDashboard(),
      ]);
      setProfile(profileData);
      setDashboard(dashboardData);

      // Load today's and tomorrow's classes silently
      try {
        const today = new Date();
        const endDate = new Date(today);
        endDate.setDate(today.getDate() + 2);
        const from = today.toISOString().split('T')[0];
        const to = endDate.toISOString().split('T')[0];
        const classes = await classesApi.getSchedule(from, to);
        setUpcomingClasses(classes.filter((c) => !c.is_cancelled).slice(0, 3));
      } catch {
        // Classes feature may not be available yet — silently ignore
      }
    } catch (err) {
      console.error('Error cargando datos del home:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh data when screen gains focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  if (loading || !profile) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#FF4500" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  const xpNextLevel = getXpForNextLevel(profile.level);
  const xpProgressPercent = getXpProgress(profile.total_xp, profile.level);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola,</Text>
            <Text style={styles.userName}>{profile.username || profile.name}</Text>
          </View>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>Nivel {profile.level}</Text>
          </View>
        </View>

        {/* Level & XP Progress Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Progreso de nivel</Text>
            <Text style={styles.xpText}>{profile.total_xp} / {xpNextLevel} XP</Text>
          </View>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${xpProgressPercent}%` }]} />
          </View>
        </View>

        {/* Daily Recommendation */}
        <View style={[styles.card, styles.highlightCard]}>
          <View style={styles.cardHeaderRow}>
            <MaterialIcons name="auto-awesome" size={20} color="#FF4500" />
            <Text style={styles.highlightTitle}>Entrenador con IA</Text>
          </View>
          <Text style={styles.recommendationText}>
            {dashboard?.lastWorkout
              ? `Tu último entreno fue ${dashboard.lastWorkout.date.toLowerCase()}. ¡Sigue con esa constancia!`
              : '¡Bienvenido! Empieza tu primer entrenamiento hoy.'}
          </Text>
        </View>

        {/* Upcoming Classes Section */}
        <TouchableOpacity
          style={[styles.card, styles.classesCard]}
          onPress={() => stackNavigation.navigate('Classes')}
          activeOpacity={0.8}
        >
          <View style={styles.cardHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <MaterialIcons name="event" size={24} color="#7C4DFF" />
              <Text style={styles.cardTitle}>Clases grupales</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#A0A0B8" />
          </View>

          {upcomingClasses.length > 0 ? (
            <View style={styles.classesPreview}>
              {upcomingClasses.map((classItem) => (
                <View key={classItem.id} style={styles.classPreviewItem}>
                  <View
                    style={[styles.classPreviewDot, { backgroundColor: classItem.class_type.color }]}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.classPreviewName}>{classItem.class_type.name}</Text>
                    <Text style={styles.classPreviewTime}>
                      {classItem.scheduled_date} · {classItem.start_time} — {classItem.end_time}
                    </Text>
                  </View>
                  <View style={styles.classPreviewCapacity}>
                    <Text style={styles.classPreviewCount}>
                      {classItem.enrolled_count}/{classItem.max_capacity}
                    </Text>
                  </View>
                  {classItem.is_enrolled && (
                    <View style={styles.enrolledBadge}>
                      <MaterialIcons name="check-circle" size={16} color="#4CAF50" />
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.classesEmptyText}>
              Toca aquí para ver la programación de clases
            </Text>
          )}
        </TouchableOpacity>

        {/* Stats Grid */}
        <View style={styles.grid}>
          {/* Last Workout */}
          <View style={[styles.card, styles.gridItem]}>
            <MaterialIcons name="history" size={24} color="#A0A0B8" />
            <Text style={styles.gridValue}>
              {dashboard?.lastWorkout?.date ?? '—'}
            </Text>
            <Text style={styles.gridLabel}>
              {dashboard?.lastWorkout?.name ?? 'Sin entrenos aún'}
            </Text>
          </View>

          {/* Weekly Workouts */}
          <View style={[styles.card, styles.gridItem]}>
            <MaterialIcons name="event-available" size={24} color="#A0A0B8" />
            <Text style={styles.gridValue}>{dashboard?.weeklyCount ?? 0}</Text>
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
              <Text style={styles.cardTitle}>Nutrición de hoy</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#A0A0B8" />
          </View>
          <Text style={styles.macroText}>
            {dashboard?.todayCalories.target
              ? `${dashboard.todayCalories.consumed} kcal consumidas de ${dashboard.todayCalories.target} kcal`
              : 'No tienes un plan de nutrición configurado aún'}
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
  classesCard: {
    borderColor: 'rgba(124, 77, 255, 0.3)',
    backgroundColor: '#0F0A1A',
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
  },

  // Classes Preview
  classesPreview: {
    gap: 10,
  },
  classPreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A2E',
  },
  classPreviewDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  classPreviewName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  classPreviewTime: {
    fontSize: 12,
    color: '#A0A0B8',
    marginTop: 2,
  },
  classPreviewCapacity: {
    backgroundColor: '#1A1A2E',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  classPreviewCount: {
    fontSize: 11,
    color: '#A0A0B8',
    fontWeight: '600',
  },
  enrolledBadge: {
    marginLeft: 4,
  },
  classesEmptyText: {
    fontSize: 14,
    color: '#A0A0B8',
  },
});

export default HomeScreen;
