import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors } from '../../theme/theme';

interface Props {
  durationSeconds: number;
  onComplete: () => void;
  onSkip: () => void;
  onAdjust?: (newDuration: number) => void;
}

const RestTimerOverlay = ({ durationSeconds, onComplete, onSkip, onAdjust }: Props) => {
  const [remaining, setRemaining] = useState(durationSeconds);
  const [totalDuration, setTotalDuration] = useState(durationSeconds);
  const progress = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setRemaining(durationSeconds);
    setTotalDuration(durationSeconds);
    progress.setValue(1);

    Animated.timing(progress, {
      toValue: 0,
      duration: durationSeconds * 1000,
      useNativeDriver: false,
    }).start();
  }, [durationSeconds]);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [totalDuration]);

  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  const adjustTime = (delta: number) => {
    const newTotal = Math.max(10, totalDuration + delta);
    const newRemaining = Math.max(0, remaining + delta);
    setTotalDuration(newTotal);
    setRemaining(newRemaining);
    onAdjust?.(newTotal);

    // Reset animation
    const fraction = newRemaining / newTotal;
    progress.setValue(fraction);
    Animated.timing(progress, {
      toValue: 0,
      duration: newRemaining * 1000,
      useNativeDriver: false,
    }).start();
  };

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.timerHeader}>
          <MaterialIcons name="timer" size={22} color={colors.accent} />
          <Text style={styles.timerLabel}>Descanso</Text>
        </View>

        <Text style={styles.timerText}>{formatTime(remaining)}</Text>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.adjustBtn} onPress={() => adjustTime(-15)}>
            <Text style={styles.adjustBtnText}>-15s</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={onSkip}>
            <Text style={styles.skipBtnText}>Omitir</Text>
            <MaterialIcons name="skip-next" size={18} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.adjustBtn} onPress={() => adjustTime(15)}>
            <Text style={styles.adjustBtnText}>+15s</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    borderColor: colors.accentBorder,
    alignItems: 'center',
  },
  timerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  timerLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '200',
    color: colors.textPrimary,
    fontVariant: ['tabular-nums'],
    marginBottom: 16,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accent,
    borderRadius: 3,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    width: '100%',
    justifyContent: 'center',
  },
  adjustBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  adjustBtnText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
  },
  skipBtnText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
});

export default RestTimerOverlay;
