export const colors = {
  background: '#000000',
  chrome: '#0A0A0A',
  surface: '#111111',
  surfaceAlt: '#181818',
  border: '#1C1C1C',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0B8',
  textMuted: '#666666',
  accent: '#FF4500',
  accentSoft: 'rgba(255,69,0,0.12)',
  accentBorder: 'rgba(255,69,0,0.30)',
  onAccent: '#111111',
  success: '#00E676',
} as const;

export const metrics = {
  tabBarBaseHeight: 60,
  tabBarBasePaddingBottom: 8,
} as const;

const getInsetOffset = (bottomInset: number) => (bottomInset > 0 ? bottomInset - 10 : 0);

export const getInsetAdjustedHeight = (baseHeight: number, bottomInset: number) =>
  baseHeight + getInsetOffset(bottomInset);

export const getInsetBottomPadding = (basePadding: number, bottomInset: number) =>
  basePadding + getInsetOffset(bottomInset);

export const theme = {
  colors,
  metrics,
} as const;
