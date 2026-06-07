import { defaultConfig } from '@tamagui/config/v4';
import { colors } from './colors';

const baseLight = defaultConfig.themes.light;
const baseGreen = defaultConfig.themes.light_green;

/** Custom nature theme merged from light + green accent scales */
export const natureTheme = {
  ...baseLight,
  ...baseGreen,
  background: colors.background,
  backgroundHover: colors.backgroundStrong,
  backgroundPress: colors.backgroundStrong,
  backgroundFocus: colors.backgroundStrong,
  color: colors.text,
  colorHover: colors.heading,
  colorPress: colors.heading,
  colorFocus: colors.heading,
  color11: colors.heading,
  color12: colors.heading,
  borderColor: colors.border,
  borderColorHover: colors.borderStrong,
  borderColorPress: colors.borderStrong,
  borderColorFocus: colors.primary,
  placeholderColor: colors.textMuted,
  outlineColor: colors.primary,
  green9: colors.primary,
  green10: colors.primaryHover,
  green11: colors.primary,
  green12: colors.heading,
  red9: colors.error,
  red10: colors.error,
  blue9: colors.heading,
  blue10: colors.heading,
};
