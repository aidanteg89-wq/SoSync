import { defaultConfig, createSystemFont } from '@tamagui/config/v4';
import { createTamagui } from 'tamagui';
import { natureTheme } from './theme/natureTheme';

const interBody = createSystemFont({
  font: {
    family: 'Inter',
    face: {
      400: { normal: 'Inter' },
      600: { normal: 'InterSemiBold' },
      700: { normal: 'InterBold' },
      800: { normal: 'InterExtraBold' },
    },
  },
});

const interHeading = createSystemFont({
  font: {
    family: 'Inter',
    face: {
      400: { normal: 'Inter' },
      600: { normal: 'InterSemiBold' },
      700: { normal: 'InterBold' },
      800: { normal: 'InterExtraBold' },
    },
  },
  sizeSize: (n) => n * 1.4,
});

export const tamaguiConfig = createTamagui({
  ...defaultConfig,
  fonts: {
    ...defaultConfig.fonts,
    body: interBody,
    heading: interHeading,
  },
  themes: {
    ...defaultConfig.themes,
    nature: natureTheme,
  },
});

export default tamaguiConfig;

export type Conf = typeof tamaguiConfig;

declare module 'tamagui' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface TamaguiCustomConfig extends Conf {}
}
