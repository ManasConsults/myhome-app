# Feature Design: Admin Panel

**Date:** 2026-04-12
**Status:** APPROVED
**Plan:** [01-plan.md](./01-plan.md)

---

## Architecture Overview

A separate `app/(admin)/` route group with its own layout — entirely independent of `(dashboard)`. No `GroupProvider`, no sidebar. Admin reads user data directly from `lib/dummy-users.ts` helpers (`getRegisteredUsers`, `SEED_USER`) and app settings from `localStorage["myhome-app-settings"]`. All admin pages are `"use client"` — no async data fetching needed in the dummy phase.

Gate is two-layered:
1. `proxy.ts` — decodes the session cookie and redirects non-admins at the edge before any page renders
2. `app/(admin)/layout.tsx` — client-side `useAuth()` guard as a fallback (renders null while hydrating, redirects if role ≠ admin)

---

## Route Structure

| Route | File | Type | Notes |
|-------|------|------|-------|
| `/admin` | `app/(admin)/admin/page.tsx` | Client | Overview cards |
| `/admin/users` | `app/(admin)/admin/users/page.tsx` | Client | User management |
| `/admin/settings` | `app/(admin)/admin/settings/page.tsx` | Client | App-wide defaults |
| `/admin/data` | `app/(admin)/admin/data/page.tsx` | Client | Data counts + reset |
| — | `app/(admin)/layout.tsx` | Client | Admin shell + auth guard |

---

## Data Model

### New type — `AppSettings`

```ts
// lib/dummy-users.ts (add alongside user helpers)
export type AppSettings = {
  defaultCurrency: string   // ISO 4217 — "AUD" default
  defaultTimezone: string   // e.g. "Australia/Brisbane"
  defaultThemeColor: string // color key — "indigo" default
}

export const APP_SETTINGS_KEY = "myhome-app-settings"

export const DEFAULT_APP_SETTINGS: AppSettings = {
  defaultCurrency: "AUD",
  defaultTimezone: "Australia/Brisbane",
  defaultThemeColor: "indigo",
}

export function getAppSettings(): AppSettings { ... }
export function saveAppSettings(s: AppSettings): void { ... }
```

### Mutations added to `lib/dummy-users.ts`

```ts
export function updateUserRole(userId: string, role: UserRole): void
// Updates role in localStorage for non-seed users; no-op for SEED_USER

export function deleteUser(userId: string): void
// Removes from localStorage; no-op for SEED_USER
```

### No new dummy-data.ts changes needed

Data reset operates on localStorage keys — no seed file changes required.

---

## Component Design

| Component | File | Type | Props |
|-----------|------|------|-------|
| `AdminLayout` | `app/(admin)/layout.tsx` | Client | children |
| `AdminHeader` | `components/admin/AdminHeader.tsx` | Client | `{ title: string }` |
| `AdminOverviewPage` | `app/(admin)/admin/page.tsx` | Client | — |
| `AdminUsersPage` | `app/(admin)/admin/users/page.tsx` | Client | — |
| `AdminSettingsPage` | `app/(admin)/admin/settings/page.tsx` | Client | — |
| `AdminDataPage` | `app/(admin)/admin/data/page.tsx` | Client | — |

### Component hierarchy

```
app/(admin)/layout.tsx          — auth guard + AdminHeader slot
  ├── AdminHeader               — back link + page title + user avatar
  └── page.tsx (per route)
        ├── /admin              — stat cards + section links
        ├── /admin/users        — user rows with role select + delete
        ├── /admin/settings     — form: currency / timezone / theme
        └── /admin/data         — group cards with counts + reset
```

---

## State Management

All state is local `useState` per page — no Context or TanStack Query needed.

**`/admin/users`:**
```ts
const [users, setUsers] = useState<DummyUser[]>([])
// initialised in useEffect: [SEED_USER, ...getRegisteredUsers()]
// updateUserRole / deleteUser write to localStorage then setUsers(updated)
```

**`/admin/settings`:**
```ts
const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS)
// initialised in useEffect: getAppSettings()
// on save: saveAppSettings(settings)
// retroactive currency patch: iterate localStorage user-group keys and update currency
```

**`/admin/data`:**
```ts
// Derives counts from importing all dummy-data arrays + reading localStorage
// Reset: clears all myhome-* localStorage keys for the target group,
//        then calls window.location.reload() so seed data re-hydrates cleanly
```

---

## Key UI Decisions

**Layout:** Floating header (same standard as dashboard header — `sticky top-0 px-3 pt-3 pb-1`, `rounded-2xl`, backdrop blur). No sidebar. Content area is `max-w-3xl mx-auto` — narrower than dashboard since these are simple data tables, not feature-rich pages.

