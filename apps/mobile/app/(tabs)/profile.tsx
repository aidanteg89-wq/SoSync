import { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import { useAuth } from '../context/AuthContext';

WebBrowser.maybeCompleteAuthSession();

// Google's OAuth endpoints
const GOOGLE_DISCOVERY: AuthSession.DiscoveryDocument = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

// Scopes: openid + profile + email for auth, Calendar events for sync.
const SCOPES = [
  'openid',
  'profile',
  'email',
  'https://www.googleapis.com/auth/calendar.events',
];

// Expo config reads `extra.googleClientId` from app.json / app.config.js.
// Set it to your Google Cloud "Web application" OAuth 2.0 client ID.
const GOOGLE_CLIENT_ID: string | undefined =
  (Constants.expoConfig?.extra?.googleClientId as string | undefined) ??
  (Constants.manifestExtra?.googleClientId as string | undefined);

export default function ProfileScreen() {
  const { user, token, login, register, logout, loading, calendarConnected, exchangeGoogleCode } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  // Redirect URI must exactly match what's registered in Google Cloud Console.
  // For Expo Go / dev: makeRedirectUri returns an https://auth.expo.io/... proxy URL when useProxy is true.
  const redirectUri = AuthSession.makeRedirectUri({
    scheme: 'sosync',
    path: 'oauth2redirect',
  });

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID ?? '',
      scopes: SCOPES,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
      extraParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
    GOOGLE_DISCOVERY,
  );

  useEffect(() => {
    if (response?.type !== 'success') return;
    const code = response.params.code;
    if (!code || !request?.codeVerifier) return;

    (async () => {
      setGoogleBusy(true);
      setError('');
      const err = await exchangeGoogleCode(code, redirectUri, request.codeVerifier);
      if (err) setError(err);
      setGoogleBusy(false);
    })();
  }, [response]);

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

  const handleGooglePress = () => {
    if (!GOOGLE_CLIENT_ID) {
      const msg =
        'Google sign-in is not configured. Set expo.extra.googleClientId in app.json to your OAuth 2.0 Web client ID.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Setup needed', msg);
      return;
    }
    promptAsync();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.loadingText}>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (user && token) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>Profile</Text>
          <View style={styles.profileCard}>
            <Text style={styles.profileName}>{user.name}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
            <View style={styles.idRow}>
              <Text style={styles.idLabel}>Your ID:</Text>
              <Text style={styles.idValue} selectable>{user.id}</Text>
            </View>
            <Text style={styles.joined}>
              Joined {new Date(user.createdAt).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.settingsCard}>
            <Text style={styles.settingsTitle}>Google Calendar</Text>
            {calendarConnected ? (
              <View style={styles.statusRow}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Connected — events sync automatically</Text>
              </View>
            ) : (
              <>
                <Text style={styles.settingsHint}>
                  Connect Google to sync accepted events to your calendar.
                </Text>
                <TouchableOpacity
                  style={[styles.googleBtn, googleBusy && styles.btnDisabled]}
                  onPress={handleGooglePress}
                  disabled={googleBusy || !request}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                >
                  <Text style={styles.googleBtnText}>
                    {googleBusy ? 'Connecting...' : 'Connect Google Calendar'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={logout}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <Text style={styles.logoutBtnText}>Log Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Welcome to SoSync</Text>
        <Text style={styles.subtitle}>
          {mode === 'login' ? 'Sign in to your account' : 'Create a new account'}
        </Text>

        {mode === 'register' && (
          <TextInput
            style={styles.input}
            placeholder="Name"
            placeholderTextColor="#adb5bd"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#adb5bd"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#adb5bd"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error !== '' && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.primaryBtn, submitting && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <Text style={styles.primaryBtnText}>
            {submitting ? '...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={[styles.googleBtn, googleBusy && styles.btnDisabled]}
          onPress={handleGooglePress}
          disabled={googleBusy || !request}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <Text style={styles.googleBtnText}>
            {googleBusy ? 'Connecting...' : 'Continue with Google'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchBtn}
          onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
          activeOpacity={0.8}
        >
          <Text style={styles.switchBtnText}>
            {mode === 'login' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', paddingHorizontal: 20 },
  title: { fontSize: 28, fontWeight: '800', color: '#1a1a2e', marginTop: 12, marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#6c757d', marginBottom: 24 },
  loadingText: { fontSize: 15, color: '#6c757d', marginTop: 20 },
  input: {
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#dee2e6',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#212529', marginBottom: 12,
  },
  error: { color: '#e63946', fontSize: 13, marginBottom: 12 },
  primaryBtn: { backgroundColor: '#4361ee', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginBottom: 12 },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  btnDisabled: { opacity: 0.5 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#dee2e6' },
  dividerText: { marginHorizontal: 12, color: '#adb5bd', fontSize: 13 },
  googleBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  googleBtnText: { color: '#212529', fontWeight: '600', fontSize: 15 },
  switchBtn: { alignItems: 'center', paddingVertical: 12 },
  switchBtnText: { color: '#4361ee', fontSize: 14 },
  profileCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 16 },
  profileName: { fontSize: 22, fontWeight: '700', color: '#212529', marginBottom: 4 },
  profileEmail: { fontSize: 15, color: '#6c757d', marginBottom: 16 },
  idRow: { marginBottom: 12 },
  idLabel: { fontSize: 12, color: '#adb5bd', marginBottom: 4 },
  idValue: { fontSize: 13, color: '#212529', fontFamily: 'monospace' },
  joined: { fontSize: 12, color: '#adb5bd' },
  settingsCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, marginBottom: 16 },
  settingsTitle: { fontSize: 16, fontWeight: '700', color: '#212529', marginBottom: 12 },
  settingsHint: { fontSize: 13, color: '#6c757d', marginBottom: 12 },
  statusRow: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#2dc653', marginRight: 10 },
  statusText: { fontSize: 14, color: '#155724' },
  logoutBtn: { borderWidth: 1, borderColor: '#e63946', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  logoutBtnText: { color: '#e63946', fontWeight: '600', fontSize: 15 },
});
