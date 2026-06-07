import { useState, useEffect, useCallback } from 'react';
import { FlatList } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import { CalendarCheck } from 'lucide-react-native';
import { useAuth } from '../../lib/AuthContext';
import { API_URL } from '../../lib/constants';
import {
  AppScreen,
  AppHeader,
  AppButton,
  AppCard,
  AppBadge,
  EmptyState,
  SkeletonList,
} from '../../components/ui';
import { colors } from '../../theme/colors';

interface EventItem {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  category: string;
  createdBy: string;
}

interface EventParticipant {
  id: string;
  eventId: string;
  userId: string;
  status: string;
}

export default function EventsScreen() {
  const { user, token } = useAuth();
  const [events, setEvents] = useState<{ event: EventItem; participants: EventParticipant[] }[]>([]);
  const [loading, setLoading] = useState(false);

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const fetchEvents = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/events/user/${encodeURIComponent(user.id)}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      } else {
        setEvents([]);
      }
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    if (user) fetchEvents();
  }, [user]);

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return (
        d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) +
        ' ' +
        d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
      );
    } catch {
      return iso;
    }
  };

  if (!user) {
    return (
      <AppScreen>
        <AppHeader title="My Events" />
        <EmptyState message="Sign in on the Profile tab to see your events" />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <AppHeader
        title="My Events"
        action={
          <AppButton
            variant="primary"
            size="sm"
            loading={loading}
            onPress={fetchEvents}
            accessibilityLabel="Refresh events"
          >
            Refresh
          </AppButton>
        }
      />

      {loading && events.length === 0 ? (
        <SkeletonList count={3} />
      ) : (
        <FlatList<{ event: EventItem; participants: EventParticipant[] }>
          data={events}
          keyExtractor={(item: { event: EventItem; participants: EventParticipant[] }) => item.event.id}
          style={{ flex: 1 }}
          contentContainerStyle={events.length === 0 ? { flex: 1 } : { paddingBottom: 24 }}
          renderItem={({ item }: { item: { event: EventItem; participants: EventParticipant[] } }) => (
            <AppCard elevated marginBottom={10}>
              <YStack gap={8}>
                <XStack items="center" gap={10}>
                  <CalendarCheck size={20} color={colors.primary} />
                  <Text fontSize={16} fontWeight="600" color={colors.text} flex={1}>
                    {item.event.title}
                  </Text>
                </XStack>
                <Text fontSize={13} color={colors.textMuted} lineHeight={20}>
                  {formatTime(item.event.startTime)} – {formatTime(item.event.endTime)}
                </Text>
                <XStack items="center" gap={10}>
                  <AppBadge variant="primary">{item.event.category}</AppBadge>
                  <Text fontSize={12} color={colors.textMuted}>
                    {item.participants.filter((p: EventParticipant) => p.status === 'accepted').length} accepted
                  </Text>
                </XStack>
              </YStack>
            </AppCard>
          )}
          ListEmptyComponent={
            <EmptyState message="No events yet — accept a suggestion to create one" />
          }
        />
      )}
    </AppScreen>
  );
}
