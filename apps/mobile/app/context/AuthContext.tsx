import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants';

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  loading: boolean;
  calendarConnected: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  register: (name: string, email: string, password: string) => Promise<string | null>;
  exchangeGoogleCode: (
    code: string,
    redirectUri: string,
    codeVerifier?: string,
  ) => Promise<string | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [calendarConnected, setCalendarConnected] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('auth');
        if (stored) {
          const parsed = JSON.parse(stored);
          setToken(parsed.token);
          setUser(parsed.user);
          setCalendarConnected(Boolean(parsed.calendarConnected));
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = async (t: string, u: User, calConnected = false) => {
    setToken(t);
    setUser(u);
    setCalendarConnected(calConnected);
    await AsyncStorage.setItem(
      'auth',
      JSON.stringify({ token: t, user: u, calendarConnected: calConnected }),
    );
  };

  const login = useCallback(async (email: string, password: string): Promise<string | null> => {
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json();
      if (!res.ok) return body.error ?? 'Login failed';
      await persist(body.token, body.user);
      return null;
    } catch {
      return 'Could not connect to API';
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string): Promise<string | null> => {
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const body = await res.json();
      if (!res.ok) return body.error ?? 'Registration failed';
      await persist(body.token, body.user);
      return null;
    } catch {
      return 'Could not connect to API';
    }
  }, []);

  const exchangeGoogleCode = useCallback(
    async (code: string, redirectUri: string, codeVerifier?: string): Promise<string | null> => {
      try {
        const res = await fetch(`${API_URL}/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, redirectUri, codeVerifier }),
        });
        const body = await res.json();
        if (!res.ok) return body.error ?? 'Google sign-in failed';
        await persist(body.token, body.user, Boolean(body.calendarConnected));
        return null;
      } catch {
        return 'Could not connect to API';
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    setToken(null);
    setUser(null);
    setCalendarConnected(false);
    await AsyncStorage.removeItem('auth');
  }, []);

  return (
    <AuthContext.Provider
      value={{ token, user, loading, calendarConnected, login, register, exchangeGoogleCode, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
