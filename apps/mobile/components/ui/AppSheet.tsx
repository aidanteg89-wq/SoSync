import type { ReactNode } from 'react';
import { Sheet, Text, YStack } from 'tamagui';
import { colors } from '../../theme/colors';

interface AppSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: ReactNode;
  snapPoints?: number[];
}

export function AppSheet({
  open,
  onOpenChange,
  title,
  children,
  snapPoints = [40, 25],
}: AppSheetProps) {
  return (
    <Sheet
      modal
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={snapPoints}
      dismissOnSnapToBottom
      zIndex={100000}
    >
      <Sheet.Overlay bg="rgba(30, 58, 95, 0.4)" />
      <Sheet.Handle bg={colors.border} />
      <Sheet.Frame
        p="$4"
        gap="$4"
        bg={colors.surface}
        borderTopLeftRadius={24}
        borderTopRightRadius={24}
      >
        {title ? (
          <Text fontSize={18} fontWeight="700" color={colors.heading} mb="$2">
            {title}
          </Text>
        ) : null}
        <YStack gap="$3">{children}</YStack>
      </Sheet.Frame>
    </Sheet>
  );
}
