import { Text, XStack } from 'tamagui';
import { colors } from '../../theme/colors';

interface ErrorBannerProps {
  message: string;
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  if (!message) return null;

  return (
    <XStack
      bg={colors.errorSoft}
      rounded={12}
      p={12}
      mb={12}
      borderWidth={1}
      borderColor={colors.error}
    >
      <Text fontSize={13} color={colors.error} flex={1} lineHeight={18}>
        {message}
      </Text>
    </XStack>
  );
}
