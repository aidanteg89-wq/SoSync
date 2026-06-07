import type { ReactNode } from 'react';
import { Text, XStack, styled } from 'tamagui';
import { colors } from '../../theme/colors';

const StyledBadge = styled(XStack, {
  name: 'AppBadge',
  items: 'center',
  justify: 'center',
  px: 12,
  py: 6,
  rounded: 9999,
  variants: {
    variant: {
      success: { bg: colors.successSoft },
      accent: { bg: colors.accentSoft },
      muted: { bg: colors.backgroundStrong },
      primary: { bg: colors.primarySoft },
    },
  } as const,
  defaultVariants: {
    variant: 'muted',
  },
});

const textColors = {
  success: colors.success,
  accent: colors.accent,
  muted: colors.textMuted,
  primary: colors.primary,
} as const;

export type AppBadgeVariant = keyof typeof textColors;

interface AppBadgeProps {
  children: ReactNode;
  variant?: AppBadgeVariant;
}

export function AppBadge({ children, variant = 'muted' }: AppBadgeProps) {
  return (
    <StyledBadge variant={variant}>
      <Text fontSize={12} fontWeight="700" color={textColors[variant]}>
        {children}
      </Text>
    </StyledBadge>
  );
}
