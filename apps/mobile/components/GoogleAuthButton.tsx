import { Alert, Platform, Pressable, StyleSheet, Text } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import {
  GOOGLE_CLIENT_ID as ENV_GOOGLE_CLIENT_ID,
  GOOGLE_REDIRECT_URI,
  isGoogleClientIdConfigured,
  normalizeGoogleClientId,
} from '../lib/constants';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_DISCOVERY: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

const SCOPES = [
  'openid',
  'profile',
  'email',
  'https://www.googleapis.com/auth/calendar.events',
];

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

/** Where Expo / the app listens for the OAuth result (sosync:// or exp:// in Expo Go). */
function appOAuthReturnUrl(): string {
  return AuthSession.makeRedirectUri({
    scheme: 'sosync',
    path: 'oauth2redirect',
  });
}

/**
 * Pack the app return URL into OAuth state so the HTTPS API callback can
 * 302 back into the app — required for Expo Go (can't complete on Render URL alone).
 */
function buildOAuthState(appReturn: string): string {
  return `${Date.now().toString(36)}|${encodeURIComponent(appReturn)}`;
}

interface GoogleAuthButtonProps {
  label: string;
  busy: boolean;
  onBusyChange: (busy: boolean) => void;
  onCode: (code: string, redirectUri: string, codeVerifier: string) => Promise<string | null>;
}

export default function GoogleAuthButton({ label, busy, onBusyChange, onCode }: GoogleAuthButtonProps) {
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
      const request = await AuthSession.loadAsync(
        {
          clientId: clientId!,
          scopes: SCOPES,
          redirectUri: GOOGLE_REDIRECT_URI,
          responseType: AuthSession.ResponseType.Code,
          usePKCE: true,
          state: oauthState,
          extraParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
        GOOGLE_DISCOVERY,
      );

      const authUrl = request.url;
      if (!authUrl) {
        Alert.alert('Google sign-in failed', 'Could not build the Google authorization URL.');
        return;
      }

      // Wait for deep link (sosync:// or exp://), NOT the HTTPS Render callback.
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
        const msg =
          parsed.error?.message ??
          parsed.params?.error_description ??
          parsed.params?.error ??
          'Google sign-in failed.';
        Alert.alert('Google sign-in failed', String(msg));
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
    <Pressable
      style={({ pressed }) => [
        styles.googleBtn,
        (busy || pressed) && styles.googleBtnPressed,
      ]}
      onPress={handlePress}
      disabled={busy}
      accessibilityRole="button"
      accessibilityState={{ disabled: busy }}
    >
      <Text style={styles.googleBtnText}>{busy ? 'Connecting...' : label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  googleBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  googleBtnPressed: { opacity: 0.7, backgroundColor: '#f8f9fa' },
  googleBtnText: { color: '#212529', fontWeight: '600', fontSize: 15 },
});
