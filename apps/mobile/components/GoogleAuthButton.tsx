import { Alert, Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import {
  GOOGLE_CLIENT_ID as ENV_GOOGLE_CLIENT_ID,
  GOOGLE_REDIRECT_URI,
  isGoogleClientIdConfigured,
  normalizeGoogleClientId,
} from '../lib/constants';
import { AppButton } from './ui/AppButton';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_DISCOVERY: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

const SCOPES_SIGN_IN = ['openid', 'profile', 'email'];

const SCOPES_CALENDAR = [
  'openid',
  'profile',
  'email',
  'https://www.googleapis.com/auth/calendar.events',
];

function scopesForVariant(variant: 'signIn' | 'calendar'): string[] {
  return variant === 'calendar' ? SCOPES_CALENDAR : SCOPES_SIGN_IN;
}

function formatGoogleError(msg: string, variant: 'signIn' | 'calendar'): string {
  const lower = msg.toLowerCase();
  if (
    lower.includes('verification') ||
    lower.includes('access blocked') ||
    lower.includes('has not completed')
  ) {
    return (
      `${msg}\n\n` +
      'Your Google Cloud app is in Testing mode. Fix:\n' +
      '1. console.cloud.google.com → APIs & Services → OAuth consent screen\n' +
      '2. Add your Gmail under Test users\n' +
      '3. Sign in with that exact Gmail address\n' +
      (variant === 'calendar'
        ? '4. Calendar access needs that test user + Calendar API enabled'
        : '')
    );
  }
  return msg;
}

function resolveGoogleClientId(): string | undefined {
  const fromEnv = normalizeGoogleClientId(ENV_GOOGLE_CLIENT_ID);
  if (fromEnv) return fromEnv;
  return normalizeGoogleClientId(
    (Constants.expoConfig?.extra?.googleClientId as string | undefined) ??
      (Constants.manifestExtra?.googleClientId as string | undefined),
  );
}

function showConfigAlert(): void {
  const msg =
    'Google Client ID is missing or invalid.\n\n' +
    'Add to apps/mobile/.env:\n' +
    'EXPO_PUBLIC_GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com\n\n' +
    'Then restart: npx expo start -c';
  if (Platform.OS === 'web') window.alert(msg);
  else Alert.alert('Google sign-in not configured', msg);
}

function appOAuthReturnUrl(): string {
  return AuthSession.makeRedirectUri({
    scheme: 'sosync',
    path: 'oauth2redirect',
  });
}

function buildOAuthState(appReturn: string): string {
  return `${Date.now().toString(36)}|${encodeURIComponent(appReturn)}`;
}

interface GoogleAuthButtonProps {
  label: string;
  variant?: 'signIn' | 'calendar';
  busy: boolean;
  onBusyChange: (busy: boolean) => void;
  onCode: (code: string, redirectUri: string, codeVerifier: string) => Promise<string | null>;
}

export default function GoogleAuthButton({
  label,
  variant = 'signIn',
  busy,
  onBusyChange,
  onCode,
}: GoogleAuthButtonProps) {
  const handlePress = async () => {
    const clientId = resolveGoogleClientId();
    if (!isGoogleClientIdConfigured(clientId)) {
      showConfigAlert();
      return;
    }

    const appReturn = appOAuthReturnUrl();
    const oauthState = buildOAuthState(appReturn);

    onBusyChange(true);
    try {
      const extraParams: Record<string, string> =
        variant === 'calendar'
          ? { access_type: 'offline', prompt: 'consent' }
          : { prompt: 'select_account' };

      const request = await AuthSession.loadAsync(
        {
          clientId: clientId!,
          scopes: scopesForVariant(variant),
          redirectUri: GOOGLE_REDIRECT_URI,
          responseType: AuthSession.ResponseType.Code,
          usePKCE: true,
          state: oauthState,
          extraParams,
        },
        GOOGLE_DISCOVERY,
      );

      const authUrl = request.url;
      if (!authUrl) {
        Alert.alert('Google sign-in failed', 'Could not build the Google authorization URL.');
        return;
      }

      const browserResult = await WebBrowser.openAuthSessionAsync(authUrl, appReturn);

      if (browserResult.type === 'cancel') {
        Alert.alert('Sign-in cancelled', 'Google sign-in was cancelled.');
        return;
      }

      if (browserResult.type === 'dismiss') {
        Alert.alert(
          'Sign-in interrupted',
          'The Google sign-in window closed before finishing. Deploy the latest API to Render (callback must redirect into the app), then try again.',
        );
        return;
      }

      if (browserResult.type !== 'success' || !browserResult.url) {
        Alert.alert('Google sign-in failed', `Unexpected result: ${browserResult.type}`);
        return;
      }

      const parsed = request.parseReturnUrl(browserResult.url);

      if (parsed.type === 'error') {
        const raw =
          parsed.error?.message ??
          parsed.params?.error_description ??
          parsed.params?.error ??
          'Google sign-in failed.';
        Alert.alert('Google sign-in failed', formatGoogleError(String(raw), variant));
        return;
      }

      if (parsed.type !== 'success' || !parsed.params.code) {
        Alert.alert('Google sign-in failed', 'No authorization code was returned.');
        return;
      }

      if (!request.codeVerifier) {
        Alert.alert('Google sign-in failed', 'Missing PKCE verifier — try again.');
        return;
      }

      const err = await onCode(parsed.params.code, GOOGLE_REDIRECT_URI, request.codeVerifier);
      if (err) {
        Alert.alert('Sign-in failed', err);
      }
    } catch (e) {
      Alert.alert(
        'Google sign-in failed',
        e instanceof Error ? e.message : 'Could not start Google sign-in.',
      );
    } finally {
      onBusyChange(false);
    }
  };

  return (
    <AppButton
      variant="secondary"
      loading={busy}
      disabled={busy}
      onPress={handlePress}
      accessibilityLabel={label}
    >
      {busy ? 'Connecting...' : label}
    </AppButton>
  );
}
