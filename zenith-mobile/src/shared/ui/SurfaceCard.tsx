import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

import { colors, radii, spacing } from '../../theme/theme';

type Variant = 'primary' | 'secondary';

type Props = ViewProps & {
  variant?: Variant;
};

const SurfaceCard = ({ variant = 'primary', style, ...props }: Props) => (
  <View
    {...props}
    style={[
      styles.base,
      variant === 'secondary' ? styles.secondary : styles.primary,
      style,
    ]}
  />
);

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
  },
  primary: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  secondary: {
    backgroundColor: colors.surfaceAlt,
    borderColor: colors.borderStrong,
  },
});

export default SurfaceCard;
