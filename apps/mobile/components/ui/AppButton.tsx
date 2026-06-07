import type { ReactNode } from 'react';
import { Button, Spinner, Text, XStack, styled } from 'tamagui';
import { colors } from '../../theme/colors';
import { touchTarget } from '../../theme/tokens';

const StyledButton = styled(Button, {
  name: 'AppButton',
  height: touchTarget,
  rounded: 12,
  px: 20,
  pressStyle: { opacity: 0.85, scale: 0.98 },
  disabledStyle: { opacity: 0.5 },
  variants: {
    variant: {
      primary: {
        bg: colors.primary,
        color: colors.white,
        borderWidth: 0,
      },
      secondary: {
        bg: colors.surface,
        color: colors.text,
        borderWidth: 1,
        borderColor: colors.border,
      },
      ghost: {
        bg: 'transparent',
        color: colors.primary,
        borderWidth: 0,
      },
      destructive: {
        bg: colors.errorSoft,
        color: colors.error,
        borderWidth: 1,
        borderColor: colors.error,
      },
      success: {
        bg: colors.success,
        color: colors.white,
        borderWidth: 0,
      },
    },
    size: {
      sm: { height: 40, px: 14 },
      md: { height: touchTarget, px: 20 },
      lg: { height: 52, px: 24 },
    },
  } as const,
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});

export type AppButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'success';

interface AppButtonProps {
  children: ReactNode;
  variant?: AppButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  icon?: ReactNode;
  flex?: number;
  accessibilityLabel?: string;
}

export function AppButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onPress,
  icon,
  flex,
  accessibilityLabel,
}: AppButtonProps) {
  const isDisabled = disabled || loading;
  const textColor =
    variant === 'primary' || variant === 'success'
      ? colors.white
      : variant === 'destructive'
        ? colors.error
        : variant === 'ghost'
          ? colors.primary
          : colors.text;

  return (
    <StyledButton
      variant={variant}
      size={size}
      disabled={isDisabled}
      onPress={onPress}
      flex={flex}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: isDisabled }}
    >
      {loading ? (
        <Spinner size="small" color={textColor} />
      ) : (
        <XStack items="center" gap="$2">
          {icon}
          <Text fontSize={15} fontWeight="700" color={textColor}>
            {children}
          </Text>
        </XStack>
      )}
    </StyledButton>
  );
}
