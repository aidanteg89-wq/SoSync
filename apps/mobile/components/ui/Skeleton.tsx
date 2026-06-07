import { YStack, styled } from 'tamagui';
import { colors } from '../../theme/colors';

const SkeletonBlock = styled(YStack, {
  bg: colors.backgroundStrong,
  rounded: 8,
  opacity: 0.7,
});

export function SkeletonCard() {
  return (
    <YStack
      bg={colors.surface}
      rounded={16}
      p={16}
      mb={10}
      borderWidth={1}
      borderColor={colors.border}
      gap={10}
    >
      <SkeletonBlock height={18} width="60%" />
      <SkeletonBlock height={14} width="40%" />
    </YStack>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <YStack gap={0}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </YStack>
  );
}
