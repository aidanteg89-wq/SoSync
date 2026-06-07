import type { ReactNode } from 'react';
import { Text, XStack, YStack, styled } from 'tamagui';
import { colors } from '../../theme/colors';

const StyledRow = styled(XStack, {
  name: 'AppListItem',
  items: 'center',
  py: 12,
  px: 4,
  gap: 12,
  pressStyle: { opacity: 0.7 },
  variants: {
    bordered: {
      true: {
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      },
    },
  } as const,
});

interface AppListItemProps {
  title: string;
  subtitle?: string;
  left?: ReactNode;
  right?: ReactNode;
  onPress?: () => void;
  bordered?: boolean;
}

export function AppListItem({
  title,
  subtitle,
  left,
  right,
  onPress,
  bordered = false,
}: AppListItemProps) {
  return (
    <StyledRow bordered={bordered} onPress={onPress}>
      {left}
      <YStack flex={1} gap={2}>
        <Text fontSize={15} fontWeight="600" color={colors.text}>
          {title}
        </Text>
        {subtitle ? (
          <Text fontSize={13} color={colors.textMuted}>
            {subtitle}
          </Text>
        ) : null}
      </YStack>
      {right}
    </StyledRow>
  );
}
