import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import PremiumButton from './PremiumButton';
import { colors, radii, spacing } from '../../theme/theme';

type Props = {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  title: string;
  description: string;
  actionLabel?: string;
  onActionPress?: () => void;
};

const StateCard = ({ icon, title, description, actionLabel, onActionPress }: Props) => (
  <View style={styles.card}>
    <View style={styles.iconWrap}>
      <MaterialIcons name={icon} size={28} color={colors.accent} />
    </View>
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.description}>{description}</Text>
    {actionLabel && onActionPress ? (
      <PremiumButton
        label={actionLabel}
        onPress={onActionPress}
        size="md"
        style={styles.action}
      />
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: spacing.xs,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
  action: {
    marginTop: spacing.lg,
    minWidth: 160,
  },
});

export default StateCard;
