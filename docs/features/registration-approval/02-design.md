# Feature Design: Registration Approval Flow

**Date:** 2026-04-25
**Status:** APPROVED
**Plan:** [01-plan.md](./01-plan.md)

---

## Architecture Overview

All changes are additive to the existing dummy-auth system. No new routes, no new components — only targeted changes to five existing files.

The approval state lives in `DummyUser.status`. `getRegisteredUsers()` normalises missing `status` at read time so existing localStorage data isn't affected. All approval mutations follow the same pattern as `updateUserRole` / `deleteUser`.

---

## Data Model Changes

### `lib/dummy-users.ts`

**`DummyUser` type** — add `status`:
```ts
export type UserStatus = "pending" | "active" | "rejected"

export type DummyUser = {
  id: string
  name: string
  email: string
  password: string
  role: UserRole
  status: UserStatus   // NEW — "active" for SEED_USER and existing users
  createdAt: string
}
```

**`SEED_USER`** — add `status: "active"`.

**`getRegisteredUsers()`** — normalise at read time:
```ts
return raw ? (JSON.parse(raw) as DummyUser[]).map(u => ({ status: "active" as UserStatus, ...u })) : []
```
The spread order means `status: "active"` is overridden by any saved `status` value — existing users get `"active"`, new pending users keep their saved `"pending"`.

**`registerUser()`** — callers pass the full `DummyUser` now including `status: "pending"`. No change to function signature.

**`findUser()`** — only returns users with `status: "active"`:
```ts
return all.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password && u.status === "active") ?? null
```

**New: `findUserByEmailAny()`** — same as `findUserByEmail` but ignores status. Used by login to distinguish "wrong password" from "account pending/rejected":
```ts
export function findUserByEmailAny(email: string): DummyUser | null
```

**New: `approveUser(userId)`** — sets `status: "active"`:
```ts
export function approveUser(userId: string): void
```

**New: `rejectUser(userId)`** — sets `status: "rejected"`:
```ts
export function rejectUser(userId: string): void
```

---

## Component Changes

### `app/register/page.tsx`

Add `submitted: boolean` state. On successful `registerUser` call, set `submitted = true` instead of calling `setUser` + `router.push`.

**Pending state screen** (replaces form when `submitted === true`):
```
[Clock icon — size-12, text-warning, bg-warning/10 rounded-2xl]
Request submitted
Your account is pending admin approval.
You'll be able to sign in once an admin approves your request.
[Back to login → /login]
```

**Registration now saves with `status: "pending"`:**
```ts
const newUser: DummyUser = {
  ...
  status: "pending",
}
registerUser(newUser)
setSubmitted(true)   // no setUser, no router.push
```

---

### `app/login/page.tsx`

Update `handleSubmit` to check status before showing generic error:

```ts
const user = findUser(email, password)  // only returns active users
if (!user) {
  // Check if the account exists with a different status
  const anyUser = findUserByEmailAny(email)
  if (anyUser?.status === "pending") {
    setError("Your account is awaiting admin approval.")
  } else if (anyUser?.status === "rejected") {
    setError("Your account request was not approved. Contact the admin.")
  } else {
    setError("Invalid email or password.")
  }
  return
}
```

---

### `app/(admin)/admin/users/page.tsx`

**State additions:**
```ts
const [rejectId, setRejectId] = useState<string | null>(null)
```

**Derived lists** (computed from `users` state):
```ts
const pendingUsers = users.filter(u => u.status === "pending")
const activeUsers  = users.filter(u => u.status !== "pending")
```

**New handlers:**
```ts
function handleApprove(userId: string) {
  approveUser(userId)
  setUsers([SEED_USER, ...getRegisteredUsers()])
}

function handleReject(userId: string) {
  rejectUser(userId)
  setRejectId(null)
  setUsers([SEED_USER, ...getRegisteredUsers()])
}
```

**Layout:**

When `pendingUsers.length > 0`, render a **Pending Requests** card above the existing All Users card:

```
Card — "Pending requests (N)"
  Each row:
    Avatar initials | Name + email + "Joined date" | [Approve btn] [Reject btn with confirm]
```

- Approve button: `bg-success/10 text-success hover:bg-success/20` — text "Approve", CheckCircle icon
- Reject button: Trash2 icon, `text-muted-foreground hover:text-destructive hover:bg-destructive/10`
- Reject uses same inline AnimatePresence confirm pattern ("Reject? Yes / No")

Existing user rows in the All Users card now also show a status badge for rejected users:
- `status === "rejected"` → small `bg-destructive/10 text-destructive` badge "Rejected" next to name

---

### `app/(admin)/admin/page.tsx`

Add a **Pending** stat card when `pendingCount > 0`. Insert between Total Users and Admins in the grid, or replace the 4-card grid with a conditional 5th slot.

Simplest approach: derive `pendingCount` and render a badge on the Users section link card:

```ts
const pendingCount = users.filter(u => u.status === "pending").length
```

Add a count badge to the Users section card when `pendingCount > 0`:
```tsx
{pendingCount > 0 && (
  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-warning/10 text-warning shrink-0">
    {pendingCount} pending
  </span>
)}
```

Also add a Pending stat to the stats grid (5th card, full width on mobile, fits in 3-col on sm+):
```
[Total] [Admins] [Managers] [Members] [Pending — warning colour]
```

---

## Files to Modify

| File | What changes |
|------|-------------|
| `lib/dummy-users.ts` | Add `UserStatus`, `status` to `DummyUser`, update `SEED_USER`, normalise in `getRegisteredUsers`, gate `findUser`, add `findUserByEmailAny`, `approveUser`, `rejectUser` |
| `app/register/page.tsx` | Save with `status: "pending"`, replace form with pending screen on success |
| `app/login/page.tsx` | Status-aware error messages using `findUserByEmailAny` |
| `app/(admin)/admin/users/page.tsx` | Pending Requests card + approve/reject actions |
| `app/(admin)/admin/page.tsx` | Pending count badge on Users card + Pending stat |

## Files to Create

None.

---

## Acceptance Criteria Mapping

| Criterion | Implemented by |
|-----------|---------------|
| `DummyUser.status` field | `lib/dummy-users.ts` — type + SEED_USER update |
| Existing users default to active | `getRegisteredUsers()` normalise at read time |
| New registrations → pending | `register/page.tsx` passes `status: "pending"` |
| Login blocked for non-active | `findUser()` status gate |
| Pending/rejected login messages | `login/page.tsx` + `findUserByEmailAny` |
| Register pending screen | `register/page.tsx` submitted state |
| Pending section in admin/users | New card + approve/reject handlers |
| Pending badge on admin overview | `admin/page.tsx` pending count |
| Reject with confirm | AnimatePresence inline confirm in users page |
| Mobile responsive | All changes follow existing patterns — no layout overhaul needed |
