# Feature Plan: Auth.js v5 Migration

**Date:** 2026-06-04
**Status:** APPROVED
**Feature slug:** authjs-v5

---

## Problem Statement

Authentication is currently implemented as a custom JWT system (jose + bcryptjs + manual cookie management). It works but duplicates logic that Auth.js already provides — session signing, cookie hygiene, middleware integration — and leaves us responsible for maintaining that surface. The CLAUDE.md tech stack lists Auth.js v5 as the intended solution; this migration delivers on that.

## Proposed Solution

Replace the custom JWT/cookie auth layer with Auth.js v5 (next-auth@5 beta) using a CredentialsProvider and JWT session strategy. The user-facing experience is identical — email/password login, pending-approval flow for new registrations, role-based route protection. The change is entirely internal: Auth.js owns the session cookie, the middleware token verification, and the client session hook.

## User Stories

- As a user, I want to log in with email and password and be taken to the dashboard.
- As a new registrant, I want to see a "pending approval" message after registering, and be blocked from logging in until an admin approves my account.
- As an admin, I want protected `/admin` routes to be inaccessible to non-admin users.
- As a logged-in user, I want my session to persist for 7 days and be cleared on logout.

## Acceptance Criteria

- [ ] Login with valid credentials + active status → session cookie set, redirect to `/`
- [ ] Login with pending account → error "awaiting admin approval"
- [ ] Login with rejected account → error "request not approved"
- [ ] Login with wrong password → error "invalid email or password"
- [ ] Register → status `pending`, no session set, approval message shown
- [ ] Logout → session cookie cleared, redirect to `/login`
- [ ] Unauthenticated request to protected route → redirect to `/login`
- [ ] Authenticated user on `/login` or `/register` → redirect to `/`
- [ ] Admin on `/admin/*` → allowed
- [ ] Non-admin on `/admin/*` → redirect to `/`
- [ ] `user.id`, `user.name`, `user.email`, `user.role` available via `useSession()` everywhere
- [ ] GroupProvider continues to receive `userId` without change
- [ ] ProfileDropdown continues to show name, email, role pill, and logout
- [ ] Session is valid for 7 days

## Out of Scope

- OAuth / social login providers
- Magic link / email login
- Auth.js Prisma adapter (we use JWT strategy — no additional DB tables needed)
- `next-auth` account/session DB tables
- Email verification flow

## Risks & Open Questions

- **Next.js 16 proxy.ts compatibility**: ~~Resolved~~ — Auth.js `auth()` is a standard Next.js middleware function. Next.js 16 uses `proxy.ts` instead of `middleware.ts` by convention; the function works identically regardless of filename.
- **CredentialsProvider + JWT**: Auth.js strongly discourages CredentialsProvider with database sessions. JWT strategy is the correct pairing here — confirm this works with our approval-gating logic.
- **Session shape change**: Current `useAuth()` returns `{ userId, name, email, role }`. Auth.js `useSession()` returns `{ data: { user: { id, name, email, role } }, status }`. Every consumer of `useAuth()` needs updating (GroupProvider, ProfileDropdown, admin layout, settings pages).
- **`setUser()` call after login**: The login page currently calls `setUser()` to update client state immediately after the server action. With Auth.js, `signIn()` handles this — need to verify client state updates without explicit `setUser()`.

## Complexity Estimate

- [x] Medium — 1–2 days
