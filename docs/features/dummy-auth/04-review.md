# Review: Dummy Auth

**Date:** 2026-04-12
**Status:** PASSED (all issues resolved)

## Issues Found and Fixed

### Critical

| # | File | Issue | Fix |
|---|------|-------|-----|
| 1 | `components/settings/GroupsManager.tsx` | `useState` initialised directly from import at render time — would lose edits on remount | Moved to `useEffect(() => { setGroups(...) }, [userId])` |
| 2 | `components/layout/ProfileDropdown.tsx` | `Avatar` used as click target but renders as a `div` — semantic violation, no `aria-label` | Wrapped in `<button aria-label="Open profile menu">` with matching focus ring |
| 3 | `proxy.ts` | Matcher excluded `_next/static`, `_next/image`, `favicon.ico` but not `public/` — `/logo.svg` would redirect unauthenticated users to `/login`, breaking auth page logo | Added `public/` to negative lookahead in matcher |

### Minor

| # | File | Issue | Fix |
|---|------|-------|-----|
| 4 | `app/(dashboard)/settings/profile/page.tsx` | `name`/`email` initialised from `user` in `useState` — since `user` is `null` on SSR, values would not update when `AuthProvider` hydrates | Initialised from `userProfile` fallback; sync from `user` via `useEffect([user])` |
| 5 | `app/login/page.tsx` | Error message animation `duration: 0.15` below 200ms minimum | Changed to `0.2` |
| 6 | `app/register/page.tsx` | Same 150ms duration violation | Changed to `0.2` |
| 7 | `components/providers/GroupProvider.tsx` | `userId` fell back to hard-coded `"user-1"` before auth hydrates — caused a brief flash of seed user's groups for new users | Changed fallback to `""` so no groups load until auth resolves |
| 8 | `components/layout/ProfileDropdown.tsx` | `userProfile` import used as dead fallback — leaks static import into auth-driven component | Removed import; fallback is now `""` |
