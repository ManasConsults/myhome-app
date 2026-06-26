# Feature Design: Event Sharing (Event Members)

**Date:** 2026-06-06
**Status:** DRAFT
**Plan:** [01-plan.md](./01-plan.md)

---

## Architecture Overview

Event sharing is a cross-cutting concern that touches the data layer, auth, all six data domains, and multiple UI surfaces. No new routes are needed. Changes are vertical slices through each layer:

1. **Schema** — new `EventMember` join table; `createdBy` nullable FK added to all 7 event-scoped data models
2. **Auth guard** — new `requireEventMember(eventId)` alongside the existing `requireGroupOwner`
3. **Server actions** — dual-path: group-owned path unchanged; event-member path added alongside
4. **GroupProvider** — extended with `sharedEvents`, `isSharedEvent`, `activeEventGroupId`
5. **Settings UI** — EventsManager gets a per-event Members panel (owner-only) and a "Shared with me" section (guest view)
6. **Feature Sections** — each `*Section` component gains a dual data-loading path and a `SharedEventBanner` when a shared event is active

RSC/client split is unchanged: all data fetching stays in Server Actions called by TanStack Query in client Section components.

---

## Route Structure

No new routes. All changes are within existing pages.

| Page | Change |
|------|--------|
| `app/(dashboard)/settings/events/page.tsx` | Passes through — no change |
| `components/settings/EventsManager.tsx` | Members panel + shared events section |
| `app/(dashboard)/finance/*` | Section component updated |
| `app/(dashboard)/tasks/page.tsx` | Section component updated |
| `app/(dashboard)/shopping/page.tsx` | Section component updated |
| `app/(dashboard)/notes/page.tsx` | Section component updated |
| `app/(dashboard)/calendar/page.tsx` | Section component updated |
| `app/(dashboard)/meals/page.tsx` | Section component updated |

---

## Data Model

### Prisma Schema — additions

```prisma
model EventMember {
  id        String   @id @default(cuid())
  eventId   String
  event     AppEvent @relation(fields: [eventId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())

  @@unique([eventId, userId])
}
```

Back-relations to add on existing models:
```prisma
// on AppEvent:
members  EventMember[]

// on User:
eventMemberships EventMember[]
```

`createdBy` — nullable FK added to 7 models (safe `ALTER TABLE ADD COLUMN`, existing rows remain `null` = treated as owner-created):
```prisma
// Add to: Expense, Income, Loan, Task, ShoppingItem, Note, CalendarEvent
createdBy   String?
createdByUser User?   @relation(fields: [createdBy], references: [id])
```

Each of those `User` back-relations needs a unique name to avoid conflicts (e.g., `createdExpenses`, `createdIncomes`, etc.).

### TypeScript types (lib/types.ts)

```ts
export type EventMember = {
  id: string
  eventId: string
  userId: string
  userName: string
  userEmail: string
  createdAt: string
}

// Returned by getSharedEventsByUser() — extends AppEvent with parent group info for display
export type SharedEvent = AppEvent & {
  sharedByName: string    // name of the user who owns the parent group
  groupName: string
  groupCurrency: string
  groupIcon: string
}
```

---

## Component Design

| Component | File | Type | Purpose |
|-----------|------|------|---------|
| `EventMembersPanel` | `components/settings/EventMembersPanel.tsx` | Client | Members list + add-by-email form for a single event |
| `SharedEventBanner` | `components/layout/SharedEventBanner.tsx` | Client | Context bar shown in Sections when a shared event is active |

All other changes are modifications to existing components.

### Component hierarchy (settings)

```
EventsManager (Client)
  ├── event card row (owned)
  │     └── EventMembersPanel (Client) — shown when expandedMembersId === ev.id
  └── "Shared with me" section
        └── shared event row (read-only, "Go to event" button)
```

### Component hierarchy (feature sections, e.g. Finance)

```
FinanceSection (Client)
  ├── SharedEventBanner (Client) — rendered when isSharedEvent, replaces EventFilter
  └── EventFilter (Client) — rendered when !isSharedEvent (unchanged)
```

