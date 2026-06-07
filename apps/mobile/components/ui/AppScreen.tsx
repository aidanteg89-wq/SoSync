import type { ReactNode } from 'react';
import type { RefreshControlProps } from 'react-native';
import { RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, YStack } from 'tamagui';
import { colors } from '../../theme/colors';

interface AppScreenProps {
  children: ReactNode;
  scroll?: boolean;
  padding?: boolean;
  refreshControl?: RefreshControlProps;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export function AppScreen({
  children,
  scroll = false,
  padding = true,
  refreshControl,
  edges = ['top'],
}: AppScreenProps) {
  const content = (
    <YStack flex={1} bg={colors.background} px={padding ? 20 : 0}>
      {children}
    </YStack>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={edges}>
      {scroll ? (
        <ScrollView
          flex={1}
          bg={colors.background}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            refreshControl ? (
              <RefreshControl
                refreshing={refreshControl.refreshing}
                onRefresh={refreshControl.onRefresh}
                tintColor={colors.primary}
              />
            ) : undefined
          }
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}
