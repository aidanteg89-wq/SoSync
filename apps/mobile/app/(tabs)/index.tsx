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
      <SafeAreaView style={styles.container} edges={['top']}>
        <Text style={styles.title}>Suggestions</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.empty}>Sign in on the Profile tab to see suggestions</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Suggestions</Text>
        <TouchableOpacity
          style={[styles.refreshBtn, loading && styles.btnDisabled]}
          onPress={fetchSuggestions}
          disabled={loading}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Refresh"
        >
          <Text style={styles.refreshBtnText}>{loading ? '...' : 'Refresh'}</Text>
        </TouchableOpacity>
      </View>

      {error !== '' && <Text style={styles.error}>{error}</Text>}

      <FlatList<Suggestion>
        data={suggestions}
        keyExtractor={(item: Suggestion) => item.id}
        style={styles.list}
        contentContainerStyle={suggestions.length === 0 ? styles.emptyContainer : undefined}
        renderItem={({ item }: { item: Suggestion }) => {
          if (declined.has(item.id)) return null;
          return (
            <View style={styles.card}>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardTime}>
                  {capitalize(item.dayOfWeek)} · {item.startTime} – {item.endTime}
                </Text>
              </View>
              {accepted.has(item.id) ? (
                <View style={styles.acceptedBadge}>
                  <Text style={styles.acceptedText}>Accepted</Text>
                </View>
              ) : (
                <View style={styles.btnRow}>
                  <TouchableOpacity
                    style={styles.declineBtn}
                    onPress={() => handleDecline(item)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel="Decline"
                  >
                    <Text style={styles.declineBtnText}>Decline</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.acceptBtn}
                    onPress={() => handleAccept(item)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel="Accept"
                  >
                    <Text style={styles.acceptBtnText}>Accept</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>No suggestions found — add friends and set your availability first</Text>
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
  error: { color: '#e63946', fontSize: 13, marginBottom: 12 },
  list: { flex: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { color: '#adb5bd', fontSize: 15, textAlign: 'center', paddingHorizontal: 20 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center',
  },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#212529', marginBottom: 4 },
  cardTime: { fontSize: 13, color: '#6c757d' },
  btnRow: { flexDirection: 'row', gap: 8 },
  acceptBtn: { backgroundColor: '#2dc653', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  acceptBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  declineBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  declineBtnText: { color: '#6c757d', fontWeight: '600', fontSize: 13 },
  acceptedBadge: { backgroundColor: '#d4edda', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  acceptedText: { color: '#155724', fontWeight: '600', fontSize: 13 },
});