---

## State Management

### GroupProvider — new shape

```ts
type GroupContextValue = {
  groups: Group[]
  events: AppEvent[]            // owned events — unchanged
  sharedEvents: SharedEvent[]   // NEW: events this user is a member of
  activeGroup: Group
  activeEvent: AppEvent | null  // can be owned or shared
  isSharedEvent: boolean        // NEW: true when activeEvent is in sharedEvents
  activeEventGroupId: string    // NEW: sharedEvent.groupId when isSharedEvent, else activeGroup.id
  setActiveGroup: (id: string) => void
  setActiveEvent: (id: string) => void
  clearActiveEvent: () => void
}
```

**`setActiveEvent` update:**
- Check `events` first (owned) — if found, existing behaviour (switch activeGroup to event's group)
- Then check `sharedEvents` — if found, set `activeEvent` but **do not** change `activeGroup`

**`activeEventGroupId` derived value:**
```ts
const activeEventGroupId = isSharedEvent
  ? (activeEvent as SharedEvent).groupId
  : activeGroup.id
```

**New TanStack Query in GroupProvider:**
```ts
const { data: sharedEvents = [] } = useQuery({
  queryKey: ["shared-events", userId],
  queryFn: () => getSharedEventsByUser(),
  enabled: !!userId,
})
```

### EventMembersPanel — local state

```ts
const [memberEmail, setMemberEmail] = useState("")
const [removeId, setRemoveId] = useState<string | null>(null)
```

TanStack Query: `queryKey: ["event-members", eventId]`, calls `getEventMembers(eventId)`. Mutations: `addEventMember`, `removeEventMember` — both invalidate on success.

---

## Server Actions

### New file: `lib/actions/event-members.ts`

```ts
// Owner-only: look up user by email, validate, create EventMember record
addEventMember(eventId: string, email: string)
  → { success: true; data: EventMember } | { success: false; error: string }

// Owner-only: delete EventMember record, returns success/error
removeEventMember(eventId: string, userId: string)
  → { success: boolean; error?: string }

// Owner-only: list all members with user name/email
getEventMembers(eventId: string)
  → EventMember[]
```

Error cases for `addEventMember`:
- User not found by email → `"No user found with that email"`
- User is inactive/pending → `"That user's account is not active"`
- User is already the group owner → `"That user is already the event owner"`
- Already a member → `"That user is already a member of this event"`

### Updated: `lib/actions/_auth-guard.ts`

```ts
/**
 * Allows group owner OR event member. Returns session, groupId, and ownership flag.
 * Use for event-scoped reads and writes.
 */
export async function requireEventMember(eventId: string) {
  const session = await requireSession()
  const event = await prisma.appEvent.findUnique({
    where: { id: eventId },
    select: { groupId: true },
  })
  if (!event) throw new Error("Forbidden")

  const ownsGroup = await prisma.group.findFirst({
    where: { id: event.groupId, userId: session.user.id },
    select: { id: true },
  })
  if (ownsGroup) return { session, groupId: event.groupId, isOwner: true }

  const membership = await prisma.eventMember.findFirst({
    where: { eventId, userId: session.user.id },
    select: { id: true },
  })
  if (!membership) throw new Error("Forbidden")
  return { session, groupId: event.groupId, isOwner: false }
}
```

### Updated: `lib/actions/events.ts`

**New export:**
```ts
// Returns events where the session user is an EventMember (not the group owner)
// Includes parent group info needed for SharedEvent display
getSharedEventsByUser() → SharedEvent[]
```

`getEventsByUser()` is unchanged (still returns only owned events — GroupProvider loads both separately).

### Updated: data action files (finance.ts, tasks.ts, notes.ts, shopping.ts, calendar.ts, meals.ts)

**New read actions (one per domain):**
```ts
// Example pattern — same structure for all 7 domains
getExpensesByEvent(eventId: string): Promise<Expense[]>
  → requireEventMember(eventId), query where: { eventId }
```

Covers: `getExpensesByEvent`, `getIncomesByEvent`, `getLoansByEvent`, `getBudgetsByEvent`, `getTasksByEvent`, `getShoppingByEvent`, `getNotesByEvent`, `getCalendarEventsByEvent`

**Updated create actions:**
```ts
// When data.eventId is present, use event-member guard instead of group owner guard
// groupId is derived from the event server-side (not trusted from client)
// createdBy is set from session.user.id
createExpense(data: Omit<Expense, "id" | "createdAt" | "updatedAt">)
```

Pattern:
```ts
if (data.eventId) {
  const { session, groupId } = await requireEventMember(data.eventId)
  // create with groupId (from event), createdBy: session.user.id
} else {
  await requireGroupOwner(data.groupId)
  // create with data.groupId, no createdBy needed
}
```

**Updated delete actions:**
```ts
deleteExpense(id: string)
```

Pattern:
```ts
const existing = await prisma.expense.findUnique({
  where: { id },
  select: { groupId: true, eventId: true, createdBy: true }
})
if (!existing) return { success: false }

if (existing.eventId) {
  const { session, isOwner } = await requireEventMember(existing.eventId)
  // Guests can only delete their own items
  if (!isOwner && existing.createdBy !== session.user.id) throw new Error("Forbidden")
} else {
  await requireGroupOwner(existing.groupId)
}
```

Update actions (edit) use group owner only — guests cannot edit items.

---

## EventsManager Changes

### New state
```ts
const [expandedMembersId, setExpandedMembersId] = useState<string | null>(null)
```

### Owned event card additions

Below the existing icon/title/dates row, when `expandedMembersId === ev.id`:
- Animate-in `EventMembersPanel` with member list + add-by-email form

Trigger: a `Users` (lucide) button beside the Pencil/Trash2 buttons in the action cluster. Shows member count badge when there are members (loaded from a separate query).

### "Shared with me" section

Rendered below the per-household groups, only when `sharedEvents.length > 0`:

```
── Shared with me ─────────────────
[ev icon] Event Name            [Go to event →]
          Shared by: Owner Name
          15 Jun → 28 Jun
```

"Go to event →" button calls `setActiveEvent(ev.id)` then `router.push("/finance")`.

No edit/delete buttons on shared event rows.

---

## SharedEventBanner Component

Renders in each `*Section` component when `isSharedEvent === true`, replacing the `EventFilter`.

```
┌─────────────────────────────────────────────────────┐
│ 🎉 Wedding 2026  ·  Shared by Manas  ·  [Clear ×]  │
└─────────────────────────────────────────────────────┘
```

- Background: `bg-primary/10`, text: `text-primary`, border: `border-primary/20`
- "Clear ×" calls `clearActiveEvent()`
- Shows `sharedEvent.sharedByName` when it's a different user; omits "Shared by" when the current user is the owner looking at their own event through the shared path (shouldn't happen, but guard anyway)

