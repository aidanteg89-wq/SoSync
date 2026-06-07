/**
 * API base URL. Set EXPO_PUBLIC_API_URL in apps/mobile/.env (see .env.example).
 */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';

const RAW_GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID?.trim() || undefined;

/** Strips accidental duplicate `.apps.googleusercontent.com` suffixes from copy-paste. */
export function normalizeGoogleClientId(id: string | undefined): string | undefined {
  if (!id) return undefined;
  const suffix = '.apps.googleusercontent.com';
  let normalized = id.trim();
  while (normalized.endsWith(suffix + suffix)) {
    normalized = normalized.slice(0, -suffix.length);
  }
  return normalized;
}

export const GOOGLE_CLIENT_ID = normalizeGoogleClientId(RAW_GOOGLE_CLIENT_ID);

export function isGoogleClientIdConfigured(id: string | undefined): boolean {
  const normalized = normalizeGoogleClientId(id);
  if (!normalized) return false;
  const lower = normalized.toLowerCase();
  if (
    lower.includes('replace_with') ||
    lower.includes('your_client_id') ||
    lower.includes('xxxx') ||
    lower.includes('example')
  ) {
    return false;
  }
  if (!/^\d+-[\w-]+\.apps\.googleusercontent\.com$/.test(normalized)) {
    return false;
  }
  return true;
}

export const GOOGLE_REDIRECT_URI = `${API_URL}/auth/google/callback`;
