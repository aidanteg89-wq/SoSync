import { colors } from './colors';

/** Semantic spacing scale (px) */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
} as const;

/** Border radius scale (px) */
export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

/** Typography scale */
export const typography = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: '800' as const },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700' as const },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '600' as const },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' as const },
  bodyMedium: { fontSize: 16, lineHeight: 22, fontWeight: '600' as const },
  caption: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '600' as const },
  small: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },
} as const;

/** Minimum touch target height */
export const touchTarget = 48;

export { colors };
