# Feature Design: Dummy Auth — Login & Registration

**Date:** 2026-04-11
**Status:** DRAFT
**Plan:** [01-plan.md](./01-plan.md)

---

## Architecture Overview

Auth sits outside the `(dashboard)` route group. `proxy.ts` (Next.js middleware) reads a plain cookie and redirects unauthenticated requests before any RSC renders. Client-side auth state is provided by `AuthProvider` (reads the same cookie via `document.cookie`) and consumed via `useAuth()`. No server actions needed — cookie is set/cleared from the browser in the login/register/logout handlers.

## Route Structure

| Route | File | Type | Notes |
|-------|------|------|-------|
| `/login` | `app/login/page.tsx` | Client | Auth form; redirects to `/` if already logged in |
| `/register` | `app/register/page.tsx` | Client | Auth form; redirects to `/` if already logged in |
| `proxy.ts` | `proxy.ts` (project root) | Middleware | Protects all non-public routes |

## Data Model

### New file: `lib/dummy-users.ts`

```ts
export type DummyUser = {
  id: string
  name: string
  email: string
  password: string  // plain text — dummy phase only, never do this in production
  createdAt: string
}

// Seeded user — always present
export const SEED_USER: DummyUser = {
  id: "user-1",
  name: "Manas",
  email: "demo@myhome.app",
  password: "demo1234",
  createdAt: "2024-01-01",
}
```

### Session cookie format

```ts
type SessionPayload = { userId: string; name: string; email: string }
// Cookie name: "myhome-session"
// Cookie value: btoa(JSON.stringify(payload))
// Not httpOnly — must be readable by both middleware and client JS
// Max-age: 7 days (604800s)
```

### `lib/dummy-users.ts` — runtime user store helpers

```ts
// Registered accounts stored in localStorage["myhome-registered-users"]
// as DummyUser[] (merged with SEED_USER at lookup time)
export function getRegisteredUsers(): DummyUser[]
export function registerUser(user: DummyUser): void
export function findUser(email: string, password: string): DummyUser | null
```

### `lib/dummy-data.ts` — Group type update

```ts
export type Group = {
  // ...existing fields...
  userId: string   // ← new — which user owns this group
}
// All existing group entries get userId: "user-1"
```

## Component Design

| Component | File | Type | Props |
|-----------|------|------|-------|
| `AuthProvider` | `components/providers/AuthProvider.tsx` | Client | `{ children }` |
| `LoginPage` | `app/login/page.tsx` | Client | — |
| `RegisterPage` | `app/register/page.tsx` | Client | — |

### Component hierarchy

```
app/layout.tsx (RSC)
  └── AuthProvider (Client) ← new, wraps everything
        └── ThemeProvider
              └── ThemeColorProvider
                    └── {children}

app/login/page.tsx (Client) — standalone, no dashboard shell
app/register/page.tsx (Client) — standalone, no dashboard shell
```

### `AuthProvider` / `useAuth()`

```ts
interface AuthContextValue {
  user: SessionPayload | null  // null = not logged in
  logout: () => void           // clears cookie, router.push("/login")
}
export function useAuth(): AuthContextValue
```

- Reads `myhome-session` cookie via `document.cookie` in `useEffect` (avoids SSR mismatch)
- `user` is `null` until hydrated — components should handle this gracefully
- `logout()` clears cookie + navigates to `/login`

## proxy.ts (middleware)

```ts
// proxy.ts — project root
import { NextRequest, NextResponse } from "next/server"

const PUBLIC_PATHS = ["/login", "/register"]

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = request.cookies.get("myhome-session")
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))

  if (!session && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url))
  }
  if (session && isPublic) {
    return NextResponse.redirect(new URL("/", request.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|public/).*)"],
}
```

Note: Next.js expects middleware in `middleware.ts`. We create `proxy.ts` with the logic and re-export from `middleware.ts`:
```ts
// middleware.ts
export { default, config } from "./proxy"
```

## Login Page UI

- Full-screen centered layout (`min-h-screen flex items-center justify-center`)
- App logo + "MyHome" wordmark above the card
- `Card` with `p-8`, `w-full max-w-sm`
- Fields: email (type=email), password (type=password)
- Inline error message below fields (`text-destructive text-sm`) — no toast
- "Sign in" primary button, full width
- "Don't have an account? Register" link below card → `/register`
- On success: `document.cookie = "myhome-session=..."` then `router.push("/")`

## Register Page UI

- Same layout as login
- Fields: Name, Email, Password, Confirm Password
- Validates: passwords match, email not already registered
- On success: creates account in localStorage + sets cookie + `router.push("/")`
- "Already have an account? Sign in" link → `/login`

## State Management

- Login/Register forms: plain `useState` (no React Hook Form — forms are simple enough)
- Auth state: `AuthProvider` context, initialized from cookie in `useEffect`
- `GroupProvider` updated to filter groups by `useAuth().user?.userId` — only show groups belonging to the logged-in user

## Key UI Decisions

- **No sidebar/header on auth pages** — standalone layout, dark bg gradient subtle
- **No page-level loading state** — cookie read is synchronous after hydration
- **Error state** — inline text below the form, not a toast
- **Password field** — standard `type="password"`, no show/hide toggle (keep it simple)

## shadcn/ui Components Needed

None new — uses existing `Card`, `Button`, `Input` patterns (raw inputs to match existing form style).

## Animations

- Auth card: `motion.div` fade + slide up on mount (`opacity: 0→1, y: 16→0, duration: 0.3`)
- Error message: `AnimatePresence` fade in (`opacity: 0→1, duration: 0.15`)

## Acceptance Criteria Mapping

| Criterion | Implemented by |
|-----------|---------------|
| Login with seeded credentials → `/` | `app/login/page.tsx` + cookie |
| Register → account created → `/` | `app/register/page.tsx` + localStorage |
| Wrong credentials → inline error | `app/login/page.tsx` |
| Unauthenticated → `/login` | `proxy.ts` |
| Logged-in visiting `/login` → `/` | `proxy.ts` |
| Sign out clears cookie → `/login` | `AuthProvider.logout()` + `ProfileDropdown` |
| `Group.userId` on all groups | `lib/dummy-data.ts` |
| `useAuth()` returns user | `AuthProvider` |
| Profile page uses auth context | `app/(dashboard)/settings/profile/page.tsx` |

## Files to Create

- `proxy.ts` — middleware logic
- `middleware.ts` — re-exports proxy
- `lib/dummy-users.ts` — DummyUser type + helpers
- `components/providers/AuthProvider.tsx`
- `app/login/page.tsx`
- `app/register/page.tsx`

## Files to Modify

- `lib/dummy-data.ts` — add `userId` to `Group` type + all group entries
- `app/layout.tsx` — wrap with `AuthProvider`
- `app/(dashboard)/layout.tsx` — pass userId from auth to `GroupProvider`
- `components/providers/GroupProvider.tsx` — filter groups by userId
- `components/layout/ProfileDropdown.tsx` — wire sign out + read name/email from `useAuth()`
- `app/(dashboard)/settings/profile/page.tsx` — read from `useAuth()` instead of `userProfile`
