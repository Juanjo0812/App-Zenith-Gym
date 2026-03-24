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
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  LeaderboardEntry,
  ProgressOverview,
  StrengthGain,
  WeightLog,
  progressApi,
} from '../features/progress/api/progressApi';
import { getXpProgress } from '../services/userService';
import { colors } from '../theme/theme';

const XP_PER_LEVEL = 500;

type ProgressSectionKey = 'overview' | 'weightHistory' | 'strengthGains' | 'leaderboard';
type SectionErrors = Partial<Record<ProgressSectionKey, string>>;

type StateCardProps = {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  title: string;
  description: string;
  actionLabel?: string;
  onPress?: () => void;
};

const SECTION_LABELS: Record<ProgressSectionKey, string> = {
  overview: 'el resumen',
  weightHistory: 'el historial de peso',
  strengthGains: 'las ganancias de fuerza',
  leaderboard: 'el ranking',
};

const SECTION_FALLBACK_MESSAGES: Record<ProgressSectionKey, string> = {
  overview: 'El servidor tuvo un problema al cargar tu resumen de progreso.',
  weightHistory: 'El servidor tuvo un problema al cargar tu historial de peso.',
  strengthGains: 'El servidor tuvo un problema al cargar tus ganancias de fuerza.',
  leaderboard: 'El servidor tuvo un problema al cargar el ranking.',
};

const getProgress = (value: number, target: number) =>
  target > 0 ? Math.min((value / target) * 100, 100) : 0;

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short' }).format(
    new Date(`${iso}T12:00:00`)
  );

const getProgressErrorMessage = (error: unknown, fallback: string) => {
  const response = (error as { response?: { status?: number; data?: { detail?: unknown } } })?.response;
  const detail = response?.data?.detail;

  if (typeof detail === 'string' && detail.trim().length > 0) {
    return detail;
  }
  if (response?.status === 404) {
    return 'La API de progreso no respondió en la ruta esperada.';
  }
  if (response?.status && response.status >= 500) {
    return fallback;
  }

  return 'No pudimos cargar tu progreso.';
};

const formatSectionList = (sections: string[]) => {
  if (sections.length <= 1) {
    return sections[0] ?? '';
  }
  if (sections.length === 2) {
    return `${sections[0]} y ${sections[1]}`;
  }

  return `${sections.slice(0, -1).join(', ')} y ${sections[sections.length - 1]}`;
};

const buildErrorMessage = (sectionErrors: SectionErrors) => {
  const failedSections = Object.keys(sectionErrors) as ProgressSectionKey[];

  if (failedSections.length === 0) {
    return '';
  }
  if (failedSections.length === 1) {
    return sectionErrors[failedSections[0]] ?? 'No pudimos cargar tu progreso.';
  }

  return `Algunas secciones no se pudieron cargar: ${formatSectionList(
    failedSections.map((section) => SECTION_LABELS[section])
  )}.`;
};

const getLevelXpDetails = (totalXp: number, level: number, nextLevelXp: number) => {
  const currentLevelStart = Math.max((level - 1) * XP_PER_LEVEL, 0);
  const currentLevelGoal = nextLevelXp > currentLevelStart ? nextLevelXp - currentLevelStart : XP_PER_LEVEL;

  return {
    currentLevelXp: Math.max(totalXp - currentLevelStart, 0),
    currentLevelGoal,
  };
};

