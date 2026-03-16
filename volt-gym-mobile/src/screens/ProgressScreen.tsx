import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { MOCK_PROGRESS, MOCK_USER } from '../data/mockData';

const ProgressScreen = () => {
  const [activeTab, setActiveTab] = useState<'gamification' | 'tracking'>('gamification');
  const xpProgress = (MOCK_USER.xp / MOCK_USER.xpNextLevel) * 100;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header and Segmented Control */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tu Evolución</Text>
        
        <View style={styles.segmentedControl}>
          <TouchableOpacity 
            style={[styles.segment, activeTab === 'gamification' && styles.segmentActive]}
            onPress={() => setActiveTab('gamification')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, activeTab === 'gamification' && styles.segmentTextActive]}>
              Logros
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.segment, activeTab === 'tracking' && styles.segmentActive]}
            onPress={() => setActiveTab('tracking')}
            activeOpacity={0.8}
          >
            <Text style={[styles.segmentText, activeTab === 'tracking' && styles.segmentTextActive]}>
              Métricas
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {activeTab === 'gamification' ? (
          // --- GAMIFICATION SECTION ---
          <View style={{ gap: 20 }}>
            {/* Level & XP */}
            <View style={styles.card}>
              <View style={styles.levelRow}>
                <View style={styles.levelBadgeBig}>
                  <Text style={styles.levelNumberBig}>{MOCK_USER.level}</Text>
                </View>
                <View style={styles.levelInfo}>
                  <Text style={styles.levelTitle}>Nivel {MOCK_USER.level}</Text>
                  <Text style={styles.xpText}>{MOCK_USER.xp} / {MOCK_USER.xpNextLevel} XP</Text>
                </View>
              </View>
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${xpProgress}%` }]} />
              </View>
            </View>

            {/* Active Challenges */}
            <View>
              <Text style={styles.sectionTitle}>Retos Activos</Text>
              {MOCK_PROGRESS.activeChallenges.map(challenge => (
                <View key={challenge.id} style={styles.challengeCard}>
                  <View style={styles.challengeHeaderRow}>
                    <Text style={styles.challengeName}>{challenge.name}</Text>
                    <Text style={styles.daysLeft}>{challenge.daysLeft} días</Text>
                  </View>
                  <View style={styles.progressBarBackgroundSm}>
                    <View style={[styles.progressBarFillSm, { width: `${(challenge.progress / challenge.total) * 100}%` }]} />
                  </View>
                  <Text style={styles.challengeProgressText}>{challenge.progress} / {challenge.total} completado</Text>
                </View>
              ))}
            </View>

            {/* Badges / Medals */}
            <View>
              <Text style={styles.sectionTitle}>Tus Medallas</Text>
              <View style={styles.badgesGrid}>
                {MOCK_PROGRESS.badges.map(badge => (
                  <View key={badge.id} style={styles.badgeItem}>
                    <View style={styles.badgeIconBg}>
                      <MaterialIcons name={badge.icon as any} size={32} color="#00D9FF" />
                    </View>
                    <Text style={styles.badgeName}>{badge.name}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Leaderboard Preview */}
            <View style={styles.card}>
              <View style={styles.leaderboardHeader}>
                <Text style={styles.cardTitle}>Top de la Semana</Text>
                <MaterialIcons name="chevron-right" size={24} color="#A0A0B8" />
              </View>
              {MOCK_PROGRESS.leaderboard.slice(0, 3).map((user, idx) => (
                <View key={idx} style={styles.leaderboardRow}>
                  <Text style={styles.rankText}>#{user.rank}</Text>
                  <Text style={[styles.userNameText, user.name === MOCK_USER.name && styles.currentUserText]}>
                    {user.name}
                  </Text>
                  <Text style={styles.userXpText}>{user.xp} XP</Text>
                </View>
              ))}
            </View>
          </View>
        ) : (
          // --- METRICS / TRACKING SECTION ---
          <View style={{ gap: 20 }}>
            {/* Weight Chart Mock */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Peso Corporal</Text>
              <View style={styles.chartMock}>
                {MOCK_PROGRESS.weightHistory.map((point, idx) => {
                  const barHeight = (point.weight / 80) * 100; // Fake scale relative to 80kg
                  return (
                    <View key={idx} style={styles.chartBarContainer}>
                      <Text style={styles.chartValue}>{point.weight}</Text>
                      <View style={[styles.chartBar, { height: `${barHeight}%` }]} />
                      <Text style={styles.chartLabel}>{point.date}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Strength Gains (1RMs) */}
            <View>
              <Text style={styles.sectionTitle}>Mejoras de Fuerza (1RM)</Text>
              {MOCK_PROGRESS.strengthGains.map((gain, idx) => (
                <View key={idx} style={styles.gainCard}>
                  <Text style={styles.gainExercise}>{gain.exercise}</Text>
                  <View style={styles.gainRow}>
                    <Text style={styles.gainStart}>{gain.start}kg</Text>
                    <MaterialIcons name="arrow-right-alt" size={20} color="#00E676" />
                    <Text style={styles.gainCurrent}>{gain.current}kg</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Stats Overview */}
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{MOCK_USER.stats.streak}</Text>
                <Text style={styles.statLabel}>Racha Actual</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{MOCK_USER.stats.prs}</Text>
                <Text style={styles.statLabel}>Total PRs</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    padding: 20,
    backgroundColor: '#0F0F23',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A2E',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF4500',
    marginBottom: 16,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#111111',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#222222',
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  segmentActive: {
    backgroundColor: '#2A2A4A',
  },
  segmentText: {
    color: '#888888',
    fontWeight: '600',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#222222',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelBadgeBig: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF4500',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  levelNumberBig: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },
  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  xpText: {
    fontSize: 14,
    color: '#A0A0B8',
    marginTop: 2,
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: '#333333',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FF4500',
    borderRadius: 5,
  },
  challengeCard: {
    backgroundColor: '#1A1A2E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A4A',
  },
  challengeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  challengeName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  daysLeft: {
    color: '#FF4500',
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressBarBackgroundSm: {
    height: 6,
    backgroundColor: '#111111',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFillSm: {
    height: '100%',
    backgroundColor: '#00D9FF',
    borderRadius: 3,
  },
  challengeProgressText: {
    color: '#888888',
    fontSize: 12,
    marginTop: 8,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  badgeItem: {
    width: '30%',
    alignItems: 'center',
    backgroundColor: '#111111',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222222',
  },
  badgeIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#1A1A2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeName: {
    color: '#EAEAEA',
    fontSize: 11,
    textAlign: 'center',
    fontWeight: '600',
  },
  leaderboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  rankText: {
    color: '#888888',
    fontWeight: 'bold',
    width: 30,
  },
  userNameText: {
    flex: 1,
    color: '#EAEAEA',
    fontSize: 15,
  },
  currentUserText: {
    color: '#FF4500',
    fontWeight: 'bold',
  },
  userXpText: {
    color: '#00D9FF',
    fontWeight: 'bold',
  },
  // Metrics styles
  chartMock: {
    flexDirection: 'row',
    height: 150,
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingTop: 20,
  },
  chartBarContainer: {
    alignItems: 'center',
    width: 40,
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: 12,
    backgroundColor: '#00E676',
    borderRadius: 6,
    marginVertical: 8,
  },
  chartValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  chartLabel: {
    color: '#888888',
    fontSize: 11,
  },
  gainCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111111',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#222222',
  },
  gainExercise: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  gainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gainStart: {
    color: '#888888',
    fontSize: 14,
  },
  gainCurrent: {
    color: '#00E676',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#1A1A2E',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A2A4A',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF4500',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#A0A0B8',
  }
});

export default ProgressScreen;

