# Tamagui Design System Migration

Migration completed: SoSync mobile app now uses Tamagui as the primary UI framework with a custom **nature theme** (forest green, maroon, beige, dark blue, brown).

## What Changed

### Infrastructure
- **Tamagui v2** installed with `@tamagui/config`, `@tamagui/babel-plugin`, `@tamagui/lucide-icons`
- [`babel.config.js`](babel.config.js) — Expo preset + Tamagui compiler + Reanimated plugin
- [`metro.config.js`](metro.config.js) — Monorepo workspace resolution
- [`tamagui.config.ts`](tamagui.config.ts) — Custom `nature` theme extending default v4 config
- [`app/_layout.tsx`](app/_layout.tsx) — `TamaguiProvider`, Inter fonts, splash hold until fonts load

### Theme (`theme/`)
| File | Purpose |
|------|---------|
| `colors.ts` | Nature palette semantic colors |
| `tokens.ts` | Spacing, radius, typography scales |
| `natureTheme.ts` | Tamagui theme object merged from light + green |

### UI Library (`components/ui/`)
| Component | Purpose |
|-----------|---------|
| `AppScreen` | Safe area + scroll wrapper |
| `AppHeader` | Page title + subtitle + action slot |
| `AppButton` | Primary / secondary / ghost / destructive / success variants |
| `AppInput` | Labelled text input with error state |
| `AppCard` | Elevated surface card |
| `AppModal` | Confirmation dialog (delete blocks, etc.) |
| `AppSheet` | Bottom sheet primitive |
| `AppAvatar` | Initials avatar |
| `AppBadge` | Status pills |
| `AppListItem` | Search result rows |
| `EmptyState` | Centered empty messages |
| `ErrorBanner` | Inline error display |
| `SkeletonList` | Loading placeholders |

### Screens Refactored
All 5 tab screens + tab bar + `GoogleAuthButton` migrated to Tamagui. **Business logic unchanged** — all API calls, auth, OAuth PKCE flow, and navigation preserved.

## Manual Steps After Pull

1. **Install dependencies** (from repo root):
   ```bash
   npm install
   ```

2. **Clear Metro cache** on first run:
   ```bash
   cd apps/mobile && npx expo start -c
   ```
   Or from root: `npm run mobile:clear`

3. **Environment** — no changes required. Existing `.env` values work as before.

4. **Test on device** — Google OAuth deep-link flow requires a physical device or Expo Go; verify sign-in and calendar connect still work.

## Test Checklist

- [ ] Google sign-in (Profile → Continue with Google)
- [ ] Email login / register
- [ ] Friends search + add + accept
- [ ] Availability add + delete (modal confirm)
- [ ] Suggestions refresh + accept + decline
- [ ] Events list after accepting suggestion
- [ ] Calendar connect when logged in
- [ ] Push token registration (physical device)
- [ ] Android layout smoke test

## Known Limitations

- **Light mode only** — nature theme is light; dark mode deferred
- **Tamagui v4 shorthands** — use `items`, `justify`, `bg`, `rounded`, `mb`, etc. (not `ai`, `jc`)
- **No analytics layer** existed pre-migration; nothing to migrate

## Files Not Modified

- `lib/AuthContext.tsx` — auth state and API calls
- `lib/constants.ts` — env and Google OAuth helpers
- `apps/api/*` — backend unchanged