---

## Section Component Changes

Pattern applied identically to all 6 feature sections:

```ts
const { activeGroup, activeEvent, isSharedEvent } = useGroup()

// Dual query path
const queryKey = isSharedEvent && activeEvent
  ? ["expenses", "event", activeEvent.id]
  : ["expenses", activeGroup.id, activeEvent?.id ?? null]

const queryFn = isSharedEvent && activeEvent
  ? () => getExpensesByEvent(activeEvent.id)
  : () => getExpenses(activeGroup.id, activeEvent?.id)
```

```tsx
{isSharedEvent ? (
  <SharedEventBanner />
) : (
  groupEvents.length > 0 && <EventFilter ... />
)}
```

Create form changes:
```ts
// Use activeEventGroupId instead of activeGroup.id when isSharedEvent
const { activeGroup, activeEventGroupId, isSharedEvent } = useGroup()
const newItem = {
  ...fields,
  groupId: activeEventGroupId,   // resolves to shared event's groupId when guest
  eventId: activeEvent?.id,
}
```

Delete handler changes:
```ts
// Disable delete button for items where createdBy !== user.id when isSharedEvent && !isOwner
// The server enforces this too; client disabling prevents confusing "Forbidden" errors
const canDelete = !isSharedEvent || isOwner || item.createdBy === user?.id
```

