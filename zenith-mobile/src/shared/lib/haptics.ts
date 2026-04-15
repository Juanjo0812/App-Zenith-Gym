import * as Haptics from 'expo-haptics';

export type HapticIntent =
  | 'selection'
  | 'primary'
  | 'success'
  | 'warning'
  | 'error';

const runners: Record<HapticIntent, () => Promise<void>> = {
  selection: () => Haptics.selectionAsync(),
  primary: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
};

export const triggerHaptic = async (intent: HapticIntent = 'selection') => {
  try {
    await runners[intent]();
  } catch {
    // Haptics are optional polish and should never block the UX.
  }
};
