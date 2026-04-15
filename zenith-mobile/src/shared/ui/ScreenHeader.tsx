import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radii, spacing } from '../../theme/theme';

type Props = {
  title: string;
  subtitle?: string;
  left?: React.ReactNode;
  right?: React.ReactNode;
  accentTitle?: boolean;
  alignment?: 'start' | 'center';
};

const ScreenHeader = ({
  title,
  subtitle,
  left,
  right,
  accentTitle = true,
  alignment = 'start',
}: Props) => (
  <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
    <View style={[styles.header, alignment === 'center' && styles.headerCentered]}>
      {left ? <View style={styles.side}>{left}</View> : null}
      <View
        style={[
          styles.center,
          alignment === 'center' ? styles.centerAligned : styles.centerStart,
        ]}
      >
        <Text style={[styles.title, accentTitle && styles.titleAccent]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {right ? <View style={[styles.side, styles.sideRight]}>{right}</View> : null}
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.chrome,
  },
  header: {
    minHeight: 78,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  headerCentered: {
    alignItems: 'center',
  },
  side: {
    width: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radii.pill,
  },
  sideRight: {
    alignItems: 'flex-end',
  },
  center: {
    flex: 1,
    gap: 4,
    paddingTop: 4,
  },
  centerStart: {
    alignItems: 'flex-start',
  },
  centerAligned: {
    alignItems: 'center',
  },
  title: {
    color: colors.accent,
    fontSize: 24,
    fontWeight: '800',
  },
  titleAccent: {
    color: colors.accent,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'left',
  },
});

export default ScreenHeader;
