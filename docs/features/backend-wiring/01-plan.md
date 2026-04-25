# Feature Plan: Backend Wiring — Replace Dummy Data with Database

**Date:** 2026-04-25
**Status:** DRAFT
**Feature slug:** backend-wiring

---

## Problem Statement

All app data currently lives in two places that are never persisted to the database:

- **`lib/dummy-data.ts`** — static arrays imported at module level. Creating/editing/deleting in the UI only updates in-memory `useState` — a page refresh resets everything.
- **`lib/dummy-users.ts`** — user accounts stored in `localStorage`. Registered users, roles, and approval status exist only in that browser.

The PostgreSQL database is running, the Prisma schema covers every model, and the migration has been applied. The data layer needs to be wired up.

---

## Proposed Solution

A phased migration across five stages:

### Phase 1 — Schema patches + seed
- Add `status` field to Prisma `User` model (needed for the registration approval flow just built)
- Write `prisma/seed.ts` that inserts the seed user + all current dummy data
- Run `prisma db seed` to populate the DB

### Phase 2 — Auth migration
- Replace `localStorage`-based user storage in `dummy-users.ts` with Prisma DB calls
- Keep the existing cookie session format — `{ userId, name, email, role }` — unchanged
- `proxy.ts`, `AuthProvider`, login/register pages stay structurally the same; underlying calls go to DB

### Phase 3 — Server Actions
- Create `lib/actions/` with one file per domain:
  `auth.ts`, `groups.ts`, `events.ts`, `tasks.ts`, `shopping.ts`, `notes.ts`, `calendar.ts`, `finance.ts` (budgets/expenses/income/loans), `meals.ts`
- Each action is `"use server"`, calls Prisma, serializes dates to strings, returns `{ success, data?, error? }`

### Phase 4 — Wire components
- `GroupProvider` — loads groups + events from DB on mount (server action), keeps only `activeGroupId` in localStorage
- Each Section component — replaces dummy import + `useEffect` initialization with TanStack Query (`useQuery` + `useMutation`)
- Dashboard widgets — same pattern: initial data from server action, no localStorage

### Phase 5 — Clean up
- Delete all data arrays from `lib/dummy-data.ts` (keep type definitions, move to `lib/types.ts`)
- Delete `lib/dummy-users.ts` user/auth functions (keep type exports for the session payload that proxy.ts uses)
- Update CLAUDE.md to reflect the new "real data" phase

---

## Key Decisions

**Auth.js?** — Not in this pass. We keep the same cookie session format. Auth.js v5 is a separate planned phase. This migration makes the auth layer DB-backed without introducing Auth.js complexity.

**Type definitions** — Types in `dummy-data.ts` (`Task`, `Expense`, `Group`, etc.) are string-date shapes used throughout the app. Server actions will serialize Prisma `Date` fields to `YYYY-MM-DD` strings before returning, so existing component types remain valid. Types move to `lib/types.ts` once the data arrays are deleted.

**Recipes** — Currently unscoped (no `groupId`, no `userId`). Keep unscoped — recipes are shared across all groups per the existing design.

**Group active state** — Only the `activeGroupId` and `activeEventId` stay in localStorage. The `groups` and `events` arrays come from the DB.

**`stats`, `spendingByCategory`, `monthlyTrend`** — These are derived dashboard stats currently hardcoded. They will be computed from the real expense/income data instead of imported from dummy-data.ts.

---

## User Stories

- As a user, I want my data to persist when I refresh the page
- As a user, I want data I create on one device to appear on another
- As an admin, I want to see real registered users in the admin panel, not just localStorage entries

---

## Acceptance Criteria

- [ ] `prisma db seed` populates the DB with the seed user (demo@myhome.app) and all current dummy data
- [ ] Login/register/approval flow reads and writes to Postgres, not localStorage
- [ ] All CRUD operations (create, edit, delete) across all 8 feature domains persist to the DB
- [ ] Page refresh does not reset any data
- [ ] `GroupProvider` loads groups and events from DB; switching groups still works
- [ ] Global search queries DB-backed data
- [ ] Admin panel shows real DB users
- [ ] `lib/dummy-data.ts` contains only type definitions (no data arrays)
- [ ] `lib/dummy-users.ts` contains only session types (no localStorage-based functions)
- [ ] No TypeScript errors

## Out of Scope

- Auth.js v5 / NextAuth — separate phase
- Real-time updates / WebSockets
- Multi-user collaboration (data is still per-user via groupId)
- Email notifications
- File uploads (Vercel Blob)
- Production deployment changes

---

## Risks & Open Questions

- **`PrismaPg` adapter vs standard `PrismaClient`**: `lib/db/prisma.ts` uses `PrismaPg` (connection pool adapter). Confirm this works from Server Actions in Next.js 16 App Router — it should, but worth verifying in Phase 3.
- **Date serialization**: Prisma returns `Date` objects. Server actions must consistently serialize to `YYYY-MM-DD` strings before returning to client components. A `toDateStr(d: Date)` helper in `lib/utils.ts` will centralise this.
- **`DayMeals` unique constraint**: `@@unique([groupId, eventId, day])` — when `eventId` is null, Postgres treats each null as distinct. This means multiple "Mon" rows with `eventId = null` for the same group could exist. Upsert logic needs to explicitly handle `eventId: null` vs `eventId: <string>`.
- **Seed idempotency**: Running seed twice would create duplicate data. Use `upsert` with the seed IDs to make it safe to re-run.

---

## Complexity Estimate

- [ ] Small — < half a day
- [ ] Medium — 1–2 days
- [x] Large — 3+ days
