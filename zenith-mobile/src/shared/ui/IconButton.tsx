import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

import ScaleTouchable from './ScaleTouchable';
import { colors, radii } from '../../theme/theme';

type Props = {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  onPress: () => void;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  style?: ViewStyle;
  accessibilityLabel?: string;
};

const IconButton = ({
  icon,
  onPress,
  color = colors.textPrimary,
  backgroundColor = colors.surfaceAlt,
  borderColor = colors.border,
  style,
  accessibilityLabel,
}: Props) => (
  <ScaleTouchable
    style={[
      styles.button,
      {
        backgroundColor,
        borderColor,
      },
      style,
    ]}
    onPress={onPress}
    pressedScale={0.94}
    accessibilityRole="button"
    accessibilityLabel={accessibilityLabel}
  >
    <MaterialIcons name={icon} size={22} color={color} />
  </ScaleTouchable>
);

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: radii.pill,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default IconButton;
