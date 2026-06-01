# SoSync — Deploy & run guide

Use this after the codebase is on your machine. The API talks to **Supabase Postgres**; the mobile app talks to the **API**.

---

## Your checklist (do these in order)

### 1. Secure Supabase (5 min)

If your database password was ever pasted in chat or committed, rotate it:

1. [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Project Settings → Database**
2. **Reset database password**
3. Copy the **Session pooler** connection string (IPv4-friendly), port `5432`
4. URL-encode special characters in the password (`@` → `%40`, `%` → `%25`, `&` → `%26`, etc.)
5. Update `apps/api/.env`:

```env
DATABASE_URL="postgresql://postgres.<ref>:<ENCODED_PASSWORD>@aws-1-<region>.pooler.supabase.com:5432/postgres"
JWT_SECRET="<run: openssl rand -hex 32>"
```

Optional (needed for Google sign-in + Calendar):

```env
GOOGLE_CLIENT_ID="....apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="..."
```

---

### 2. Verify API locally (2 min)

From the repo root:

```bash
cd apps/api
npm run dev
```

In another terminal:

```bash
curl http://localhost:3000/health
```

You should see JSON with `"status":"ok"` (or similar). If Prisma errors, run:

```bash
cd apps/api && npx prisma migrate deploy
```

---

### 3. Put the repo on GitHub (10 min)

The monorepo root is not a git repo yet. `apps/mobile` has its own `.git` — remove it so you have **one** repo:

```bash
cd /Users/tegtmeierac/SoSync
rm -rf apps/mobile/.git
git init
git add .
git commit -m "Initial SoSync monorepo"
```

Create an empty repo on GitHub (no README), then:

```bash
git remote add origin git@github.com:YOUR_USER/SoSync.git
git branch -M main
git push -u origin main
```

Never commit `apps/api/.env` or `apps/mobile/.env` (they are gitignored).

---

### 4. Deploy API to Render (15 min)

1. [render.com](https://render.com) → **New +** → **Blueprint**
2. Connect the GitHub repo that contains `render.yaml`
3. When prompted, set environment variables:

| Key | Value |
|-----|--------|
| `DATABASE_URL` | Same Session pooler URL as local `.env` |
| `JWT_SECRET` | Same as local (or generate new for prod only) |
| `GOOGLE_CLIENT_ID` | From Google Cloud (step 5) |
| `GOOGLE_CLIENT_SECRET` | From Google Cloud |

4. Wait for deploy; note the public URL, e.g. `https://sosync-api.onrender.com`
5. Test: `curl https://sosync-api.onrender.com/health`

**Free tier:** first request after idle can take 30–60s (cold start).

---

### 5. Point the mobile app at the API

**Simulator / Expo web (API on your Mac):**

```bash
# apps/mobile/.env — optional; localhost is the default
EXPO_PUBLIC_API_URL=http://localhost:3000
```

**Physical iPhone (API still on your Mac, same Wi‑Fi):**

```bash
# Replace with your Mac's LAN IP (System Settings → Network)
EXPO_PUBLIC_API_URL=http://192.168.1.XXX:3000
```

**Physical device or TestFlight (API on Render):**

```bash
EXPO_PUBLIC_API_URL=https://sosync-api.onrender.com
```

Start Expo (from repo root):

```bash
npm run mobile:start
# or: cd apps/mobile && npx expo start -c
```

Press `i` for iOS Simulator. After changing `.env`, restart with cache clear: `npx expo start -c`.

---

### 6. Google OAuth (optional but recommended)

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → **Credentials**
2. Create **OAuth 2.0 Client ID** → type **Web application**
3. Enable **Google Calendar API** for the project
4. **Authorized redirect URIs** — add all that apply:
   - `sosync://oauth2redirect` (dev build / standalone)
   - For Expo Go, run the app once and check the Metro log for the redirect URI from `AuthSession.makeRedirectUri`, or use the Expo proxy pattern documented in Expo AuthSession docs
5. Copy **Client ID** → `apps/mobile/app.json`:

```json
"extra": {
  "googleClientId": "YOUR_CLIENT_ID.apps.googleusercontent.com"
}
```

6. Copy **Client ID + Secret** → Render env vars and `apps/api/.env`

Sign in on Profile → **Continue with Google**. Calendar sync runs when you accept a suggestion (if a refresh token was stored).

---

### 7. End-to-end test (two users)

1. **Profile** — register User A and User B (two simulators, web + sim, or two devices)
2. **Friends** — search by email, send request, accept on the other account
3. **Availability** — both add overlapping blocks (e.g. Wed 18:00–21:00 and 19:00–22:00)
4. **Suggestions** — User A should see “Hangout with …”
5. **Accept** — check **Events** tab; Calendar/push only if Google/push are configured

---

## Troubleshooting

| Problem | Fix |
|--------|-----|
| Mobile “Could not connect to API” | Wrong `EXPO_PUBLIC_API_URL`; on a phone use LAN IP or Render URL, not `localhost` |
| Render build fails | Check Render logs; ensure `package-lock.json` is committed at repo root |
| Prisma / DB errors on Render | `DATABASE_URL` must be Session pooler; password URL-encoded |
| `tenant/user postgres.<ref> not found` | Re-copy **Session pooler** URI from Supabase (Settings → Database). User must be `postgres.<project-ref>`, not plain `postgres` on the pooler host |
| Google sign-in 500 | `GOOGLE_CLIENT_ID` / `SECRET` missing on API; redirect URI mismatch |
| Suggestions empty | Both users need **accepted** friendship + overlapping **free** blocks |

---

## What runs where

```text
Mobile (Expo)  --HTTPS/HTTP-->  API (Render or localhost:3000)
                                      |
                                      v
                               Supabase Postgres
```

---

## Commands reference

```bash
# API dev (from repo root)
npm run dev

# Mobile
npm run mobile:start

# DB migrations (local)
cd apps/api && npx prisma migrate deploy

# Docker build (optional local test)
docker build -f apps/api/Dockerfile -t sosync-api .
```
