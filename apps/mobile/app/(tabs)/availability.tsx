import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../constants';

interface AvailabilityBlock {
  id: string;
  userId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  type: string;
}

const DAYS = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
  { key: 'saturday', label: 'Sat' },
  { key: 'sunday', label: 'Sun' },
];

const TYPES: { key: string; label: string }[] = [
  { key: 'free', label: 'Free' },
  { key: 'work', label: 'Work' },
  { key: 'personal', label: 'Personal' },
];

// HH:MM 24h validation
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export default function AvailabilityScreen() {
  const { user, token } = useAuth();
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [loading, setLoading] = useState(false);

  const [day, setDay] = useState('wednesday');
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('21:00');
  const [type, setType] = useState('free');

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const showAlert = (msg: string) => {
    if (Platform.OS === 'web') {
      window.alert(msg);
    } else {
      Alert.alert('Availability', msg);
    }
  };

  const confirm = (msg: string, onYes: () => void) => {
    if (Platform.OS === 'web') {
      if (window.confirm(msg)) onYes();
    } else {
      Alert.alert('Confirm', msg, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onYes },
      ]);
    }
  };

  const fetchBlocks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/availability/${encodeURIComponent(user.id)}`, { headers });
      const data: AvailabilityBlock[] = await res.json();
      setBlocks(data);
    } catch {
      setBlocks([]);
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    if (user) fetchBlocks();
  }, [user]);

  const addBlock = async () => {
    if (!user) return;
    if (!TIME_RE.test(startTime) || !TIME_RE.test(endTime)) {
      showAlert('Times must be in HH:MM 24-hour format (e.g. 09:00, 18:30)');
      return;
    }
    if (startTime >= endTime) {
      showAlert('Start time must be before end time');
      return;
    }
    try {
      const res = await fetch(`${API_URL}/availability`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          userId: user.id,
          dayOfWeek: day,
          startTime,
          endTime,
          type,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        showAlert(body.error ?? 'Failed to add block');
        return;
      }
      fetchBlocks();
    } catch {
      showAlert('Could not connect to API');
    }
  };

  const deleteBlock = (id: string) => {
    confirm('Delete this availability block?', async () => {
      try {
        await fetch(`${API_URL}/availability/${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers,
        });
        fetchBlocks();
      } catch {
        showAlert('Could not delete block');
      }
    });
  };

  const grouped = useMemo(() => {
    const order = DAYS.map((d) => d.key);
    return [...blocks].sort((a, b) => {
      const byDay = order.indexOf(a.dayOfWeek) - order.indexOf(b.dayOfWeek);
      if (byDay !== 0) return byDay;
      return a.startTime.localeCompare(b.startTime);
    });
  }, [blocks]);

  if (!user) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Text style={styles.title}>Availability</Text>
        <View style={styles.emptyContainer}>
          <Text style={styles.empty}>Sign in on the Profile tab to manage availability</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Availability</Text>
      <Text style={styles.subtitle}>Tell SoSync when you're free — we'll find overlaps with your friends.</Text>

      <View style={styles.formCard}>
        <Text style={styles.label}>Day</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {DAYS.map((d) => (
            <TouchableOpacity
              key={d.key}
              onPress={() => setDay(d.key)}
              style={[styles.chip, day === d.key && styles.chipActive]}
              accessibilityRole="button"
            >
              <Text style={[styles.chipText, day === d.key && styles.chipTextActive]}>{d.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.timeRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Start</Text>
            <TextInput
              style={styles.input}
              value={startTime}
              onChangeText={setStartTime}
              placeholder="18:00"
              placeholderTextColor="#adb5bd"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={5}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>End</Text>
            <TextInput
              style={styles.input}
              value={endTime}
              onChangeText={setEndTime}
              placeholder="21:00"
              placeholderTextColor="#adb5bd"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={5}
            />
          </View>
        </View>

        <Text style={styles.label}>Type</Text>
        <View style={styles.chipRow}>
          {TYPES.map((t) => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setType(t.key)}
              style={[styles.chip, type === t.key && styles.chipActive]}
              accessibilityRole="button"
            >
              <Text style={[styles.chipText, type === t.key && styles.chipTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.addBtn} onPress={addBlock} activeOpacity={0.85} accessibilityRole="button">
          <Text style={styles.addBtnText}>Add Block</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.listHeaderRow}>
        <Text style={styles.sectionTitle}>Your Blocks</Text>
        <TouchableOpacity onPress={fetchBlocks} accessibilityRole="button">
          <Text style={styles.refresh}>{loading ? '...' : 'Refresh'}</Text>
        </TouchableOpacity>
      </View>

      <FlatList<AvailabilityBlock>
        data={grouped}
        keyExtractor={(item: AvailabilityBlock) => item.id}
        style={styles.list}
        contentContainerStyle={grouped.length === 0 ? styles.emptyContainer : { paddingBottom: 24 }}
        renderItem={({ item }: { item: AvailabilityBlock }) => (
          <View style={styles.card}>
            <View style={styles.cardBody}>
              <Text style={styles.cardTitle}>
                {capitalize(item.dayOfWeek)} · {item.startTime}–{item.endTime}
              </Text>
              <Text style={styles.cardMeta}>{capitalize(item.type)}</Text>
            </View>
            <TouchableOpacity onPress={() => deleteBlock(item.id)} style={styles.deleteBtn} accessibilityRole="button">
              <Text style={styles.deleteBtnText}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No availability blocks yet</Text>}
      />
    </SafeAreaView>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', paddingHorizontal: 20 },
  title: { fontSize: 28, fontWeight: '800', color: '#1a1a2e', marginTop: 12 },
  subtitle: { fontSize: 13, color: '#6c757d', marginBottom: 16, marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#495057' },
  label: { fontSize: 12, fontWeight: '700', color: '#6c757d', marginBottom: 6, marginTop: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  input: {
    backgroundColor: '#f1f3f5',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#212529',
  },
  timeRow: { flexDirection: 'row', gap: 12 },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    backgroundColor: '#f1f3f5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  chipActive: { backgroundColor: '#4361ee', borderColor: '#4361ee' },
  chipText: { color: '#495057', fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: '#fff' },
  addBtn: {
    backgroundColor: '#4361ee',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  refresh: { color: '#4361ee', fontWeight: '600', fontSize: 13 },
  list: { flex: 1 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { color: '#adb5bd', fontSize: 15, textAlign: 'center', paddingHorizontal: 20 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#212529', marginBottom: 2 },
  cardMeta: { fontSize: 12, color: '#6c757d' },
  deleteBtn: {
    backgroundColor: '#fff0f0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffc9c9',
  },
  deleteBtnText: { color: '#c92a2a', fontWeight: '700', fontSize: 12 },
});
