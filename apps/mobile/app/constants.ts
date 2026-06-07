/**
 * API base URL. Set EXPO_PUBLIC_API_URL in apps/mobile/.env (see .env.example).
 * - Simulator / web on same machine: omit it → defaults to http://localhost:3000
 * - Physical device on your Wi‑Fi: http://<your-mac-ip>:3000
 * - Production: https://your-api.onrender.com
 */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';

/** Google OAuth Web client ID — must match GOOGLE_CLIENT_ID on the API. */
export const GOOGLE_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID?.trim() ||
  undefined;

export function isGoogleClientIdConfigured(id: string | undefined): boolean {
  if (!id) return false;
  if (id.includes('REPLACE_WITH')) return false;
  if (!id.endsWith('.apps.googleusercontent.com')) return false;
  return true;
}
