import { Text } from 'tamagui';
import { Avatar, styled } from 'tamagui';
import { colors } from '../../theme/colors';

const StyledAvatar = styled(Avatar, {
  bg: colors.primarySoft,
  variants: {
    size: {
      sm: { size: 36 },
      md: { size: 48 },
      lg: { size: 64 },
    },
  } as const,
  defaultVariants: {
    size: 'md',
  },
});

interface AppAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function AppAvatar({ name, size = 'md' }: AppAvatarProps) {
  const fontSize = size === 'sm' ? 14 : size === 'lg' ? 22 : 18;

  return (
    <StyledAvatar circular size={size}>
      <Avatar.Fallback bg={colors.primarySoft}>
        <Text fontSize={fontSize} fontWeight="700" color={colors.primary}>
          {initials(name)}
        </Text>
      </Avatar.Fallback>
    </StyledAvatar>
  );
}
