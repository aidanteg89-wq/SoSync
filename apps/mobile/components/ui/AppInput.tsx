import type { KeyboardTypeOptions } from 'react-native';
import { Input, Label, Text, YStack } from 'tamagui';
import { colors } from '../../theme/colors';

interface AppInputProps {
  label?: string;
  error?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?: boolean;
  maxLength?: number;
}

export function AppInput({
  label,
  error,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  autoCorrect,
  maxLength,
}: AppInputProps) {
  return (
    <YStack gap="$1.5" mb="$3">
      {label ? (
        <Label
          fontSize={12}
          fontWeight="700"
          color={colors.textMuted}
          textTransform="uppercase"
          letterSpacing={0.5}
        >
          {label}
        </Label>
      ) : null}
      <Input
        bg={colors.surface}
        borderWidth={1}
        borderColor={error ? colors.error : colors.border}
        rounded={12}
        px={14}
        py={12}
        fontSize={15}
        color={colors.text}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        maxLength={maxLength}
        focusStyle={{
          borderColor: colors.primary,
          borderWidth: 2,
        }}
      />
      {error ? (
        <Text fontSize={12} color={colors.error}>
          {error}
        </Text>
      ) : null}
    </YStack>
  );
}
