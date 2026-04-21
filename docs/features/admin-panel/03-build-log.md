# Feature Build Log: Admin Panel

**Date:** 2026-04-12
**Status:** COMPLETE
**Design:** [02-design.md](./02-design.md)

---

## Files Created

| File | Purpose |
|------|---------|
| `components/admin/AdminHeader.tsx` | Floating header for admin pages — back-to-app link, title, theme toggle |
| `app/(admin)/layout.tsx` | Client-side admin auth guard (safety net; `proxy.ts` is primary gate) |
| `app/(admin)/admin/page.tsx` | Overview — 4 stat cards + 3 section link cards |
| `app/(admin)/admin/users/page.tsx` | User list — role select, delete with inline confirm, SEED_USER locked |
| `app/(admin)/admin/settings/page.tsx` | App settings — defaultCurrency, defaultTimezone, defaultThemeColor |
| `app/(admin)/admin/data/page.tsx` | Data — per-group seed record counts, reset with localStorage wipe + reload |

## Files Modified

| File | What changed |
|------|-------------|
| `proxy.ts` | Added admin route guard — redirects non-admins to `/` |
| `lib/dummy-users.ts` | Added `UserRole`, role to `DummyUser`/`SessionPayload`/`SEED_USER`; `updateUserRole`, `deleteUser`, `AppSettings`, `getAppSettings`, `saveAppSettings`, `patchAllGroupCurrencies` |
| `components/providers/AuthProvider.tsx` | Role backfill for pre-existing cookies missing `role` field |
| `app/login/page.tsx` | Passes `role` to `setUser` |
| `app/register/page.tsx` | Sets `role: "user"` on new registrations |
| `components/layout/ProfileDropdown.tsx` | Role pill + "Admin panel" link (admin-only, warning colour) |
| `app/(dashboard)/settings/profile/page.tsx` | Role pill in avatar preview; `useEffect` init for hydration safety |
| `lib/dummy-data.ts` | Added `createdAt`/`updatedAt` to `Group`, `AppEvent`, `Transaction`, `Recipe`, `DayMeals` types and all seed entries |
| `components/settings/GroupsManager.tsx` | `useState` init moved to `useEffect`, `createdAt`/`updatedAt` stamped on save |
| `components/settings/EventsManager.tsx` | `createdAt`/`updatedAt` stamped on save |
| `components/meals/RecipeList.tsx` | `createdAt`/`updatedAt` stamped on save; `createdAt` preserved on edit |
| `components/meals/MealsSection.tsx` | `createdAt`/`updatedAt` stamped on new `DayMeals`; `updatedAt` on slot edit |
| `components/providers/GroupProvider.tsx` | `userId` fallback fixed (`""` not `"user-1"`); `createdAt`/`updatedAt` on `buildDefaultGroup` |

## TypeScript Check

```
npx tsc --noEmit → 0 errors
```

## Lint Check

```
npm run lint → warnings/errors are pre-existing react-hooks/set-state-in-effect pattern
               used throughout the codebase for localStorage initialisation.
               Admin-file-specific issues fixed: removed unused Database import,
               prefixed unused _groupId parameter.
```

## Deviations from Design

No deviations from approved design.
