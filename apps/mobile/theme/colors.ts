/** Nature palette — soft greens, maroon, beige, dark blue, brown */
export const colors = {
  background: '#FAF7F2',
  backgroundStrong: '#F0EBE3',
  surface: '#FFFFFF',
  primary: '#2D5A4A',
  primaryHover: '#234A3C',
  primarySoft: '#E8F0EC',
  accent: '#6B3A3A',
  accentSoft: '#F5EDED',
  heading: '#1E3A5F',
  text: '#3D3229',
  textMuted: '#8B7355',
  border: '#E2D9CE',
  borderStrong: '#D4C9BC',
  success: '#3D7A5A',
  successSoft: '#E6F2EB',
  error: '#9B4D4D',
  errorSoft: '#F9EDED',
  shadow: 'rgba(30, 58, 95, 0.08)',
  white: '#FFFFFF',
  tabBar: '#FFFFFF',
  tabBarBorder: '#E2D9CE',
} as const;

export type AppColors = typeof colors;
