import { useState, useEffect, useCallback, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../constants';

interface Friend {
  id: string;
  userId: string;
  friendId: string;
  status: 'pending' | 'accepted';
  other: { id: string; name: string; email: string };
}

interface UserSummary {
  id: string;
  name: string;
  email: string;
}

export default function FriendsScreen() {
  const { user, token } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSummary[]>([]);
  const [searching, setSearching] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const showAlert = (msg: string) => {
    if (Platform.OS === 'web') {
      window.alert(msg);
    } else {
      Alert.alert('Friends', msg);
    }
  };

  const fetchFriends = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/friends/user/${encodeURIComponent(user.id)}`, { headers });
      const data: Friend[] = await res.json();
      setFriends(data);
    } catch {
      setFriends([]);
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    if (user) fetchFriends();
  }, [user]);

  // Debounced search
  useEffect(() => {
    if (!user) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `${API_URL}/users/search?q=${encodeURIComponent(q)}&excludeId=${encodeURIComponent(user.id)}`,
          { headers },
        );
        const data: UserSummary[] = await res.json();
        setResults(data);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, user, token]);

  const friendshipWith = (otherId: string): Friend | undefined =>
    friends.find(
      (f) =>
        (f.userId === user?.id && f.friendId === otherId) ||
        (f.friendId === user?.id && f.userId === otherId),
    );

  const sendRequest = async (target: UserSummary) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/friends`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId: user.id, friendId: target.id }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        showAlert(body.error ?? 'Failed to send request');
        return;
      }
      showAlert(`Friend request sent to ${target.name}`);
      fetchFriends();
    } catch {
      showAlert('Could not connect to API');
    }
  };

  const acceptRequest = async (friendshipId: string) => {
    try {
      await fetch(`${API_URL}/friends/${friendshipId}/accept`, { method: 'PATCH', headers });
      fetchFriends();
    } catch {
      // silent
    }
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Text style={styles.title}>Friends</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.empty}>Sign in on the Profile tab to manage friends</Text>
        </View>
      </SafeAreaView>
    );
  }

  const showResults = query.trim().length >= 2;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Friends</Text>

      <Text style={styles.sectionTitle}>Find People</Text>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.input}
          placeholder="Search by name or email"
          placeholderTextColor="#adb5bd"
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searching && <ActivityIndicator style={styles.spinner} size="small" color="#4361ee" />}
      </View>

      {showResults ? (
        <View style={styles.searchResultsCard}>
          {results.length === 0 && !searching ? (
            <Text style={styles.empty}>No users found</Text>
          ) : (
            results.map((u) => {
              const existing = friendshipWith(u.id);
              return (
                <View key={u.id} style={styles.resultRow}>
                  <View style={styles.resultBody}>
                    <Text style={styles.resultName}>{u.name}</Text>
                    <Text style={styles.resultEmail}>{u.email}</Text>
                  </View>
                  {existing ? (
                    <View style={[styles.pill, existing.status === 'accepted' ? styles.pillGreen : styles.pillGray]}>
                      <Text style={styles.pillText}>{existing.status === 'accepted' ? 'Friends' : 'Pending'}</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.addBtn}
                      onPress={() => sendRequest(u)}
                      accessibilityRole="button"
                    >
                      <Text style={styles.addBtnText}>Add</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </View>
      ) : null}

      <View style={styles.divider} />

      <View style={styles.listHeaderRow}>
        <Text style={styles.sectionTitle}>Your Friends</Text>
        <TouchableOpacity onPress={fetchFriends} accessibilityRole="button">
          <Text style={styles.refresh}>{loading ? '...' : 'Refresh'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList<Friend>
        data={friends}
        keyExtractor={(item: Friend) => item.id}
        style={styles.list}
        contentContainerStyle={friends.length === 0 ? styles.emptyContainer : { paddingBottom: 24 }}
        renderItem={({ item }: { item: Friend }) => {
          const isSender = item.userId === user.id;
          return (
            <View style={styles.card}>
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{item.other?.name ?? 'Unknown'}</Text>
                <Text style={styles.cardStatus}>
                  {item.other?.email} · {item.status}
                </Text>
              </View>
              {item.status === 'pending' && !isSender && (
                <TouchableOpacity style={styles.acceptBtn} onPress={() => acceptRequest(item.id)} accessibilityRole="button">
                  <Text style={styles.acceptBtnText}>Accept</Text>
                </TouchableOpacity>
              )}
              {item.status === 'accepted' && (
                <View style={styles.acceptedBadge}>
                  <Text style={styles.acceptedText}>Friends</Text>
                </View>
              )}
            </View>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>No friends yet — search above</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', paddingHorizontal: 20 },
  title: { fontSize: 28, fontWeight: '800', color: '#1a1a2e', marginTop: 12, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#495057', marginBottom: 10 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#212529',
  },
  spinner: { marginLeft: 4 },
  searchResultsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 8,
    marginTop: 10,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f3f5',
  },
  resultBody: { flex: 1 },
  resultName: { fontSize: 15, fontWeight: '600', color: '#212529' },
  resultEmail: { fontSize: 12, color: '#6c757d', marginTop: 2 },
  addBtn: { backgroundColor: '#4361ee', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  pillGreen: { backgroundColor: '#d4edda' },
  pillGray: { backgroundColor: '#e9ecef' },
  pillText: { fontSize: 11, fontWeight: '700', color: '#495057' },
  divider: { height: 1, backgroundColor: '#e9ecef', marginVertical: 18 },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  refresh: { color: '#4361ee', fontWeight: '600', fontSize: 13 },
  list: { flex: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { color: '#adb5bd', fontSize: 14, textAlign: 'center', paddingHorizontal: 12, paddingVertical: 8 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#212529', marginBottom: 2 },
  cardStatus: { fontSize: 13, color: '#6c757d' },
  acceptBtn: { backgroundColor: '#2dc653', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  acceptBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  acceptedBadge: { backgroundColor: '#d4edda', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  acceptedText: { color: '#155724', fontWeight: '600', fontSize: 12 },
});
