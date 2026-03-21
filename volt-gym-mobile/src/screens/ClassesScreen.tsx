import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { classesApi, ScheduledClass, ClassType } from '../features/classes/api/classesApi';
import { userService, UserProfile } from '../services/userService';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, getInsetBottomPadding } from '../theme/theme';

type Props = NativeStackScreenProps<any, 'Classes'>;

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  // 0 = Sunday, 1 = Monday. We want Monday = 0
  let day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
}

function getMonthCalendar(baseDate: Date): CalendarDay[] {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  
  const daysInMonth = getDaysInMonth(year, month);
  const startingDay = getFirstDayOfMonth(year, month);
  
  const days: CalendarDay[] = [];
  
  // Previous month trailing days (empty slots or faded)
  const prevMonthDate = new Date(year, month, 0);
  const daysInPrevMonth = prevMonthDate.getDate();
  for (let i = startingDay - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, daysInPrevMonth - i),
      isCurrentMonth: false,
    });
  }
  
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      date: new Date(year, month, i),
      isCurrentMonth: true,
    });
  }
  
  // Next month leading days (to fill the grid to 42 cells = 6 rows)
  const remainingCells = 42 - days.length;
  for (let i = 1; i <= remainingCells; i++) {
    days.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false,
    });
  }
  
  return days;
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

