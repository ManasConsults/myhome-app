# Settings — Groups, Events, Profile

## Groups

Groups are **households** — permanent locations a user manages. Every data type carries `groupId: string`.

**`Group` type:**
```ts
type Group = {
  id: string
  name: string
  type: "household"                    // always
  currency: string                     // ISO 4217 e.g. "AUD", "USD", "INR"
  description?: string
  location?: string
  color: "primary" | "success" | "destructive" | "warning"
  icon: string
  isDefault?: boolean
  userId: string
}
```

**Canonical dummy groups:**
| id | name | location | color |
|----|------|----------|-------|
| g1 | My Home | Brisbane | primary |
| g2 | Mum's House | Sydney | success |

**Sort options (GroupsManager):** Name / Location

**Edit/delete pattern (`GroupsManager`):**
- `editingId: string | null` — `null` = create, set = edit (form pre-filled)
- `deleteId: string | null` — inline "Delete? Yes / No" per row; confirmed calls `handleDelete(id)`
- Edit button (Pencil) on all groups; delete button (Trash2) only on non-default groups
- `openEdit(g)` pre-fills the form and scrolls to it
- `handleSave` upserts: updates existing if `editingId` set, otherwise creates new
- Default group (`isDefault: true`) can be edited but not deleted

---

## Events

Events are **time-bound activities** (trips, weddings, renovations) belonging to a parent group. Event-scoped data is tracked separately from the household's regular data.

**`AppEvent` type:**
```ts
type AppEvent = {
  id: string
  groupId: string
  name: string
  description?: string
  icon: string
  color: "primary" | "success" | "destructive" | "warning"
  startDate: string                    // YYYY-MM-DD
  endDate?: string                     // YYYY-MM-DD
}
```

**Canonical dummy events:**
| id | groupId | name | color |
|----|---------|------|-------|
| ev1 | g1 | Wedding 2026 | destructive |
| ev2 | g1 | Europe Trip | warning |

**Sort options (EventsManager):** Start date / Name — within each household

**Edit/delete pattern (`EventsManager`):**
- `editingId: string | null` — `null` = create, set = edit
- `deleteId: string | null` — inline "Delete? Yes / No" per row
- `openEdit(ev)` pre-fills all fields (name, groupId, startDate, endDate, icon, color) and scrolls to form
- `handleSave` upserts: updates existing if `editingId` set, otherwise creates new
- Events displayed grouped by household; each row has Pencil + Trash2 action buttons

**Data items with `eventId`:**
All data types (`Budget`, `Expense`, `Income`, `Task`, `ShoppingItem`, `Note`, `CalendarEvent`, `DayMeals`) carry optional `eventId?: string`. `groupId` is always set even when `eventId` is present.

**Color system (`COLOR_MAP` in `ScopeSwitcher`/`GroupSwitcher`):**
| color value | bg | text | dot |
|---|---|---|---|
| `"primary"` | `bg-primary/10` | `text-primary` | `bg-primary` |
| `"success"` | `bg-success/10` | `text-success` | `bg-success` |
| `"destructive"` | `bg-destructive/10` | `text-destructive` | `bg-destructive` |
| `"warning"` | `bg-warning/10` | `text-warning` | `bg-warning` |

**`GroupSwitcher`** lives in `components/layout/GroupSwitcher.tsx` (may be named `ScopeSwitcher.tsx`). Shows **only groups (households)** — events are never listed here. Shows active group icon + name + location. Click-outside via `useRef` + `document.addEventListener("mousedown", ...)` in `useEffect`.

**Rules:**
- Every new data item assigned `groupId: activeEventGroupId` (from `useGroup()`) — resolves to shared event's group when a shared event is active
- Event-scoped items also get `eventId: activeEvent.id`
- Never hard-code group or event IDs — always read from `useGroup()`
- When `isSharedEvent`, hide the event selector field in forms (event is implicitly set)

---

## Event Members

Events can be shared with other registered users. The owner adds members by email in Settings > Events.

**`EventMember` type:**
```ts
type EventMember = {
  id: string
  eventId: string
  userId: string
  userName: string
  userEmail: string
  createdAt: string
}
```

**`SharedEvent` type** (extends `AppEvent`):
```ts
type SharedEvent = AppEvent & {
  sharedByName: string    // owner's name
  groupName: string
  groupCurrency: string
  groupIcon: string
}
```

**EventsManager — Members panel:**
- `expandedMembersId: string | null` state — null = collapsed, set = shows `EventMembersPanel` below that event's card content
- `EventMembersPanel` (`components/settings/EventMembersPanel.tsx`) renders add-by-email form + member list with remove buttons
- Members panel only shown to the group owner (add/remove via `addEventMember` / `removeEventMember` server actions)

**EventsManager — "Shared with me" section:**
- Rendered below owned events when `sharedEvents.length > 0`
- Each row shows: icon + name + date + group info + sharedByName + "Go to event →" button
- "Go to event →" calls `setActiveEvent(ev.id)` then `router.push("/finance")`
- No edit/delete on shared event rows

**Auth rules:**
- `requireEventMember(eventId)` in `lib/actions/_auth-guard.ts` — allows group owner OR event member; returns `{ session, groupId, isOwner }`
- Event member can create any data type in a shared event (server derives `groupId` from event)
- Event member can only delete items they created (`createdBy === session.user.id`); group owner can delete any
- `createdBy` field (nullable `String?`) added to: Expense, Income, Loan, Task, ShoppingItem, Note, CalendarEvent

**GroupProvider — shared event state:**
```ts
sharedEvents: SharedEvent[]     // events this user is a member of (not owner)
isSharedEvent: boolean          // true when activeEvent is in sharedEvents
activeEventGroupId: string      // sharedEvent.groupId when isSharedEvent, else activeGroup.id
```
- `setActiveEvent(id)` checks owned events first, then shared events; shared events don't change `activeGroup`

**Section component pattern when `isSharedEvent`:**
- Query uses `getXByEvent(activeEvent.id)` instead of `getX(activeGroup.id, activeEvent?.id)`
- `SharedEventBanner` (`components/layout/SharedEventBanner.tsx`) replaces `EventFilter`
- Event selector field hidden in forms
- Delete buttons hidden client-side when `item.createdBy !== user?.id`

---

## Profile Page

Lives at `app/(dashboard)/settings/profile/page.tsx`.

**Fields:** name (text), email (email), currency (select from `CURRENCIES`), timezone (select from `TIMEZONES`).

**Behaviour:**
- Live avatar preview updates as user types name
- Save button shows "Changes saved" for 2s then resets
- Saving updates the cookie via `setUser()` from `useAuth()`

**Rules:**
- `"use client"` — no metadata export
- Initializes state from `useAuth().user`
- `getInitials(name)` defined locally: first letter of each word, max 2, uppercased