**AdminHeader:** Left side — `← Back to app` link (routes to `/`). Centre — page title. Right — user avatar (read-only, no dropdown needed).

**`/admin` overview:** 3 stat cards (Total Users, By Role breakdown, Groups count) + 3 section link cards (Users / Settings / Data) with icon, title, description, and a `→` chevron.

**`/admin/users` rows:**
- Avatar initials + name + email + `createdAt` date
- Role: inline `<select>` for non-seed users; read-only pill for SEED_USER
- Delete: Trash2 button → inline "Delete? Yes / No" confirm (same pattern as rest of app); hidden for SEED_USER
- SEED_USER always listed first with a "Seed" badge

**`/admin/settings`:** Single card form — currency select, timezone select, theme color select (same 8 presets from `lib/theme-colors.ts`). Save button applies retroactively. No per-field save — single "Save changes" at the bottom.

**`/admin/data`:** One card per group. Each card shows: group name + icon, record counts table (Tasks, Shopping, Notes, Calendar, Expenses, Income, Budgets, Loans, Meals). "Reset group" button → inline confirm → full localStorage wipe for that group + `window.location.reload()`.

**Mobile:** All pages stack to single column. User rows wrap gracefully — name/email stack, role select and delete button stay in a row.

**Empty state:** `/admin/users` always has at least SEED_USER — no empty state needed. `/admin/data` always has seed groups — no empty state needed.

---

## shadcn/ui Components Needed

All already installed: `Card`, `CardContent`, `CardHeader`, `CardTitle`, `Button`, `Avatar`, `AvatarFallback`, `Separator`, `Badge`. No new installs required.

---

## Animations

- Page mount: `motion.div` `opacity 0→1, y 8→0`, `duration: 0.25, ease: easeOut` — same as login page
- Delete confirm replace: `AnimatePresence` on the action area (same inline confirm pattern used in TaskList, ShoppingList, etc.)
- Role change: no animation — immediate select update

---

## proxy.ts Changes

Add admin route guard before the existing session check:

```ts
import { decodeSession } from "@/lib/dummy-users"

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = request.cookies.get("myhome-session")

  // Admin gate — must be authenticated AND role === "admin"
  if (pathname.startsWith("/admin")) {
    if (!session) return NextResponse.redirect(new URL("/login", request.url))
    const payload = decodeSession(session.value)
    if (payload?.role !== "admin") return NextResponse.redirect(new URL("/", request.url))
    return NextResponse.next()
  }

  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  if (!session && !isPublic) return NextResponse.redirect(new URL("/login", request.url))
  if (session && isPublic) return NextResponse.redirect(new URL("/", request.url))
  return NextResponse.next()
}
```

## ProfileDropdown Changes

Add "Admin panel" link between "Edit profile" and the Settings section — only when `user.role === "admin"`:

```tsx
{user?.role === "admin" && (
  <button onClick={() => { router.push("/admin"); setOpen(false) }}
    className="mt-1 flex items-center gap-1 text-xs text-warning hover:text-warning/80 transition-colors">
    <ShieldCheck className="size-3" />
    Admin panel
  </button>
)}
```

---

## Acceptance Criteria Mapping

| Criterion | Implemented by |
|-----------|---------------|
| `/admin/*` redirects non-admins | `proxy.ts` + `app/(admin)/layout.tsx` guard |
| Admin layout, no sidebar | `app/(admin)/layout.tsx` + `AdminHeader` |
| Overview stats + section links | `app/(admin)/admin/page.tsx` |
| User list with role + created date | `app/(admin)/admin/users/page.tsx` |
| Role change for non-seed users | `updateUserRole()` + inline select |
| Delete non-seed user with confirm | `deleteUser()` + inline confirm |
| SEED_USER protected | `userId === SEED_USER.id` guards in all mutations |
| App settings form + retroactive patch | `app/(admin)/admin/settings/page.tsx` + `saveAppSettings()` |
| Per-group data counts + reset | `app/(admin)/admin/data/page.tsx` + localStorage wipe |
| Admin panel link in ProfileDropdown | `components/layout/ProfileDropdown.tsx` |
| Mobile responsive | All pages `max-w-3xl`, single-column stack |

---

## Files to Create

- `app/(admin)/layout.tsx`
- `app/(admin)/admin/page.tsx`
- `app/(admin)/admin/users/page.tsx`
- `app/(admin)/admin/settings/page.tsx`
- `app/(admin)/admin/data/page.tsx`
- `components/admin/AdminHeader.tsx`

## Files to Modify

- `proxy.ts` — add admin route guard
- `lib/dummy-users.ts` — add `AppSettings` type + helpers, `updateUserRole`, `deleteUser`
- `components/layout/ProfileDropdown.tsx` — add "Admin panel" link for admin users
