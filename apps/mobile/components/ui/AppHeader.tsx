import type { ReactNode } from 'react';
import { Text, XStack, YStack } from 'tamagui';
import { colors } from '../../theme/colors';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function AppHeader({ title, subtitle, action }: AppHeaderProps) {
  return (
    <XStack justify="space-between" items="flex-start" mt={12} mb={16}>
      <YStack flex={1} gap="$1" pr={action ? 12 : 0}>
        <Text fontSize={28} fontWeight="800" color={colors.heading} letterSpacing={-0.5}>
          {title}
        </Text>
        {subtitle ? (
          <Text fontSize={14} color={colors.textMuted} lineHeight={20}>
            {subtitle}
          </Text>
        ) : null}
      </YStack>
      {action}
    </XStack>
  );
}