const ClassesScreen = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const [schedule, setSchedule] = useState<ScheduledClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>(getMonthCalendar(new Date()));
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [classTypes, setClassTypes] = useState<ClassType[]>([]);

  const loadSchedule = useCallback(async () => {
    try {
      // Load a wide range of schedule data to cover the visible month grid
      const fromDate = calendarDays[0].date;
      const toDate = calendarDays[calendarDays.length - 1].date;
      const from = formatDate(fromDate);
      const to = formatDate(toDate);
      const data = await classesApi.getSchedule(from, to);
      setSchedule(data);
    } catch (err) {
      console.error('Error cargando clases:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [calendarDays]);

  useEffect(() => {
    const init = async () => {
      const profile = await userService.getProfile();
      setUserProfile(profile);
      
      if (profile?.roles.includes('admin') || profile?.roles.includes('coach')) {
        const types = await classesApi.getClassTypes();
        setClassTypes(types);
      }
      
      await loadSchedule();
    };
    init();
  }, [loadSchedule]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadSchedule();
  }, [loadSchedule]);

  const handleMonthChange = (direction: number) => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + direction, 1);
    setCurrentMonth(newMonth);
    setCalendarDays(getMonthCalendar(newMonth));
    setLoading(true); // Re-fetch the schedule for the new expanded view
  };

  const handleEnroll = async (classItem: ScheduledClass) => {
    setEnrollingId(classItem.id);
    try {
      if (classItem.is_enrolled) {
        await classesApi.unenrollFromClass(classItem.id);
      } else {
        await classesApi.enrollInClass(classItem.id);
      }
      await loadSchedule();
    } catch (err: any) {
      const message = err?.response?.data?.detail || 'Error al procesar tu solicitud';
      Alert.alert('Error', message);
    } finally {
      setEnrollingId(null);
    }
  };

  const handleSeeParticipants = async (classId: string) => {
    try {
      const enrollments = await classesApi.getEnrollments(classId);
      const names = enrollments.map((e: any) => e.user_name).join('\n') || 'Nadie inscrito todavía';
      Alert.alert('Inscritos', names);
    } catch (err) {
      Alert.alert('Error', 'No se pudieron cargar los participantes');
    }
  };

  const handleCreateClass = () => {
    // For now, just a placeholder of what we'll implement next:
    // This will open a modal to select type, date and time.
    Alert.alert('Próximamente', 'Estamos habilitando el panel de creación para entrenadores.');
  };

  const isCoachOrAdmin = userProfile?.roles.includes('coach') || userProfile?.roles.includes('admin');

  const filteredClasses = schedule.filter(
    (c) => c.scheduled_date === formatDate(selectedDate)
  );

  const myEnrollments = schedule.filter((c) => c.is_enrolled);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color={colors.accent} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Clases grupales</Text>
        </View>

        {/* Month Calendar */}
        <View style={styles.calendarContainer}>
          <View style={styles.monthHeader}>
            <TouchableOpacity onPress={() => handleMonthChange(-1)} style={styles.monthArrow}>
              <MaterialIcons name="chevron-left" size={28} color="#FF4500" />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }).replace(/^\w/, (c) => c.toUpperCase())}
            </Text>
            <TouchableOpacity onPress={() => handleMonthChange(1)} style={styles.monthArrow}>
              <MaterialIcons name="chevron-right" size={28} color="#FF4500" />
            </TouchableOpacity>
          </View>

          <View style={styles.daysHeaderRow}>
            {DAYS.map((day, ix) => (
              <Text key={`header-${ix}`} style={styles.dayHeaderLabel}>{day}</Text>
            ))}
          </View>
          <View style={styles.calendarDivider} />

          <View style={styles.calendarGrid}>
            {calendarDays.map((calDay, i) => {
              const d = calDay.date;
              const dFormat = formatDate(d);
              const isSelected = dFormat === formatDate(selectedDate);
              const isToday = dFormat === formatDate(new Date());
              const hasClasses = schedule.some((c) => c.scheduled_date === dFormat);
              const isCurrentMonth = calDay.isCurrentMonth;

              return (
                <TouchableOpacity
                  key={`day-${i}`}
                  style={[
                    styles.calendarCell,
                    isSelected && styles.calendarCellSelected,
                    isToday && !isSelected && styles.calendarCellToday,
                  ]}
                  onPress={() => setSelectedDate(d)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.calendarCellNumber,
                      isSelected && styles.calendarCellNumberSelected,
                      !isCurrentMonth && styles.calendarCellNumberFaded,
                    ]}
                  >
                    {d.getDate()}
                  </Text>
                  {hasClasses && (
                    <View style={[styles.calendarDot, isSelected && styles.calendarDotSelected]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* My Enrollments Quick Section */}
        {myEnrollments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mis inscripciones</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {myEnrollments.map((c) => (
                <View
                  key={c.id}
                  style={[styles.enrollmentChip, { borderColor: c.class_type.color }]}
                >
                  <View style={[styles.chipDot, { backgroundColor: c.class_type.color }]} />
                  <View>
                    <Text style={styles.chipName}>{c.class_type.name}</Text>
                    <Text style={styles.chipTime}>
                      {c.scheduled_date} · {c.start_time}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Classes for Selected Day */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {formatDate(selectedDate) === formatDate(new Date())
              ? 'Clases de hoy'
              : `Clases del ${selectedDate.getDate()}/${selectedDate.getMonth() + 1}`}
          </Text>

          {filteredClasses.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="calendar-blank" size={64} color="#222222" />
              <Text style={styles.emptyText}>No hay clases para este día</Text>
              {isCoachOrAdmin && (
                <TouchableOpacity style={styles.emptyButton} onPress={handleCreateClass}>
                  <Text style={styles.emptyButtonText}>Programar clase</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredClasses.map((classItem) => (
              <View
                key={classItem.id}
                style={[
                  styles.classCard,
                  classItem.is_cancelled && styles.classCardCancelled,
                ]}
              >
                {/* Color bar */}
                <View
                  style={[
                    styles.classColorBar,
                    { backgroundColor: classItem.class_type.color },
                  ]}
                />

                <View style={styles.classContent}>
                  <View style={styles.classHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.className}>{classItem.class_type.name}</Text>
                      {classItem.instructor_name && (
                        <Text style={styles.classInstructor}>
                          <MaterialIcons name="person" size={14} color="#A0A0B8" />{' '}
                          {classItem.instructor_name}
                        </Text>
                      )}
                    </View>
                    {classItem.is_cancelled && (
                      <View style={styles.cancelledBadge}>
                        <Text style={styles.cancelledText}>Cancelada</Text>
                      </View>
                    )}
                    {isCoachOrAdmin && (
                      <TouchableOpacity 
                        onPress={() => handleSeeParticipants(classItem.id)}
                        style={styles.participantsButton}
                      >
                        <MaterialIcons name="people" size={20} color="#FF4500" />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={styles.classDetails}>
                    <View style={styles.classDetailItem}>
                      <MaterialIcons name="schedule" size={16} color="#A0A0B8" />
                      <Text style={styles.classDetailText}>
                        {classItem.start_time} — {classItem.end_time}
                      </Text>
                    </View>
                    <View style={styles.classDetailItem}>
                      <MaterialIcons name="location-on" size={16} color="#A0A0B8" />
                      <Text style={styles.classDetailText}>{classItem.location}</Text>
                    </View>
                    <View style={styles.classDetailItem}>
                      <MaterialIcons name="group" size={16} color="#A0A0B8" />
                      <Text style={styles.classDetailText}>
                        {classItem.enrolled_count}/{classItem.max_capacity} inscritos
                      </Text>
                    </View>
                  </View>

                  {!classItem.is_cancelled && (
                    <TouchableOpacity
                      style={[
                        styles.enrollButton,
                        classItem.is_enrolled && styles.enrolledButton,
                        classItem.enrolled_count >= classItem.max_capacity &&
                          !classItem.is_enrolled &&
                          styles.fullButton,
                      ]}
                      onPress={() => handleEnroll(classItem)}
                      disabled={
                        enrollingId === classItem.id ||
                        (classItem.enrolled_count >= classItem.max_capacity &&
                          !classItem.is_enrolled)
                      }
                      activeOpacity={0.7}
                    >
                      {enrollingId === classItem.id ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.enrollButtonText}>
                          {classItem.is_enrolled
                            ? 'Desinscribirme'
                            : classItem.enrolled_count >= classItem.max_capacity
                            ? 'Clase llena'
                            : 'Inscribirme'}
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* FAB for creation */}
      {isCoachOrAdmin && (
        <TouchableOpacity 
          style={[styles.fab, { bottom: getInsetBottomPadding(30, insets.bottom) }]} 
          onPress={handleCreateClass}
          activeOpacity={0.8}
        >
          <MaterialIcons name="add" size={32} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },

  // Week Selector
  weekSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  weekArrow: {
    padding: 4,
  },
  daysRow: {
    flex: 1,
  },
  dayPill: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginHorizontal: 3,
    backgroundColor: colors.surface,
    minWidth: 44,
  },
  dayPillSelected: {
    backgroundColor: colors.accent,
  },
  dayPillToday: {
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 0, 0.5)',
  },
  dayLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  dayLabelSelected: {
    color: colors.textPrimary,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  dayNumberSelected: {
    color: '#FFFFFF',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginTop: 4,
  },
  dotSelected: {
    backgroundColor: '#FFFFFF',
  },

  // Month Calendar
  calendarContainer: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    paddingTop: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.border,
  },
  monthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  monthArrow: {
    padding: 4,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  daysHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  dayHeaderLabel: {
    width: 38,
    textAlign: 'center',
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: 'bold',
  },
  calendarDivider: {
    height: 1,
    backgroundColor: '#333333',
    marginBottom: 10,
    marginHorizontal: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  calendarCell: {
    width: '14.28%', // 100/7
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    marginVertical: 2,
  },
  calendarCellSelected: {
    backgroundColor: colors.accent,
    borderRadius: 22,
  },
  calendarCellToday: {
    borderWidth: 1.5,
    borderColor: 'rgba(255, 69, 0, 0.8)',
    borderRadius: 22,
  },
  calendarCellNumber: {
    fontSize: 17,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  calendarCellNumberSelected: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  calendarCellNumberFaded: {
    color: '#444444',
  },
  calendarDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    position: 'absolute',
    bottom: 4,
  },
  calendarDotSelected: {
    backgroundColor: '#FFFFFF',
  },

  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },

  // Enrollment Chips
  enrollmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 10,
    borderWidth: 1,
    gap: 10,
  },
  chipDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  chipName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  chipTime: {
    fontSize: 12,
    color: '#A0A0B8',
    marginTop: 2,
  },

  // Class Card
  classCard: {
    flexDirection: 'row',
    backgroundColor: '#111111',
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  classCardCancelled: {
    opacity: 0.5,
  },
  classColorBar: {
    width: 5,
  },
  classContent: {
    flex: 1,
    padding: 16,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  className: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  classInstructor: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  cancelledBadge: {
    backgroundColor: 'rgba(255, 0, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  cancelledText: {
    color: '#FF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  classDetails: {
    gap: 6,
    marginBottom: 14,
  },
  classDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  classDetailText: {
    fontSize: 13,
    color: '#A0A0B8',
  },

  // Enroll Button
  enrollButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  enrolledButton: {
    backgroundColor: '#333333',
    borderWidth: 1,
    borderColor: colors.accent,
  },
  fullButton: {
    backgroundColor: '#222222',
    opacity: 0.6,
  },
  enrollButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyText: {
    color: '#A0A0B8',
    fontSize: 15,
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyButtonText: {
    color: colors.accent,
    fontWeight: 'bold',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: colors.accent,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  participantsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentSoft,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.accentBorder,
  },
});

export default ClassesScreen;
