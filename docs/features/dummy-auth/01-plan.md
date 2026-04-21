# Feature Plan: Dummy Auth — Login & Registration

**Date:** 2026-04-11
**Status:** DRAFT
**Feature slug:** dummy-auth

---

## Problem Statement

The app currently has no login or registration. Anyone who opens the URL sees the full dashboard with hardcoded data. There is no concept of "who is using this" — data is not associated with a specific user. Before real Auth.js/Postgres auth is wired up, we need a believable dummy auth flow that simulates login/registration so the UI is complete and user-data association is established in the data model.

## Proposed Solution

Add login and registration pages that accept an email and password. Credentials are checked against a seeded dummy user (and any accounts registered in that browser session). A session cookie is set on success, which route-protection middleware reads to guard the dashboard. All household groups carry a `userId` field so data is transitively scoped to the logged-in user. Signing out clears the cookie and redirects to `/login`.

## User Stories

- As a new user, I want to register with a name, email, and password so I get my own account.
- As a returning user, I want to log in with email and password so I reach my dashboard.
- As a logged-in user, I want to sign out from the profile dropdown so my session ends.
- As an unauthenticated visitor, I want to be redirected to `/login` so I can't access private data.

## Acceptance Criteria

- [ ] `/login` page renders with email + password fields; submitting with the seeded credentials redirects to `/`.
- [ ] `/register` page renders with name + email + password fields; submitting creates an account and redirects to `/`.
- [ ] Submitting with wrong credentials shows an inline error; form never hard-reloads.
- [ ] All dashboard routes (`/`, `/finance/*`, `/tasks`, `/shopping`, `/calendar`, `/notes`, `/meals`, `/settings/*`) redirect to `/login` when no session cookie is present.
- [ ] `/login` and `/register` redirect to `/` when a session cookie is already present.
- [ ] "Sign out" in the profile dropdown clears the cookie and navigates to `/login`.
- [ ] `Group` type carries `userId: string`; all existing dummy groups are assigned `userId: "user-1"`.
- [ ] `AuthProvider` exposes `useAuth()` returning `{ user: DummyUser | null, logout() }`.
- [ ] Profile page reads name/email from auth context (not hardcoded `userProfile`).

## Out of Scope

- Real database persistence — registered accounts live in `localStorage` only.
- Password hashing — plain text is fine for dummy phase (noted in code comments).
- Email verification, forgot password, OAuth providers.
- Per-user data isolation for data other than groups (tasks, expenses, etc. remain group-scoped as today).
- Migrating `userProfile` import in GlobalSearch and ProfileDropdown to `useAuth()` — kept as a follow-up.

## Technical Approach

| Concern | Solution |
|---|---|
| Session storage | Cookie `myhome-session` = base64(JSON `{ userId, name, email }`) |
| Route protection | `proxy.ts` at project root — reads cookie, redirects unauthenticated requests |
| Dummy users | Seeded in `lib/dummy-users.ts`; registered users stored in `localStorage["myhome-users"]` |
| Auth state (client) | `AuthProvider` in `components/providers/AuthProvider.tsx`; parses cookie on mount |
| Login/Register pages | `app/login/page.tsx`, `app/register/page.tsx` — outside `(dashboard)` route group |
| Sign out | Server Action `actions/auth.ts` — deletes cookie, redirects to `/login` |
| `Group.userId` | Added to type + all dummy group entries |

## Risks & Open Questions

- Cookie parsing in `proxy.ts` must be done without `document` (server context) — use `request.cookies.get()`.
- `AuthProvider` reads the same cookie client-side via `document.cookie` to avoid an extra fetch.
- Registered accounts stored in `localStorage` will be lost on browser clear — acceptable for dummy phase.

## Complexity Estimate

- [x] Medium — 1–2 days
