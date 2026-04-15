import React, { useRef } from 'react';
import {
  Animated,
  GestureResponderEvent,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export type ScaleTouchableVariant = 'card' | 'button' | 'icon' | 'ghost';

type Props = TouchableOpacityProps & {
  pressedScale?: number;
  variant?: ScaleTouchableVariant;
};

const defaultScaleByVariant: Record<ScaleTouchableVariant, number> = {
  card: 0.985,
  button: 0.97,
  icon: 0.92,
  ghost: 0.985,
};

const ScaleTouchable = ({
  activeOpacity = 0.9,
  onPressIn,
  onPressOut,
  pressedScale,
  variant = 'card',
  style,
  ...props
}: Props) => {
  const scale = useRef(new Animated.Value(1)).current;
  const targetScale = pressedScale ?? defaultScaleByVariant[variant];

  const animateTo = (value: number) => {
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 30,
      bounciness: 0,
    }).start();
  };

  const handlePressIn = (event: GestureResponderEvent) => {
    animateTo(targetScale);
    onPressIn?.(event);
  };

  const handlePressOut = (event: GestureResponderEvent) => {
    animateTo(1);
    onPressOut?.(event);
  };

  return (
    <AnimatedTouchableOpacity
      {...props}
      activeOpacity={activeOpacity}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, { transform: [{ scale }] }]}
    />
  );
};

export default ScaleTouchable;
