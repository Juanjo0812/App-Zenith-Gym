export const colors = {
  background: '#040D1A',
  chrome: '#071222',
  surface: '#0C1B2E',
  surfaceAlt: '#112340',
  surfaceRaised: '#163058',
  border: '#1A3050',
  borderStrong: '#264060',
  textPrimary: '#F8F9FA',
  textSecondary: '#8BA3C0',
  textMuted: '#4A6580',
  accent: '#00E5FF',
  accentSoft: 'rgba(0,229,255,0.12)',
  accentSoftStrong: 'rgba(0,229,255,0.18)',
  accentBorder: 'rgba(0,229,255,0.30)',
  onAccent: '#040D1A',
  success: '#22D3EE',
  successSoft: 'rgba(34,211,238,0.14)',
  warning: '#38BDF8',
  warningSoft: 'rgba(56,189,248,0.14)',
  error: '#60A5FA',
  errorSoft: 'rgba(96,165,250,0.14)',
} as const;

export const metrics = {
  tabBarBaseHeight: 60,
  tabBarBasePaddingBottom: 8,
} as const;

export const spacing = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  pill: 999,
} as const;

export const elevation = {
  soft: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 10,
  },
  accentGlow: {
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 22,
    elevation: 6,
  },
} as const;

export const motion = {
  fast: 150,
  normal: 220,
  slow: 320,
} as const;

const getInsetOffset = (bottomInset: number) => (bottomInset > 0 ? bottomInset - 10 : 0);

export const getInsetAdjustedHeight = (baseHeight: number, bottomInset: number) =>
  baseHeight + getInsetOffset(bottomInset);

export const getInsetBottomPadding = (basePadding: number, bottomInset: number) =>
  basePadding + getInsetOffset(bottomInset);

export const theme = {
  colors,
  metrics,
  spacing,
  radii,
  elevation,
  motion,
} as const;