Types need `createdBy?: string` added to client-facing type to support this UI check.

---

## Key UI Decisions

- **Shared events activation:** Only from Settings > Events > "Shared with me" section. The EventFilter in Sections does not list shared events — the banner replaces it when one is active.
- **No edit for guest items:** Guests can create and delete (own items only). No inline edit for event-scoped items when `isSharedEvent && !isOwner`. Edit buttons hidden/disabled client-side; server also rejects via `requireGroupOwner`.
- **Members panel on owned events:** Collapsed by default. Opens inline within EventsManager card. Not in a modal — keeps the settings page flat and scannable.
- **Empty state for shared events:** If no items in the event yet, show the same empty state as normal but with "Be the first to add something to this event."
- **Loading:** Shared event queries use the same Suspense/pending pattern as existing queries.

---

## Animations

- `EventMembersPanel` — Framer Motion `height: 0 → auto`, `opacity: 0 → 1`, `duration: 0.2`, same pattern as the existing event create form
- Member rows — `AnimatePresence` with `initial={{ opacity: 0, y: -4 }}` entrance
- `SharedEventBanner` — `AnimatePresence` with `opacity: 0 → 1`, `y: -8 → 0`, so it slides in when event activates

---

## Acceptance Criteria Mapping

| Criterion | Implemented by |
|-----------|---------------|
| Owner can add member by email | `addEventMember` action + `EventMembersPanel` |
| Member appears immediately | TanStack Query invalidation in `EventMembersPanel` |
| Owner can remove member | `removeEventMember` action + remove button in panel |
| Shared event appears for guest | `getSharedEventsByUser` + GroupProvider `sharedEvents` + EventsManager "Shared with me" |
| Guest creates items in shared event | Updated create actions (event-member guard) + Section form using `activeEventGroupId` |
| All members see all items | `getExpensesByEvent` etc. — returns all items for that eventId |
| Guest cannot delete the event | `deleteEvent` still uses `requireGroupOwner` — unchanged |
| Guest can only delete own items | Delete actions check `isOwner || createdBy === session.user.id` |

---

## Files to Create

- `prisma/migrations/<timestamp>_event_sharing/migration.sql` (generated)
- `lib/actions/event-members.ts`
- `components/settings/EventMembersPanel.tsx`
- `components/layout/SharedEventBanner.tsx`

## Files to Modify

- `prisma/schema.prisma` — add `EventMember`, back-relations, `createdBy` fields
- `lib/types.ts` — add `EventMember`, `SharedEvent`; add `createdBy?: string` to 7 types
- `lib/actions/_auth-guard.ts` — add `requireEventMember`
- `lib/actions/events.ts` — add `getSharedEventsByUser`
- `lib/actions/finance.ts` — add `getExpensesByEvent`, `getIncomesByEvent`, `getLoansByEvent`, `getBudgetsByEvent`; update create/delete for all four
- `lib/actions/tasks.ts` — add `getTasksByEvent`; update create/delete
- `lib/actions/shopping.ts` — add `getShoppingByEvent`; update create/delete
- `lib/actions/notes.ts` — add `getNotesByEvent`; update create/delete
- `lib/actions/calendar.ts` — add `getCalendarEventsByEvent`; update create/delete
- `lib/actions/meals.ts` — add `getMealsByEvent`; update create/delete
- `components/providers/GroupProvider.tsx` — add `sharedEvents`, `isSharedEvent`, `activeEventGroupId`
- `components/settings/EventsManager.tsx` — add Members expand + shared events section
- `components/finance/ExpensesSection.tsx` (and all other Section files) — dual query path + SharedEventBanner
- `components/settings/CLAUDE.md` — document EventMember model and shared event UX
