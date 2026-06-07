import type { ReactNode } from 'react';
import { Text, YStack } from 'tamagui';
import { colors } from '../../theme/colors';

interface EmptyStateProps {
  message: string;
  action?: ReactNode;
  icon?: ReactNode;
}

export function EmptyState({ message, action, icon }: EmptyStateProps) {
  return (
    <YStack flex={1} justify="center" items="center" px={24} py={32} gap="$4">
      {icon}
      <Text fontSize={15} color={colors.textMuted} text="center" lineHeight={22}>
        {message}
      </Text>
      {action}
    </YStack>
  );
}
