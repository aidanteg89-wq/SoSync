import type { ReactNode } from 'react';
import { Button, Dialog, Text, XStack, YStack } from 'tamagui';
import { colors } from '../../theme/colors';
import { AppButton } from './AppButton';

interface AppModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  destructive?: boolean;
}

export function AppModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  destructive = false,
}: AppModalProps) {
  return (
    <Dialog modal open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay key="overlay" opacity={0.5} bg="rgba(30, 58, 95, 0.4)" />
        <Dialog.Content
          bordered
          elevate
          key="content"
          gap="$4"
          bg={colors.surface}
          rounded={20}
          p={24}
          maxW={400}
          width="90%"
        >
          <YStack gap="$3">
            <Dialog.Title fontSize={20} fontWeight="700" color={colors.heading}>
              {title}
            </Dialog.Title>
            {description ? (
              <Dialog.Description fontSize={15} color={colors.textMuted}>
                {description}
              </Dialog.Description>
            ) : null}
            {children}
          </YStack>

          <XStack gap="$3" justify="flex-end" mt="$2">
            <Dialog.Close asChild>
              <Button chromeless color={colors.textMuted} fontWeight="600">
                {cancelLabel}
              </Button>
            </Dialog.Close>
            {onConfirm ? (
              <AppButton
                variant={destructive ? 'destructive' : 'primary'}
                size="sm"
                onPress={() => {
                  onConfirm();
                  onOpenChange(false);
                }}
              >
                {confirmLabel}
              </AppButton>
            ) : null}
          </XStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
