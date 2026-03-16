import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, Image, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { MOCK_USER, MOCK_PROGRESS } from '../data/mockData';

const ProfileScreen = () => {
  const xpProgress = (MOCK_USER.xp / MOCK_USER.xpNextLevel) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Perfil</Text>
        <TouchableOpacity>
          <MaterialIcons name="settings" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* User Info Header */}
        <View style={styles.profileHeader}>
          <Image 
            source={{ uri: MOCK_USER.avatar }} 
            style={styles.avatar} 
          />
          <Text style={styles.userName}>{MOCK_USER.name}</Text>
          <Text style={styles.memberSince}>Atleta desde {MOCK_USER.stats.memberSince}</Text>
        </View>

        {/* Level Card */}
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

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <MaterialIcons name="fitness-center" size={24} color="#FF4500" />
            <Text style={styles.statValue}>{MOCK_USER.stats.totalWorkouts}</Text>
            <Text style={styles.statLabel}>Entrenos</Text>
          </View>
          <View style={styles.statBox}>
            <MaterialIcons name="local-fire-department" size={24} color="#FF4500" />
            <Text style={styles.statValue}>{MOCK_USER.stats.streak}</Text>
            <Text style={styles.statLabel}>Días (Racha)</Text>
          </View>
          <View style={styles.statBox}>
            <MaterialIcons name="emoji-events" size={24} color="#FF4500" />
            <Text style={styles.statValue}>{MOCK_USER.stats.prs}</Text>
            <Text style={styles.statLabel}>Récords (PRs)</Text>
          </View>
        </View>

        {/* Showcased Badges */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Medallas Destacadas</Text>
            <MaterialIcons name="chevron-right" size={24} color="#A0A0B8" />
          </View>
          <View style={styles.badgesWrapper}>
            {MOCK_PROGRESS.badges.slice(0, 3).map(badge => (
              <View key={badge.id} style={styles.badgeItem}>
                <View style={styles.badgeIconBg}>
                  <MaterialIcons name={badge.icon as any} size={28} color="#00D9FF" />
                </View>
                <Text style={styles.badgeName}>{badge.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* List Menu */}
        <View style={styles.menuList}>
          <TouchableOpacity style={styles.menuItem}>
            <MaterialIcons name="history" size={24} color="#A0A0B8" />
            <Text style={styles.menuItemText}>Historial Completo</Text>
            <MaterialIcons name="chevron-right" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <MaterialIcons name="straighten" size={24} color="#A0A0B8" />
            <Text style={styles.menuItemText}>Medidas Corporales</Text>
            <MaterialIcons name="chevron-right" size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuItem}>
            <MaterialIcons name="group" size={24} color="#A0A0B8" />
            <Text style={styles.menuItemText}>Mis Amigos</Text>
            <MaterialIcons name="chevron-right" size={24} color="#333" />
          </TouchableOpacity>
        </View>

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#0F0F23',
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A2E',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF4500',
  },
  scrollContent: {
    padding: 20,
    gap: 20,
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FF4500',
    marginBottom: 12,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  memberSince: {
    fontSize: 14,
    color: '#888888',
  },
  card: {
    backgroundColor: '#111111',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#222222',
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelBadgeBig: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF4500',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  levelNumberBig: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
  },
  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  xpText: {
    fontSize: 13,
    color: '#A0A0B8',
    marginTop: 2,
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
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#222222',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#A0A0B8',
    textAlign: 'center',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  badgesWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  badgeItem: {
    alignItems: 'center',
    width: '30%',
  },
  badgeIconBg: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1A1A2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeName: {
    color: '#A0A0B8',
    fontSize: 10,
    textAlign: 'center',
  },
  menuList: {
    backgroundColor: '#111111',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#222222',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  menuItemText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 15,
    marginLeft: 16,
  }
});

export default ProfileScreen;

