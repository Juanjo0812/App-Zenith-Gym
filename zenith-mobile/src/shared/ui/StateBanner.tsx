import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import { colors, radii, spacing } from '../../theme/theme';

type Variant = 'info' | 'error' | 'success';

type Props = {
  message: string;
  variant?: Variant;
  actionLabel?: string;
  onActionPress?: () => void;
};

const iconByVariant: Record<Variant, React.ComponentProps<typeof MaterialIcons>['name']> = {
  info: 'info-outline',
  error: 'error-outline',
  success: 'check-circle',
};

const colorByVariant: Record<Variant, string> = {
  info: colors.accent,
  error: colors.error,
  success: colors.success,
};

const backgroundByVariant: Record<Variant, string> = {
  info: colors.accentSoft,
  error: colors.errorSoft,
  success: colors.successSoft,
};

const borderByVariant: Record<Variant, string> = {
  info: colors.accentBorder,
  error: 'rgba(96, 165, 250, 0.42)',
  success: 'rgba(34, 211, 238, 0.42)',
};

const StateBanner = ({ message, variant = 'info', actionLabel, onActionPress }: Props) => (
  <View
    style={[
      styles.banner,
      {
        backgroundColor: backgroundByVariant[variant],
        borderColor: borderByVariant[variant],
      },
    ]}
  >
    <MaterialIcons name={iconByVariant[variant]} size={18} color={colorByVariant[variant]} />
    <Text style={styles.message}>{message}</Text>
    {actionLabel && onActionPress ? (
      <TouchableOpacity style={styles.action} onPress={onActionPress}>
        <Text style={styles.actionText}>{actionLabel}</Text>
      </TouchableOpacity>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  message: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
  },
  action: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
  },
  actionText: {
    color: colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
});

export default StateBanner;