const StateCard = ({ icon, title, description, actionLabel, onPress }: StateCardProps) => (
  <View style={styles.emptyState}>
    <MaterialIcons name={icon} size={40} color={colors.textMuted} />
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptyText}>{description}</Text>
    {actionLabel && onPress ? (
      <TouchableOpacity style={styles.emptyAction} onPress={onPress}>
        <Text style={styles.emptyActionText}>{actionLabel}</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

const ProgressScreen = () => {
  const hasLoadedRef = useRef(false);
  const [activeTab, setActiveTab] = useState<'gamification' | 'tracking'>('gamification');

  const [overview, setOverview] = useState<ProgressOverview | null>(null);
  const [weightHistory, setWeightHistory] = useState<WeightLog[]>([]);
  const [strengthGains, setStrengthGains] = useState<StrengthGain[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [sectionErrors, setSectionErrors] = useState<SectionErrors>({});

  const [weightInput, setWeightInput] = useState('');
  const [weightNotes, setWeightNotes] = useState('');

  const resetWeightForm = useCallback(() => {
    setWeightInput('');
    setWeightNotes('');
  }, []);

  const closeWeightModal = useCallback(() => {
    setShowWeightModal(false);
    resetWeightForm();
  }, [resetWeightForm]);

  const loadData = useCallback(async ({ showLoader = true }: { showLoader?: boolean } = {}) => {
    if (showLoader) {
      setLoading(true);
    }

    try {
      const [overviewResult, weightHistoryResult, strengthGainsResult, leaderboardResult] =
        await Promise.allSettled([
          progressApi.getOverview(),
          progressApi.getWeightHistory(),
          progressApi.getStrengthGains(),
          progressApi.getLeaderboard(),
        ]);

      const nextErrors: SectionErrors = {};

      if (overviewResult.status === 'fulfilled') {
        setOverview(overviewResult.value);
      } else {
        nextErrors.overview = getProgressErrorMessage(
          overviewResult.reason,
          SECTION_FALLBACK_MESSAGES.overview
        );
        console.error('Error cargando resumen de progreso:', overviewResult.reason);
      }

      if (weightHistoryResult.status === 'fulfilled') {
        setWeightHistory(weightHistoryResult.value);
      } else {
        nextErrors.weightHistory = getProgressErrorMessage(
          weightHistoryResult.reason,
          SECTION_FALLBACK_MESSAGES.weightHistory
        );
        console.error('Error cargando historial de peso:', weightHistoryResult.reason);
      }

      if (strengthGainsResult.status === 'fulfilled') {
        setStrengthGains(strengthGainsResult.value);
      } else {
        nextErrors.strengthGains = getProgressErrorMessage(
          strengthGainsResult.reason,
          SECTION_FALLBACK_MESSAGES.strengthGains
        );
        console.error('Error cargando ganancias de fuerza:', strengthGainsResult.reason);
      }

      if (leaderboardResult.status === 'fulfilled') {
        setLeaderboard(leaderboardResult.value);
      } else {
        nextErrors.leaderboard = getProgressErrorMessage(
          leaderboardResult.reason,
          SECTION_FALLBACK_MESSAGES.leaderboard
        );
        console.error('Error cargando ranking:', leaderboardResult.reason);
      }

      setSectionErrors(nextErrors);
      setErrorMessage(buildErrorMessage(nextErrors));
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

  const handleLogWeight = async () => {
    const kg = parseFloat(weightInput);

    if (!Number.isFinite(kg) || kg < 20 || kg > 500) {
      Alert.alert('Error', 'Ingresa un peso válido (20-500 kg)');
      return;
    }

    setSubmitting(true);
    try {
      await progressApi.logWeight(kg, undefined, weightNotes.trim() || undefined);
      closeWeightModal();
      await loadData({ showLoader: false });
    } catch {
      Alert.alert('Error', 'No se pudo registrar el peso');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteWeight = (id: string) => {
    Alert.alert('Eliminar registro', '¿Eliminar este registro de peso?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            await progressApi.deleteWeight(id);
            await loadData({ showLoader: false });
          } catch {
            Alert.alert('Error', 'No se pudo eliminar');
          }
        },
      },
    ]);
  };

  const level = overview?.level ?? 1;
  const totalXp = overview?.total_xp ?? 0;
  const xpNext = overview?.xp_next_level ?? XP_PER_LEVEL;
  const { currentLevelXp, currentLevelGoal } = getLevelXpDetails(totalXp, level, xpNext);
  const xpProgress = getXpProgress(totalXp, level);

  const badges = overview?.badges ?? [];
  const unlockedBadges = badges.filter((badge) => badge.unlocked);
  const challenges = overview?.challenges ?? [];

  const maxWeight = weightHistory.length > 0 ? Math.max(...weightHistory.map((entry) => entry.weight_kg)) : 100;
  const chartScale = maxWeight * 1.1;
  const hasAnyContent =
    overview !== null || weightHistory.length > 0 || strengthGains.length > 0 || leaderboard.length > 0;
  const showInitialErrorState = !loading && !hasAnyContent && errorMessage.length > 0;

  const header = (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Tu evolución</Text>
      <View style={styles.segmentedControl}>
        <TouchableOpacity
          style={[styles.segment, activeTab === 'gamification' && styles.segmentActive]}
          onPress={() => setActiveTab('gamification')}
        >
          <Text style={[styles.segmentText, activeTab === 'gamification' && styles.segmentTextActive]}>
            Logros
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segment, activeTab === 'tracking' && styles.segmentActive]}
          onPress={() => setActiveTab('tracking')}
        >
          <Text style={[styles.segmentText, activeTab === 'tracking' && styles.segmentTextActive]}>
            Métricas
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading && !hasAnyContent) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color={colors.accent} style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (showInitialErrorState) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        {header}
        <View style={styles.stateScreen}>
          <StateCard
            icon="error-outline"
            title="No se pudo cargar progreso"
            description={errorMessage}
            actionLabel="Reintentar"
            onPress={() => loadData({ showLoader: true })}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {header}

      {errorMessage ? (
        <View style={styles.banner}>
          <MaterialIcons name="warning-amber" size={20} color={colors.accent} />
          <Text style={styles.bannerText}>{errorMessage}</Text>
          <TouchableOpacity
            style={styles.bannerAction}
            onPress={() => loadData({ showLoader: !hasAnyContent })}
          >
            <Text style={styles.bannerActionText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'gamification' ? (
          <View style={styles.sectionGroup}>
            {overview ? (
              <>
                <View style={styles.card}>
                  <View style={styles.levelRow}>
                    <View style={styles.levelBadgeBig}>
                      <Text style={styles.levelNumberBig}>{level}</Text>
                    </View>
                    <View style={styles.levelInfo}>
                      <Text style={styles.levelTitle}>Nivel {level}</Text>
                      <Text style={styles.xpText}>
                        {totalXp} XP total · {currentLevelXp} / {currentLevelGoal} XP nivel
                      </Text>
                    </View>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${xpProgress}%` }]} />
                  </View>
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.statPill}>
                    <MaterialIcons name="fitness-center" size={18} color={colors.accent} />
                    <Text style={styles.statPillValue}>{overview.total_workouts}</Text>
                    <Text style={styles.statPillLabel}>Entrenos</Text>
                  </View>
                  <View style={styles.statPill}>
                    <MaterialIcons name="local-fire-department" size={18} color="#FF7043" />
                    <Text style={styles.statPillValue}>{overview.streak}</Text>
                    <Text style={styles.statPillLabel}>Racha</Text>
                  </View>
                  <View style={styles.statPill}>
                    <MaterialIcons name="emoji-events" size={18} color="#FFD600" />
                    <Text style={styles.statPillValue}>{overview.prs}</Text>
                    <Text style={styles.statPillLabel}>PRs</Text>
                  </View>
                  <View style={styles.statPill}>
                    <MaterialIcons name="star" size={18} color="#00D9FF" />
                    <Text style={styles.statPillValue}>{unlockedBadges.length}</Text>
                    <Text style={styles.statPillLabel}>Medallas</Text>
                  </View>
                </View>

                {challenges.length > 0 ? (
                  <View>
                    <Text style={styles.sectionTitle}>Retos activos</Text>
                    {challenges.map((challenge) => (
                      <View key={challenge.id} style={styles.challengeCard}>
                        <View style={styles.challengeHeaderRow}>
                          <Text style={styles.challengeName}>{challenge.name}</Text>
                          <Text style={styles.daysLeft}>{challenge.days_left} días</Text>
                        </View>
                        {challenge.description ? (
                          <Text style={styles.challengeDesc}>{challenge.description}</Text>
                        ) : null}
                        <View style={styles.progressBarBgSm}>
                          <View
                            style={[
                              styles.progressBarFillSm,
                              {
                                width: `${getProgress(challenge.current_value, challenge.goal_value)}%`,
                                backgroundColor: challenge.completed ? '#00E676' : '#00D9FF',
                              },
                            ]}
                          />
                        </View>
                        <View style={styles.challengeFooter}>
                          <Text style={styles.challengeProgressText}>
                            {challenge.current_value} / {challenge.goal_value}
                          </Text>
                          <Text style={styles.challengeXp}>+{challenge.xp_reward} XP</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                ) : null}

                <View>
                  <Text style={styles.sectionTitle}>
                    Medallas ({unlockedBadges.length}/{badges.length})
                  </Text>
                  <View style={styles.badgesGrid}>
                    {badges.map((badge) => (
                      <View
                        key={badge.id}
                        style={[styles.badgeItem, !badge.unlocked && styles.badgeLocked]}
                      >
                        <View style={[styles.badgeIconBg, badge.unlocked && styles.badgeIconUnlocked]}>
                          <MaterialIcons
                            name={badge.icon as React.ComponentProps<typeof MaterialIcons>['name']}
                            size={28}
                            color={badge.unlocked ? '#00D9FF' : '#555'}
                          />
                        </View>
                        <Text style={[styles.badgeName, !badge.unlocked && styles.badgeNameLocked]}>
                          {badge.name}
                        </Text>
                        {badge.description ? <Text style={styles.badgeDesc}>{badge.description}</Text> : null}
                        <Text style={styles.badgeXp}>+{badge.xp_reward} XP</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </>
            ) : (
              <View style={styles.card}>
                <StateCard
                  icon="query-stats"
                  title="Resumen no disponible"
                  description={sectionErrors.overview ?? 'No pudimos cargar tu resumen de progreso.'}
                />
              </View>
            )}

            {leaderboard.length > 0 ? (
              <View style={styles.card}>
                <View style={styles.leaderboardHeader}>
                  <MaterialIcons name="leaderboard" size={20} color={colors.accent} />
                  <Text style={styles.cardTitle}>Ranking</Text>
                </View>
                {leaderboard.map((entry) => (
                  <View key={`${entry.rank}-${entry.name}`} style={styles.leaderboardRow}>
                    <Text
                      style={[
                        styles.rankText,
                        entry.rank <= 3 && { color: ['#FFD600', '#C0C0C0', '#CD7F32'][entry.rank - 1] },
                      ]}
                    >
                      #{entry.rank}
                    </Text>
                    <Text style={[styles.userNameText, entry.is_current_user && styles.currentUserText]}>
                      {entry.name}
                      {entry.is_current_user ? ' (tú)' : ''}
                    </Text>
                    <Text style={styles.userXpText}>{entry.xp} XP</Text>
                  </View>
                ))}
              </View>
            ) : sectionErrors.leaderboard ? (
              <View style={styles.card}>
                <View style={styles.leaderboardHeader}>
                  <MaterialIcons name="leaderboard" size={20} color={colors.accent} />
                  <Text style={styles.cardTitle}>Ranking</Text>
                </View>
                <StateCard
                  icon="leaderboard"
                  title="Ranking no disponible"
                  description={sectionErrors.leaderboard}
                />
              </View>
            ) : null}
          </View>
        ) : (
          <View style={styles.sectionGroup}>
            <View style={styles.card}>
              <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>Peso corporal</Text>
                <TouchableOpacity
                  onPress={() => setShowWeightModal(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Registrar peso"
                >
                  <MaterialIcons name="add-circle-outline" size={24} color={colors.accent} />
                </TouchableOpacity>
              </View>

              {weightHistory.length > 0 ? (
                <>
                  <View style={styles.weightSummary}>
                    <View style={styles.weightStatItem}>
                      <Text style={styles.weightStatLabel}>Actual</Text>
                      <Text style={styles.weightStatValue}>
                        {weightHistory[weightHistory.length - 1].weight_kg} kg
                      </Text>
                    </View>
                    {weightHistory.length > 1 ? (
                      <>
                        <View style={styles.weightStatItem}>
                          <Text style={styles.weightStatLabel}>Inicio</Text>
                          <Text style={styles.weightStatValue}>{weightHistory[0].weight_kg} kg</Text>
                        </View>
                        <View style={styles.weightStatItem}>
                          <Text style={styles.weightStatLabel}>Cambio</Text>
                          <Text
                            style={[
                              styles.weightStatValue,
                              {
                                color:
                                  weightHistory[weightHistory.length - 1].weight_kg > weightHistory[0].weight_kg
                                    ? '#00E676'
                                    : '#FF7043',
                              },
                            ]}
                          >
                            {(
                              weightHistory[weightHistory.length - 1].weight_kg - weightHistory[0].weight_kg
                            ).toFixed(1)}{' '}
                            kg
                          </Text>
                        </View>
                      </>
                    ) : null}
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chartContainer}
                  >
                    {weightHistory.map((point) => {
                      const barHeight = (point.weight_kg / chartScale) * 120;

                      return (
                        <TouchableOpacity
                          key={point.id}
                          style={styles.chartBarContainer}
                          onLongPress={() => handleDeleteWeight(point.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.chartValue}>{point.weight_kg}</Text>
                          <View style={[styles.chartBar, { height: barHeight }]} />
                          <Text style={styles.chartLabel}>{formatDate(point.date)}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                  <Text style={styles.longPressHint}>Mantén presionado un registro para eliminarlo.</Text>
                </>
              ) : sectionErrors.weightHistory ? (
                <StateCard
                  icon="monitor-weight"
                  title="Peso no disponible"
                  description={sectionErrors.weightHistory}
                />
              ) : (
                <StateCard
                  icon="monitor-weight"
                  title="Sin registros de peso"
                  description="Toca el botón + para empezar a registrar tu peso."
                />
              )}
            </View>

            <View>
              <Text style={styles.sectionTitle}>Ganancias de fuerza</Text>
              {strengthGains.length > 0 ? (
                strengthGains.map((gain) => (
                  <View key={gain.exercise_name} style={styles.gainCard}>
                    <Text style={styles.gainExercise}>{gain.exercise_name}</Text>
                    <View style={styles.gainRow}>
                      <Text style={styles.gainStart}>{gain.first_max_kg} kg</Text>
                      <MaterialIcons name="arrow-right-alt" size={20} color="#00E676" />
                      <Text style={styles.gainCurrent}>{gain.current_max_kg} kg</Text>
                      <View style={styles.gainPctBadge}>
                        <Text style={styles.gainPctText}>+{gain.improvement_pct}%</Text>
                      </View>
                    </View>
                  </View>
                ))
              ) : sectionErrors.strengthGains ? (
                <StateCard
                  icon="fitness-center"
                  title="Fuerza no disponible"
                  description={sectionErrors.strengthGains}
                />
              ) : (
                <StateCard
                  icon="fitness-center"
                  title="Sin datos de fuerza"
                  description="Completa entrenamientos con peso para ver tu progreso."
                />
              )}
            </View>

            {overview ? (
              <>
                <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{overview.streak}</Text>
                    <Text style={styles.statLabel}>Racha actual</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{overview.prs}</Text>
                    <Text style={styles.statLabel}>Récords totales</Text>
                  </View>
                </View>

                <View style={styles.statsGrid}>
                  <View style={styles.statBox}>
                    <Text style={styles.statValue}>{overview.total_workouts}</Text>
                    <Text style={styles.statLabel}>Entrenos totales</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={[styles.statValue, { fontSize: 16 }]}>
                      {overview.member_since
                        ? new Intl.DateTimeFormat('es-CO', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          }).format(new Date(`${overview.member_since}T12:00:00`))
                        : 'Sin dato'}
                    </Text>
                    <Text style={styles.statLabel}>Miembro desde</Text>
                  </View>
                </View>
              </>
            ) : sectionErrors.overview ? (
              <View style={styles.card}>
                <StateCard
                  icon="query-stats"
                  title="Resumen no disponible"
                  description={sectionErrors.overview}
                />
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>

      <Modal visible={showWeightModal} animationType="slide" transparent onRequestClose={closeWeightModal}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Registrar peso</Text>
              <TouchableOpacity onPress={closeWeightModal}>
                <MaterialIcons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Peso (kg)</Text>
            <TextInput
              style={styles.input}
              placeholder="72.5"
              placeholderTextColor={colors.textMuted}
              keyboardType="decimal-pad"
              value={weightInput}
              onChangeText={setWeightInput}
              autoFocus
            />

            <Text style={styles.inputLabel}>Notas (opcional)</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              placeholder="Ejemplo: después de desayunar"
              placeholderTextColor={colors.textMuted}
              value={weightNotes}
              onChangeText={setWeightNotes}
              multiline
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.primaryButton, submitting && { opacity: 0.6 }]}
              onPress={handleLogWeight}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={colors.textPrimary} />
              ) : (
                <Text style={styles.primaryButtonText}>Guardar peso</Text>
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
    padding: 20,
    backgroundColor: colors.chrome,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', color: colors.accent, marginBottom: 16 },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segment: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  segmentActive: { backgroundColor: colors.surfaceAlt },
  segmentText: { color: colors.textMuted, fontWeight: '600', fontSize: 14 },
  segmentTextActive: { color: colors.textPrimary },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.accentSoft,
    borderBottomWidth: 1,
    borderBottomColor: colors.accentBorder,
  },
  bannerText: { flex: 1, color: colors.textPrimary, fontSize: 13, lineHeight: 18 },
  bannerAction: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.accentBorder,
    backgroundColor: colors.surface,
  },
  bannerActionText: { color: colors.textPrimary, fontSize: 12, fontWeight: '700' },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 28,
    gap: 8,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  emptyText: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  emptyAction: {
    marginTop: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  emptyActionText: { color: colors.textPrimary, fontSize: 13, fontWeight: '700' },
  stateScreen: { flex: 1, justifyContent: 'center', padding: 20 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  sectionGroup: { gap: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  levelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  levelBadgeBig: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  levelNumberBig: { color: colors.textPrimary, fontSize: 24, fontWeight: '900' },
  levelInfo: { flex: 1 },
  levelTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  xpText: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  progressBarBg: {
    height: 10,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 5 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statPill: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  statPillValue: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  statPillLabel: { fontSize: 11, color: colors.textSecondary },
  challengeCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  challengeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  challengeName: { color: colors.textPrimary, fontSize: 15, fontWeight: '700' },
  daysLeft: { color: colors.accent, fontSize: 12, fontWeight: '700' },
  challengeDesc: { color: colors.textSecondary, fontSize: 13, marginBottom: 10 },
  progressBarBgSm: {
    height: 6,
    backgroundColor: colors.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFillSm: { height: '100%', borderRadius: 3 },
  challengeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  challengeProgressText: { color: colors.textMuted, fontSize: 12 },
  challengeXp: { color: '#FFD600', fontSize: 12, fontWeight: '700' },
  badgesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  badgeItem: {
    width: '31%',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badgeLocked: { opacity: 0.45 },
  badgeIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeIconUnlocked: { borderWidth: 2, borderColor: '#00D9FF33' },
  badgeName: { color: colors.textPrimary, fontSize: 11, textAlign: 'center', fontWeight: '700' },
  badgeNameLocked: { color: colors.textMuted },
  badgeDesc: { color: colors.textSecondary, fontSize: 9, textAlign: 'center', marginTop: 2 },
  badgeXp: { color: '#FFD600', fontSize: 10, fontWeight: '700', marginTop: 4 },
  leaderboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rankText: { color: colors.textMuted, fontWeight: '800', width: 36, fontSize: 14 },
  userNameText: { flex: 1, color: colors.textPrimary, fontSize: 15 },
  currentUserText: { color: colors.accent, fontWeight: '700' },
  userXpText: { color: '#00D9FF', fontWeight: '700', fontSize: 14 },
  weightSummary: { flexDirection: 'row', marginBottom: 16, gap: 12 },
  weightStatItem: { flex: 1, alignItems: 'center' },
  weightStatLabel: { fontSize: 12, color: colors.textSecondary },
  weightStatValue: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginTop: 2 },
  chartContainer: { height: 160, alignItems: 'flex-end', paddingTop: 10, gap: 8, paddingRight: 8 },
  chartBarContainer: { alignItems: 'center', width: 44, justifyContent: 'flex-end', height: '100%' },
  chartBar: { width: 14, backgroundColor: '#00E676', borderRadius: 7, marginVertical: 6 },
  chartValue: { color: colors.textPrimary, fontSize: 11, fontWeight: '700' },
  chartLabel: { color: colors.textMuted, fontSize: 10 },
  longPressHint: { marginTop: 12, color: colors.textSecondary, fontSize: 12, textAlign: 'center' },
  gainCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gainExercise: { color: colors.textPrimary, fontSize: 14, fontWeight: '700', flex: 1 },
  gainRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  gainStart: { color: colors.textMuted, fontSize: 14 },
  gainCurrent: { color: '#00E676', fontSize: 15, fontWeight: '700' },
  gainPctBadge: {
    backgroundColor: '#00E67620',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  gainPctText: { color: '#00E676', fontSize: 11, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', gap: 12 },
  statBox: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  statValue: { fontSize: 28, fontWeight: '800', color: colors.accent, marginBottom: 4 },
  statLabel: { fontSize: 13, color: colors.textSecondary },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.7)' },
  modalCard: {
    padding: 24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  inputLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    padding: 14,
    color: colors.textPrimary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  notesInput: { minHeight: 80 },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryButtonText: { color: colors.textPrimary, fontWeight: '700', fontSize: 16 },
});

export default ProgressScreen;
