import { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../constants';

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
      return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) +
        ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    } catch {
      return iso;
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Text style={styles.title}>My Events</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.empty}>Sign in on the Profile tab to see your events</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>My Events</Text>
        <TouchableOpacity
          style={[styles.refreshBtn, loading && styles.btnDisabled]}
          onPress={fetchEvents}
          disabled={loading}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <Text style={styles.refreshBtnText}>{loading ? '...' : 'Refresh'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList<{ event: EventItem; participants: EventParticipant[] }>
        data={events}
        keyExtractor={(item: { event: EventItem; participants: EventParticipant[] }) => item.event.id}
        style={styles.list}
        contentContainerStyle={events.length === 0 ? styles.emptyContainer : undefined}
        renderItem={({ item }: { item: { event: EventItem; participants: EventParticipant[] } }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.event.title}</Text>
            <Text style={styles.cardTime}>{formatTime(item.event.startTime)} – {formatTime(item.event.endTime)}</Text>
            <View style={styles.badges}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{item.event.category}</Text>
              </View>
              <Text style={styles.participantCount}>
                {item.participants.filter((p: EventParticipant) => p.status === 'accepted').length} accepted
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No events yet — accept a suggestion to create one</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: '#1a1a2e' },
  refreshBtn: { backgroundColor: '#4361ee', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  refreshBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  btnDisabled: { opacity: 0.5 },
  list: { flex: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { color: '#adb5bd', fontSize: 15, textAlign: 'center', paddingHorizontal: 20 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#212529', marginBottom: 4 },
  cardTime: { fontSize: 13, color: '#6c757d', marginBottom: 8 },
  badges: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  categoryBadge: { backgroundColor: '#e8f4fd', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  categoryText: { color: '#4361ee', fontSize: 12, fontWeight: '600' },
  participantCount: { fontSize: 12, color: '#6c757d' },
});
