import type { ReactNode } from 'react';
import { Card, styled } from 'tamagui';
import { colors } from '../../theme/colors';

const StyledCard = styled(Card, {
  name: 'AppCard',
  bg: colors.surface,
  rounded: 16,
  p: 16,
  borderWidth: 1,
  borderColor: colors.border,
  variants: {
    elevated: {
      true: {
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 8,
        elevation: 2,
      },
    },
    pressable: {
      true: {
        pressStyle: { scale: 0.99, opacity: 0.95 },
      },
    },
  } as const,
});

interface AppCardProps {
  children: ReactNode;
  elevated?: boolean;
  pressable?: boolean;
  onPress?: () => void;
  marginBottom?: number;
  padding?: number;
}

export function AppCard({
  children,
  elevated = false,
  pressable = false,
  onPress,
  marginBottom = 10,
  padding,
}: AppCardProps) {
  return (
    <StyledCard
      elevated={elevated}
      pressable={pressable || !!onPress}
      onPress={onPress}
      mb={marginBottom}
      p={padding}
    >
      {children}
    </StyledCard>
  );
}
