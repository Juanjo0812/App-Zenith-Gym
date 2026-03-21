import React, { useRef } from 'react';
import {
  Animated,
  GestureResponderEvent,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

type Props = TouchableOpacityProps & {
  pressedScale?: number;
};

const ScaleTouchable = ({
  activeOpacity = 0.9,
  onPressIn,
  onPressOut,
  pressedScale = 0.97,
  style,
  ...props
}: Props) => {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: number) => {
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 30,
      bounciness: 0,
    }).start();
  };

  const handlePressIn = (event: GestureResponderEvent) => {
    animateTo(pressedScale);
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
