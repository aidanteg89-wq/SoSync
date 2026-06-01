# SoSync

Social scheduling MVP — suggest hangouts from overlapping availability.

## Quick start (local)

```bash
npm install
cp apps/api/.env.example apps/api/.env   # then edit DATABASE_URL + JWT_SECRET
cp apps/mobile/.env.example apps/mobile/.env

npm run dev              # API at http://localhost:3000 (same as api:dev)
npm run mobile:start     # Expo — press i for iOS Simulator
```

Full deploy and Google OAuth steps: **[DEPLOY.md](./DEPLOY.md)**

## Structure

- `apps/api` — Express + Prisma + Postgres
- `apps/mobile` — Expo Router app
- `packages/shared` — shared TypeScript types
