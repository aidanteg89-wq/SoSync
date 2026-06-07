import { useState, useEffect, useCallback, useRef } from 'react';
import { FlatList, Alert, Platform } from 'react-native';
import { Spinner, Text, XStack, YStack } from 'tamagui';
import { Search, UserPlus } from 'lucide-react-native';
import { useAuth } from '../../lib/AuthContext';
import { API_URL } from '../../lib/constants';
import {
  AppScreen,
  AppHeader,
  AppButton,
  AppCard,
  AppInput,
  AppAvatar,
  AppBadge,
  AppListItem,
  EmptyState,
  SkeletonList,
} from '../../components/ui';
import { colors } from '../../theme/colors';

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
      <AppScreen>
        <AppHeader title="Friends" />
        <EmptyState message="Sign in on the Profile tab to manage friends" />
      </AppScreen>
    );
  }

  const showResults = query.trim().length >= 2;

  return (
    <AppScreen>
      <AppHeader title="Friends" subtitle="Find people and grow your circle" />

      <Text fontSize={16} fontWeight="700" color={colors.heading} mb={10}>
        Find People
      </Text>

      <XStack items="center" gap={8} mb={10}>
        <YStack flex={1}>
          <AppInput
            placeholder="Search by name or email"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </YStack>
        {searching ? <Spinner size="small" color={colors.primary} /> : <Search size={20} color={colors.textMuted} />}
      </XStack>

      {showResults ? (
        <AppCard elevated marginBottom={16} padding={8}>
          {results.length === 0 && !searching ? (
            <Text fontSize={14} color={colors.textMuted} text="center" p={12}>
              No users found
            </Text>
          ) : (
            results.map((u) => {
              const existing = friendshipWith(u.id);
              return (
                <AppListItem
                  key={u.id}
                  title={u.name}
                  subtitle={u.email}
                  left={<AppAvatar name={u.name} size="sm" />}
                  bordered
                  right={
                    existing ? (
                      <AppBadge variant={existing.status === 'accepted' ? 'success' : 'muted'}>
                        {existing.status === 'accepted' ? 'Friends' : 'Pending'}
                      </AppBadge>
                    ) : (
                      <AppButton
                        variant="primary"
                        size="sm"
                        onPress={() => sendRequest(u)}
                        icon={<UserPlus size={14} color={colors.white} />}
                      >
                        Add
                      </AppButton>
                    )
                  }
                />
              );
            })
          )}
        </AppCard>
      ) : null}

      <YStack height={1} bg={colors.border} my={8} />

      <XStack justify="space-between" items="center" mb={10}>
        <Text fontSize={16} fontWeight="700" color={colors.heading}>
          Your Friends
        </Text>
        <AppButton variant="ghost" size="sm" loading={loading} onPress={fetchFriends}>
          Refresh
        </AppButton>
      </XStack>

      {loading && friends.length === 0 ? (
        <SkeletonList count={3} />
      ) : (
        <FlatList<Friend>
          data={friends}
          keyExtractor={(item: Friend) => item.id}
          style={{ flex: 1 }}
          contentContainerStyle={friends.length === 0 ? { flex: 1 } : { paddingBottom: 24 }}
          renderItem={({ item }: { item: Friend }) => {
            const isSender = item.userId === user.id;
            return (
              <AppCard marginBottom={10}>
                <XStack items="center" gap={12}>
                  <AppAvatar name={item.other?.name ?? '?'} size="sm" />
                  <YStack flex={1} gap={2}>
                    <Text fontSize={15} fontWeight="600" color={colors.text}>
                      {item.other?.name ?? 'Unknown'}
                    </Text>
                    <Text fontSize={13} color={colors.textMuted}>
                      {item.other?.email} · {item.status}
                    </Text>
                  </YStack>
                  {item.status === 'pending' && !isSender ? (
                    <AppButton variant="success" size="sm" onPress={() => acceptRequest(item.id)}>
                      Accept
                    </AppButton>
                  ) : item.status === 'accepted' ? (
                    <AppBadge variant="success">Friends</AppBadge>
                  ) : null}
                </XStack>
              </AppCard>
            );
          }}
          ListEmptyComponent={
            <EmptyState message="No friends yet — search above to find people" />
          }
        />
      )}
    </AppScreen>
  );
}
