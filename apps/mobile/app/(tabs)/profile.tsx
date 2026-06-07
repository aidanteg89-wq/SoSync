import { useState } from 'react';
import { Text, XStack, YStack } from 'tamagui';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '../../lib/AuthContext';
import GoogleAuthButton from '../../components/GoogleAuthButton';
import {
  AppScreen,
  AppHeader,
  AppButton,
  AppCard,
  AppInput,
  AppAvatar,
  ErrorBanner,
} from '../../components/ui';
import { colors } from '../../theme/colors';

WebBrowser.maybeCompleteAuthSession();

export default function ProfileScreen() {
  const { user, token, login, register, logout, loading, calendarConnected, exchangeGoogleCode } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const handleGoogleCode = async (
    code: string,
    redirectUri: string,
    codeVerifier: string,
  ): Promise<string | null> => {
    setError('');
    return exchangeGoogleCode(code, redirectUri, codeVerifier).then((err) => {
      if (err) setError(err);
      return err;
    });
  };

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    let err: string | null;
    if (mode === 'login') {
      err = await login(email.trim(), password);
    } else {
      err = await register(name.trim(), email.trim(), password);
    }
    if (err) setError(err);
    setSubmitting(false);
  };

  if (loading) {
    return (
      <AppScreen scroll>
        <AppHeader title="Profile" />
        <Text fontSize={15} color={colors.textMuted} mt={20}>
          Loading...
        </Text>
      </AppScreen>
    );
  }

  if (user && token) {
    return (
      <AppScreen scroll>
        <AppHeader title="Profile" />

        <AppCard elevated marginBottom={16}>
          <XStack items="center" gap={16} mb={16}>
            <AppAvatar name={user.name} size="lg" />
            <YStack flex={1} gap={4}>
              <Text fontSize={22} fontWeight="700" color={colors.text}>
                {user.name}
              </Text>
              <Text fontSize={15} color={colors.textMuted}>
                {user.email}
              </Text>
            </YStack>
          </XStack>
          <YStack gap={8}>
            <Text fontSize={12} color={colors.textMuted}>
              Your ID
            </Text>
            <Text fontSize={13} color={colors.text} selectable>
              {user.id}
            </Text>
            <Text fontSize={12} color={colors.textMuted} mt={8}>
              Joined {new Date(user.createdAt).toLocaleDateString()}
            </Text>
          </YStack>
        </AppCard>

        <AppCard elevated marginBottom={16}>
          <Text fontSize={16} fontWeight="700" color={colors.heading} mb={12}>
            Google Calendar
          </Text>
          {calendarConnected ? (
            <XStack items="center" gap={10}>
              <YStack width={10} height={10} rounded={5} bg={colors.success} />
              <Text fontSize={14} color={colors.success}>
                Connected — events sync automatically
              </Text>
            </XStack>
          ) : (
            <>
              <Text fontSize={13} color={colors.textMuted} mb={12} lineHeight={20}>
                Connect Google to sync accepted events to your calendar.
              </Text>
              <GoogleAuthButton
                label="Connect Google Calendar"
                variant="calendar"
                busy={googleBusy}
                onBusyChange={setGoogleBusy}
                onCode={handleGoogleCode}
              />
            </>
          )}
        </AppCard>

        <AppButton variant="destructive" onPress={logout}>
          Log Out
        </AppButton>
      </AppScreen>
    );
  }

  return (
    <AppScreen scroll>
      <AppHeader
        title="Welcome to SoSync"
        subtitle={mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
      />

      {mode === 'register' && (
        <AppInput
          label="Name"
          placeholder="Your name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
      )}

      <AppInput
        label="Email"
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <AppInput
        label="Password"
        placeholder="••••••••"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <ErrorBanner message={error} />

      <AppButton variant="primary" loading={submitting} onPress={handleSubmit}>
        {mode === 'login' ? 'Sign In' : 'Create Account'}
      </AppButton>

      <XStack items="center" my={16} gap={12}>
        <YStack flex={1} height={1} bg={colors.border} />
        <Text fontSize={13} color={colors.textMuted}>
          or
        </Text>
        <YStack flex={1} height={1} bg={colors.border} />
      </XStack>

      <GoogleAuthButton
        label="Continue with Google"
        variant="signIn"
        busy={googleBusy}
        onBusyChange={setGoogleBusy}
        onCode={handleGoogleCode}
      />

      <AppButton
        variant="ghost"
        onPress={() => {
          setMode(mode === 'login' ? 'register' : 'login');
          setError('');
        }}
      >
        {mode === 'login' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
      </AppButton>
    </AppScreen>
  );
}
