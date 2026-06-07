import { useState, useEffect, useCallback, useMemo } from 'react';
import { FlatList, Alert, Platform, ScrollView as RNScrollView } from 'react-native';
import { Text, XStack, YStack } from 'tamagui';
import { useAuth } from '../../lib/AuthContext';
import { API_URL } from '../../lib/constants';
import {
  AppScreen,
  AppHeader,
  AppButton,
  AppCard,
  AppInput,
  AppModal,
  EmptyState,
  SkeletonList,
} from '../../components/ui';
import { colors } from '../../theme/colors';

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

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <AppButton
      variant={active ? 'primary' : 'secondary'}
      size="sm"
      onPress={onPress}
    >
      {label}
    </AppButton>
  );
}

export default function AvailabilityScreen() {
  const { user, token } = useAuth();
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [loading, setLoading] = useState(false);

  const [day, setDay] = useState('wednesday');
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('21:00');
  const [type, setType] = useState('free');

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const showAlert = (msg: string) => {
    if (Platform.OS === 'web') {
      window.alert(msg);
    } else {
      Alert.alert('Availability', msg);
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

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await fetch(`${API_URL}/availability/${encodeURIComponent(deleteId)}`, {
        method: 'DELETE',
        headers,
      });
      fetchBlocks();
    } catch {
      showAlert('Could not delete block');
    } finally {
      setDeleteId(null);
    }
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
      <AppScreen>
        <AppHeader title="Availability" />
        <EmptyState message="Sign in on the Profile tab to manage availability" />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <AppHeader
        title="Availability"
        subtitle="Tell SoSync when you're free — we'll find overlaps with your friends."
      />

      <AppCard elevated marginBottom={16}>
        <Text fontSize={12} fontWeight="700" color={colors.textMuted} textTransform="uppercase" letterSpacing={0.5} mb={8}>
          Day
        </Text>
        <RNScrollView horizontal showsHorizontalScrollIndicator={false}>
          <XStack gap={8} pb={4}>
            {DAYS.map((d) => (
              <Chip key={d.key} label={d.label} active={day === d.key} onPress={() => setDay(d.key)} />
            ))}
          </XStack>
        </RNScrollView>

        <XStack gap={12} mt={8}>
          <YStack flex={1}>
            <AppInput label="Start" value={startTime} onChangeText={setStartTime} placeholder="18:00" autoCapitalize="none" autoCorrect={false} maxLength={5} />
          </YStack>
          <YStack flex={1}>
            <AppInput label="End" value={endTime} onChangeText={setEndTime} placeholder="21:00" autoCapitalize="none" autoCorrect={false} maxLength={5} />
          </YStack>
        </XStack>

        <Text fontSize={12} fontWeight="700" color={colors.textMuted} textTransform="uppercase" letterSpacing={0.5} mt={8} mb={8}>
          Type
        </Text>
        <XStack gap={8} flexWrap="wrap">
          {TYPES.map((t) => (
            <Chip key={t.key} label={t.label} active={type === t.key} onPress={() => setType(t.key)} />
          ))}
        </XStack>

        <YStack mt={16}>
          <AppButton variant="primary" onPress={addBlock}>
            Add Block
          </AppButton>
        </YStack>
      </AppCard>

      <XStack justify="space-between" items="center" mb={10}>
        <Text fontSize={16} fontWeight="700" color={colors.heading}>
          Your Blocks
        </Text>
        <AppButton variant="ghost" size="sm" loading={loading} onPress={fetchBlocks}>
          Refresh
        </AppButton>
      </XStack>

      {loading && grouped.length === 0 ? (
        <SkeletonList count={3} />
      ) : (
        <FlatList<AvailabilityBlock>
          data={grouped}
          keyExtractor={(item: AvailabilityBlock) => item.id}
          style={{ flex: 1 }}
          contentContainerStyle={grouped.length === 0 ? { flex: 1 } : { paddingBottom: 24 }}
          renderItem={({ item }: { item: AvailabilityBlock }) => (
            <AppCard marginBottom={10}>
              <XStack items="center" gap={12}>
                <YStack flex={1} gap={2}>
                  <Text fontSize={15} fontWeight="600" color={colors.text}>
                    {capitalize(item.dayOfWeek)} · {item.startTime}–{item.endTime}
                  </Text>
                  <Text fontSize={12} color={colors.textMuted}>
                    {capitalize(item.type)}
                  </Text>
                </YStack>
                <AppButton variant="destructive" size="sm" onPress={() => setDeleteId(item.id)}>
                  Remove
                </AppButton>
              </XStack>
            </AppCard>
          )}
          ListEmptyComponent={
            <EmptyState message="No availability blocks yet — add your first block above" />
          }
        />
      )}

      <AppModal
        open={deleteId !== null}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete block?"
        description="This availability block will be permanently removed."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onConfirm={confirmDelete}
      />
    </AppScreen>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
