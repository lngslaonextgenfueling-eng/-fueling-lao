// Shared design tokens for the whole app.
// Kept in one place so every screen looks consistent.

export const colors = {
  bg: '#0B1220',
  bgElevated: '#121B2E',
  card: '#182238',
  cardAlt: '#1E2A45',
  border: '#27344F',
  primary: '#22C55E', // fuel-green accent
  primaryDark: '#15803D',
  accent: '#FACC15', // gold / membership accent
  blue: '#3B82F6',
  danger: '#EF4444',
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  white: '#FFFFFF',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const },
  h2: { fontSize: 22, fontWeight: '700' as const },
  h3: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 15, fontWeight: '400' as const },
  caption: { fontSize: 13, fontWeight: '400' as const },
  label: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.5 },
};
