# Feature Design: Auth.js v5 Migration

**Date:** 2026-06-04
**Status:** DRAFT
**Plan:** [01-plan.md](./01-plan.md)

---

## Architecture Overview

Replace the custom `jose` JWT + manual cookie layer with Auth.js v5 (next-auth@beta). Strategy: **CredentialsProvider + JWT sessions** — no DB session tables needed, no Prisma adapter, no schema changes.

Auth.js owns the session cookie (`authjs.session-token`), the JWT signing, and the middleware token verification. We keep bcryptjs for password hashing. Custom status-checking logic (pending/rejected) stays in a server action wrapper used only by the login page.

## Package Changes

```bash
npm install next-auth@beta
npm uninstall jose           # only used for auth JWT — Auth.js handles this internally
# keep: bcryptjs (still used in authorize() and registerAction)
```

## New Files

### `auth.ts` (project root)

Central Auth.js config. Exports `handlers`, `auth`, `signIn`, `signOut`.

```ts
import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db/prisma"
import type { UserRole } from "@/lib/session"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const { email, password } = credentials as { email: string; password: string }
        const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
        if (!user || user.status !== "active") return null
        const isPlaintext = !((user.password ?? "").startsWith("$2"))
        const valid = isPlaintext
          ? user.password === password
          : await bcrypt.compare(password, user.password ?? "")
        if (!valid) return null
        // Re-hash legacy plaintext passwords
        if (isPlaintext) {
          await prisma.user.update({ where: { id: user.id }, data: { password: await bcrypt.hash(password, 12) } })
        }
        return { id: user.id, name: user.name, email: user.email, role: user.role as UserRole }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) token.role = (user as { role: UserRole }).role
      return token
    },
    session({ session, token }) {
      session.user.id = token.sub!
      session.user.role = token.role as UserRole
      return session
    },
  },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 7 },
  pages: { signIn: "/login" },
})
```

### `app/api/auth/[...nextauth]/route.ts`

```ts
import { handlers } from "@/auth"
export const { GET, POST } = handlers
```

### `types/next-auth.d.ts`

Type augmentation so `session.user.id` and `session.user.role` are fully typed everywhere.

```ts
import type { DefaultSession } from "next-auth"
import type { UserRole } from "@/lib/session"

declare module "next-auth" {
  interface Session {
    user: { id: string; role: UserRole } & DefaultSession["user"]
  }
  interface User {
    role: UserRole
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole
  }
}
```

## Modified Files

### `proxy.ts`

Wrap Auth.js `auth()` middleware. Keep domain check and admin gate. `req.auth` carries the session.

```ts
import { auth } from "@/auth"
import { NextResponse } from "next/server"

const ALLOWED_DOMAIN = process.env.ALLOWED_DOMAIN

export default auth((req) => {
  if (ALLOWED_DOMAIN) {
    const hostname = (req.headers.get("host") ?? "").split(":")[0]
    if (hostname !== ALLOWED_DOMAIN && !hostname.endsWith(`.${ALLOWED_DOMAIN}`)) {
      return new NextResponse("Not found", { status: 404 })
    }
  }

  const { pathname } = req.nextUrl
  const session = req.auth

  if (pathname.startsWith("/admin")) {
    if (!session) return NextResponse.redirect(new URL("/login", req.url))
    if (session.user.role !== "admin") return NextResponse.redirect(new URL("/", req.url))
    return NextResponse.next()
  }

  const isPublic = pathname.startsWith("/login") || pathname.startsWith("/register")

  if (!session && !isPublic) return NextResponse.redirect(new URL("/login", req.url))
  if (session && isPublic) return NextResponse.redirect(new URL("/", req.url))

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|public/).*)"],
}
```

### `lib/session.ts`

Remove all JWT signing/verification and session types (moved to `auth.ts` + `types/next-auth.d.ts`). Keep only `AppSettings` and its utilities. Keep `UserRole` and `UserStatus` exports since they're used across the app.

**Exports to keep:** `UserRole`, `UserStatus`, `AppSettings`, `APP_SETTINGS_KEY`, `DEFAULT_APP_SETTINGS`, `getAppSettings()`, `saveAppSettings()`

**Exports to remove:** `SessionPayload`, `SESSION_COOKIE`, `SESSION_MAX_AGE`, `signSession()`, `verifySession()`

### `lib/actions/auth.ts`

Remove `loginAction`, `logoutAction`, `setSessionCookie`. Add `getLoginBlockReason` for status-specific errors on the login page.

**Keep:** `registerAction`, `getUsers`, `approveUser`, `rejectUser`, `updateUserRole`, `deleteUser`

**Remove:** `loginAction`, `logoutAction`, `setSessionCookie`, imports of `signSession`/`SESSION_COOKIE`/`SESSION_MAX_AGE`/`SessionPayload`

