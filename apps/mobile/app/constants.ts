/**
 * API base URL. Set EXPO_PUBLIC_API_URL in apps/mobile/.env (see .env.example).
 * - Simulator / web on same machine: omit it → defaults to http://localhost:3000
 * - Physical device on your Wi‑Fi: http://<your-mac-ip>:3000
 * - Production: https://your-api.onrender.com
 */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';
