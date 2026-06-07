import { useState, useEffect, useCallback } from 'react';
import { FlatList } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import { useAuth } from '../../lib/AuthContext';
import { API_URL } from '../../lib/constants';
import {
  AppScreen,
  AppHeader,
  AppButton,
  AppCard,
  AppBadge,
  EmptyState,
  ErrorBanner,
  SkeletonList,
} from '../../components/ui';
import { colors } from '../../theme/colors';

interface Suggestion {
  id: string;
  title: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  category: string;
  friendId: string;
  friendName: string;
}

export default function SuggestionsScreen() {
  const { user, token } = useAuth();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [accepted, setAccepted] = useState<Set<string>>(new Set());
  const [declined, setDeclined] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const fetchSuggestions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(
        `${API_URL}/suggestions?userId=${encodeURIComponent(user.id)}`,
        { headers },
      );
      if (!res.ok) {
        const body = await res.json();
        setError(body.error ?? 'Request failed');
        setSuggestions([]);
        return;
      }
      const data: Suggestion[] = await res.json();
      setSuggestions(data);
    } catch {
      setError('Could not connect to API');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    if (user) fetchSuggestions();
  }, [user]);

  const handleAccept = async (item: Suggestion) => {
    if (!user) return;
    try {
      await fetch(`${API_URL}/events/accept`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: item.title,
          dayOfWeek: item.dayOfWeek,
          startTime: item.startTime,
          endTime: item.endTime,
          category: item.category,
          friendId: item.friendId,
          userId: user.id,
        }),
      });
      setAccepted((prev) => new Set(prev).add(item.id));
    } catch {
      // silent for MVP
    }
  };

  const handleDecline = async (item: Suggestion) => {
    if (!user) return;
    setDeclined((prev) => new Set(prev).add(item.id));
    try {
      await fetch(`${API_URL}/suggestions/decline`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId: user.id,
          friendId: item.friendId,
          dayOfWeek: item.dayOfWeek,
          startTime: item.startTime,
          endTime: item.endTime,
        }),
      });
    } catch {
      // silent for MVP
    }
  };

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  if (!user) {
    return (
      <AppScreen>
        <AppHeader title="Suggestions" />
        <EmptyState message="Sign in on the Profile tab to see suggestions" />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <AppHeader
        title="Suggestions"
        action={
          <AppButton
            variant="primary"
            size="sm"
            loading={loading}
            onPress={fetchSuggestions}
            accessibilityLabel="Refresh suggestions"
          >
            Refresh
          </AppButton>
        }
      />

      <ErrorBanner message={error} />

      {loading && suggestions.length === 0 ? (
        <SkeletonList count={4} />
      ) : (
        <FlatList<Suggestion>
          data={suggestions}
          keyExtractor={(item: Suggestion) => item.id}
          style={{ flex: 1 }}
          contentContainerStyle={
            suggestions.length === 0 ? { flex: 1 } : { paddingBottom: 24 }
          }
          renderItem={({ item }: { item: Suggestion }) => {
            if (declined.has(item.id)) return null;
            return (
              <AppCard marginBottom={10}>
                <XStack items="center" gap={12}>
                  <YStack flex={1} gap={4}>
                    <Text fontSize={16} fontWeight="600" color={colors.text}>
                      {item.title}
                    </Text>
                    <Text fontSize={13} color={colors.textMuted}>
                      {capitalize(item.dayOfWeek)} · {item.startTime} – {item.endTime}
                    </Text>
                    {item.friendName ? (
                      <Text fontSize={12} color={colors.textMuted}>
                        with {item.friendName}
                      </Text>
                    ) : null}
                  </YStack>
                  {accepted.has(item.id) ? (
                    <AppBadge variant="success">Accepted</AppBadge>
                  ) : (
                    <XStack gap={8}>
                      <AppButton
                        variant="secondary"
                        size="sm"
                        onPress={() => handleDecline(item)}
                        accessibilityLabel="Decline suggestion"
                      >
                        Decline
                      </AppButton>
                      <AppButton
                        variant="success"
                        size="sm"
                        onPress={() => handleAccept(item)}
                        accessibilityLabel="Accept suggestion"
                      >
                        Accept
                      </AppButton>
                    </XStack>
                  )}
                </XStack>
              </AppCard>
            );
          }}
          ListEmptyComponent={
            <EmptyState message="No suggestions found — add friends and set your availability first" />
          }
        />
      )}
    </AppScreen>
  );
}
