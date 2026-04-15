import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import ScaleTouchable from './ScaleTouchable';
import { colors, elevation, radii, spacing } from '../../theme/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

type Props = {
  label: string;
  onPress: () => void;
  icon?: React.ComponentProps<typeof MaterialIcons>['name'];
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
};

const sizeStyleMap = {
  sm: { paddingVertical: 10, paddingHorizontal: 14, fontSize: 13, iconSize: 16 },
  md: { paddingVertical: 14, paddingHorizontal: 18, fontSize: 15, iconSize: 18 },
  lg: { paddingVertical: 16, paddingHorizontal: 20, fontSize: 16, iconSize: 20 },
} as const;

const variantStyleMap = {
  primary: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
    textColor: colors.onAccent,
  },
  secondary: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.borderStrong,
    textColor: colors.textPrimary,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: colors.borderStrong,
    textColor: colors.textSecondary,
  },
  danger: {
    backgroundColor: colors.errorSoft,
    borderColor: colors.error,
    textColor: colors.textPrimary,
  },
} as const;

const PremiumButton = ({
  label,
  onPress,
  icon,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
}: Props) => {
  const sizeStyles = sizeStyleMap[size];
  const variantStyles = variantStyleMap[variant];

  return (
    <ScaleTouchable
      style={[
        styles.button,
        variant === 'primary' && elevation.accentGlow,
        {
          backgroundColor: variantStyles.backgroundColor,
          borderColor: variantStyles.borderColor,
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
          opacity: disabled ? 0.55 : 1,
        },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      pressedScale={variant === 'ghost' ? 0.97 : 0.96}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyles.textColor} />
      ) : (
        <View style={styles.content}>
          {icon ? (
            <MaterialIcons name={icon} size={sizeStyles.iconSize} color={variantStyles.textColor} />
          ) : null}
          <Text
            style={[
              styles.label,
              {
                color: variantStyles.textColor,
                fontSize: sizeStyles.fontSize,
              },
            ]}
          >
            {label}
          </Text>
        </View>
      )}
    </ScaleTouchable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderWidth: 1,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  label: {
    fontWeight: '800',
  },
});

export default PremiumButton;
