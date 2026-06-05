# Build Log: Registration Approval Flow

**Date:** 2026-04-25
**Status:** COMPLETE
**Design:** [02-design.md](./02-design.md)

---

## Changes Made

### `lib/dummy-users.ts`
- Added `UserStatus = "pending" | "active" | "rejected"` type
- Added `status: UserStatus` field to `DummyUser`
- Added `status: "active"` to `SEED_USER`
- `getRegisteredUsers()` — normalises missing `status` at read time via `{ ...u, status: u.status ?? "active" }` so existing localStorage data isn't affected
- `findUser()` — gated to `status === "active"` only
- Added `findUserByEmailAny()` — finds a user by email regardless of status (used by login for specific error messages)
- Added `approveUser(userId)` — sets `status: "active"`, no-op for SEED_USER
- Added `rejectUser(userId)` — sets `status: "rejected"`, no-op for SEED_USER

### `app/register/page.tsx`
- Removed unused `useRouter` / `useAuth` imports
- Added `submitted: boolean` state
- Registration now saves with `status: "pending"` and sets `submitted = true` instead of auto-logging in
- When `submitted === true`, renders a pending screen: Clock icon (warning colour), "Request submitted" heading, descriptive message, "Back to sign in" link

### `app/login/page.tsx`
- Imported `findUserByEmailAny`
- `handleSubmit` now distinguishes between pending/rejected/wrong-credentials before showing error

### `app/(admin)/admin/users/page.tsx`
- Imported `approveUser`, `rejectUser`, `CheckCircle`, `XCircle`
- Extracted `refresh()` helper to reduce duplication
- Added `rejectId` state for inline reject confirm
- Derived `pendingUsers` / `activeUsers` from `users` state
- Added `handleApprove` and `handleReject` handlers
- Added **Pending Requests** card (only renders when `pendingUsers.length > 0`) with Approve button and Reject with AnimatePresence inline confirm
- All Users card now uses `activeUsers` and shows a "Rejected" badge for rejected users

### `app/(admin)/admin/page.tsx`
- Imported `Clock`
- Derived `pendingCount` from users state
- Added conditional Pending stat card (full-width, warning colour) when `pendingCount > 0`
- Added pending badge on the Users section link card when `pendingCount > 0`

---

## TypeScript
`npx tsc --noEmit` — no errors.

## Files Modified (5 total, 0 created)
- `lib/dummy-users.ts`
- `app/register/page.tsx`
- `app/login/page.tsx`
- `app/(admin)/admin/users/page.tsx`
- `app/(admin)/admin/page.tsx`