**Add:**
```ts
export async function getLoginBlockReason(email: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
  if (!user) return null
  if (user.status === "pending") return "Your account is awaiting admin approval."
  if (user.status === "rejected") return "Your account request was not approved. Contact the admin."
  return null
}
```

### `components/providers/AuthProvider.tsx`

Replace with a thin `useAuth()` shim over `useSession()`. Keeps API surface familiar; removes `setUser` (no longer needed — Auth.js session refreshes automatically).

```tsx
"use client"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import type { UserRole } from "@/lib/session"

export type AuthUser = {
  id: string
  name: string
  email: string
  role: UserRole
}

export function useAuth() {
  const { data: session } = useSession()
  const router = useRouter()
  const user: AuthUser | null = session?.user
    ? { id: session.user.id, name: session.user.name ?? "", email: session.user.email ?? "", role: session.user.role }
    : null
  return {
    user,
    logout: () => signOut({ callbackUrl: "/login" }),
  }
}
```

No `AuthProvider` wrapper needed — `SessionProvider` from Auth.js handles this.

### `app/layout.tsx`

Replace `<AuthProvider>` with `<SessionProvider>` from `next-auth/react`.

```tsx
import { SessionProvider } from "next-auth/react"
// Remove: import { AuthProvider } from "@/components/providers/AuthProvider"

// In JSX:
<SessionProvider>
  <ThemeProvider>
    <ThemeColorProvider>
      {children}
    </ThemeColorProvider>
  </ThemeProvider>
</SessionProvider>
```

### `app/login/page.tsx`

Replace `loginAction` + `setUser` with `getLoginBlockReason` + `signIn("credentials")` from `next-auth/react`.

```tsx
const result = await getLoginBlockReason(email)
if (result) { setError(result); return }

const res = await signIn("credentials", { email, password, redirect: false })
if (res?.error) { setError("Invalid email or password."); return }
router.push("/")
```

Remove: `setUser` call, `useAuth` import.

### Consumers of `useAuth()` — field rename only

`user.userId` → `user.id` in all consumers. `logout()` API unchanged. `setUser` callers: only `app/login/page.tsx` (handled above).

| File | Change |
|------|--------|
| `components/providers/GroupProvider.tsx` | `user.userId` → `user.id` |
| `components/layout/ProfileDropdown.tsx` | `logout()` signature unchanged; verify field names |
| `app/(admin)/layout.tsx` | `user.role` unchanged |
| `app/(dashboard)/settings/page.tsx` | Audit for `userId`/`setUser` |
| `app/(dashboard)/settings/profile/page.tsx` | Audit for `userId`/`setUser` |
| `components/settings/EventsManager.tsx` | Audit for `userId`/`setUser` |
| `components/settings/GroupsManager.tsx` | Audit for `userId`/`setUser` |
| `app/(admin)/admin/data/page.tsx` | Audit for `userId`/`setUser` |

## Deleted Files

- `app/api/auth/me/route.ts` — Auth.js exposes session via `auth()` server-side and `useSession()` client-side

## Environment Variables

| Var | Notes |
|-----|-------|
| `AUTH_SECRET` | Auth.js v5 uses `AUTH_SECRET` (not `SESSION_SECRET`). Generate with `npx auth secret`. Must be set in `.env.local` and Vercel. |
| `SESSION_SECRET` | Can be removed after migration. |

Auth.js v5 automatically reads `AUTH_SECRET`. No manual JWT signing config needed.

## CLAUDE.md Updates

Update the Auth section to reflect:
- Session cookie name: `authjs.session-token` (set by Auth.js)
- Secret: `AUTH_SECRET` env var
- Session functions: `auth()` from `@/auth` server-side, `useSession()` from `next-auth/react` client-side
- No manual `signSession`/`verifySession`
- `useAuth()` shim in `AuthProvider.tsx` still available; returns `{ user: AuthUser | null, logout }`
- `user.id` (not `userId`)

## Acceptance Criteria Mapping

| Criterion | Implemented by |
|-----------|----------------|
| Login → session + redirect | `auth.ts` authorize + `app/login/page.tsx` signIn call |
| Pending account → specific error | `getLoginBlockReason()` in login page |
| Rejected account → specific error | `getLoginBlockReason()` in login page |
| Wrong password → generic error | `signIn` returns `error` |
| Register → pending, no session | `registerAction()` unchanged |
| Logout → clear + redirect | `signOut({ callbackUrl: "/login" })` in `useAuth()` |
| Unauthenticated → redirect `/login` | `proxy.ts` Auth.js middleware |
| Authenticated on public → redirect `/` | `proxy.ts` Auth.js middleware |
| Admin gate | `proxy.ts` `session.user.role !== "admin"` |
| `user.id/name/email/role` available | `types/next-auth.d.ts` augmentation |
| GroupProvider gets `userId` | `user.id` field in `useAuth()` shim |
| 7-day session | `session: { maxAge: 604800 }` in `auth.ts` |
