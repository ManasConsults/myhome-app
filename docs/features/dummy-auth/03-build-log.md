# Build Log: Dummy Auth

**Date:** 2026-04-12
**Status:** COMPLETE

## Files Created

- `lib/dummy-users.ts` — `DummyUser` type, `SEED_USER`, `getRegisteredUsers`, `registerUser`, `findUser`, `findUserByEmail`, `encodeSession`, `decodeSession`
- `components/providers/AuthProvider.tsx` — `AuthProvider` context + `useAuth()` hook
- `proxy.ts` — middleware logic (route protection); Next.js 16 uses this directly — no `middleware.ts` needed
- `app/login/page.tsx` — login form with error handling + demo credentials hint
- `app/register/page.tsx` — register form with password confirmation + duplicate email check

## Files Modified

- `lib/dummy-data.ts` — added `userId: string` to `Group` type; all seed groups set to `userId: "user-1"`
- `app/layout.tsx` — wrapped with `AuthProvider` (outermost provider)
- `components/providers/GroupProvider.tsx` — filters groups by `useAuth().user.userId`; loads/saves non-seed groups from `localStorage["myhome-user-groups-{userId}"]`; auto-creates default group for new users; exposes `addGroup`, `updateGroup`, `removeGroup`
- `components/layout/ProfileDropdown.tsx` — reads name/email from `useAuth()`; sign-out calls `logout()`
- `components/settings/GroupsManager.tsx` — reads `userId` from `useAuth()`; filters seed groups by userId; stamps `userId` on new groups
- `app/(dashboard)/settings/profile/page.tsx` — initialises name/email from `useAuth().user`; save calls `setUser()` to update cookie

## Decisions Made

- Cookie is not `httpOnly` so both `proxy.ts` (server) and `AuthProvider` (client) can read it without an extra API call
- New registered users auto-get a default "My Home" group — prevents `activeGroup` from being undefined and crashing `GroupProvider`
- `GroupProvider` returns `null` while hydrating (before `activeGroup` resolves) — dashboard renders nothing briefly rather than crashing
- `GroupsManager` initialises from seed groups filtered by `userId` so new users start with an empty list there
- Profile page updates the cookie on save so the name change is reflected immediately in `ProfileDropdown`
